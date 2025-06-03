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

// Enhanced company search filters to match new table structure
export interface CompanySearchFilters {
  company?: string;
  industry?: string;
  title?: string;
  location?: string;
  school?: string;
  exit_year_min?: number;
  exit_year_max?: number;
  // NEW: Enhanced boolean filters
  leadership_only?: boolean;
  management_exp_only?: boolean;
  technical_background_only?: boolean;
  sales_exp_only?: boolean;
  startup_exp_only?: boolean;
  enterprise_exp_only?: boolean;
  remote_worker_only?: boolean;
  mentor_potential_only?: boolean;
  // NEW: Enhanced categorical filters
  job_level_filter?: string;
  job_function_filter?: string;
  career_stage_filter?: string;
  degree_level_filter?: string;
  school_tier_filter?: string;
  metro_area_filter?: string;
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

// Updated company search results interface to match new table structure
export interface CompanySearchResult {
  id: number;
  profile_id: number;
  name: string;
  profile_url: string;
  post_company_current_company: string;
  post_company_current_title: string;
  post_company_current_industry: string;
  post_company_current_location: string;
  // NEW: Alias fields for easier access
  current_company: string;
  current_title: string;
  current_job_location: string;
  // NEW: Dynamic company exit year field
  company_exit_year: number;
  picture_url?: string;
  similarity: number;
  industry: string;
  headline: string;
  // NEW: Enhanced metadata fields
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  major_metro_area?: string;
  is_current_leader?: boolean;
  management_experience?: boolean;
  technical_background?: boolean;
  years_since_company?: number;
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
  // NEW: Enhanced profile fields
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  major_metro_area?: string;
  functional_expertise?: string[];
  industry_expertise?: string[];
  natural_language_career_progression?: string;
  natural_language_functional_expertise?: string;
  natural_language_educational_profile?: string;
  natural_language_company_experience?: string;
  natural_language_geographic_profile?: string;
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

// Updated interface for enhanced hybrid search company function
interface HybridSearchCompanyResult {
  id: bigint;
  profile_id: bigint;
  name: string;
  profile_url: string;
  post_company_current_company: string;
  post_company_current_title: string;
  post_company_current_industry: string;
  post_company_current_location: string;
  // NEW: Alias fields
  current_company: string;
  current_title: string;
  current_job_location: string;
  // NEW: Dynamic company exit year field (will be resolved at runtime)
  company_exit_year: number;
  picture_url?: string;
  similarity: number;
  industry: string;
  headline: string;
  // NEW: Enhanced metadata fields
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  major_metro_area?: string;
}

// Add temporal interfaces at the top:
export interface TemporalSearchFilters {
  target_company_year?: number;
  subsequent_function?: string;
  subsequent_year?: number;
  company_years_filter?: number[];
  functions_filter?: string[];
  exit_year_min?: number;
  exit_year_max?: number;
}

export interface TemporalSearchResult {
  id: number;
  profile_id: number;
  name: string;
  career_timeline: any;
  company_years_list: number[];
  post_company_current_company: string;
  post_company_current_title: string;
  company_exit_year: number;
  similarity: number;
}

export class LinkedInProfileSearchEngine {
  private supabase;
  private openai;
  private embeddingDimension = 1536; // OpenAI text-embedding-3-small dimension
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async initializeEmbedder() {
    console.log('[AI_SEARCH DEBUG] Embedder initialized (using OpenAI API)');
  }
  
