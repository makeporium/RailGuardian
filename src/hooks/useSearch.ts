
import { useState, useMemo } from 'react';

interface SearchableItem {
  id: string;
  name: string;
  type: 'train' | 'staff' | 'alert';
  [key: string]: any;
}

export const useSearch = (items: SearchableItem[]) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  return {
    query,
    setQuery,
    filteredItems,
    hasResults: filteredItems.length > 0,
  };
};
