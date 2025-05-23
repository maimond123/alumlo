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

// Add new interface for company search filters (only for company cases like chick_fil_a)
export interface CompanySearchFilters {
  company?: string;
  industry?: string;
  title?: string;
  location?: string;
  school?: string;
  exit_year_min?: number;
  exit_year_max?: number;
}

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
}

// Add new interface for company search results
export interface CompanySearchResult {
  id: number;
  profile_id: number;
  name: string;
  profile_url: string;
  post_company_current_company: string;
  post_company_current_title: string;
  post_company_current_industry: string;
  post_company_current_location: string;
  company_exit_year: number;
  picture_url?: string;
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
  profile_photo_url?: string;
}

// Add new interface for the data returned by the hybrid_search_company function
interface HybridSearchCompanyResult {
  id: bigint;
  profile_id: bigint;
  name: string;
  profile_url: string;
  post_company_current_company: string;
  post_company_current_title: string;
  post_company_current_industry: string;
  post_company_current_location: string;
  company_exit_year: number;
  picture_url?: string;
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
    return;
  }
  
  // Add new method for company search (only used for chick_fil_a case)
  async searchCompany(query: string, top_k: number = 10, filters: CompanySearchFilters = {}): Promise<CompanySearchResult[]> {
    try {
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Extract company-specific filters
      const { 
        company, 
        industry, 
        title, 
        location, 
        school,
        exit_year_min,
        exit_year_max
      } = filters;
      
      // Call the hybrid_search_company function
      const { data, error } = await this.supabase
        .rpc('hybrid_search_company', {
          query_embedding: embeddingArray,
          similarity_threshold: 0.3,
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          exit_year_min: exit_year_min || null,
          exit_year_max: exit_year_max || null,
          limit_count: top_k
        })
        .returns<HybridSearchCompanyResult[]>();
      
      if (error) {
        throw new Error(`Company vector search failed: ${error.message}`);
      }
      
      // Format the results for company search
      return data.map((item: HybridSearchCompanyResult): CompanySearchResult => ({
        id: Number(item.id),
        profile_id: Number(item.profile_id),
        name: item.name,
        profile_url: item.profile_url,
        post_company_current_company: item.post_company_current_company,
        post_company_current_title: item.post_company_current_title,
        post_company_current_industry: item.post_company_current_industry,
        post_company_current_location: item.post_company_current_location,
        company_exit_year: item.company_exit_year,
        picture_url: item.picture_url,
        similarity: item.similarity
      }));
    } catch (error) {
      throw error;
    }
  }
  
  async search(query: string, top_k: number = 10, filters: SearchFilters = {}, isDemo: boolean = false): Promise<SearchResult[]> {
    try {
      // Check if this is a chick_fil_a case (company search)
      const storedSchoolName = typeof window !== 'undefined' ? 
        localStorage.getItem('schoolName') : null;
      
      if (!isDemo && storedSchoolName === 'chick_fil_a') {
        // Use company search for chick_fil_a
        const companyFilters: CompanySearchFilters = {
          company: filters.company,
          industry: filters.industry,
          title: filters.title,
          location: filters.location,
          school: filters.school
        };
        
        const companyResults = await this.searchCompany(query, top_k, companyFilters);
        
        // Convert company results to regular search results format for compatibility
        return companyResults.map((item: CompanySearchResult): SearchResult => ({
          id: item.id,
          name: item.name,
          linkedin_url: item.profile_url, // Map profile_url to linkedin_url
          current_company: item.post_company_current_company,
          current_title: item.post_company_current_title,
          current_industry: item.post_company_current_industry,
          current_general_industry: item.post_company_current_industry,
          current_job_location: item.post_company_current_location,
          years_experience: 0, // Not applicable for company data
          profile_photo_url: item.picture_url,
          similarity: item.similarity
        }));
      }
      
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Extract filters
      const { 
        company, 
        industry, 
        title, 
        location, 
        school 
      } = filters;
      
      // Determine the RPC function to call based on whether it's a demo search
      const rpcFunction = isDemo ? 'hybrid_search_demo' : 'hybrid_search';
      
      // Call the appropriate hybrid_search function with the embedding and filters
      const { data, error } = await this.supabase
        .rpc(rpcFunction, {
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
        throw new Error(`Vector search failed: ${error.message}`);
      }
      
      // Format the results to match your frontend expectations
      return data.map((item: HybridSearchResult): SearchResult => ({
        id: Number(item.id),
        name: item.name,
        linkedin_url: item.linkedin_url,
        current_company: item.current_company,
        current_title: item.current_title,
        current_industry: item.current_general_industry,
        current_general_industry: item.current_general_industry,
        current_job_location: item.current_job_location,
        years_experience: item.years_of_experience,
        profile_photo_url: item.profile_photo_url,
        similarity: item.similarity
      }));
    } catch (error) {
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
        
        if (!storedSchoolName) {
          throw new Error('School name is required but not provided');
        }
        
        tableName = `${storedSchoolName}_vector`;
      }
      
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
      throw error;
    }
  }
  
  /**
   * @deprecated This method is no longer used as profiles are added through the backend
   */
  async addProfileToDb(profile: any) {
    throw new Error('Method not implemented: profiles should be added through the backend');
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