import type { NextApiRequest, NextApiResponse } from 'next'
import { LinkedInProfileSearchEngine } from '../../data/ai_search'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const search_engine = new LinkedInProfileSearchEngine()
    const results = await search_engine.search(req.body.query, req.body.top_k || 10)
    res.status(200).json({ results })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}