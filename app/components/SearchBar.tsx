import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
}

export default function SearchBar({ searchTerm, setSearchTerm, placeholder = "Search for a faculty or course code..." }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-10 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="w-full pl-12 pr-4 py-4 rounded-full glass-card-light text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-300 shadow-sm"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
