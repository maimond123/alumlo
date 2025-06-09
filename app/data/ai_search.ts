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
  
  // Enhanced text filters
  job_level_filter?: string;
  job_function_filter?: string;
  career_stage_filter?: string;
  degree_level_filter?: string;
  school_tier_filter?: string;
  
  // Boolean filters
  leadership_only?: boolean;
  management_exp_only?: boolean;
  technical_background_only?: boolean;
  sales_exp_only?: boolean;
  startup_exp_only?: boolean;
  enterprise_exp_only?: boolean;
  remote_worker_only?: boolean;
  mentor_potential_only?: boolean;
  
  // Dynamic company-specific boolean filter (will be constructed as {organizationName}_salary_lift_only)
  salary_lift_only?: boolean;
  
  // Range filters
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
  high_school?: string[];
  pre_company_education?: string[];
  during_company_education?: string[];
  post_company_education?: string[];
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
  // Add enriched fields from the enhanced vector table
  current_job_level?: string;
  current_job_function?: string;
  career_stage?: string;
  highest_degree_level?: string;
  school_ranking_tier?: string;
  
  // Boolean profile characteristics
  is_current_leader?: boolean;
  management_experience?: boolean;
  technical_background?: boolean;
  sales_experience?: boolean;
  has_startup_experience?: boolean;
  has_enterprise_experience?: boolean;
  is_remote_worker?: boolean;
  mentor_potential?: boolean;
  
  undergraduate_school?: string[];
  graduate_school?: string[];
  high_school?: string[];
  pre_company_education?: string[];
  during_company_education?: string[];
  post_company_education?: string[];
  post_company_companies?: string[];
  post_company_titles?: string[];
  post_company_industries?: string[];
  post_company_locations?: string[];
  functional_expertise?: string[];
  industry_expertise?: string[];
  current_estimated_salary?: number;
  highest_career_salary?: number;
  major_category?: string;
  
  // Dynamic company-specific fields - accessed as [organizationName]_field_name
  // Examples: chick_fil_a_exit_year, chick_fil_a_provided_salary_lift, etc.
  [key: string]: any; // Allow dynamic field access for company-specific fields
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
  home_location: string;
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
  
  // Boolean profile characteristics (returned by SQL function)
  is_current_leader: boolean;
  management_experience: boolean;
  technical_background: boolean;
  sales_experience: boolean;
  has_startup_experience: boolean;
  has_enterprise_experience: boolean;
  is_remote_worker: boolean;
  mentor_potential: boolean;
  
  // Add missing education fields
  undergraduate_school: string[];
  graduate_school: string[];
  high_school: string[];
  pre_company_education: string[];
  during_company_education: string[];
  post_company_education: string[];
  natural_language_education: string;
  natural_language_experiences: string;
  // Add other useful fields
  post_company_companies: string[];
  post_company_titles: string[];
  post_company_industries: string[];
  post_company_locations: string[];
  functional_expertise: string[];
  industry_expertise: string[];
  // NEW: Salary fields
  current_estimated_salary: number;
  highest_career_salary: number;
  // Dynamic salary fields - will be accessed as [organizationName]_provided_salary_lift etc.
  // These include: {organizationName}_provided_salary_lift, achieved_six_figure_post_{organizationName}, 
  // doubled_salary_post_{organizationName}, moved_to_leadership_post_{organizationName}
  major_category: string;  // Add missing major_category field
  similarity: number;
}

// Add temporal interfaces at the top:
export interface TemporalSearchFilters {
  target_company_year?: number;
  subsequent_function?: string;
  subsequent_year?: number;
  company_years_filter?: number[];  // Changed from cfa_years_filter to generic company_years_filter
  functions_filter?: string[];
  exit_year_min?: number;
  exit_year_max?: number;
}

