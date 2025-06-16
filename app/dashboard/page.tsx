"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Loader2, CheckCircle, AlertCircle, Bookmark as BookmarkIcon } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import { getUserEmail } from "../utils/auth"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import analytics from "../utils/analytics"
import { FaLightbulb, FaTimes } from "react-icons/fa"
import { useSearchHistory } from "../../hooks/useSearchHistory"
import OAuthHandler from "../../components/OAuthHandler"
import { useAuth } from "../../components/AuthProvider"
import { isDemoMode as checkIsDemoMode, getDemoOrganization, getDemoDisplayName, initDemoFromUrl } from "../utils/demo"
import { InlineWidget } from "react-calendly"

// Add the new interface for search results
interface SearchResult {
  id: number;
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
  similarity: number;
  
  // Enhanced career and salary fields
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
  
  // Legacy fields for backward compatibility
  linkedin_url?: string;
  current_company?: string;
  current_title?: string;
  current_industry?: string;
  current_general_industry?: string;
  current_job_location?: string;
  years_experience?: number;
  profile_photo_url?: string;
  home_location?: string;
}

// Add realistic suggestion tags for Chick-fil-A employees and alumni
const suggestionTags = [
  "Restaurant managers in New Jersey",
  "Alumni working in healthcare now",
  "Former employees who went to business school after leaving",
  "Former cashiers now in customer success roles",
  "Alumni who started their own companies",
  "People who went from fast food to finance",
  "Harvard MBA graduates who worked at Chick-fil-A",
  "Former team members now in hospitality",
  "Alumni who became VPs or directors",
  "Former employees in the startup ecosystem",
  "People who got their degree while working here",
  "Kitchen staff who became operations managers",
  "Operations directors at QSR chains",
  "Former employees who went into consulting",
  "Alumni in the hospitality industry",
  "People with culinary arts education",
  "Drive-thru team leads now in logistics",
  "Corporate employees in Atlanta headquarters",
  "People who transitioned to marketing roles",
  "Former shift leaders now in C-suite positions",
  "Alumni with engineering backgrounds",
  "Former employees now in real estate",
  "Quality assurance in food service",
  "Alumni who worked here during college (2018-2022)",
  "People who became franchise owners",
  "Former trainers who became HR professionals",
  "People who moved into tech roles",
  "Alumni working in major metropolitan areas",
  "Former employees with marketing degrees",
  "People who moved into education sector",
  "Supply chain managers in retail",
  "Alumni in senior management roles",
  "Team members who became district managers",
  "Alumni working in nonprofit organizations",
  "Training and development specialists",
  "People who left during COVID and pivoted careers",
  "Former employees in technology companies",
  "Alumni who studied hospitality management",
  "Customer experience managers",
  "Former employees who relocated for better opportunities",
  "People who transitioned to retail management",
  "People who completed leadership development programs",
  "Former supervisors now running their own businesses",
  "Food safety and compliance officers",
  "Franchise development specialists",
  "Alumni who studied hospitality management",
  "Business analysts in hospitality",
  "Digital marketing in food brands"
]

// Add second row of suggestion tags with different content
const secondRowSuggestionTags = [
  "Executive chefs at upscale restaurants",
  "Alumni now leading Fortune 500 teams",
  "Former crew members turned entrepreneurs",
  "People who transitioned to investment banking",
  "Regional managers across multiple states",
  "Alumni working at Google, Apple, Microsoft",
  "Former employees now in private equity",
  "People who became restaurant franchise owners",
  "Alumni working in sustainable food initiatives",
  "Former team leads now in executive coaching",
  "People who pivoted to venture capital",
  "Alumni running their own consulting firms",
  "Former employees in pharmaceutical sales",
  "People who became celebrity chefs",
  "Alumni working at top consulting firms",
  "Former managers now in hospitality tech",
  "People who transitioned to luxury brands",
  "Alumni leading social media agencies",
  "Former employees in corporate training",
  "People who became food industry analysts",
  "Alumni working in sports management",
  "Former crew members now in film production",
  "People who transitioned to renewable energy",
  "Alumni leading diversity and inclusion",
  "Former employees in government relations",
  "People who became professional speakers",
  "Alumni working at entertainment companies",
  "Former managers in supply chain optimization",
  "People who transitioned to biotech startups",
  "Alumni leading customer experience teams",
  "Former employees now travel industry executives",
  "People who became food network personalities",
  "Alumni working in artificial intelligence",
  "Former team members in aerospace",
  "People who transitioned to fashion retail",
  "Alumni leading nonprofit organizations",
  "Former employees in financial planning",
  "People who became wellness industry leaders",
  "Alumni working in cybersecurity",
  "Former managers now in e-commerce",
  "People who transitioned to music industry",
  "Alumni leading automotive innovation",
  "Former employees in real estate development",
  "People who became lifestyle brand founders",
  "Alumni working in clean technology",
  "Former crew members in professional sports",
  "People who transitioned to healthcare innovation"
]

// Combine all suggestion tags for rotating placeholder
const allSuggestionTags = [...suggestionTags, ...secondRowSuggestionTags];

// Remove the module-level useEffect
// This is causing the error - hooks can only be used inside components
const tagScrollAnimation = `
  .scrolling-tags-container {
    width: 100%;
    overflow: hidden;
    margin: 1rem 0;
  }
  
  .scrolling-tags {
    display: flex;
    white-space: nowrap;
    transform: translateX(-${Math.floor(Math.random() * 100)}%);
  }
  
  .scrolling-tags-content {
    display: inline-flex;
    animation: scroll 300s linear infinite;
  }

  .scrolling-tags-content-slow {
    display: inline-flex;
    animation: scroll-slow 450s linear infinite;
  }
  
  .tag-item {
    display: inline-block;
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(4, 120, 87);
    padding: 0.6rem 1.2rem;
    margin: 0 0.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    white-space: nowrap;
  }

  .tag-item-yellow {
    display: inline-block;
    background-color: rgba(251, 191, 36, 0.1);
    color: rgb(146, 64, 14);
    padding: 0.6rem 1.2rem;
    margin: 0 0.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    white-space: nowrap;
  }
  
  .tag-item:hover {
    background-color: rgba(16, 185, 129, 0.2);
    transform: translateY(-2px);
  }

  .tag-item-yellow:hover {
    background-color: rgba(251, 191, 36, 0.2);
    transform: translateY(-2px);
  }
  
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }

  @keyframes scroll-slow {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
`;

// Helper function to extract location from natural language format
const extractLocationFromText = (text: string): string => {
  if (!text) return '';
  const match = text.match(/currently located in (.+)/i);
  return match ? match[1].trim() : '';
};

// Helper function to get education display
const getEducationDisplay = (result: SearchResult): string => {
  // Add debugging for education fields
  console.log('[DEBUG] Education fields:', {
    graduate_school: result.graduate_school,
    undergraduate_school: result.undergraduate_school,
    high_school: result.high_school,
    pre_company_education: result.pre_company_education,
    during_company_education: result.during_company_education,
    post_company_education: result.post_company_education,
    natural_language_education: result.natural_language_education
  });

  // Check if graduate_school exists and has data
  if (result.graduate_school) {
    if (Array.isArray(result.graduate_school) && result.graduate_school.length > 0) {
      return result.graduate_school[0];
    } else if (typeof result.graduate_school === 'string' && result.graduate_school) {
      return result.graduate_school;
    }
  }
  
  // Check if undergraduate_school exists and has data
  if (result.undergraduate_school) {
    if (Array.isArray(result.undergraduate_school) && result.undergraduate_school.length > 0) {
      return result.undergraduate_school[0];
    } else if (typeof result.undergraduate_school === 'string' && result.undergraduate_school) {
      return result.undergraduate_school;
    }
  }
  
  // Check if high_school exists and has data
  if (result.high_school) {
    if (Array.isArray(result.high_school) && result.high_school.length > 0) {
      return result.high_school[0];
    } else if (typeof result.high_school === 'string' && result.high_school) {
      return result.high_school;
    }
  }
  
  // Helper function to extract education from natural language text
  const extractEducationFromNaturalLanguage = (text: string): string => {
    if (!text) return '';
    
    // Look for "Educational Background:" prefix
    const educationalBackgroundMatch = text.match(/Educational Background:\s*(.+)/i);
    if (educationalBackgroundMatch) {
      return educationalBackgroundMatch[1].trim();
    }
    
    // If no "Educational Background:" prefix, return the full text
    return text;
  };
  
  // Fallback to natural language education with extraction
  if (result.natural_language_education && 
      typeof result.natural_language_education === 'string') {
    return extractEducationFromNaturalLanguage(result.natural_language_education);
  }
  
  return '';
};

// Helper function to get standard profile info
const getStandardProfileInfo = (result: SearchResult) => {
  // Add debugging to see what data is actually available
  console.log('[DEBUG] Profile data available:', {
    name: result.name,
    current_company: result.current_company,
    post_company_current_company: result.post_company_current_company,
    current_title: result.current_title,
    post_company_current_title: result.post_company_current_title,
    current_job_location: result.current_job_location,
    post_company_current_location: result.post_company_current_location,
    home_location: (result as any).home_location,
    undergraduate_school: result.undergraduate_school,
    graduate_school: result.graduate_school
  });

  // Use home_location as fallback when post_company_current_location is empty
  const getLocationFallback = () => {
    if (result.current_job_location) {
      return result.current_job_location;
    }
    if (result.post_company_current_location) {
      return result.post_company_current_location;
    }
    // Fallback to home_location if current work location is empty
    return (result as any).home_location || '';
  };

  return {
    location: getLocationFallback(),
    currentRole: result.current_title || 
                 result.post_company_current_title || '',
    currentCompany: result.current_company || 
                    result.post_company_current_company || '',
    education: getEducationDisplay(result)
  };
};

// Helper function to map extracted filters to database fields and get matching values
const getMatchingFilters = (result: SearchResult, extractedFilters: {[key: string]: string[]}) => {
  const matches: {category: string, value: string}[] = [];
  
  // Map filter categories to database fields - expanded with more mappings including boolean fields
  const filterMapping: {[key: string]: {field: keyof SearchResult | ((r: SearchResult) => string)}} = {
    'Job Functions': { field: 'current_job_function' },
    'Job Levels': { field: 'current_job_level' },
    'Industries': { field: (r: SearchResult) => r.post_company_current_industry || r.industry || r.current_industry || '' },
    'Company Names': { field: (r: SearchResult) => r.post_company_current_company || r.current_company || '' },
    'Locations': { field: (r: SearchResult) => r.current_job_location || r.post_company_current_location || '' },
    'Degree Levels': { field: 'highest_degree_level' },
    'Major Categories': { field: 'major_category' },
    
    // Enhanced field mappings
    'Career Stages': { field: 'career_stage' },
    'School Tiers': { field: 'school_ranking_tier' },
    'Functional Expertise': { field: (r: SearchResult) => (r.functional_expertise || []).join(', ') },
    'Industry Expertise': { field: (r: SearchResult) => (r.industry_expertise || []).join(', ') },
    
    // Boolean profile characteristics mappings
    'Leadership': { field: (r: SearchResult) => r.is_current_leader ? 'Current Leader' : '' },
    'Management Experience': { field: (r: SearchResult) => r.management_experience ? 'Has Management Experience' : '' },
    'Technical Background': { field: (r: SearchResult) => r.technical_background ? 'Technical Background' : '' },
    'Sales Experience': { field: (r: SearchResult) => r.sales_experience ? 'Sales Experience' : '' },
    'Startup Experience': { field: (r: SearchResult) => r.has_startup_experience ? 'Startup Experience' : '' },
    'Enterprise Experience': { field: (r: SearchResult) => r.has_enterprise_experience ? 'Enterprise Experience' : '' },
    'Remote Work': { field: (r: SearchResult) => r.is_remote_worker ? 'Remote Worker' : '' },
    'Mentor Potential': { field: (r: SearchResult) => r.mentor_potential ? 'Mentor Potential' : '' },
    
    // Salary-related mappings
    'Current Salary Range': { field: (r: SearchResult) => r.current_estimated_salary ? `$${r.current_estimated_salary?.toLocaleString()}` : '' },
    'Highest Career Salary': { field: (r: SearchResult) => r.highest_career_salary ? `$${r.highest_career_salary?.toLocaleString()}` : '' }
  };
  
  // Check each extracted filter category
  Object.entries(extractedFilters).forEach(([category, filterValues]) => {
    const mapping = filterMapping[category];
    if (mapping && filterValues.length > 0) {
      let resultValue = '';
      
      if (typeof mapping.field === 'function') {
        resultValue = mapping.field(result);
      } else {
        resultValue = String(result[mapping.field] || '');
      }
      
      // Check if any filter value matches (case insensitive, partial match)
      const hasMatch = filterValues.some(filterValue => 
        resultValue.toLowerCase().includes(filterValue.toLowerCase()) ||
        filterValue.toLowerCase().includes(resultValue.toLowerCase())
      );
      
      if (hasMatch && resultValue) {
        matches.push({
          category,
          value: resultValue
        });
      }
    }
  });
  
  return matches;
};

