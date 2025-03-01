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

export interface SearchFilters {
  company?: string;
  industry?: string;
  title?: string;
  location?: string;
  school?: string;
}

export interface SearchResult {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  location: string;
  years_experience: number;
  similarity: number;
}

export interface ProfileDetail {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  location: string;
  years_experience: number;
  graduation_year: number;
  estimated_salary: string;
  companies: string[];
  titles: string[];
  industries: string[];
  undergraduate_schools: string[];
  graduate_schools: string[];
  certificate_programs: string[];
  experiences_text: string;
  education_text: string;
}

export class LinkedInProfileSearchEngine {
  private supabase
  private embedder: any = null
  private modelName = 'Xenova/all-MiniLM-L6-v2'
  private embeddingDimension = 1536;

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

  /**
   * @deprecated This method is no longer used as profiles are added through the backend
   */
  async addProfileToDb(profile: Profile) {
    console.warn('addProfileToDb is deprecated - profiles should be added through the backend')
    throw new Error('Method not implemented: profiles should be added through the backend')
  }

  async search(query: string, top_k: number = 10, filters: SearchFilters = {}) {
    try {
      await this.initializeEmbedder()
      
      // Generate query embedding
      const queryEmbedding = await this.embedder(query, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Convert embedding to array format for Supabase
      const embeddingArray = Array.from(queryEmbedding.data)
      
      console.log(`Searching for "${query}" with embedding of length ${embeddingArray.length}`)
      
      // Extract filters
      const { 
        company, 
        industry, 
        title, 
        location, 
        school 
      } = filters;
      
      // Call the hybrid_search function with the embedding and filters
      const { data, error } = await this.supabase.rpc('hybrid_search', {
        query_embedding: embeddingArray,
        similarity_threshold: 0.3,
        company_filter: company || null,
        industry_filter: industry || null,
        title_filter: title || null,
        location_filter: location || null,
        school_filter: school || null,
        limit_count: top_k
      });
      
      if (error) {
        console.error("Error in vector search:", error)
        throw new Error(`Vector search failed: ${error.message}`)
      }
      
      console.log(`Search returned ${data.length} results`)
      
      // Format the results to match your frontend expectations
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        linkedin_url: item.linkedin_url,
        current_company: item.current_company,
        current_title: item.current_title,
        current_industry: item.current_general_industry,
        location: item.current_job_location,
        years_experience: item.years_of_experience,
        similarity: item.similarity
      }));
    } catch (error) {
      console.error("Error in search:", error)
      throw error
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

  async getProfileById(id: number) {
    try {
      const { data, error } = await this.supabase
        .from('lawrenceville_vector')  // Update table name if needed
        .select(`
          id, 
          name, 
          linkedin_url,
          current_company,
          current_title,
          current_general_industry,
          current_job_location,
          years_of_experience,
          graduation_year,
          current_estimated_salary,
          all_companies,
          all_titles,
          all_industries,
          undergraduate_school,
          graduate_school,
          certificate_program,
          natural_language_experiences,
          natural_language_education
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching profile ${id}:`, error)
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }
      
      if (!data) {
        throw new Error(`Profile with ID ${id} not found`)
      }
      
      return {
        id: data.id,
        name: data.name,
        linkedin_url: data.linkedin_url,
        current_company: data.current_company,
        current_title: data.current_title,
        current_industry: data.current_general_industry,
        location: data.current_job_location,
        years_experience: data.years_of_experience,
        graduation_year: data.graduation_year,
        estimated_salary: data.current_estimated_salary,
        companies: data.all_companies || [],
        titles: data.all_titles || [],
        industries: data.all_industries || [],
        undergraduate_schools: data.undergraduate_school || [],
        graduate_schools: data.graduate_school || [],
        certificate_programs: data.certificate_program || [],
        experiences_text: data.natural_language_experiences,
        education_text: data.natural_language_education
      };
    } catch (error) {
      console.error(`Error in getProfileById:`, error)
      throw error
    }
  }
}