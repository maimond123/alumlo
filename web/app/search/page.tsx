"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Loader2, CheckCircle, AlertCircle, Bookmark as BookmarkIcon, BrainCog, Filter, Database, LayoutGrid, MessageSquare, ChevronUp, ChevronDown, RefreshCw, Download } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { motion, AnimatePresence } from "framer-motion"
import analytics from "../utils/analytics"
import { useOrganization } from "../contexts/OrganizationContext"
import { SearchResult } from "../types/search"
import { suggestionTags, secondRowSuggestionTags, tagScrollAnimation } from "../../components/search/constants"

// Helper function to get education display
const getEducationDisplay = (result: SearchResult): string => {
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
  const mappedResults = results.map((result, index) => {
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
    
    return mapped;
  });
  
  return mappedResults;
};

/**
 * CSV export of the current result set.
 *
 * The button rendered a Download icon over an empty handler. These are the
 * columns search_profiles returns. Profile URL stays in the list even though
 * the pseudonymized sample leaves it null, because a real tenant populates it.
 */
const CSV_COLUMNS: Array<[string, (r: SearchResult) => unknown]> = [
  ['Name', (r) => r.name],
  ['Headline', (r) => r.headline],
  ['Current title', (r) => r.current_title],
  ['Current company', (r) => r.current_company],
  ['Location', (r) => r.current_job_location || r.home_location],
  ['Exit year', (r) => r.exit_year],
  ['Years tenure', (r) => r.total_years_tenure],
  ['Prior companies', (r) => r.pre_company_companies],
  ['Prior titles', (r) => r.pre_company_titles],
  ['Later companies', (r) => r.post_company_companies],
  ['Later titles', (r) => r.post_company_titles],
  ['Undergraduate school', (r) => r.undergraduate_school],
  ['Graduate school', (r) => r.graduate_school],
  ['Similarity', (r) => (typeof r.similarity === 'number' ? r.similarity.toFixed(4) : '')],
  ['Profile URL', (r) => r.profile_url],
]

/** Quote every field: names carry commas, headlines carry quotes and newlines. */
const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '""'
  const flat = Array.isArray(value) ? value.filter(Boolean).join('; ') : String(value)
  return `"${flat.replace(/"/g, '""')}"`
}

