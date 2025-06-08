"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, LogOut, Bookmark, Search, Brain, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "../data/supabase"
import { getUserEmail } from "../utils/auth"
import { isDemoMode as checkIsDemoMode, clearDemoMode } from "../utils/demo"
import Sidebar from "../../components/Sidebar"
import { useAuth } from "../../components/AuthProvider"
import analytics from "../utils/analytics"

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
      
      // Auth state is the source of truth
      if (!isAuthLoading) {
        if (isAuthenticated && user?.email) {
          // User is authenticated.
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
          // Not authenticated, check for demo mode.
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

    if (!isAuthLoading) {
        loadUserData();
    }
}, [isAuthLoading, isAuthenticated, user, router]);

  const loadSavedLeads = async (organizationName: string) => {
    // For demo mode, we shouldn't fetch real data.
    if (organizationName === 'demo') {
        setSavedLeads([]);
        return;
    }
    const tableName = `${organizationName.toLowerCase().replace(/ /g, '_')}_alumni_saved_leads`;
    try {
      const { data, error } = await supabase
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
                    className={`