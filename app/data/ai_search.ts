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

// Add new interface for company search filters
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
  headline: string;
  // Add enriched fields from the database schema
  current_job_level?: string;
  current_job_function?: string;
  undergraduate_school?: string[];
  graduate_school?: string[];
  natural_language_geographic_profile?: string;
  natural_language_educational_profile?: string;
  highest_degree_level?: string;
  major_category?: string;
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
  picture_url?: string;
  similarity: number;
  industry: string;
  headline: string;
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
  current_company: string;
  current_title: string;
  current_job_location: string;
  // Dynamic exit year field - will be accessed as [organizationName]_exit_year
  [key: string]: any; // Allow dynamic field access
  headline: string;
  picture_url: string;
  current_job_level: string;
  current_job_function: string;
  career_stage: string;
  highest_degree_level: string;
  school_ranking_tier: string;
  major_metro_area: string;
  similarity: number;
}

// Add temporal interfaces at the top:
export interface TemporalSearchFilters {
  target_company_year?: number;
  subsequent_function?: string;
  subsequent_year?: number;
  cfa_years_filter?: number[];
  functions_filter?: string[];
  exit_year_min?: number;
  exit_year_max?: number;
}

export interface TemporalSearchResult {
  id: number;
  profile_id: number;
  name: string;
  career_timeline: any;
  chick_fil_a_years: number[];
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
  
