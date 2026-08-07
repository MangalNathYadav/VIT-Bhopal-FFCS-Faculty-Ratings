"use client";

import React, { useState, useEffect } from 'react';
import TeacherCard, { TeacherData } from './components/TeacherCard';
import SearchBar from './components/SearchBar';
import Navbar, { TabType } from './components/Navbar';
import TimetableGrid from './components/TimetableGrid';
import AIScheduleForm from './components/AIScheduleForm';
import ManualScheduleBuilder from './components/ManualScheduleBuilder';
import AIRefinementChat from './components/AIRefinementChat';
import Footer from './components/Footer';
import { 
  SelectedCourseEntry, 
  SavedTimetable, 
  getSavedTimetables, 
  saveTimetableToStorage, 
  deleteTimetableFromStorage 
} from './utils/timetableData';
import { GraduationCap, Trash2, ExternalLink, MessageCircleWarning } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<TeacherData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('ratings');

  const [currentSchedule, setCurrentSchedule] = useState<SelectedCourseEntry[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<SavedTimetable[]>([]);

  useEffect(() => {
    fetch('/combined_data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });

    setSavedSchedules(getSavedTimetables());
  }, []);

  const handleSaveTimetable = (name: string) => {
    const newEntry: SavedTimetable = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toLocaleDateString(),
      courses: currentSchedule
    };
    const updated = saveTimetableToStorage(newEntry);
    setSavedSchedules(updated);
    alert(`Schedule "${name}" saved to LocalStorage!`);
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm("Are you sure you want to delete this saved schedule?")) {
      const updated = deleteTimetableFromStorage(id);
      setSavedSchedules(updated);
    }
  };

  const handleRemoveCourseBySlot = (courseCode: string, slot: string) => {
    setCurrentSchedule(currentSchedule.filter(c => !(c.courseCode === courseCode && c.slot === slot)));
  };

  const handleRemoveCourseByIndex = (index: number) => {
    setCurrentSchedule(currentSchedule.filter((_, idx) => idx !== index));
  };

  const handleUpdateCourseByIndex = (index: number, updated: SelectedCourseEntry) => {
    const next = [...currentSchedule];
    next[index] = updated;
    setCurrentSchedule(next);
  };

  const handleAddManualCourse = (course: SelectedCourseEntry) => {
    setCurrentSchedule([...currentSchedule, course]);
  };

  const filteredData = data.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = teacher.name.toLowerCase().includes(searchLower);
    const courseMatch = teacher.courses.some(c => 
      c.courseCode.toLowerCase().includes(searchLower) || 
      c.courseName.toLowerCase().includes(searchLower)
    );
    return nameMatch || courseMatch;
  });

  const whatsappUrl = "https://wa.me/919125135581?text=Hi%20Mangal,%20I%20want%20to%20report%20an%20issue%20or%20give%20feedback%20for%20the%20FFCS%20Timetable%20Maker";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-900 flex flex-col justify-between relative">
      {/* Sleek Floating Top-Right Corner "Report Issue" Pill */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 no-print border border-emerald-400/40"
        title="Report issue directly on WhatsApp (+91 9125135581)"
      >
        <MessageCircleWarning className="w-4 h-4" />
        <span>Report Issue</span>
      </a>

      <div>
        {/* App Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-3 mb-2">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">
              VIT Bhopal FFCS & Faculty Ratings
            </span>
          </h1>
          <p className="text-sm font-semibold text-slate-600 max-w-2xl mx-auto">
            Faculty ratings, AI-powered schedule generation with Gemini, and interactive clash-free timetable planning.
          </p>
        </div>

        {/* Navigation Tabs */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} savedCount={savedSchedules.length} />

        {/* TAB 1: Faculty Ratings */}
        {activeTab === 'ratings' && (
          <>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-xs text-slate-600 font-bold">
                  Showing {filteredData.length} faculty result{filteredData.length !== 1 ? 's' : ''}
                </div>
                
                {filteredData.length === 0 ? (
                  <div className="text-center py-20 glass-card-light rounded-3xl">
                    <p className="text-base font-semibold text-slate-500">No faculty or courses found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((teacher, index) => (
                      <TeacherCard key={index} teacher={teacher} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* TAB 2: AI Schedule Generator */}
        {activeTab === 'ai-generator' && (
          <div className="space-y-8">
            <AIScheduleForm
              allFacultyData={data}
              onScheduleGenerated={(generated) => setCurrentSchedule(generated)}
            />

            {currentSchedule.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900">AI Generated Schedule</h3>
                <TimetableGrid
                  courses={currentSchedule}
                  onSave={handleSaveTimetable}
                  onRemoveCourse={handleRemoveCourseBySlot}
                />
                <AIRefinementChat
                  currentSchedule={currentSchedule}
                  allFacultyData={data}
                  onScheduleUpdated={(updated) => setCurrentSchedule(updated)}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Manual Builder */}
        {activeTab === 'manual-builder' && (
          <div className="space-y-8">
            <ManualScheduleBuilder
              allFacultyData={data}
              selectedCourses={currentSchedule}
              onAddCourse={handleAddManualCourse}
              onUpdateCourse={handleUpdateCourseByIndex}
              onRemoveCourse={handleRemoveCourseByIndex}
            />

            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-slate-900">Your Timetable Grid</h3>
              <TimetableGrid
                courses={currentSchedule}
                onSave={handleSaveTimetable}
                onRemoveCourse={handleRemoveCourseBySlot}
              />
              {currentSchedule.length > 0 && (
                <AIRefinementChat
                  currentSchedule={currentSchedule}
                  allFacultyData={data}
                  onScheduleUpdated={(updated) => setCurrentSchedule(updated)}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Saved Schedules */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Saved Schedules (LocalStorage)</h2>
            {savedSchedules.length === 0 ? (
              <div className="text-center py-16 glass-card-light rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium">No saved schedules yet. Build one using AI or Manual Builder!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {savedSchedules.map((saved) => (
                  <div key={saved.id} className="glass-card-light rounded-2xl p-6 space-y-4 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{saved.name}</h3>
                        <span className="text-xs text-slate-500 font-medium">Saved on {saved.createdAt} | {saved.courses.length} courses</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCurrentSchedule(saved.courses);
                            setActiveTab('manual-builder');
                          }}
                          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Load & Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSaved(saved.id)}
                          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-bold"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <TimetableGrid courses={saved.courses} readOnly />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Developer & Application Footer */}
      <Footer />
    </div>
  );
}
