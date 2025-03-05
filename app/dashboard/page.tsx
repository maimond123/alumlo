"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import '../aws-config'  
import { getUserEmail } from "../utils/auth"
import { useRouter } from "next/navigation"
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

// Add the new interface for search results
interface SearchResult {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  location: string;
  years_experience: number;
  similarity: number;
  profile_url?: string;
  all_titles?: string[];
}

const suggestionTags = [
  "Working on AI at FAANG",
  "People who started companies in Web3",
  "Recent graduates in Silicon Valley",
  "Alumni in Healthcare Tech",
  "Engineers at SpaceX",
  "Harvard MBA graduates in Finance",
  "Product Managers in New York",
  "Data Scientists at startups",
  "Alumni working in Renewable Energy",
  "Lawyers at top firms in Chicago",
  "Graduates with PhDs in Computer Science",
  "Marketing Directors in Los Angeles",
  "People who worked at Goldman Sachs",
  "Software Engineers who became CTOs",
  "Alumni in Pharmaceutical Research",
  "Consultants at McKinsey",
  "Graduates working in Singapore",
  "UX Designers at tech companies",
  "People with experience in Biotech",
  "Stanford graduates in Venture Capital",
  "Alumni who founded EdTech startups",
  "Doctors working in telemedicine",
  "MBA graduates in Consumer Goods",
  "People working remotely in Tech",
  "Alumni with experience at Amazon",
  "Architects in sustainable design",
  "Graduates working in London",
  "Data Engineers in Financial Services",
  "People who transitioned to Nonprofit",
  "MIT graduates in Robotics",
  "Alumni in Media and Entertainment",
  "Product Designers in San Francisco",
  "People with experience in Cybersecurity",
  "Graduates working at Microsoft",
  "Investment Bankers in Hong Kong",
  "Alumni who became professors",
  "Software Developers in Austin",
  "People with experience in Supply Chain",
  "Yale Law graduates in Public Policy",
  "Alumni working in Hospitality",
  "Machine Learning Engineers at Google",
  "Graduates in Advertising in Chicago",
  "People who started E-commerce businesses",
  "Alumni with experience in Real Estate",
  "Project Managers in Seattle",
  "Graduates working in Aerospace",
  "People with experience in Healthcare Administration",
  "Columbia graduates in Journalism",
  "Alumni in Sustainable Fashion",
  "DevOps Engineers at unicorn startups"
]

