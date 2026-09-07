import { useState } from 'react';
import { supabase } from '../app/data/supabase';
import { getUserEmail } from '../app/utils/auth';

export interface RecentActivityItem {
  id: string;
  type: 'search' | 'learn';
  title: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export const useRecentActivity = () => {
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecentActivity = async (limit: number = 10): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/recent-activity?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }
      
      const data = await response.json();
      setRecentActivity(data.activity || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatActivityTitle = (item: RecentActivityItem): string => {
    if (item.type === 'search') {
      return item.title; // Search query
    } else {
      return item.title; // Conversation title
    }
  };

  const formatActivityTime = (created_at: string): string => {
    const now = new Date();
    const activityTime = new Date(created_at);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  return {
    recentActivity,
    isLoading,
    loadRecentActivity,
    formatActivityTitle,
    formatActivityTime
  };
}; 