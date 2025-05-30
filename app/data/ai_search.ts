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

// UPDATED: Enhanced interface for company search filters with all new options
export interface CompanySearchFilters {
  // Original filters
  company?: string;
  industry?: string;
  title?: string;
  location?: string;
  school?: string;
  exit_year_min?: number;
  exit_year_max?: number;
  
  // NEW: Enhanced text filters
  job_level_filter?: string;
  job_function_filter?: string;
  career_stage_filter?: string;
  degree_level_filter?: string;
  school_tier_filter?: string;
  metro_area_filter?: string;
  
  // NEW: Boolean filters
  leadership_only?: boolean;
  management_exp_only?: boolean;
  technical_background_only?: boolean;
  sales_exp_only?: boolean;
  startup_exp_only?: boolean;
  enterprise_exp_only?: boolean;
  remote_worker_only?: boolean;
  mentor_potential_only?: boolean;
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
  headline: string;
}

// UPDATED: Enhanced interface for company search results with new fields
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
  industry: string;
  headline: string;
  
  // NEW: Enhanced fields from the enhanced search function
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  major_metro_area?: string;
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

// UPDATED: Enhanced interface for the data returned by the enhanced_hybrid_search function
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
  industry: string;
  headline: string;
  
  // NEW: Enhanced fields
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  major_metro_area?: string;
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
  
  // UPDATED: Enhanced searchCompany method using the new enhanced_hybrid_search function
  async searchCompany(query: string, top_k: number = 10, filters: CompanySearchFilters = {}): Promise<CompanySearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🏢 Enhanced searchCompany called with query: "${query}", filters:`, filters);
      
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Extract all filters (original + enhanced)
      const { 
        // Original filters
        company, 
        industry, 
        title, 
        location, 
        school,
        exit_year_min,
        exit_year_max,
        
        // Enhanced text filters
        job_level_filter,
        job_function_filter,
        career_stage_filter,
        degree_level_filter,
        school_tier_filter,
        metro_area_filter,
        
        // Boolean filters
        leadership_only = false,
        management_exp_only = false,
        technical_background_only = false,
        sales_exp_only = false,
        startup_exp_only = false,
        enterprise_exp_only = false,
        remote_worker_only = false,
        mentor_potential_only = false
      } = filters;
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Calling enhanced_hybrid_search RPC function with enhanced filters`);
      
      // Call the enhanced_hybrid_search function with all new parameters
      const { data, error } = await this.supabase
        .rpc('enhanced_hybrid_search', {
          query_embedding: embeddingArray,
          similarity_threshold: 0.3,
          
          // Original filters
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          exit_year_min: exit_year_min || null,
          exit_year_max: exit_year_max || null,
          
          // Enhanced text filters
          job_level_filter: job_level_filter || null,
          job_function_filter: job_function_filter || null,
          career_stage_filter: career_stage_filter || null,
          degree_level_filter: degree_level_filter || null,
          school_tier_filter: school_tier_filter || null,
          metro_area_filter: metro_area_filter || null,
          
          // Boolean filters
          leadership_only,
          management_exp_only,
          technical_background_only,
          sales_exp_only,
          startup_exp_only,
          enterprise_exp_only,
          remote_worker_only,
          mentor_potential_only,
          
          limit_count: top_k
        })
        .returns<HybridSearchCompanyResult[]>();
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] 🏢 Error from enhanced_hybrid_search:`, error);
        throw new Error(`Enhanced company vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] 🏢 enhanced_hybrid_search returned ${data?.length || 0} results`);
      
      // Format the results for company search with enhanced fields
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
        similarity: item.similarity,
        industry: item.industry || '',
        headline: item.headline || '',
        
        // NEW: Enhanced fields
        current_job_level: item.current_job_level,
        current_job_function: item.current_job_function,
        career_stage: item.career_stage,
        highest_degree_level: item.highest_degree_level,
        school_ranking_tier: item.school_ranking_tier,
        major_metro_area: item.major_metro_area
      }));
    } catch (error) {
      throw error;
    }
  }
  
  // ... rest of the existing methods remain unchanged ...
  
  async search(query: string, top_k: number = 10, filters: SearchFilters = {}, isDemo: boolean = false, schoolName?: string): Promise<SearchResult[]> {
    try {
      // Check if this is a chick_fil_a case (company search)
      // Use the provided schoolName parameter first, then fall back to localStorage
      const storedSchoolName = schoolName || (typeof window !== 'undefined' ? 
        localStorage.getItem('schoolName') : null);
      
      console.log(`[AI_SEARCH DEBUG] isDemo: ${isDemo}, storedSchoolName: "${storedSchoolName}" (from ${schoolName ? 'parameter' : 'localStorage'})`);
      console.log(`[AI_SEARCH DEBUG] Checking condition: !isDemo (${!isDemo}) && storedSchoolName === 'chick_fil_a' (${storedSchoolName === 'chick_fil_a'})`);
      
      if (!isDemo && storedSchoolName === 'chick_fil_a') {
        console.log(`[AI_SEARCH DEBUG] ✅ USING ENHANCED COMPANY SEARCH for chick_fil_a`);
        
        // Use enhanced company search for chick_fil_a with basic filters
        const companyFilters: CompanySearchFilters = {
          company: filters.company,
          industry: filters.industry,
          title: filters.title,
          location: filters.location,
          school: filters.school
          // Note: Boolean filters are set to false by default, can be enhanced later in UI
        };
        
        console.log(`[AI_SEARCH DEBUG] Calling enhanced searchCompany with filters:`, companyFilters);
        const companyResults = await this.searchCompany(query, top_k, companyFilters);
        
        console.log(`[AI_SEARCH DEBUG] 🏢 Enhanced company results before conversion:`, companyResults.map(r => ({
          id: r.id,
          name: r.name,
          current_job_level: r.current_job_level,
          career_stage: r.career_stage,
          highest_degree_level: r.highest_degree_level
        })));
        
        // Enhanced enrichment with additional data if needed
        const enrichedResults = await Promise.all(companyResults.map(async (item: CompanySearchResult) => {
          try {
            // Enhanced headline construction with new data
            let constructedHeadline = '';
            
            if (item.current_job_level && item.post_company_current_title && item.post_company_current_company) {
              constructedHeadline = `${item.current_job_level} ${item.post_company_current_title} • ${item.post_company_current_company}`;
            } else if (item.post_company_current_title && item.post_company_current_company) {
              constructedHeadline = `${item.post_company_current_title} • ${item.post_company_current_company}`;
            }
            
            // Add career stage and education info if available
            const additionalInfo = [];
            if (item.career_stage) additionalInfo.push(item.career_stage);
            if (item.highest_degree_level) additionalInfo.push(item.highest_degree_level);
            if (item.major_metro_area) additionalInfo.push(item.major_metro_area);
            
            if (additionalInfo.length > 0) {
              constructedHeadline += ` | ${additionalInfo.join(' • ')}`;
            }
            
            return {
              ...item,
              industry: item.post_company_current_industry || '',
              headline: constructedHeadline
            };
          } catch (error) {
            console.warn(`[AI_SEARCH DEBUG] Error enriching enhanced result for ID ${item.profile_id}:`, error);
            return item;
          }
        }));
        
        // Convert enhanced company results to regular search results format for compatibility
        const convertedResults = enrichedResults.map((item: CompanySearchResult): SearchResult => {
          console.log(`[AI_SEARCH DEBUG] 🏢 Converting enhanced item - job_level: "${item.current_job_level}", career_stage: "${item.career_stage}"`);
          
          return {
            id: item.id,
            name: item.name,
            linkedin_url: item.profile_url,
            current_company: item.post_company_current_company,
            current_title: item.post_company_current_title,
            current_industry: item.industry,
            current_general_industry: item.post_company_current_industry,
            current_job_location: item.post_company_current_location,
            years_experience: 0, // Not applicable for company data
            profile_photo_url: item.picture_url,
            similarity: item.similarity,
            headline: item.headline
          };
        });
        
        console.log(`[AI_SEARCH DEBUG] ✅ Enhanced company search completed, returning ${convertedResults.length} results`);
        return convertedResults;
      }
      
      console.log(`[AI_SEARCH DEBUG] ❌ NOT using company search, falling back to regular search`);
      console.log(`[AI_SEARCH DEBUG] Reason: isDemo=${isDemo}, storedSchoolName="${storedSchoolName}"`);
      
      // ... rest of the existing search method remains unchanged ...
      
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
      console.log(`[AI_SEARCH DEBUG] Using RPC function: ${rpcFunction}`);
      
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
        console.error(`[AI_SEARCH DEBUG] Error from ${rpcFunction}:`, error);
        throw new Error(`Vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] ${rpcFunction} returned ${data?.length || 0} results`);
      
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
        similarity: item.similarity,
        headline: ''
      }));
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] Search method error:`, error);
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