import { NextRequest, NextResponse } from 'next/server'
import { LinkedInProfileSearchEngine } from '../../data/ai_search'

export async function POST(req: NextRequest) {
  try {
    const { query, top_k = 10 } = await req.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 })
    }

    const search_engine = new LinkedInProfileSearchEngine()
    const results = await search_engine.search(query, top_k)
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}