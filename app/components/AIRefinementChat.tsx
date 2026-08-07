import React, { useState } from 'react';
import { SelectedCourseEntry, SUBJECT_COLORS } from '../utils/timetableData';
import { TeacherData } from './TeacherCard';
import { Send, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

interface AIRefinementChatProps {
  currentSchedule: SelectedCourseEntry[];
  allFacultyData: TeacherData[];
  onScheduleUpdated: (updated: SelectedCourseEntry[]) => void;
}

export default function AIRefinementChat({ currentSchedule, allFacultyData, onScheduleUpdated }: AIRefinementChatProps) {
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Ask Gemini to refine your current timetable! (e.g. "Swap CSE1021 to a 5.0 rated teacher" or "Move MAT1003 to early morning")'
    }
  ]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || loading) return;

    const userPrompt = promptText.trim();
    setPromptText("");
    setError(null);
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    try {
      const res = await fetch('/api/refine-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSchedule,
          refinementPrompt: userPrompt,
          allFacultyData
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to refine schedule.");
      }

      if (!json.schedule || !Array.isArray(json.schedule)) {
        throw new Error("Invalid response from Gemini AI.");
      }

      // Assign colors
      const colorAssignedSchedule: SelectedCourseEntry[] = json.schedule.map((item: any, idx: number) => ({
        ...item,
        color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
      }));

      onScheduleUpdated(colorAssignedSchedule);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `✨ Updated your schedule based on: "${userPrompt}". Check the grid above!`
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not apply refinement.");
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ Could not modify schedule: ${err.message || "Try rephrasing your request."}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card-light rounded-2xl p-6 max-w-4xl mx-auto border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
        <h3 className="text-base font-bold text-slate-900">Gemini AI Schedule Refinement Chat</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Messages */}
      <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-100/70 rounded-xl border border-slate-200 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 p-2.5 rounded-lg ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white ml-auto max-w-[80%]'
                : 'bg-white text-slate-800 border border-slate-200 max-w-[90%]'
            }`}
          >
            {m.role === 'assistant' ? (
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            ) : (
              <span className="font-bold text-[10px] text-indigo-200">You:</span>
            )}
            <span className="font-medium">{m.text}</span>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendPrompt} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask Gemini to modify schedule (e.g. 'Replace CSE1021 teacher with 5.0 rating')..."
          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !promptText.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Modify
            </>
          )}
        </button>
      </form>
    </div>
  );
}
