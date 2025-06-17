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

// Add improved timeline interfaces for the new chronological search system
export interface EducationTimelineEntry {
  degree: string;
  school: string;
  start_year: number;
  end_year: number;
  degree_level: string;
  field_of_study: string;
  graduation_year: number;
  // Additional useful fields
  gpa?: number;
  honors?: string[];
  activities?: string[];
  is_current?: boolean; // Helpful for ongoing education
  location?: string;
}

export interface CareerTimelineEntry {
  company: string;
  title: string;
  start_year: number;
  end_year: number; // Use 9999 or current year for ongoing positions
  industry: string;
  location: string;
  job_level: string; // e.g., "Entry Level", "Mid Level", "Senior", "Executive"
  job_function: string; // e.g., "Engineering", "Sales", "Marketing"
  department?: string;
  employment_type: string; // "Full-time", "Part-time", "Contract", "Internship"
  salary_range?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies_used?: string[];
  is_current?: boolean;
  years_at_company?: number; // Calculated field for easy filtering
  company_size?: string; // "Startup", "Small", "Medium", "Large", "Enterprise"
  is_leadership_role?: boolean;
}

export interface EducationTimeline {
  [year: string]: EducationTimelineEntry[];
}

export interface CareerTimeline {
  [year: string]: CareerTimelineEntry[];
}

// Interface for the new chronological search
export interface ChronologicalSearchFilters {
  // Basic search filters (MISSING - this is the bug fix!)
  school_filter?: string;
  company_filter?: string;
  industry_filter?: string;
  title_filter?: string;
  location_filter?: string;
  
  // Experience-based filters
  min_years_in_industry?: number;
  min_years_in_function?: number;
  min_years_at_company_type?: number;
  career_progression_pattern?: string; // e.g., "individual_contributor_to_management"
  
  // Education-based filters
  degree_level_progression?: string[]; // e.g., ["Bachelor's", "Master's"]
  education_industry_alignment?: boolean; // Education field matches career industry
  
  // Timeline-based filters
  gap_tolerance?: number; // Max acceptable gaps in months
  concurrent_activities?: boolean; // Working while studying, etc.
  
  // Specific patterns
  industry_transitions?: string[]; // Pattern of industry changes
  company_size_progression?: string[]; // Pattern of company size changes
  geographic_mobility?: boolean; // Moved locations for career
}

export interface ChronologicalSearchResult extends CompanySearchResult {
  career_timeline: CareerTimeline;
  education_timeline: EducationTimeline;
  career_analysis: {
    total_years_experience: number;
    years_in_target_industry: number;
    years_in_target_function: number;
    career_progression_score: number;
    industry_diversity_score: number;
    leadership_progression: boolean;
    education_career_alignment: number;
  };
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
      console.log(`[AI_SEARCH COMPANY] 🚀 Starting company search at ${new Date().toISOString()}`);
      console.log(`[AI_SEARCH COMPANY] 📝 Search parameters:`, {
        queryLength: query?.length || 0,
        targetResultCount: top_k,
        organizationProvided: !!organizationName,
        filterCategories: Object.keys(filters),
        nonEmptyFilters: Object.entries(filters).filter(([key, value]) => value !== undefined && value !== null && value !== false).length
      });
      