  /**
   * Apply gap-based filtering to search results
   * Returns results above 0.4 threshold but stops when similarity drops significantly
   */
  private applyGapBasedFiltering<T extends { similarity: number }>(results: T[]): T[] {
    console.log(`[GAP_FILTER DEBUG] Processing ${results.length} results for gap-based filtering`);
    
    if (!results.length) return results;

    // Sort by similarity descending (should already be sorted from DB, but ensuring)
    const sortedResults = [...results].sort((a, b) => b.similarity - a.similarity);
    
    // Filter results above 0.4 threshold first
    const aboveThreshold = sortedResults.filter(r => r.similarity >= 0.4);
    console.log(`[GAP_FILTER DEBUG] ${aboveThreshold.length} results above 0.4 threshold`);
    
    if (aboveThreshold.length === 0) {
      console.log(`[GAP_FILTER DEBUG] No results above 0.4 threshold, returning empty array`);
      return [];
    }

    if (aboveThreshold.length === 1) {
      console.log(`[GAP_FILTER DEBUG] Only 1 result above threshold, returning it`);
      return aboveThreshold;
    }

    // Apply gap detection
    const finalResults: T[] = [aboveThreshold[0]]; // Always include the best result
    let previousSimilarity = aboveThreshold[0].similarity;
    
    for (let i = 1; i < aboveThreshold.length; i++) {
      const currentResult = aboveThreshold[i];
      const gap = previousSimilarity - currentResult.similarity;
      
      console.log(`[GAP_FILTER DEBUG] Result ${i}: similarity=${currentResult.similarity.toFixed(3)}, gap=${gap.toFixed(3)}`);
      
      // Stop if we detect a significant gap (0.1 seems reasonable for similarity scores)
      if (gap > 0.1) {
        console.log(`[GAP_FILTER DEBUG] Significant gap detected (${gap.toFixed(3)}), stopping at ${finalResults.length} results`);
        break;
      }
      
      finalResults.push(currentResult);
      previousSimilarity = currentResult.similarity;
    }
    
    console.log(`[GAP_FILTER DEBUG] Final result count: ${finalResults.length} (started with ${results.length})`);
    return finalResults;
  }
  
  // Enhanced company search method with new filters and dynamic function name
  async searchCompany(query: string, top_k: number = 10, filters: CompanySearchFilters = {}): Promise<CompanySearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🏢 searchCompany called with query: "${query}", filters:`, filters);
      
      // Generate embedding using OpenAI API
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Extract enhanced company-specific filters
      const { 
        company, 
        industry, 
        title, 
        location, 
        school,
        exit_year_min,
        exit_year_max,
        // NEW: Enhanced boolean filters
        leadership_only,
        management_exp_only,
        technical_background_only,
        sales_exp_only,
        startup_exp_only,
        enterprise_exp_only,
        remote_worker_only,
        mentor_potential_only,
        // NEW: Enhanced categorical filters
        job_level_filter,
        job_function_filter,
        career_stage_filter,
        degree_level_filter,
        school_tier_filter,
        metro_area_filter
      } = filters;
      
      // Determine organization name for dynamic function name
      const storedOrganizationName = typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null;
      
      if (!storedOrganizationName) {
        throw new Error('Organization name is required for enhanced search');
      }
      
      // Create SQL-safe organization name (same logic as Python script)
      const sqlSafeOrgName = storedOrganizationName.toLowerCase()
        .replace(/\s+alumni$/i, '') // Remove " alumni" suffix
        .replace(/alumni$/i, '') // Remove "alumni" suffix
        .replace(/[^a-zA-Z0-9_]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/^([^a-zA-Z_])/, '_$1'); // Ensure starts with letter or underscore
      
      const enhancedSearchFunction = `enhanced_hybrid_search_${sqlSafeOrgName}`;
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Calling ${enhancedSearchFunction} RPC function`);
      
