import { createClient } from '@supabase/supabase-js'
import { env } from 'process';

// Use a dynamic import for the transformers library
const getTransformers = async () => {
  // Use the web version in the browser, node version on the server
  if (typeof window !== 'undefined') {
    return await import('@xenova/transformers/dist/transformers.min.js');
  } else {
    return await import('@xenova/transformers');
  }
};

// Define the Profile interface to match your actual data structure
export interface Experience {
  date: string
  title: string
  company: string
  location?: string
  company_id?: string
  company_size?: string
  company_revenue?: string
  company_industry?: string
}

export interface Education {
  date: string
  school: string
  program: string | null
}

export interface Profile {
  id?: number | string
  name: string
  profile_url: string
  linkedin_url: string
  experiences: Experience[]
  education: Education[]
  location?: string
  current_estimated_salary?: number
  industry?: string
  uncategorized_school?: string[]
  graduate_school?: string[]
  undergraduate_school?: string[]
  certificate_program?: string[]
  years_of_experience?: string
  profile_photo_url?: string
  current_job_location?: string
  high_school?: string[]
  graduation_year?: number
  [key: string]: any // Allow for additional fields
}

export interface SearchResult {
  id: string
  name: string
  title: string
  location: string
  url_link: string
  similarity_score: number
  summary: string
  industry?: string
  years_experience?: number | string
  estimated_salary?: number
  profile_photo_url?: string
  current_job?: string
  current_company?: string
  education?: string
}

export interface SearchFilters {
  company?: string
  industry?: string
  title?: string
  location?: string
  school?: string
}

export class LinkedInProfileSearchEngine {
  private supabase
  private embedder: any = null
  private modelName = 'Xenova/all-MiniLM-L6-v2'

