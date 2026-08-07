import React from 'react';
import { Star, StarHalf, BookOpen, Clock, MapPin, User, MessageSquare } from 'lucide-react';

interface Course {
  courseCode: string;
  courseName: string;
  slot?: string;
  venue?: string;
}

export interface TeacherData {
  name: string;
  rating: number;
  reviews?: Record<string, string>;
  courses: Course[];
  slots: string[];
  venues: string[];
}

const StarRating = ({ rating }: { rating: number }) => {
  if (rating === -1) return <span className="text-xs text-slate-500 italic">No ratings yet</span>;
  
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`f-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />);
  }
  if (hasHalf) {
    stars.push(<StarHalf key="h" className="w-4 h-4 fill-amber-400 text-amber-400" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`e-${i}`} className="w-4 h-4 text-slate-300" />);
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex">{stars}</div>
      <span className="font-bold text-sm text-slate-800">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function TeacherCard({ teacher }: { teacher: TeacherData }) {
  return (
    <div className="glass-card-light rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
      {/* Header section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{teacher.name}</span>
          </h2>
          <StarRating rating={teacher.rating} />
        </div>
      </div>

      {/* Reviews Section */}
      {teacher.reviews && Object.keys(teacher.reviews).length > 0 && (
        <div className="mb-4 bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600" /> Detailed Ratings
          </h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {Object.entries(teacher.reviews).map(([key, value]) => {
              if (!value || value === "0") return null;
              let prefix = "📌";
              if (key === "Teaching") prefix = "📚";
              if (key === "Evaluation") prefix = "📝";
              if (key === "Behaviour") prefix = "🤝";
              if (key === "Internals") prefix = "💯";
              if (key === "Class Average") prefix = "📊";
              if (key === "Final Remark") prefix = "💡";

              return (
                <div key={key} className={`col-span-1 ${key === 'Final Remark' || key === 'Class Average' ? 'col-span-2' : ''} flex gap-1.5 items-center`}>
                  <span>{prefix}</span>
                  <span className="font-semibold text-slate-600">{key}:</span>
                  <span className="font-bold text-slate-900 truncate">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courses Section */}
      {teacher.courses && teacher.courses.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3.5">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Available Courses & Full Slots
          </h3>
          <div className="flex flex-col gap-2">
            {teacher.courses.map((course, idx) => (
              <div key={idx} className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
                <span className="font-bold text-slate-900">{course.courseCode} - {course.courseName}</span>
                
                {/* Full Slot Display - No Truncation! */}
                {course.slot && (
                  <div className="flex items-start gap-1 mt-1.5 text-slate-700 font-semibold bg-white border border-slate-200 p-1.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="break-all font-mono text-[11px] text-indigo-900">{course.slot}</span>
                  </div>
                )}

                {course.venue && (
                  <div className="flex items-center gap-1 mt-1 text-slate-600 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Venue: {course.venue}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