      // Call the enhanced hybrid search function with all new parameters
      const { data, error } = await this.supabase
        .rpc(enhancedSearchFunction, {
          query_embedding: embeddingArray,
          similarity_threshold: 0.3, // Keep lower threshold for more candidates
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          job_level_filter: job_level_filter || null,
          job_function_filter: job_function_filter || null,
          // Boolean filters
          leadership_only: leadership_only || false,
          management_exp_only: management_exp_only || false,
          technical_background_only: technical_background_only || false,
          sales_exp_only: sales_exp_only || false,
          startup_exp_only: startup_exp_only || false,
          enterprise_exp_only: enterprise_exp_only || false,
          remote_worker_only: remote_worker_only || false,
          // Enhanced filters
          career_stage_filter: career_stage_filter || null,
          degree_level_filter: degree_level_filter || null,
          school_tier_filter: school_tier_filter || null,
          metro_area_filter: metro_area_filter || null,
          mentor_potential_only: mentor_potential_only || false,
          // Range filters
          exit_year_min: exit_year_min || null,
          exit_year_max: exit_year_max || null,
          limit_count: 50 // Increase limit to get more candidates for gap-based filtering
        });
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] 🏢 Error from ${enhancedSearchFunction}:`, error);
        throw new Error(`Enhanced company vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] 🏢 ${enhancedSearchFunction} returned ${data?.length || 0} results`);
      
      // Format the results for company search with enhanced fields
      const formattedResults = data.map((item: any): CompanySearchResult => ({
        id: Number(item.id),
        profile_id: Number(item.profile_id),
        name: item.name,
        profile_url: item.profile_url,
        post_company_current_company: item.post_company_current_company,
        post_company_current_title: item.post_company_current_title,
        post_company_current_industry: item.post_company_current_industry,
        post_company_current_location: item.post_company_current_location,
        // NEW: Alias fields
        current_company: item.current_company,
        current_title: item.current_title,
        current_job_location: item.current_job_location,
        // Dynamic company exit year field
        company_exit_year: item[`${sqlSafeOrgName}_exit_year`] || item.company_exit_year,
        picture_url: item.picture_url,
        similarity: item.similarity,
        industry: item.industry || '',
        headline: item.headline || '',
        // NEW: Enhanced metadata fields
        current_job_level: item.current_job_level,
        current_job_function: item.current_job_function,
        career_stage: item.career_stage,
        highest_degree_level: item.highest_degree_level,
        school_ranking_tier: item.school_ranking_tier,
        major_metro_area: item.major_metro_area,
        is_current_leader: item.is_current_leader,
        management_experience: item.management_experience,
        technical_background: item.technical_background,
        years_since_company: item[`years_since_${sqlSafeOrgName}`]
      }));

      // Apply gap-based filtering
      const filteredResults: CompanySearchResult[] = this.applyGapBasedFiltering(formattedResults);
      console.log(`[AI_SEARCH DEBUG] 🏢 Gap-based filtering reduced results from ${formattedResults.length} to ${filteredResults.length}`);
      
      return filteredResults;
    } catch (error) {
      throw error;
    }
  }
  
  // Enhanced temporal search with dynamic function names
  async searchTemporal(
    query: string, 
    temporalElements: any, 
    top_k: number = 10
  ): Promise<TemporalSearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🕐 searchTemporal called with:`, temporalElements);
      
      // Generate embedding
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Extract temporal parameters
      const years = temporalElements.years || [];
      const functions = temporalElements.functions || [];
      
      // Determine organization name for dynamic function names
      const storedOrganizationName = typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null;
      
      if (!storedOrganizationName) {
        throw new Error('Organization name is required for temporal search');
      }
      
      // Create SQL-safe organization name
      const sqlSafeOrgName = storedOrganizationName.toLowerCase()
        .replace(/\s+alumni$/i, '') // Remove " alumni" suffix
        .replace(/alumni$/i, '') // Remove "alumni" suffix
        .replace(/[^a-zA-Z0-9_]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/^([^a-zA-Z_])/, '_$1'); // Ensure starts with letter or underscore
      
      const temporalCareerFunction = `temporal_career_search_${sqlSafeOrgName}`;
      const temporalFilterFunction = `temporal_filter_search_${sqlSafeOrgName}`;
      
      // Try specific sequence search first
      if (years.length >= 2 && functions.length >= 1) {
        console.log(`[AI_SEARCH DEBUG] 🕐 Using sequence search: Company in ${years[0]}, then ${functions[0]} in ${years[1]}`);
        
        const { data, error } = await this.supabase
          .rpc(temporalCareerFunction, {
            target_company_year: years[0],
            subsequent_function: functions[0],
            subsequent_year: years[1],
            query_embedding: embeddingArray,
            similarity_threshold: 0.3, // Keep lower threshold for more candidates
            limit_count: 50 // Increase limit for gap-based filtering
          });
        
        if (error) {
          console.error(`[AI_SEARCH DEBUG] 🕐 Sequence search error:`, error);
          throw new Error(`Temporal sequence search failed: ${error.message}`);
        }
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Sequence search returned ${data?.length || 0} results`);
        
        // Apply gap-based filtering to sequence search results
        if (data && data.length > 0) {
          // Format results with dynamic field names
          const formattedResults = data.map((item: any): TemporalSearchResult => ({
            id: Number(item.id),
            profile_id: Number(item.profile_id),
            name: item.name,
            career_timeline: item.career_timeline,
            company_years_list: item[`${sqlSafeOrgName}_years_list`] || [],
            post_company_current_company: item.post_company_current_company,
            post_company_current_title: item.post_company_current_title,
            company_exit_year: item[`${sqlSafeOrgName}_exit_year`] || 0,
            similarity: item.similarity
          }));
          
          const filteredResults: TemporalSearchResult[] = this.applyGapBasedFiltering(formattedResults);
          console.log(`[AI_SEARCH DEBUG] 🕐 Gap-based filtering reduced sequence results from ${data.length} to ${filteredResults.length}`);
          return filteredResults;
        }
      }
      
      // Fallback to general temporal filter search
      if (years.length >= 1 || functions.length >= 1) {
        console.log(`[AI_SEARCH DEBUG] 🕐 Using general temporal filter search`);
        
        const { data, error } = await this.supabase
          .rpc(temporalFilterFunction, {
            query_embedding: embeddingArray,
            similarity_threshold: 0.3, // Keep lower threshold for more candidates
            company_years_filter: years.length > 0 ? years : null,
            functions_filter: functions.length > 0 ? functions : null,
            limit_count: 50 // Increase limit for gap-based filtering
          });
        
        if (error) {
          console.error(`[AI_SEARCH DEBUG] 🕐 Temporal filter error:`, error);
          throw new Error(`Temporal filter search failed: ${error.message}`);
        }
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Temporal filter returned ${data?.length || 0} results`);
        
        // Apply gap-based filtering to filter search results
        if (data && data.length > 0) {
          // Format results with dynamic field names
          const formattedResults = data.map((item: any): TemporalSearchResult => ({
            id: Number(item.id),
            profile_id: Number(item.profile_id),
            name: item.name,
            career_timeline: item.career_timeline,
            company_years_list: item[`${sqlSafeOrgName}_years_list`] || [],
            post_company_current_company: item.post_company_current_company,
            post_company_current_title: item.post_company_current_title,
            company_exit_year: item[`${sqlSafeOrgName}_exit_year`] || 0,
            similarity: item.similarity
          }));
          
          const filteredResults: TemporalSearchResult[] = this.applyGapBasedFiltering(formattedResults);
          console.log(`[AI_SEARCH DEBUG] 🕐 Gap-based filtering reduced filter results from ${data.length} to ${filteredResults.length}`);
          return filteredResults;
        }
      }
      
      console.log(`[AI_SEARCH DEBUG] 🕐 Insufficient temporal data, returning empty results`);
      return [];
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] 🕐 Temporal search error:`, error);
      throw error;
    }
  }
  
  async search(
    query: string, 
    top_k: number = 10, 
    filters: SearchFilters = {}, 
    isDemo: boolean = false, 
    organizationName?: string,
    queryClassification?: any
  ): Promise<SearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🔍 search called with classification:`, queryClassification);
      
      // Determine the organization name dynamically (same pattern as rest of file)
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      console.log(`[AI_SEARCH DEBUG] isDemo: ${isDemo}, storedOrganizationName: "${storedOrganizationName}"`);
      
      // TEMPORAL ROUTING - Check for temporal classification first (NON-DEMO ONLY)
      if (queryClassification?.type === 'temporal' && 
          queryClassification?.temporal_elements && 
          !isDemo && 
          storedOrganizationName) {
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Temporal query detected for ${storedOrganizationName}, routing to temporal search`);
        
        try {
          const temporalResults = await this.searchTemporal(
            query, 
            queryClassification.temporal_elements, 
            top_k
          );
          
          if (temporalResults.length > 0) {
            // Convert temporal results to standard format
            const convertedResults = await Promise.all(temporalResults.map(async (item): Promise<SearchResult> => {
              // Try to fetch additional profile data using NEW naming convention
              let linkedinUrl = '';
              let headline = '';
              let industry = '';
              
              try {
                // NEW naming convention: organizationName_alumni_vector
                const vectorTableName = `${storedOrganizationName}_alumni_vector`;
                
                const { data: profileData, error } = await this.supabase
                  .from(vectorTableName)
                  .select('profile_url, headline, industry')
                  .eq('profile_id', item.profile_id)
                  .single();
                
                if (!error && profileData) {
                  linkedinUrl = profileData.profile_url || '';
                  headline = profileData.headline || '';
                  industry = profileData.industry || '';
                }
              } catch (error) {
                console.warn(`[AI_SEARCH DEBUG] Could not fetch additional data for profile ${item.profile_id}`);
              }
              
              // Construct headline if not available
              if (!headline && item.post_company_current_title && item.post_company_current_company) {
                headline = `${item.post_company_current_title} • ${item.post_company_current_company}`;
              }
              
              return {
                id: item.id,
                name: item.name,
                linkedin_url: linkedinUrl,
                current_company: item.post_company_current_company || '',
                current_title: item.post_company_current_title || '',
                current_industry: industry,
                current_general_industry: industry,
                current_job_location: '',
                years_experience: 0,
                similarity: item.similarity,
                headline: headline
              };
            }));
            
            console.log(`[AI_SEARCH DEBUG] 🕐 Temporal search completed, returning ${convertedResults.length} results`);
            return convertedResults;
          } else {
            console.log(`[AI_SEARCH DEBUG] 🕐 Temporal search returned no results, falling back to standard search`);
          }
        } catch (error) {
          console.log(`[AI_SEARCH DEBUG] 🕐 Temporal search failed, falling back to standard search:`, error);
        }
      }
      
      // ENHANCED COMPANY SEARCH - Updated to use enhanced search
      console.log(`[AI_SEARCH DEBUG] 📊 Using enhanced company search`);
      
      // Check if this is a non-demo search
      if (!isDemo && storedOrganizationName) {
        console.log(`[AI_SEARCH DEBUG] ✅ USING ENHANCED COMPANY SEARCH for ${storedOrganizationName}`);
        
        // Use enhanced company search with new filters
        const companyFilters: CompanySearchFilters = {
          company: filters.company,
          industry: filters.industry,
          title: filters.title,
          location: filters.location,
          school: filters.school
          // Enhanced filters can be added based on query classification or user input
        };
        
        console.log(`[AI_SEARCH DEBUG] Calling enhanced searchCompany with filters:`, companyFilters);
        const companyResults = await this.searchCompany(query, top_k, companyFilters);
        
        console.log(`[AI_SEARCH DEBUG] 🏢 Enhanced company results before conversion:`, companyResults.map(r => ({
          id: r.id,
          name: r.name,
          industry: r.industry,
          headline: r.headline,
          current_job_level: r.current_job_level,
          career_stage: r.career_stage
        })));
        
        // Convert enhanced company results to regular search results format for compatibility
        const convertedResults = companyResults.map((item: CompanySearchResult): SearchResult => {
          console.log(`[AI_SEARCH DEBUG] 🏢 Converting enhanced item - industry: "${item.industry}", headline: "${item.headline}"`);
          
          // Construct headline from available data
          let constructedHeadline = item.headline;
          if (!constructedHeadline && item.post_company_current_title && item.post_company_current_company) {
            constructedHeadline = `${item.post_company_current_title} • ${item.post_company_current_company}`;
          }
          
          return {
            id: item.id,
            name: item.name,
            linkedin_url: item.profile_url, // Map profile_url to linkedin_url
            current_company: item.current_company || item.post_company_current_company,
            current_title: item.current_title || item.post_company_current_title,
            current_industry: item.industry,
            current_general_industry: item.post_company_current_industry,
            current_job_location: item.current_job_location || item.post_company_current_location,
            years_experience: 0, // Not applicable for company data
            profile_photo_url: item.picture_url,
            similarity: item.similarity,
            headline: constructedHeadline
          };
        });
        
        console.log(`[AI_SEARCH DEBUG] ✅ Enhanced company search completed, returning ${convertedResults.length} results`);
        return convertedResults;
      }
      
      console.log(`[AI_SEARCH DEBUG] ❌ NOT using enhanced company search, falling back to regular search`);
      console.log(`[AI_SEARCH DEBUG] Reason: isDemo=${isDemo}, storedOrganizationName="${storedOrganizationName}"`);
      
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
          similarity_threshold: 0.3, // Keep lower threshold for more candidates
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          limit_count: 50 // Increase limit to get more candidates for gap-based filtering
        });
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] Error from ${rpcFunction}:`, error);
        throw new Error(`Vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] ${rpcFunction} returned ${data?.length || 0} results`);
      
      // Format the results to match your frontend expectations
      const formattedResults = data.map((item: HybridSearchResult): SearchResult => ({
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

      // Apply gap-based filtering
      const filteredResults: SearchResult[] = this.applyGapBasedFiltering(formattedResults);
      console.log(`[AI_SEARCH DEBUG] ${rpcFunction} gap-based filtering reduced results from ${formattedResults.length} to ${filteredResults.length}`);
      
      return filteredResults;
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] Search method error:`, error);
      throw error;
    }
  }
  
  // Enhanced profile fetching with new fields
  async getProfileById(id: number, organizationName?: string): Promise<ProfileDetail> {
    try {
      // Determine the table name using NEW naming convention
      let tableName: string;
      
      if (organizationName) {
        tableName = `${organizationName}_alumni_vector`;
      } else {
        // Try to get the organization name from localStorage if running in browser
        const storedOrganizationName = typeof window !== 'undefined' ? 
          localStorage.getItem('organizationName') : null;
        
        if (!storedOrganizationName) {
          throw new Error('Organization name is required but not provided');
        }
        
        tableName = `${storedOrganizationName}_alumni_vector`;
      }
      
      const { data, error } = await this.supabase
        .from(tableName)
        .select(`
          id, 
          name, 
          profile_url,
          current_company,
          current_title,
          post_company_current_industry,
          current_job_location,
          post_company_companies,
          post_company_titles,
          post_company_industries,
          undergraduate_school,
          graduate_school,
          natural_language_experiences,
          natural_language_education,
          current_job_level,
          current_job_function,
          career_stage,
          highest_degree_level,
          school_ranking_tier,
          major_metro_area,
          functional_expertise,
          industry_expertise,
          natural_language_career_progression,
          natural_language_functional_expertise,
          natural_language_educational_profile,
          natural_language_company_experience,
          natural_language_geographic_profile
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
        linkedin_url: data.profile_url,
        current_company: data.current_company,
        current_title: data.current_title,
        current_industry: data.post_company_current_industry,
        location: data.current_job_location,
        years_experience: 0, // Not stored in enhanced table
        graduation_year: 0, // Not stored in enhanced table
        estimated_salary: '', // Not stored in enhanced table
        companies: data.post_company_companies || [],
        titles: data.post_company_titles || [],
        industries: data.post_company_industries || [],
        undergraduate_schools: data.undergraduate_school || [],
        graduate_schools: data.graduate_school || [],
        certificate_programs: [], // Not stored in enhanced table
        experiences_text: data.natural_language_experiences,
        education_text: data.natural_language_education,
        // NEW: Enhanced profile fields
        current_job_level: data.current_job_level,
        current_job_function: data.current_job_function,
        career_stage: data.career_stage,
        highest_degree_level: data.highest_degree_level,
        school_ranking_tier: data.school_ranking_tier,
        major_metro_area: data.major_metro_area,
        functional_expertise: data.functional_expertise || [],
        industry_expertise: data.industry_expertise || [],
        natural_language_career_progression: data.natural_language_career_progression,
        natural_language_functional_expertise: data.natural_language_functional_expertise,
        natural_language_educational_profile: data.natural_language_educational_profile,
        natural_language_company_experience: data.natural_language_company_experience,
        natural_language_geographic_profile: data.natural_language_geographic_profile
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