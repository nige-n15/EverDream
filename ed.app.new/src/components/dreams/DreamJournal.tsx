import { useState, useCallback, useMemo } from 'react';
import DreamList, { type Dream } from './DreamList';
import DreamDetail from './DreamDetail';

interface DreamJournalProps {
  dreams: Dream[];
  loading?: boolean;
  onSearch?: (query: string) => void;
  onFilterCategory?: (category: string) => void;
  onSelectDream?: (dream: Dream) => void;
  onBack?: () => void;
}

/**
 * DreamJournal — Full journal view with dream list and detail.
 *
 * Shows a grid of dream cards. Clicking a dream opens its detail view.
 * Includes search and filter functionality.
 *
 * @example
 * <DreamJournal
 *   dreams={dreams}
 *   loading={isLoading}
 *   onBack={() => navigate('home')}
 * />
 */
export default function DreamJournal({
  dreams,
  loading = false,
  onSearch,
  onFilterCategory,
  onSelectDream,
  onBack,
}: DreamJournalProps) {
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const handleSelectDream = useCallback((dream: Dream) => {
    setSelectedDream(dream);
    onSelectDream?.(dream);
  }, [onSelectDream]);

  const handleBack = useCallback(() => {
    setSelectedDream(null);
    onBack?.();
  }, [onBack]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  const handleFilterCategory = useCallback((category: string) => {
    setFilterCategory(category);
    onFilterCategory?.(category);
  }, [onFilterCategory]);

  // Filter dreams based on search and category
  const filteredDreams = useMemo(() => {
    let result = dreams;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.content.toLowerCase().includes(query) ||
        (d.mood && d.mood.toLowerCase().includes(query)) ||
        (d.aiAnalysis?.themes.some(t => t.toLowerCase().includes(query))) ||
        (d.aiAnalysis?.symbols.some(s => s.toLowerCase().includes(query)))
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(d => d.category === filterCategory);
    }

    return result;
  }, [dreams, searchQuery, filterCategory]);

  // If a dream is selected, show detail view
  if (selectedDream) {
    return (
      <DreamDetail
        dream={selectedDream}
        onBack={handleBack}
        loading={false}
      />
    );
  }

  // Otherwise show the list
  return (
    <DreamList
      dreams={filteredDreams}
      loading={loading}
      onSelectDream={handleSelectDream}
      onSearch={handleSearch}
      onFilterCategory={handleFilterCategory}
    />
  );
}
