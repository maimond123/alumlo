import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../data/supabase';
import { getUserEmail } from '../../utils/auth';

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeResults = searchParams.get('includeResults') === 'true';

    let query = supabase
      .from('search_history')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: searches, error } = await query;

    if (error) {
      console.error('Error fetching search history:', error);
      return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
    }

    // If includeResults is true, fetch results for each search
    if (includeResults && searches) {
      const searchesWithResults = await Promise.all(
        searches.map(async (search) => {
          const { data: results, error: resultsError } = await supabase
            .from('search_results')
            .select('*')
            .eq('search_history_id', search.id)
            .order('result_index');

          if (resultsError) {
            console.error('Error fetching search results:', resultsError);
            return { ...search, results: [] };
          }

          return {
            ...search,
            results: results?.map(r => r.result_data) || []
          };
        })
      );

      return NextResponse.json({ searches: searchesWithResults });
    }

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error in search history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, results, metadata } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Save search history
    const { data: searchHistory, error: searchError } = await supabase
      .from('search_history')
      .insert([{
        user_email: userEmail,
        query,
        result_count: results?.length || 0,
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (searchError) {
      console.error('Error saving search history:', searchError);
      return NextResponse.json({ error: 'Failed to save search history' }, { status: 500 });
    }

    // Save search results if provided
    if (results && results.length > 0) {
      const resultsToInsert = results.map((result: any, index: number) => ({
        search_history_id: searchHistory.id,
        result_data: result,
        result_index: index
      }));

      const { error: resultsError } = await supabase
        .from('search_results')
        .insert(resultsToInsert);

      if (resultsError) {
        console.error('Error saving search results:', resultsError);
        return NextResponse.json({ error: 'Failed to save search results' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      searchId: searchHistory.id 
    });
  } catch (error) {
    console.error('Error in search history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('id');

    if (!searchId) {
      return NextResponse.json({ error: 'Search ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', searchId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error deleting search history:', error);
      return NextResponse.json({ error: 'Failed to delete search history' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in search history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 