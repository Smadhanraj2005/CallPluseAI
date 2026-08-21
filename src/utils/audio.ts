// Web Audio API helper for realistic DTMF dialing tones, ringing audio, and telemetry feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// DTMF Frequency mappings
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export function playDtmfTone(digit: string, durationMs: number = 150): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;

    const [f1, f2] = freqs;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.frequency.value = f1;
    osc2.frequency.value = f2;
    osc1.type = 'sine';
    osc2.type = 'sine';

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.debug('Audio play blocked or unavailable', e);
  }
}

let ringingInterval: NodeJS.Timeout | null = null;

export function startRingingSound(): void {
  stopRingingSound();
  const playRingPulse = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      osc1.type = 'sine';
      osc2.type = 'sine';

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 1.2);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.4);
      osc2.stop(ctx.currentTime + 1.4);
    } catch {
      // ignore
    }
  };

  playRingPulse();
  ringingInterval = setInterval(playRingPulse, 3500);
}

export function stopRingingSound(): void {
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
}