  // Company search method for any organization with alumni data
  async searchCompany(query: string, top_k: number = 10, filters: CompanySearchFilters = {}, organizationName?: string): Promise<CompanySearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🏢 searchCompany called with query: "${query}", filters:`, filters);
      
      // Get the organization name for dynamic RPC function naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      if (!storedOrganizationName) {
        throw new Error('Organization name is required for company search');
      }
      
      // Construct dynamic RPC function name
      const rpcFunctionName = `enhanced_hybrid_search_${storedOrganizationName}`;
      console.log(`[AI_SEARCH DEBUG] 🏢 Using dynamic RPC function: ${rpcFunctionName}`);
      
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
        school
      } = filters;
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Calling ${rpcFunctionName} RPC function`);
      
      // Call the dynamic RPC function with higher limit for gap-based filtering
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, {
          query_embedding: embeddingArray,
          similarity_threshold: 0.3, // Keep lower threshold for more candidates
          company_filter: company || null,
          industry_filter: industry || null,
          title_filter: title || null,
          location_filter: location || null,
          school_filter: school || null,
          limit_count: 50 // Increase limit to get more candidates for gap-based filtering
        })
        .returns<HybridSearchCompanyResult[]>();
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] 🏢 Error from ${rpcFunctionName}:`, error);
        throw new Error(`Company vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] 🏢 ${rpcFunctionName} returned ${data?.length || 0} results`);
      
      // Format the results for company search
      const formattedResults = data.map((item: HybridSearchCompanyResult): CompanySearchResult => {
        return {
          id: Number(item.id),
          profile_id: Number(item.profile_id),
          name: item.name,
          profile_url: item.profile_url,
          post_company_current_company: item.post_company_current_company,
          post_company_current_title: item.post_company_current_title,
          post_company_current_industry: item.post_company_current_industry,
          post_company_current_location: item.post_company_current_location,
          picture_url: item.picture_url,
          similarity: item.similarity,
          industry: item.post_company_current_industry || '',
          headline: item.headline || ''
        };
      });

      // Apply gap-based filtering
      const filteredResults = this.applyGapBasedFiltering(formattedResults);
      console.log(`[AI_SEARCH DEBUG] 🏢 Gap-based filtering reduced results from ${formattedResults.length} to ${filteredResults.length}`);
      
      // The enhanced RPC function already returns enriched data, so no need for additional fetching
      const enrichedResults = filteredResults.map((item: CompanySearchResult) => {
        // Access the full data from the RPC result
        const rpcItem = data.find(d => Number(d.id) === item.id);
        
        return {
          ...item,
          // The RPC already provides the enriched industry and headline
          industry: item.industry,
          headline: item.headline,
          // Use the enriched data from the RPC function
          current_job_level: rpcItem?.current_job_level || '',
          current_job_function: rpcItem?.current_job_function || '',
          undergraduate_school: [], // Not returned by current RPC
          graduate_school: [], // Not returned by current RPC
          natural_language_geographic_profile: '', // Not returned by current RPC
          natural_language_educational_profile: '', // Not returned by current RPC
          highest_degree_level: rpcItem?.highest_degree_level || '',
          major_category: '' // Not returned by current RPC
        };
      });
      
      return enrichedResults;
    } catch (error) {
      throw error;
    }
  }
  
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
      
      // Try specific sequence search first
      if (years.length >= 2 && functions.length >= 1) {
        console.log(`[AI_SEARCH DEBUG] 🕐 Using sequence search: CFA in ${years[0]}, then ${functions[0]} in ${years[1]}`);
        
        const { data, error } = await this.supabase
          .rpc('temporal_career_search', {
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
          const filteredResults = this.applyGapBasedFiltering(data) as TemporalSearchResult[];
          console.log(`[AI_SEARCH DEBUG] 🕐 Gap-based filtering reduced sequence results from ${data.length} to ${filteredResults.length}`);
          return filteredResults;
        }
      }
      
      // Fallback to general temporal filter search
      if (years.length >= 1 || functions.length >= 1) {
        console.log(`[AI_SEARCH DEBUG] 🕐 Using general temporal filter search`);
        
        const { data, error } = await this.supabase
          .rpc('temporal_filter_search', {
            query_embedding: embeddingArray,
            similarity_threshold: 0.3, // Keep lower threshold for more candidates
            cfa_years_filter: years.length > 0 ? years : null,
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
          const filteredResults = this.applyGapBasedFiltering(data) as TemporalSearchResult[];
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
          storedOrganizationName) {  // Remove specific chick_fil_a check
        
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
              let profileData: any = null; // Declare outside try block for proper scope
              
              try {
                // NEW naming convention: organizationName_alumni_vector
                const vectorTableName = `${storedOrganizationName}_alumni_vector`;
                
                const { data: fetchedProfileData, error } = await this.supabase
                  .from(vectorTableName)
                  .select(`
                    profile_url, 
                    headline, 
                    industry,
                    current_general_industry,
                    current_job_level,
                    current_job_function,
                    undergraduate_school,
                    graduate_school,
                    natural_language_geographic_profile,
                    natural_language_educational_profile,
                    highest_degree_level,
                    major_category
                  `)
                  .eq('profile_id', item.profile_id)
                  .single();
                
                if (!error && fetchedProfileData) {
                  profileData = fetchedProfileData; // Assign to outer scope variable
                  linkedinUrl = fetchedProfileData.profile_url || '';
                  headline = fetchedProfileData.headline || '';
                  industry = fetchedProfileData.industry || fetchedProfileData.current_general_industry || '';
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
                headline: headline,
                // Add enriched fields from temporal search
                current_job_level: profileData?.current_job_level || '',
                current_job_function: profileData?.current_job_function || '',
                undergraduate_school: profileData?.undergraduate_school || [],
                graduate_school: profileData?.graduate_school || [],
                natural_language_geographic_profile: profileData?.natural_language_geographic_profile || '',
                natural_language_educational_profile: profileData?.natural_language_educational_profile || '',
                highest_degree_level: profileData?.highest_degree_level || '',
                major_category: profileData?.major_category || ''
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
      
      // STANDARD SEARCH - Updated to use new naming convention
      console.log(`[AI_SEARCH DEBUG] 📊 Using standard search`);
      
      // Check if this is a non-demo search (updated logic)
      if (!isDemo && storedOrganizationName) {  // Removed specific chick_fil_a check
        console.log(`[AI_SEARCH DEBUG] ✅ USING COMPANY SEARCH for ${storedOrganizationName}`);
        
        // Use company search for any organization (not just chick_fil_a)
        const companyFilters: CompanySearchFilters = {
          company: filters.company,
          industry: filters.industry,
          title: filters.title,
          location: filters.location,
          school: filters.school
        };
        
        console.log(`[AI_SEARCH DEBUG] Calling searchCompany with filters:`, companyFilters);
        const companyResults = await this.searchCompany(query, top_k, companyFilters, storedOrganizationName);
        
        console.log(`[AI_SEARCH DEBUG] 🏢 Company results before conversion:`, companyResults.map(r => ({
          id: r.id,
          name: r.name,
          industry: r.industry,
          headline: r.headline
        })));
        
        // Convert company results to regular search results format for compatibility
        const convertedResults = companyResults.map((item: CompanySearchResult): SearchResult => {
          console.log(`[AI_SEARCH DEBUG] 🏢 Converting enriched item - industry: "${item.industry}", headline: "${item.headline}"`);
          
          return {
            id: item.id,
            name: item.name,
            linkedin_url: item.profile_url, // Map profile_url to linkedin_url
            current_company: item.post_company_current_company,
            current_title: item.post_company_current_title,
            current_industry: item.industry,
            current_general_industry: item.post_company_current_industry,
            current_job_location: item.post_company_current_location,
            years_experience: 0, // Not applicable for company data
            profile_photo_url: item.picture_url,
            similarity: item.similarity,
            headline: item.headline,
            // Add the enriched fields to the SearchResult
            current_job_level: (item as any).current_job_level || '',
            current_job_function: (item as any).current_job_function || '',
            undergraduate_school: (item as any).undergraduate_school || [],
            graduate_school: (item as any).graduate_school || [],
            natural_language_geographic_profile: (item as any).natural_language_geographic_profile || '',
            natural_language_educational_profile: (item as any).natural_language_educational_profile || '',
            highest_degree_level: (item as any).highest_degree_level || '',
            major_category: (item as any).major_category || ''
          };
        });
        
        console.log(`[AI_SEARCH DEBUG] ✅ Company search completed, returning ${convertedResults.length} results`);
        return convertedResults;
      }
      
      console.log(`[AI_SEARCH DEBUG] ❌ NOT using company search, falling back to regular search`);
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
        })
        .returns<HybridSearchResult[]>();
      
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
      const filteredResults = this.applyGapBasedFiltering(formattedResults);
      console.log(`[AI_SEARCH DEBUG] ${rpcFunction} gap-based filtering reduced results from ${formattedResults.length} to ${filteredResults.length}`);
      
      return filteredResults;
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] Search method error:`, error);
      throw error;
    }
  }
  
  async getProfileById(id: number, organizationName?: string): Promise<ProfileDetail> {
    try {
      // Determine the table name using NEW naming convention
      let tableName: string;
      
      if (organizationName) {
        tableName = `${organizationName}_alumni_vector`;  // Updated naming convention
      } else {
        // Try to get the organization name from localStorage if running in browser
        const storedOrganizationName = typeof window !== 'undefined' ? 
          localStorage.getItem('organizationName') : null;
        
        if (!storedOrganizationName) {
          throw new Error('Organization name is required but not provided');
        }
        
        tableName = `${storedOrganizationName}_alumni_vector`;  // Updated naming convention
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