export interface TemporalSearchResult {
  id: number;
  profile_id: number;
  name: string;
  career_timeline: any;
  education_timeline: any;  // Added missing education_timeline field
  // Dynamic company years field - will be accessed as [organizationName]_years_list
  [key: string]: any; // Allow dynamic field access for company-specific fields
  post_company_current_company: string;
  post_company_current_title: string;
  // Dynamic exit year field - will be accessed as [organizationName]_exit_year
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
    console.log(`[GAP_FILTER DEBUG] 🔍 Processing ${results.length} results for gap-based filtering`);
    
    if (!results.length) {
      console.log(`[GAP_FILTER DEBUG] ⚠️ No results to filter, returning empty array`);
      return results;
    }

    // Sort by similarity descending (should already be sorted from DB, but ensuring)
    const sortedResults = [...results].sort((a, b) => b.similarity - a.similarity);
    console.log(`[GAP_FILTER DEBUG] 📊 Sorted results by similarity:`, {
      totalResults: sortedResults.length,
      topSimilarity: sortedResults[0]?.similarity,
      bottomSimilarity: sortedResults[sortedResults.length - 1]?.similarity,
      averageSimilarity: sortedResults.reduce((sum, r) => sum + r.similarity, 0) / sortedResults.length
    });
    
    // Filter results above 0.4 threshold first
    const aboveThreshold = sortedResults.filter(r => r.similarity >= 0.4);
    console.log(`[GAP_FILTER DEBUG] 🎯 Threshold filtering (≥0.4):`, {
      beforeThreshold: sortedResults.length,
      afterThreshold: aboveThreshold.length,
      rejectedBelowThreshold: sortedResults.length - aboveThreshold.length,
      thresholdUsed: 0.4
    });
    
    if (aboveThreshold.length === 0) {
      console.log(`[GAP_FILTER DEBUG] ❌ No results above 0.4 threshold`);
      console.log(`[GAP_FILTER DEBUG] 📊 All similarities:`, sortedResults.map(r => r.similarity));
      return [];
    }

    if (aboveThreshold.length === 1) {
      console.log(`[GAP_FILTER DEBUG] ✅ Only 1 result above threshold, returning it`);
      return aboveThreshold;
    }

    // Apply gap detection
    const finalResults: T[] = [aboveThreshold[0]]; // Always include the best result
    let previousSimilarity = aboveThreshold[0].similarity;
    
    console.log(`[GAP_FILTER DEBUG] 🔍 Starting gap detection analysis:`);
    console.log(`[GAP_FILTER DEBUG] 🥇 Best result (always included): similarity=${previousSimilarity.toFixed(3)}`);
    
    for (let i = 1; i < aboveThreshold.length; i++) {
      const currentResult = aboveThreshold[i];
      const gap = previousSimilarity - currentResult.similarity;
      
      console.log(`[GAP_FILTER DEBUG] 📊 Result ${i + 1}/${aboveThreshold.length}:`, {
        index: i,
        similarity: currentResult.similarity.toFixed(3),
        gap: gap.toFixed(3),
        previousSimilarity: previousSimilarity.toFixed(3),
        gapThreshold: 0.1,
        willInclude: gap <= 0.1
      });
      
      // Stop if we detect a significant gap (0.1 seems reasonable for similarity scores)
      if (gap > 0.1) {
        console.log(`[GAP_FILTER DEBUG] ⛔ Significant gap detected (${gap.toFixed(3)} > 0.1), stopping at ${finalResults.length} results`);
        break;
      }
      
      finalResults.push(currentResult);
      previousSimilarity = currentResult.similarity;
    }
    
    console.log(`[GAP_FILTER DEBUG] ✅ Gap-based filtering complete:`, {
      startedWith: results.length,
      afterSorting: sortedResults.length,
      aboveThreshold: aboveThreshold.length,
      finalCount: finalResults.length,
      reductionFromOriginal: Math.round((1 - finalResults.length / results.length) * 100) + '%',
      finalSimilarities: finalResults.map(r => r.similarity.toFixed(3))
    });
    
