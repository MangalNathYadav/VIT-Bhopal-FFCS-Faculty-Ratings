import React, { useState } from 'react';
import { TeacherData } from './TeacherCard';
import { SelectedCourseEntry, SUBJECT_COLORS } from '../utils/timetableData';
import { Plus, Search, Check, UserPlus, ListFilter, Trash2, Edit3 } from 'lucide-react';

interface ManualScheduleBuilderProps {
  allFacultyData: TeacherData[];
  onAddCourse: (course: SelectedCourseEntry) => void;
  onUpdateCourse?: (index: number, updated: SelectedCourseEntry) => void;
  onRemoveCourse?: (index: number) => void;
  selectedCourses: SelectedCourseEntry[];
}

export default function ManualScheduleBuilder({ 
  allFacultyData, 
  onAddCourse, 
  onUpdateCourse, 
  onRemoveCourse, 
  selectedCourses 
}: ManualScheduleBuilderProps) {
  const [mode, setMode] = useState<'search' | 'custom'>('search');

  // Search mode state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<TeacherData | null>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>(SUBJECT_COLORS[0]);

  // Custom entry form state
  const [customCourseCode, setCustomCourseCode] = useState("");
  const [customCourseName, setCustomCourseName] = useState("");
  const [customTeacherName, setCustomTeacherName] = useState("");
  const [customSlot, setCustomSlot] = useState("");
  const [customVenue, setCustomVenue] = useState("");

  const filteredFaculties = allFacultyData.filter(fac => {
    const term = searchTerm.toLowerCase();
    const nameMatch = fac.name.toLowerCase().includes(term);
    const courseMatch = fac.courses.some(c => c.courseCode.toLowerCase().includes(term) || c.courseName.toLowerCase().includes(term));
    return nameMatch || courseMatch;
  });

  const handleSelectFaculty = (fac: TeacherData) => {
    setSelectedFaculty(fac);
    setSelectedCourseIndex(0);
  };

  const handleAddFromSearch = () => {
    if (!selectedFaculty) return;
    const course = selectedFaculty.courses[selectedCourseIndex];
    if (!course) return;

    const slotStr = course.slot || selectedFaculty.slots[0] || "";
    if (!slotStr) {
      alert("No slot information available for this course option.");
      return;
    }

    const entry: SelectedCourseEntry = {
      courseCode: course.courseCode,
      courseName: course.courseName,
      teacherName: selectedFaculty.name,
      rating: selectedFaculty.rating,
      slot: slotStr,
      venue: course.venue || selectedFaculty.venues[0] || "",
      color: selectedColor
    };

    onAddCourse(entry);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCourseCode.trim() || !customTeacherName.trim() || !customSlot.trim()) {
      alert("Please fill in Course Code, Faculty Name, and Slot(s).");
      return;
    }

    const entry: SelectedCourseEntry = {
      courseCode: customCourseCode.trim().toUpperCase(),
      courseName: customCourseName.trim() || customCourseCode.trim().toUpperCase(),
      teacherName: customTeacherName.trim(),
      rating: -1,
      slot: customSlot.trim().toUpperCase(),
      venue: customVenue.trim() || "N/A",
      color: selectedColor
    };

    onAddCourse(entry);

    setCustomCourseCode("");
    setCustomCourseName("");
    setCustomTeacherName("");
    setCustomSlot("");
    setCustomVenue("");
    alert(`Added custom entry for ${entry.courseCode} (${entry.teacherName})!`);
  };

  return (
    <div className="glass-card-light rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto mb-8 space-y-6 text-slate-900 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Manual Timetable Builder
        </h2>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto justify-between">
          <button
            onClick={() => setMode('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'search'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Existing Faculty
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> New / Custom Faculty
          </button>
        </div>
      </div>

      {/* MODE 1: Pick Existing Faculty */}
      {mode === 'search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800">1. Search Faculty or Course Code:</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. CSE1021 or SAURAV PRASAD"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-xl bg-slate-100/70">
              {filteredFaculties.slice(0, 20).map((fac, idx) => {
                const isSelected = selectedFaculty?.name === fac.name;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectFaculty(fac)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex justify-between items-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white text-slate-800 hover:bg-slate-50 font-semibold border border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{fac.name}</div>
                      <div className="opacity-80 font-normal">
                        {fac.courses.map(c => c.courseCode).join(', ')}
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-300">
                      ⭐ {fac.rating > 0 ? fac.rating : 'N/A'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 bg-slate-100/70 border border-slate-200 p-4 rounded-xl">
            {selectedFaculty ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selected Faculty:</label>
                  <div className="text-sm font-extrabold text-indigo-700">{selectedFaculty.name}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Course & Slot:</label>
                  <select
                    value={selectedCourseIndex}
                    onChange={e => setSelectedCourseIndex(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    {selectedFaculty.courses.map((c, idx) => (
                      <option key={idx} value={idx}>
                        {c.courseCode} - {c.courseName} | Slot: {c.slot} | Venue: {c.venue}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Color Picker:</label>
                  <div className="flex gap-2">
                    {SUBJECT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddFromSearch}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add to Timetable Grid
                </button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium italic min-h-[160px]">
                Select a faculty on the left to configure slots
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Add New / Custom Faculty Entry */}
      {mode === 'custom' && (
        <form onSubmit={handleAddCustom} className="space-y-4 bg-slate-100/70 border border-slate-200 p-4 sm:p-5 rounded-xl">
          <div className="text-xs font-bold text-indigo-700 mb-2">
            Manually enter faculty & slot details for courses not found in the database:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Course Code *</label>
              <input
                type="text"
                placeholder="e.g. CSE1021"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                value={customCourseCode}
                onChange={e => setCustomCourseCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Course Name</label>
              <input
                type="text"
                placeholder="e.g. Intro to Problem Solving"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                value={customCourseName}
                onChange={e => setCustomCourseName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Faculty Name *</label>
              <input
                type="text"
                placeholder="e.g. DR. NEW FACULTY"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                value={customTeacherName}
                onChange={e => setCustomTeacherName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Slot(s) * (e.g. A11+A12)</label>
              <input
                type="text"
                placeholder="e.g. A11+A12 or B21"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-indigo-900"
                value={customSlot}
                onChange={e => setCustomSlot(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Venue (Optional)</label>
              <input
                type="text"
                placeholder="e.g. AB-430"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-900"
                value={customVenue}
                onChange={e => setCustomVenue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Subject Color</label>
              <div className="flex gap-2 pt-1">
                {SUBJECT_COLORS.map(color => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-4"
          >
            <UserPlus className="w-4 h-4" /> Add Custom Faculty to Grid
          </button>
        </form>
      )}

      {/* ACTIVE COURSES INLINE SLOT EDITOR & REMOVER */}
      {selectedCourses.length > 0 && (
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" /> Currently Added Courses ({selectedCourses.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">Edit slots or remove directly:</span>
          </div>

          <div className="space-y-3">
            {selectedCourses.map((c, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: c.color || '#3b82f6' }}
                  />
                  <div className="font-extrabold text-slate-900 shrink-0">
                    {c.courseCode}
                  </div>
                  <div className="font-semibold text-slate-700 truncate max-w-[180px]">
                    ({c.teacherName})
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1">
                  {/* Inline Editable Slot */}
                  <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                    <span className="font-bold text-slate-500 text-[10px] uppercase shrink-0">Slot:</span>
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-indigo-900 text-xs focus:ring-1 focus:ring-indigo-600"
                      value={c.slot}
                      onChange={(e) => {
                        if (onUpdateCourse) {
                          onUpdateCourse(idx, { ...c, slot: e.target.value.toUpperCase() });
                        }
                      }}
                    />
                  </div>

                  {/* Inline Editable Venue */}
                  <div className="w-28 shrink-0 flex items-center gap-1.5">
                    <span className="font-bold text-slate-500 text-[10px] uppercase shrink-0">Venue:</span>
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs"
                      value={c.venue || ""}
                      onChange={(e) => {
                        if (onUpdateCourse) {
                          onUpdateCourse(idx, { ...c, venue: e.target.value });
                        }
                      }}
                    />
                  </div>

                  {/* Remove Button */}
                  {onRemoveCourse && (
                    <button
                      onClick={() => onRemoveCourse(idx)}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors shrink-0 font-bold self-end sm:self-auto"
                      title="Remove Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
