'use client'

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { useSchool } from "../app/contexts/SchoolContext"
import Link from "next/link"

interface SearchResult {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  current_general_industry: string;
  current_job_location: string;
  similarity: number;
  profile_url?: string;
  profile_photo_url?: string;
}

// Add these suggestion tags similar to dashboard/page.tsx
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
  "Marketing Directors in Los Angeles"
];

// Add this helper function for typewriter effect
const typewriterEffect = (text: string, setter: (text: string) => void, speed: number = 20): Promise<void> => {
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

export default function AlumniSearchDemo() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchPhase, setSearchPhase] = useState<'idle' | 'analyzing' | 'searching' | 'profiling' | 'filtering' | 'complete'>('idle')
  const [displayedText, setDisplayedText] = useState({
    analyzing: '',
    searching: '',
    profiling: '',
    filters: '',
    displaying: ''
  })
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { schoolName } = useSchool()
  const [error, setError] = useState<string | null>(null)
  
  // Add this for the scrolling animation
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  
  // Number of results to display initially
  const MAX_VISIBLE_RESULTS = 3
  
  // Use the same tag scrolling animation as in dashboard/page.tsx
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

  // Search limit tracking
  const [searchCount, setSearchCount] = useState(0)
  
  // Randomize tags on component mount
  useEffect(() => {
    // Shuffle the tags array
    const shuffled = [...suggestionTags].sort(() => 0.5 - Math.random());
    setRandomizedTags(shuffled);
  }, []);

  // Load the search count from localStorage on component mount
  useEffect(() => {
    const storedCount = localStorage.getItem('alumSearchCount')
    if (storedCount) {
      setSearchCount(parseInt(storedCount, 10))
    }
  }, [])

  // Update localStorage when searchCount changes
  useEffect(() => {
    localStorage.setItem('alumSearchCount', searchCount.toString())
  }, [searchCount])

  // Add state for the blinking cursor effect
  const [showCursor, setShowCursor] = useState(true);
  
  // Add effect for blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Blink every 530ms for a natural typing feel
    
    return () => clearInterval(cursorInterval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return
    
    // Check if user has reached the search limit
    if (searchCount >= 5) {
      // Redirect to signup page when trying to search past the limit
      window.location.href = '/signup';
      return;
    }
    
    // Increment search count
    setSearchCount(prevCount => prevCount + 1);
    
    // Store the current query to ensure consistency
    const currentQuery = searchQuery.trim();
    
    // Clear previous search results and reset state
    setSearchResults([]);
    setIsSearching(true);
    setSearchPhase('analyzing');
    
    // Reset displayed text
    setDisplayedText({
      analyzing: '',
      searching: '',
      profiling: '',
      filters: '',
      displaying: ''
    });
    
    // Start the actual search request immediately in parallel with animations
    const searchPromise = fetch('/api/search-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: currentQuery }),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    });
    
    // Start the AI animation sequence
    try {
      // Phase 1: Analyzing query
      await typewriterEffect(`Analyzing your search query: "${currentQuery}"`, 
        (text) => setDisplayedText(prev => ({ ...prev, analyzing: text }))
      );
      
      // Phase 3: Profiling
      setSearchPhase('profiling');
      await typewriterEffect('Creating alumni profiles based on your search...', 
        (text) => setDisplayedText(prev => ({ ...prev, profiling: text }))
      );
      
      // Phase 4: Filtering
      setSearchPhase('filtering');
      await typewriterEffect('Applying filters: Industry, Location, Experience', 
        (text) => setDisplayedText(prev => ({ ...prev, filters: text }))
      );
      
      // Get search results that were fetching in parallel
      const data = await searchPromise;
      const results = data.results || [];
      
      // Phase 5: Display results
      setSearchPhase('complete');
      await typewriterEffect(`Displaying top ${Math.min(3, results.length)} personalized results...`, 
        (text) => setDisplayedText(prev => ({ ...prev, displaying: text }))
      );
      
      // Make sure to set the search results
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
    // Trigger search immediately after setting the query
    // We need to use setTimeout to ensure the searchQuery state is updated before searching
    setTimeout(() => handleSearch(), 0)
  }
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [])

  const isSearchingPhase = searchPhase !== 'idle' && searchPhase !== 'complete';
  
  return (
    <div id="alumni-search-demo" className="w-full max-w-4xl mx-auto">
      {/* Add the style tag for animations */}
      <style jsx>{tagScrollAnimation}</style>
      
      {/* Add style for blinking cursor */}
      <style jsx>{`
        .cursor-blink::before {
          content: '|';
          color: #000;
          animation: blink 1.06s infinite step-end;
          margin-right: 2px;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .search-input::placeholder {
          color: #9CA3AF; /* Set a visible color for the placeholder */
        }
      `}</style>
      
      {/* Search Limit Indicator */}
      <div className="mb-4">
        <div className="text-base font-medium text-gray-700">
          {searchCount < 5 ? (
            <>Search limit: {searchCount}/5 free searches</>
          ) : (
            <span className="text-emerald-600">Search limit reached. <Link href="/signup" className="underline hover:text-emerald-700">Sign up</Link> for unlimited searches.</span>
          )}
        </div>
      </div>
      
      {/* Search Input with properly aligned placeholder */}
      <div className="relative mb-10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-full px-6 pt-4 pb-14 text-lg text-gray-900 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Start typing to search any query..."
        />
        
        {/* Buttons inside the input field */}
        <div className="absolute bottom-3 right-4 flex space-x-2">
          {/* Refresh button */}
          <button
            type="button" 
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
              setSearchPhase('idle')
              setError(null)
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
            onClick={handleSearch}
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

      {/* Remove Sign Up Prompt Modal completely */}

      {/* Search Limit Reached Message - Display this instead of results when limit is reached */}
      {!isSearching && searchCount >= 5 && searchPhase === 'idle' && (
        <div className="w-full p-6 bg-emerald-50 rounded-lg border border-emerald-200 mb-10">
          <h3 className="text-xl font-semibold text-emerald-800 mb-3">Ready to unlock full access?</h3>
          <p className="text-gray-700 mb-4">
            You've used all your free searches. Sign up now to get unlimited searches and access to all alumni data.
          </p>
          <Link 
            href="/signup"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Sign Up Now
          </Link>
        </div>
      )}

      {/* Scrolling Suggestion Tags - Updated to match dashboard/page.tsx */}
      <div className="mb-14 mt-10">
        <h3 className="text-lg font-medium text-gray-700 mb-6">Try searching for:</h3>
        <div className="scrolling-tags-container">
          <div className="scrolling-tags">
            {/* First set of tags */}
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

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-10 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Search Status */}
      {isSearching && (
        <div className="w-full p-6 bg-gray-50 rounded-lg shadow-sm mb-10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-black">Search Analysis</h2>
          </div>
          
          <div className="space-y-4">
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
                <p className="text-gray-700 mb-3">{displayedText.filters}</p>
              </>
            )}
            
            {displayedText.displaying && (
              <p className="text-gray-700 mt-4">{displayedText.displaying}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Search Results */}
      {!isSearching && searchPhase === 'complete' && searchResults.length > 0 && (
        <div className="w-full mb-10">
          <h2 className="text-xl font-semibold mb-6 text-black">
            Found {searchResults.length} alumni matching your search
          </h2>
          <div className="grid gap-6">
            {/* Only display the first 3 results */}
            {searchResults.slice(0, MAX_VISIBLE_RESULTS).map((result, index) => {
              const currentTitle = result.current_title || "";
              
              return (
                <a
                  key={result.id || index}
                  href={result.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-white border border-black rounded-lg hover:shadow-lg transition-shadow"
                >
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
                      <div className="mt-2">
                        <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full inline-block">
                          Match: #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          
          {/* View More button - only show if there are more than MAX_VISIBLE_RESULTS */}
          {searchResults.length > MAX_VISIBLE_RESULTS && (
            <div className="mt-10 text-center">
              <a 
                href="/signup" 
                className="inline-block px-4 py-2 bg-white text-black border border-black rounded-full hover:bg-emerald-100 hover:text-white hover:border-emerald-600 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                View More
              </a>
            </div>
          )}
        </div>
      )}
      
      {/* No Results Message */}
      {!isSearching && searchPhase === 'complete' && searchResults.length === 0 && (
        <div className="w-full p-6 bg-gray-50 rounded-lg text-center mb-10">
          <p className="text-gray-700">No alumni found matching your search criteria.</p>
          <p className="text-gray-500 mt-2">Try broadening your search or using different keywords.</p>
        </div>
      )}
    </div>
  )
} 