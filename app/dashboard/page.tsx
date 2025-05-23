"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Brain } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import { getUserEmail, isAuthenticated } from "../utils/auth"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import analytics from "../utils/analytics"
import { FaLightbulb, FaTimes } from "react-icons/fa"

// Add the new interface for search results
interface SearchResult {
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

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formattedSchoolName, setFormattedSchoolName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()
  
  
  // Add new states for search functionality
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
  
  // Add state for mode toggle
  const [mode, setMode] = useState<'search' | 'learn'>('search');

  // Add these new states for the Learn mode
  const [conversations, setConversations] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
            setFormattedSchoolName("Your School");
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
              school: "Your School"
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
      const fetchSchoolName = async () => {
        try {
          const userEmail = await getUserEmail()

          if (!userEmail) {
            console.error('No email found in user data:', userEmail)
            throw new Error('No user email found')
          }

          const { data, error } = await supabase
            .from('customer_information')
            .select('school_name')
            .eq('school_email', userEmail)
            .single()

          if (error) {
            console.error('Supabase query error:', error)
            throw error
          }

          const formatted = data.school_name
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setFormattedSchoolName(formatted)
          
          // Store the original school name in localStorage for the search engine
          if (typeof window !== 'undefined') {
            localStorage.setItem('schoolName', data.school_name);
            console.log(`[DEBUG] Stored original school name in localStorage: "${data.school_name}"`);
          }
          
          setIsLoading(false)
        } catch (err: any) {
          if (err.message?.includes('not authenticated')) {
            router.push('/signin')
            return
          }
          setError('Failed to load school data')
          setIsLoading(false)
        }
      }