  constructor() {
    console.log('[Engine] Initializing LinkedInProfileSearchEngine');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided as environment variables.')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async initializeEmbedder() {
    try {
      console.log("Initializing embedder with model:", this.modelName);
      
      if (!this.embedder) {
        const { pipeline } = await getTransformers();
        this.embedder = await pipeline('feature-extraction', this.modelName);
        console.log("Embedder initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing embedder:", error);
      throw error;
    }
  }

  // Create a text representation of the profile for embedding
  private createProfileText(profile: Profile): string {
    // Get current job (first experience in the list)
    const currentJob = profile.experiences && profile.experiences.length > 0 
      ? profile.experiences[0] 
      : null

    const parts = [
      `Name: ${profile.name || ''}`,
      `Location: ${profile.location || profile.current_job_location || ''}`,
      `Industry: ${profile.industry || ''}`,
    ]

    // Add current job if available
    if (currentJob) {
      parts.push(`Current Job: ${currentJob.title} at ${currentJob.company}`)
      parts.push(`Company Industry: ${currentJob.company_industry || ''}`)
    }

    // Add experiences
    if (profile.experiences && profile.experiences.length > 0) {
      parts.push('Work Experience:')
      profile.experiences.forEach(exp => {
        parts.push(`  - ${exp.title} at ${exp.company} (${exp.date})`)
      })
    }

    // Add education
    if (profile.education && profile.education.length > 0) {
      parts.push('Education:')
      profile.education.forEach(edu => {
        parts.push(`  - ${edu.school} ${edu.program ? `- ${edu.program}` : ''} (${edu.date})`)
      })
    }

    // Add other education fields if available
    if (profile.undergraduate_school && profile.undergraduate_school.length > 0) {
      parts.push(`Undergraduate: ${profile.undergraduate_school.join(', ')}`)
    }
    
    if (profile.graduate_school && profile.graduate_school.length > 0) {
      parts.push(`Graduate School: ${profile.graduate_school.join(', ')}`)
    }
    
    if (profile.high_school && profile.high_school.length > 0) {
      parts.push(`High School: ${profile.high_school.join(', ')}`)
    }

    return parts.join('\n')
  }

  // Extract metadata for additional filtering
  private extractEnhancedMetadata(profile: Profile) {
    // Convert years_of_experience string to number for database
    let yearsExperience: number | null = null
    if (profile.years_of_experience) {
      if (profile.years_of_experience.includes('-')) {
        // Handle ranges like "3-5 years"
        const range = profile.years_of_experience.split('-')[0]
        yearsExperience = parseInt(range, 10) || null
      } else {
        // Handle direct numbers
        yearsExperience = parseInt(profile.years_of_experience, 10) || null
      }
    }

    return {
      location: profile.location || profile.current_job_location || null,
      years_experience: yearsExperience,
      estimated_salary: profile.current_estimated_salary || null,
      industry: profile.industry || null,
      url_link: profile.linkedin_url || profile.profile_url || null,
      name: profile.name || null
    }
  }

  async addProfileToDb(profile: Profile) {
    try {
      await this.initializeEmbedder()
      
      console.log(`Creating profile text for ${profile.name}...`)
      const profileText = this.createProfileText(profile)
      console.log(`Profile text created, length: ${profileText.length}`)
      
      console.log(`Generating embedding for ${profile.name}...`)
      const embedding = await this.embedder(profileText, { 
        pooling: 'mean', 
        normalize: true 
      })
      console.log(`Embedding generated, dimensions: ${embedding.data.length}`)
      
      console.log(`Extracting metadata for ${profile.name}...`)
      const metadata = this.extractEnhancedMetadata(profile)
      console.log(`Metadata extracted:`, metadata)

      // Extract structured metadata for new columns
      const currentJob = profile.experiences?.[0] || null
      const currentCompany = currentJob?.company || null
      const currentTitle = currentJob?.title || null
      const currentIndustry = currentJob?.company_industry || profile.industry || null
      const location = currentJob?.location || profile.current_job_location || profile.location || null
      
      // Extract years experience as a number
      let yearsExperience: number | null = null
      if (profile.years_of_experience) {
        if (profile.years_of_experience.includes('-')) {
          // Handle ranges like "5-7 years" by taking the average
          const parts = profile.years_of_experience.match(/^(\d+)-(\d+)/)
          if (parts && parts.length >= 3) {
            yearsExperience = Math.floor((parseInt(parts[1]) + parseInt(parts[2])) / 2)
          }
        } else {
          // Handle single values like "5 years"
          const match = profile.years_of_experience.match(/^(\d+)/)
          if (match && match.length >= 2) {
            yearsExperience = parseInt(match[1])
          }
        }
      }
      
      // Extract all companies and industries from experiences
      const allCompanies = profile.experiences?.map(exp => exp.company).filter(Boolean) || []
      const allIndustries = profile.experiences?.map(exp => exp.company_industry).filter(Boolean) || []
      
      // If industry is provided at profile level but not in experiences, add it
      if (profile.industry && !allIndustries.includes(profile.industry)) {
        allIndustries.push(profile.industry)
      }

      console.log(`Inserting profile ${profile.name} into database...`)
      const { data, error } = await this.supabase
        .from('lawrenceville_vector')
        .insert({
          profile_data: profile,
          embedding: Array.from(embedding.data),
          ...metadata,
          // Add structured metadata columns
          current_company: currentCompany,
          current_title: currentTitle,
          current_industry: currentIndustry,
          years_experience: yearsExperience,
          high_school: profile.high_school || [],
          undergraduate_school: profile.undergraduate_school || [],
          graduate_school: profile.graduate_school || [],
          graduation_year: profile.graduation_year,
          all_companies: allCompanies,
          all_industries: allIndustries
        })

      if (error) {
        console.error(`Supabase error for ${profile.name}:`, JSON.stringify(error, null, 2))
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      }
      
      console.log(`Successfully added profile ${profile.name} to database`)
      return data
    } catch (error) {
      console.error(`Error adding profile ${profile.name} to database:`, error)
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`)
        console.error(`Error stack: ${error.stack}`)
      } else {
        console.error(`Non-Error object thrown:`, JSON.stringify(error, null, 2))
      }
      throw error
    }
  }
  async search(query: string, filters: SearchFilters = {}, top_k: number = 10): Promise<SearchResult[]> {
    console.log('[Engine] Search method called with:', { query, filters, top_k });
    
    try {
      await this.initializeEmbedder();
      
      // Generate query embedding
      const queryEmbedding = await this.embedder(query, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Extract potential filter terms from the query
      const queryLower = query.toLowerCase();
      let companyFilter = filters.company;
      let industryFilter = filters.industry;
      let titleFilter = filters.title;
      let locationFilter = filters.location;
      let schoolFilter = filters.school;
      
      // If no explicit filters provided, try to extract from query
      if (!companyFilter && !industryFilter && !titleFilter && !locationFilter && !schoolFilter) {
        // Simple extraction logic - could be made more sophisticated
        if (queryLower.includes('goldman') || queryLower.includes('sachs')) {
          companyFilter = 'Goldman Sachs';
        }
        
        if (queryLower.includes('finance') || queryLower.includes('banking')) {
          industryFilter = 'Financial Services';
        }
        
        // More extraction logic here...
      }
      
      // Call the hybrid search function
      const { data: results, error } = await this.supabase
        .rpc('hybrid_search', {
          query_embedding: Array.from(queryEmbedding.data),
          similarity_threshold: 0.3,
          company_filter: companyFilter,
          industry_filter: industryFilter,
          title_filter: titleFilter,
          location_filter: locationFilter,
          school_filter: schoolFilter,
          limit_count: top_k
        });
        
      if (error) {
        console.error('[Engine] Supabase RPC error:', error);
        throw error;
      }
      
      console.log('[Engine] Search results received:', results ? results.length : 0);
      
      if (!results || results.length === 0) {
        console.log('[Engine] No search results found');
        return [];
      }
      
      console.log('[Engine] Processing search results');
      const processedResults = results.map((result: any) => {
        const profile = result.profile_data;
        const currentJob = profile.experiences && profile.experiences.length > 0 
          ? profile.experiences[0] 
          : null;
          
        // Create a summary from experiences and education
        let summary = '';
        if (currentJob) {
          summary = `Currently ${currentJob.title} at ${currentJob.company}. `;
        }
        
        if (profile.education && profile.education.length > 0) {
          const latestEducation = profile.education[0];
          summary += `Educated at ${latestEducation.school}${latestEducation.program ? ` in ${latestEducation.program}` : ''}.`;
        }
        
        return {
          id: result.id.toString(),
          name: result.name || profile.name || 'Unknown',
          title: currentJob ? currentJob.title : 'No title',
          location: result.location || profile.location || profile.current_job_location || 'Unknown location',
          url_link: result.url_link || profile.linkedin_url || profile.profile_url || '#',
          similarity_score: result.similarity,
          summary: summary || 'No summary available',
          industry: profile.industry,
          years_experience: profile.years_of_experience,
          estimated_salary: profile.current_estimated_salary,
          profile_photo_url: profile.profile_photo_url,
          current_job: currentJob ? currentJob.title : undefined,
          current_company: currentJob ? currentJob.company : undefined,
          education: profile.education && profile.education.length > 0 
            ? `${profile.education[0].school}${profile.education[0].program ? ` - ${profile.education[0].program}` : ''}` 
            : undefined
        };
      });
      
      console.log('[Engine] Search completed successfully');
      return processedResults;
    } catch (error) {
      console.error('[Engine] Error in search method:', error);
      throw error;
    }
  }

  async fixEmbeddingFormat() {
    console.log("Starting embedding format fix...");
    
    try {
      // Fetch profiles with string embeddings
      const { data: profiles, error } = await this.supabase
        .from('lawrenceville_vector')
        .select('id, embedding')
        .not('embedding', 'is', null);
      
      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }
      
      console.log(`Fetched ${profiles.length} profiles to check`);
      let fixedCount = 0;
      
      for (const profile of profiles) {
        // Check if embedding is a string
        if (typeof profile.embedding === 'string') {
          try {
            // Parse the string to get the array
            let embeddingArray;
            if (profile.embedding.startsWith('[') && profile.embedding.endsWith(']')) {
              embeddingArray = JSON.parse(profile.embedding);
            } else {
              console.log(`Skipping profile ${profile.id}: embedding is string but not in JSON format`);
              continue;
            }
            
            // Update the profile with the array embedding
            const { error: updateError } = await this.supabase
              .from('lawrenceville_vector')
              .update({ embedding: embeddingArray })
              .eq('id', profile.id);
            
            if (updateError) {
              console.error(`Error updating profile ${profile.id}:`, updateError);
            } else {
              fixedCount++;
              console.log(`Fixed embedding format for profile ${profile.id}`);
            }
          } catch (parseError) {
            console.error(`Error parsing embedding for profile ${profile.id}:`, parseError);
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} profiles with string embeddings`);
    } catch (error) {
      console.error("Error fixing embedding format:", error);
      throw error;
    }
  }
}