      // Get the organization name for dynamic RPC function naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Organization name resolution:`, {
        provided: organizationName,
        fromLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('organizationName') : 'N/A (server)',
        final: storedOrganizationName
      });
      console.log(`[AI_SEARCH COMPANY] 🏛️ Organization resolution:`, {
        providedOrg: organizationName,
        storedOrg: storedOrganizationName,
        isClient: typeof window !== 'undefined'
      });
      
      if (!storedOrganizationName) {
        console.error('[AI_SEARCH DEBUG] 🏢 ❌ Organization name is required for company search');
        console.error(`[AI_SEARCH COMPANY] ❌ Missing organization name - cannot proceed`);
        throw new Error('Organization name is required for company search');
      }
      
      // Construct dynamic RPC function name
      const rpcFunctionName = `enhanced_hybrid_search_${storedOrganizationName}`;
      console.log(`[AI_SEARCH DEBUG] 🏢 Using dynamic RPC function: ${rpcFunctionName}`);
      console.log(`[AI_SEARCH COMPANY] 🎯 Target SQL function: ${rpcFunctionName}`);
      
      // Generate embedding using OpenAI API
      console.log(`[AI_SEARCH DEBUG] 🏢 Generating embedding for query: "${query}"`);
      console.log(`[AI_SEARCH COMPANY] 🧠 Starting embedding generation`);
      
      let embeddingArray: number[];
      try {
        console.log(`[AI_SEARCH DEBUG] 🏢 🔑 Checking OpenAI configuration:`, {
          hasOpenAI: !!this.openai,
          hasApiKey: !!process.env.OPENAI_API_KEY,
          apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
          apiKeyStart: process.env.OPENAI_API_KEY?.substring(0, 10) || 'undefined'
        });
        console.log(`[AI_SEARCH COMPANY] 🔑 OpenAI configuration check:`, {
          clientInitialized: !!this.openai,
          apiKeyPresent: !!process.env.OPENAI_API_KEY,
          apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
        });
        
        const response = await this.openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
        });
        
        embeddingArray = response.data[0].embedding;
        console.log(`[AI_SEARCH DEBUG] 🏢 ✅ Embedding generated successfully, length: ${embeddingArray.length}`);
        console.log(`[AI_SEARCH COMPANY] ✅ Embedding generated: ${embeddingArray.length} dimensions`);
      } catch (embeddingError: unknown) {
        console.error(`[AI_SEARCH DEBUG] 🏢 ❌ EMBEDDING GENERATION FAILED:`, {
          errorType: embeddingError?.constructor?.name || 'unknown',
          errorMessage: embeddingError instanceof Error ? embeddingError.message : 'Unknown error',
          errorStack: embeddingError instanceof Error ? embeddingError.stack : 'No stack',
          query: query,
          hasOpenAI: !!this.openai,
          hasApiKey: !!process.env.OPENAI_API_KEY
        });
        console.error(`[AI_SEARCH COMPANY] ❌ Embedding generation failed:`, {
          error: embeddingError,
          message: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
        });
        throw new Error(`Failed to generate embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
      }
      
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
      console.log(`[AI_SEARCH COMPANY] 🔍 Filter extraction completed:`, {
        basicFilterCount: [company, industry, title, location, school].filter(f => f).length,
        enhancedFilterCount: [job_level_filter, job_function_filter, career_stage_filter, degree_level_filter, school_tier_filter].filter(f => f).length,
        booleanFilterCount: [leadership_only, management_exp_only, technical_background_only, sales_exp_only, startup_exp_only, enterprise_exp_only, remote_worker_only, mentor_potential_only, salary_lift_only].filter(f => f).length,
        rangeFilterCount: [exit_year_min, exit_year_max].filter(f => f !== undefined).length
      });
      
      console.log(`[AI_SEARCH DEBUG] 🏢 Calling ${rpcFunctionName} RPC function with enhanced filters`);
      console.log(`[AI_SEARCH COMPANY] 📡 Preparing Supabase RPC call`);
      
      // Construct dynamic company-specific parameter name for salary lift filter
      const dynamicSalaryLiftParam = `${storedOrganizationName}_salary_lift_only`;
      console.log(`[AI_SEARCH DEBUG] 🏢 Dynamic salary lift parameter: ${dynamicSalaryLiftParam}`);
      console.log(`[AI_SEARCH COMPANY] 💰 Dynamic salary parameter: ${dynamicSalaryLiftParam} = ${salary_lift_only}`);
      
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
      console.log(`[AI_SEARCH COMPANY] 📊 RPC parameters summary:`, {
        totalParams: Object.keys(rpcParams).length,
        nonNullParams: Object.entries(rpcParams).filter(([key, value]) => value !== null && value !== false).length,
        embeddingDimensions: rpcParams.query_embedding.length,
        similarityThreshold: rpcParams.similarity_threshold,
        resultLimit: rpcParams.limit_count
      });
      
      // Add detailed parameter inspection
      console.log(`[AI_SEARCH DEBUG] 🏢 📋 DETAILED PARAMETER INSPECTION:`);
      Object.entries(rpcParams).forEach(([key, value]) => {
        console.log(`[AI_SEARCH DEBUG] 🏢   ${key}: ${typeof value} = ${value === null ? 'NULL' : JSON.stringify(value)}`);
      });
      
      console.log(`[AI_SEARCH DEBUG] 🏢 🎯 EXPECTED SQL FUNCTION SIGNATURE:`);
      console.log(`[AI_SEARCH DEBUG] 🏢   enhanced_hybrid_search_chick_fil_a(`);
      console.log(`[AI_SEARCH DEBUG] 🏢     query_embedding vector(1536),`);
      console.log(`[AI_SEARCH DEBUG] 🏢     similarity_threshold float DEFAULT 0.3,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     company_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     industry_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     title_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     location_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     school_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     job_level_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     job_function_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     leadership_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     management_exp_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     technical_background_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     sales_exp_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     startup_exp_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     enterprise_exp_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     remote_worker_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     career_stage_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     degree_level_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     school_tier_filter text DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     mentor_potential_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     chick_fil_a_salary_lift_only boolean DEFAULT FALSE,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     exit_year_min int DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     exit_year_max int DEFAULT NULL,`);
      console.log(`[AI_SEARCH DEBUG] 🏢     limit_count int DEFAULT 10`);
      console.log(`[AI_SEARCH DEBUG] 🏢   )`);
      
      // Call the dynamic RPC function with all enhanced filters
      console.log(`[AI_SEARCH DEBUG] 🏢 🔄 Making Supabase RPC call to: ${rpcFunctionName}`);
      console.log(`[AI_SEARCH COMPANY] 📡 Executing Supabase RPC call`);
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
      console.log(`[AI_SEARCH COMPANY] 📈 RPC response received:`, {
        success: !error,
        resultCount: data?.length || 0,
        errorMessage: error?.message || null
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
        console.error(`[AI_SEARCH COMPANY] ❌ Supabase RPC error:`, {
          function: rpcFunctionName,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
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
      console.log(`[AI_SEARCH COMPANY] ✅ Search completed: ${data?.length || 0} raw results`);
      
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
        console.log(`[AI_SEARCH COMPANY] ⚠️ No results found - possible causes:`, [
          'Empty database table',
          'Filters too restrictive',
          'Similarity threshold too high',
          'Database function missing'
        ]);
        return [];
      }
      
      // Format the results for company search with enhanced field mapping
      console.log(`[AI_SEARCH DEBUG] 🏢 🔄 Processing ${data.length} raw results`);
      console.log(`[AI_SEARCH COMPANY] 🔄 Starting result processing`);
      const formattedResults = data.map((item: HybridSearchCompanyResult, index: number): CompanySearchResult => {
        console.log(`[AI_SEARCH DEBUG] 🏢 Processing result ${index + 1}/${data.length}:`, {
          id: item.id,
          name: item.name,
          similarity: item.similarity,
          hasProfileUrl: !!item.profile_url,
          hasCurrentCompany: !!item.post_company_current_company,
          hasCurrentTitle: !!item.post_company_current_title
        });
        console.log(`[AI_SEARCH COMPANY] 📝 Processing result ${index + 1}: ${item.name} (similarity: ${item.similarity})`);
        
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
      console.log(`[AI_SEARCH COMPANY] 📊 Result formatting completed: ${formattedResults.length} results`);

      // Apply gap-based filtering to the enriched results
      console.log(`[AI_SEARCH DEBUG] 🏢 🔍 Applying gap-based filtering...`);
      console.log(`[AI_SEARCH COMPANY] 🔍 Starting gap-based filtering`);
      const filteredResults = this.applyGapBasedFiltering(formattedResults) as CompanySearchResult[];
      console.log(`[AI_SEARCH DEBUG] 🏢 ✅ Gap-based filtering results:`, {
        beforeFiltering: formattedResults.length,
        afterFiltering: filteredResults.length,
        reductionPercentage: formattedResults.length > 0 ? Math.round((1 - filteredResults.length / formattedResults.length) * 100) : 0
      });
      console.log(`[AI_SEARCH COMPANY] ✅ Gap-based filtering completed: ${formattedResults.length} → ${filteredResults.length} results`);
      
      console.log(`[AI_SEARCH COMPANY] 🎉 Company search completed successfully: ${filteredResults.length} final results`);
      return filteredResults;
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] 🏢 ❌ CRITICAL ERROR in searchCompany:`, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        query,
        organizationName,
        filters
      });
      console.error(`[AI_SEARCH COMPANY] ❌ Critical search error:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        query: `"${query}"`,
        organization: organizationName
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
      console.log(`[AI_SEARCH TEMPORAL] 🚀 Starting temporal search at ${new Date().toISOString()}`);
      console.log(`[AI_SEARCH TEMPORAL] 📝 Search parameters:`, {
        query: `"${query}"`,
        temporalElementCount: Object.keys(temporalElements || {}).length,
        targetResults: top_k,
        organizationName,
        hasTemporalElements: !!temporalElements && Object.keys(temporalElements).length > 0
      });
      
      // Get the organization name for dynamic function naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      console.log(`[AI_SEARCH TEMPORAL] 🏛️ Organization resolution:`, {
        provided: organizationName,
        stored: storedOrganizationName,
        final: storedOrganizationName
      });
      
      if (!storedOrganizationName) {
        console.error(`[AI_SEARCH TEMPORAL] ❌ Missing organization name`);
        throw new Error('Organization name is required for temporal search');
      }
      
      // Generate embedding
      console.log(`[AI_SEARCH TEMPORAL] 🧠 Generating embedding for temporal search`);
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      console.log(`[AI_SEARCH TEMPORAL] ✅ Embedding generated: ${embeddingArray.length} dimensions`);
      
      // Extract temporal parameters
      const years = temporalElements.years || [];
      const functions = temporalElements.functions || [];
      
      console.log(`[AI_SEARCH TEMPORAL] 🔍 Temporal elements analysis:`, {
        years: years,
        functions: functions,
        yearCount: years.length,
        functionCount: functions.length,
        hasSequenceData: years.length >= 2 && functions.length >= 1
      });
      
      // Try specific sequence search first
      if (years.length >= 2 && functions.length >= 1) {
        const sequenceSearchFunc = `temporal_career_search_${storedOrganizationName}`;
        console.log(`[AI_SEARCH DEBUG] 🕐 Using sequence search: ${storedOrganizationName} in ${years[0]}, then ${functions[0]} in ${years[1]}`);
        console.log(`[AI_SEARCH TEMPORAL] 🎯 Attempting sequence search with function: ${sequenceSearchFunc}`);
        console.log(`[AI_SEARCH TEMPORAL] 📊 Sequence parameters:`, {
          targetCompanyYear: years[0],
          subsequentFunction: functions[0],
          subsequentYear: years[1]
        });
        
        const { data, error } = await this.supabase
          .rpc(sequenceSearchFunc, {
            p_target_company_year: years[0],
            p_subsequent_function: functions[0],
            p_subsequent_year: years[1],
            p_query_embedding: embeddingArray,
            p_similarity_threshold: 0.3, // Keep lower threshold for more candidates
            p_limit_count: 50 // Increase limit for gap-based filtering
          });
        
        console.log(`[AI_SEARCH TEMPORAL] 📈 Sequence search response:`, {
          success: !error,
          resultCount: data?.length || 0,
          errorMessage: error?.message || null
        });
        
        if (error) {
          console.error(`[AI_SEARCH DEBUG] 🕐 Sequence search error:`, error);
          console.error(`[AI_SEARCH TEMPORAL] ❌ Sequence search error:`, {
            function: sequenceSearchFunc,
            message: error.message,
            details: error.details
          });
          throw new Error(`Temporal sequence search failed: ${error.message}`);
        }
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Sequence search returned ${data?.length || 0} results`);
        
        // Apply gap-based filtering to sequence search results
        if (data && data.length > 0) {
          console.log(`[AI_SEARCH TEMPORAL] 🔍 Applying gap-based filtering to sequence results`);
          const filteredResults = this.applyGapBasedFiltering(data) as TemporalSearchResult[];
          console.log(`[AI_SEARCH DEBUG] 🕐 Gap-based filtering reduced sequence results from ${data.length} to ${filteredResults.length}`);
          console.log(`[AI_SEARCH TEMPORAL] ✅ Sequence search completed: ${filteredResults.length} final results`);
          return filteredResults;
        }
      }
      
      // Fallback to general temporal filter search
      if (years.length >= 1 || functions.length >= 1) {
        const filterSearchFunc = `temporal_filter_search_${storedOrganizationName}`;
        console.log(`[AI_SEARCH DEBUG] 🕐 Using general temporal filter search`);
        console.log(`[AI_SEARCH TEMPORAL] 🔄 Attempting general filter search with function: ${filterSearchFunc}`);
        console.log(`[AI_SEARCH TEMPORAL] 📊 Filter parameters:`, {
          yearsFilter: years.length > 0 ? years : null,
          functionsFilter: functions.length > 0 ? functions : null
        });
        
        const { data, error } = await this.supabase
          .rpc(filterSearchFunc, {
            p_query_embedding: embeddingArray,
            p_similarity_threshold: 0.3, // Keep lower threshold for more candidates
            p_company_years_filter: years.length > 0 ? years : null,
            p_functions_filter: functions.length > 0 ? functions : null,
            p_limit_count: 50 // Increase limit for gap-based filtering
          });
        
        console.log(`[AI_SEARCH TEMPORAL] 📈 Filter search response:`, {
          success: !error,
          resultCount: data?.length || 0,
          errorMessage: error?.message || null
        });
        
        if (error) {
          console.error(`[AI_SEARCH DEBUG] 🕐 Temporal filter error:`, error);
          console.error(`[AI_SEARCH TEMPORAL] ❌ Filter search error:`, {
            function: filterSearchFunc,
            message: error.message,
            details: error.details
          });
          throw new Error(`Temporal filter search failed: ${error.message}`);
        }
        
        console.log(`[AI_SEARCH DEBUG] 🕐 Temporal filter returned ${data?.length || 0} results`);
        
        // Apply gap-based filtering to filter search results
        if (data && data.length > 0) {
          console.log(`[AI_SEARCH TEMPORAL] 🔍 Applying gap-based filtering to filter results`);
          const filteredResults = this.applyGapBasedFiltering(data) as TemporalSearchResult[];
          console.log(`[AI_SEARCH DEBUG] 🕐 Gap-based filtering reduced filter results from ${data.length} to ${filteredResults.length}`);
          console.log(`[AI_SEARCH TEMPORAL] ✅ Filter search completed: ${filteredResults.length} final results`);
          return filteredResults;
        }
      }
      
      console.log(`[AI_SEARCH DEBUG] 🕐 Insufficient temporal data, returning empty results`);
      console.log(`[AI_SEARCH TEMPORAL] ⚠️ Insufficient temporal data for search`);
      return [];
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] 🕐 Temporal search error:`, error);
      console.error(`[AI_SEARCH TEMPORAL] ❌ Critical temporal search error:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        query: `"${query}"`,
        organizationName
      });
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
  
  async searchChronological(
    query: string,
    filters: ChronologicalSearchFilters = {},
    top_k: number = 10,
    organizationName?: string
  ): Promise<ChronologicalSearchResult[]> {
    console.log(`[AI SEARCH] 📈 Starting chronological search for: "${query}"`);
    console.log(`[AI SEARCH] 🔧 Chronological filters:`, filters);
    console.log(`[AI SEARCH] 🏢 Organization: ${organizationName || 'default'}`);
    
    if (!organizationName) {
      console.log(`[AI SEARCH] ⚠️ No organization name provided, falling back to legacy search`);
      return this.searchChronologicalLegacy(query, filters, top_k, 'default');
    }
    
    // Check if LLM integration function exists for this organization
    const sqlFunctionName = `llm_integrated_chronological_search_${organizationName}`;
    console.log(`[AI SEARCH] 🔍 Checking for LLM integration function: ${sqlFunctionName}`);
    
    try {
      // Test if the function exists by calling it with minimal parameters
      const { data: testData, error: testError } = await this.supabase.rpc(sqlFunctionName, {
        chronological_filters: {},
        limit_count: 1
      });
      
      if (testError) {
        console.log(`[AI SEARCH] ❌ LLM integration function not available: ${testError.message}`);
        console.log(`[AI SEARCH] 🔄 Falling back to legacy chronological search`);
        return this.searchChronologicalLegacy(query, filters, top_k, organizationName);
      }
      
      console.log(`[AI SEARCH] ✅ LLM integration function available, using enhanced search`);
      return this.searchChronologicalWithLLMIntegration(query, filters, top_k, organizationName);
      
    } catch (error) {
      console.error(`[AI SEARCH] ❌ Error testing LLM integration function:`, error);
      console.log(`[AI SEARCH] 🔄 Falling back to legacy chronological search`);
      return this.searchChronologicalLegacy(query, filters, top_k, organizationName);
    }
  }

  private async searchChronologicalWithLLMIntegration(
    query: string,
    filters: ChronologicalSearchFilters,
    top_k: number,
    organizationName: string
  ): Promise<ChronologicalSearchResult[]> {
    console.log(`[AI SEARCH LLM] 🚀 Starting simplified chronological search`);
    console.log(`[AI SEARCH LLM] 📊 Input parameters:`, {
      query: query,
      filtersProvided: Object.keys(filters).length,
      topK: top_k,
      organization: organizationName
    });
    
    const sqlFunctionName = `llm_integrated_chronological_search_${organizationName}`;
    
    try {
      console.log(`[AI SEARCH LLM] 📡 Calling SQL function: ${sqlFunctionName}`);
      console.log(`[AI SEARCH LLM] 📝 Function parameters:`, {
        chronological_filters: filters,
        limit_count: top_k,
        organization_name: organizationName
      });
      
      const { data, error } = await this.supabase.rpc(sqlFunctionName, {
        chronological_filters: filters,
        limit_count: top_k,
        organization_name: organizationName
      });
      
      if (error) {
        console.error(`[AI SEARCH LLM] ❌ SQL function error:`, {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        throw error;
      }
      
      console.log(`[AI SEARCH LLM] ✅ SQL function executed successfully`);
      console.log(`[AI SEARCH LLM] 📊 Raw results received:`, {
        resultCount: data?.length || 0,
        firstResult: data?.[0] ? {
          profile_id: data[0].profile_id,
          name: data[0].name,
          hasCareerTimeline: !!data[0].career_timeline,
          hasEducationTimeline: !!data[0].education_timeline,
          total_years_experience: data[0].total_years_experience
        } : null
      });
      
      if (!data || data.length === 0) {
        console.log(`[AI SEARCH LLM] ⚠️ No results returned from SQL function`);
        return [];
      }
      
      // Transform results to match expected interface
      const transformedResults: ChronologicalSearchResult[] = data.map((row: any) => ({
        // Base CompanySearchResult fields
        id: row.profile_id,
        profile_id: row.profile_id,
        name: row.name,
        profile_url: '', // Not provided by chronological search
        post_company_current_company: row.current_company || '',
        post_company_current_title: row.current_title || '',
        post_company_current_industry: row.current_industry || '',
        post_company_current_location: row.current_location || '',
        picture_url: undefined,
        similarity: 1.0, // All results are equally valid since they passed strict filters
        industry: row.current_industry || '',
        headline: '',
        
        // Enhanced fields with defaults
        current_job_level: '',
        current_job_function: '',
        career_stage: '',
        highest_degree_level: row.highest_degree_level || '',
        school_ranking_tier: '',
        
        // Boolean characteristics with defaults
        is_current_leader: false,
        management_experience: false,
        technical_background: false,
        sales_experience: false,
        has_startup_experience: false,
        has_enterprise_experience: false,
        is_remote_worker: false,
        mentor_potential: false,
        
        // Array fields with defaults
        undergraduate_school: [],
        graduate_school: [],
        high_school: [],
        pre_company_education: [],
        during_company_education: [],
        post_company_education: [],
        post_company_companies: [],
        post_company_titles: [],
        post_company_industries: [],
        post_company_locations: [],
        functional_expertise: [],
        industry_expertise: [],
        
        // Salary fields with defaults
        current_estimated_salary: 0,
        highest_career_salary: 0,
        major_category: '',
        
        // Chronological-specific fields
        career_timeline: row.career_timeline || {},
        education_timeline: row.education_timeline || {},
        career_analysis: {
          total_years_experience: row.total_years_experience || 0,
          years_in_target_industry: row.years_in_target_industry || 0,
          years_in_target_function: 0, // Not provided by current function
          career_progression_score: 0, // No longer calculated
          industry_diversity_score: 0, // Not provided by current function
          leadership_progression: false, // Not provided by current function
          education_career_alignment: 0 // Not provided by current function
        }
      }));
      
      console.log(`[AI SEARCH LLM] 🎯 Transformation completed:`, {
        originalCount: data.length,
        transformedCount: transformedResults.length,
        sampleResult: transformedResults[0] ? {
          id: transformedResults[0].id,
          name: transformedResults[0].name,
          similarity: transformedResults[0].similarity,
          hasCareerTimeline: !!transformedResults[0].career_timeline,
          hasEducationTimeline: !!transformedResults[0].education_timeline,
          totalExperience: transformedResults[0].career_analysis.total_years_experience
        } : null
      });
      
      return transformedResults;
      
    } catch (error) {
      console.error(`[AI SEARCH LLM] ❌ Critical error in simplified chronological search:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        sqlFunction: sqlFunctionName,
        query: query,
        filters: filters
      });
      throw error;
    }
  }
  
  /**
   * LEGACY: Original chronological search implementation (fallback)
   */
  private async searchChronologicalLegacy(
    query: string,
    filters: ChronologicalSearchFilters,
    top_k: number,
    organizationName: string
  ): Promise<ChronologicalSearchResult[]> {
    try {
      // Generate embedding for semantic similarity
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      
      const embeddingArray = response.data[0].embedding;
      
      // Construct the legacy RPC function name
      const rpcFunctionName = `chronological_search_${organizationName}`;
      console.log(`[AI_SEARCH DEBUG] 📊 Using legacy chronological RPC function: ${rpcFunctionName}`);
      
      // Build legacy RPC parameters
      const rpcParams = {
        query_embedding: embeddingArray,
        similarity_threshold: 0.3,
        min_years_in_industry: filters.min_years_in_industry || null,
        min_years_in_function: filters.min_years_in_function || null,
        min_years_at_company_type: filters.min_years_at_company_type || null,
        career_progression_pattern: filters.career_progression_pattern || null,
        degree_level_progression: filters.degree_level_progression || null,
        education_industry_alignment: filters.education_industry_alignment || false,
        gap_tolerance: filters.gap_tolerance || 6,
        concurrent_activities: filters.concurrent_activities || false,
        industry_transitions: filters.industry_transitions || null,
        company_size_progression: filters.company_size_progression || null,
        geographic_mobility: filters.geographic_mobility || false,
        limit_count: 50
      };
      
      console.log(`[AI_SEARCH DEBUG] 📊 Calling ${rpcFunctionName} with legacy parameters:`, rpcParams);
      
      // Call the legacy chronological search RPC function
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, rpcParams)
        .returns<any[]>();
      
      if (error) {
        console.error(`[AI_SEARCH DEBUG] 📊 Legacy chronological search error:`, error);
        throw new Error(`Legacy chronological search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH DEBUG] 📊 Legacy chronological search returned ${data?.length || 0} results`);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Process and analyze the chronological data using legacy method
      const processedResults = data.map((item: any): ChronologicalSearchResult => {
        // Parse the timeline JSONs
        const careerTimeline: CareerTimeline = item.career_timeline || {};
        const educationTimeline: EducationTimeline = item.education_timeline || {};
        
        // Analyze the career progression using legacy method
        const careerAnalysis = this.analyzeCareerProgression(careerTimeline, educationTimeline, filters);
        
        // Convert to ChronologicalSearchResult format
        return {
          // Standard fields 
          id: item.id,
          profile_id: item.profile_id,
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
          current_job_level: item.current_job_level || '',
          current_job_function: item.current_job_function || '',
          career_stage: item.career_stage || '',
          highest_degree_level: item.highest_degree_level || '',
          school_ranking_tier: item.school_ranking_tier || '',
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
          major_category: item.major_category || '',
          
          // Add chronological-specific fields
          career_timeline: careerTimeline,
          education_timeline: educationTimeline,
          career_analysis: careerAnalysis
        };
      });
      
      // Apply gap-based filtering
      const filteredResults = this.applyGapBasedFiltering(processedResults) as ChronologicalSearchResult[];
      console.log(`[AI_SEARCH DEBUG] 📊 Legacy chronological search gap-based filtering: ${data.length} -> ${filteredResults.length}`);
      
      return filteredResults;
      
    } catch (error) {
      console.error(`[AI_SEARCH DEBUG] 📊 Legacy chronological search error:`, error);
      throw error;
    }
  }
  
  /**
   * Analyze career progression based on timeline data
   */
  private analyzeCareerProgression(
    careerTimeline: CareerTimeline, 
    educationTimeline: EducationTimeline,
    filters: ChronologicalSearchFilters
  ) {
    // Extract all career entries and sort by start year
    const allCareerEntries: CareerTimelineEntry[] = [];
    Object.values(careerTimeline).forEach(yearEntries => {
      allCareerEntries.push(...yearEntries);
    });
    
    // Remove duplicates and sort by start year
    const uniqueCareerEntries = allCareerEntries
      .filter((entry, index, self) => 
        index === self.findIndex(e => e.company === entry.company && e.start_year === entry.start_year)
      )
      .sort((a, b) => a.start_year - b.start_year);
    
    // Calculate experience metrics
    const totalYearsExperience = this.calculateTotalYearsExperience(uniqueCareerEntries);
    const yearsInTargetIndustry = filters.min_years_in_industry ? 
      this.calculateYearsInIndustry(uniqueCareerEntries, filters.min_years_in_industry) : 0;
    const yearsInTargetFunction = filters.min_years_in_function ?
      this.calculateYearsInFunction(uniqueCareerEntries, filters.min_years_in_function) : 0;
    
    // Calculate progression scores
    const careerProgressionScore = this.calculateProgressionScore(uniqueCareerEntries);
    const industryDiversityScore = this.calculateIndustryDiversityScore(uniqueCareerEntries);
    const leadershipProgression = this.hasLeadershipProgression(uniqueCareerEntries);
    const educationCareerAlignment = this.calculateEducationCareerAlignment(educationTimeline, careerTimeline);
    
    return {
      total_years_experience: totalYearsExperience,
      years_in_target_industry: yearsInTargetIndustry,
      years_in_target_function: yearsInTargetFunction,
      career_progression_score: careerProgressionScore,
      industry_diversity_score: industryDiversityScore,
      leadership_progression: leadershipProgression,
      education_career_alignment: educationCareerAlignment
    };
  }
  
  private calculateTotalYearsExperience(careerEntries: CareerTimelineEntry[]): number {
    if (careerEntries.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    
    careerEntries.forEach(entry => {
      const endYear = entry.end_year === 9999 ? currentYear : entry.end_year;
      totalYears += (endYear - entry.start_year);
    });
    
    return totalYears;
  }
  
  private calculateYearsInIndustry(careerEntries: CareerTimelineEntry[], targetIndustry: number): number {
    // This would need to be implemented based on your specific industry matching logic
    return 0;
  }
  
  private calculateYearsInFunction(careerEntries: CareerTimelineEntry[], targetFunction: number): number {
    // This would need to be implemented based on your specific function matching logic
    return 0;
  }
  
  private calculateProgressionScore(careerEntries: CareerTimelineEntry[]): number {
    // Calculate based on job level progression, salary increases, company size progression, etc.
    return 0.5; // Placeholder
  }
  
  private calculateIndustryDiversityScore(careerEntries: CareerTimelineEntry[]): number {
    const uniqueIndustries = new Set(careerEntries.map(entry => entry.industry));
    return uniqueIndustries.size / Math.max(careerEntries.length, 1);
  }
  
  private hasLeadershipProgression(careerEntries: CareerTimelineEntry[]): boolean {
    return careerEntries.some(entry => entry.is_leadership_role);
  }
  
  private calculateEducationCareerAlignment(educationTimeline: EducationTimeline, careerTimeline: CareerTimeline): number {
    // Calculate how well education aligns with career choices
    return 0.5; // Placeholder
  }

  // NEW: Comprehensive Standard Search using SQL filtering (no embeddings)
  async standardSearch(
    query: string,
    filters: any = {},
    top_k: number = 50,
    organizationName?: string
  ): Promise<CompanySearchResult[]> {
    console.log(`[AI_SEARCH STANDARD] 🚀 Starting comprehensive standard search for: "${query}"`);
    console.log(`[AI_SEARCH STANDARD] 📊 Filters provided:`, filters);
    console.log(`[AI_SEARCH STANDARD] 🏢 Organization: ${organizationName}`);
    
    try {
      // Get the organization name for dynamic table naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      if (!storedOrganizationName) {
        console.error(`[AI_SEARCH STANDARD] ❌ Organization name is required for standard search`);
        throw new Error('Organization name is required for standard search');
      }
      
      // Construct dynamic RPC function name
      const rpcFunctionName = `comprehensive_standard_search_${storedOrganizationName}`;
      console.log(`[AI_SEARCH STANDARD] 🎯 Target SQL function: ${rpcFunctionName}`);
      
      // Build comprehensive RPC parameters
      const rpcParams: any = {
        // 1. BASIC ENTITY FILTERS
        company_filter: filters.company_filter || null,
        company_filters: filters.company_filters || null,
        company_or_logic: filters.company_or_logic || false,
        
        industry_filter: filters.industry_filter || null,
        industry_filters: filters.industry_filters || null,
        industry_or_logic: filters.industry_or_logic || false,
        
        title_filter: filters.title_filter || null,
        title_filters: filters.title_filters || null,
        title_or_logic: filters.title_or_logic || false,
        
        location_filter: filters.location_filter || null,
        location_filters: filters.location_filters || null,
        location_or_logic: filters.location_or_logic || false,
        
        school_filter: filters.school_filter || null,
        school_filters: filters.school_filters || null,
        school_or_logic: filters.school_or_logic || false,
        
        // 2. CAREER PROGRESSION & LEADERSHIP FILTERS
        current_job_level_filter: filters.current_job_level_filter || null,
        current_job_level_filters: filters.current_job_level_filters || null,
        current_job_level_or_logic: filters.current_job_level_or_logic || false,
        
        current_job_function_filter: filters.current_job_function_filter || null,
        current_job_function_filters: filters.current_job_function_filters || null,
        current_job_function_or_logic: filters.current_job_function_or_logic || false,
        
        career_stage_filter: filters.career_stage_filter || null,
        career_trajectory_filter: filters.career_trajectory_filter || null,
        career_trajectory_filters: filters.career_trajectory_filters || null,
        career_trajectory_or_logic: filters.career_trajectory_or_logic || false,
        
        is_current_leader: filters.is_current_leader || false,
        management_experience: filters.management_experience || false,
        revenue_responsibility: filters.revenue_responsibility || false,
        
        // 3. COMPANY & INDUSTRY INTELLIGENCE
        current_company_size_category_filter: filters.current_company_size_category_filter || null,
        current_company_size_category_filters: filters.current_company_size_category_filters || null,
        current_company_size_category_or_logic: filters.current_company_size_category_or_logic || false,
        
        has_startup_experience: filters.has_startup_experience || false,
        has_enterprise_experience: filters.has_enterprise_experience || false,
        industry_transitions_filter: filters.industry_transitions_filter || null,
        
        // 4. SKILLS & EXPERIENCE PATTERNS
        technical_background: filters.technical_background || false,
        sales_experience: filters.sales_experience || false,
        consulting_experience: filters.consulting_experience || false,
        restaurant_operations_experience: filters.restaurant_operations_experience || false,
        is_remote_worker: filters.is_remote_worker || false,
        
        functional_expertise_filter: filters.functional_expertise_filter || null,
        functional_expertise_or_logic: filters.functional_expertise_or_logic || false,
        
        industry_expertise_filter: filters.industry_expertise_filter || null,
        industry_expertise_or_logic: filters.industry_expertise_or_logic || false,
        
        // 5. EDUCATIONAL BACKGROUND & CONTEXT
        highest_degree_level_filter: filters.highest_degree_level_filter || null,
        highest_degree_level_filters: filters.highest_degree_level_filters || null,
        highest_degree_level_or_logic: filters.highest_degree_level_or_logic || false,
        
        school_ranking_tier_filter: filters.school_ranking_tier_filter || null,
        school_ranking_tier_filters: filters.school_ranking_tier_filters || null,
        school_ranking_tier_or_logic: filters.school_ranking_tier_or_logic || false,
        
        major_category_filter: filters.major_category_filter || null,
        major_category_filters: filters.major_category_filters || null,
        major_category_or_logic: filters.major_category_or_logic || false,
        
        undergraduate_major_filter: filters.undergraduate_major_filter || null,
        undergraduate_major_filters: filters.undergraduate_major_filters || null,
        undergraduate_major_or_logic: filters.undergraduate_major_or_logic || false,
        
        graduate_specialization_filter: filters.graduate_specialization_filter || null,
        graduate_specialization_filters: filters.graduate_specialization_filters || null,
        graduate_specialization_or_logic: filters.graduate_specialization_or_logic || false,
        
        stem_education: filters.stem_education || false,
        business_education: filters.business_education || false,
        elite_education: filters.elite_education || false,
        continued_education: filters.continued_education || false,
        executive_education: filters.executive_education || false,
        technical_certifications: filters.technical_certifications || false,
        
        // 6. ENHANCED SEARCH CATEGORIES
        mentor_potential: filters.mentor_potential || false,
        likely_job_seeking: filters.likely_job_seeking || false,
        total_positions_min: filters.total_positions_min || null,
        total_positions_max: filters.total_positions_max || null,
        average_tenure_min_months: filters.average_tenure_min_months || null,
        average_tenure_max_months: filters.average_tenure_max_months || null,
        
        // 7. COMPANY IMPACT METRICS (Organization-specific)
        company_provided_salary_lift: filters.company_provided_salary_lift || false,
        achieved_six_figure_post_company: filters.achieved_six_figure_post_company || false,
        doubled_salary_post_company: filters.doubled_salary_post_company || false,
        moved_to_leadership_post_company: filters.moved_to_leadership_post_company || false,
        career_level_increase_post_company: filters.career_level_increase_post_company || false,
        
        // 8. GEOGRAPHIC & LOCATION
        home_location_filter: filters.home_location_filter || null,
        home_location_filters: filters.home_location_filters || null,
        home_location_or_logic: filters.home_location_or_logic || false,
        
        education_geography_filter: filters.education_geography_filter || null,
        education_geography_or_logic: filters.education_geography_or_logic || false,
        
        // 9. SALARY ANALYSIS FIELDS
        min_current_salary: filters.min_current_salary || null,
        max_current_salary: filters.max_current_salary || null,
        min_highest_career_salary: filters.min_highest_career_salary || null,
        max_highest_career_salary: filters.max_highest_career_salary || null,
        salary_growth_indicator: filters.salary_growth_indicator || false,
        
        // 10. ARRAY FIELDS FOR COMPREHENSIVE SEARCH (OR Logic)
        post_company_companies_filter: filters.post_company_companies_filter || null,
        post_company_companies_or_logic: filters.post_company_companies_or_logic || false,
        
        post_company_titles_filter: filters.post_company_titles_filter || null,
        post_company_titles_or_logic: filters.post_company_titles_or_logic || false,
        
        post_company_industries_filter: filters.post_company_industries_filter || null,
        post_company_industries_or_logic: filters.post_company_industries_or_logic || false,
        
        pre_company_companies_filter: filters.pre_company_companies_filter || null,
        pre_company_companies_or_logic: filters.pre_company_companies_or_logic || false,
        
        pre_company_titles_filter: filters.pre_company_titles_filter || null,
        pre_company_titles_or_logic: filters.pre_company_titles_or_logic || false,
        
        undergraduate_schools_filter: filters.undergraduate_schools_filter || null,
        undergraduate_schools_or_logic: filters.undergraduate_schools_or_logic || false,
        
        graduate_schools_filter: filters.graduate_schools_filter || null,
        graduate_schools_or_logic: filters.graduate_schools_or_logic || false,
        
        // Query parameters
        search_query: query,
        limit_count: top_k
      };
      
      console.log(`[AI_SEARCH STANDARD] 📡 Calling ${rpcFunctionName} with comprehensive filters`);
      console.log(`[AI_SEARCH STANDARD] 📊 Parameter summary:`, {
        totalParams: Object.keys(rpcParams).length,
        nonNullParams: Object.entries(rpcParams).filter(([key, value]) => 
          value !== null && value !== false && (Array.isArray(value) ? value.length > 0 : true)
        ).length,
        hasBasicFilters: !!(rpcParams.company_filter || rpcParams.industry_filter || rpcParams.title_filter),
        hasCareerFilters: !!(rpcParams.current_job_level_filter || rpcParams.is_current_leader),
        hasSkillsFilters: !!(rpcParams.technical_background || rpcParams.sales_experience),
        hasEducationFilters: !!(rpcParams.highest_degree_level_filter || rpcParams.stem_education),
        hasSalaryFilters: !!(rpcParams.min_current_salary || rpcParams.salary_growth_indicator),
        hasArrayFilters: !!(rpcParams.functional_expertise_filter || rpcParams.post_company_companies_filter)
      });
      
      // Call the comprehensive standard search RPC function
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, rpcParams)
        .returns<HybridSearchCompanyResult[]>();
      
      if (error) {
        console.error(`[AI_SEARCH STANDARD] ❌ SQL function error:`, {
          function: rpcFunctionName,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Standard search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH STANDARD] ✅ SQL function executed successfully: ${data?.length || 0} results`);
      
      if (!data || data.length === 0) {
        console.log(`[AI_SEARCH STANDARD] ⚠️ No results found`);
        return [];
      }
      
      // Format the results
      const formattedResults = data.map((item: HybridSearchCompanyResult, index: number): CompanySearchResult => {
        console.log(`[AI_SEARCH STANDARD] 📝 Processing result ${index + 1}: ${item.name}`);
        
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
          similarity: 1.0, // No similarity score for SQL-based search
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
        
        // Handle dynamic company-specific fields
        Object.keys(item).forEach(key => {
          if (key.includes(storedOrganizationName) || key.startsWith('achieved_') || key.startsWith('doubled_') || key.startsWith('moved_to_')) {
            (baseResult as any)[key] = item[key];
          }
        });
        
        return baseResult;
      });

      console.log(`[AI_SEARCH STANDARD] 📊 Standard search completed: ${formattedResults.length} results`);
      return formattedResults;
      
    } catch (error) {
      console.error(`[AI_SEARCH STANDARD] ❌ Critical error in standard search:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        query: `"${query}"`,
        organizationName
      });
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