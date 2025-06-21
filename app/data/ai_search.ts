import { createClient } from '@supabase/supabase-js';


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
  current_general_industry: string;
  current_job_location: string;
  years_experience: number;
  profile_photo_url?: string;
  headline: string;
  
  // Enhanced fields
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
  
  // Enhanced career and salary fields for compatibility
  profile_id?: number;
  profile_url?: string;
  post_company_current_company?: string;
  post_company_current_title?: string;
  post_company_current_industry?: string;
  post_company_current_location?: string;
  picture_url?: string;
  industry?: string;
  career_stage?: string;
  school_ranking_tier?: string;
  current_estimated_salary?: number;
  highest_career_salary?: number;
  is_current_leader?: boolean;
  management_experience?: boolean;
  technical_background?: boolean;
  sales_experience?: boolean;
  has_startup_experience?: boolean;
  has_enterprise_experience?: boolean;
  is_remote_worker?: boolean;
  mentor_potential?: boolean;
  post_company_companies?: string[];
  post_company_titles?: string[];
  post_company_industries?: string[];
  post_company_locations?: string[];
  functional_expertise?: string[];
  industry_expertise?: string[];
  
  // PRE-COMPANY CAREER FIELDS (Background/Network Analysis)
  pre_company_companies?: string[];
  pre_company_titles?: string[];
  pre_company_industries?: string[];
  pre_company_locations?: string[];
  
  // Dynamic company-specific fields
  [key: string]: any;
}


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
  education_timeline: any;
  [key: string]: any;
  post_company_current_company: string;
  post_company_current_title: string;
}

export interface EducationTimelineEntry {
  degree: string;
  school: string;
  start_year: number;
  end_year: number;
  degree_level: string;
  field_of_study: string;
  graduation_year: number;
  gpa?: number;
  honors?: string[];
  activities?: string[];
  is_current?: boolean;
  location?: string;
}

export interface CareerTimelineEntry {
  company: string;
  title: string;
  start_year: number;
  end_year: number;
  industry: string;
  location: string;
  job_level: string;
  job_function: string;
  department?: string;
  employment_type: string;
  salary_range?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies_used?: string[];
  is_current?: boolean;
  years_at_company?: number;
  company_size?: string;
  is_leadership_role?: boolean;
}

export interface EducationTimeline {
  [year: string]: EducationTimelineEntry[];
}

export interface CareerTimeline {
  [year: string]: CareerTimelineEntry[];
}

export interface ChronologicalSearchFilters {
  school_filter?: string;
  company_filter?: string;
  industry_filter?: string;
  title_filter?: string;
  location_filter?: string;
  
  min_years_in_industry?: number;
  min_years_in_function?: number;
  min_years_at_company_type?: number;
  career_progression_pattern?: string;
  
  degree_level_progression?: string[];
  education_industry_alignment?: boolean;
  
  gap_tolerance?: number;
  concurrent_activities?: boolean;
  
  industry_transitions?: string[];
  company_size_progression?: string[];
  geographic_mobility?: boolean;
}

export interface ChronologicalSearchResult extends SearchResult {
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

// Type aliases for backward compatibility
type CompanySearchResult = SearchResult;
type CompanySearchFilters = SearchFilters;

export class LinkedInProfileSearchEngine {
  private supabase;
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  }
  
