"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Loader2, Search } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { getUserEmail, isAuthenticated } from "../utils/auth"
import { useRouter } from "next/navigation"
import analytics from "../utils/analytics"
import { supabase } from "../data/supabase"
import { useLearnConversations } from "../../hooks/useLearnConversations"

// Add realistic question suggestion tags for learn mode
const learnSuggestionTags = [
  "What's the average salary of our alumni?",
  "How do our alumni compare to the general population?",
  "What industries are our alumni working in?",
  "How many of our alumni have founded companies?",
  "What are the career progression patterns of our alumni?",
  "What percentage of alumni reach executive positions?",
  "In which countries do our alumni work?",
  "How quickly do our alumni change jobs?",
  "What's the entrepreneurship success rate of our alumni?",
  "How can alumni data help with student recruitment?",
  "What's the average salary by industry?",
  "How do our alumni compare to the general population in terms of salary?",
  "What are the most common career paths?",
  "How many alumni work in technology?",
  "What percentage work in healthcare?",
  "How many alumni have advanced degrees?",
  "What's the retention rate in first jobs?",
  "How long do alumni stay at their first job?",
  "What skills are most valued by employers?",
  "How can we improve alumni outcomes?"
]

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

export default function LearnPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formattedSchoolName, setFormattedSchoolName] = useState("")
  const [displayedSchoolName, setDisplayedSchoolName] = useState("")
  const [isSchoolNameReadyToAnimate, setIsSchoolNameReadyToAnimate] = useState(false)
  const { isSidebarOpen } = useSidebar()
  
  // Add new state for demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false
  })

  // Add these new states for the Learn mode
  const [conversations, setConversations] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add conversation history hook
  const { 
    createConversation, 
    addMessage, 
    generateConversationTitle 
  } = useLearnConversations();
  
  // Add state for current conversation ID
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Add state for randomized tags
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  
  // Initialize randomized tags on component mount
  useEffect(() => {
    // Create a random starting position in the tag list
    const startIndex = Math.floor(Math.random() * learnSuggestionTags.length);
    
    // Rotate the array to start from that position
    const rotatedTags = [
      ...learnSuggestionTags.slice(startIndex),
      ...learnSuggestionTags.slice(0, startIndex)
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
      console.log("Learn: User authenticated, fetching data...")
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

  // Track page view when component mounts
  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated) {
      analytics.trackPageView('Learn');
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
    
    // Create conversation if this is the first message and not in demo mode
    let conversationId = currentConversationId;
    if (!conversationId && !isDemoMode) {
      const title = generateConversationTitle(userQuestion);
      conversationId = await createConversation({
        title,
        initialMessage: userQuestion
      });
      setCurrentConversationId(conversationId);
    }
    
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
      
      // Save assistant message to database if not in demo mode
      if (conversationId && !isDemoMode) {
        await addMessage({
          conversationId,
          role: 'assistant',
          content: responseText
        });
      }
      
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

  // Handle tag click
  const handleTagClick = async (question: string) => {
    console.log(`[DEBUG ${new Date().toISOString()}] Learn tag clicked with question: "${question}"`);
    
    // Track tag click
    analytics.trackTagClick(question);
    
    // Set the question first
    setCurrentQuestion(question);
    
    // Use setTimeout to ensure state update has completed
    setTimeout(() => {
      console.log(`[DEBUG ${new Date().toISOString()}] Executing learn submit after tag click for: "${question}"`);
      // Create a proper synthetic event
      const fakeEvent = {
        preventDefault: () => {},
        target: { value: question },
        currentTarget: { value: question }
      } as unknown as React.FormEvent;
      
      // Call the submit function
      handleLearnSubmit(fakeEvent);
    }, 50);
  };

  // Add a function to scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentAnswer]);

  useEffect(() => {
    if (formattedSchoolName) {
      setDisplayedSchoolName("");
      setIsSchoolNameReadyToAnimate(false);
      const delayTimer = setTimeout(() => {
        setIsSchoolNameReadyToAnimate(true);
        let i = 0;
        // Ensure the full string is iterated
        const schoolNameToAnimate = formattedSchoolName; 
        const typingInterval = setInterval(() => {
          if (i < schoolNameToAnimate.length) {
            setDisplayedSchoolName((prev) => prev + schoolNameToAnimate.charAt(i));
            i++;
          } else {
            clearInterval(typingInterval);
          }
        }, 70);
        return () => clearInterval(typingInterval);
      }, 500);
      return () => clearTimeout(delayTimer);
    }
  }, [formattedSchoolName]);

  if (authState.isLoading) {
    return <div>Loading authentication status...</div>
  }

  if (!authState.isAuthenticated) {
    return <div>Please log in to access the learn page. Error: {error}</div>
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
      <main className={`flex-1 relative transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className={`min-h-screen flex flex-col items-center px-4 ${
          (conversations.length === 0 && !currentQuestion && !currentAnswer) 
            ? 'justify-center' : 'pt-24'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Learn About Your{" "}
            {isSchoolNameReadyToAnimate && displayedSchoolName ? (
                isDemoMode ? (
                  <span 
                    className="text-black cursor-pointer hover:underline"
                  >
                    {displayedSchoolName}
                  </span>
                ) : (
                  <span className="text-black">{displayedSchoolName}</span>
                )
              ) : null}
            {" "}Alumni
          </h1>

          {/* Learn mode interface */}
          {conversations.length === 0 ? (
            <>
              <form onSubmit={handleLearnSubmit} className="w-full max-w-2xl mb-2">
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Ask about your alumni data (e.g., What's the average salary?)"
                    className="w-full px-6 pt-4 pb-14 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleLearnSubmit(e)}
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
                    
                    {/* Search/Send button */}
                    <button
                      onClick={(e) => handleLearnSubmit(e)}
                      disabled={isProcessing}
                      className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
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
                      {randomizedTags.length > 0 ? 
                        randomizedTags.map((question, index) => (
                          <span 
                            key={`first-learn-${index}`}
                            onClick={() => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                        :
                        learnSuggestionTags.map((question, index) => (
                          <span 
                            key={`first-learn-${index}`}
                            onClick={() => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                      }
                    </div>
                    
                    {/* Second copy of question suggestion tags for infinite scrolling */}
                    <div className="scrolling-tags-content">
                      {randomizedTags.length > 0 ? 
                        randomizedTags.map((question, index) => (
                          <span 
                            key={`second-learn-${index}`}
                            onClick={() => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                        :
                        learnSuggestionTags.map((question, index) => (
                          <span 
                            key={`second-learn-${index}`}
                            onClick={() => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                      }
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
                      <input
                        type="text"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="Ask about your alumni data (e.g., What's the average salary?)"
                        className="w-full px-6 pt-4 pb-14 text-lg text-gray-900 placeholder-gray-400 bg-white border border-black rounded-2xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-200 shadow-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleLearnSubmit(e)}
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
                        
                        {/* Search/Send button */}
                        <button
                          onClick={(e) => handleLearnSubmit(e)}
                          disabled={isProcessing}
                          className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg border border-black hover:bg-gray-100 transition-colors"
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
        </div>
      </main>
    </div>
  )
} 