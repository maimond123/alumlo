import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Define interfaces for search filters and results
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

// Interface for the data returned by the hybrid_search function
interface HybridSearchResult {
  id: bigint;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_general_industry: string;
  current_job_location: string;
  years_of_experience: number;
  similarity: number;
}

export class LinkedInProfileSearchEngine {
  private supabase;
  private openai;
  private embeddingDimension = 1536; // OpenAI text-embedding-3-small dimension
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxqxzmcvzzwtqkqoyuti.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REMOVED_CREDENTIAL'
    );
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only use this if you're handling the API key securely
    });
  }
  
  async initializeEmbedder() {
    // No initialization needed for OpenAI API
    console.log("OpenAI embedder ready");
    return;
  }
  
  async search(query: string, top_k: number = 10, filters: SearchFilters = {}): Promise<SearchResult[]> {
    try {
      console.log(`Generating embedding for query: "${query}"`);
      
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      console.log(`Generated embedding with dimension: ${embeddingArray.length}`);
      
      // Extract filters
      const { 
        company, 
        industry, 
        title, 
        location, 
        school 
      } = filters;
      
      console.log(`Searching with filters:`, filters);
      
      // Call the hybrid_search function with the embedding and filters
      const { data, error } = await this.supabase
        .rpc('hybrid_search', {
          query_embedding: embeddingArray,
          similarity_threshold: 0.4,
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          limit_count: top_k
        })
        .returns<HybridSearchResult[]>();
      
      if (error) {
        console.error("Error in vector search:", error);
        throw new Error(`Vector search failed: ${error.message}`);
      }
      
      console.log(`Search returned ${data.length} results`);
      
      // Format the results to match your frontend expectations
      return data.map((item: HybridSearchResult): SearchResult => ({
        id: Number(item.id), // Convert bigint to number
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
      console.error("Error in search:", error);
      throw error;
    }
  }
  
  async getProfileById(id: number, schoolName?: string): Promise<ProfileDetail> {
    try {
      // Determine the table name based on the provided school name or fetch from localStorage
      let tableName: string;
      
      if (schoolName) {
        tableName = `${schoolName}_vector`;
      } else {
        // Try to get the school name from localStorage if running in browser
        const storedSchoolName = typeof window !== 'undefined' ? 
          localStorage.getItem('schoolName') : null;
        
        tableName = storedSchoolName ? 
          `${storedSchoolName}_vector` : 
          'lawrenceville_vector'; // Fallback to default
      }
      
      console.log(`Fetching profile from table: ${tableName}`);
      
      const { data, error } = await this.supabase
        .from(tableName)
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
        console.error(`Error fetching profile ${id}:`, error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Profile with ID ${id} not found`);
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
      console.error(`Error in getProfileById:`, error);
      throw error;
    }
  }
  
  /**
   * @deprecated This method is no longer used as profiles are added through the backend
   */
  async addProfileToDb(profile: any) {
    console.warn('addProfileToDb is deprecated - profiles should be added through the backend');
    throw new Error('Method not implemented: profiles should be added through the backend');
  }
  
  /**
   * Search method specifically for demo purposes that doesn't require authentication
   * and uses a designated public table
   */
  async searchDemoData(query: string, top_k: number = 10): Promise<SearchResult[]> {
    try {
      console.log(`Generating embedding for demo query: "${query}"`);
      
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      console.log(`Generated embedding with dimension: ${embeddingArray.length}`);
      
      // Use the special demo/public table
      const tableName = 'public_alumni_data'; // ← THIS IS THE TABLE NAME TO CREATE
      
      // Call the vector search directly on the demo table
      const { data, error } = await this.supabase
        .rpc('public_alumni_search', { // ← THIS IS THE RPC FUNCTION TO CREATE
          query_embedding: embeddingArray,
          similarity_threshold: 0.4,
          limit_count: top_k
        })
        .returns<HybridSearchResult[]>();
      
      if (error) {
        console.error("Error in demo vector search:", error);
        throw new Error(`Demo vector search failed: ${error.message}`);
      }
      
      console.log(`Demo search returned ${data.length} results`);
      
      // Format the results to match your frontend expectations
      return data.map((item: HybridSearchResult): SearchResult => ({
        id: Number(item.id),
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
      console.error("Error in demo search:", error);
      throw error;
    }
  }
}

// Legacy Profile interface for backward compatibility
export interface Profile {
  name: string;
  profile_url?: string;
  linkedin_url?: string;
  experiences?: any[];
  education?: any[];
  location?: string;
  current_estimated_salary?: number;
  industry?: string;
  uncategorized_school?: string[];
  graduation_year?: number;
  [key: string]: any;
}