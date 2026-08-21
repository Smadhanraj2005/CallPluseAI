import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquareQuote,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Edit3,
  Check,
  X,
  Languages,
  Loader2,
  Flame,
  AlertCircle,
  ThumbsDown,
  Compass,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AiCallStatement, InterestLevel } from '../types';

interface AiCallStatementCardProps {
  statement: AiCallStatement | null;
  onUpdateStatement?: (updated: AiCallStatement) => void;
  languageStyle?: 'English' | 'Tamil-English';
  onToggleLanguageStyle?: (style: 'English' | 'Tamil-English') => void;
  isLoading?: boolean;
  isEditable?: boolean;
  className?: string;
  customerName?: string;
}

export const AiCallStatementCard: React.FC<AiCallStatementCardProps> = ({
  statement,
  onUpdateStatement,
  languageStyle = 'English',
  onToggleLanguageStyle,
  isLoading = false,
  isEditable = true,
  className = '',
  customerName = 'Customer',
}) => {
  const { theme } = useTheme();

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerStatement, setEditCustomerStatement] = useState('');
  const [editInterestLevel, setEditInterestLevel] = useState<InterestLevel>('Medium');
  const [editKeyPoints, setEditKeyPoints] = useState<string[]>([]);
  const [newKeyPointText, setNewKeyPointText] = useState('');
  const [editNextAction, setEditNextAction] = useState('');

  // Sync state when entering edit mode or when statement updates
  useEffect(() => {
    if (statement) {
      setEditCustomerStatement(statement.customerStatement || '');
      setEditInterestLevel(statement.interestLevel || 'Medium');
      setEditKeyPoints(statement.keyPoints ? [...statement.keyPoints] : []);
      setEditNextAction(statement.suggestedNextAction || '');
    }
  }, [statement]);

  const handleStartEdit = () => {
    if (!statement) return;
    setEditCustomerStatement(statement.customerStatement || '');
    setEditInterestLevel(statement.interestLevel || 'Medium');
    setEditKeyPoints(statement.keyPoints ? [...statement.keyPoints] : []);
    setEditNextAction(statement.suggestedNextAction || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!statement || !onUpdateStatement) return;

    const updatedStatement: AiCallStatement = {
      ...statement,
      customerStatement: editCustomerStatement.trim() || statement.customerStatement,
      interestLevel: editInterestLevel,
      keyPoints: editKeyPoints.filter((k) => k.trim().length > 0),
      suggestedNextAction: editNextAction.trim() || statement.suggestedNextAction,
      isEdited: true,
      lastEditedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateStatement(updatedStatement);
    setIsEditing(false);
  };

  const handleAddKeyPoint = () => {
    if (!newKeyPointText.trim()) return;
    setEditKeyPoints([...editKeyPoints, newKeyPointText.trim()]);
    setNewKeyPointText('');
  };

  const handleRemoveKeyPoint = (index: number) => {
    setEditKeyPoints(editKeyPoints.filter((_, i) => i !== index));
  };

  // Interest Level Badge Helper
  const getInterestBadge = (level: InterestLevel) => {
    switch (level) {
      case 'High':
        return {
          label: 'High Interest',
          icon: <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />,
          classes:
            theme === 'dark'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs',
        };
      case 'Medium':
        return {
          label: 'Medium Interest',
          icon: <TrendingUp className="w-4 h-4 text-cyan-500" />,
          classes:
            theme === 'dark'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-xs',
        };
      case 'Low':
        return {
          label: 'Low Interest',
          icon: <Compass className="w-4 h-4 text-amber-500" />,
          classes:
            theme === 'dark'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs',
        };
      case 'Not Interested':
        return {
          label: 'Not Interested',
          icon: <ThumbsDown className="w-4 h-4 text-rose-500" />,
          classes:
            theme === 'dark'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-xs',
        };
      default:
        return {
          label: 'Medium Interest',
          icon: <TrendingUp className="w-4 h-4 text-cyan-500" />,
          classes:
            theme === 'dark'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
              : 'bg-cyan-50 text-cyan-800 border-cyan-200',
        };
    }
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.18)]'
            : 'bg-white border-slate-200/90 shadow-md'
        } ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 animate-pulse">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1"></div>
            <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
          <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!statement) return null;

  const badgeInfo = getInterestBadge(statement.interestLevel);

  return (
    <div
      id="ai-call-statement-card"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.22)]'
          : 'bg-white border-slate-200 shadow-md'
      } ${className}`}
    >
      {/* Dark Theme Soft Neon Glow Line Header */}
      {theme === 'dark' && (
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
      )}

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                theme === 'dark'
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'bg-purple-50 text-purple-700 border border-purple-100'
              }`}
            >
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base font-semibold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  AI Call Statement
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                    theme === 'dark'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}
                >
                  Auto-Generated
                </span>
                {statement.isEdited && (
                  <span className="text-[10px] text-amber-500 font-medium">
                    (Edited {statement.lastEditedAt || ''})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Instant post-call statement for {customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Style Toggle Button */}
            {onToggleLanguageStyle && !isEditing && (
              <button
                id="toggle-statement-lang-btn"
                type="button"
                onClick={() =>
                  onToggleLanguageStyle(
                    languageStyle === 'English' ? 'Tamil-English' : 'English'
                  )
                }
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 hover:bg-slate-800 hover:border-cyan-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title="Switch statement language (English / Tanglish)"
              >
                <Languages className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  {languageStyle === 'Tamil-English' ? 'Tamil-English Mix' : 'English'}
                </span>
              </button>
            )}

            {/* Small Edit Statement Button */}
            {isEditable && !isEditing && (
              <button
                id="edit-call-statement-btn"
                type="button"
                onClick={handleStartEdit}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-500" />
                <span>Edit Statement</span>
              </button>
            )}
          </div>
        </div>

        {/* EDIT MODE CONTENT */}
        {isEditing ? (
          <div className="space-y-4 pt-1">
            {/* Edit 1: Customer Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Customer Statement
              </label>
              <textarea
                id="edit-customer-statement-input"
                rows={3}
                value={editCustomerStatement}
                onChange={(e) => setEditCustomerStatement(e.target.value)}
                placeholder="Enter customer's conversation statement..."
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors resize-none ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-purple-500'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-purple-600'
                }`}
              />
            </div>

            {/* Edit 2: Interest Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. Interest Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['High', 'Medium', 'Low', 'Not Interested'] as InterestLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEditInterestLevel(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      editInterestLevel === level
                        ? 'bg-purple-600 text-white shadow-xs'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit 3: Key Points */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                3. Key Points Noted
              </label>
              <div className="space-y-2">
                {editKeyPoints.map((kp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={kp}
                      onChange={(e) => {
                        const updated = [...editKeyPoints];
                        updated[idx] = e.target.value;
                        setEditKeyPoints(updated);
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-normal outline-none ${
                        theme === 'dark'
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyPoint(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newKeyPointText}
                    onChange={(e) => setNewKeyPointText(e.target.value)}
                    placeholder="Add a new key point (e.g., Call tomorrow, Budget issue)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyPoint();
                      }
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyPoint}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Edit 4: Suggested Next Action */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                4. Suggested Next Action
              </label>
              <input
                id="edit-suggested-next-action-input"
                type="text"
                value={editNextAction}
                onChange={(e) => setEditNextAction(e.target.value)}
                placeholder="e.g. Call back tomorrow at 11:00 AM with product details"
                className={`w-full p-2.5 rounded-xl text-xs sm:text-sm font-normal outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-purple-500'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-purple-600'
                }`}
              />
            </div>

            {/* Edit Save/Cancel Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Save Statement
              </button>
            </div>
          </div>
        ) : (
          /* READ MODE DISPLAY */
          <div className="space-y-4">
            {/* SECTION 1: CUSTOMER STATEMENT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-purple-500" />
                  <span>1. Customer Statement</span>
                </span>
                {statement.languageStyle && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Style: {statement.languageStyle}
                  </span>
                )}
              </div>

              <div
                className={`p-4 rounded-xl border text-sm sm:text-base font-medium leading-relaxed ${
                  theme === 'dark'
                    ? 'bg-slate-800/80 text-purple-200 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'bg-purple-50/60 text-slate-800 border-purple-100'
                }`}
              >
                "{statement.customerStatement}"
              </div>
            </div>

            {/* SECTION 2: INTEREST LEVEL */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                2. Interest Level
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${badgeInfo.classes}`}
                >
                  {badgeInfo.icon}
                  <span>{badgeInfo.label}</span>
                </span>
              </div>
            </div>

            {/* SECTION 3: KEY POINTS NOTED */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                3. Key Points Noted
              </span>
              <div
                className={`p-3.5 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-800'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                {statement.keyPoints && statement.keyPoints.length > 0 ? (
                  <ul className="space-y-2">
                    {statement.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2 font-normal"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific key points recorded.</p>
                )}
              </div>
            </div>

            {/* SECTION 4: SUGGESTED NEXT ACTION */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                4. Suggested Next Action
              </span>
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  theme === 'dark'
                    ? 'bg-cyan-950/40 text-cyan-200 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    theme === 'dark'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-semibold">
                  {statement.suggestedNextAction || 'Call back customer as requested'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
