"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import { getUserEmail, isAuthenticated } from "../utils/auth"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import analytics from "../utils/analytics"
import { FaLightbulb, FaTimes } from "react-icons/fa"
import { useSearchHistory } from "../../hooks/useSearchHistory"

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
  natural_language_geographic_profile: string;
  natural_language_educational_profile: string;
  highest_degree_level: string;
  major_category: string;
  similarity: number;
  // Legacy fields for backward compatibility
  linkedin_url?: string;
  current_company?: string;
  current_title?: string;
  current_industry?: string;
  current_general_industry?: string;
  current_job_location?: string;
  years_experience?: number;
  profile_photo_url?: string;
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
    animation: scroll 110s linear infinite;
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
  
  .tag-item:hover {
    background-color: rgba(16, 185, 129, 0.2);
    transform: translateY(-2px);
  }
  
  @keyframes scroll {
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
  // Prioritize graduate school, then undergraduate
  if (result.graduate_school && result.graduate_school.length > 0) {
    return result.graduate_school[0];
  }
  if (result.undergraduate_school && result.undergraduate_school.length > 0) {
    return result.undergraduate_school[0];
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
    natural_language_geographic_profile: result.natural_language_geographic_profile,
    undergraduate_school: result.undergraduate_school,
    graduate_school: result.graduate_school
  });

  return {
    location: extractLocationFromText(result.natural_language_geographic_profile) || 
              result.current_job_location || 
              result.post_company_current_location || '',
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
  
  // Map filter categories to database fields (removed icons)
  const filterMapping: {[key: string]: {field: keyof SearchResult | ((r: SearchResult) => string)}} = {
    'Job Functions': { field: 'current_job_function' },
    'Job Levels': { field: 'current_job_level' },
    'Industries': { field: (r) => r.post_company_current_industry || r.industry || r.current_industry || '' },
    'Company Names': { field: (r) => r.post_company_current_company || r.current_company || '' },
    'Locations': { field: (r) => extractLocationFromText(r.natural_language_geographic_profile) || r.current_job_location || '' },
    'Degree Levels': { field: 'highest_degree_level' },
    'Major Categories': { field: 'major_category' }
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
  return results.map(result => ({
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
    undergraduate_school: result.undergraduate_school || [],
    graduate_school: result.graduate_school || [],
    natural_language_geographic_profile: result.natural_language_geographic_profile || '',
    natural_language_educational_profile: result.natural_language_educational_profile || '',
    highest_degree_level: result.highest_degree_level || '',
    major_category: result.major_category || '',
    // Keep legacy fields for backward compatibility
    linkedin_url: result.linkedin_url || result.profile_url || '',
    current_company: result.current_company || result.post_company_current_company || '',
    current_title: result.current_title || result.post_company_current_title || '',
    current_industry: result.current_industry || result.post_company_current_industry || result.industry || '',
    current_general_industry: result.current_general_industry || '',
    current_job_location: result.current_job_location || result.post_company_current_location || '',
    years_experience: result.years_experience || 0,
    profile_photo_url: result.profile_photo_url || result.picture_url
  }));
};

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formattedOrganizationName, setFormattedOrganizationName] = useState("")
  const [displayedOrganizationName, setDisplayedOrganizationName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()
  
  
  // Add new states for search functionality
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Add search history hook
  const { saveSearch, loadSearchDetails } = useSearchHistory()

  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false
  })

  // Add these new states near the top with your other state declarations
  const [totalAlumniCount, setTotalAlumniCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Add these new states to your component
  const [searchPhase, setSearchPhase] = useState<'idle' | 'analyzing' | 'searching' | 'profiling' | 'filtering' | 'complete'>('idle');
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

  // Add state for randomized tags
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  
  // Add new state for demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoSurvey, setShowDemoSurvey] = useState(false)
  
  // Add new state for the Want More modal
  const [showWantMoreModal, setShowWantMoreModal] = useState(false)
  
  // Add new state for feature spotlight
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(true)
  
  // Add state for Pro Tip visibility
  const [showProTip, setShowProTip] = useState(true)
  
  // Add states for the first-click survey
  const [showFirstClickSurvey, setShowFirstClickSurvey] = useState(false)
  const [showEmailCollection, setShowEmailCollection] = useState(false)
  const [surveyEmail, setSurveyEmail] = useState("")
  const [pendingLinkedInUrl, setPendingLinkedInUrl] = useState("")
  const [isProTipDismissed, setIsProTipDismissed] = useState(false)
  
  // Add new state to control animation start
  const [isOrganizationNameReadyToAnimate, setIsOrganizationNameReadyToAnimate] = useState(false)

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

  // Check auth state on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setAuthState({
          isLoading: false,
          isAuthenticated: authenticated
        })
        
        if (!authenticated) {
          router.push('/signin')
        } else {
          // Check if this is a demo user
          const userEmail = await getUserEmail();
          if (userEmail === "maimondavid553@gmail.com") {
            console.log("Demo mode activated");
            setIsDemoMode(true);
            setFormattedOrganizationName("Your Organization");
            setIsLoading(false);
            
            // Track as a unique visitor while maintaining demo status
            // This ensures each visitor has a unique ID in Mixpanel
            // while still using the demo account data
            const visitorId = analytics.getVisitorId();
            console.log(`Demo visitor identified with unique ID: ${visitorId}`);
            
            // Use visitor ID for analytics but keep demo email for data retrieval
            analytics.identifyUser("maimondavid553@gmail.com", {
              isDemoUser: true,
              visitorId: visitorId,
              school: "Your Organization"
            });
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setAuthState({
          isLoading: false,
          isAuthenticated: false
        })
        router.push('/signin')
      }
    }
    
    checkAuth()
  }, [router])

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
            setFormattedOrganizationName("Your Organization"); // Fallback
            setIsOrganizationNameReadyToAnimate(true);
          }
        } catch (err) {
          console.error("Exception in fetchOrganizationName:", err);
          setError("An error occurred while fetching school data.");
          setFormattedOrganizationName("Your Organization"); // Fallback
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

  // Update handleSearch to include replay snapshot on search
  const handleSearch = async (e: React.FormEvent, directQuery?: string) => {
    e.preventDefault();
    
    // Use the direct query if provided (from tag click), otherwise use the state
    const queryToUse = directQuery || searchQuery.trim();
    
    if (!queryToUse) {
      return;
    }
    
    console.log(`[DEBUG ${new Date().toISOString()}] Search initiated for query: "${queryToUse}"`);
    
    // Capture a replay snapshot for this important user interaction
    analytics.captureReplaySnapshot('search_initiated');
    
    // Track search event
    analytics.trackSearch(queryToUse, 0, { source: directQuery ? 'tag_click' : 'search_input' });
    
    if (searchTimerRef.current) {
      console.log(`[DEBUG ${new Date().toISOString()}] Cancelling previous search timer`);
      clearTimeout(searchTimerRef.current);
    }

    // Clear previous search results and reset state
    setSearchResults([]);
    setIsSearching(true);
    setSearchPhase('analyzing');
    
    // Reset analysis collapsed state when starting a new search
    setIsAnalysisCollapsed(false);
    
    // Store the current query to ensure consistency 
    const currentQuery = queryToUse;
    console.log(`[DEBUG ${new Date().toISOString()}] Using query: "${currentQuery}"`);
    
    // Reset displayed text
    setDisplayedText({
      analyzing: '',
      searching: '',
      profiling: '',
      filters: '',
      displaying: ''
    });
    
    // IMPORTANT: Start the actual search request immediately in parallel with animations
    console.log(`[DEBUG ${new Date().toISOString()}] Starting API search request for: "${currentQuery}"`);
    
    // Get the original school name from localStorage for the API
    const originalOrganizationName = typeof window !== 'undefined' ? localStorage.getItem('organizationName') : null;
    console.log(`[DEBUG ${new Date().toISOString()}] Original organization name for API: "${originalOrganizationName}"`);
    
    const searchPromise = fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: currentQuery, 
        organizationName: originalOrganizationName,
        isDemo: isDemoMode
      }),
    }).then(response => {
      console.log(`[DEBUG ${new Date().toISOString()}] Search API response received, status: ${response.status}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    }).then(rawData => {
      console.log(`[DEBUG ${new Date().toISOString()}] Search data parsed, found ${rawData.results?.length || 0} results`);
      console.log(`[DEBUG ${new Date().toISOString()}] First result:`, rawData.results?.[0] || 'No results');
      return rawData;
    });
    
    // Start the AI animation sequence
    try {
      console.log(`[DEBUG ${new Date().toISOString()}] Starting animation sequence for query: "${currentQuery}"`);
      
      // Phase 1: Analyzing query
      console.log(`[DEBUG ${new Date().toISOString()}] Phase 1: Analyzing`);
      await typewriterEffect('Analyzing your search query...', 
        (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
      );
      
      // Phase 2: Searching database
      console.log(`[DEBUG ${new Date().toISOString()}] Phase 2: Searching`);
      setSearchPhase('searching');
      
      // Custom message for demo account
      if (isDemoMode) {
        await typewriterEffect(`Searching across our database, `, 
          (text) => setDisplayedText(prev => ({ ...prev, searching: text }))
        );
        // After the first part is typed, add the clickable part
        setDisplayedText(prev => ({ 
          ...prev, 
          searching: prev.searching + 
            '<span class="text-emerald-600 underline cursor-pointer" onclick="document.getElementById(\'demo-trigger\').click()">want this for your alumni data?</span>' 
        }));
      } else {
        // Regular message for other users
        await typewriterEffect(`Searching across our demo database of ${totalAlumniCount.toLocaleString()} ${formattedOrganizationName} alumni profiles`, 
          (text) => setDisplayedText(prev => ({ ...prev, searching: text }))
        );
      }
      
      // Phase 3: Generate expanded queries using the CURRENT query
      console.log(`[DEBUG ${new Date().toISOString()}] Phase 3: Profiling using query: "${currentQuery}"`);
      setSearchPhase('profiling');
      await generateExpandedQueries(currentQuery);
      
      // Phase 4: Extract metadata filters using the CURRENT query
      console.log(`[DEBUG ${new Date().toISOString()}] Phase 4: Filtering using query: "${currentQuery}"`);
      setSearchPhase('filtering');
      await extractMetadataFilters(currentQuery);
      
      // Get search results that were fetching in parallel
      console.log(`[DEBUG ${new Date().toISOString()}] Waiting for search promise to resolve for query: "${currentQuery}"`);
      const searchData = await searchPromise;
      const searchResultsData = searchData.results;
      console.log(`[DEBUG ${new Date().toISOString()}] Search promise resolved with ${searchResultsData?.length || 0} results for query: "${currentQuery}"`);
      
      // Phase 5: Display results
      console.log(`[DEBUG ${new Date().toISOString()}] Phase 5: Displaying results`);
      setSearchPhase('complete');
      await typewriterEffect(`Displaying ${searchResultsData.length} optimized results based on relevance...`, 
        (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
      );
      
      console.log(`[DEBUG ${new Date().toISOString()}] Setting search results state for query: "${currentQuery}"`);
      console.log(`[DEBUG ${new Date().toISOString()}] Results before setState:`, searchResultsData);
      setSearchResults(ensureSearchResultCompatibility(searchResultsData));
      
      // Automatically collapse the search analysis when results are presented
      if (searchResultsData && searchResultsData.length > 0) {
        setIsAnalysisCollapsed(true);
      }
      
      console.log(`[DEBUG ${new Date().toISOString()}] Search process completed for query: "${currentQuery}"`);
      
      // Save search to history with complete session data
      if (!isDemoMode) {
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
          results: searchResultsData,
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
        
        console.log(`[DEBUG] Saved complete search session with ID: ${searchId}`, {
          hasDisplayedText: !!currentDisplayedText.analyzing,
          expandedQueriesCount: expandedQueries.length,
          extractedFiltersKeys: Object.keys(extractedFilters)
        });
      }
      
      // Track search completion with result count
      analytics.trackSearch(currentQuery, searchResultsData?.length || 0, { 
        source: directQuery ? 'tag_click' : 'search_input',
        status: 'complete'
      });
    } catch (error) {
      console.error(`[DEBUG ERROR ${new Date().toISOString()}] Search error for query "${currentQuery}":`, error);
    } finally {
      console.log(`[DEBUG ${new Date().toISOString()}] Setting isSearching to false`);
      setIsSearching(false);
      console.log(`[DEBUG ${new Date().toISOString()}] Search complete, isSearching set to false`);
    }
  };

  // Fix the handleTagClick function
  const handleTagClick = async (query: string) => {
    console.log(`[DEBUG ${new Date().toISOString()}] Tag clicked with query: "${query}"`);
    
    // Track tag click
    analytics.trackTagClick(query);
    
    // Set the query first
    setSearchQuery(query);
    
    // Use setTimeout to ensure state update has completed
    setTimeout(() => {
      console.log(`[DEBUG ${new Date().toISOString()}] Executing search after tag click for: "${query}"`);
      // Create a proper synthetic event
      const fakeEvent = {
        preventDefault: () => {},
        target: { value: query },
        currentTarget: { value: query }
      } as unknown as React.FormEvent;
      
      // Call the search function directly with the query value, not depending on the state
      handleSearch(fakeEvent, query);
    }, 50);
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

  // Replace the existing extractMetadataFilters function with this AI-powered version
  const extractMetadataFilters = async (query: string): Promise<void> => {
    console.log(`[DEBUG ${new Date().toISOString()}] Extracting metadata filters for: "${query}"`);
    
    try {
      // Set up event source for the streaming response
      const response = await fetch('/api/extract-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      // Handle non-streaming fallback case
      if (!response.ok) {
        console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error from extract-filters API:`, response.statusText);
        const fallbackText = "No specific filters detected";
        await typewriterEffect(fallbackText, 
          (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
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
            console.log(`[DEBUG ${new Date().toISOString()}] Stream complete, final filters: "${accumulatedText}"`);
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
                    filters: currentDisplayText 
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
      
      // Parse the accumulated text into filter categories
      const filtersObj: {[key: string]: string[]} = {};
      const filterLines = accumulatedText.split('\n').filter(line => line.trim() !== '');
      
      for (const line of filterLines) {
        if (line === "No specific filters detected") {
          // No filters case
          break;
        }
        
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const [_, category, valuesStr] = match;
          filtersObj[category] = valuesStr.split(',').map(v => v.trim());
        }
      }
      
      setExtractedFilters(filtersObj);
      
    } catch (error) {
      console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error in extractMetadataFilters:`, error);
      
      // Fallback in case of error
      const fallbackText = "No specific filters detected";
      await typewriterEffect(fallbackText, 
        (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
      );
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
    console.log(`[DASHBOARD DEBUG] Added loadSearch event listener`);

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
      console.log(`[DASHBOARD DEBUG] No pending search found in localStorage`);
    }

    return () => {
      window.removeEventListener('loadSearch', handleLoadSearch);
      console.log(`[DASHBOARD DEBUG] Removed loadSearch event listener`);
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

  // Handle school name click in demo mode
  const handleOrganizationNameClick = () => {
    if (isDemoMode) {
      setShowDemoSurvey(true);
    }
  }

  // Update handleSearchResultClick to capture snapshots
  const handleSearchResultClick = (url: string, resultIndex: number, resultName: string) => {
    // Track search result click and capture replay snapshot
    analytics.trackSearchResultClick(resultIndex, resultName, url);
    analytics.captureReplaySnapshot('search_result_click');
    
    // Check if this is demo mode
    if (isDemoMode) {
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';
      // Check if user has already seen the first-click survey
      const hasSeenSurvey = isBrowser ? localStorage.getItem('hasSeenAlumloSurvey') === 'true' : false;
      
      if (!hasSeenSurvey) {
        // Track first-time survey shown
        analytics.trackModalOpen('FirstClickSurvey', { isFirstTime: true });
        analytics.captureReplaySnapshot('first_click_survey_shown');
        
        // If not seen, show the survey and store the URL to navigate to later
        setPendingLinkedInUrl(url);
        setShowFirstClickSurvey(true);
        // Mark as seen for future clicks
        if (isBrowser) {
          try {
            localStorage.setItem('hasSeenAlumloSurvey', 'true');
          } catch (e) {
            console.error('Failed to set localStorage item:', e);
          }
        }
        return;
      }
    }
    
    // If not demo mode or already seen survey, navigate directly
    window.open(url, '_blank');
  };

  // Update handleSurveySubmit to capture survey completion
  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission
    analytics.trackFormSubmit('LinkedInClickSurvey', { email: surveyEmail });
    
    // Capture a replay snapshot for survey submission
    analytics.captureReplaySnapshot('survey_submitted');
    
    try {
      // Save email to Supabase - updated table name
      const { error } = await supabase
        .from('linkedin_click_survey')
        .insert([{ 
          email: surveyEmail,
          interested: true,
          created_at: new Date().toISOString(),
          source: 'first_click_survey'
        }]);
        
      if (error) throw error;
      
      // Close the email collection modal
      setShowEmailCollection(false);
      
      // Navigate to the pending LinkedIn URL
      if (pendingLinkedInUrl) {
        window.open(pendingLinkedInUrl, '_blank');
      }
      
      // Clear the pending URL
      setPendingLinkedInUrl("");
      
      // Track successful submission
      analytics.trackFormSubmit('LinkedInClickSurvey', { 
        status: 'success',
        email: surveyEmail 
      });
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      // Track error
      analytics.trackError('SurveySubmission', 'Failed to submit survey', { email: surveyEmail });
      alert('There was an error submitting your information. Please try again.');
    }
  };

  // Refined Typewriter effect for school name
  useEffect(() => {
    if (isOrganizationNameReadyToAnimate && formattedOrganizationName) {
      setDisplayedOrganizationName(""); // Initialize for animation
      let i = 0;
      const organizationNameToAnimate = formattedOrganizationName;
      
      const typingInterval = setInterval(() => {
        if (i < organizationNameToAnimate.length) {
          setDisplayedOrganizationName(organizationNameToAnimate.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 70); // Speed of typing
      return () => clearInterval(typingInterval); // Cleanup interval
    } else if (!formattedOrganizationName) {
      setDisplayedOrganizationName(""); // Clear if no formatted name
    }
  }, [formattedOrganizationName, isOrganizationNameReadyToAnimate]); // Dependencies

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
      {/* Hidden button to trigger demo survey */}
      <button 
        id="demo-trigger" 
        className="hidden" 
        onClick={() => {
          setShowDemoSurvey(true);
          analytics.trackModalOpen('DemoSurvey', { source: 'want_more_link' });
        }}
        aria-hidden="true"
      />
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
                isDemoMode ? (
                  <span 
                    className="text-black cursor-pointer hover:underline"
                    onClick={handleOrganizationNameClick}
                  >
                    {displayedOrganizationName}
                  </span>
                ) : (
                  <span className="text-black">{displayedOrganizationName}</span>
                )
              ) : null}
              {/* Conditional space, only if school name was rendered */}
              {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
              Alumni
            </h1>

          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-2">
            <div className="relative mb-6">
                  
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Begin typing to search through your alumni network..."
                className="w-full px-6 pt-4 pb-14 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
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
                    <p className="text-gray-700 mb-3">{displayedText.analyzing}</p>
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
                <h2 className="text-xl font-semibold mb-4 text-black">
                  Found {searchResults.length} alumni matching your search
                </h2>
                
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
                    // Get standard profile info
                    const standardInfo = getStandardProfileInfo(result);
                    
                    // Get matching filters for this result
                    const matchingFilters = getMatchingFilters(result, extractedFilters);
                    
                    // Use compatible field access
                    const profileUrl = result.profile_url || result.linkedin_url || '';
                    const profilePhotoUrl = result.picture_url || result.profile_photo_url;
                    
                    return (
                      <div
                        key={result.id || index}
                        className="block p-8 bg-white border border-black rounded-lg hover:shadow-lg transition-all duration-300 relative group hover:bg-gray-50 hover:border-emerald-500"
                      >
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
                          
                          {/* Column 4: Actions */}
                          <div className="flex flex-col space-y-3">
                            {/* LinkedIn Button */}
                            <button
                              onClick={() => handleSearchResultClick(profileUrl, index, result.name)}
                              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                            >
                              <img 
                                src="/assets/linkedin_gray.png" 
                                alt="LinkedIn" 
                                className="w-4 h-4 filter invert brightness-0"
                              />
                              <span>LinkedIn</span>
                            </button>
                            
                            {/* Save Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add save functionality here
                                console.log('Save profile:', result.name);
                              }}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Headline (if available) - spans full width below the 4 columns */}
                        {result.headline && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-gray-600 text-sm italic text-center">"{result.headline}"</p>
                          </div>
                        )}
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

          {/* First Click Survey Modal */}
          {showFirstClickSurvey && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Close the modal when clicking the backdrop
                if (e.target === e.currentTarget) {
                  setShowFirstClickSurvey(false);
                  analytics.trackModalClose('FirstClickSurvey', { userAction: 'backdrop_click' });
                  // Navigate to LinkedIn if there's a pending URL
                  if (pendingLinkedInUrl) {
                    window.open(pendingLinkedInUrl, '_blank');
                    setPendingLinkedInUrl("");
                  }
                }
              }}
            >
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-center mb-4">Are you interested in using Alumlo for your Organization?</h2>
                
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowFirstClickSurvey(false);
                      setShowEmailCollection(true);
                      analytics.trackButtonClick('FirstClickSurvey_Yes');
                      analytics.trackModalClose('FirstClickSurvey', { userAction: 'yes_click' });
                      analytics.trackModalOpen('EmailCollection');
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Yes
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowFirstClickSurvey(false);
                      analytics.trackButtonClick('FirstClickSurvey_No');
                      analytics.trackModalClose('FirstClickSurvey', { userAction: 'no_click' });
                      // Navigate to LinkedIn if there's a pending URL
                      if (pendingLinkedInUrl) {
                        window.open(pendingLinkedInUrl, '_blank');
                        setPendingLinkedInUrl("");
                      }
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Email Collection Modal with analytics */}
          {showEmailCollection && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Prevent closing by clicking backdrop
                e.stopPropagation();
              }}
            >
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-center mb-4">Great! Please share your work email</h2>
                <p className="text-gray-600 mb-4 text-center">We'll reach out with more information about Alumlo for your institution.</p>
                
                <form onSubmit={handleSurveySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="work-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      id="work-email"
                      value={surveyEmail}
                      onChange={(e) => {
                        setSurveyEmail(e.target.value);
                        // Track email input change
                        if (e.target.value && e.target.value.includes('@')) {
                          analytics.trackFormSubmit('EmailCollection_Input', { 
                            hasDomain: e.target.value.includes('@') && e.target.value.split('@')[1].length > 0
                          });
                        }
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="name@work.edu"
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors w-full"
                    >
                      Continue to LinkedIn
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

          {/* Demo Feature Spotlight */}
          {isDemoMode && showFeatureSpotlight && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-emerald-600">Welcome to the Alumlo Demo!</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Try the Search</h4>
                      <p className="text-sm text-gray-600">Search for alumni by job titles, companies, locations, or click the suggested searches below the search box.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Interactive Results</h4>
                      <p className="text-sm text-gray-600">Click on search results to view LinkedIn profiles and explore alumni connections.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">AI-Powered Analytics</h4>
                      <p className="text-sm text-gray-600">Visit the Analytics section to see data visualizations that you can click on to chat with our AI assistant about the insights.</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowFeatureSpotlight(false);
                    analytics.trackFeatureSpotlight('dismiss');
                  }}
                  className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Got it, let's explore
                </button>
              </div>
            </div>
          )}

          {/* Demo Survey Modal with analytics */}
          {isDemoMode && showDemoSurvey && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Close the modal when clicking the backdrop (outside the modal)
                if (e.target === e.currentTarget) {
                  setShowDemoSurvey(false);
                  analytics.trackModalClose('DemoSurvey', { userAction: 'backdrop_click' });
                }
              }}
            >
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 w-full text-center">Are you interested in using Alumlo for your school?</h2>
                  <button 
                    onClick={() => {
                      setShowDemoSurvey(false);
                      analytics.trackModalClose('DemoSurvey', { userAction: 'x_button_click' });
                    }}
                    className="text-gray-500 hover:text-gray-700 absolute right-6 top-6"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Get form data
                  const formData = new FormData(e.currentTarget);
                  const organizationName = formData.get('organization-name') as string;
                  const email = formData.get('email') as string;
                  const features = Array.from(formData.getAll('features')) as string[];
                  const budget = formData.get('budget') as string;
                  
                  // Track form submission
                  analytics.trackFormSubmit('DemoSurvey', { 
                    organizationName,
                    email,
                    features,
                    budget
                  });
                  
                  try {
                    // Save to Supabase
                    const { error } = await supabase
                      .from('demo_survey_responses')
                      .insert([{ 
                        organization_name: organizationName,
                        email: email,
                        features: features,
                        created_at: new Date().toISOString()
                      }]);
                      
                    if (error) throw error;
                    
                    // Track successful submission
                    analytics.trackFormSubmit('DemoSurvey', { 
                      status: 'success',
                      organizationName,
                      email 
                    });
                    
                    // Show confirmation message
                    setShowDemoSurvey(false);
                    analytics.trackModalClose('DemoSurvey', { userAction: 'form_submit' });
                    
                    // Show confirmation modal
                    alert("Thank you for your interest! We'll contact you within 24 hours with more information about how Alumlo can work for your institution.");
                    
                  } catch (error) {
                    console.error('Error submitting survey:', error);
                    // Track error
                    analytics.trackError('DemoSurveySubmission', 'Failed to submit survey', { 
                      organizationName, 
                      email 
                    });
                    alert('There was an error submitting your information. Please try again.');
                  }
                }}>
                  {/* Form fields with input tracking */}
                  <div>
                    <label htmlFor="school-name" className="block text-sm font-medium text-gray-700 mb-1">
                      What's your school's name?
                    </label>
                    <input
                      type="text"
                      id="school-name"
                      name="school-name"
                      required
                      onChange={(e) => {
                        if (e.target.value.length > 0) {
                          analytics.trackFormSubmit('DemoSurvey_OrganizationNameInput', { 
                            length: e.target.value.length 
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Westfield High School"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Your work email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      onChange={(e) => {
                        if (e.target.value && e.target.value.includes('@')) {
                          analytics.trackFormSubmit('DemoSurvey_EmailInput', { 
                            hasDomain: e.target.value.includes('@') && e.target.value.split('@')[1].length > 0 
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="name@work.edu"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which features would be most valuable to your institution?
                    </label>
                    <div className="space-y-2">
                      {[
                        "Marketing Insights",
                        "Alumni Search and Discovery",
                        "Aggregate Alumni Analytics",
                        "Customizable School Insights Report",
                        "Student Mentorship Connections",
                        "Fundraising Insights",
                        "New Alumni Database",
                        "Networking Opportunities"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`feature-${index}`}
                            name="features"
                            value={feature}
                            onChange={(e) => {
                              if (e.target.checked) {
                                analytics.trackButtonClick('DemoSurvey_FeatureSelected', { feature });
                              }
                            }}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`feature-${index}`} className="ml-2 text-gray-700">
                            {feature}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      Submit & Continue Exploring
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}