import React from 'react';
import { DAYS, TIME_SLOTS, SLOT_GRID, SelectedCourseEntry, parseSlots } from '../utils/timetableData';
import { BookmarkPlus, AlertTriangle, Download, Printer, X } from 'lucide-react';

interface TimetableGridProps {
  courses: SelectedCourseEntry[];
  onSave?: (name: string) => void;
  onRemoveCourse?: (courseCode: string, slot: string) => void;
  readOnly?: boolean;
}

export default function TimetableGrid({ courses, onSave, onRemoveCourse, readOnly = false }: TimetableGridProps) {
  const slotToCoursesMap: Record<string, SelectedCourseEntry[]> = {};
  
  courses.forEach(course => {
    const slots = parseSlots(course.slot);
    slots.forEach(s => {
      if (!slotToCoursesMap[s]) {
        slotToCoursesMap[s] = [];
      }
      slotToCoursesMap[s].push(course);
    });
  });

  const clashes = Object.entries(slotToCoursesMap).filter(([_, list]) => list.length > 1);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (courses.length === 0) {
      alert("No courses selected to download.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Course Code,Course Name,Faculty Name,Rating,Slot,Venue\n";

    courses.forEach(c => {
      const row = `"${c.courseCode}","${c.courseName}","${c.teacherName}","${c.rating > 0 ? c.rating : 'N/A'}","${c.slot}","${c.venue || 'N/A'}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FFCS_Timetable_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {clashes.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm no-print">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <div>
            <span>Slot Clash Detected!</span>
            <span className="block text-xs font-normal text-red-600">
              Multiple classes assigned to slot(s): {clashes.map(([slot]) => slot).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Control Header with Download Options */}
      <div className="flex flex-wrap justify-between items-center bg-slate-100/80 border border-slate-200 p-4 rounded-xl text-slate-800 gap-3 no-print">
        <div className="text-sm font-bold">
          Total Selected Courses: <span className="text-indigo-600">{courses.length}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Download CSV / Summary */}
          <button
            onClick={handleDownloadCSV}
            disabled={courses.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Download CSV file"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>

          {/* Download PDF / Print */}
          <button
            onClick={handlePrintPDF}
            disabled={courses.length === 0}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Save as PDF or Print Timetable"
          >
            <Printer className="w-3.5 h-3.5" /> Download PDF / Print
          </button>

          {/* Save Schedule */}
          {!readOnly && onSave && (
            <button
              onClick={() => {
                const name = prompt("Enter a name for this timetable schedule:", `Schedule ${new Date().toLocaleTimeString()}`);
                if (name) onSave(name);
              }}
              disabled={courses.length === 0}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Save Schedule
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 glass-card-light shadow-sm">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
              <th className="p-3 text-xs font-extrabold uppercase tracking-wider border-r border-slate-200 text-slate-900">Theory</th>
              {TIME_SLOTS.map((t, idx) => (
                <th 
                  key={idx} 
                  className={`p-3 text-xs font-extrabold border-r border-slate-200 ${
                    t.isLunchBreak ? 'bg-indigo-100/80 text-indigo-900 min-w-[90px]' : 'min-w-[120px] text-slate-900'
                  }`}
                >
                  <div>{t.period}</div>
                  {!t.isLunchBreak && <div className="text-[10px] font-medium text-slate-500">{t.time}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {DAYS.map((day) => (
              <tr key={day} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-extrabold text-xs bg-slate-100/80 border-r border-slate-200 text-slate-900">
                  {day}
                </td>
                {SLOT_GRID[day].map((slotCode, pIdx) => {
                  if (slotCode === "Lunch") {
                    return (
                      <td key={pIdx} className="p-2 border-r border-slate-200 bg-indigo-50/60 font-bold text-xs text-indigo-700 align-middle">
                        Lunch
                      </td>
                    );
                  }

                  const assigned = slotToCoursesMap[slotCode] || [];
                  const isClash = assigned.length > 1;

                  return (
                    <td
                      key={pIdx}
                      className={`p-2 border-r border-slate-200 align-top h-24 text-xs transition-all ${
                        isClash
                          ? 'bg-red-100/80 border-2 border-red-500'
                          : assigned.length > 0
                          ? 'bg-indigo-50/50'
                          : ''
                      }`}
                    >
                      <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">{slotCode}</div>
                      
                      {assigned.map((c, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg p-2 mb-1 text-white shadow-sm relative group text-left border border-white/20"
                          style={{ backgroundColor: c.color || '#3b82f6' }}
                        >
                          <div className="font-extrabold text-xs truncate pr-4">{c.courseCode}</div>
                          <div className="text-[10px] font-semibold truncate opacity-90">{c.teacherName}</div>
                          {c.venue && (
                            <div className="text-[9px] opacity-80 mt-0.5 font-medium">{c.venue}</div>
                          )}
                          {!readOnly && onRemoveCourse && (
                            <button
                              onClick={() => onRemoveCourse(c.courseCode, c.slot)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md no-print transition-transform hover:scale-110"
                              title="Remove Course"
                            >
                              <X className="w-3 h-3 stroke-[3]" />
                            </button>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