  // Comprehensive Standard Search using SQL filtering
  async standardSearch(
    query: string,
    filters: any = {},
    top_k: number = 50,
    organizationName?: string
  ): Promise<CompanySearchResult[]> {
    console.log(`[AI_SEARCH STANDARD] 🚀 Starting comprehensive standard search for: "${query}"`);
    console.log(`[AI_SEARCH STANDARD] 📊 Filters provided:`, filters);
    console.log(`[AI_SEARCH STANDARD] 🔍 DETAILED filter analysis:`, {
      filtersType: typeof filters,
      filtersKeys: Object.keys(filters || {}),
      hasSchoolFilter: !!filters?.school_filter,
      schoolFilterValue: filters?.school_filter,
      hasCompanyFilter: !!filters?.company_filter,
      companyFilterValue: filters?.company_filter,
      filterCount: Object.keys(filters || {}).length
    });
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
      
      // Build comprehensive search filters as a single JSON object
      const searchFilters = {
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
        
        // NEW: MATHEMATICAL SALARY COMPARISON FIELDS
        post_salary_greater_than_pre: filters.post_salary_greater_than_pre || false,
        current_salary_greater_than_first_post: filters.current_salary_greater_than_first_post || false,
        min_salary_growth_percentage: filters.min_salary_growth_percentage || null,
        max_salary_growth_percentage: filters.max_salary_growth_percentage || null,
        min_salary_increase_amount: filters.min_salary_increase_amount || null,
        min_salary_multiplier: filters.min_salary_multiplier || null,
        current_salary_near_peak: filters.current_salary_near_peak || false,
        salary_range_pre_company: filters.salary_range_pre_company || null,
        salary_range_post_company: filters.salary_range_post_company || null,
        min_pre_chick_fil_a_salary: filters.min_pre_chick_fil_a_salary || null,
        min_first_post_chick_fil_a_salary: filters.min_first_post_chick_fil_a_salary || null,
        
        // 10. COMPREHENSIVE ARRAY FIELDS FOR CAREER TRACKING (PRE + POST COMPANY)
        // PRE-COMPANY FIELDS (Background/Network Analysis)
        pre_company_companies_filter: filters.pre_company_companies_filter || null,
        pre_company_companies_or_logic: filters.pre_company_companies_or_logic || false,
        
        pre_company_titles_filter: filters.pre_company_titles_filter || null,
        pre_company_titles_or_logic: filters.pre_company_titles_or_logic || false,
        
        pre_company_industries_filter: filters.pre_company_industries_filter || null,
        pre_company_industries_or_logic: filters.pre_company_industries_or_logic || false,
        
        pre_company_locations_filter: filters.pre_company_locations_filter || null,
        pre_company_locations_or_logic: filters.pre_company_locations_or_logic || false,
        
        // POST-COMPANY FIELDS (Current/Recent Career Path)
        post_company_companies_filter: filters.post_company_companies_filter || null,
        post_company_companies_or_logic: filters.post_company_companies_or_logic || false,
        
        post_company_titles_filter: filters.post_company_titles_filter || null,
        post_company_titles_or_logic: filters.post_company_titles_or_logic || false,
        
        post_company_industries_filter: filters.post_company_industries_filter || null,
        post_company_industries_or_logic: filters.post_company_industries_or_logic || false,
        
        post_company_locations_filter: filters.post_company_locations_filter || null,
        post_company_locations_or_logic: filters.post_company_locations_or_logic || false,
        
        // EDUCATION FIELDS
        undergraduate_schools_filter: filters.undergraduate_schools_filter || null,
        undergraduate_schools_or_logic: filters.undergraduate_schools_or_logic || false,
        
        graduate_schools_filter: filters.graduate_schools_filter || null,
        graduate_schools_or_logic: filters.graduate_schools_or_logic || false
      };

      const activeSearchFilters: { [key: string]: any } = {};
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== null && value !== false && value !== undefined) {
          if (Array.isArray(value) && value.length === 0) {
            return; // Skip empty arrays
          }
          activeSearchFilters[key] = value;
        }
      });
      console.log(`[AI_SEARCH STANDARD] 🧹 Cleaned active filters being sent to SQL:`, activeSearchFilters);
      
      console.log(`[AI_SEARCH STANDARD] 📡 Calling ${rpcFunctionName} with JSON filters`);

      console.log(`[AI_SEARCH STANDARD] 📊 Filter summary:`, {
        totalFilterKeys: Object.keys(searchFilters).length,
        nonNullFilters: Object.entries(searchFilters).filter(([key, value]) => 
          value !== null && value !== false && (Array.isArray(value) ? value.length > 0 : true)
        ).length,
        hasBasicFilters: !!(searchFilters.company_filter || searchFilters.industry_filter || searchFilters.title_filter),
        hasCareerFilters: !!(searchFilters.current_job_level_filter || searchFilters.is_current_leader),
        hasSkillsFilters: !!(searchFilters.technical_background || searchFilters.sales_experience),
        hasEducationFilters: !!(searchFilters.highest_degree_level_filter || searchFilters.stem_education),
        hasSalaryFilters: !!(searchFilters.min_current_salary || searchFilters.salary_growth_indicator),
        hasArrayFilters: !!(searchFilters.functional_expertise_filter || searchFilters.post_company_companies_filter),
        hasSchoolFilter: !!searchFilters.school_filter,
        schoolFilterValue: searchFilters.school_filter
      });
      
      // 🔍 DEBUG: Log the exact RPC call being made
      console.log(`[AI_SEARCH STANDARD] 🎯 EXACT RPC CALL: this.supabase.rpc("${rpcFunctionName}", ${JSON.stringify({
        search_filters: searchFilters,
        // search_query: query,  // ← TEMPORARILY DISABLED TO TEST
        limit_count: top_k
      })})`);
      
      // Call the comprehensive standard search RPC function with JSON parameter
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, {
          search_filters: activeSearchFilters,
          // search_query: query,  // ← TEMPORARILY DISABLED TO TEST
          limit_count: top_k
        })
        .returns<any[]>();
      
      // 🔍 DEBUG: Log the exact response from Supabase
      console.log(`[AI_SEARCH STANDARD] 📥 SUPABASE RESPONSE:`, {
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code,
        firstResult: data?.[0] ? { id: data[0].id, name: data[0].name } : null
      });
      
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
      
      // Format the results using the same robust spread-operator strategy
      const formattedResults = data.map((item: any, index: number): CompanySearchResult => {
        console.log(`[AI_SEARCH STANDARD] 📝 Processing result ${index + 1}: ${item.name}`);
        
        const result: SearchResult = {
          ...item,
          id: Number(item.id),
          linkedin_url: item.profile_url || '',
        };
        
        // Handle dynamic company-specific fields if they exist
        if (storedOrganizationName) {
            Object.keys(item).forEach(key => {
            if (key.includes(storedOrganizationName) || key.startsWith('achieved_') || key.startsWith('doubled_') || key.startsWith('moved_to_')) {
                (result as any)[key] = item[key];
            }
            });
        }
        
        return result;
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
  
  // Chronological search method with proper implementation
  async searchChronological(
    filters: ChronologicalSearchFilters = {},
    top_k: number = 50,
    organizationName?: string
  ): Promise<SearchResult[]> {
    console.log(`[AI_SEARCH CHRONOLOGICAL] 📈 Starting chronological search`);
    console.log(`[AI_SEARCH CHRONOLOGICAL] 📊 Filters provided:`, filters);
    console.log(`[AI_SEARCH CHRONOLOGICAL] 🏢 Organization: ${organizationName}`);
    
    try {
      // Get the organization name for dynamic table naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      if (!storedOrganizationName) {
        console.error(`[AI_SEARCH CHRONOLOGICAL] ❌ Organization name is required for chronological search`);
        throw new Error('Organization name is required for chronological search');
      }
      
      // Construct dynamic RPC function name
      const rpcFunctionName = `llm_integrated_chronological_search_${storedOrganizationName}`;
      console.log(`[AI_SEARCH CHRONOLOGICAL] 🎯 Target SQL function: ${rpcFunctionName}`);
      
      // Call the chronological search RPC function
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, {
          chronological_filters: filters,
          limit_count: top_k,
          organization_name: storedOrganizationName
        })
        .returns<any[]>();
      
      if (error) {
        console.error(`[AI_SEARCH CHRONOLOGICAL] ❌ SQL function error:`, {
          function: rpcFunctionName,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Chronological search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH CHRONOLOGICAL] ✅ SQL function executed successfully: ${data?.length || 0} results`);
      
      if (!data || data.length === 0) {
        console.log(`[AI_SEARCH CHRONOLOGICAL] ⚠️ No results found`);
        return [];
      }
      
      // Format the results. The SQL function now returns a rich profile.
      const formattedResults = data.map((item: any, index: number): SearchResult => {
        console.log(`[AI_SEARCH CHRONOLOGICAL] 📝 Processing result ${index + 1}: ${item.name}`);
        
        // The item is now the full, rich profile from the standard_search table
        // We just need to ensure it matches the SearchResult interface.
        const result: SearchResult = {
          ...item,
          id: Number(item.id),
          linkedin_url: item.profile_url || '',
        };
        
        return result;
      });

      console.log(`[AI_SEARCH CHRONOLOGICAL] 📊 Chronological search completed: ${formattedResults.length} results`);
      // Gap-based filtering is based on similarity, which isn't a primary factor here.
      // We can return the direct results or implement a different sorting/filtering logic if needed.
      // For now, returning the full set from the enriched search.
      return formattedResults;
      
    } catch (error) {
      console.error(`[AI_SEARCH CHRONOLOGICAL] ❌ Critical error in chronological search:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        organizationName
      });
      throw error;
    }
  }
  
  // Temporal search method with proper implementation
  async searchTemporal(
    query: string,
    temporalElements: TemporalSearchFilters = {},
    top_k: number = 50,
    organizationName?: string
  ): Promise<SearchResult[]> {
    console.log(`[AI_SEARCH TEMPORAL] 🕐 Starting temporal search for: "${query}"`);
    console.log(`[AI_SEARCH TEMPORAL] 📊 Temporal elements provided:`, temporalElements);
    console.log(`[AI_SEARCH TEMPORAL] 🏢 Organization: ${organizationName}`);
    
    try {
      // Get the organization name for dynamic table naming
      const storedOrganizationName = organizationName || (typeof window !== 'undefined' ? 
        localStorage.getItem('organizationName') : null);
      
      if (!storedOrganizationName) {
        console.error(`[AI_SEARCH TEMPORAL] ❌ Organization name is required for temporal search`);
        throw new Error('Organization name is required for temporal search');
      }
      
      // Construct dynamic RPC function name based on temporal elements
      let rpcFunctionName = `temporal_filter_search_${storedOrganizationName}`;
      
      // Use more specific function if we have exit year and subsequent functions
      if (temporalElements.target_company_year && temporalElements.subsequent_function) {
        rpcFunctionName = `temporal_career_search_${storedOrganizationName}`;
      }
      
      console.log(`[AI_SEARCH TEMPORAL] 🎯 Target SQL function: ${rpcFunctionName}`);
      
      // Prepare RPC parameters for temporal search
      const rpcParams = {
        p_target_company_year: temporalElements.target_company_year || null,
        p_subsequent_function: temporalElements.subsequent_function || null,
        p_subsequent_year: temporalElements.subsequent_year || null,
        p_company_years_filter: temporalElements.company_years_filter || null,
        p_functions_filter: temporalElements.functions_filter || null,
        p_exit_year_min: temporalElements.exit_year_min || null,
        p_exit_year_max: temporalElements.exit_year_max || null,
        p_similarity_threshold: 0.3,
        p_limit_count: top_k
      };
      
      // Call the temporal search RPC function
      const { data, error } = await this.supabase
        .rpc(rpcFunctionName, rpcParams)
        .returns<any[]>();
      
      if (error) {
        console.error(`[AI_SEARCH TEMPORAL] ❌ SQL function error:`, {
          function: rpcFunctionName,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Temporal search failed: ${error.message}`);
      }
      
      console.log(`[AI_SEARCH TEMPORAL] ✅ SQL function executed successfully: ${data?.length || 0} results`);
      
      if (!data || data.length === 0) {
        console.log(`[AI_SEARCH TEMPORAL] ⚠️ No results found`);
        return [];
      }
      
      // Format the results for TemporalSearchResult
      const formattedResults = data.map((item: any, index: number): SearchResult => {
        console.log(`[AI_SEARCH TEMPORAL] 📝 Processing result ${index + 1}: ${item.name}`);
        
        // Map TemporalSearchResult to the standard SearchResult interface
        const baseResult: SearchResult = {
          id: Number(item.profile_id || item.id),
          profile_id: Number(item.profile_id || item.id),
          name: item.name,
          linkedin_url: item.profile_url || '',
          
          // Map from available temporal fields
          current_company: item.post_company_current_company || item.current_company || '',
          current_title: item.post_company_current_title || item.current_title || '',
          post_company_current_company: item.post_company_current_company || item.current_company || '',
          post_company_current_title: item.post_company_current_title || item.current_title || '',

          // Provide default values for fields not present in temporal search results
          current_industry: item.post_company_current_industry || '',
          post_company_current_industry: item.post_company_current_industry || '',
          current_general_industry: '',
          current_job_location: item.post_company_current_location || '',
          post_company_current_location: item.post_company_current_location || '',
          years_experience: 0,
          profile_photo_url: item.picture_url,
          picture_url: item.picture_url,
          headline: item.headline || '',
          current_job_level: '',
          current_job_function: '',
          undergraduate_school: [],
          graduate_school: [],
          high_school: [],
          pre_company_education: [],
          during_company_education: [],
          post_company_education: [],
          highest_degree_level: '',
          major_category: '',
          career_stage: '',
          school_ranking_tier: '',
          current_estimated_salary: 0,
          highest_career_salary: 0,
          is_current_leader: false,
          management_experience: false,
          technical_background: false,
          sales_experience: false,
          has_startup_experience: false,
          has_enterprise_experience: false,
          is_remote_worker: false,
          mentor_potential: false,
          post_company_companies: [],
          post_company_titles: [],
          post_company_industries: [],
          post_company_locations: [],
          functional_expertise: [],
          industry_expertise: [],
          pre_company_companies: [],
          pre_company_titles: [],
          pre_company_industries: [],
          pre_company_locations: [],
          
          // Preserve timelines if they exist, for potential future use
          career_timeline: item.career_timeline || {},
          education_timeline: item.education_timeline || {},
        };
        
        return baseResult;
      });

      console.log(`[AI_SEARCH TEMPORAL] 📊 Temporal search completed: ${formattedResults.length} results`);
      return formattedResults;
      
    } catch (error) {
      console.error(`[AI_SEARCH TEMPORAL] ❌ Critical error in temporal search:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        query: `"${query}"`,
        organizationName
      });
      throw error;
    }
  }
}
