import React, { useState } from 'react';
import { TeacherData } from './TeacherCard';
import { SelectedCourseEntry, SUBJECT_COLORS } from '../utils/timetableData';
import { Sparkles, Check, Clock, Utensils, Award, AlertCircle } from 'lucide-react';

interface AIScheduleFormProps {
  allFacultyData: TeacherData[];
  onScheduleGenerated: (schedule: SelectedCourseEntry[]) => void;
}

export default function AIScheduleForm({ allFacultyData, onScheduleGenerated }: AIScheduleFormProps) {
  const courseMap: Record<string, { courseCode: string; courseName: string; faculties: TeacherData[] }> = {};
  
  allFacultyData.forEach(fac => {
    fac.courses.forEach(c => {
      if (!courseMap[c.courseCode]) {
        courseMap[c.courseCode] = {
          courseCode: c.courseCode,
          courseName: c.courseName,
          faculties: []
        };
      }
      if (!courseMap[c.courseCode].faculties.some(f => f.name === fac.name)) {
        courseMap[c.courseCode].faculties.push(fac);
      }
    });
  });

  const availableCourses = Object.values(courseMap);

  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [timePreference, setTimePreference] = useState<'morning' | 'evening' | 'balanced'>('balanced');
  const [prioritizeHighRating, setPrioritizeHighRating] = useState(true);
  const [mealBreaks, setMealBreaks] = useState({
    breakfast: true,
    lunch: true,
    snacks: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handleToggleCourse = (code: string) => {
    if (selectedCourseCodes.includes(code)) {
      setSelectedCourseCodes(selectedCourseCodes.filter(c => c !== code));
    } else {
      if (selectedCourseCodes.length >= 7) {
        alert("You can select a maximum of 7 courses at once.");
        return;
      }
      setSelectedCourseCodes([...selectedCourseCodes, code]);
    }
  };

  const handleGenerate = async () => {
    if (selectedCourseCodes.length === 0) {
      setError("Please select at least 1 course.");
      return;
    }

    setLoading(true);
    setError(null);

    const payloadCourses = selectedCourseCodes.map(code => {
      const info = courseMap[code];
      return {
        courseCode: info.courseCode,
        courseName: info.courseName,
        availableOptions: info.faculties.map(fac => {
          const cDetail = fac.courses.find(c => c.courseCode === code);
          return {
            teacherName: fac.name,
            rating: fac.rating,
            slot: cDetail?.slot || fac.slots[0] || "",
            venue: cDetail?.venue || fac.venues[0] || ""
          };
        }).filter(opt => opt.slot)
      };
    });

    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCourses: payloadCourses,
          timePreference,
          prioritizeHighRating,
          mealBreaks
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to generate schedule.");
      }

      if (!json.schedule || !Array.isArray(json.schedule)) {
        throw new Error("Invalid response format from AI.");
      }

      const colorAssignedSchedule: SelectedCourseEntry[] = json.schedule.map((item: any, idx: number) => ({
        ...item,
        color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
      }));

      onScheduleGenerated(colorAssignedSchedule);

      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card-light rounded-2xl p-6 max-w-4xl mx-auto mb-8 space-y-6 text-slate-900 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Sparkles className="w-6 h-6 text-purple-600 shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gemini AI FFCS Schedule Builder</h2>
          <p className="text-xs text-slate-600 font-medium">
            Tell Gemini your preferences and let AI build a 100% clash-free timetable.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Select Courses */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          1. Select Courses ({selectedCourseCodes.length} / 7 selected):
        </label>
        <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-2.5 bg-slate-100/70 rounded-xl border border-slate-200">
          {availableCourses.map(course => {
            const isSelected = selectedCourseCodes.includes(course.courseCode);
            return (
              <button
                key={course.courseCode}
                onClick={() => handleToggleCourse(course.courseCode)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-indigo-500 shadow-2xs'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                <span className="font-extrabold">{course.courseCode}</span>
                <span className={`text-[11px] font-semibold ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}>
                  - {course.courseName}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {course.faculties.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Timing Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" /> 2. Class Time Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'morning', label: 'Morning Heavy' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'evening', label: 'Evening Heavy' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTimePreference(item.id as any)}
                className={`text-xs py-2 px-2 rounded-xl border font-bold transition-all ${
                  timePreference === item.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:border-indigo-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Meal Break Preferences */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-amber-600" /> 3. Meal Break Protection
          </label>
          <div className="flex flex-wrap gap-3 bg-slate-100/70 border border-slate-200 p-2.5 rounded-xl text-xs">
            {[
              { key: 'breakfast', label: 'Breakfast (7:30-9:30)' },
              { key: 'lunch', label: 'Lunch (12:00-2:30)' },
              { key: 'snacks', label: 'Snacks (5:00-6:30)' }
            ].map(m => (
              <label key={m.key} className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={(mealBreaks as any)[m.key]}
                  onChange={e => setMealBreaks({ ...mealBreaks, [m.key]: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Faculty Priority */}
      <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Award className="w-4 h-4 text-purple-600" />
          <span>Prioritize Highest Rated Faculties</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={prioritizeHighRating}
            onChange={e => setPrioritizeHighRating(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || cooldown > 0 || selectedCourseCodes.length === 0}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Gemini AI is crafting your timetable...</span>
          </>
        ) : cooldown > 0 ? (
          <span>Rate Limit Cooldown ({cooldown}s)</span>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> Generate AI Schedule with Gemini
          </>
        )}
      </button>
    </div>
  );
}
