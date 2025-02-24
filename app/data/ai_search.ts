import { createClient } from '@supabase/supabase-js'
import { pipeline, Pipeline } from '@xenova/transformers'

interface Profile {
  title?: string
  summary?: string
  industry?: string
  skills?: string[]
  experiences?: Array<{
    title: string
    description?: string
  }>
  location?: string
  years_of_experience?: number
  estimated_salary?: number
  url_link?: string
  name?: string
}

interface SearchResult {
  id: string
  name: string
  title: string
  location: string
  url_link: string
  similarity_score: number
  summary: string
}

export class LinkedInProfileSearchEngine {
  private embedder: any = null
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.initializeEmbedder()
  }

  private async initializeEmbedder() {
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }

  private createProfileText(profile: Profile): string {
    const experiencesText = profile.experiences
      ?.map(exp => `${exp.title} ${exp.description || ''}`)
      .join(' ') || ''

    return `
      ${profile.title || ''}
      ${profile.summary || ''}
      ${profile.industry || ''}
      ${profile.skills?.join(' ') || ''}
      ${experiencesText}
    `.trim()
  }

  private extractEnhancedMetadata(profile: Profile) {
    return {
      location: profile.location || '',
      years_experience: profile.years_of_experience || 0,
      estimated_salary: profile.estimated_salary || 0,
      industry: profile.industry || '',
      url_link: profile.url_link || '',
      name: profile.name || ''
    }
  }

  async addProfileToDb(profile: Profile) {
    try {
      if (!this.embedder) {
        throw new Error('Embedder not initialized')
      }

      const profileText = this.createProfileText(profile)
      const embedding = await this.embedder(profileText, { 
        pooling: 'mean', 
        normalize: true 
      })
      const metadata = this.extractEnhancedMetadata(profile)

      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          profile_data: profile,
          embedding: Array.from(embedding.data),
          ...metadata
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding profile to database:', error)
      throw error
    }
  }

  async search(query: string, top_k: number = 10): Promise<SearchResult[]> {
    try {
      if (!this.embedder) {
        throw new Error('Embedder not initialized')
      }

      const queryEmbedding = await this.embedder(query, { 
        pooling: 'mean', 
        normalize: true 
      })

      const { data: results, error } = await this.supabase
        .rpc('match_profiles', {
          query_embedding: Array.from(queryEmbedding.data),
          match_threshold: 0.7,
          match_count: top_k
        })

      if (error) throw error

      return results.map((result: { 
        id: string;
        profile_data: Profile;
        similarity: number;
      }) => ({
        id: result.id,
        name: result.profile_data.name,
        title: result.profile_data.title,
        location: result.profile_data.location,
        url_link: result.profile_data.url_link,
        similarity_score: result.similarity,
        summary: (result.profile_data.summary || '').slice(0, 200) + '...'
      }))
    } catch (error) {
      console.error('Error performing search:', error)
      throw error
    }
  }
}