      fetchSchoolName()
    }
  }, [authState.isAuthenticated, router, isDemoMode])

  // Add this useEffect to fetch the total count on component mount
  useEffect(() => {
    const fetchTotalAlumniCount = async () => {
      if (formattedSchoolName) {
        setIsLoadingCount(true);
        try {
          const tableName = `${formattedSchoolName.toLowerCase().replace(/ /g, '_')}_vector`;
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
    
    if (formattedSchoolName) {
      fetchTotalAlumniCount();
    }
  }, [formattedSchoolName]);

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
                school: formattedSchoolName
              });
            }
          }
        } catch (error) {
          console.error("Error identifying user in analytics:", error);
        }
      }
    };

    identifyUserInAnalytics();
  }, [authState.isAuthenticated, isDemoMode, formattedSchoolName]);

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
    const originalSchoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : null;
    console.log(`[DEBUG ${new Date().toISOString()}] Original school name for API: "${originalSchoolName}"`);
    
    const searchPromise = fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: currentQuery, 
        top_k: 10,
        schoolName: originalSchoolName,
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
        await typewriterEffect(`Searching across our demo database of ${totalAlumniCount.toLocaleString()} ${formattedSchoolName} alumni profiles`, 
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
      await typewriterEffect(`Displaying top ${Math.min(10, searchResultsData.length)} personalized results...`, 
        (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
      );
      
      console.log(`[DEBUG ${new Date().toISOString()}] Setting search results state for query: "${currentQuery}"`);
      console.log(`[DEBUG ${new Date().toISOString()}] Results before setState:`, searchResultsData);
      setSearchResults(searchResultsData);
      console.log(`[DEBUG ${new Date().toISOString()}] Search process completed for query: "${currentQuery}"`);
      
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

  // Handle school name click in demo mode
  const handleSchoolNameClick = () => {
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
      const hasSeenSurvey = isBrowser ? localStorage.getItem('hasSeenAlumIntelSurvey') === 'true' : false;
      
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
            localStorage.setItem('hasSeenAlumIntelSurvey', 'true');
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

  // Add the learn mode typewriter effect
  const learnTypewriterEffect = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentAnswer('');
      let i = 0;
      const speed = 20; // slightly faster than the search typewriter
      
      const typing = setInterval(() => {
        if (i <= text.length) {
          setCurrentAnswer(text.substring(0, i));
          i++;
        } else {
          clearInterval(typing);
          resolve();
        }
      }, speed);
    });
  };

  // Add handleLearnSubmit function to handle questions in learn mode
  const handleLearnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim()) return;
    
    // Add the user's question to the conversation
    const userQuestion = currentQuestion.trim();
    setConversations(prev => [...prev, { role: 'user', content: userQuestion }]);
    setCurrentQuestion('');
    setIsProcessing(true);
    
    // Track the question in analytics
    analytics.trackLearnModeQuestion(userQuestion);
    
    try {
      // Call the API to get the response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userQuestion,
          schoolName: formattedSchoolName || "Your School",
          history: conversations
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }
      
      // Get the streaming response
      let responseText = '';
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode and process the chunk
          const chunk = new TextDecoder().decode(value);
          responseText += chunk;
          
          // Update the display with typewriter-like effect
          setCurrentAnswer(responseText);
        }
      };
      
      await processStream();
      
      // Use the typewriter effect for a smoother appearance
      await learnTypewriterEffect(responseText);
      
      // Add the AI's answer to the conversation history
      setConversations(prev => [...prev, { role: 'assistant', content: responseText }]);
      setCurrentAnswer('');
      
    } catch (error) {
      console.error('Error in learn mode chat:', error);
      setConversations(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, there was an error processing your request. Please try again." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add a function to scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentAnswer]);

  // Initialize with a welcome message when switching to learn mode
  useEffect(() => {
    // Remove the auto-generation of welcome message
    // Keep the dependency array to avoid linter warnings
  }, [mode, formattedSchoolName, conversations.length]);

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
    <div className="flex h-screen bg-white overflow-hidden">
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
        } ${mode === 'learn' && conversations.length > 0 ? 'pb-32' : ''}`}>
          {/* Only show title when there are no conversations in Learn mode */}
          {!(mode === 'learn' && conversations.length > 0) && (
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              {mode === 'search' ? 'Search' : 'Learn'}{" "}
              {isDemoMode ? (
                <span 
                  className="text-emerald-600 cursor-pointer hover:underline"
                  onClick={handleSchoolNameClick}
                >
                  {"{Your School}"}
                </span>
              ) : (
                formattedSchoolName
              )}
              {" "}Alumni Data
            </h1>
          )}

          {/* Search interface - only show in search mode */}
          {mode === 'search' && (
            <>
          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-2">
            <div className="relative mb-6">
                  {/* Mode toggle button on left side */}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'search' ? 'learn' : 'search')}
                    className="absolute left-4 bottom-3 w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors z-10"
                    aria-label={`Switch to ${mode === 'search' ? 'learn' : 'search'} mode`}
                  >
                    {mode === 'search' ? (
                      <Brain className="h-5 w-5" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </button>
                  
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Begin typing to search through your alumni network..."
                    className="w-full px-6 pt-4 pb-14 pl-16 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
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
            </>
          )}

          {/* Learn mode interface - only show in learn mode */}
          {mode === 'learn' && (
            <>
              {conversations.length === 0 ? (
                <>
                  <form onSubmit={handleLearnSubmit} className="w-full max-w-2xl mb-2">
                    <div className="relative mb-6">
                      {/* Mode toggle button on left side */}
                      <button
                        type="button"
                        onClick={() => setMode(mode === 'learn' ? 'search' : 'learn')}
                        className="absolute left-4 bottom-3 w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors z-10"
                        aria-label={`Switch to ${mode === 'learn' ? 'search' : 'learn'} mode`}
                      >
                        {mode === 'learn' ? (
                          <Search className="h-5 w-5" />
                        ) : (
                          <Brain className="h-5 w-5" />
                        )}
                      </button>
                      
                      <input
                        type="text"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="Ask about your alumni data (e.g., What's the average salary?)"
                        className="w-full px-6 pt-4 pb-14 pl-16 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
                        disabled={isProcessing}
                        onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleLearnSubmit(e)}
                      />
                      
                      {/* Buttons inside the input field, positioned at the bottom right */}
                      <div className="absolute bottom-3 right-4 flex space-x-2">
                        {/* Refresh button */}
                        <button
                          type="button" 
                          onClick={() => {
                            setCurrentQuestion('');
                            setConversations([]);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
                          aria-label="Clear"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {/* Send button */}
                        <button
                          type="submit"
                          disabled={isProcessing || !currentQuestion.trim()}
                          className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          aria-label="Send"
                        >
                          {isProcessing ? (
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
                        {/* First copy of question suggestion tags */}
                        <div className="scrolling-tags-content">
                          {[
                            "What's the average salary of our alumni?",
                            "How do our alumni compare to the general population?",
                            "What industries are our alumni working in?",
                            "How many of our alumni have founded companies?",
                            "What are the career progression patterns of our alumni?",
                            "What percentage of alumni reach executive positions?",
                            "In which countries do our alumni work?",
                            "How quickly do our alumni change jobs?",
                            "What's the entrepreneurship success rate of our alumni?",
                            "How can alumni data help with student recruitment?"
                          ].map((question, index) => (
                            <span 
                              key={`first-learn-${index}`}
                              onClick={() => {
                                setCurrentQuestion(question);
                                setTimeout(() => {
                                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                                  handleLearnSubmit(fakeEvent);
                                }, 50);
                              }}
                              className="tag-item"
                            >
                              {question}
                            </span>
                          ))}
                        </div>
                        
                        {/* Second copy of question suggestion tags for infinite scrolling */}
                        <div className="scrolling-tags-content">
                          {[
                            "What's the average salary of our alumni?",
                            "How do our alumni compare to the general population in terms of salary?",
                            "What industries are our alumni working in?",
                            "How many of our alumni have founded companies?",
                            "What are the career progression patterns of our alumni?",
                            "What percentage of alumni reach executive positions?",
                            "In which countries do our alumni work?",
                            "How quickly do our alumni change jobs?",
                            "What's the entrepreneurship success rate of our alumni?",
                            "How can alumni data help with student recruitment?"
                          ].map((question, index) => (
                            <span 
                              key={`second-learn-${index}`}
                              onClick={() => {
                                setCurrentQuestion(question);
                                setTimeout(() => {
                                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                                  handleLearnSubmit(fakeEvent);
                                }, 50);
                              }}
                              className="tag-item"
                            >
                              {question}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Conversation history container - Only show if there's content to display */}
                  <div className="w-full max-w-4xl flex flex-col gap-4">
                    {/* Conversation messages without border */}
                    <div className="w-full space-y-6 mb-6">
                      {conversations.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-[80%] p-4 rounded-2xl ${
                              msg.role === 'user' 
                                ? 'bg-emerald-600 text-white rounded-tr-none' 
                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show the in-progress answer */}
                      {currentAnswer && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none">
                            <p className="whitespace-pre-wrap">{currentAnswer}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Show typing indicator when processing */}
                      {isProcessing && !currentAnswer && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Fixed input form at bottom when there's conversation history */}
                  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                    <div className="max-w-2xl mx-auto">
                      <form onSubmit={handleLearnSubmit} className="w-full">
                        <div className="relative">
                          {/* Mode toggle button on left side */}
                          <button
                            type="button"
                            onClick={() => setMode(mode === 'learn' ? 'search' : 'learn')}
                            className="absolute left-4 bottom-3 w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors z-10"
                            aria-label={`Switch to ${mode === 'learn' ? 'search' : 'learn'} mode`}
                          >
                            {mode === 'learn' ? (
                              <Search className="h-5 w-5" />
                            ) : (
                              <Brain className="h-5 w-5" />
                            )}
                          </button>
                          
                          <input
                            type="text"
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            placeholder="Ask about your alumni data (e.g., What's the average salary?)"
                            className="w-full px-6 pt-4 pb-14 pl-16 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
                            disabled={isProcessing}
                            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleLearnSubmit(e)}
                          />
                          
                          {/* Buttons inside the input field, positioned at the bottom right */}
                          <div className="absolute bottom-3 right-4 flex space-x-2">
                            {/* Refresh button */}
                            <button
                              type="button" 
                              onClick={() => {
                                setCurrentQuestion('');
                                setConversations([]);
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
                              aria-label="Clear"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            
                            {/* Send button */}
                            <button
                              type="submit"
                              disabled={isProcessing || !currentQuestion.trim()}
                              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                              aria-label="Send"
                            >
                              {isProcessing ? (
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
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Analysis and Search Results - only show in search mode */}
          {mode === 'search' && (
          <div className="w-full max-w-4xl flex flex-col gap-4 mt-8">
            {/* Demo sidebar guidance - only show in demo mode */}
            {isDemoMode && searchPhase === 'idle' && showProTip && !isProTipDismissed && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start justify-between">
                <div className="flex items-center">
                  <FaLightbulb className="text-blue-500 mr-2" />
                  <span className="text-blue-700 font-medium">
                    Pro Tip: Click on the sidebar to explore more features like Analytics and Reports!
                  </span>
                </div>
                <button 
                  onClick={() => setIsProTipDismissed(true)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Dismiss tip"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
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
              <div className="w-full">
                <h2 className="text-xl font-semibold mb-4 text-black">
                  Found {searchResults.length} alumni matching your search
                </h2>
                
                {/* Add instruction message for clickability */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Click on any result to view the person's LinkedIn profile</span>
                </div>
                
                <div className="grid gap-4">
                  {searchResults.map((result, index) => {
                    const currentTitle = result.current_title || "";
                    
                    // Add debugging for each result
                    console.log(`[FRONTEND DEBUG] Result ${index}:`, {
                      name: result.name,
                      current_industry: result.current_industry,
                      headline: result.headline,
                      current_general_industry: result.current_general_industry
                    });
                    
                    return (
                      <a
                        key={result.id || index}
                        href={result.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-white border border-black rounded-lg hover:shadow-lg transition-all duration-300 relative group hover:bg-gray-50 hover:border-emerald-500 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSearchResultClick(result.linkedin_url, index, result.name);
                        }}
                      >
                        {/* Overlay indicating clickable */}
                        <div className="absolute inset-0 bg-emerald-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-300 pointer-events-none"></div>
                        
                        {/* LinkedIn Icon in top right corner */}
                        <div className="absolute top-2 right-2">
                          <img 
                            src="/assets/linkedin_gray.png" 
                            alt="LinkedIn" 
                            className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          {/* Profile Image */}
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-4">
                            {result.profile_photo_url ? (
                              <img 
                                src={result.profile_photo_url} 
                                alt={`${result.name}'s profile`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-semibold text-xl">
                                {result.name?.split(' ').map(name => name[0]).join('') || '?'}
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">{result.name}</h3>
                            
                            {/* Headline */}
                            {result.headline && (
                              <p className="text-gray-600 text-sm mt-1 italic">{result.headline}</p>
                            )}
                            
                            {/* Metadata in one row */}
                            <div className="flex flex-wrap items-center text-gray-600 mt-1">
                              <span>{currentTitle}</span>
                              {result.current_company && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{result.current_company}</span>
                                </>
                              )}
                              {result.current_job_location && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{result.current_job_location}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Industry */}
                            <p className="text-gray-500 text-sm mt-1">Industry: {result.current_industry}</p>
                            
                            {/* Match index instead of percentage */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full inline-block">
                                Match: #{index + 1}
                              </div>
                              
                              {/* Add a clear LinkedIn view button */}
                              <div className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                                <span>View LinkedIn</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
                
                {/* Add "Want More?" button at the bottom of search results */}
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
              </div>
            )}
          </div>
          )}

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
                <h2 className="text-xl font-bold text-center mb-4">Are you interested in using AlumIntel for your school?</h2>
                
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
                <p className="text-gray-600 mb-4 text-center">We'll reach out with more information about AlumIntel for your institution.</p>
                
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
                  <h3 className="text-xl font-bold text-emerald-600">Welcome to the AlumIntel Demo!</h3>
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
                  <h2 className="text-2xl font-bold text-gray-900 w-full text-center">Want this for your School's Alumni Data?</h2>
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
                  const schoolName = formData.get('school-name') as string;
                  const email = formData.get('email') as string;
                  const features = Array.from(formData.getAll('features')) as string[];
                  const budget = formData.get('budget') as string;
                  
                  // Track form submission
                  analytics.trackFormSubmit('DemoSurvey', { 
                    schoolName,
                    email,
                    features,
                    budget
                  });
                  
                  try {
                    // Save to Supabase
                    const { error } = await supabase
                      .from('demo_survey_responses')
                      .insert([{ 
                        school_name: schoolName,
                        email: email,
                        features: features,
                        created_at: new Date().toISOString()
                      }]);
                      
                    if (error) throw error;
                    
                    // Track successful submission
                    analytics.trackFormSubmit('DemoSurvey', { 
                      status: 'success',
                      schoolName,
                      email 
                    });
                    
                    // Show confirmation message
                    setShowDemoSurvey(false);
                    analytics.trackModalClose('DemoSurvey', { userAction: 'form_submit' });
                    
                    // Show confirmation modal
                    alert("Thank you for your interest! We'll contact you within 24 hours with more information about how AlumIntel can work for your institution.");
                    
                  } catch (error) {
                    console.error('Error submitting survey:', error);
                    // Track error
                    analytics.trackError('DemoSurveySubmission', 'Failed to submit survey', { 
                      schoolName, 
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
                          analytics.trackFormSubmit('DemoSurvey_SchoolNameInput', { 
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