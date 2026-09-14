/**
 * Search results use the canonical profile_id, URL, and current company/title
 * fields returned by search_profiles (see data/search.ts: ProfileResult).
 * The UI also retains schema-backed enrichment fields from 003_profiles.sql:
 * industry, job level/function, career stage, salary, education metadata,
 * expertise, and boolean characteristics. These are currently unpopulated;
 * display defaults do not mean enrichment has been run.
 */
export interface SearchResult {
  profile_id: number;
  name: string;
  profile_url: string;
  picture_url?: string;
  headline: string;
  industry: string;
  post_company_current_company: string;
  post_company_current_title: string;
  post_company_current_industry: string;
  post_company_current_location: string;
  current_job_level: string;
  current_job_function: string;
  undergraduate_school: string[];
  graduate_school: string[];
  high_school: string[];
  pre_company_education: string[];
  during_company_education: string[];
  post_company_education: string[];
  natural_language_education: string;
  highest_degree_level: string;
  major_category: string;
  
  // Enhanced career and  salary fields
  career_stage?: string;
  school_ranking_tier?: string;
  current_estimated_salary?: number;
  highest_career_salary?: number;
  
  // Boolean profile characteristics
  is_current_leader?: boolean;
  management_experience?: boolean;
  technical_background?: boolean;
  sales_experience?: boolean;
  has_startup_experience?: boolean;
  has_enterprise_experience?: boolean;
  is_remote_worker?: boolean;
  mentor_potential?: boolean;
  
  // Additional arrays for comprehensive data
  post_company_companies?: string[];
  post_company_titles?: string[];
  post_company_industries?: string[];
  post_company_locations?: string[];
  functional_expertise?: string[];
  industry_expertise?: string[];
  
  // Dynamic Boolean salary fields (with dynamic company names)
  // Note: These will be accessed dynamically as [organizationName]_provided_salary_lift etc.
  [key: string]: any; // Allow dynamic field access for company-specific boolean fields
  
  // Current profile details; current_job_location is schema-backed enrichment.
  current_company?: string;
  current_title?: string;
  current_job_location?: string;
  home_location?: string;
} 