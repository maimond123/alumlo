"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Loader2, Search } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { getUserEmail } from "../utils/auth"
import { useRouter } from "next/navigation"
import analytics from "../utils/analytics"
import { supabase } from "../data/supabase"
import { useLearnConversations } from "../../hooks/useLearnConversations"
import { useAuth } from "../../components/AuthProvider"
import { isDemoMode as checkIsDemoMode, getDemoOrganization, getDemoDisplayName, initDemoFromUrl } from "../utils/demo"

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
  const [mountTime] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [formattedOrganizationName, setFormattedOrganizationName] = useState("")
  const [displayOrganizationName, setDisplayOrganizationName] = useState("")
  const [displayedOrganizationName, setDisplayedOrganizationName] = useState("")
  const [isOrganizationNameReadyToAnimate, setIsOrganizationNameReadyToAnimate] = useState(false)
  const { isSidebarOpen } = useSidebar()
  
  // Add new state for demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false
  })

  // NEW: Auth context
  const { user: authUser, isAuthenticated: contextAuthenticated, isLoading: authLoading } = useAuth();

  // Sync local authState with context
  useEffect(() => {
    setAuthState({
      isLoading: authLoading,
      isAuthenticated: contextAuthenticated
    });
  }, [authLoading, contextAuthenticated]);

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
  
  // Load conversation ID from sessionStorage on mount
  useEffect(() => {
    const savedConversationId = sessionStorage.getItem('currentLearnConversationId');
    if (savedConversationId) {
      setCurrentConversationId(savedConversationId);
    }
  }, []);

  // Save conversation ID to sessionStorage whenever it changes
  useEffect(() => {
    if (currentConversationId) {
      sessionStorage.setItem('currentLearnConversationId', currentConversationId);
    } else {
      sessionStorage.removeItem('currentLearnConversationId');
    }
  }, [currentConversationId]);

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
    // Debounce rapid auth checks
    const timeoutId = setTimeout(() => {
      const checkAuth = async () => {
        try {
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

            const visitorId = analytics.getVisitorId()
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

          if (authLoading) {
            return;
          }

          // Don't redirect immediately after mount to allow auth to stabilize
          const timeSinceMount = Date.now() - mountTime
          if (timeSinceMount < 300) {
            console.log('[DEBUG] Learn: Too soon after mount, waiting for auth to stabilize...', { timeSinceMount })
            return
          }

          if (!contextAuthenticated) {
            setAuthState({ isLoading: false, isAuthenticated: false })
            router.push("/signin")
            return
          }

          // For authenticated real users, proceed with normal flow
          console.log("[DEBUG] Learn: Real user authenticated")

          // Set auth state after handling demo mode check
          setAuthState({
            isLoading: false,
            isAuthenticated: contextAuthenticated
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

  // Only fetch school name for non-demo users
  useEffect(() => {
    if (authState.isAuthenticated && !isDemoMode) {
      console.log("Learn: User authenticated, fetching data...")
      const fetchSchoolName = async () => {
        try {
          const userEmail = await getUserEmail()

          if (!userEmail) {
            console.error("No email found in user data:", userEmail)
            throw new Error("No user email found")
          }

          const { data, error } = await supabase
            .from("customer_information")
            .select("organization_name")
            .eq("organization_email", userEmail)
            .single()

          if (error) {
            console.error("Supabase query error:", error)
            throw error
          }

          const formatted = data.organization_name
            .replace(/_/g, " ")
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
          setFormattedOrganizationName(formatted)
          setDisplayOrganizationName(formatted) // Use same name for display for real users

          // Introduce a short delay before signaling animation readiness
          setTimeout(() => {
            setIsOrganizationNameReadyToAnimate(true)
          }, 100) // 100ms delay

          setIsLoading(false)
        } catch (err: any) {
          if (err.message?.includes("not authenticated")) {
            router.push("/signin")
            return
          }
          setError("Failed to load school data")
          setIsLoading(false)
        }
      }

      fetchSchoolName()
    } else if (isDemoMode) {
      // If in demo mode, ensure loading is complete
      setIsLoading(false)
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
              // For demo users, we already identinted them in the checkAuth function
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

  // Add handleLearnSubmit function to handle questions in learn mode
  const handleLearnSubmit = async (e: React.FormEvent, questionOverride?: string) => {
    e.preventDefault();
    
    const questionToUse = questionOverride || currentQuestion.trim();
    if (!questionToUse) return;
    
    // Add the user's question to the conversation
    const userQuestion = questionToUse;
    setConversations(prev => [...prev, { role: 'user', content: userQuestion }]);
    setCurrentQuestion('');
    setIsProcessing(true);
    
    // Track the question in analytics
    analytics.trackLearnModeQuestion(userQuestion);
    
    // Create conversation only if this is truly the first message (no existing conversations) and not in demo mode
    let conversationId = currentConversationId;
    if (!conversationId && conversations.length === 0 && !isDemoMode) {
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
          organizationName: formattedOrganizationName || "Your School",
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
      
      // Remove the typewriter effect - just add the response directly
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
    
    // Set the question in the input (for visual feedback)
    setCurrentQuestion(question);
    
    // Create a proper synthetic event for the form submission
    const fakeEvent = {
      preventDefault: () => {},
      target: { value: question },
      currentTarget: { value: question }
    } as unknown as React.FormEvent;
    
    // Immediately call the submit function with the question directly
    handleLearnSubmit(fakeEvent, question);
  };

  // Add a function to scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentAnswer]);

  // Refined Typewriter effect for school name (matches dashboard)
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
    <div className="flex h-full bg-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          {conversations.length === 0 ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
                Learn
                {/* Conditional space, only if school name will be rendered */}
                {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
                {isOrganizationNameReadyToAnimate && displayedOrganizationName ? (
                  <span className="text-black">{displayedOrganizationName}</span>
                ) : null}
                {/* Conditional space, only if school name was rendered */}
                {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
                Alumni
              </h1>

              {/* Learn mode interface */}
              <form onSubmit={(e) => handleLearnSubmit(e)} className="w-full max-w-2xl mb-2">
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
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentQuestion('');
                        setConversations([]);
                        setCurrentConversationId(null);
                        sessionStorage.removeItem('currentLearnConversationId');
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
                      type="submit"
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
                            onClick={(e) => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                        :
                        learnSuggestionTags.map((question, index) => (
                          <span 
                            key={`first-learn-${index}`}
                            onClick={(e) => handleTagClick(question)}
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
                            onClick={(e) => handleTagClick(question)}
                            className="tag-item"
                          >
                            {question}
                          </span>
                        ))
                        :
                        learnSuggestionTags.map((question, index) => (
                          <span 
                            key={`second-learn-${index}`}
                            onClick={(e) => handleTagClick(question)}
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
              {/* Conversation view with rounded rectangle border */}
              <div className="w-full h-full relative">
                {/* Rounded rectangle border container - only left and right sides visible */}
                <div 
                  className="fixed top-4 bottom-4 z-0 rounded-lg shadow-lg" 
                  style={{
                    left: '20%', 
                    right: '20%',
                    border: '1px solid #9CA3AF',
                    borderTop: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                  }}
                ></div>
                
                {/* Centered title - positioned between the vertical lines */}
                <div className="fixed top-16 z-10 pt-4" style={{left: '20%', right: '20%'}}>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
                    Learn
                    {/* Conditional space, only if school name will be rendered */}
                    {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
                    {isOrganizationNameReadyToAnimate && displayedOrganizationName ? (
                      <span className="text-black">{displayedOrganizationName}</span>
                    ) : null}
                    {/* Conditional space, only if school name was rendered */}
                    {isOrganizationNameReadyToAnimate && displayedOrganizationName ? " " : ""}
                    Alumni
                  </h1>
                </div>
                
                {/* Horizontal line between title and conversations - matching border style */}
                <div className="fixed top-36 z-10" style={{left: '20%', right: '20%', height: '1px', backgroundColor: '#9CA3AF'}}></div>
                
                {/* Conversation history container - Scrollable between vertical lines */}
                <div className="fixed left-[20%] right-[20%] top-40 bottom-20 overflow-y-auto">
                  {/* Conversation messages container - full width between lines with proper centering */}
                  <div className="space-y-4 px-4 py-4">
                    {conversations.map((msg, idx) => (
                      <div key={idx} className={`mb-4 w-full ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                        <div 
                          className={`p-3 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-golden-yellow/30 text-gray-900 max-w-[80%]' 
                              : 'bg-green-800/10 text-gray-700 max-w-[80%]'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show the in-progress answer */}
                    {currentAnswer && (
                      <div className="mb-4 w-full flex justify-start">
                        <div className="p-3 rounded-lg bg-green-800/10 text-gray-700 max-w-[80%]">
                          {currentAnswer}
                        </div>
                      </div>
                    )}
                    
                    {/* Show typing indicator when processing */}
                    {isProcessing && !currentAnswer && (
                      <div className="mb-4 w-full flex justify-start">
                        <div className="p-3 rounded-lg bg-green-800/10 text-gray-700 max-w-[80%]">
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
              </div>

              {/* Integrated input form at bottom - full width between lines */}
              <div className="fixed bottom-0 left-[20%] right-[20%] p-4 z-20">
                <form onSubmit={(e) => handleLearnSubmit(e)} className="w-full">
                  <div className="flex gap-2 border border-black rounded-lg p-2 bg-white shadow-sm">
                    <input
                      type="text"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLearnSubmit(e)}
                      placeholder="Ask about your alumni data..."
                      className="flex-1 px-3 py-2 border-none text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-forest-green-500"
                      disabled={isProcessing}
                    />
                    
                    {/* Clear button with X icon */}
                    <button
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentQuestion('');
                        setConversations([]);
                        setCurrentConversationId(null);
                        sessionStorage.removeItem('currentLearnConversationId');
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform transition-all duration-300 border border-gray-300"
                      aria-label="Clear"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    {/* Send button with up arrow icon */}
                    <button
                      type="submit"
                      disabled={isProcessing || !currentQuestion.trim()}
                      className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-lg hover:bg-gray-800 transform transition-all duration-300 disabled:opacity-50 border border-gray-700"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
} 