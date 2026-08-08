import React from 'react';
import { Heart, Sparkles, ShieldCheck, Code2, Cpu, Laptop, MessageCircleWarning } from 'lucide-react';

export default function Footer() {
  const whatsappUrl = "https://wa.me/917992497678?text=Hi%2C%20I%20have%20an%20issue%20or%20feedback%20regarding%20the%20VIT%20Bhopal%20FFCS%20Faculty%20Ratings%20app.";

  return (
    <footer className="w-full mt-16 border-t border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Top Section: Developer & App Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              VIT Bhopal FFCS Faculty Ratings & AI Timetable
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Empowering VIT Bhopal students with teacher ratings, slot clash prevention, and instant AI timetable generation.
            </p>
          </div>

          {/* Dev Credit */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>by</span>
            <span className="text-indigo-600 font-extrabold">shadowXg</span>
            <span className="text-slate-600 font-semibold">(Mangal Nath Yadav)</span>
          </div>
        </div>

        {/* Feature & Action Badges */}
        <div className="flex flex-wrap justify-center gap-2 text-[11px] font-bold text-slate-700">
          <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" /> AI Powered
          </span>
          <span className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% LocalStorage Privacy
          </span>
          <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-2xs">
            <Code2 className="w-3.5 h-3.5" /> Clash Detection
          </span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full transition-transform hover:scale-105 shadow-sm"
          >
            <MessageCircleWarning className="w-3.5 h-3.5" /> Report Issue (WhatsApp)
          </a>
        </div>
      </div>

      {/* Tech Stack & AI Models Badges */}
      <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
            <span>AI Model Engine:</span>
          </div>
          <span className="font-extrabold text-purple-700 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
            Google Gemini Flash Latest (gemini-flash-latest)
          </span>
        </div>

        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Code Editor:</span>
          <span className="font-extrabold text-indigo-700 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
            Antigravity
          </span>
        </div>
      </div>

      {/* Copyright Notice */}
      <div className="border-t border-slate-200 py-3 text-center text-[11px] text-slate-600 font-semibold bg-slate-50">
        © {new Date().getFullYear()} VIT Bhopal FFCS Faculty Ratings & AI Scheduler. All rights reserved.
      </div>
    </footer>
  );
}
