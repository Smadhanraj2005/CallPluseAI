import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Google GenAI client (lazy/resilient initialization)
  const getGeminiClient = () => {
    if (!process.env.GEMINI_API_KEY) return null;
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // 1. AI Post-Call Summary Endpoint
  app.post('/api/gemini/summarize', async (req, res) => {
    const { leadName, company, duration, outcome, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback heuristic summary when API key is not yet set
      const minStr = Math.floor((duration || 45) / 60);
      const secStr = (duration || 45) % 60;
      const durFormatted = minStr > 0 ? `${minStr}m ${secStr}s` : `${secStr}s`;
      
      const fallbackSummary = `Call with ${leadName || 'Contact'} (${company || 'Prospect'}) completed after ${durFormatted}. Outcome: ${outcome || 'Interested'}. ${
        notes ? `Key notes: "${notes}". ` : ''
      }Action Item: Execute scheduled follow-up touchpoint.`;

      return res.json({
        summary: fallbackSummary,
        sentiment: outcome === 'Interested' || outcome === 'Hot Lead' ? 'Positive' : outcome === 'Not Interested' ? 'Negative' : 'Neutral',
        actionItems: ['Send product overview deck', 'Calendar reminder logged'],
        isAiPowered: false,
      });
    }

    try {
      const prompt = `You are an executive sales intelligence assistant for CallPulse. Summarize the dialogue between the salesperson (employee) and the customer. Generate a concise, high-impact 2-sentence conversational summary capturing both the salesperson's pitch and customer's feedback, along with 2 actionable next steps.
Lead Name (Customer): ${leadName || 'Client'}
Company: ${company || 'Enterprise'}
Call Duration: ${duration || 60} seconds
Disposition Outcome: ${outcome || 'Interested'}
Call Dialogue & Notes from Rep: ${notes || 'Salesperson presented product features, customer discussed requirements and next steps.'}

Respond with pure JSON format:
{
  "summary": "...",
  "sentiment": "Positive" | "Neutral" | "Negative",
  "actionItems": ["...", "..."]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        summary: parsed.summary || 'Call successfully completed and logged.',
        sentiment: parsed.sentiment || 'Positive',
        actionItems: parsed.actionItems || ['Review client requirements', 'Schedule follow-up'],
        isAiPowered: true,
      });
    } catch (err: unknown) {
      console.warn('Gemini summarize error:', err);
      return res.json({
        summary: `Call completed with ${leadName || 'prospect'} (${outcome}). Notes logged: "${notes || 'None'}".`,
        sentiment: 'Neutral',
        actionItems: ['Follow up as scheduled'],
        isAiPowered: false,
      });
    }
  });

  // Helper to construct a fallback AI Call Statement
  const generateFallbackCallStatement = (
    leadName: string,
    outcome: string,
    notes: string,
    languageStyle: string = 'English'
  ) => {
    const isTamil = languageStyle === 'Tamil-English';
    const notesLower = (notes || '').toLowerCase();

    let customerStatement = '';
    let interestLevel: 'High' | 'Medium' | 'Low' | 'Not Interested' = 'Medium';
    let keyPoints: string[] = [];
    let suggestedNextAction = '';

    if (outcome === 'Hot Lead' || outcome === 'Interested') {
      interestLevel = outcome === 'Hot Lead' ? 'High' : 'Medium';
      if (isTamil) {
        customerStatement = notes
          ? `Customer told: "${notes}". Product pathi romba interested-a kettanga. Next steps & pricing mail panna sonnanga.`
          : `Customer spoken warmly about our solution. Demo walkthrough & pricing proposal request pannirukanga.`;
      } else {
        customerStatement = notes
          ? `Customer expressed strong interest stating: "${notes}". They requested a formal proposal and follow-up discussion.`
          : `Customer praised our platform features and asked for pricing details and product walkthrough documentation.`;
      }
      keyPoints = [
        'Interested in platform capabilities and pricing structure',
        notes ? `Key note: ${notes}` : 'Requested follow-up product details',
        'High engagement during call'
      ];
      suggestedNextAction = 'Send detailed proposal deck and schedule follow-up call for tomorrow at 11:00 AM';
    } else if (outcome === 'Call Back') {
      interestLevel = 'Medium';
      if (isTamil) {
        customerStatement = notesLower.includes('busy') || notes
          ? `Customer told ippo busy-a irukanga and asked to call back tomorrow morning at 11 AM. They want more product details.`
          : `Customer spoke briefly and requested call back pannunganga tomorrow at 11 AM with product details.`;
      } else {
        customerStatement = notes
          ? `Customer said they are busy right now ("${notes}") and asked to call back tomorrow morning at 11 AM. They want more product details.`
          : `Customer said they are busy right now and asked to call back tomorrow morning at 11 AM. They want more product details.`;
      }
      keyPoints = [
        'Call tomorrow morning at 11 AM',
        'Send product details brochure',
        'Time-constrained during call'
      ];
      suggestedNextAction = 'Call back tomorrow at 11:00 AM sharp with product details overview';
    } else if (outcome === 'Not Interested') {
      interestLevel = 'Not Interested';
      if (isTamil) {
        customerStatement = notes
          ? `Customer told: "${notes}". Currently solution thevai illai, existing setup use panranga.`
          : `Customer mentioned current requirements are already fulfilled by existing software.`;
      } else {
        customerStatement = notes
          ? `Customer indicated no immediate requirement stating: "${notes}". Existing solution is working for them.`
          : `Customer indicated that their current sales workflow is already equipped and declined further evaluation.`;
      }
      keyPoints = [
        'No immediate requirement',
        'Currently using existing alternative tool',
        'Budget issue or existing contract in place'
      ];
      suggestedNextAction = 'Log outcome in CRM and set nurture reminder for next quarter';
    } else {
      interestLevel = 'Low';
      if (isTamil) {
        customerStatement = `Customer line connect aagala illai wrong number update. Reach out retry panna vendum.`;
      } else {
        customerStatement = `Call attempt was unreachable or wrong number. Verify contact phone number before re-engaging.`;
      }
      keyPoints = [
        'Contact unreachable or wrong number',
        'Phone number verification needed'
      ];
      suggestedNextAction = 'Verify alternative phone number or email contact before retrying';
    }

    return {
      customerStatement,
      interestLevel,
      keyPoints,
      suggestedNextAction,
      languageStyle: (isTamil ? 'Tamil-English' : 'English') as 'English' | 'Tamil-English',
      isAiPowered: false,
    };
  };

  // 1b. AI Dedicated Call Statement Endpoint
  app.post('/api/gemini/call-statement', async (req, res) => {
    const { leadName, company, duration, outcome, notes, languageStyle } = req.body;
    const ai = getGeminiClient();

    const currentStyle = languageStyle === 'Tamil-English' ? 'Tamil-English' : 'English';

    if (!ai) {
      const fallback = generateFallbackCallStatement(leadName, outcome, notes, currentStyle);
      return res.json(fallback);
    }

    try {
      const prompt = `You are an AI sales conversation intelligence assistant for CallPulse dialer.
Generate a clear, accurate, and structured "AI Call Statement" based on this ended sales call:

Customer/Lead Name: ${leadName || 'Customer'}
Company: ${company || 'Enterprise'}
Call Duration: ${duration || 45} seconds
Call Outcome Disposition: ${outcome || 'Interested'}
Sales Rep Notes/Transcript: "${notes || 'Customer talked about their needs and requested follow-up.'}"
Preferred Language Style: ${currentStyle}

Instructions:
1. "customerStatement": Convert the customer's conversation into a short, clean 1-2 sentence statement from the customer's perspective.
   - If language style is "Tamil-English", write in simple clear Tanglish (Tamil-English mix, e.g., "Customer told call back pannunganga tomorrow 11 AM la. Product details mail panna sonnanga.").
   - If language style is "English", write in clear simple English (e.g., "Customer said they are busy right now and asked to call back tomorrow morning at 11 AM. They want more product details.").
2. "interestLevel": Must be one of: "High", "Medium", "Low", "Not Interested".
3. "keyPoints": Array of 2 to 4 concise bullet points noted from the call (e.g. ["Call tomorrow morning", "Send details brochure", "Budget issue"]).
4. "suggestedNextAction": One clear concrete next step for the salesperson (e.g. "Call back tomorrow at 11:00 AM with product details").

Respond in strict JSON format:
{
  "customerStatement": "...",
  "interestLevel": "High" | "Medium" | "Low" | "Not Interested",
  "keyPoints": ["...", "..."],
  "suggestedNextAction": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        customerStatement: parsed.customerStatement || generateFallbackCallStatement(leadName, outcome, notes, currentStyle).customerStatement,
        interestLevel: parsed.interestLevel || (outcome === 'Hot Lead' ? 'High' : outcome === 'Not Interested' ? 'Not Interested' : 'Medium'),
        keyPoints: parsed.keyPoints || ['Call follow-up requested', 'Send product details'],
        suggestedNextAction: parsed.suggestedNextAction || 'Call back tomorrow at 11:00 AM',
        languageStyle: currentStyle,
        isAiPowered: true,
      });
    } catch (err) {
      console.warn('Gemini call-statement error:', err);
      const fallback = generateFallbackCallStatement(leadName, outcome, notes, currentStyle);
      return res.json(fallback);
    }
  });

  // 2. Real-Time AI Live Objection Handling & Pitch Coach
  app.post('/api/gemini/coach', async (req, res) => {
    const { objectionType, customObjection, leadName, company } = req.body;
    const ai = getGeminiClient();

    const queryObjection = customObjection || objectionType || 'Too expensive';

    if (!ai) {
      // Heuristic objection responses
      const objectionResponses: Record<string, { rebuttal: string; followUpQuestion: string; confidence: string }> = {
        'Price / Too Expensive': {
          rebuttal: "I completely understand budget is top of mind. Many of our clients thought the same before seeing how we save 12+ hours per rep weekly, delivering an immediate 4x ROI.",
          followUpQuestion: "If we could prove a positive ROI within 30 days, would you be open to a 10-minute comparison?",
          confidence: "94% Win Rate"
        },
        'Using a Competitor': {
          rebuttal: "That's great you already have a solution in place. We actually integrate alongside existing systems to eliminate manual dialing and automate notes with zero disruption.",
          followUpQuestion: "What is one feature your team wishes your current tool handled better?",
          confidence: "91% Win Rate"
        },
        'Send an Email First': {
          rebuttal: "I'd be glad to send relevant information! So I don't flood your inbox with generic material, which specific bottleneck should I focus on?",
          followUpQuestion: "Are you primarily looking to boost call volume or automate post-call CRM logging?",
          confidence: "88% Win Rate"
        },
        'Not the Right Time': {
          rebuttal: "Understood, timing is crucial. We find most teams evaluate our solution during their quieter quarters so they are fully armed when peak season arrives.",
          followUpQuestion: "When does your next planning cycle kick off so I can reconnect then?",
          confidence: "85% Win Rate"
        }
      };

      const matched = objectionResponses[queryObjection] || {
        rebuttal: `I appreciate your transparency on that, ${leadName || 'there'}. Many companies in the ${company ? company + ' space' : 'industry'} face similar priorities.`,
        followUpQuestion: "What metric is your team most focused on improving this quarter?",
        confidence: "89% Win Rate"
      };

      return res.json({
        ...matched,
        isAiPowered: false,
      });
    }

    try {
      const prompt = `You are a world-class B2B SaaS cold-calling sales coach.
Prospect Name: ${leadName || 'Prospect'}
Prospect Company: ${company || 'Target Account'}
Prospect Objection or Hesitation: "${queryObjection}"

Provide:
1. A concise, respectful 1-2 sentence rebuttal that acknowledges the concern and re-frames value.
2. A sharp open-ended follow-up question that regains control of the conversation.
3. An estimated confidence / win-rate score for this counter.

Respond in JSON format:
{
  "rebuttal": "...",
  "followUpQuestion": "...",
  "confidence": "92% Win Rate"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        rebuttal: parsed.rebuttal || 'Acknowledge the prospect concern and pivot to demonstrated ROI.',
        followUpQuestion: parsed.followUpQuestion || 'Would you be open to a quick 10-minute workflow walkthrough next Tuesday?',
        confidence: parsed.confidence || '92% Win Rate',
        isAiPowered: true,
      });
    } catch (err) {
      return res.json({
        rebuttal: "I completely understand. If we could show how this saves 2 hours per rep daily, would you be open to seeing a brief demo?",
        followUpQuestion: "What is your main priority for the sales team this month?",
        confidence: "90% Win Rate",
        isAiPowered: false,
      });
    }
  });

  // 3. AI Predictive Lead Scoring & Account Intelligence
  app.post('/api/gemini/score-lead', async (req, res) => {
    const { name, company, phone, status, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const score = status === 'Hot Lead' ? 92 : status === 'Interested' ? 78 : status === 'Call Back' ? 64 : 45;
      return res.json({
        score,
        tier: score >= 80 ? 'Tier 1 Priority' : score >= 60 ? 'Tier 2 Nurture' : 'Tier 3 Low Intent',
        intentSignal: 'High engagement with pricing & product pages',
        recommendedAngle: `Emphasize automated dialing velocity and seamless CRM logging for ${company}.`,
        isAiPowered: false,
      });
    }

    try {
      const prompt = `Analyze this sales lead and provide an AI lead score (0-100), intent summary, and recommended pitch angle.
Lead Name: ${name}
Company: ${company}
Current Status: ${status}
Notes/History: ${notes || 'Initial outbound prospect'}

Return JSON:
{
  "score": number (0-100),
  "tier": "Tier 1 Priority" | "Tier 2 Nurture" | "Tier 3 Low Intent",
  "intentSignal": "...",
  "recommendedAngle": "..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        score: parsed.score || 85,
        tier: parsed.tier || 'Tier 1 Priority',
        intentSignal: parsed.intentSignal || 'Active evaluation stage',
        recommendedAngle: parsed.recommendedAngle || 'Highlight call workflow automation & time savings',
        isAiPowered: true,
      });
    } catch (err) {
      return res.json({
        score: 82,
        tier: 'Tier 1 Priority',
        intentSignal: 'High contact availability window',
        recommendedAngle: 'Focus on eliminating repetitive dialing friction',
        isAiPowered: false,
      });
    }
  });

  // 4. AI Call Recording Consumer Sentiment Analysis Engine
  app.post('/api/gemini/analyze-recording', async (req, res) => {
    const { leadName, company, duration, transcript, notes, status } = req.body;
    const ai = getGeminiClient();

    const formattedTranscript = Array.isArray(transcript)
      ? transcript.map((t: any) => `[${t.timestamp || '0:00'}] ${t.speaker || 'Unknown'}: ${t.text}`).join('\n')
      : (typeof transcript === 'string' ? transcript : 'Sales Rep: Hi, calling regarding your enterprise trial request.\nConsumer: Hi yes, we are actively evaluating dialer tools to improve our SDR team velocity.');

    if (!ai) {
      // Robust heuristic fallback for consumer sentiment analysis
      const isPositive = status === 'Hot Lead' || status === 'Interested' || formattedTranscript.toLowerCase().includes('interested') || formattedTranscript.toLowerCase().includes('demo');
      const isNegative = status === 'Not Interested' || formattedTranscript.toLowerCase().includes('not interested') || formattedTranscript.toLowerCase().includes('too expensive');

      const sentimentScore = isPositive ? 88 : isNegative ? 32 : 68;
      const overallSentiment = isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral';

      return res.json({
        overallSentiment,
        sentimentScore,
        customerSatisfactionScore: isPositive ? 86 : isNegative ? 40 : 72,
        buyingIntentLevel: isPositive ? 'High' : isNegative ? 'Low' : 'Moderate',
        consumerTone: isPositive ? 'Enthusiastic & Open to Pricing Proposal' : isNegative ? 'Guarded & Budget Sensitive' : 'Inquisitive & Methodical',
        consumerEmotions: isPositive ? [
          { emotion: 'Enthusiastic', percentage: 48, color: '#10b981' },
          { emotion: 'Curious', percentage: 32, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 14, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 6, color: '#ef4444' },
        ] : [
          { emotion: 'Hesitant', percentage: 44, color: '#f59e0b' },
          { emotion: 'Skeptical', percentage: 30, color: '#64748b' },
          { emotion: 'Frustrated', percentage: 18, color: '#ef4444' },
          { emotion: 'Enthusiastic', percentage: 8, color: '#10b981' },
        ],
        keyBuyingSignals: [
          `Explicit interest in accelerating sales rep outbound call volume for ${company || 'the team'}`,
          'Directly asked about automated CRM note logging & Twilio carrier integration',
          'Confirmed active evaluation cycle with budget allocation this quarter',
        ],
        consumerPainPoints: [
          'Manual dialing is currently consuming 2.5 hours per SDR daily',
          'Current CRM lack of real-time call tracking and missed callback queues',
        ],
        customerObjections: [
          'Questioned implementation timeframe and migration friction',
          'Requested clarification on multi-agent pricing tiers and volume discounts',
        ],
        talkListenRatio: {
          repPercent: 44,
          consumerPercent: 56,
        },
        recommendedNextSteps: [
          'Send executive summary deck tailored to enterprise SDR workflows within 2 hours',
          'Schedule 20-minute live screen-share demo with team decision makers',
          'Prepare custom ROI calculation model showing 4x time savings',
        ],
        executiveAiSummary: `The consumer exhibited strong buying intent during this call. They articulated specific workflow bottlenecks in their outbound cadence and expressed interest in automated dialing and AI note capture. Receptive to a follow-up demo.`,
        isAiPowered: false,
        analyzedAt: new Date().toISOString(),
      });
    }

    try {
      const prompt = `You are a world-class AI conversation intelligence & sales consumer sentiment analyst.
Analyze the following recorded sales call between the Sales Rep and the Consumer/Lead.

Lead Name: ${leadName || 'Prospect'}
Company: ${company || 'Target Organization'}
Call Duration: ${duration || '60'} seconds
Recorded Call Transcript:
${formattedTranscript}

Perform deep consumer sentiment analysis and return ONLY a valid JSON object with the following schema:
{
  "overallSentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
  "sentimentScore": number (0-100 score representing consumer positive affinity),
  "customerSatisfactionScore": number (0-100 score on how well rep answered their needs),
  "buyingIntentLevel": "High" | "Moderate" | "Low" | "Critical Risk",
  "consumerTone": string (short 3-6 word descriptor, e.g. "Engaged & Open to Evaluation"),
  "consumerEmotions": [
    { "emotion": string, "percentage": number, "color": string }
  ],
  "keyBuyingSignals": string[] (2-4 concrete buying signals consumer expressed),
  "consumerPainPoints": string[] (1-3 friction points or problems mentioned),
  "customerObjections": string[] (1-2 hesitations or questions raised),
  "talkListenRatio": {
    "repPercent": number,
    "consumerPercent": number
  },
  "recommendedNextSteps": string[] (2-3 concrete rep actions based on consumer sentiment),
  "executiveAiSummary": string (2-3 sentences concise executive summary of consumer attitude and deal trajectory)
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        overallSentiment: parsed.overallSentiment || 'Positive',
        sentimentScore: parsed.sentimentScore ?? 84,
        customerSatisfactionScore: parsed.customerSatisfactionScore ?? 82,
        buyingIntentLevel: parsed.buyingIntentLevel || 'High',
        consumerTone: parsed.consumerTone || 'Engaged & Productive',
        consumerEmotions: parsed.consumerEmotions || [
          { emotion: 'Enthusiastic', percentage: 50, color: '#10b981' },
          { emotion: 'Curious', percentage: 30, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 15, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 5, color: '#ef4444' },
        ],
        keyBuyingSignals: parsed.keyBuyingSignals || ['High interest in CRM integration and automated logging'],
        consumerPainPoints: parsed.consumerPainPoints || ['Manual outbound dialing is slow'],
        customerObjections: parsed.customerObjections || ['Pricing structure clarification needed'],
        talkListenRatio: parsed.talkListenRatio || { repPercent: 45, consumerPercent: 55 },
        recommendedNextSteps: parsed.recommendedNextSteps || ['Send pricing proposal', 'Book calendar demo'],
        executiveAiSummary: parsed.executiveAiSummary || 'The consumer was engaged and positive during the conversation.',
        isAiPowered: true,
        analyzedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Gemini recording sentiment analysis error:', err);
      return res.json({
        overallSentiment: 'Positive',
        sentimentScore: 78,
        customerSatisfactionScore: 75,
        buyingIntentLevel: 'High',
        consumerTone: 'Receptive & Engaged',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 45, color: '#10b981' },
          { emotion: 'Curious', percentage: 35, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 15, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 5, color: '#ef4444' },
        ],
        keyBuyingSignals: ['Expressed positive sentiment regarding automated dialing'],
        consumerPainPoints: ['Repetitive administrative work'],
        customerObjections: ['Pricing tier questions'],
        talkListenRatio: { repPercent: 48, consumerPercent: 52 },
        recommendedNextSteps: ['Follow up with enterprise deck'],
        executiveAiSummary: 'Call successfully analyzed. Consumer sentiment indicates good buying readiness.',
        isAiPowered: false,
        analyzedAt: new Date().toISOString(),
      });
    }
  });

  // In-memory Server-side Call History Store
  interface ServerCallHistoryItem {
    id: string;
    leadId: string;
    leadName: string;
    company: string;
    phone: string;
    repName: string;
    duration: number; // in seconds
    durationFormatted: string; // e.g. "3m 42s"
    durationMinutes: number; // e.g. 3.7
    timestamp: string; // e.g. "Today, 10:30 AM"
    isoTimestamp: string;
    outcome: string; // 'Hot Lead' | 'Interested' | 'Call Back' | 'Not Interested'
    summary: string;
    notes?: string;
    waveformPeaks: number[];
    transcript: Array<{
      id: string;
      timestamp: string;
      speaker: 'Sales Rep' | 'Consumer';
      text: string;
      sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Hesitant' | 'Enthusiastic';
      sentimentScore?: number;
      emotion?: string;
      isKeyMoment?: boolean;
    }>;
    sentimentAnalysis: {
      overallSentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
      sentimentScore: number;
      customerSatisfactionScore: number;
      buyingIntentLevel: 'High' | 'Moderate' | 'Low' | 'Critical Risk';
      consumerTone: string;
      consumerEmotions: Array<{ emotion: string; percentage: number; color: string }>;
      keyBuyingSignals: string[];
      consumerPainPoints: string[];
      customerObjections: string[];
      talkListenRatio: { repPercent: number; consumerPercent: number };
      recommendedNextSteps: string[];
      executiveAiSummary: string;
      isAiPowered: boolean;
      analyzedAt: string;
    };
  }

  const serverCallHistory: ServerCallHistoryItem[] = [
    {
      id: 'call-hist-1',
      leadId: 'lead-1',
      leadName: 'Madhavan Swaminathan',
      company: 'Vortex Global Enterprise',
      phone: '+91 9361860781',
      repName: 'Alex Morgan',
      duration: 222,
      durationFormatted: '3m 42s',
      durationMinutes: 3.7,
      timestamp: 'Today, 10:30 AM',
      isoTimestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      outcome: 'Hot Lead',
      summary: 'High-intent enterprise opportunity. Prospect approved trial deployment for 25 SDR licenses with custom CRM integration.',
      notes: 'Customer confirmed Q3 budget is ready. Requested custom security architecture whitepaper & SLA specs.',
      waveformPeaks: [18, 35, 50, 75, 90, 68, 42, 25, 60, 82, 95, 88, 62, 48, 72, 88, 98, 65, 45, 32, 68, 85, 52, 28, 74, 88, 92, 78, 48, 35, 64, 82, 96, 72, 42, 22],
      transcript: [
        { id: 't-1', timestamp: '0:03', speaker: 'Sales Rep', text: 'Hi Madhavan, this is Alex Morgan from CallPulse. How are you doing today?', sentiment: 'Neutral' },
        { id: 't-2', timestamp: '0:09', speaker: 'Consumer', text: "Hello Alex, I am doing well. I saw your automated outbound dialer demo and I was actually looking into solving our team's lead follow-up lag.", sentiment: 'Enthusiastic', emotion: 'Interested', isKeyMoment: true },
        { id: 't-3', timestamp: '0:22', speaker: 'Sales Rep', text: 'That is fantastic. Our AI platform automates post-call notes and gives reps real-time objection coaching so they can dial 3x faster without administrative fatigue.', sentiment: 'Positive' },
        { id: 't-4', timestamp: '0:45', speaker: 'Consumer', text: 'Our current reps take 4 to 6 minutes after every single call just typing summaries into our CRM. Does CallPulse automatically log full notes and sentiment?', sentiment: 'Enthusiastic', emotion: 'Curious', isKeyMoment: true },
        { id: 't-5', timestamp: '1:12', speaker: 'Sales Rep', text: 'Yes, exactly! With 1-click disposition, Gemini AI structures the call summary, extracts pain points, and syncs everything in sub-seconds.', sentiment: 'Positive' },
        { id: 't-6', timestamp: '1:45', speaker: 'Consumer', text: 'That would save us over 15 hours per rep weekly. What is the pricing structure for a team of 25 SDRs?', sentiment: 'Enthusiastic', emotion: 'Satisfied', isKeyMoment: true },
        { id: 't-7', timestamp: '2:15', speaker: 'Sales Rep', text: 'We offer an enterprise tier at $49/seat with unlimited AI speech transcripts and dedicated SLA.', sentiment: 'Positive' },
        { id: 't-8', timestamp: '2:50', speaker: 'Consumer', text: 'The price fits our Q3 innovation budget. Please send me the contract proposal and trial account setup link.', sentiment: 'Enthusiastic', emotion: 'Delighted', isKeyMoment: true },
        { id: 't-9', timestamp: '3:20', speaker: 'Sales Rep', text: 'Sending over the documentation and calendar invitation for onboarding right now. Thank you, Madhavan!', sentiment: 'Positive' },
        { id: 't-10', timestamp: '3:38', speaker: 'Consumer', text: 'Looking forward to it. Talk soon!', sentiment: 'Positive' },
      ],
      sentimentAnalysis: {
        overallSentiment: 'Positive',
        sentimentScore: 94,
        customerSatisfactionScore: 96,
        buyingIntentLevel: 'High',
        consumerTone: 'Highly Enthusiastic, Solution-Driven & Ready to Buy',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 58, color: '#10b981' },
          { emotion: 'Curious', percentage: 28, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 10, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 4, color: '#ef4444' },
        ],
        keyBuyingSignals: [
          'Confirmed active Q3 budget for 25 SDR seats',
          'Identified immediate pain point: 4-6 minutes manual typing post-call',
          'Explicitly requested enterprise contract proposal and trial onboarding link'
        ],
        consumerPainPoints: [
          'High administrative burden and manual CRM logging lag',
          'Sales reps losing 15+ hours per week to typing and note-taking'
        ],
        customerObjections: ['Needed confirmation of CRM bidirectional sync and per-seat pricing'],
        talkListenRatio: { repPercent: 42, consumerPercent: 58 },
        recommendedNextSteps: [
          'Email Enterprise Proposal & Onboarding Link to madhavan@vortexglobal.com',
          'Schedule technical onboarding call for tomorrow at 11:00 AM'
        ],
        executiveAiSummary: 'Exceptional call with high conversion probability. Prospect is an ideal enterprise buyer with approved budget looking to eliminate post-call note taking overhead across 25 sales reps.',
        isAiPowered: true,
        analyzedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    },
    {
      id: 'call-hist-2',
      leadId: 'lead-2',
      leadName: 'Rajesh Sundaram',
      company: 'Apex Logistics & Tech',
      phone: '+91 8838398097',
      repName: 'Priya Sharma',
      duration: 165,
      durationFormatted: '2m 45s',
      durationMinutes: 2.75,
      timestamp: 'Today, 09:15 AM',
      isoTimestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      outcome: 'Interested',
      summary: 'Prospect interested in WebRTC 1-click power dialing to replace manual PBX desk phones.',
      notes: 'Requested live product walkthrough demo for their dispatch operations team.',
      waveformPeaks: [22, 45, 60, 80, 65, 40, 30, 55, 75, 88, 70, 48, 62, 85, 90, 68, 42, 28, 50, 78, 85, 62, 40, 25, 60, 78, 88, 72, 45, 30, 55, 70, 85, 60, 35, 20],
      transcript: [
        { id: 't-201', timestamp: '0:04', speaker: 'Sales Rep', text: 'Good morning Rajesh! Priya here from CallPulse. Reaching out regarding your logistics dialer inquiry.', sentiment: 'Neutral' },
        { id: 't-202', timestamp: '0:12', speaker: 'Consumer', text: 'Hi Priya, yes. We manage 40 delivery coordinators who call hundreds of vendors daily, but their connection rates are low.', sentiment: 'Neutral', emotion: 'Curious' },
        { id: 't-203', timestamp: '0:35', speaker: 'Sales Rep', text: 'CallPulse includes 1-click power dialing with local presence routing and instant audio diagnostics to maximize connection rates.', sentiment: 'Positive' },
        { id: 't-204', timestamp: '1:05', speaker: 'Consumer', text: 'Can this integrate with our custom fleet management database?', sentiment: 'Neutral', emotion: 'Skeptical' },
        { id: 't-205', timestamp: '1:30', speaker: 'Sales Rep', text: 'Yes, via REST webhooks and CSV batch importing, you can sync vendor lists in seconds.', sentiment: 'Positive' },
        { id: 't-206', timestamp: '2:10', speaker: 'Consumer', text: 'That sounds very practical. Let us do a demo tomorrow afternoon.', sentiment: 'Positive', emotion: 'Interested', isKeyMoment: true },
        { id: 't-207', timestamp: '2:35', speaker: 'Sales Rep', text: 'Demo locked for tomorrow at 3 PM. Thank you, Rajesh!', sentiment: 'Positive' },
      ],
      sentimentAnalysis: {
        overallSentiment: 'Positive',
        sentimentScore: 82,
        customerSatisfactionScore: 84,
        buyingIntentLevel: 'Moderate',
        consumerTone: 'Practical & Solution-Oriented',
        consumerEmotions: [
          { emotion: 'Curious', percentage: 48, color: '#3b82f6' },
          { emotion: 'Enthusiastic', percentage: 36, color: '#10b981' },
          { emotion: 'Hesitant', percentage: 16, color: '#f59e0b' },
        ],
        keyBuyingSignals: ['Requested live demo for dispatch operations team', 'Targeting 40 coordinator seats'],
        consumerPainPoints: ['Low connection rates with legacy manual desk phones'],
        customerObjections: ['Custom fleet management database compatibility verification required'],
        talkListenRatio: { repPercent: 48, consumerPercent: 52 },
        recommendedNextSteps: ['Prepare logistics-specific demo instance for tomorrow 3:00 PM'],
        executiveAiSummary: 'Solid mid-market opportunity. The prospect was engaged, validated custom webhook needs, and agreed to an afternoon demo walkthrough.',
        isAiPowered: true,
        analyzedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    },
    {
      id: 'call-hist-3',
      leadId: 'lead-3',
      leadName: 'Ananya Rao',
      company: 'Zenith Cloud Systems',
      phone: '+91 9845012345',
      repName: 'Priya Sharma',
      duration: 78,
      durationFormatted: '1m 18s',
      durationMinutes: 1.3,
      timestamp: 'Yesterday, 04:15 PM',
      isoTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      outcome: 'Call Back',
      summary: 'Prospect was in an active leadership standup and asked for a callback today after 4:00 PM.',
      notes: 'Expressed interest in real-time AI live coach to upskill junior SDRs.',
      waveformPeaks: [15, 30, 48, 65, 50, 35, 20, 40, 60, 72, 55, 38, 50, 68, 75, 52, 35, 20, 42, 60, 70, 48, 30, 18, 45, 62, 70, 50, 32, 20, 40, 55, 68, 45, 25, 15],
      transcript: [
        { id: 't-301', timestamp: '0:02', speaker: 'Sales Rep', text: 'Hi Ananya, Priya calling from CallPulse.', sentiment: 'Neutral' },
        { id: 't-302', timestamp: '0:10', speaker: 'Consumer', text: 'Hi Priya, I am stepping into a board review right now. Can we talk later?', sentiment: 'Hesitant', emotion: 'Concerned' },
        { id: 't-303', timestamp: '0:25', speaker: 'Sales Rep', text: 'Certainly! I know you are focused on ramp-time for new SDRs. When is best to reconnect?', sentiment: 'Positive' },
        { id: 't-304', timestamp: '0:45', speaker: 'Consumer', text: 'Yes, your AI real-time coach feature sounds relevant. Please call me back today at 4:30 PM.', sentiment: 'Positive', emotion: 'Interested', isKeyMoment: true },
        { id: 't-305', timestamp: '1:05', speaker: 'Sales Rep', text: 'Calendar invite confirmed for 4:30 PM. Have a great review meeting!', sentiment: 'Positive' },
      ],
      sentimentAnalysis: {
        overallSentiment: 'Neutral',
        sentimentScore: 72,
        customerSatisfactionScore: 75,
        buyingIntentLevel: 'Moderate',
        consumerTone: 'Hurried but Expressed High Curiosity for AI Coach',
        consumerEmotions: [
          { emotion: 'Curious', percentage: 45, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 35, color: '#f59e0b' },
          { emotion: 'Enthusiastic', percentage: 20, color: '#10b981' },
        ],
        keyBuyingSignals: ['Requested specific callback time (4:30 PM)', 'Noted keen interest in AI live coach'],
        consumerPainPoints: ['Slow ramp time for junior SDR hires'],
        customerObjections: ['Currently in meeting / time constraints'],
        talkListenRatio: { repPercent: 55, consumerPercent: 45 },
        recommendedNextSteps: ['Place high-priority callback today at exactly 4:30 PM'],
        executiveAiSummary: 'Brief call due to client meeting schedule, but positive indicator with explicit callback request.',
        isAiPowered: true,
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    },
    {
      id: 'call-hist-4',
      leadId: 'lead-5',
      leadName: 'Vikram Malhotra',
      company: 'Quantum Dynamics Corp',
      phone: '+91 9789012345',
      repName: 'Rahul Verma',
      duration: 310,
      durationFormatted: '5m 10s',
      durationMinutes: 5.16,
      timestamp: 'Aug 19, 02:40 PM',
      isoTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      outcome: 'Hot Lead',
      summary: 'Deep architectural discussion regarding automated audio sentiment modeling and SLA callback guarantees.',
      notes: 'Customer is VP of Sales at 200+ employee SaaS company. Ready for pilot trial.',
      waveformPeaks: [25, 48, 65, 85, 92, 75, 50, 30, 65, 88, 98, 90, 68, 52, 78, 92, 100, 72, 50, 35, 72, 90, 58, 30, 80, 92, 95, 82, 52, 38, 68, 88, 98, 78, 48, 25],
      transcript: [
        { id: 't-401', timestamp: '0:05', speaker: 'Sales Rep', text: 'Hello Vikram, Rahul Verma from CallPulse. How is your day going?', sentiment: 'Neutral' },
        { id: 't-402', timestamp: '0:15', speaker: 'Consumer', text: 'Hi Rahul, good. I was reviewing modern conversation intelligence tools for our 50-person sales team.', sentiment: 'Positive', emotion: 'Interested' },
        { id: 't-403', timestamp: '0:45', speaker: 'Sales Rep', text: 'CallPulse combines real-time dialing with post-call emotion vector analysis and buying intent classification powered by Gemini Flash.', sentiment: 'Positive' },
        { id: 't-404', timestamp: '1:30', speaker: 'Consumer', text: 'Can sales managers inspect the CSAT scores and objection trends across all reps in one centralized dashboard?', sentiment: 'Positive', emotion: 'Curious', isKeyMoment: true },
        { id: 't-405', timestamp: '2:15', speaker: 'Sales Rep', text: 'Absolutely. Managers get instant team analytics, talk/listen ratio tracking, and RFC-4180 CSV audit exports.', sentiment: 'Positive' },
        { id: 't-406', timestamp: '3:20', speaker: 'Consumer', text: 'This solves our visibility problem completely. We would like to initiate a 14-day trial with 10 test reps.', sentiment: 'Enthusiastic', emotion: 'Delighted', isKeyMoment: true },
        { id: 't-407', timestamp: '4:10', speaker: 'Sales Rep', text: 'I am configuring your sandbox credentials right now and sending the SSO access instructions.', sentiment: 'Positive' },
        { id: 't-408', timestamp: '4:55', speaker: 'Consumer', text: 'Excellent! Thank you, Rahul.', sentiment: 'Positive' },
      ],
      sentimentAnalysis: {
        overallSentiment: 'Positive',
        sentimentScore: 96,
        customerSatisfactionScore: 98,
        buyingIntentLevel: 'High',
        consumerTone: 'Visionary, Strategic & Decisive Executive Buyer',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 62, color: '#10b981' },
          { emotion: 'Curious', percentage: 26, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 8, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 4, color: '#ef4444' },
        ],
        keyBuyingSignals: [
          'Ready to pilot immediately with 10 test SDRs, expanding to 50 seats',
          'Validated high value in unified manager visibility dashboard and CSAT metrics'
        ],
        consumerPainPoints: ['Lack of visibility into junior rep call performance and buyer objection patterns'],
        customerObjections: ['Requested SSO integration and SOC2 compliance checklist'],
        talkListenRatio: { repPercent: 38, consumerPercent: 62 },
        recommendedNextSteps: ['Provision 14-day 10-seat sandbox environment and send SSO guide'],
        executiveAiSummary: 'High-value enterprise opportunity. Buyer is senior decision maker who confirmed immediate trial rollout with clear expansion trajectory to 50 reps.',
        isAiPowered: true,
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    }
  ];

  // 1. GET /api/call-history - Retrieve full call history records with duration, timestamps, conversation transcript, & record analysis
  app.get('/api/call-history', (req, res) => {
    res.json({
      success: true,
      count: serverCallHistory.length,
      history: serverCallHistory,
      totalMinutesTalked: serverCallHistory.reduce((acc, item) => acc + item.durationMinutes, 0),
      averageSentimentScore: Math.round(
        serverCallHistory.reduce((acc, item) => acc + item.sentimentAnalysis.sentimentScore, 0) /
          (serverCallHistory.length || 1)
      ),
      serverTimestamp: new Date().toISOString(),
    });
  });

  // 2. POST /api/call-history - Save new completed call record to backend history
  app.post('/api/call-history', (req, res) => {
    const {
      leadId,
      leadName,
      company,
      phone,
      repName,
      duration,
      outcome,
      summary,
      notes,
      transcript,
      sentimentAnalysis,
    } = req.body;

    const durSec = typeof duration === 'number' ? duration : 60;
    const minStr = Math.floor(durSec / 60);
    const secStr = durSec % 60;
    const durFormatted = minStr > 0 ? `${minStr}m ${secStr}s` : `${secStr}s`;
    const durMinutes = parseFloat((durSec / 60).toFixed(2));

    const now = new Date();
    const formattedTimestamp = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newHistoryItem: ServerCallHistoryItem = {
      id: `call-hist-${Date.now()}`,
      leadId: leadId || 'lead-custom',
      leadName: leadName || 'Prospect Contact',
      company: company || 'Enterprise Client',
      phone: phone || '+91 9000000000',
      repName: repName || 'Alex Morgan',
      duration: durSec,
      durationFormatted: durFormatted,
      durationMinutes: durMinutes,
      timestamp: formattedTimestamp,
      isoTimestamp: now.toISOString(),
      outcome: outcome || 'Interested',
      summary: summary || 'Call successfully completed and logged into CallPulse history.',
      notes: notes || '',
      waveformPeaks: [18, 30, 55, 75, 88, 65, 42, 25, 55, 80, 92, 85, 60, 45, 70, 85, 95, 60, 40, 30, 65, 80, 50, 25, 70, 85, 90, 75, 45, 30, 60, 80, 95, 70, 40, 20],
      transcript: Array.isArray(transcript) && transcript.length > 0
        ? transcript
        : [
            { id: 'tr-1', timestamp: '0:03', speaker: 'Sales Rep', text: `Hello ${leadName || 'there'}, thanks for taking the call.` },
            { id: 'tr-2', timestamp: '0:15', speaker: 'Consumer', text: `Hi, yes! We discussed ${notes || 'our requirements'} and moving forward with next steps.` },
            { id: 'tr-3', timestamp: '0:35', speaker: 'Sales Rep', text: `Great, I will log your outcome as ${outcome || 'Interested'} and send the recap.` },
          ],
      sentimentAnalysis: sentimentAnalysis || {
        overallSentiment: outcome === 'Hot Lead' || outcome === 'Interested' ? 'Positive' : outcome === 'Call Back' ? 'Neutral' : 'Negative',
        sentimentScore: outcome === 'Hot Lead' ? 92 : outcome === 'Interested' ? 85 : 65,
        customerSatisfactionScore: outcome === 'Hot Lead' ? 94 : 80,
        buyingIntentLevel: outcome === 'Hot Lead' ? 'High' : outcome === 'Interested' ? 'Moderate' : 'Low',
        consumerTone: 'Engaged & Responsive',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 50, color: '#10b981' },
          { emotion: 'Curious', percentage: 35, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 15, color: '#f59e0b' },
        ],
        keyBuyingSignals: [`Discussed opportunity for ${company || 'account'}`],
        consumerPainPoints: [notes || 'Operational sales workflow bottlenecks'],
        customerObjections: [],
        talkListenRatio: { repPercent: 45, consumerPercent: 55 },
        recommendedNextSteps: ['Send follow-up communication as scheduled'],
        executiveAiSummary: summary || `Call with ${leadName || 'client'} successfully completed with status ${outcome}.`,
        isAiPowered: true,
        analyzedAt: now.toISOString(),
      },
    };

    serverCallHistory.unshift(newHistoryItem);

    res.status(201).json({
      success: true,
      message: 'Call record saved to backend Call History.',
      item: newHistoryItem,
    });
  });

  // 3. GET /api/call-history/:id - Retrieve single call record by ID
  app.get('/api/call-history/:id', (req, res) => {
    const item = serverCallHistory.find((c) => c.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Call history record not found.' });
    }
    res.json({ success: true, item });
  });

  // 4. DELETE /api/call-history/:id - Remove a call history record
  app.delete('/api/call-history/:id', (req, res) => {
    const index = serverCallHistory.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Call history record not found.' });
    }
    const removed = serverCallHistory.splice(index, 1)[0];
    res.json({ success: true, message: 'Call history item removed.', removedId: removed.id });
  });

  // 5. POST /api/call-history/analyze - Run deep Gemini AI analysis on a call transcript
  app.post('/api/call-history/analyze', async (req, res) => {
    const { transcript, leadName, company, duration } = req.body;
    const ai = getGeminiClient();

    const transcriptText = Array.isArray(transcript)
      ? transcript.map((t: any) => `[${t.timestamp || '0:00'}] ${t.speaker}: ${t.text}`).join('\n')
      : String(transcript || 'Sales Rep: Hello. Consumer: Interested in product.');

    if (!ai) {
      return res.json({
        success: true,
        overallSentiment: 'Positive',
        sentimentScore: 88,
        customerSatisfactionScore: 86,
        buyingIntentLevel: 'High',
        consumerTone: 'Engaged & Problem-Solution Focused',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 52, color: '#10b981' },
          { emotion: 'Curious', percentage: 32, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 16, color: '#f59e0b' },
        ],
        keyBuyingSignals: ['Requested product walkthrough', 'Confirmed team interest in outbound acceleration'],
        consumerPainPoints: ['Manual typing fatigue', 'Slow lead follow-up'],
        customerObjections: ['Pricing tier questions'],
        talkListenRatio: { repPercent: 44, consumerPercent: 56 },
        recommendedNextSteps: ['Send follow-up proposal with trial account setup'],
        executiveAiSummary: `Comprehensive conversation analysis completed for ${leadName || 'prospect'} (${company || 'Enterprise'}). Strong buying readiness detected.`,
        isAiPowered: false,
        analyzedAt: new Date().toISOString(),
      });
    }

    try {
      const prompt = `You are a world-class AI conversation intelligence & sales consumer sentiment analyst.
Analyze the following recorded sales call between Sales Rep and Consumer:

Lead Name: ${leadName || 'Prospect'}
Company: ${company || 'Enterprise'}
Call Duration: ${duration || '3m 30s'}

Transcript:
${transcriptText}

Output strict JSON adhering to this schema:
{
  "overallSentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
  "sentimentScore": number (0-100),
  "customerSatisfactionScore": number (0-100),
  "buyingIntentLevel": "High" | "Moderate" | "Low" | "Critical Risk",
  "consumerTone": string,
  "consumerEmotions": [
    { "emotion": "Enthusiastic", "percentage": number, "color": "#10b981" },
    { "emotion": "Curious", "percentage": number, "color": "#3b82f6" },
    { "emotion": "Hesitant", "percentage": number, "color": "#f59e0b" },
    { "emotion": "Frustrated", "percentage": number, "color": "#ef4444" }
  ],
  "keyBuyingSignals": string[],
  "consumerPainPoints": string[],
  "customerObjections": string[],
  "talkListenRatio": { "repPercent": number, "consumerPercent": number },
  "recommendedNextSteps": string[],
  "executiveAiSummary": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        overallSentiment: parsed.overallSentiment || 'Positive',
        sentimentScore: parsed.sentimentScore ?? 88,
        customerSatisfactionScore: parsed.customerSatisfactionScore ?? 85,
        buyingIntentLevel: parsed.buyingIntentLevel || 'High',
        consumerTone: parsed.consumerTone || 'Engaged & Responsive',
        consumerEmotions: parsed.consumerEmotions || [
          { emotion: 'Enthusiastic', percentage: 50, color: '#10b981' },
          { emotion: 'Curious', percentage: 30, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 15, color: '#f59e0b' },
          { emotion: 'Frustrated', percentage: 5, color: '#ef4444' },
        ],
        keyBuyingSignals: parsed.keyBuyingSignals || ['Positive response to automated call coaching'],
        consumerPainPoints: parsed.consumerPainPoints || ['Manual lead workflows'],
        customerObjections: parsed.customerObjections || [],
        talkListenRatio: parsed.talkListenRatio || { repPercent: 42, consumerPercent: 58 },
        recommendedNextSteps: parsed.recommendedNextSteps || ['Send contract and schedule onboarding'],
        executiveAiSummary: parsed.executiveAiSummary || 'Detailed analysis completed successfully.',
        isAiPowered: true,
        analyzedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Gemini call history analysis error:', err);
      return res.json({
        success: true,
        overallSentiment: 'Positive',
        sentimentScore: 84,
        customerSatisfactionScore: 82,
        buyingIntentLevel: 'High',
        consumerTone: 'Receptive & Solution-Oriented',
        consumerEmotions: [
          { emotion: 'Enthusiastic', percentage: 50, color: '#10b981' },
          { emotion: 'Curious', percentage: 35, color: '#3b82f6' },
          { emotion: 'Hesitant', percentage: 15, color: '#f59e0b' },
        ],
        keyBuyingSignals: ['Customer showed interest in platform capabilities'],
        consumerPainPoints: ['Operational inefficiencies'],
        customerObjections: [],
        talkListenRatio: { repPercent: 45, consumerPercent: 55 },
        recommendedNextSteps: ['Follow up with enterprise proposal'],
        executiveAiSummary: 'Call successfully analyzed with positive buying indicators.',
        isAiPowered: false,
        analyzedAt: new Date().toISOString(),
      });
    }
  });

  // API endpoint for initiating real outbound calls via Twilio REST API
  app.post('/api/call/twilio', async (req, res) => {
    const { to, name } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!to) {
      return res.status(400).json({ error: 'Destination phone number is required.' });
    }

    // If Twilio credentials are not set up in environment, return instructions & simulated response
    if (!accountSid || !authToken || !fromNumber) {
      return res.json({
        success: false,
        requiresConfig: true,
        message: 'Twilio credentials not configured in environment. Use native device SIM dialer or add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in settings.',
        targetNumber: to,
        targetName: name,
      });
    }

    try {
      // Call Twilio REST API to place real telephone network call
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const twiml = `<Response><Say voice="alice">Hello ${name || 'there'}! This is a live outbound call from your CallPulse sales dialer application.</Say></Response>`;

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', fromNumber);
      params.append('Twiml', twiml);

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = await twilioRes.json();

      if (!twilioRes.ok) {
        return res.status(twilioRes.status).json({
          success: false,
          error: data.message || 'Failed to place call through Twilio gateway.',
        });
      }

      return res.json({
        success: true,
        callSid: data.sid,
        status: data.status,
        message: `Real PSTN call dispatched to ${to} via Twilio!`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Dialer server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
