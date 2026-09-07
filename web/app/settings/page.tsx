"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, LogOut, Bookmark, Search, Brain, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "../data/supabase"
import { getUserEmail } from "../utils/auth"
import { isDemoMode as checkIsDemoMode, clearDemoMode } from "../utils/demo"
import { useAuth } from "../../components/AuthProvider"

interface SavedLead {
  id: string;
  name: string;
  current_position: string;
  current_company: string;
  linkedin_url: string;
  saved_at: string;
}

interface SearchHistory {
  id: string;
  query: string;
  created_at: string;
}

interface LearnConversation {
  id: string;
  title: string;
  updated_at: string;
}

interface UserInfo {
  first_name: string;
  last_name: string;
  organization_name: string;
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [learnConversations, setLearnConversations] = useState<LearnConversation[]>([])

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      
      if (!isAuthLoading) {
        if (isAuthenticated && user?.email) {
          setIsDemoMode(false);
          const userEmail = user.email;
          setEmail(userEmail);

          try {
            const { data, error } = await supabase
              .from('customer_information')
              .select('first_name, last_name, organization_name')
              .eq('organization_email', userEmail)
              .single();

            if (error) throw error;
            
            if (data) {
              setUserInfo(data);
              await Promise.all([
                loadSavedLeads(data.organization_name),
                loadSearchHistory(userEmail),
                loadLearnConversations(userEmail)
              ]);
            }
          } catch (error) {
            console.error('Error loading user data:', error);
          } finally {
            setIsLoading(false);
          }
        } else {
          if (checkIsDemoMode()) {
            setIsDemoMode(true);
            setUserInfo({
              first_name: "Demo",
              last_name: "Account",
              organization_name: "Your Organization"
            });
            setSavedLeads([]);
            setSearchHistory([]);
            setLearnConversations([]);
            setIsLoading(false);
          } else {
            router.push('/signin');
          }
        }
      }
    };

    loadUserData();
}, [isAuthLoading, isAuthenticated, user, router]);

  const loadSavedLeads = async (organizationName: string) => {
    if (organizationName === 'demo') {
        setSavedLeads([]);
        return;
    }
    const schemaName = organizationName.toLowerCase().replace(/ /g, '_');
    const tableName = `${organizationName.toLowerCase().replace(/ /g, '_')}_alumni_saved_leads`;
    try {
      const { data, error } = await supabase
        .schema(schemaName)
        .from(tableName)
        .select('*')
        .order('saved_at', { ascending: false });
      if (error) throw error;
      setSavedLeads(data || []);
    } catch (error) {
      console.error('Error loading saved leads:', error);
      setSavedLeads([]);
    }
  };

  const loadSearchHistory = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, created_at')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  };

  const loadLearnConversations = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('learn_conversations')
        .select('id, title, updated_at')
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLearnConversations(data || []);
    } catch (error) {
      console.error('Error loading learn conversations:', error);
      setLearnConversations([]);
    }
  };

  const handleSignOut = async () => {
    clearDemoMode();
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  };

  const formatOrganizationName = (name: string): string => {
    if (!name) return "";
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                {isDemoMode ? "Demo Account • Your Organization" : userInfo ? `${userInfo.first_name} ${userInfo.last_name} • ${formatOrganizationName(userInfo.organization_name)}` : ''}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Saved Leads Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Bookmark className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Saved Leads</h2>
                  <p className="text-sm text-gray-500">{savedLeads.length} leads saved</p>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {savedLeads.length > 0 ? (
                savedLeads.map((lead, index) => (
                  <div
                    key={lead.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                      index !== savedLeads.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{lead.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {lead.current_position} at {lead.current_company}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Saved {formatTime(lead.saved_at)}
                        </p>
                      </div>
                      {lead.linkedin_url && (
                        <button
                          onClick={() => window.open(lead.linkedin_url, '_blank')}
                          className="w-8 h-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                          title="View LinkedIn Profile"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No saved leads yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Search History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Search className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search History</h2>
                  <p className="text-sm text-gray-500">{searchHistory.length} searches</p>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searchHistory.length > 0 ? (
                searchHistory.map((search, index) => (
                  <div
                    key={search.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                      index !== searchHistory.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{search.query}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(search.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No search history yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Learn Conversations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden lg:col-span-2"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Brain className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Learn Conversations</h2>
                  <p className="text-sm text-gray-500">{learnConversations.length} conversations</p>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {learnConversations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {learnConversations.map((conversation, index) => (
                    <div
                      key={conversation.id}
                      className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        index % 2 === 0 ? 'md:border-r border-gray-100' : ''
                      } ${
                        index < learnConversations.length - 2 ? 'border-b border-gray-100' : ''
                      } ${
                        index === learnConversations.length - 1 && learnConversations.length % 2 === 1 ? 'md:border-b-0' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{conversation.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(conversation.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sign Out Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-8 py-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl border border-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}