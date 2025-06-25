
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ onSearch, placeholder = "Search trains, staff, alerts..." }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-pink-400 transition-colors duration-300" />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:scale-105 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-300 w-64"
      />
      {query && (
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs bg-pink-600 hover:bg-pink-700"
        >
          Search
        </Button>
      )}
    </form>
  );
};