// Helper function to ensure search result compatibility
const ensureSearchResultCompatibility = (results: any[]): SearchResult[] => {
  console.log('[DEBUG COMPATIBILITY] Raw results from API:', results);
  console.log('[DEBUG COMPATIBILITY] Number of results:', results.length);
  
  const mappedResults = results.map((result, index) => {
    console.log(`[DEBUG COMPATIBILITY] Processing result ${index}:`, {
      id: result.id,
      name: result.name,
      rawResult: result
    });
    
    const mapped = {
      ...result,
      // Ensure new fields exist with fallbacks to legacy fields
      profile_url: result.profile_url || result.linkedin_url || '',
      picture_url: result.picture_url || result.profile_photo_url,
      industry: result.industry || result.current_industry || '',
      post_company_current_company: result.post_company_current_company || result.current_company || '',
      post_company_current_title: result.post_company_current_title || result.current_title || '',
      post_company_current_industry: result.post_company_current_industry || result.current_industry || '',
      post_company_current_location: result.post_company_current_location || result.current_job_location || '',
      current_job_level: result.current_job_level || '',
      current_job_function: result.current_job_function || '',
      
      // Education fields
      undergraduate_school: result.undergraduate_school || [],
      graduate_school: result.graduate_school || [],
      high_school: result.high_school || [],
      pre_company_education: result.pre_company_education || [],
      during_company_education: result.during_company_education || [],
      post_company_education: result.post_company_education || [],
      natural_language_education: result.natural_language_education || '',
      highest_degree_level: result.highest_degree_level || '',
      major_category: result.major_category || '',
      
      // Enhanced career and salary fields
      career_stage: result.career_stage || '',
      school_ranking_tier: result.school_ranking_tier || '',
      current_estimated_salary: result.current_estimated_salary || 0,
      highest_career_salary: result.highest_career_salary || 0,
      
      // Boolean profile characteristics
      is_current_leader: result.is_current_leader || false,
      management_experience: result.management_experience || false,
      technical_background: result.technical_background || false,
      sales_experience: result.sales_experience || false,
      has_startup_experience: result.has_startup_experience || false,
      has_enterprise_experience: result.has_enterprise_experience || false,
      is_remote_worker: result.is_remote_worker || false,
      mentor_potential: result.mentor_potential || false,
      
      // Additional arrays for comprehensive data
      post_company_companies: result.post_company_companies || [],
      post_company_titles: result.post_company_titles || [],
      post_company_industries: result.post_company_industries || [],
      post_company_locations: result.post_company_locations || [],
      functional_expertise: result.functional_expertise || [],
      industry_expertise: result.industry_expertise || [],
      
      // Keep legacy fields for backward compatibility
      linkedin_url: result.linkedin_url || result.profile_url || '',
      current_company: result.current_company || result.post_company_current_company || '',
      current_title: result.current_title || result.post_company_current_title || '',
      current_industry: result.current_industry || result.post_company_current_industry || result.industry || '',
      current_general_industry: result.current_general_industry || '',
      current_job_location: result.current_job_location || result.post_company_current_location || '',
      years_experience: result.years_experience || 0,
      profile_photo_url: result.profile_photo_url || result.picture_url,
      home_location: result.home_location || ''
    };
    
    // Dynamic company-specific fields are preserved through the spread operator (...result)
    // These include fields like: [organizationName]_exit_year, [organizationName]_provided_salary_lift, 
    // achieved_six_figure_post_[organizationName], doubled_salary_post_[organizationName], 
    // moved_to_leadership_post_[organizationName]
    // They will be accessible via mapped[`${organizationName}_provided_salary_lift`] etc.
    
    console.log(`[DEBUG COMPATIBILITY] Mapped result ${index}:`, {
      id: mapped.id,
      name: mapped.name,
      profile_url: mapped.profile_url,
      post_company_current_company: mapped.post_company_current_company,
      boolean_fields: {
        is_current_leader: mapped.is_current_leader,
        management_experience: mapped.management_experience,
        technical_background: mapped.technical_background,
        sales_experience: mapped.sales_experience,
        has_startup_experience: mapped.has_startup_experience,
        has_enterprise_experience: mapped.has_enterprise_experience,
        is_remote_worker: mapped.is_remote_worker,
        mentor_potential: mapped.mentor_potential
      },
      salary_fields: {
        current_estimated_salary: mapped.current_estimated_salary,
        highest_career_salary: mapped.highest_career_salary
      },
      education_fields: {
        undergraduate_school: mapped.undergraduate_school,
        graduate_school: mapped.graduate_school,
        natural_language_education: mapped.natural_language_education
      },
      career_fields: {
        career_stage: mapped.career_stage,
        school_ranking_tier: mapped.school_ranking_tier,
        current_job_level: mapped.current_job_level,
        current_job_function: mapped.current_job_function
      }
    });
    
    return mapped;
  });
  
  console.log('[DEBUG COMPATIBILITY] All results mapped successfully');
  return mappedResults;
};

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [mountTime] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [formattedOrganizationName, setFormattedOrganizationName] = useState("")
  const [displayOrganizationName, setDisplayOrganizationName] = useState("")
  const [displayedOrganizationName, setDisplayedOrganizationName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()
  
  // Add OAuth handling state
  const [isOAuthCallback, setIsOAuthCallback] = useState(false)
  
  // Add new states for search functionality
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Add search history hook
  const { saveSearch, loadSearchDetails } = useSearchHistory()

  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false
  })

  // NEW: Pull auth status from global AuthProvider
  const { user: authUser, isAuthenticated: contextAuthenticated, isLoading: authLoading } = useAuth();

  // Sync local authState with context
  useEffect(() => {
    setAuthState({
      isLoading: authLoading,
      isAuthenticated: contextAuthenticated
    });
  }, [authLoading, contextAuthenticated]);

  // Add these new states near the top with your other state declarations
  const [totalAlumniCount, setTotalAlumniCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Add these new states to your component
  const [searchPhase, setSearchPhase] = useState<'idle' | 'analyzing' | 'searching' | 'profiling' | 'filtering' | 'expanding' | 'complete'>('idle');
  const [displayedText, setDisplayedText] = useState({
    analyzing: '',
    searching: '',
    profiling: '',
    filters: '',
    displaying: ''
  });
  const [expandedQueries, setExpandedQueries] = useState<string[]>([]);
  const [extractedFilters, setExtractedFilters] = useState<{[key: string]: string[]}>({});
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add a new state variable for collapsing the analysis
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
  
  // NEW: Expansion control states
  const [canExpand, setCanExpand] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const [pipelineExpansionData, setPipelineExpansionData] = useState<any>(null);
  const [initialSearchResults, setInitialSearchResults] = useState<SearchResult[]>([]);

  // Add state for randomized tags
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  
  // Add state for save status of each result
  const [savedStatusMap, setSavedStatusMap] = useState<{[key: string]: 'idle' | 'saving' | 'saved' | 'error' | 'already_saved' | 'demo_no_save'}>({});
  
  
  // Add new state for demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  // Add new state for the Want More modal
  const [showWantMoreModal, setShowWantMoreModal] = useState(false)
  
  // Add state for Pro Tip visibility
  const [showProTip, setShowProTip] = useState(true)
  
  // Add new state to control animation start
  const [isOrganizationNameReadyToAnimate, setIsOrganizationNameReadyToAnimate] = useState(false)

  // Add new state for  onboarding flow
  const [showDemoOnboarding, setShowDemoOnboarding] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  // Add ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add state for query classification
  const [queryClassification, setQueryClassification] = useState<any>(null);

  // Add function to classify query for temporal search
  const classifyQuery = async (query: string): Promise<any> => {
    try {
      console.log(`[DEBUG ${new Date().toISOString()}] Classifying query for temporal elements: "${query}"`);
      
      const response = await fetch('/api/classify-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        console.error('Query classification failed:', response.statusText);
        return { type: 'standard' };
      }
      
      const classification = await response.json();
      console.log(`[DEBUG ${new Date().toISOString()}] Query classification result:`, classification);
      
      return classification;
    } catch (error) {
      console.error('Error classifying query:', error);
      return { type: 'standard' };
    }
  };

  // Add function to convert extracted filters to API format
  const convertFiltersToAPI = (extractedFilters: {[key: string]: string[]}): any => {
    console.log(`🔧🔧🔧 [DASHBOARD] CONVERTING FILTERS:`, extractedFilters);
    
    const apiFilters: any = {};
    
    // Map extracted filter categories to API parameters
    const filterMapping: {[key: string]: string} = {
      'Job Levels': 'job_level_filter',
      'Job Functions': 'job_function_filter', 
      'Industries': 'industry',
      'Company Names': 'company',
      'Locations': 'location',
      'School Names': 'school',
      'Degree Levels': 'degree_level_filter',
      'School Tiers': 'school_tier_filter',
      'Career Stages': 'career_stage_filter',
      'Exit Years': 'exit_year_min', // For simplicity, use the first year as min
    };
    
    // Boolean filter mapping
    const booleanMapping: {[key: string]: string} = {
      'Leadership': 'leadership_only',
      'Management Experience': 'management_exp_only',
      'Technical Background': 'technical_background_only',
      'Sales Experience': 'sales_exp_only',
      'Startup Experience': 'startup_exp_only',
      'Enterprise Experience': 'enterprise_exp_only',
      'Remote Work': 'remote_worker_only',
      'Mentor Potential': 'mentor_potential_only',
      'Salary Impact': 'salary_lift_only'
    };
    
    console.log(`[DASHBOARD DEBUG] Filter mappings available:`, {
      textFilterMapping: filterMapping,
      booleanFilterMapping: booleanMapping
    });
    
    // Convert text filters
    Object.entries(extractedFilters).forEach(([category, values]) => {
      console.log(`[DASHBOARD DEBUG] Processing filter category: "${category}" with values:`, values);
      
      if (filterMapping[category] && values.length > 0) {
        apiFilters[filterMapping[category]] = values[0]; // Use first value for text filters
        console.log(`[DASHBOARD DEBUG] ✅ Mapped text filter: ${category} -> ${filterMapping[category]} = "${values[0]}"`);
      }
      
      // Convert boolean filters (if the category exists, set to true)
      if (booleanMapping[category] && values.length > 0) {
        apiFilters[booleanMapping[category]] = true;
        console.log(`[DASHBOARD DEBUG] ✅ Mapped boolean filter: ${category} -> ${booleanMapping[category]} = true`);
      }
      
      // Log if category not recognized
      if (!filterMapping[category] && !booleanMapping[category]) {
        console.log(`[DASHBOARD DEBUG] ⚠️ Unrecognized filter category: "${category}"`);
      }
    });
    
    console.log(`[DASHBOARD DEBUG] Final converted filters:`, apiFilters);
    return apiFilters;
  };

  // Define formatOrganizationName function here
  const formatOrganizationName = (name: string): string => {
    if (!name) return "Your Organization"; // Fallback for empty or null names
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Initialize randomized tags on component mount
  useEffect(() => {
    // Create a random starting position in the tag list
    const startIndex = Math.floor(Math.random() * suggestionTags.length);
    
    // Rotate the array to start from that position
    const rotatedTags = [
      ...suggestionTags.slice(startIndex),
      ...suggestionTags.slice(0, startIndex)
    ];
    
    setRandomizedTags(rotatedTags);
    
    // We can still use the scroll offset randomization too
    const tagsContainer = document.querySelector('.scrolling-tags');
    if (tagsContainer) {
      const randomOffset = Math.random() * -20; // Smaller offset since we're already randomizing the list
      tagsContainer.setAttribute('style', `transform: translateX(${randomOffset}%)`);
    }
  }, []);

  // Check for OAuth callback and auth state on component mount
  useEffect(() => {
    // Debounce rapid auth checks
    const timeoutId = setTimeout(() => {
      const checkAuth = async () => {
        try {
          console.log('[DEBUG] Dashboard: Checking auth state and OAuth callback', {
            authLoading,
            contextAuthenticated,
            timestamp: new Date().toISOString()
          })
          console.log('[DEBUG] Dashboard: Current URL:', window.location.href)
          console.log('[DEBUG] Dashboard: URL hash:', window.location.hash)
          
          // Check for demo mode from URL parameters first
          initDemoFromUrl()
          
          // Check if this is demo mode (session-based)
          if (checkIsDemoMode()) {
            console.log("Demo mode activated from session")
            setIsDemoMode(true)
            setFormattedOrganizationName(getDemoOrganization()) // Get from session
            setDisplayOrganizationName(getDemoDisplayName()) // Get from session
            setIsOrganizationNameReadyToAnimate(true)
            setIsLoading(false)

            // Track as a unique visitor while maintaining demo status
            const visitorId = analytics.getVisitorId()
            console.log(`Demo visitor identified with unique ID: ${visitorId}`)

            analytics.identifyUser("demo_user", {
              isDemoUser: true,
              visitorId: visitorId,
              school: "Your Organization"
            })

            // Set auth state for demo mode
            setAuthState({
              isLoading: false,
              isAuthenticated: true
            })
            return
          }
          
          // Check if this is an OAuth callback
          // OAuth callbacks can have various hash parameters
          const isOAuthCallback = window.location.hash && (
            window.location.hash.includes('access_token') || 
            window.location.hash.includes('refresh_token') ||
            window.location.hash.includes('type=recovery') ||
            window.location.search.includes('code=')
          )
          
          if (isOAuthCallback) {
            console.log('[DEBUG] Dashboard: OAuth callback detected')
            setIsOAuthCallback(true)
            return
          }

          // Wait until global auth loading finishes
          if (authLoading) {
            console.log('[DEBUG] Dashboard: Auth still loading, waiting...')
            return;
          }

          // Don't redirect immediately after mount to allow auth to stabilize
          const timeSinceMount = Date.now() - mountTime
          if (timeSinceMount < 300) {
            console.log('[DEBUG] Dashboard: Too soon after mount, waiting for auth to stabilize...', { timeSinceMount })
            return
          }

          console.log("[DEBUG] Dashboard: Authentication (from context) result:", contextAuthenticated, {
            authLoading,
            timestamp: new Date().toISOString()
          })

          if (!contextAuthenticated) {
            console.log("[DEBUG] Dashboard: Not authenticated, redirecting to signin")
            setAuthState({
              isLoading: false,
              isAuthenticated: false
            })
            router.push("/signin")
            return
          }

          // For authenticated real users, proceed with normal flow
          console.log("[DEBUG] Dashboard: Real user authenticated")

          // Finally, update the auth state
          setAuthState({
            isLoading: false,
            isAuthenticated: true
          })
        } catch (error) {
          console.error("Auth check error:", error)
          // Don't sign out on API rate limiting errors
          if ((error as Error)?.message?.includes('429') || (error as Error)?.message?.includes('API key')) {
            console.log('API rate limiting detected, not signing out')
            return
          }
          setAuthState({
            isLoading: false,
            isAuthenticated: false
          })
          router.push('/signin')
        }
      }
      
      checkAuth()
    }, 100) // 100ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [router, authLoading, contextAuthenticated, mountTime])

  // Handle OAuth completion
  const handleOAuthComplete = () => {
    setIsOAuthCallback(false)
    // Re-check auth state after OAuth completion
    window.location.reload()
  }

  // Show OAuth handler if this is an OAuth callback
  if (isOAuthCallback) {
    return <OAuthHandler onComplete={handleOAuthComplete} />
  }

  // Only fetch school name for non-demo users
  useEffect(() => {
    if (authState.isAuthenticated && !isDemoMode) {
      console.log("Dashboard: User authenticated, fetching data...")
      const fetchOrganizationName = async () => {
        if (isDemoMode) {
          setFormattedOrganizationName("Your Organization");
          setIsOrganizationNameReadyToAnimate(true); // Allow animation for demo
          setIsLoading(false);
          return;
        }

        try {
          const userEmail = await getUserEmail();
          if (!userEmail) {
            setError("Unable to retrieve user email.");
            setFormattedOrganizationName("Your Organization"); // Fallback
            setIsOrganizationNameReadyToAnimate(true);
            setIsLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from('customer_information')
            .select('organization_name')
            .eq('organization_email', userEmail)
            .single();

          console.log("[DEBUG] Raw data from customer_information:", data);

          if (error) {
            console.error("Error fetching organization name:", error);
            setError("Failed to load school data.");
            setFormattedOrganizationName("Your Organization"); // Fallback
            setIsOrganizationNameReadyToAnimate(true);
            setIsLoading(false);
            return;
          }

          if (data && data.organization_name) {
            const rawOrganizationName = data.organization_name;
            const formattedName = formatOrganizationName(rawOrganizationName);
            console.log("[DEBUG] Result from formatOrganizationName function:", formattedName);
            setFormattedOrganizationName(formattedName);
            setDisplayOrganizationName(formattedName); // Use same name for display for real users
            
            // Introduce a short delay before signaling animation readiness
            setTimeout(() => {
              setIsOrganizationNameReadyToAnimate(true);
            }, 100); // 100ms delay

             // Store the original school name in localStorage for the search engine
            if (typeof window !== 'undefined') {
              localStorage.setItem('organizationName', rawOrganizationName);
              console.log(`[DEBUG] Stored original organization name in localStorage: "${rawOrganizationName}"`);
            }
          } else {
            setError("School name not found for this user.");
            setFormattedOrganizationName("Your Organization"); // Fallback for internal
            setDisplayOrganizationName("Your Organization"); // Fallback for display
            setIsOrganizationNameReadyToAnimate(true);
          }
        } catch (err) {
          console.error("Exception in fetchOrganizationName:", err);
          setError("An error occurred while fetching school data.");
          setFormattedOrganizationName("Your Organization"); // Fallback for internal
          setDisplayOrganizationName("Your Organization"); // Fallback for display
          setIsOrganizationNameReadyToAnimate(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrganizationName()
    }
  }, [authState.isAuthenticated, isDemoMode]) // Removed router from dependencies as it might not be needed for just fetching school name

  // Add this useEffect to fetch the total count on component mount
  useEffect(() => {
    const fetchTotalAlumniCount = async () => {
      if (formattedOrganizationName) {
        setIsLoadingCount(true);
        try {
          const tableName = `${formattedOrganizationName.toLowerCase().replace(/ /g, '_')}_alumni_vector`;
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            // Handle error silently
          } else {
            setTotalAlumniCount(count || 0);
          }
        } catch (error) {
          // Catch error silently
        } finally {
          setIsLoadingCount(false);
        }
      }
    };
    
    if (formattedOrganizationName) {
      fetchTotalAlumniCount();
    }
  }, [formattedOrganizationName]);

  // Track page view when component mounts
  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated) {
      analytics.trackPageView('Dashboard');
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      analytics.trackScrollDepth();
    };

    // Throttle scroll events to prevent too many events
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledScrollHandler = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 500);
      }
    };

    window.addEventListener('scroll', throttledScrollHandler);
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  // Identify user when authenticated
  useEffect(() => {
    const identifyUserInAnalytics = async () => {
      if (authState.isAuthenticated) {
        try {
          const userEmail = await getUserEmail();
          if (userEmail) {
            if (isDemoMode) {
              // For demo users, we already identified them in the checkAuth function
              // This ensures we maintain the visitor ID while still using the demo email
              // for Supabase data retrieval
              console.log("Demo user already identified with unique visitor ID");
            } else {
              // For real users, identify them with their actual email
              analytics.identifyUser(userEmail, {
                email: userEmail,
                isDemoUser: false,
                organization: formattedOrganizationName
              });
            }
          }
        } catch (error) {
          console.error("Error identifying user in analytics:", error);
        }
      }
    };

    identifyUserInAnalytics();
  }, [authState.isAuthenticated, isDemoMode, formattedOrganizationName]);

  // Add this helper function to simulate typewriter effect
  const typewriterEffect = (text: string, setter: (text: string) => void, speed: number = 30): Promise<void> => {
    return new Promise((resolve) => {
      let i = 0;
      const typing = setInterval(() => {
        if (i <= text.length) {
          setter(text.substring(0, i));
          i++;
        } else {
          clearInterval(typing);
          resolve();
        }
      }, speed);
    });
  };

  // Add new handler for textarea changes and dynamic height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      // Temporarily reset height to auto to get the natural scrollHeight
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      // Calculate the height of a single line (approximate)
      // Get current computed styles
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const borderTop = parseFloat(computedStyle.borderTopWidth);
      const borderBottom = parseFloat(computedStyle.borderBottomWidth);

      // Rough calculation for content height of one line
      const singleRowContentHeight = lineHeight;
      
      // Calculate number of lines (minimum 1, maximum 3)
      let numLines = Math.max(1, Math.min(3, Math.round((scrollHeight - paddingTop - paddingBottom - borderTop - borderBottom) / singleRowContentHeight)));
      
      // If scrollHeight is very small (empty input), ensure numLines is 1
      if (e.target.value === '') {
          numLines = 1;
      }

      // Set new height based on lines, but not exceeding 3 lines worth of height.
      // Use minHeight for 1 line, and calculate height for 2 or 3 lines.
      if (numLines === 1) {
          textarea.style.height = 'auto'; // Let it take its initial single-line height or shrink
          textarea.rows = 1;
      } else {
          // Calculate height for numLines
          const newHeight = (singleRowContentHeight * numLines) + paddingTop + paddingBottom + borderTop + borderBottom;
          textarea.style.height = `${newHeight}px`;
          textarea.rows = numLines; // Also update rows attribute for semantics
      }
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline on Enter
      handleSearch(e as unknown as React.FormEvent); // Trigger search
    }
    // Allow Shift+Enter for newlines (default textarea behavior)
  };

  // Update handleSearch to include replay snapshot on search
  const handleSearch = async (e: React.FormEvent, directQuery?: string) => {
    e.preventDefault();
    
    // Use the direct query if provided (from tag click), otherwise use the state
    const queryToUse = directQuery || searchQuery.trim();
    
    if (!queryToUse) {
      return;
    }
    
    console.log(`🔥🔥🔥 [DASHBOARD] SEARCH INITIATED! Query: "${queryToUse}" 🔥🔥🔥`);
    console.log(`[DASHBOARD DEBUG] Search initiated for query: "${queryToUse}"`);
    console.log(`[DASHBOARD DEBUG] isDemoMode: ${isDemoMode}, formattedOrganizationName: "${formattedOrganizationName}"`);
    
    // Capture a replay snapshot for this important user interaction
    analytics.captureReplaySnapshot('search_initiated');
    
    // Track search event
    analytics.trackSearch(queryToUse, 0, { source: directQuery ? 'tag_click' : 'search_input' });
    
    if (searchTimerRef.current) {
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Cancelling previous search timer`);
      clearTimeout(searchTimerRef.current);
    }

    // Clear previous search results and reset state
    setSearchResults([]);
    setIsSearching(true);
    setSearchPhase('analyzing');
    setSavedStatusMap({}); // Reset saved statuses on new search
    
    // Reset expansion states for new search
    setCanExpand(false);
    setIsExpanding(false);
    setHasExpanded(false);
    setPipelineExpansionData(null);
    setInitialSearchResults([]);
    setExpansionMessages(''); // Reset expansion messages
    
    // Reset analysis collapsed state when starting a new search
    setIsAnalysisCollapsed(false);
    
    // Store the current query to ensure consistency 
    const currentQuery = queryToUse;
    console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Using query: "${currentQuery}"`);
    
    // Reset displayed text
    setDisplayedText({
      analyzing: '',
      searching: '',
      profiling: '',
      filters: '',
      displaying: ''
    });
    
    // Get the original school name from localStorage for the API
    const originalOrganizationName = typeof window !== 'undefined' ? localStorage.getItem('organizationName') : null;
    console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Original organization name for API: "${originalOrganizationName}"`);
    
    // Start the AI animation sequence
    try {
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Starting animation sequence for query: "${currentQuery}"`);
      
      // Phase 1: Analyzing query with unified search pipeline
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Phase 1: Analyzing with unified search pipeline`);
      await typewriterEffect('Analyzing your search query to determine optimal search method...', 
        (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
      );
      
      // STEP 1: Try unified search pipeline
      console.log(`🔍🔍🔍 [DASHBOARD] ATTEMPTING UNIFIED SEARCH PIPELINE for: "${currentQuery}"`);
      console.log(`[DASHBOARD PIPELINE] 🚀 Starting search pipeline request at ${new Date().toISOString()}`);
      
      let searchConfig = null;
      let pipelineResult = null;
      let apiFilters = {};
      let queryClassification = null;
      
      try {
        console.log(`[DASHBOARD PIPELINE] 📡 Making fetch request to /api/search-pipeline`);
        console.log(`[DASHBOARD PIPELINE] 📝 Request body:`, { 
          query: currentQuery, 
          organizationName: originalOrganizationName,
          isDemo: isDemoMode
        });
        
        const pipelineResponse = await fetch('/api/search-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: currentQuery, 
            organizationName: originalOrganizationName,
            isDemo: isDemoMode
          }),
        });
        
        console.log(`[DASHBOARD PIPELINE] 📡 Pipeline response status: ${pipelineResponse.status} ${pipelineResponse.statusText}`);
        
        if (pipelineResponse.ok) {
          pipelineResult = await pipelineResponse.json();
          console.log(`🔍🔍🔍 [DASHBOARD] SEARCH PIPELINE RESULT:`, pipelineResult);
          console.log(`[DASHBOARD PIPELINE] ✅ Pipeline success - searchType: ${pipelineResult.searchType}`);
          console.log(`[DASHBOARD PIPELINE] 📊 Pipeline metadata:`, pipelineResult.metadata);
          console.log(`[DASHBOARD PIPELINE] 🎯 Search configuration:`, pipelineResult.searchConfig);
          
          searchConfig = pipelineResult.searchConfig;
          queryClassification = pipelineResult.classification;
          
          // Update UI based on search type
          if (pipelineResult.searchType === 'temporal') {
            console.log(`[DASHBOARD PIPELINE] 🕐 Temporal search detected - processing temporal elements`);
            await typewriterEffect('🕐 Detected temporal query - using date-specific timeline search', 
              (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
            );
            
            // Show temporal analysis
      setSearchPhase('searching');
            const temporalElements = searchConfig.temporalElements;
            console.log(`[DASHBOARD PIPELINE] 🕐 Temporal elements extracted:`, temporalElements);
            
            const temporalSummary = [];
            if (temporalElements.exit_year) temporalSummary.push(`exit year: ${temporalElements.exit_year}`);
            if (temporalElements.subsequent_functions) temporalSummary.push(`functions: ${temporalElements.subsequent_functions.join(', ')}`);
            if (temporalElements.sequence_type) temporalSummary.push(`pattern: ${temporalElements.sequence_type}`);
            
            console.log(`[DASHBOARD PIPELINE] 🕐 Temporal summary: ${temporalSummary.join(', ')}`);
            await typewriterEffect(`Applied temporal filters (${temporalSummary.join(', ')})`, 
              (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
            );
            
          } else if (pipelineResult.searchType === 'chronological') {
            console.log(`[DASHBOARD PIPELINE] 📈 Chronological search detected - processing filters`);
            await typewriterEffect('📈 Detected career progression query - using chronological search', 
              (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
            );
            
            // Show chronological analysis
            setSearchPhase('searching');
            const filterCount = Object.keys(searchConfig.filters).length;
            console.log(`[DASHBOARD PIPELINE] 📈 Chronological filters applied:`, searchConfig.filters);
            
            await typewriterEffect(`Applied ${filterCount} chronological filters (experience: ${searchConfig.filters.min_years_in_function || 'any'}, pattern: ${searchConfig.filters.career_progression_pattern || 'general'})`, 
              (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
            );
            
          } else if (pipelineResult.searchType === 'standard') {
            console.log(`[DASHBOARD PIPELINE] 📊 Standard search detected - processing semantic filters`);
            await typewriterEffect('📊 Using standard semantic search with enhanced filtering', 
              (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
            );
            
            // For standard search, still run the expanded queries and filter extraction
            setSearchPhase('profiling');
            console.log(`[DASHBOARD PIPELINE] 📊 Running expanded query generation for standard search`);
      try {
        await generateExpandedQueries(currentQuery);
              console.log(`[DASHBOARD PIPELINE] 📊 Expanded queries generated successfully`);
      } catch (error) {
              console.error(`[DASHBOARD PIPELINE] ❌ Error in generateExpandedQueries:`, error);
        await typewriterEffect("Alternative search suggestions unavailable", 
          (text) => setDisplayedText(prev => ({ ...prev, profiling: text }))
        );
      }
      
            // Extract filters for standard search
      let currentExtractedFilters: {[key: string]: string[]} = {};
            console.log(`[DASHBOARD PIPELINE] 📊 Extracting metadata filters for standard search`);
      try {
        currentExtractedFilters = await extractMetadataFilters(currentQuery);
              console.log(`[DASHBOARD PIPELINE] 📊 Extracted filters:`, currentExtractedFilters);
              
              apiFilters = convertFiltersToAPI(currentExtractedFilters);
              console.log(`[DASHBOARD PIPELINE] 📊 Converted API filters:`, apiFilters);
              
              const filterCount = Object.keys(apiFilters).length;
              if (filterCount > 0) {
                await typewriterEffect(`Applied ${filterCount} semantic filters`, 
                  (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
                );
              } else {
                await typewriterEffect("No specific filters detected - using broad semantic search", 
                  (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
                );
              }
      } catch (error) {
              console.error(`[DASHBOARD PIPELINE] ❌ Error in extractMetadataFilters:`, error);
        await typewriterEffect("No specific filters detected", 
          (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
        );
            }
          }
          
          console.log(`🎯🎯🎯 [DASHBOARD] SEARCH CONFIG READY:`, searchConfig);
        } else {
          console.error(`[DASHBOARD PIPELINE] ❌ Pipeline response not ok:`, {
            status: pipelineResponse.status,
            statusText: pipelineResponse.statusText
          });
          throw new Error(`Pipeline returned ${pipelineResponse.status}: ${pipelineResponse.statusText}`);
        }
      } catch (pipelineError) {
        console.error(`🔍🔍🔍 [DASHBOARD] SEARCH PIPELINE FAILED:`, pipelineError);
        console.error(`[DASHBOARD PIPELINE] ❌ Pipeline error details:`, {
          error: pipelineError,
          message: pipelineError instanceof Error ? pipelineError.message : 'Unknown error',
          stack: pipelineError instanceof Error ? pipelineError.stack : 'No stack'
        });
        
        // Fallback to basic search
        await typewriterEffect('Pipeline failed - using basic semantic search...', 
          (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
        );
        
        console.log(`[DASHBOARD PIPELINE] 🔄 Creating fallback pipeline result`);
        pipelineResult = {
          searchType: 'standard',
          searchConfig: { type: 'standard', enhancedFilters: {}, searchMethod: 'semantic_with_filters' },
          classification: { type: 'standard' },
          shouldExecuteSearch: true,
          fallbackToStandard: true
        };
        
        searchConfig = pipelineResult.searchConfig;
        queryClassification = pipelineResult.classification;
        console.log(`[DASHBOARD PIPELINE] 🔄 Fallback config created:`, { searchConfig, queryClassification });
      }
      
      // Phase 2: Searching database
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Phase 2: Searching database`);
      console.log(`[DASHBOARD SEARCH] 🚀 Starting database search phase`);
      setSearchPhase('searching');
      
      // Custom message for demo account
      if (isDemoMode) {
        const baseText = "Searching across our database of sample alumni profiles. ";
        const calendlyLink = `<a href="https://calendly.com/david-alumlo/30min" target="_blank" rel="noopener noreferrer" class="text-emerald-600 font-semibold hover:underline">Want alumni search for your organization?</a>`;

        await typewriterEffect(baseText, 
          (text) => setDisplayedText(prev => ({ ...prev, searching: text }))
        );
        
        setDisplayedText(prev => ({ ...prev, searching: prev.searching + calendlyLink }));
      } else {
        // Regular message for other users
        await typewriterEffect(`Searching across our database of ${totalAlumniCount.toLocaleString()} ${formattedOrganizationName} alumni profiles`, 
          (text) => setDisplayedText(prev => ({ ...prev, searching: text }))
        );
      }
      
      // Create the search request based on the pipeline result
      console.log(`[DASHBOARD SEARCH] 🔧 Building search request body`);
      console.log(`[DASHBOARD SEARCH] 📊 Pipeline result type: ${pipelineResult?.searchType || 'unknown'}`);
      
      const searchRequestBody = pipelineResult && (pipelineResult.searchType === 'chronological' || pipelineResult.searchType === 'temporal') ? {
          query: currentQuery, 
          organizationName: originalOrganizationName,
          isDemo: isDemoMode,
        searchConfig: searchConfig,
        queryClassification: queryClassification,
        // Include expansion results for metadata but don't execute expansion in main search
        expansionResults: pipelineResult.expansionResults
      } : {
        query: currentQuery, 
        organizationName: originalOrganizationName,
        isDemo: isDemoMode,
        queryClassification: queryClassification,
          filters: apiFilters
      };
      
      console.log(`🚀🚀🚀 [DASHBOARD] SEARCH REQUEST BODY:`, {
        searchType: pipelineResult?.searchType || 'standard',
        body: searchRequestBody
      });
      console.log(`[DASHBOARD SEARCH] 📝 Final request body:`, searchRequestBody);
      
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Creating search promise for query: "${currentQuery}"`);
      console.log(`[DASHBOARD SEARCH] 📡 Making search API request`);
      
      const searchPromise = fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequestBody),
      }).then(response => {
        console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search API response received, status: ${response.status}`);
        console.log(`🌐🌐🌐 [DASHBOARD] API RESPONSE STATUS: ${response.status} ${response.statusText}`);
        console.log(`[DASHBOARD SEARCH] 📡 Search API response: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        return response.json();
      }).then(rawData => {
        console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search data parsed, found ${rawData.results?.length || 0} results`);
        console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} First result:`, rawData.results?.[0] || 'No results');
        console.log(`📊📊📊 [DASHBOARD] RAW API RESPONSE:`, {
          resultCount: rawData.results?.length || 0,
          searchType: rawData.searchType,
          filterCount: rawData.filterCount,
          fullResponse: rawData
        });
        console.log(`[DASHBOARD SEARCH] ✅ Search completed successfully:`, {
          resultCount: rawData.results?.length || 0,
          searchType: rawData.searchType,
          metadata: rawData.searchMetadata
        });
        return rawData;
      }).catch(searchError => {
        console.error(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search API call failed:`, {
          error: searchError,
          message: searchError instanceof Error ? searchError.message : 'Unknown error',
          stack: searchError instanceof Error ? searchError.stack : 'No stack'
        });
        console.error(`[DASHBOARD SEARCH] ❌ Search API error:`, searchError);
        throw searchError;
      });
      
      // Get initial search results
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Waiting for search promise to resolve for query: "${currentQuery}"`);
      console.log(`[DASHBOARD SEARCH] ⏳ Waiting for initial search results...`);
      const searchData = await searchPromise;
      const initialResults = searchData.results;
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search promise resolved with ${initialResults?.length || 0} results for query: "${currentQuery}"`);
      console.log(`[DASHBOARD SEARCH] ✅ Initial search results received: ${initialResults?.length || 0} results`);
      
      // Phase 3: Display initial results
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Phase 3: Displaying initial results`);
      console.log(`[DASHBOARD RESULTS] 🎨 Starting initial results display phase`);
      setSearchPhase('complete');
      
      // Display initial results message
      let displayMessage = `Displaying ${initialResults.length} initial results`;
      if (searchData.searchType === 'chronological') {
        displayMessage += ' (using advanced chronological search for career progression analysis)';
      } else if (searchData.searchType === 'temporal') {
        displayMessage += ' (using temporal search for date-specific timeline analysis)';
      } else if (Object.keys(apiFilters).length > 0) {
        displayMessage += ` (with ${Object.keys(apiFilters).length} advanced filters applied)`;
      }
      displayMessage += '...';
      
      console.log(`[DASHBOARD RESULTS] 📄 Initial display message: ${displayMessage}`);
      await typewriterEffect(displayMessage, 
        (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
      );
      
      // Set initial results
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Setting initial search results state for query: "${currentQuery}"`);
      console.log(`[DASHBOARD RESULTS] 🔄 Processing initial results for display`);
      
      const compatibleInitialResults = ensureSearchResultCompatibility(initialResults);
      console.log(`[DASHBOARD DEBUG] After compatibility mapping, got ${compatibleInitialResults.length} initial results`);
      console.log(`[DASHBOARD RESULTS] ✅ Initial results processed and ready for display: ${compatibleInitialResults.length} results`);
      
      setSearchResults(compatibleInitialResults);
      setInitialSearchResults(compatibleInitialResults); // Store initial results separately
      console.log(`[DASHBOARD DEBUG] Initial search results state has been set`);
      
      // Phase 4: Check if expansion is available (for chronological searches only)
      console.log(`[DASHBOARD EXPANSION] 🔍 Checking expansion availability:`, {
        searchType: searchData.searchType,
        hasPipelineResult: !!pipelineResult,
        hasExpansionResults: !!pipelineResult?.expansionResults,
        hasVariants: !!pipelineResult?.expansionResults?.variants,
        variantCount: pipelineResult?.expansionResults?.variants?.length || 0
      });
      
      if (searchData.searchType === 'chronological' && 
          pipelineResult?.expansionResults && 
          pipelineResult.expansionResults.variants && 
          pipelineResult.expansionResults.variants.length > 0) {
        
        console.log(`[DASHBOARD EXPANSION] ✅ Expansion available: ${pipelineResult.expansionResults.variants.length} variants`);
        
        // Store expansion data and enable the expand button
        setPipelineExpansionData(pipelineResult.expansionResults);
        setCanExpand(true);
        setHasExpanded(false); // Reset expansion state
        
        console.log(`[DASHBOARD EXPANSION] 🎯 Expansion button enabled with ${pipelineResult.expansionResults.variants.length} variants ready`);
        
      } else {
        console.log(`[DASHBOARD EXPANSION] ❌ No expansion available - disabling expand option`);
        
        // Reset expansion states
        setPipelineExpansionData(null);
        setCanExpand(false);
        setHasExpanded(false);
      }
      
      // Automatically collapse the search analysis when results are presented
      if (initialResults && initialResults.length > 0) {
        setIsAnalysisCollapsed(true);
        console.log(`[DASHBOARD RESULTS] 📁 Analysis collapsed due to results being available`);
      }
      
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search process completed for query: "${currentQuery}"`);
      console.log(`[DASHBOARD RESULTS] 🎉 Search process completed successfully!`);
      
      // Save search to history with complete session data (use final results)
      if (!isDemoMode) {
        console.log(`[DASHBOARD HISTORY] 💾 Saving search to history`);
        // Get the final results (which may include expansion results)
        const finalResults = searchResults.length > 0 ? searchResults : compatibleInitialResults;
        
        // Capture current state at time of saving
        const currentDisplayedText = {
          analyzing: displayedText.analyzing,
          searching: displayedText.searching,
          profiling: displayedText.profiling,
          filters: displayedText.filters,
          displaying: displayedText.displaying
        };
        
        const searchId = await saveSearch({
          query: currentQuery,
          results: finalResults.map(result => ({
            id: result.id,
            name: result.name,
            linkedin_url: result.linkedin_url || result.profile_url || '', // Ensure linkedin_url is always a string
            current_company: result.current_company || result.post_company_current_company || '',
            current_title: result.current_title || result.post_company_current_title || '',
            current_industry: result.current_industry || result.post_company_current_industry || '',
            current_general_industry: result.current_general_industry || result.post_company_current_industry || '',
            current_job_location: result.current_job_location || result.post_company_current_location || '',
            years_experience: result.years_experience || 0,
            similarity: result.similarity,
            profile_photo_url: result.profile_photo_url || result.picture_url,
            headline: result.headline,
            current_job_level: result.current_job_level,
            current_job_function: result.current_job_function,
            undergraduate_school: result.undergraduate_school,
            graduate_school: result.graduate_school,
            highest_degree_level: result.highest_degree_level,
            major_category: result.major_category
          })),
          metadata: {
            source: directQuery ? 'tag_click' : 'search_input',
            expandedQueries: expandedQueries,
            extractedFilters: extractedFilters,
            // Save complete search session data
            searchSession: {
              displayedText: currentDisplayedText,
              searchPhase: 'complete',
              isAnalysisCollapsed: isAnalysisCollapsed,
              totalAlumniCount: totalAlumniCount,
              formattedOrganizationName: formattedOrganizationName,
              isDemoMode: isDemoMode,
              timestamp: new Date().toISOString()
            }
          }
        });
        
        console.log(`[DASHBOARD DEBUG] Saved complete search session with ID: ${searchId}`, {
          hasDisplayedText: !!currentDisplayedText.analyzing,
          expandedQueriesCount: expandedQueries.length,
          extractedFiltersKeys: Object.keys(extractedFilters)
        });
        console.log(`[DASHBOARD HISTORY] ✅ Search saved with ID: ${searchId}`);
      }
      
      // Track search completion with result count (use final results)
      const finalResultCount = searchResults.length > 0 ? searchResults.length : compatibleInitialResults.length;
      analytics.trackSearch(currentQuery, finalResultCount, { 
        source: directQuery ? 'tag_click' : 'search_input',
        status: 'complete'
      });
    } catch (error) {
      console.error(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search error for query "${currentQuery}":`, error);
      console.error(`[DASHBOARD ERROR] ❌ Critical search error:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
    } finally {
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Setting isSearching to false`);
      console.log(`[DASHBOARD CLEANUP] 🧹 Cleaning up search state`);
      setIsSearching(false);
      console.log(`[DASHBOARD DEBUG] ${new Date().toISOString()} Search complete, isSearching set to false`);
    }
  };

  // Fix the handleTagClick function
  const handleTagClick = async (query: string) => {
    console.log(`[DEBUG ${new Date().toISOString()}] Tag clicked with query: "${query}"`);
    handleSearch(new Event('submit') as any, query);
  };
  
  // Add new state for expansion messages
  const [expansionMessages, setExpansionMessages] = useState<string>('');

  // NEW: Manual expansion function
  const handleExpandSearch = async () => {
    if (!pipelineExpansionData || isExpanding || hasExpanded) {
      console.log(`[DASHBOARD EXPANSION] ❌ Cannot expand: no data, already expanding, or already expanded`);
      return;
    }
    
    console.log(`[DASHBOARD EXPANSION] 🔍 Starting manual expansion search`);
    setIsExpanding(true);
    setSearchPhase('expanding');
    
    // Clear previous expansion messages
    setExpansionMessages('');
    
    try {
      // Store the current analyzing text to append to
      const currentAnalyzing = displayedText.analyzing;
      
      // Show expansion header
      const expansionHeader = '🔍 Performing deeper analysis with alternative search strategies...';
      await typewriterEffect(expansionHeader, 
        (text) => setExpansionMessages(text)
      );
      
      // Show the expansion queries being processed
      let accumulatedExpansionText = expansionHeader;
      
      for (let i = 0; i < pipelineExpansionData.variants.length; i++) {
        const variant = pipelineExpansionData.variants[i];
        console.log(`[DASHBOARD EXPANSION] 📝 Processing expansion query ${i + 1}: "${variant.natural_language_query}"`);
        
        const queryMessage = `\n• Searching: "${variant.natural_language_query}"`;
        accumulatedExpansionText += queryMessage;
        
        await typewriterEffect(queryMessage, 
          (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - queryMessage.length) + text)
        );
      }
      
      console.log(`[DASHBOARD EXPANSION] 📡 Making expansion API request`);
      
      const expansionResponse = await fetch('/api/search-expansion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expansionResults: pipelineExpansionData,
          organizationName: localStorage.getItem('organizationName'),
          initialResults: initialSearchResults
        }),
      });
      
      if (expansionResponse.ok) {
        const expansionData = await expansionResponse.json();
        console.log(`[DASHBOARD EXPANSION] ✅ Expansion search completed:`, {
          expansionResultCount: expansionData.results?.length || 0,
          metadata: expansionData.metadata
        });
        
        if (expansionData.results && expansionData.results.length > 0) {
          // Show expansion completion message
          const completionMessage = `\n✅ Found ${expansionData.results.length} additional relevant profiles from expanded search`;
          accumulatedExpansionText += completionMessage;
          
          await typewriterEffect(completionMessage, 
            (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - completionMessage.length) + text)
          );
          
          // Combine initial and expansion results
          const allResults = [...initialSearchResults, ...expansionData.results];
          const compatibleAllResults = ensureSearchResultCompatibility(allResults);
          
          console.log(`[DASHBOARD EXPANSION] 🔄 Combining results:`, {
            initialCount: initialSearchResults.length,
            expansionCount: expansionData.results.length,
            totalCount: allResults.length,
            compatibleCount: compatibleAllResults.length
          });
          
          // Update results with combined data
          setSearchResults(compatibleAllResults);
          setHasExpanded(true);
          
          // Update display message to show final count
          const finalDisplayMessage = `Displaying ${allResults.length} total results (${initialSearchResults.length} primary + ${expansionData.results.length} expanded) based on relevance and alternative search strategies...`;
          
          await typewriterEffect(finalDisplayMessage, 
            (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
          );
          
        } else {
          console.log(`[DASHBOARD EXPANSION] ⚠️ No additional results from expansion search`);
          const noResultsMessage = `\n• No additional relevant profiles found from expanded search`;
          accumulatedExpansionText += noResultsMessage;
          
          await typewriterEffect(noResultsMessage, 
            (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - noResultsMessage.length) + text)
          );
        }
        
      } else {
        console.error(`[DASHBOARD EXPANSION] ❌ Expansion API failed:`, expansionResponse.status);
        const errorMessage = `\n⚠️ Expansion search encountered an issue - showing initial results`;
        accumulatedExpansionText += errorMessage;
        
        await typewriterEffect(errorMessage, 
          (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - errorMessage.length) + text)
        );
      }
      
      // Update the main analyzing text to include expansion messages
      setDisplayedText(prev => ({ 
        ...prev, 
        analyzing: currentAnalyzing + '\n\n' + accumulatedExpansionText 
      }));
      
    } catch (expansionError) {
      console.error(`[DASHBOARD EXPANSION] ❌ Expansion search error:`, expansionError);
      const errorMessage = `\n⚠️ Expansion search encountered an issue - showing initial results`;
      
      await typewriterEffect(errorMessage, 
        (text) => setExpansionMessages(text)
      );
      
      // Update the main analyzing text to include error message
      setDisplayedText(prev => ({ 
        ...prev, 
        analyzing: prev.analyzing + '\n\n' + errorMessage 
      }));
    } finally {
      setIsExpanding(false);
      setSearchPhase('complete');
      console.log(`[DASHBOARD EXPANSION] ✅ Manual expansion phase completed`);
    }
  };

  // Replace the existing generateExpandedQueries function with this AI-powered version
  const generateExpandedQueries = async (query: string): Promise<void> => {
    console.log(`[DEBUG ${new Date().toISOString()}] Generating AI query expansions for: "${query}"`);
    
    try {
      console.log(`[DEBUG ${new Date().toISOString()}] Making fetch request to /api/expand-query`);
      console.log(`[DEBUG ${new Date().toISOString()}] Request body:`, JSON.stringify({ query }));
      
      // Set up event source for the streaming response
      const response = await fetch('/api/expand-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      console.log(`[DEBUG ${new Date().toISOString()}] Received response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        ok: response.ok
      });
      
      // Handle non-streaming fallback case
      if (!response.ok) {
        console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error from expand-query API:`, response.statusText);
        try {
          // Try to get more error details from the response body
          const errorText = await response.text();
          console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error response body:`, errorText);
        } catch (readError) {
          console.error(`[DEBUG ERROR ${new Date().toISOString()}] Could not read error response:`, readError);
        }
        
        const fallbackText = "Alternative search suggestions unavailable";
        await typewriterEffect(fallbackText, 
          (text) => setDisplayedText(prev => ({ ...prev, profiling: text }))
        );
        return;
      }
      
      // Set up streaming with text accumulation
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }
      
      let accumulatedText = '';
      let currentDisplayText = '';
      
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[DEBUG ${new Date().toISOString()}] Stream complete, final text: "${accumulatedText}"`);
            break;
          }
          
          // Decode and parse the chunk
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsedData = JSON.parse(line.substring(6));
                if (parsedData.content) {
                  accumulatedText += parsedData.content;
                  
                  // Update the display with typewriter-like effect
                  const newPortion = parsedData.content;
                  currentDisplayText += newPortion;
                  
                  setDisplayedText(prev => ({ 
                    ...prev, 
                    profiling: currentDisplayText 
                  }));
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      };
      
      await processStream();
      
      // Extract the expanded queries from the accumulated text
      // The format should be query1 • query2 • query3
      const expandedQueriesArray = accumulatedText.split('•').map(q => q.trim()).filter(q => q);
      setExpandedQueries(expandedQueriesArray);
      
    } catch (error) {
      console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error in generateExpandedQueries:`, error);
      
      // Fallback in case of error
      const fallbackText = "Error generating alternative search suggestions";
      await typewriterEffect(fallbackText, 
        (text) => setDisplayedText(prev => ({ ...prev, profiling: text }))
      );
    }
  };

  // Extract metadata filters from query using AI
  const extractMetadataFilters = async (query: string): Promise<{[key: string]: string[]}> => {
    console.log(`[DEBUG ${new Date().toISOString()}] Extracting metadata filters for query: "${query}"`);
    
    try {
      const response = await fetch('/api/extract-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Filter extraction failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const processStream = async () => {
        let currentText = '';
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  currentText += data.content;
                  console.log(`[DEBUG ${new Date().toISOString()}] Filter extraction stream:`, data.content);
                  
                  // Update UI in real-time
                  setDisplayedText(prev => ({ 
                    ...prev, 
                    filters: `Detecting relevant filters: ${currentText}` 
                  }));
                }
              } catch (error) {
                console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error parsing stream data:`, error);
              }
            }
          }
        }
        
        console.log(`[DEBUG ${new Date().toISOString()}] Filter extraction complete, final text:`, currentText);
        return currentText;
      };

      const filtersText = await processStream();
      console.log(`[DEBUG ${new Date().toISOString()}] Filters text received:`, filtersText);
      
      if (!filtersText || filtersText.includes('No specific filters detected')) {
        return {};
      }
      
      const filters: {[key: string]: string[]} = {};
      const lines = filtersText.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const values = line.substring(colonIndex + 1).trim().split(',').map(v => v.trim()).filter(v => v);
          if (values.length > 0) {
            filters[key] = values;
          }
        }
      }
      
      console.log(`[DEBUG ${new Date().toISOString()}] Parsed filters:`, filters);
      return filters;
    } catch (error) {
      console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error in extractMetadataFilters:`, error);
      return {};
    }
  };

  // Add cleanup for timers
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Listen for search loading events from sidebar
  useEffect(() => {
    const handleLoadSearch = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { id, query } = customEvent.detail;
      console.log(`[DASHBOARD DEBUG] Received loadSearch event: ${id}, "${query}"`);
      await loadPastSearch(id, query);
    };

    // Listen for custom event
    window.addEventListener('loadSearch', handleLoadSearch);

    // Check localStorage for pending search load (when navigating from other pages)
    const pendingSearch = localStorage.getItem('loadSearch');
    if (pendingSearch) {
      try {
        const searchData = JSON.parse(pendingSearch);
        console.log(`[DASHBOARD DEBUG] Found pending search in localStorage:`, searchData);
        // Only load if it's recent (within 5 seconds) to avoid stale data
        if (Date.now() - searchData.timestamp < 5000) {
          console.log(`[DASHBOARD DEBUG] Loading pending search: ${searchData.id}`);
          loadPastSearch(searchData.id, searchData.query);
        } else {
          console.log(`[DASHBOARD DEBUG] Pending search too old, ignoring`);
        }
        localStorage.removeItem('loadSearch');
      } catch (error) {
        console.error('Error parsing pending search:', error);
        localStorage.removeItem('loadSearch');
      }
    } else {
    }

    return () => {
      window.removeEventListener('loadSearch', handleLoadSearch);
    };
  }, [loadSearchDetails]);

  // Function to load a past search
  const loadPastSearch = async (searchId: string, query: string) => {
    try {
      console.log(`[DASHBOARD DEBUG] loadPastSearch called with: ${searchId}, "${query}"`);
      
      // Set the search query in the input
      setSearchQuery(query);
      console.log(`[DASHBOARD DEBUG] Set search query to: "${query}"`);
      
      // Load the search details including results
      console.log(`[DASHBOARD DEBUG] Loading search details for ID: ${searchId}`);
      const searchDetails = await loadSearchDetails(searchId);
      console.log(`[DASHBOARD DEBUG] Search details loaded:`, searchDetails);
      
      if (searchDetails) {
        // Set the search results
        setSearchResults(ensureSearchResultCompatibility(searchDetails.results));
        setSearchPhase('complete');
        console.log(`[DASHBOARD DEBUG] Set ${searchDetails.results.length} search results`);
        
        // Check if we have complete session data saved
        const sessionData = searchDetails.search.metadata?.searchSession;
        console.log(`[DASHBOARD DEBUG] Session data:`, sessionData);
        
        if (sessionData && sessionData.displayedText) {
          // Restore complete search session
          setDisplayedText(sessionData.displayedText);
          setIsAnalysisCollapsed(sessionData.isAnalysisCollapsed || false);
          
          // Restore expanded queries and filters if available
          if (searchDetails.search.metadata?.expandedQueries) {
            setExpandedQueries(searchDetails.search.metadata.expandedQueries);
          }
          if (searchDetails.search.metadata?.extractedFilters) {
            setExtractedFilters(searchDetails.search.metadata.extractedFilters);
          }
          
          console.log('[DASHBOARD DEBUG] Restored complete search session data:', {
            hasAnalyzing: !!sessionData.displayedText.analyzing,
            hasSearching: !!sessionData.displayedText.searching,
            hasProfiling: !!sessionData.displayedText.profiling,
            hasFilters: !!sessionData.displayedText.filters,
            hasDisplaying: !!sessionData.displayedText.displaying,
            expandedQueriesCount: searchDetails.search.metadata?.expandedQueries?.length || 0,
            extractedFiltersKeys: Object.keys(searchDetails.search.metadata?.extractedFilters || {})
          });
        } else {
          // Fallback for searches without complete session data
          setDisplayedText({
            analyzing: 'Loaded previous search',
            searching: `Restored search for: "${query}"`,
            profiling: 'Previous analysis results not available',
            filters: 'Previous filters not available',
            displaying: `Showing ${searchDetails.results.length} saved results`
          });
          setIsAnalysisCollapsed(false);
          
          console.log('[DASHBOARD DEBUG] Used fallback display for search without session data');
        }
        
        // Track the loaded search
        analytics.trackSearch(query, searchDetails.results.length, { 
          source: 'history_load',
          status: 'loaded',
          hasSessionData: !!sessionData
        });
        
        console.log(`[DASHBOARD DEBUG] loadPastSearch completed successfully`);
      } else {
        console.log(`[DASHBOARD DEBUG] No search details found for ID: ${searchId}`);
      }
    } catch (error) {
      console.error('[DASHBOARD DEBUG] Error loading past search:', error);
    }
  };

  // Update handleSearchResultClick to capture snapshots
  const handleSearchResultClick = (url: string, resultIndex: number, resultName: string) => {
    // Track search result click and capture replay snapshot
    analytics.trackSearchResultClick(resultIndex, resultName, url);
    analytics.captureReplaySnapshot('search_result_click');
    
    // If not demo mode or already seen survey, navigate directly
    window.open(url, '_blank');
  };


  // Refined Typewriter effect for school name
  useEffect(() => {
    if (isOrganizationNameReadyToAnimate && displayOrganizationName) {
      setDisplayedOrganizationName(""); // Initialize for animation
      let i = 0;
      const organizationNameToAnimate = displayOrganizationName;
      
      const typingInterval = setInterval(() => {
        if (i < organizationNameToAnimate.length) {
          setDisplayedOrganizationName(organizationNameToAnimate.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 70); // Speed of typing
      return () => clearInterval(typingInterval); // Cleanup interval
    } else if (!displayOrganizationName) {
      setDisplayedOrganizationName(""); // Clear if no formatted name
    }
  }, [displayOrganizationName, isOrganizationNameReadyToAnimate]); // Dependencies

  // Add this new function to handle saving leads
  const handleSaveLead = async (result: SearchResult) => {
    if (isDemoMode) {
      setSavedStatusMap(prev => ({ ...prev, [result.id.toString()]: 'demo_no_save' }));
      console.log('Save functionality disabled in demo mode.');
      // Optionally, show a toast or notification to the user
      return;
    }

    const resultIdStr = result.id.toString();
    setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'saving' }));

    try {
      const originalOrganizationName = typeof window !== 'undefined' ? localStorage.getItem('organizationName') : null;

      if (!originalOrganizationName) {
        console.error("Organization name not found in localStorage. Cannot save lead.");
        setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'error' }));
        return;
      }
      
      // Construct table name like 'some_organization_alumni_saved_leads'
      const tableName = `${originalOrganizationName.toLowerCase().replace(/ /g, '_')}_alumni_saved_leads`;
      console.log(`[DEBUG] Attempting to save lead to table: ${tableName}`);

      // Need to get standardInfo for the specific result within this function's scope
      const standardInfo = getStandardProfileInfo(result);

      const leadData = {
        name: result.name,
        current_position: standardInfo.currentRole || 'Not specified', // Use standardInfo
        current_company: standardInfo.currentCompany || 'Not specified', // Use standardInfo
        linkedin_url: result.profile_url || result.linkedin_url || '',
        // saved_at will be handled by Supabase default now()
      };

      const { error } = await supabase
        .from(tableName)
        .insert([leadData]); // Use leadData which is correctly defined now

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.warn(`Lead already saved: ${leadData.linkedin_url}`);
          setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'already_saved' }));
        } else if (error.code === '42P01') { // Undefined table
          console.error(`Table ${tableName} does not exist. Please ensure it's created.`);
          setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'error' }));
          // Potentially alert the user or log this more visibly
        } else {
          console.error('Error saving lead:', error);
          setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'error' }));
        }
      } else {
        console.log('Lead saved successfully:', leadData);
        setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'saved' }));
        // TODO: Replace with appropriate analytics tracking if a generic trackEvent is not available
        // For example: analytics.trackButtonClick('LeadSaved', { leadName: leadData.name, organization: originalOrganizationName });
        console.log('Analytics Event: Lead Saved', { 
          leadName: leadData.name, 
          organization: originalOrganizationName 
        });
      }
    } catch (err) {
      console.error('Exception while saving lead:', err);
      setSavedStatusMap(prev => ({ ...prev, [resultIdStr]: 'error' }));
    }
  };

  const [showCalendly, setShowCalendly] = useState(false)

  useEffect(() => {
    // Check if this is a new user from OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('new_user') === 'true') {
      setShowCalendly(true)
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (authState.isLoading) {
    return <div>Loading authentication status...</div>
  }

  if (!authState.isAuthenticated) {
    return <div>Please log in to access the dashboard. Error: {error}</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className={`min-h-screen flex flex-col items-center px-4 ${
          (searchPhase === 'idle' && !displayedText.analyzing && !displayedText.searching && !displayedText.profiling && 
           !displayedText.filters && searchResults.length === 0) 
             ? 'justify-center' : 'pt-24'
        }`}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Search
              {/* Conditional space, only if school name will be rendered */}
              {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
              {isOrganizationNameReadyToAnimate && displayedOrganizationName ? (
                <span className="text-black">{displayedOrganizationName}</span>
              ) : null}
              {/* Conditional space, only if school name was rendered */}
              {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
              Alumni
            </h1>

          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-2">
            <div className="relative mb-6">
                  
              {/* Changed from input to textarea */}
              <textarea
                ref={textareaRef} // Added ref for dynamic height
                value={searchQuery}
                onChange={handleTextareaChange} // New handler for textarea
                onKeyDown={handleTextareaKeyDown} // Handle Enter key
                placeholder="Begin typing to search across your alumni..."
                className="w-full px-6 pt-4 pb-14 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg overflow-y-hidden resize-none"
                rows={1} // Start with a single row
                style={{ minHeight: 'calc(1.5em * 1 + 44px + 1rem)' }} // Initial height matching input + padding
              />
              
              {/* Buttons inside the input field, positioned at the bottom right */}
              <div className="absolute bottom-3 right-4 flex space-x-2">
                {/* Refresh button */}
                <button
                  type="button" 
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSearchPhase('idle')
                    setError(null)
                    setExpandedQueries([])
                    setExtractedFilters({})
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
                  aria-label="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Search/Send button */}
                <button
                  onClick={(e) => handleSearch(e)}
                  disabled={isSearching}
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
                  aria-label="Search"
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>

          <style jsx>{tagScrollAnimation}</style>
          
          <div className="w-full max-w-2xl">
            {/* First row of tags - Green */}
            <div className="scrolling-tags-container">
              <div className="scrolling-tags">
                {/* First copy of tags */}
                <div className="scrolling-tags-content">
                  {randomizedTags.length > 0 ? 
                    randomizedTags.map((tag, index) => (
                      <span 
                        key={`first-${index}`}
                        onClick={() => handleTagClick(tag)}
                        className="tag-item"
                      >
                        {tag}
                      </span>
                    ))
                    :
                    suggestionTags.map((tag, index) => (
                      <span 
                        key={`first-${index}`}
                        onClick={() => handleTagClick(tag)}
                        className="tag-item"
                      >
                        {tag}
                      </span>
                    ))
                  }
                </div>
                
                {/* Second copy of tags to create the infinite loop effect */}
                <div className="scrolling-tags-content">
                  {randomizedTags.length > 0 ? 
                    randomizedTags.map((tag, index) => (
                      <span 
                        key={`second-${index}`}
                        onClick={() => handleTagClick(tag)}
                        className="tag-item"
                      >
                        {tag}
                      </span>
                    ))
                    :
                    suggestionTags.map((tag, index) => (
                      <span 
                        key={`second-${index}`}
                        onClick={() => handleTagClick(tag)}
                        className="tag-item"
                      >
                        {tag}
                      </span>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Second row of tags - Golden Yellow */}
            <div className="scrolling-tags-container">
              <div className="scrolling-tags">
                {/* First copy of second row tags */}
                <div className="scrolling-tags-content-slow">
                  {secondRowSuggestionTags.map((tag, index) => (
                    <span 
                      key={`yellow-first-${index}`}
                      onClick={() => handleTagClick(tag)}
                      className="tag-item-yellow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Second copy of second row tags to create the infinite loop effect */}
                <div className="scrolling-tags-content-slow">
                  {secondRowSuggestionTags.map((tag, index) => (
                    <span 
                      key={`yellow-second-${index}`}
                      onClick={() => handleTagClick(tag)}
                      className="tag-item-yellow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis and Search Results */}
          <div className="w-full max-w-6xl flex flex-col gap-4 mt-8">
            {/* Analysis Section - Only show if there's content to display */}
            {(displayedText.analyzing || displayedText.searching || displayedText.profiling || displayedText.filters) && (
              <div className="w-full p-6 bg-gray-50 rounded-lg shadow-sm">
                {/* Collapse/Expand Button */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-black">Search Analysis</h2>
                  <button 
                    onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
                    className="text-black hover:text-emerald-600 transition-colors"
                  >
                    {isAnalysisCollapsed ? 'Expand ▼' : 'Collapse ▲'}
                  </button>
                </div>
                
                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ${isAnalysisCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
                  {displayedText.analyzing && (
                    <p className="text-gray-700 mb-3 whitespace-pre-line">{displayedText.analyzing}</p>
                  )}
                  
                  {/* Show expansion messages in real-time during expansion */}
                  {isExpanding && expansionMessages && (
                    <p className="text-gray-700 mb-3 whitespace-pre-line">{expansionMessages}</p>
                  )}
                  
                  {displayedText.searching && (
                    <p 
                      className="text-gray-700 mb-3"
                      dangerouslySetInnerHTML={{ __html: displayedText.searching }}
                    ></p>
                  )}
                  
                  {displayedText.profiling && (
                    <>
                      <h3 className="font-semibold text-gray-800 mt-4 mb-2">Profiling:</h3>
                      <p className="text-gray-700 mb-3">{displayedText.profiling}</p>
                    </>
                  )}
                  
                  {displayedText.filters && (
                    <>
                      <h3 className="font-semibold text-gray-800 mt-4 mb-2">Metadata Filters:</h3>
                      <p className="text-gray-700 mb-3 whitespace-pre-line">{displayedText.filters}</p>
                    </>
                  )}
                  
                  {displayedText.displaying && (
                    <p className="text-gray-700 mt-4">{displayedText.displaying}</p>
                  )}
                </div>
              </div>
            )}

            {/* Search Results Section - Show below the analysis */}
            {!isSearching && searchPhase === 'complete' && searchResults.length > 0 && (
              <div className="w-full pb-8">
                {/* Results Header with Expansion Button */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-black">
                    Found {searchResults.length} alumni matching your search
                  </h2>
                  
                  {/* Expansion Button - Only show if expansion is available and not already expanded */}
                  {canExpand && !hasExpanded && !isExpanding && (
                    <button
                      onClick={handleExpandSearch}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center space-x-2"
                      title="Find additional relevant profiles using alternative search strategies"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                      <span>Expand Search Results</span>
                    </button>
                  )}
                  
                  {/* Show expanding state */}
                  {isExpanding && (
                    <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Expanding Search...</span>
                    </div>
                  )}
                  
                  {/* Show expanded state */}
                  {hasExpanded && (
                    <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Search Expanded</span>
                    </div>
                  )}
                </div>
                
                {/* Add instruction message for clickability - only in demo mode */}
                {isDemoMode && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Click on any result to view the person's LinkedIn profile</span>
                  </div>
                )}
                
                <div className="grid gap-6">
                  {searchResults.map((result, index) => {
                    console.log(`[DEBUG RENDER] Rendering result ${index}:`, {
                      id: result.id,
                      name: result.name,
                      hasCurrentCompany: !!result.current_company,
                      hasPostCurrentCompany: !!result.post_company_current_company,
                      hasCurrentTitle: !!result.current_title,
                      hasPostCurrentTitle: !!result.post_company_current_title,
                      hasCurrentJobLocation: !!result.current_job_location,
                      hasPostCurrentLocation: !!result.post_company_current_location,
                      hasNaturalLanguageGeo: !!result.natural_language_geographic_profile,
                      hasUndergraduateSchool: !!result.undergraduate_school,
                      hasGraduateSchool: !!result.graduate_school,
                      fullResult: result
                    });
                    
                    // Get standard profile info
                    const standardInfo = getStandardProfileInfo(result);
                    
                    console.log(`[DEBUG RENDER] Standard info for ${result.name}:`, standardInfo);
                    
                    // Get matching filters for this result
                    const matchingFilters = getMatchingFilters(result, extractedFilters);
                    
                    // Add debugging for match highlights
                    console.log('[DEBUG] Match highlights for', result.name, ':', {
                      extractedFilters,
                      matchingFilters,
                      filterCount: matchingFilters.length
                    });
                    
                    // Use compatible field access
                    const profileUrl = result.profile_url || result.linkedin_url || '';
                    const profilePhotoUrl = result.picture_url || result.profile_photo_url;
                    
                    const currentSaveStatus = savedStatusMap[result.id.toString()] || 'idle';
                    const isButtonDisabled = 
                      isDemoMode ||
                      currentSaveStatus === 'saving' ||
                      currentSaveStatus === 'saved' ||
                      currentSaveStatus === 'already_saved';

                    let saveButtonContent;
                    switch (currentSaveStatus) {
                      case 'saving':
                        saveButtonContent = (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        );
                        break;
                      case 'saved':
                      case 'already_saved':
                        saveButtonContent = (
                          <>
                            <CheckCircle className="h-4 w-4 text-white" />
                            <span>Saved</span>
                          </>
                        );
                        break;
                      case 'error':
                        saveButtonContent = (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span>Error</span>
                          </>
                        );
                        break;
                      case 'demo_no_save':
                         saveButtonContent = (
                          <>
                            <BookmarkIcon className="h-4 w-4" />
                            <span>Save (Demo)</span>
                          </>
                        );
                        break;
                      default: // idle
                        saveButtonContent = (
                          <>
                            <BookmarkIcon className="h-4 w-4" />
                            <span>Save</span>
                          </>
                        );
                    }

                    return (
                      <div
                        key={result.id || index}
                        className="block p-8 bg-white border border-black rounded-lg hover:shadow-lg transition-all duration-300 relative group hover:bg-gray-50 hover:border-emerald-500 cursor-pointer"
                        onClick={() => handleSearchResultClick(profileUrl, index, result.name)}
                      >
                        {/* Action Buttons - Top Right Corner */}
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                          {/* LinkedIn Button - Square with logo only */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleSearchResultClick(profileUrl, index, result.name);
                            }}
                            className="w-7 h-7 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                            title="View LinkedIn Profile"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </button>
                          
                          {/* Save Button - Pill shaped */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleSaveLead(result);
                            }}
                            disabled={isButtonDisabled}
                            className={`px-4 py-1.5 text-sm font-medium rounded-full flex items-center space-x-1.5 transition-colors
                              ${
                                isButtonDisabled && (currentSaveStatus === 'saved' || currentSaveStatus === 'already_saved')
                                  ? 'bg-emerald-500 text-white cursor-not-allowed'
                                  : isButtonDisabled && currentSaveStatus === 'saving'
                                  ? 'bg-gray-200 text-gray-500 cursor-wait'
                                  : isButtonDisabled || currentSaveStatus === 'demo_no_save'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800'
                              }
                            `}
                            title={
                              isDemoMode ? "Save feature disabled in demo" 
                              : currentSaveStatus === 'saved' || currentSaveStatus === 'already_saved' ? "Profile saved" 
                              : currentSaveStatus === 'saving' ? "Saving profile..."
                              : "Save Profile"
                            }
                          >
                            {saveButtonContent}
                          </button>
                        </div>

                        {/* 4-Column Layout */}
                        <div className="grid grid-cols-4 gap-8 items-start">
                          
                          {/* Column 1: Profile Identity */}
                          <div className="flex flex-col items-center text-center">
                            {/* Profile Image */}
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mb-3">
                              {profilePhotoUrl ? (
                                <img 
                                  src={profilePhotoUrl} 
                                  alt={`${result.name}'s profile`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-semibold text-xl">
                                  {result.name?.split(' ').map(name => name[0]).join('') || '?'}
                                </div>
                              )}
                            </div>
                            
                            {/* Name */}
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{result.name}</h3>
                            
                            {/* Match Ranking */}
                            <div className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full font-medium">
                              Match #{index + 1}
                            </div>
                          </div>
                          
                          {/* Column 2: Match Criteria (Dynamic) */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-200 pb-1">
                              MATCH HIGHLIGHTS
                            </h4>
                            {matchingFilters.length > 0 ? (
                              <div className="space-y-2">
                                {matchingFilters.map((match, matchIndex) => (
                                  <div key={matchIndex} className="space-y-1">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">{match.category.replace(/s$/, '')}</div>
                                    <div className="text-sm font-medium text-emerald-700">{match.value}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                General match based on search relevance
                              </div>
                            )}
                          </div>
                          
                          {/* Column 3: Standard Profile Info (Static) */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-200 pb-1">
                              PROFILE DETAILS
                            </h4>
                            <div className="space-y-3">
                              {/* Location */}
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {standardInfo.location || 'Not specified'}
                                </div>
                              </div>
                              
                              {/* Current Role */}
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Current Role</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {standardInfo.currentRole || 'Not specified'}
                                </div>
                              </div>
                              
                              {/* Current Company */}
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Current Company</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {standardInfo.currentCompany || 'Not specified'}
                                </div>
                              </div>
                              
                              {/* Education */}
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Education</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {standardInfo.education || 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Column 4: Now Empty - Actions moved to top right */}
                          <div className="flex flex-col space-y-3">
                            {/* Column 4 content can be used for additional info if needed */}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Add "Want More?" button at the bottom of search results - only in demo mode */}
                {isDemoMode && (
                  <div className="mt-8 pb-12 flex justify-center">
                    <button 
                      onClick={() => {
                        setShowWantMoreModal(true);
                        analytics.trackModalOpen('WantMoreModal');
                      }}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-md font-semibold text-lg"
                    >
                      Want More?
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Want More Modal with analytics */}
          {showWantMoreModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Close the modal when clicking the backdrop
                if (e.target === e.currentTarget) {
                  setShowWantMoreModal(false);
                  analytics.trackModalClose('WantMoreModal', { userAction: 'backdrop_click' });
                }
              }}
            >
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-center mb-4">Are you interested in having access to ALL of your alumni?</h2>
                
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowWantMoreModal(false);
                      analytics.trackButtonClick('WantMoreModal_Yes');
                      analytics.trackModalClose('WantMoreModal', { userAction: 'yes_click' });
                      router.push('/support');
                      analytics.trackPageView('Support', { source: 'want_more_modal' });
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Yes
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowWantMoreModal(false); 
                      analytics.trackButtonClick('WantMoreModal_No');
                      analytics.trackModalClose('WantMoreModal', { userAction: 'no_click' });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Multi-Step Demo Onboarding Flow */}
          {isDemoMode && showDemoOnboarding && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Progress indicators */}
                <div className="flex justify-center py-4 bg-gray-50 border-b">
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-2 w-12 rounded-full transition-all duration-300 ${
                          step === demoStep 
                            ? 'bg-purple-600' 
                            : step < demoStep 
                              ? 'bg-purple-300' 
                              : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 text-center overflow-y-auto">
                  
                  {/* Step 0: Welcome */}
                  {demoStep === 0 && (
                    <div className="space-y-6">
                      <h1 className="text-4xl font-bold text-gray-900">Welcome to Alumlo!</h1>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your tool to perform deep research on people data.
                      </p>
                      
                      {/* Preview mockup */}
                      <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto border-2 border-gray-300">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          {/* Mock browser header */}
                          <div className="bg-gray-200 p-3 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1 bg-white rounded mx-4 px-3 py-1 text-sm text-gray-600">
                              alumlo.ai/search
                            </div>
                          </div>
                          
                          {/* Mock Alumlo interface */}
                          <div className="p-8">
                            <h2 className="text-2xl font-bold mb-4">The People Search Engine for<br/>Your Organization</h2>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between bg-white rounded-full px-4 py-3 shadow">
                                <span className="text-gray-400">Search for people who...</span>
                                <div className="bg-gray-100 rounded-full p-2">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">CS grads</span>
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">Founders offering open source developer tools</span>
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">People currently based in Europe</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video placeholder */}
                        <div className="mt-4 bg-gray-300 rounded-lg h-32 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">[Video Preview Will Play Here]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: School Filtering */}
                  {demoStep === 1 && (
                    <div className="space-y-6">
                      <h1 className="text-4xl font-bold text-gray-900">School filtering.</h1>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Find the right people based on specific criteria like schools, companies, and roles.
                      </p>
                      
                      {/* School selection mockup */}
                      <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto border-2 border-gray-300">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                          <div className="mb-6">
                            <h2 className="text-3xl font-bold mb-2">Your Organization ↗</h2>
                            <div className="relative">
                              <input 
                                type="text" 
                                className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
                                placeholder="Search..."
                                value="northwestern"
                                readOnly
                              />
                              <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-0 border-gray-300 rounded-b-lg">
                                <div className="p-4 hover:bg-gray-50 border-b border-gray-200 cursor-pointer">
                                  <div className="font-semibold text-lg">Northwestern College</div>
                                  <div className="text-gray-600">Orange City, IA</div>
                                </div>
                                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                                  <div className="font-semibold text-lg">Northwestern Health Sciences University</div>
                                  <div className="text-gray-600">Bloomington, MN</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video placeholder */}
                        <div className="mt-4 bg-gray-300 rounded-lg h-32 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">[Video Preview Will Play Here]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Natural Language Queries */}
                  {demoStep === 2 && (
                    <div className="space-y-6">
                      <h1 className="text-4xl font-bold text-gray-900">Natural language queries.</h1>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Utilize natural language to describe who you're looking for — we'll find the best matches.
                      </p>
                      
                      {/* Natural language search mockup */}
                      <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto border-2 border-gray-300">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                          <div className="mb-6">
                            <h2 className="text-3xl font-bold mb-6">Northwestern U...</h2>
                            <div className="bg-gray-50 rounded-lg p-6">
                              <div className="flex items-center justify-between bg-white rounded-full px-6 py-4 shadow-md mb-4">
                                <span className="text-gray-600 text-lg">Search for people who...</span>
                                <div className="bg-gray-100 rounded-full p-2">
                                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                              
                              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full inline-block mb-4">
                                🧠 Deep Research
                              </div>
                              
                              <div className="text-left space-y-2">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-700">People who started companies in 2019...</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-700">Founders building fintech or electronic startups</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-700">People working in A.I. agent generation</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video placeholder */}
                        <div className="mt-4 bg-gray-300 rounded-lg h-32 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">[Video Preview Will Play Here]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Advanced Search Algorithms */}
                  {demoStep === 3 && (
                    <div className="space-y-6">
                      <h1 className="text-4xl font-bold text-gray-900">Advanced search algorithms.</h1>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We deploy 100,000+ AI agents along with our search algorithms to find the best matches.
                      </p>
                      
                      {/* Advanced algorithms mockup */}
                      <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto border-2 border-gray-300">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <div className="mb-4">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <span className="text-gray-600">Biology, chemistry, and cog-sci undergraduates working on alzheimer's research</span>
                              <button className="ml-2 bg-gray-200 rounded-full p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="text-left">
                              <div className="text-purple-600 mb-2">Researching & Analyzing</div>
                              <div className="text-sm text-gray-600 mb-4">
                                Indexing through our database of 275,504,384 alumni profiles
                              </div>
                              
                              <div className="mb-4">
                                <div className="text-sm font-medium mb-2">🔍 Search Criteria</div>
                                <div className="bg-gray-50 p-3 rounded text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Is a biology undergraduate</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Is a chemistry undergraduate</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Is a cognitive science undergraduate</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Works on Alzheimer's research</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <div className="text-sm font-medium mb-2">💻 SQL Query</div>
                                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                                  SELECT<br/>
                                  &nbsp;&nbsp;r.name, r.location, r.headline, r.title,<br/>
                                  &nbsp;&nbsp;profile_picture_url, headline_picture_url,<br/>
                                  &nbsp;&nbsp;r.summary,<br/>
                                  &nbsp;&nbsp;r.twitter_handle, r.website,<br/>
                                  &nbsp;&nbsp;r.location_country,<br/>
                                  &nbsp;&nbsp;r.current_company
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video placeholder */}
                        <div className="mt-4 bg-gray-300 rounded-lg h-32 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">[Video Preview Will Play Here]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Profile Enrichment */}
                  {demoStep === 4 && (
                    <div className="space-y-6">
                      <h1 className="text-4xl font-bold text-gray-900">Profile enrichment.</h1>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        View profiles, enrich emails, and export your results as CSV.
                      </p>
                      
                      {/* Profile enrichment mockup */}
                      <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto border-2 border-gray-300">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <div className="text-left">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                              <h3 className="font-bold text-lg">Northwestern University</h3>
                            </div>
                            
                            {/* Profile results */}
                            <div className="space-y-4">
                              {/* Profile 1 */}
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    GT
                                  </div>
                                  <div>
                                    <div className="font-semibold">Giuseppe Terracina</div>
                                    <div className="text-sm text-gray-600">Senior Research Associate at Keypoint</div>
                                    <div className="text-xs text-gray-500">Kenilworth, New Jersey, United States</div>
                                  </div>
                                </div>
                                <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm">Contact</button>
                              </div>
                              
                              {/* Profile details popup */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-8">
                                <div className="mb-3">
                                  <h4 className="font-semibold mb-2">Giuseppe Terracina</h4>
                                  <p className="text-sm text-gray-600 mb-3">Senior Research Associate at Keypoint Intelligence • Kenilworth, New Jersey, United States</p>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="font-medium text-sm mb-1">📈 Experience</h5>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div>Senior Research Associate at Keypoint Intelligence • March 2017 - Present</div>
                                      <div>Scientist 2 at Amyris • June 2018 - November 2020</div>
                                      <div>Scientist at Amyris Group • September 2017 - May 2018</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-sm mb-1">🎓 Education</h5>
                                    <div className="text-xs text-gray-600">
                                      <div>Purdue University</div>
                                      <div>Masters of Sciences in genetics</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* More profiles */}
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    HX
                                  </div>
                                  <div>
                                    <div className="font-semibold">Hannah Xu</div>
                                    <div className="text-sm text-gray-600">Research Scientist</div>
                                    <div className="text-xs text-gray-500">Phoenix, Arizona, United States</div>
                                  </div>
                                </div>
                                <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm">Contact</button>
                              </div>
                              
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    MM
                                  </div>
                                  <div>
                                    <div className="font-semibold">Melissa McFarland</div>
                                    <div className="text-sm text-gray-600">Research Scientist</div>
                                    <div className="text-xs text-gray-500">Chicago, Illinois</div>
                                  </div>
                                </div>
                                <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm">Contact</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video placeholder */}
                        <div className="mt-4 bg-gray-300 rounded-lg h-32 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">[Video Preview Will Play Here]</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
                  <button
                    onClick={() => {
                      if (demoStep > 0) {
                        setDemoStep(demoStep - 1);
                      } else {
                        setShowDemoOnboarding(false);
                        analytics.trackButtonClick('DemoOnboarding_ExitEarly', { step: demoStep });
                      }
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Go back
                  </button>
                  
                  <button
                    onClick={() => {
                      if (demoStep < 4) {
                        setDemoStep(demoStep + 1);
                        analytics.trackButtonClick('DemoOnboarding_StepAdvance', { step: demoStep + 1 });
                      } else {
                        setShowDemoOnboarding(false);
                        analytics.trackButtonClick('DemoOnboarding_Complete', { totalSteps: 5 });
                      }
                    }}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {demoStep === 4 ? 'Start Exploring' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}