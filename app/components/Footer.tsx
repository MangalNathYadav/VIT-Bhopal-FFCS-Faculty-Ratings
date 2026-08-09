import React from 'react';
import { GraduationCap, Heart, Code2, Sparkles, ShieldCheck, Cpu, Laptop, Users, MessageCircleWarning } from 'lucide-react';

export default function Footer() {
  const whatsappUrl = "https://wa.me/919125135581?text=Hi%20Mangal,%20I%20want%20to%20report%20an%20issue%20or%20give%20feedback%20for%20the%20FFCS%20Timetable%20Maker";

  return (
    <footer className="mt-16 border-t border-slate-200 pt-8 pb-10 text-slate-600 glass-card-light rounded-2xl w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-6 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand & Info */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 font-extrabold text-lg">
            <GraduationCap className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>VIT Bhopal FFCS & Faculty Ratings</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            The ultimate tool for planning clash-free semester timetables with AI, faculty ratings, and local storage privacy.
          </p>
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
      <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
            <span>AI Models & Engines:</span>
          </div>
          <span className="font-semibold text-slate-700 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
            Gemini 3.6 Flash • Gemini 3.1 Pro High • Claude Opus 4.6 Thinking
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

      {/* Developer & Contributor Attribution Bar */}
      <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-600 gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span>Developed with</span>
          <Heart className="w-4 h-4 text-red-500 fill-red-500 inline shrink-0" />
          <span>by</span>
          <a
            href="https://github.com/MangalNathYadav"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-extrabold text-slate-900 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-lg transition-all shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>Mangal Nath Yadav / shadowXg</span>
          </a>
          
          <span className="hidden sm:inline text-slate-300">|</span>

          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Contributor:</span>
            <span className="font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
              Yug Thakur (Senior - 2nd Year AI ML)
            </span>
          </div>
        </div>

        <div className="text-center md:text-right shrink-0">
          © {new Date().getFullYear()} FFCS Timetable Maker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
