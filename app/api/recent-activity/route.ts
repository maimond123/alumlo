import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../data/supabase';
import { getUserEmail } from '../../utils/auth';

interface RecentActivityItem {
  id: string;
  type: 'search' | 'learn';
  title: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Load recent searches
    const { data: searches, error: searchError } = await supabase
      .from('search_history')
      .select('id, query, created_at, metadata')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (searchError) {
      console.error('Error fetching search history:', searchError);
      return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
    }

    // Load recent learn conversations
    const { data: conversations, error: convError } = await supabase
      .from('learn_conversations')
      .select('id, title, updated_at')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Combine and sort by date
    const combinedActivity: RecentActivityItem[] = [
      ...(searches || []).map(search => ({
        id: search.id,
        type: 'search' as const,
        title: search.query,
        created_at: search.created_at,
        metadata: search.metadata
      })),
      ...(conversations || []).map(conv => ({
        id: conv.id,
        type: 'learn' as const,
        title: conv.title,
        created_at: conv.updated_at,
        metadata: {}
      }))
    ];

    // Sort by date and take the most recent items
    combinedActivity.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const recentActivity = combinedActivity.slice(0, limit);

    return NextResponse.json({ 
      activity: recentActivity,
      total: combinedActivity.length 
    });
  } catch (error) {
    console.error('Error in recent activity API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 