const downloadResultsCsv = (results: SearchResult[], tenantName: string) => {
  const rows = [
    CSV_COLUMNS.map(([header]) => csvCell(header)).join(','),
    ...results.map((r) => CSV_COLUMNS.map(([, get]) => csvCell(get(r))).join(',')),
  ]

  // The BOM makes Excel read it as UTF-8 instead of latin-1.
  const blob = new Blob(['\ufeff' + rows.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const stamp = new Date().toISOString().slice(0, 10)

  const link = document.createElement('a')
  link.href = url
  link.download = `${slug || 'alumlo'}-results-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DashboardPage() {
  const { tenant, isLoading: orgLoading, error: orgError } = useOrganization()
  const [error, setError] = useState<string | null>(null)
  /** The tenant name as the typewriter effect has revealed it so far. */
  const [typedName, setTypedName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()

  // Add new states for search functionality
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Add these new states to your component
  const [searchPhase, setSearchPhase] = useState<'idle' | 'analyzing' | 'searching' | 'profiling' | 'filtering' | 'expanding' | 'complete' | 'invalid'>('idle');
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
  
  // Add state for Pro Tip visibility
  const [showProTip, setShowProTip] = useState(true)

  // Add ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  

  // Add new state for invalid query handling
  const [queryValidationError, setQueryValidationError] = useState<{
    errorType: string;
    message: string;
    suggestions: string[];
  } | null>(null);

  // Add new state for expansion messages
  const [expansionMessages, setExpansionMessages] = useState<string>('');


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




  // Track page view when component mounts
  useEffect(() => {
    analytics.trackPageView('Dashboard');
  }, []);

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
  };

  // Update handleSearch to include replay snapshot on search
  const handleSearch = async (e: React.FormEvent, directQuery?: string) => {
    e.preventDefault();
    
    // Use the direct query if provided (from tag click), otherwise use the state
    const queryToUse = directQuery || searchQuery.trim();

    // A search is scoped to a tenant. The page does not render without one.
    if (!queryToUse || !tenant) {
      return;
    }
    
    // Capture a replay snapshot for this important user interaction
    analytics.captureReplaySnapshot('search_initiated');
    
    // Track search event
    analytics.trackSearch(queryToUse, 0, { source: directQuery ? 'tag_click' : 'search_input' });
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Clear previous search results and reset state
    setSearchResults([]);
    setIsSearching(true);
    setSearchPhase('analyzing');
    setQueryValidationError(null); // Clear any previous validation errors
    
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
    
    // Reset displayed text
    setDisplayedText({
      analyzing: '',
      searching: '',
      profiling: '',
      filters: '',
      displaying: ''
    });
    
    // Start the AI animation sequence
    try {
      // Phase 1: Analyzing query with unified search pipeline
      const analyzingText = `Analyzing search query: "${currentQuery}"`;
      await typewriterEffect(analyzingText, (text) => setDisplayedText(prev => ({ ...prev, analyzing: text })));
      
      // STEP 1: Try unified search pipeline
      let searchConfig = null;
      let pipelineResult: any = null;
      let apiFilters = {};
      let queryClassification = null;
      let filterText = '';
      
      try {
        const pipelineResponse = await fetch('/api/search-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: currentQuery,
            organizationName: tenant.slug
          }),
        });
        
        if (pipelineResponse.ok) {
          pipelineResult = await pipelineResponse.json();
          
          // NEW: Check for invalid query response
          if (pipelineResult.searchType === 'invalid') {
            setSearchPhase('invalid');
            setIsSearching(false);
            
            // Collapse the analysis section when showing invalid query error
            setIsAnalysisCollapsed(true);
            
            // Set validation error state
            setQueryValidationError({
              errorType: 'invalid',
              message: pipelineResult.classification.invalidReason || 'This search query is not valid for our alumni database.',
              suggestions: pipelineResult.searchConfig.suggestions || []
            });
            
            // Update displayed text to show error
            setDisplayedText(prev => ({ 
              ...prev, 
              displaying: `❌ ${pipelineResult.classification.invalidReason || 'Invalid search query detected'}` 
            }));
            
            // Track invalid query
            analytics.trackSearch(currentQuery, 0, { 
              source: directQuery ? 'tag_click' : 'search_input',
              status: 'invalid',
              invalidReason: pipelineResult.classification.invalidReason
            });
            
            return; // Exit early for invalid queries
          }
          
          searchConfig = pipelineResult.searchConfig;
          queryClassification = pipelineResult.classification;
          
          setSearchPhase('searching');
          
          if (pipelineResult.searchType === 'temporal') {
            const temporalElements = searchConfig.temporalElements;
            
            const temporalSummary = [];
            if (temporalElements.exit_year) temporalSummary.push(`exit year: ${temporalElements.exit_year}`);
            if (temporalElements.subsequent_functions) temporalSummary.push(`functions: ${temporalElements.subsequent_functions.join(', ')}`);
            if (temporalElements.sequence_type) temporalSummary.push(`pattern: ${temporalElements.sequence_type}`);
            
            filterText = `Applied temporal filters (${temporalSummary.join(', ')})`;
            
          } else if (pipelineResult.searchType === 'chronological') {
            const filterCount = Object.keys(searchConfig.filters).length;
            
            filterText = `Applied ${filterCount} chronological filters (experience: ${searchConfig.filters.min_years_in_function || 'any'}, pattern: ${searchConfig.filters.career_progression_pattern || 'general'})`;
            
          } else if (pipelineResult.searchType === 'standard') {
            setSearchPhase('profiling');
            
            const enhancedFilters = searchConfig.enhancedFilters;
            
            const filterDescriptions = [];

            // Company filters - handle both singular and array formats
            if (enhancedFilters.company_filter) {
                filterDescriptions.push(`• Companies matching: "${enhancedFilters.company_filter}"`);
            } else if (enhancedFilters.company_filters && enhancedFilters.company_filters.length > 0) {
                filterDescriptions.push(`• Companies matching: ${enhancedFilters.company_filters.join(', ')}`);
            } else if (enhancedFilters.post_company_companies_filter && enhancedFilters.post_company_companies_filter.length > 0) {
                filterDescriptions.push(`• Previously worked at: ${enhancedFilters.post_company_companies_filter.join(', ')}`);
            }

            // Industry filters - handle both singular and array formats
            if (enhancedFilters.industry_filter) {
                filterDescriptions.push(`• Industries matching: "${enhancedFilters.industry_filter}"`);
            } else if (enhancedFilters.industry_filters && enhancedFilters.industry_filters.length > 0) {
                filterDescriptions.push(`• Industries matching: ${enhancedFilters.industry_filters.join(', ')}`);
            } else if (enhancedFilters.post_company_industries_filter && enhancedFilters.post_company_industries_filter.length > 0) {
                filterDescriptions.push(`• Previously worked in: ${enhancedFilters.post_company_industries_filter.join(', ')}`);
            }

            // Title filters - handle both singular and array formats
            if (enhancedFilters.title_filter) {
                filterDescriptions.push(`• Roles matching: "${enhancedFilters.title_filter}"`);
            } else if (enhancedFilters.title_filters && enhancedFilters.title_filters.length > 0) {
                filterDescriptions.push(`• Roles matching: ${enhancedFilters.title_filters.join(', ')}`);
            } else if (enhancedFilters.post_company_titles_filter && enhancedFilters.post_company_titles_filter.length > 0) {
                filterDescriptions.push(`• Previously held roles: ${enhancedFilters.post_company_titles_filter.join(', ')}`);
            }

            // Location filters - handle both singular and array formats
            if (enhancedFilters.location_filter) {
                filterDescriptions.push(`• Locations matching: "${enhancedFilters.location_filter}"`);
            } else if (enhancedFilters.location_filters && enhancedFilters.location_filters.length > 0) {
                filterDescriptions.push(`• Locations matching: ${enhancedFilters.location_filters.join(', ')}`);
            } else if (enhancedFilters.post_company_locations_filter && enhancedFilters.post_company_locations_filter.length > 0) {
                filterDescriptions.push(`• Previously worked in: ${enhancedFilters.post_company_locations_filter.join(', ')}`);
            }

            // School filters - handle both singular and array formats
            if (enhancedFilters.school_filter) {
                filterDescriptions.push(`• Schools matching: "${enhancedFilters.school_filter}"`);
            } else if (enhancedFilters.school_filters && enhancedFilters.school_filters.length > 0) {
                filterDescriptions.push(`• Schools matching: ${enhancedFilters.school_filters.join(', ')}`);
            } else if (enhancedFilters.undergraduate_schools_filter && enhancedFilters.undergraduate_schools_filter.length > 0) {
                filterDescriptions.push(`• Undergraduate schools: ${enhancedFilters.undergraduate_schools_filter.join(', ')}`);
            } else if (enhancedFilters.graduate_schools_filter && enhancedFilters.graduate_schools_filter.length > 0) {
                filterDescriptions.push(`• Graduate schools: ${enhancedFilters.graduate_schools_filter.join(', ')}`);
            }

            // Job level filters - handle both singular and array formats
            if (enhancedFilters.current_job_level_filter) {
                filterDescriptions.push(`• Job level: ${enhancedFilters.current_job_level_filter}`);
            } else if (enhancedFilters.current_job_level_filters && enhancedFilters.current_job_level_filters.length > 0) {
                filterDescriptions.push(`• Job levels: ${enhancedFilters.current_job_level_filters.join(', ')}`);
            }

            // Boolean filters
            if (enhancedFilters.is_current_leader) filterDescriptions.push(`• Identifying current leaders`);
            if (enhancedFilters.management_experience) filterDescriptions.push(`• Has management experience`);
            if (enhancedFilters.technical_background) filterDescriptions.push(`• Has a technical background`);
            if (enhancedFilters.sales_experience) filterDescriptions.push(`• Has sales experience`);

            // Expertise filters - handle arrays
            if (enhancedFilters.functional_expertise_filter && enhancedFilters.functional_expertise_filter.length > 0) {
                filterDescriptions.push(`• Expertise in: ${enhancedFilters.functional_expertise_filter.join(', ')}`);
            }
            if (enhancedFilters.industry_expertise_filter && enhancedFilters.industry_expertise_filter.length > 0) {
                filterDescriptions.push(`• Industry expertise: ${enhancedFilters.industry_expertise_filter.join(', ')}`);
            }

            // Education filters - handle both singular and array formats
            if (enhancedFilters.highest_degree_level_filter) {
                filterDescriptions.push(`• Degree level: ${enhancedFilters.highest_degree_level_filter}`);
            } else if (enhancedFilters.highest_degree_level_filters && enhancedFilters.highest_degree_level_filters.length > 0) {
                filterDescriptions.push(`• Degree levels: ${enhancedFilters.highest_degree_level_filters.join(', ')}`);
            }

            if (enhancedFilters.stem_education) filterDescriptions.push(`• Has a STEM education`);
            if (enhancedFilters.elite_education) filterDescriptions.push(`• Attended a top-tier school`);

            // Salary filters
            if (enhancedFilters.min_current_salary) filterDescriptions.push(`• Minimum salary of $${enhancedFilters.min_current_salary.toLocaleString()}`);
            if (enhancedFilters.max_current_salary) filterDescriptions.push(`• Maximum salary of $${enhancedFilters.max_current_salary.toLocaleString()}`);
            if (enhancedFilters.salary_growth_indicator) filterDescriptions.push(`• Shows high salary growth`);

            // Experience filters
            if (enhancedFilters.has_startup_experience) filterDescriptions.push(`• Has startup experience`);
            if (enhancedFilters.has_enterprise_experience) filterDescriptions.push(`• Has enterprise experience`);

            // Company size filters - handle both singular and array formats
            if (enhancedFilters.current_company_size_category_filter) {
                filterDescriptions.push(`• Company size: ${enhancedFilters.current_company_size_category_filter}`);
            } else if (enhancedFilters.current_company_size_category_filters && enhancedFilters.current_company_size_category_filters.length > 0) {
                filterDescriptions.push(`• Company sizes: ${enhancedFilters.current_company_size_category_filters.join(', ')}`);
            }

            if (filterDescriptions.length > 0) {
                filterText = filterDescriptions.join('\n');
            } else {
                filterText = 'Using broad semantic search across all profiles.';
            }
          }
          
        } else {
          throw new Error(`Pipeline returned ${pipelineResponse.status}: ${pipelineResponse.statusText}`);
        }
      } catch (pipelineError) {
        filterText = "Could not determine filters. Using basic search.";
        
        pipelineResult = {
          searchType: 'standard',
          searchConfig: { type: 'standard', enhancedFilters: {} },
          classification: { type: 'standard' },
          shouldExecuteSearch: true,
          fallbackToStandard: true
        };
        
        searchConfig = pipelineResult.searchConfig;
        queryClassification = pipelineResult.classification;
      }

      await typewriterEffect(filterText, (text) => setDisplayedText(prev => ({ ...prev, filters: text })));
      
      // Phase 2: Searching database
      setSearchPhase('searching');
      
      const searchingText = `Searching across our database of ${tenant.profileCount.toLocaleString()} ${tenant.name} alumni profiles`;
      
      // The search happens after filtering, so the searching message should also appear after.
      // The searchPromise will be awaited later, so this appears in order.
      
      const searchRequestBody = {
        query: currentQuery,
        organizationName: tenant.slug,
        searchConfig: searchConfig, // Always include searchConfig from pipeline
        queryClassification: queryClassification,
        // Include expansion results for metadata (for chronological searches)
        ...(pipelineResult?.expansionResults && { expansionResults: pipelineResult.expansionResults }),
        // Legacy filters for backward compatibility (will be ignored when searchConfig is present)
        filters: apiFilters
      };
      
      const searchPromise = fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequestBody),
      }).then(response => {
        if (!response.ok) {
          throw new Error('Search failed');
        }
        return response.json();
      }).then(rawData => {
        // 🔍 PRODUCTION DEBUG: Display all server-side debug logs
        if (rawData.debug && Array.isArray(rawData.debug)) {
          rawData.debug.forEach((logEntry: string, index: number) => {
          });
        }
        
        return rawData;
      }).catch(searchError => {
        throw searchError;
      });

      await typewriterEffect(searchingText, (text) => setDisplayedText(prev => ({ ...prev, searching: text })));
      
      // Get initial search results
      const searchData = await searchPromise;
      const initialResults = searchData.results;
      
      // Phase 3: Display initial results
      setSearchPhase('complete');
      
      // Display initial results message
      let displayMessage = `Displaying ${initialResults.length} initial results`;
      
      await typewriterEffect(displayMessage, (text) => setDisplayedText(prev => ({ ...prev, displaying: text })));
      
      // Set initial results
      const compatibleInitialResults = ensureSearchResultCompatibility(initialResults);
      
      setSearchResults(compatibleInitialResults);
      setInitialSearchResults(compatibleInitialResults); // Store initial results separately
      
      // Phase 4: Check if expansion is available (now supports all search types)
      if (pipelineResult?.expansionMetadata && pipelineResult.expansionMetadata.canExpand) {
        // Store expansion metadata for on-demand expansion
        setPipelineExpansionData(pipelineResult.expansionMetadata);
        setCanExpand(true);
        setHasExpanded(false); // Reset expansion state
        
      } else {
        // Reset expansion states
        setPipelineExpansionData(null);
        setCanExpand(false);
        setHasExpanded(false);
      }
      
      // Automatically collapse the search analysis when results are presented
      if (initialResults && initialResults.length > 0) {
        setIsAnalysisCollapsed(true);
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

      setIsSearching(false);
  
    }
  };

  // Fix the handleTagClick function
  const handleTagClick = async (query: string) => {
    setSearchQuery(query);
    handleSearch(new Event('submit') as any, query);
  };
  
  // NEW: Manual expansion function
  const handleExpandSearch = async () => {
    if (!pipelineExpansionData || isExpanding || hasExpanded || !tenant) {
      return;
    }
    
    setIsExpanding(true);
    setSearchPhase('expanding');
    
    // EXPAND the Search Analysis section to show the expansion process
    setIsAnalysisCollapsed(false);
    
    // Clear previous expansion messages
    setExpansionMessages('');
    
    try {
      // Store the current analyzing text
      const currentAnalyzing = displayedText.analyzing;
      
      // Show expansion header
      const expansionHeader = '🔍 Generating alternative search strategies...';
      await typewriterEffect(expansionHeader, 
        (text) => setExpansionMessages(text)
      );
      
      // Call the search-pipeline API with expansion request
      const expansionResponse = await fetch('/api/search-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'expand',
          query: pipelineExpansionData.originalQuery,
          organizationName: tenant.slug,
          searchType: pipelineExpansionData.searchType || (pipelineExpansionData.primaryElements ? 'temporal' : 
                     pipelineExpansionData.primaryFilters ? 'standard' : 'standard'),
          primaryFilters: pipelineExpansionData.primaryFilters,
          primaryElements: pipelineExpansionData.primaryElements
        }),
      });
      
      if (!expansionResponse.ok) {
        throw new Error('Invalid expansion response');
      }
      
      const expansionData = await expansionResponse.json();
      
      if (!expansionData.success || !expansionData.expansionResults) {
        throw new Error('Invalid expansion response');
      }
      
      // Show the expansion queries being processed
      let accumulatedExpansionText = expansionHeader;
      const variants = expansionData.expansionResults.variants;
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        
        const queryMessage = `\n• Searching: "${variant.natural_language_query}"`;
        accumulatedExpansionText += queryMessage;
        
        await typewriterEffect(queryMessage, 
          (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - queryMessage.length) + text)
        );
      }
      
      // Now execute the expansion searches using the search API
      const searchPromises = expansionData.expansionResults.additionalSearchConfigs.map(async (config: any, index: number) => {
        try {
          const searchResponse = await fetch('/api/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              searchConfig: config,
              organizationName: tenant.slug,
              query: variants[index].natural_language_query,
              isExpansionSearch: true
            }),
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            return searchData.results || [];
          } else {
            return [];
          }
        } catch (error) {
          return [];
        }
      });
      
      // Wait for all expansion searches to complete
      const expansionResults = await Promise.all(searchPromises);
      const allExpansionResults = expansionResults.flat();
      
      if (allExpansionResults.length > 0) {
        // Show expansion completion message
        const completionMessage = `\n✅ Found ${allExpansionResults.length} additional relevant profiles from expanded search`;
        accumulatedExpansionText += completionMessage;
        
        await typewriterEffect(completionMessage, 
          (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - completionMessage.length) + text)
        );
        
        // Combine initial and expansion results (remove duplicates by ID)
        const seenIds = new Set(initialSearchResults.map(r => r.id));
        const uniqueExpansionResults = allExpansionResults.filter((r: any) => !seenIds.has(r.id));
        const allResults = [...initialSearchResults, ...uniqueExpansionResults];
        const compatibleAllResults = ensureSearchResultCompatibility(allResults);
        
        // Update results with combined data
        setSearchResults(compatibleAllResults);
        setHasExpanded(true);
        
        // Update display message to show final count
        const finalDisplayMessage = `Displaying ${allResults.length} total results (${initialSearchResults.length} primary + ${uniqueExpansionResults.length} expanded) based on relevance and alternative search strategies...`;
        
        await typewriterEffect(finalDisplayMessage, 
          (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
        );
        
      } else {
        const noResultsMessage = `\n• No additional relevant profiles found from expanded search`;
        accumulatedExpansionText += noResultsMessage;
        
        await typewriterEffect(noResultsMessage, 
          (text) => setExpansionMessages(accumulatedExpansionText.substring(0, accumulatedExpansionText.length - noResultsMessage.length) + text)
        );
      }
      
      
      // COLLAPSE the Search Analysis section again after expansion is complete
      setTimeout(() => {
        setIsAnalysisCollapsed(true);
      }, 2000); // 2 second delay before auto-collapsing
      
    } catch (expansionError) {
      const errorMessage = `\n⚠️ Expansion search encountered an issue - showing initial results`;
      
      await typewriterEffect(errorMessage, 
        (text) => setExpansionMessages(text)
      );
      
      // COLLAPSE the Search Analysis section on error too
      setTimeout(() => {
        setIsAnalysisCollapsed(true);
      }, 2000);
    } finally {
      setIsExpanding(false);
      setSearchPhase('complete');
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



  // Update handleSearchResultClick to capture snapshots
  const handleSearchResultClick = (url: string, resultIndex: number, resultName: string) => {
    // The pseudonymized corpus carries no profile_url, and window.open('')
    // opens a blank tab rather than doing nothing. Callers already hide the
    // affordance; this keeps a stray call from opening one anyway.
    if (!url) return;

    // Track search result click and capture replay snapshot
    analytics.trackSearchResultClick(resultIndex, resultName, url);
    analytics.captureReplaySnapshot('search_result_click');

    window.open(url, '_blank', 'noopener,noreferrer');
  };


  // Typewriter effect for the tenant name
  useEffect(() => {
    if (!tenant) return
    setTypedName("")
    let i = 0
    const typingInterval = setInterval(() => {
      if (i < tenant.name.length) {
        setTypedName(tenant.name.substring(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
      }
    }, 70)
    return () => clearInterval(typingInterval)
  }, [tenant])


  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPhase('idle');
    setError(null);
    setExpandedQueries([]);
    setExtractedFilters({});
    setDisplayedText({
      analyzing: '',
      searching: '',
      profiling: '',
      filters: '',
      displaying: ''
    });
    setCanExpand(false);
    setIsExpanding(false);
    setHasExpanded(false);
    setPipelineExpansionData(null);
    setInitialSearchResults([]);
    setExpansionMessages('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.rows = 1;
    }
  };


  if (orgLoading) {
    return <div>Loading...</div>
  }

  if (!tenant) {
    return <div>No tenant found. {orgError}</div>
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
              Search{typedName ? " " : ""}
              {typedName ? <span className="text-black">{typedName}</span> : null}
              {typedName ? " " : ""}
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
                  onClick={handleClearSearch}
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
                  aria-label="Reset search"
                >
                  <RefreshCw className="h-5 w-5" />
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
            {(searchPhase === 'idle' && searchResults.length === 0) ? (
              <>
                {/* First row of tags - Green */}
                <div className="scrolling-tags-container">
                  <div className="scrolling-tags">
                    {/* First copy of tags */}
                    <div className="scrolling-tags-content">
                      {randomizedTags.length > 0 ? 
                        randomizedTags.map((tag: string, index: number) => (
                          <span 
                            key={`first-${index}`}
                            onClick={() => handleTagClick(tag)}
                            className="tag-item"
                          >
                            {tag}
                          </span>
                        ))
                        :
                        suggestionTags.map((tag: string, index: number) => (
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
                        randomizedTags.map((tag: string, index: number) => (
                          <span 
                            key={`second-${index}`}
                            onClick={() => handleTagClick(tag)}
                            className="tag-item"
                          >
                            {tag}
                          </span>
                        ))
                        :
                        suggestionTags.map((tag: string, index: number) => (
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
                      {secondRowSuggestionTags.map((tag: string, index: number) => (
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
                      {secondRowSuggestionTags.map((tag: string, index: number) => (
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
              </>
            ) : (
              <div className="w-full flex justify-between items-center mt-4">
                <div>
                  {(displayedText.analyzing || displayedText.searching || displayedText.filters) && (
                    <button
                      onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
                      className="flex items-center justify-between space-x-2 self-start px-3 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 font-semibold text-gray-700 border border-gray-200"
                    >
                      <span>Show Search Reasoning</span>
                      {isAnalysisCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                    {/* Expansion Button - Only show if expansion is available and not already expanded */}
                    {canExpand && !hasExpanded && !isExpanding && (
                      <button
                        onClick={handleExpandSearch}
                        className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 hover:scale-105 transition-all duration-200 font-medium flex items-center space-x-2"
                        title="Find additional relevant profiles using alternative search strategies"
                      >
                        <Search className="h-4 w-4" />
                        <span>Expand Searches</span>
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
                    {!isSearching && searchResults.length > 0 && (
                      <button
                        onClick={() => {
                          analytics.trackButtonClick('export_csv', { count: searchResults.length })
                          downloadResultsCsv(searchResults, tenant?.name ?? 'alumlo')
                        }}
                        title={`Download ${searchResults.length} results as CSV`}
                        className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 hover:scale-105 transition-all duration-200 font-medium flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                      </button>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Analysis and Search Results */}
          <div className="w-full max-w-6xl flex flex-col gap-4 mt-4">
            {/* Analysis Section - Only show if there's content to display */}
            <AnimatePresence>
              {!isAnalysisCollapsed && (displayedText.analyzing || displayedText.searching || displayedText.filters) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-6 bg-gray-50 rounded-lg shadow-sm overflow-hidden"
                >
                  <div>
                    {displayedText.analyzing && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 font-semibold text-gray-800">
                          <BrainCog className="h-5 w-5 text-yellow-500" />
                          <span>Thinking</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line pl-7 pt-1">{displayedText.analyzing}</p>
                      </div>
                    )}
                    
                    {displayedText.filters && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 font-semibold text-gray-800">
                          <Filter className="h-5 w-5 text-yellow-500" />
                          <span>Filtering</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line pl-7 pt-1">{displayedText.filters}</p>
                      </div>
                    )}

                    {displayedText.searching && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 font-semibold text-gray-800">
                          <Database className="h-5 w-5 text-yellow-500" />
                          <span>Searching</span>
                        </div>
                        <p 
                          className="text-gray-700 pl-7 pt-1"
                          dangerouslySetInnerHTML={{ __html: displayedText.searching }}
                        ></p>
                      </div>
                    )}
                    
                    {displayedText.displaying && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 font-semibold text-gray-800">
                          <LayoutGrid className="h-5 w-5 text-yellow-500" />
                          <span>Displaying</span>
                        </div>
                        <p className="text-gray-700 pl-7 pt-1">{displayedText.displaying}</p>
                      </div>
                    )}

                    {/* New Expanding section - shows when expansion is in progress */}
                    {isExpanding && expansionMessages && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 font-semibold text-gray-800">
                          <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                          <span>Expanding</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line pl-7 pt-1">{expansionMessages}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invalid Query Error Section */}
            {queryValidationError && (
              <div className="w-full pb-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Invalid Search Query
                      </h3>
                      <p className="text-red-700 mb-4">
                        {queryValidationError.message}
                      </p>
                      
                      {queryValidationError.suggestions && queryValidationError.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-800 mb-2">
                            Try searching for:
                          </h4>
                          <div className="space-y-2">
                            {queryValidationError.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleTagClick(suggestion)}
                                className="block w-full text-left px-3 py-2 bg-white border border-red-200 rounded-md hover:border-red-300 hover:bg-red-50 transition-colors text-red-700"
                              >
                                "{suggestion}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results Section - Show below the analysis */}
            {!isSearching && searchPhase === 'complete' && searchResults.length > 0 && (
              <div className="w-full pb-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Found {searchResults.length} alumni matching your search
                </h2>
                
                <div className="grid gap-6">
                  {searchResults.map((result, index) => {
                    // Get standard profile info
                    const standardInfo = getStandardProfileInfo(result);
                    
                    // Get matching filters for this result
                    const matchingFilters = getMatchingFilters(result, extractedFilters);
                    
                    // Add debugging for match highlights
                    // Use compatible field access
                    const profileUrl = result.profile_url || result.linkedin_url || '';
                    const profilePhotoUrl = result.picture_url || result.profile_photo_url;
                    
                    return (
                      <div
                        key={result.id || index}
                        className={`block p-8 bg-white border border-black rounded-lg hover:shadow-lg transition-all duration-300 relative group hover:bg-gray-50 hover:border-emerald-500 ${
                          profileUrl ? 'cursor-pointer' : ''
                        }`}
                        onClick={
                          profileUrl
                            ? () => handleSearchResultClick(profileUrl, index, result.name)
                            : undefined
                        }
                      >
                        {/* Action Buttons - Top Right Corner */}
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                          {/* LinkedIn Button - Square with logo only */}
                          {profileUrl && (
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
                          )}
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
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Latest Education</div>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}