// Update the CSS animation for a better infinite scroll effect
const tagScrollAnimation = `
@keyframes scrollTags {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.scrolling-tags-container {
  width: 100%;
  max-width: 2xl;
  overflow: hidden;
  position: relative;
  margin-top: 0.5rem;
}

.scrolling-tags {
  display: inline-flex;
  white-space: nowrap;
  animation: scrollTags 110s linear infinite; /* Slowed down from 30s to 60s */
  padding-right: 2rem;
}

.scrolling-tags-content {
  display: inline-flex;
  padding-right: 2rem;
}

.scrolling-tags-content:last-child {
  padding-right: 0;
}

.tag-item {
  display: inline-block;
  background-color: rgba(16, 185, 129, 0.1);
  color: rgb(4, 120, 87);
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag-item:hover {
  background-color: rgba(16, 185, 129, 0.2);
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
    isAuthenticated: false,
    authError: null as unknown | null,
    userEmail: null as string | null
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

  // Add a state to track if a search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log("Dashboard: Checking auth status...")
      try {
        const { username, userId, signInDetails } = await getCurrentUser()
        const session = await fetchAuthSession()
        console.log("Dashboard: User authenticated:", username)
        console.log("Dashboard: Session:", session)
        
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          authError: null,
          userEmail: signInDetails?.loginId || null
        })
      } catch (error) {
        console.error("Dashboard: Auth error:", error)
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          authError: error,
          userEmail: null
        })
      }
    }

    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (authState.isAuthenticated) {
      console.log("Dashboard: User authenticated, fetching data...")
      const fetchSchoolName = async () => {
        try {
          const userEmail = await getUserEmail()

          if (!userEmail) {
            console.error('No email found in user data:', userEmail)
            throw new Error('No user email found')
          }

          console.log('Querying with email:', userEmail)
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
          setIsLoading(false)
        } catch (err: any) {
          console.error('Error fetching school name:', err)
          if (err.message?.includes('not authenticated')) {
            router.push('/login')
            return
          }
          setError('Failed to load school data')
          setIsLoading(false)
        }
      }

      fetchSchoolName()
    }
  }, [authState.isAuthenticated, router])

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
            console.error('[Client] Error fetching alumni count:', error);
          } else {
            console.log('[Client] Total alumni count:', count);
            setTotalAlumniCount(count || 0);
          }
        } catch (error) {
          console.error('[Client] Error in count fetch:', error);
        } finally {
          setIsLoadingCount(false);
        }
      }
    };
    
    if (formattedSchoolName) {
      fetchTotalAlumniCount();
    }
  }, [formattedSchoolName]);

  // Add this helper function to simulate typewriter effect
  const typewriterEffect = (text: string, setter: (text: string) => void, speed: number = 30): Promise<void> => {
    console.log(`[DEBUG ${new Date().toISOString()}] Starting typewriter effect for text: "${text.substring(0, 20)}..."`);
    return new Promise((resolve) => {
      let i = 0;
      const typing = setInterval(() => {
        if (i <= text.length) {
          setter(text.substring(0, i));
          i++;
        } else {
          clearInterval(typing);
          console.log(`[DEBUG ${new Date().toISOString()}] Completed typewriter effect`);
          resolve();
        }
      }, speed);
    });
  };

  // Modify handleSearch to set hasSearched to true
  const handleSearch = async (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault();
    const query = overrideQuery || searchQuery.trim();
    
    if (!query) return;
    
    setIsSearching(true);
    setHasSearched(true); // Set this flag when search begins
    // Rest of your existing handleSearch code...
  };

  // Fix the handleTagClick function
  const handleTagClick = async (query: string) => {
    console.log(`[DEBUG ${new Date().toISOString()}] Tag clicked with query: "${query}"`);
    
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

  const fetchProfilePhotos = async (results: SearchResult[]) => {
    try {
      console.log(`[DEBUG ${new Date().toISOString()}] fetchProfilePhotos called with ${results.length} results`);
      
      const linkedinUrls = results.map(result => result.linkedin_url);
      if (linkedinUrls.length === 0) {
        console.log(`[DEBUG ${new Date().toISOString()}] No LinkedIn URLs to fetch photos for`);
        return;
      }
      
      console.log(`[DEBUG ${new Date().toISOString()}] Fetching profile photos for LinkedIn URLs:`, linkedinUrls);
      
      const tableName = formattedSchoolName?.toLowerCase().replace(/ /g, '_') || 'lawrenceville';
      console.log(`[DEBUG ${new Date().toISOString()}] Using table name: ${tableName}`);
      
      // Query the main school table using linkedin_url as the common identifier
      const { data, error } = await supabase
        .from(tableName)
        .select('linkedin_url, profile_photo_url')
        .in('linkedin_url', linkedinUrls);
        
      if (error) {
        console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error fetching profile photos:`, error);
        return;
      }
      
      console.log(`[DEBUG ${new Date().toISOString()}] Profile photo data:`, data);
      
      // Create a copy of results to modify
      const updatedResults = [...results];
      
      // Map profile photos to search results using linkedin_url as the key
      updatedResults.forEach(result => {
        const matchingProfile = data?.find((profile: any) => 
          profile.linkedin_url === result.linkedin_url
        );
        if (matchingProfile && matchingProfile.profile_photo_url) {
          result.profile_url = matchingProfile.profile_photo_url;
          console.log(`[DEBUG ${new Date().toISOString()}] Added photo for ${result.name}:`, matchingProfile.profile_photo_url);
        } else {
          console.log(`[DEBUG ${new Date().toISOString()}] No photo found for ${result.name}`);
        }
      });
      
      console.log(`[DEBUG ${new Date().toISOString()}] Setting updated results with photos:`, updatedResults);
      setSearchResults(updatedResults);
    } catch (error) {
      console.error(`[DEBUG ERROR ${new Date().toISOString()}] Error in fetchProfilePhotos:`, error);
    }
  };

  if (authState.isLoading) {
    return <div>Loading authentication status...</div>
  }

  if (!authState.isAuthenticated) {
    return <div>Please log in to access the dashboard. Error: {authState.authError instanceof Error ? authState.authError.message : String(authState.authError)}</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"} overflow-y-auto`}>
        <div className={`flex flex-col items-center px-4 py-8 ${!hasSearched ? 'h-full justify-center' : ''}`}>
          {/* Header with search bar - centered when no search, at top when search performed */}
          <div className="w-full max-w-4xl flex flex-col items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Explore {formattedSchoolName} Alumni Data
            </h1>

            <form onSubmit={handleSearch} className="w-full max-w-2xl mb-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Who are the alumni working in artificial intelligence at Google?"
                  className="w-full px-6 py-4 pr-12 text-lg text-gray-900 placeholder-gray-400 bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 shadow-lg"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </form>

            {/* Only show tags when no search has been performed */}
            {!hasSearched && (
              <>
                <style jsx>{tagScrollAnimation}</style>
                <div className="w-full max-w-2xl">
                  <div className="scrolling-tags-container">
                    <div className="scrolling-tags">
                      {/* First copy of tags */}
                      <div className="scrolling-tags-content">
                        {suggestionTags.map((tag, index) => (
                          <span 
                            key={`first-${index}`}
                            onClick={() => handleTagClick(tag)}
                            className="tag-item"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Second copy of tags for infinite loop effect */}
                      <div className="scrolling-tags-content">
                        {suggestionTags.map((tag, index) => (
                          <span 
                            key={`second-${index}`}
                            onClick={() => handleTagClick(tag)}
                            className="tag-item"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Content that appears only after searching */}
          {hasSearched && (
            <div className="w-full max-w-4xl flex flex-col gap-4">
              {/* Display loading message during search */}
              {isSearching && (
                <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-lg text-gray-700">Searching across our database of {totalAlumniCount} {formattedSchoolName} alumni profiles...</p>
                </div>
              )}
              
              {/* Analysis Section - Only show if there's content to display */}
              {!isSearching && (displayedText.analyzing || displayedText.searching || displayedText.profiling || displayedText.filters) && (
                <div className="w-full p-6 bg-gray-50 rounded-lg shadow-sm">
                  {/* Collapse/Expand Button */}
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-700">Search Analysis</h2>
                    <button 
                      onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
                      className="text-gray-500 hover:text-emerald-600 transition-colors"
                    >
                      {isAnalysisCollapsed ? 'Expand ▼' : 'Collapse ▲'}
                    </button>
                  </div>
                  
                  {/* Collapsible Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${isAnalysisCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                    {displayedText.analyzing && (
                      <p className="text-gray-700 mb-3">{displayedText.analyzing}</p>
                    )}
                    
                    {displayedText.searching && (
                      <p className="text-gray-700 mb-3">{displayedText.searching}</p>
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

              {/* Search Results Section - Only show after search is complete (no loading animation) */}
              {!isSearching && searchPhase === 'complete' && searchResults.length > 0 && (
                <div className="w-full">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Found {searchResults.length} alumni matching your search
                  </h2>
                  <div className="grid gap-4 overflow-y-auto max-h-[60vh]">
                    {searchResults.map((result, index) => {
                      const currentTitle = result.all_titles && Array.isArray(result.all_titles) && result.all_titles.length > 0 
                        ? result.all_titles[0] 
                        : result.current_title || "";
                      
                      return (
                        <a
                          key={result.id || index}
                          href={result.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center">
                            {/* Profile Image */}
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-4">
                              {result.profile_url ? (
                                <img 
                                  src={result.profile_url} 
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
                              
                              {/* Metadata in one row */}
                              <div className="flex flex-wrap items-center text-gray-600 mt-1">
                                <span>{currentTitle}</span>
                                {result.current_company && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span>{result.current_company}</span>
                                  </>
                                )}
                                {result.location && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span>{result.location}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Industry */}
                              <p className="text-gray-500 text-sm mt-1">Industry: {result.current_industry}</p>
                              
                              {/* Match percentage */}
                              <div className="mt-2">
                                <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full inline-block">
                                  Match: {(result.similarity * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* No results message */}
              {!isSearching && searchPhase === 'complete' && searchResults.length === 0 && searchQuery.trim() !== "" && (
                <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm">
                  <p className="text-gray-600">No alumni found matching your search. Try different keywords.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}