"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Loader2, Search, BrainCog } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import analytics from "../utils/analytics"
import { useOrganization } from "../contexts/OrganizationContext"

// Add  realistic question suggestion tags for learn mode
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
  const { tenant, isLoading: orgLoading, error: orgError } = useOrganization()
  /** The tenant name as the typewriter effect has revealed it so far. */
  const [typedName, setTypedName] = useState("")
  const { isSidebarOpen } = useSidebar()

  // Add these new states for the Learn mode
  const [conversations, setConversations] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Track page view when component mounts
  useEffect(() => {
    analytics.trackPageView('Learn');
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

  // Add handleLearnSubmit function to handle questions in learn mode
  const handleLearnSubmit = async (e: React.FormEvent, questionOverride?: string) => {
    e.preventDefault();
    
    const questionToUse = questionOverride || currentQuestion.trim();
    // The chat is scoped to a tenant. The page does not render without one.
    if (!questionToUse || !tenant) return;
    // Add the user's question to the conversation
    const userQuestion = questionToUse;
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
          organizationName: tenant.name,
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
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          {conversations.length === 0 ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
                Learn{typedName ? " " : ""}
                {typedName ? <span className="text-black">{typedName}</span> : null}
                {typedName ? " " : ""}
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
                {/* Rounded rectangle border container with glass effect background - starts below title */}
                <div 
                  className="fixed top-40 bottom-4 z-0 rounded-lg shadow-lg backdrop-blur-sm" 
                  style={{
                    left: '20%', 
                    right: '20%',
                    border: '1px solid black',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                  }}
                ></div>
                
                {/* Centered title - positioned between the vertical lines */}
                <div className="fixed top-16 z-10 pt-4" style={{left: '20%', right: '20%'}}>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
                    Learn{typedName ? " " : ""}
                    {typedName ? <span className="text-black">{typedName}</span> : null}
                    {typedName ? " " : ""}
                    Alumni
                  </h1>
                </div>
                
                {/* Conversation history container - Scrollable between vertical lines */}
                <div className="fixed left-[20%] right-[20%] top-44 bottom-20 overflow-y-auto">
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
                      className="flex-1 px-3 py-2 border-none text-black placeholder-gray-500 focus:outline-none focus:ring-0"
                      disabled={isProcessing}
                    />
                    
                    {/* Clear button with X icon */}
                    <button
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentQuestion('');
                        setConversations([]);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform transition-all duration-300 border border-gray-300 focus:outline-none"
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
                      className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-lg hover:bg-gray-800 transform transition-all duration-300 disabled:opacity-50 border border-gray-700 focus:outline-none"
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