    return finalResults;
  }
  
  // Company search method for any organization with alumni data
  async searchCompany(query: string, top_k: number = 10, filters: CompanySearchFilters = {}, organizationName?: string): Promise<CompanySearchResult[]> {
    console.log(`🚨🚨🚨 [SEARCHCOMPANY] METHOD CALLED! Query: "${query}", Org: "${organizationName}" 🚨🚨🚨`);
    
    try {
      console.log(`[AI_SEARCH DEBUG] 🏢 searchCompany called with:`, {
        query: `"${query}"`,
        top_k,
        filters,
        organizationName,
        filtersCount: Object.keys(filters).length
      });
      
      // Get the organization name for dynamic RPC function naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Organization name resolution:`, {
        provided: organizationName,
        fromLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('organizationName') : 'N/A (server)',
        final: storedOrganizationName
      });
      
      if (!storedOrganizationName) {
        console.error('[AI_SEARCH DEBUG] 🏢 ❌ Organization name is required for company search');
        throw new Error('Organization name is required for company search');
      }
      
      // Construct dynamic RPC function name
      const rpcFunctionName = `enhanced_hybrid_search_${storedOrganizationName}`;
      console.log(`[AI_SEARCH DEBUG] 🏢 Using dynamic RPC function: ${rpcFunctionName}`);
      
      // Generate embedding using OpenAI API
      console.log(`[AI_SEARCH DEBUG] 🏢 Generating embedding for query: "${query}"`);
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      console.log(`[AI_SEARCH DEBUG] 🏢 Embedding generated, length: ${embeddingArray.length}`);
      
      // Extract all filter types from the enhanced filters interface
      const { 
        company, 
        industry, 
        title, 
        location, 
        school,
        
        // Enhanced text filters
        job_level_filter,
        job_function_filter,
        career_stage_filter,
        degree_level_filter,
        school_tier_filter,
        
        // Boolean filters
        leadership_only = false,
        management_exp_only = false,
        technical_background_only = false,
        sales_exp_only = false,
        startup_exp_only = false,
        enterprise_exp_only = false,
        remote_worker_only = false,
        mentor_potential_only = false,
        salary_lift_only = false,
        
        // Range filters
        exit_year_min,
        exit_year_max
      } = filters;
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Extracted filters:`, {
        basicFilters: { company, industry, title, location, school },
        enhancedTextFilters: { job_level_filter, job_function_filter, career_stage_filter, degree_level_filter, school_tier_filter },
        booleanFilters: { leadership_only, management_exp_only, technical_background_only, sales_exp_only, startup_exp_only, enterprise_exp_only, remote_worker_only, mentor_potential_only, salary_lift_only },
        rangeFilters: { exit_year_min, exit_year_max }
      });
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Calling ${rpcFunctionName} RPC function with enhanced filters`);
      
      // Construct dynamic company-specific parameter name for salary lift filter
      const dynamicSalaryLiftParam = `${storedOrganizationName}_salary_lift_only`;
      console.log(`[AI_SEARCH DEBUG] 🏢 Dynamic salary lift parameter: ${dynamicSalaryLiftParam}`);
      
      // Build RPC parameters object with all available filters
      const rpcParams: any = {
        query_embedding: embeddingArray,
        similarity_threshold: 0.3, // Keep lower threshold for more candidates
        
        // Basic filters
        company_filter: company || null,
        industry_filter: industry || null,
        title_filter: title || null,
        location_filter: location || null,
        school_filter: school || null,
        
        // Enhanced text filters
        job_level_filter: job_level_filter || null,
        job_function_filter: job_function_filter || null,
        career_stage_filter: career_stage_filter || null,
        degree_level_filter: degree_level_filter || null,
        school_tier_filter: school_tier_filter || null,
        
        // Boolean filters
        leadership_only,
        management_exp_only,
        technical_background_only,
        sales_exp_only,
        startup_exp_only,
        enterprise_exp_only,
        remote_worker_only,
        mentor_potential_only,
        
        // Range filters
        exit_year_min: exit_year_min || null,
        exit_year_max: exit_year_max || null,
        
        limit_count: 50 // Increase limit to get more candidates for gap-based filtering
      };
      
      // Add dynamic company-specific salary lift filter
      rpcParams[dynamicSalaryLiftParam] = salary_lift_only;
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Final RPC parameters:`, {
        functionName: rpcFunctionName,
        parameterCount: Object.keys(rpcParams).length,
        parameters: rpcParams,
        embeddingLength: rpcParams.query_embedding.length
      });
      
      // Call the dynamic RPC function with all enhanced filters
      console.log(`[AI_SEARCH DEBUG] 🏢 🔄 Making Supabase RPC call to: ${rpcFunctionName}`);
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, rpcParams)
        .returns<HybridSearchCompanyResult[]>();
      
      console.log(`[AI_SEARCH DEBUG] 🏢 📡 Supabase RPC response:`, {
        functionName: rpcFunctionName,
        error: error ? error.message : null,
        errorDetails: error,
        dataLength: data?.length || 0,
        hasData: !!data,
        firstResult: data?.[0] ? {
          id: data[0].id,
          name: data[0].name,
          similarity: data[0].similarity
        } : null
      });
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] 🏢 ❌ DETAILED ERROR from ${rpcFunctionName}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        console.error(`[AI_SEARCH DEBUG] 🏢 ❌ RPC Parameters that caused the error:`, rpcParams);
        console.error(`[AI_SEARCH DEBUG] 🏢 ❌ Function that failed: ${rpcFunctionName}`);
        
        // Additional debugging: Check if it's a table/function existence issue
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          console.error(`[AI_SEARCH DEBUG] 🏢 🔍 EXISTENCE ERROR - Checking what exists:`, {
            expectedTable: `${storedOrganizationName}_alumni_vector`,
            expectedFunction: rpcFunctionName,
            suggestion: 'Verify table and function exist in Supabase'
          });
        }
        
        // Check if it's a column/field mismatch issue
        if (error.message.includes('column') || error.message.includes('field')) {
          console.error(`[AI_SEARCH DEBUG] 🏢 📊 COLUMN/FIELD ERROR - Schema mismatch detected:`, {
            possibleCause: 'Table columns do not match function RETURNS TABLE definition',
            suggestion: 'Check table schema matches the SQL function return columns',
            returnedColumns: 'Review the RETURNS TABLE section of your SQL function'
          });
        }
        
        throw new Error(`Company vector search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] 🏢 ✅ ${rpcFunctionName} returned ${data?.length || 0} results`);
      
      if (!data || data.length === 0) {
        console.log(`[AI_SEARCH DEBUG] 🏢 ⚠️ No results returned from database. This could be due to:`, {
          possibleCauses: [
            'Table does not exist: ' + `${storedOrganizationName}_alumni_vector`,
            'No data matches the filters applied',
            'Similarity threshold too high (0.3)',
            'RPC function does not exist: ' + rpcFunctionName,
            'Empty database table'
          ],
          suggestions: [
            'Check if table exists in Supabase',
            'Lower similarity threshold',
            'Remove some filters',
            'Verify RPC function exists'
          ]
        });
        return [];
      }
      
      // Format the results for company search with enhanced field mapping
      console.log(`[AI_SEARCH DEBUG] 🏢 🔄 Processing ${data.length} raw results`);
      const formattedResults = data.map((item: HybridSearchCompanyResult, index: number): CompanySearchResult => {
        console.log(`[AI_SEARCH DEBUG] 🏢 Processing result ${index + 1}/${data.length}:`, {
          id: item.id,
          name: item.name,
          similarity: item.similarity,
          hasProfileUrl: !!item.profile_url,
          hasCurrentCompany: !!item.post_company_current_company,
          hasCurrentTitle: !!item.post_company_current_title
        });
        
        // Create base result object
        const baseResult: CompanySearchResult = {
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
          headline: item.headline || '',
          
          // Include all enriched fields directly from RPC result
          current_job_level: item.current_job_level || '',
          current_job_function: item.current_job_function || '',
          career_stage: item.career_stage || '',
          highest_degree_level: item.highest_degree_level || '',
          school_ranking_tier: item.school_ranking_tier || '',
          
          // Boolean profile characteristics
          is_current_leader: item.is_current_leader || false,
          management_experience: item.management_experience || false,
          technical_background: item.technical_background || false,
          sales_experience: item.sales_experience || false,
          has_startup_experience: item.has_startup_experience || false,
          has_enterprise_experience: item.has_enterprise_experience || false,
          is_remote_worker: item.is_remote_worker || false,
          mentor_potential: item.mentor_potential || false,
          
          undergraduate_school: item.undergraduate_school || [],
          graduate_school: item.graduate_school || [],
          high_school: item.high_school || [],
          pre_company_education: item.pre_company_education || [],
          during_company_education: item.during_company_education || [],
          post_company_education: item.post_company_education || [],
          post_company_companies: item.post_company_companies || [],
          post_company_titles: item.post_company_titles || [],
          post_company_industries: item.post_company_industries || [],
          post_company_locations: item.post_company_locations || [],
          functional_expertise: item.functional_expertise || [],
          industry_expertise: item.industry_expertise || [],
          current_estimated_salary: item.current_estimated_salary || 0,
          highest_career_salary: item.highest_career_salary || 0,
          major_category: item.major_category || ''
        };
        
        // Handle dynamic company-specific fields by copying all dynamic properties
        // This preserves fields like: {organizationName}_exit_year, {organizationName}_provided_salary_lift, etc.
        Object.keys(item).forEach(key => {
          if (key.includes(storedOrganizationName) || key.startsWith('achieved_') || key.startsWith('doubled_') || key.startsWith('moved_to_')) {
            (baseResult as any)[key] = item[key];
          }
        });
        
        console.log(`[AI_SEARCH DEBUG] 🏢 Formatted result ${index + 1}:`, {
          id: baseResult.id,
          name: baseResult.name,
          similarity: baseResult.similarity,
          hasProfileUrl: !!baseResult.profile_url,
          industryMapped: baseResult.industry,
          headlineMapped: baseResult.headline
        });
        
        return baseResult;
      });

      console.log(`[AI_SEARCH DEBUG] 🏢 📊 Formatted results summary:`, {
        totalProcessed: formattedResults.length,
        sampleResult: formattedResults[0] ? {
          id: formattedResults[0].id,
          name: formattedResults[0].name,
          similarity: formattedResults[0].similarity
        } : null
      });

      // Apply gap-based filtering to the enriched results
      console.log(`[AI_SEARCH DEBUG] 🏢 🔍 Applying gap-based filtering...`);
      const filteredResults = this.applyGapBasedFiltering(formattedResults) as CompanySearchResult[];
      console.log(`[AI_SEARCH DEBUG] 🏢 ✅ Gap-based filtering results:`, {
        beforeFiltering: formattedResults.length,
        afterFiltering: filteredResults.length,
        reductionPercentage: formattedResults.length > 0 ? Math.round((1 - filteredResults.length / formattedResults.length) * 100) : 0
      });
      
      return filteredResults;
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] 🏢 ❌ CRITICAL ERROR in searchCompany:`, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        query,
        organizationName,
        filters
      });
      throw error;
    }
  }
  
  async searchTemporal(
    query: string, 
    temporalElements: any, 
    top_k: number = 10,
    organizationName?: string  // Add organizationName parameter
  ): Promise<TemporalSearchResult[]> {
    try {
      console.log(`[AI_SEARCH DEBUG] 🕐 searchTemporal called with:`, temporalElements);
      
      // Get the organization name for dynamic function naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      if (!storedOrganizationName) {
        throw new Error('Organization name is required for temporal search');
      }
      
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
        const sequenceSearchFunc = `temporal_career_search_${storedOrganizationName}`;
        console.log(`[AI_SEARCH DEBUG] 🕐 Using sequence search: ${storedOrganizationName} in ${years[0]}, then ${functions[0]} in ${years[1]}`);
        
        const { data, error } = await this.supabase
          .rpc(sequenceSearchFunc, {
            p_target_company_year: years[0],
            p_subsequent_function: functions[0],
            p_subsequent_year: years[1],
            p_query_embedding: embeddingArray,
            p_similarity_threshold: 0.3, // Keep lower threshold for more candidates
            p_limit_count: 50 // Increase limit for gap-based filtering
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
        const filterSearchFunc = `temporal_filter_search_${storedOrganizationName}`;
        console.log(`[AI_SEARCH DEBUG] 🕐 Using general temporal filter search`);
        
        const { data, error } = await this.supabase
          .rpc(filterSearchFunc, {
            p_query_embedding: embeddingArray,
            p_similarity_threshold: 0.3, // Keep lower threshold for more candidates
            p_company_years_filter: years.length > 0 ? years : null,
            p_functions_filter: functions.length > 0 ? functions : null,
            p_limit_count: 50 // Increase limit for gap-based filtering
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
      let storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);

      // In demo mode, we now search against the Chick-fil-A dataset
      if (isDemo) {
        storedOrganizationName = 'chick_fil_a';
        console.log(`[AI_SEARCH DEBUG] 🏃 Demo mode is true. Forcing organization to '${storedOrganizationName}'`);
      }
      
      console.log(`[AI_SEARCH DEBUG] Effective organization: "${storedOrganizationName}"`);
      
      // TEMPORAL ROUTING - Check for temporal classification first (NON-DEMO ONLY)
      if (queryClassification?.type === 'temporal' && 
          queryClassification?.temporal_elements && 
          !isDemo && 
          storedOrganizationName) {  // This logic remains specific to non-demo use cases for now.
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Temporal query detected for ${storedOrganizationName}, routing to temporal search`);
        
        try {
          const temporalResults = await this.searchTemporal(
            query, 
            queryClassification.temporal_elements, 
            top_k,
            storedOrganizationName
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
                    post_company_current_industry,
                    current_job_level,
                    current_job_function,
                    undergraduate_school,
                    graduate_school,
                    high_school,
                    pre_company_education,
                    during_company_education,
                    post_company_education,
                    natural_language_education,
                    natural_language_experiences,
                    highest_degree_level,
                    major_category
                  `)
                  .eq('profile_id', item.profile_id)
                  .single();
                
                if (!error && fetchedProfileData) {
                  profileData = fetchedProfileData; // Assign to outer scope variable
                  linkedinUrl = fetchedProfileData.profile_url || '';
                  headline = fetchedProfileData.headline || '';
                  industry = fetchedProfileData.post_company_current_industry || '';
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
                high_school: profileData?.high_school || [],
                pre_company_education: profileData?.pre_company_education || [],
                during_company_education: profileData?.during_company_education || [],
                post_company_education: profileData?.post_company_education || [],
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
      
      // STANDARD SEARCH - Updated to use company search for both demo and non-demo
      console.log(`[AI_SEARCH DEBUG] 📊 Using standard search`);
      
      if (storedOrganizationName) {
        console.log(`[AI_SEARCH DEBUG] ✅ USING COMPANY SEARCH for ${storedOrganizationName}`);
        
        // Use company search for any organization
        const companyFilters: CompanySearchFilters = {
          company: filters.company,
          industry: filters.industry,
          title: filters.title,
          location: filters.location,
          school: filters.school
        };
        
        console.log(`[AI_SEARCH DEBUG] 🔄 Calling searchCompany method with parameters:`, {
          query,
          top_k,
          organizationName: storedOrganizationName,
          isDemo,
          hasFilters: Object.keys(companyFilters).length > 0,
          filterDetails: companyFilters
        });
        
        console.log(`[AI_SEARCH DEBUG] Calling searchCompany with filters:`, companyFilters);
        const companyResults = await this.searchCompany(query, top_k, companyFilters, storedOrganizationName);
        
        console.log(`[AI_SEARCH DEBUG] 🏢 Company results received:`, {
          resultCount: companyResults.length,
          sampleResults: companyResults.slice(0, 3).map(r => ({
            id: r.id,
            name: r.name,
            industry: r.industry,
            headline: r.headline,
            similarity: r.similarity
          }))
        });
        
        // Convert company results to regular search results format for compatibility
        console.log(`[AI_SEARCH DEBUG] 🔄 Converting ${companyResults.length} company results to SearchResult format`);
        const convertedResults = companyResults.map((item: CompanySearchResult, index: number): SearchResult => {
          console.log(`[AI_SEARCH DEBUG] 🔄 Converting result ${index + 1}:`, {
            originalId: item.id,
            originalName: item.name,
            originalIndustry: item.industry,
            originalHeadline: item.headline
          });
          
          const converted = {
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
            current_job_level: item.current_job_level || '',
            current_job_function: item.current_job_function || '',
            undergraduate_school: item.undergraduate_school || [],
            graduate_school: item.graduate_school || [],
            high_school: item.high_school || [],
            pre_company_education: item.pre_company_education || [],
            during_company_education: item.during_company_education || [],
            post_company_education: item.post_company_education || [],
            highest_degree_level: item.highest_degree_level || '',
            major_category: item.major_category || ''
          };
          
          console.log(`[AI_SEARCH DEBUG] ✅ Converted result ${index + 1}:`, {
            convertedId: converted.id,
            convertedName: converted.name,
            convertedIndustry: converted.current_industry,
            convertedHeadline: converted.headline,
            convertedSimilarity: converted.similarity
          });
          
          return converted;
        });
        
        console.log(`[AI_SEARCH DEBUG] ✅ Company search completed successfully:`, {
          originalResultCount: companyResults.length,
          convertedResultCount: convertedResults.length,
          finalResults: convertedResults.map(r => ({
            id: r.id,
            name: r.name,
            similarity: r.similarity
          }))
        });
        
        return convertedResults;
      }
      
      // FALLBACK - This should now be rarely used, as demo mode is handled above.
      console.log(`[AI_SEARCH DEBUG] ❌ No organization name, falling back to generic hybrid_search`);
      
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
      
      // The 'hybrid_search_demo' RPC is no longer needed as demo mode uses the company search path.
      const rpcFunction = 'hybrid_search'; // Always use the standard hybrid_search as a fallback
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
      const formattedResults: SearchResult[] = data.map((item: HybridSearchResult): SearchResult => ({
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
        headline: '',
        // Add enriched fields with defaults since fallback search doesn't have them
        current_job_level: '',
        current_job_function: '',
        undergraduate_school: [],
        graduate_school: [],
        high_school: [],
        pre_company_education: [],
        during_company_education: [],
        post_company_education: [],
        highest_degree_level: '',
        major_category: ''
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
          profile_url,
          current_company,
          current_title,
          post_company_current_industry,
          current_job_location,
          current_estimated_salary,
          post_company_companies,
          post_company_titles,
          post_company_industries,
          undergraduate_school,
          graduate_school,
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
        linkedin_url: data.profile_url,
        current_company: data.current_company,
        current_title: data.current_title,
        current_industry: data.post_company_current_industry,
        location: data.current_job_location,
        years_experience: 0, // Assuming years_of_experience is not available in the new structure
        graduation_year: 0, // Assuming graduation_year is not available in the new structure
        estimated_salary: data.current_estimated_salary,
        companies: data.post_company_companies || [],
        titles: data.post_company_titles || [],
        industries: data.post_company_industries || [],
        undergraduate_schools: data.undergraduate_school || [],
        graduate_schools: data.graduate_school || [],
        certificate_programs: [], // Assuming certificate_program is not available in the new structure
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