import { useState } from 'react';
import { supabase } from '../app/data/supabase';
import { getUserEmail } from '../app/utils/auth';

export interface SearchResult {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  current_general_industry: string;
  current_job_location: string;
  years_experience: number;
  similarity: number;
  profile_photo_url?: string;
  headline: string;
  current_job_level?: string;
  current_job_function?: string;
  undergraduate_school?: string[];
  graduate_school?: string[];
  natural_language_geographic_profile?: string;
  natural_language_educational_profile?: string;
  highest_degree_level?: string;
  major_category?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  result_count: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface SaveSearchRequest {
  query: string;
  results?: SearchResult[];
  metadata?: Record<string, any>;
}

export const useSearchHistory = () => {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveSearch = async (searchData: SaveSearchRequest): Promise<string | null> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      // Save search history
      const { data: searchHistory, error: searchError } = await supabase
        .from('search_history')
        .insert([{
          user_email: userEmail,
          query: searchData.query,
          result_count: searchData.results?.length || 0,
          metadata: searchData.metadata || {}
        }])
        .select()
        .single();

      if (searchError) throw searchError;

      // Save search results if provided
      if (searchData.results && searchData.results.length > 0) {
        const resultsToInsert = searchData.results.map((result, index) => ({
          search_history_id: searchHistory.id,
          result_data: result,
          result_index: index
        }));

        const { error: resultsError } = await supabase
          .from('search_results')
          .insert(resultsToInsert);

        if (resultsError) throw resultsError;
      }

      // Update local state
      await loadRecentSearches();
      
      return searchHistory.id;
    } catch (error) {
      console.error('Error saving search:', error);
      return null;
    }
  };

  const loadRecentSearches = async (limit: number = 10): Promise<void> => {
    try {
      setIsLoading(true);
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setRecentSearches(data || []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchDetails = async (id: string): Promise<{
    search: SearchHistoryItem;
    results: SearchResult[];
  } | null> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      // Load search details
      const { data: searchData, error: searchError } = await supabase
        .from('search_history')
        .select('*')
        .eq('id', id)
        .eq('user_email', userEmail)
        .single();

      if (searchError) throw searchError;

      // Load search results
      const { data: resultsData, error: resultsError } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_history_id', id)
        .order('result_index');

      if (resultsError) throw resultsError;

      return {
        search: searchData,
        results: resultsData?.map(r => r.result_data) || []
      };
    } catch (error) {
      console.error('Error loading search details:', error);
      return null;
    }
  };

  const deleteSearch = async (id: string): Promise<boolean> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_email', userEmail);

      if (error) throw error;

      // Update local state
      setRecentSearches(prev => prev.filter(search => search.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting search:', error);
      return false;
    }
  };

  return {
    recentSearches,
    isLoading,
    saveSearch,
    loadRecentSearches,
    loadSearchDetails,
    deleteSearch
  };
}; 