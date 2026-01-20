import { useState } from 'react';
import { supabase } from '../app/data/supabase';
import { getUserEmail } from '../app/utils/auth';

export interface LearnMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface LearnConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface CreateConversationRequest {
  title: string;
  initialMessage?: string;
}

export interface AddMessageRequest {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
}

export const useLearnConversations = () => {
  const [conversations, setConversations] = useState<LearnConversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<LearnMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createConversation = async (request: CreateConversationRequest): Promise<string | null> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      // Create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('learn_conversations')
        .insert([{
          user_email: userEmail,
          title: request.title
        }])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add initial message if provided
      if (request.initialMessage) {
        const { error: messageError } = await supabase
          .from('learn_messages')
          .insert([{
            conversation_id: conversation.id,
            role: 'user',
            content: request.initialMessage
          }]);

        if (messageError) throw messageError;
      }

      // Update local state
      await loadConversations();
      
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const addMessage = async (request: AddMessageRequest): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('learn_messages')
        .insert([{
          conversation_id: request.conversationId,
          role: request.role,
          content: request.content
        }]);

      if (error) throw error;

      // Update conversation's updated_at timestamp
      const { error: updateError } = await supabase
        .from('learn_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', request.conversationId);

      if (updateError) throw updateError;

      // If we're viewing this conversation, update the messages
      if (currentMessages.length > 0 && currentMessages[0]?.conversation_id === request.conversationId) {
        await loadMessages(request.conversationId);
      }

      // Update conversations list
      await loadConversations();
      
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  };

  const loadConversations = async (limit: number = 20): Promise<void> => {
    try {
      setIsLoading(true);
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('learn_conversations')
        .select(`
          *,
          message_count:learn_messages(count)
        `)
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform the data to include message count
      const conversationsWithCount = data?.map(conv => ({
        ...conv,
        message_count: conv.message_count?.[0]?.count || 0
      })) || [];

      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      // Verify user owns this conversation
      const { data: conversation, error: convError } = await supabase
        .from('learn_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_email', userEmail)
        .single();

      if (convError || !conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Load messages
      const { data, error } = await supabase
        .from('learn_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCurrentMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setCurrentMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string): Promise<boolean> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('learn_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_email', userEmail);

      if (error) throw error;

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, title } : conv
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  };

  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const userEmail = await getUserEmail();
      if (!userEmail) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('learn_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_email', userEmail);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear current messages if we're viewing this conversation
      if (currentMessages.length > 0 && currentMessages[0]?.conversation_id === conversationId) {
        setCurrentMessages([]);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  };

  const generateConversationTitle = (firstMessage: string): string => {
    // Generate a title from the first message (first 50 characters)
    const title = firstMessage.trim().substring(0, 50);
    return title.length < firstMessage.trim().length ? title + '...' : title;
  };

  return {
    conversations,
    currentMessages,
    isLoading,
    createConversation,
    addMessage,
    loadConversations,
    loadMessages,
    updateConversationTitle,
    deleteConversation,
    generateConversationTitle
  };
}; 