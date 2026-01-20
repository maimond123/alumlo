import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../data/supabase';
import { getUserEmail } from '../../utils/auth';

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('learn_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_email', userEmail)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Load messages
    const { data: messages, error } = await supabase
      .from('learn_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in learn messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, role, content } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json({ 
        error: 'Conversation ID, role, and content are required' 
      }, { status: 400 });
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json({ error: 'Role must be either "user" or "assistant"' }, { status: 400 });
    }

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('learn_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_email', userEmail)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Add message
    const { data: message, error } = await supabase
      .from('learn_messages')
      .insert([{
        conversation_id: conversationId,
        role,
        content
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('learn_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation timestamp:', updateError);
      // Don't fail the request for this
    }

    return NextResponse.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('Error in learn messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get the message and verify ownership through conversation
    const { data: message, error: messageError } = await supabase
      .from('learn_messages')
      .select(`
        *,
        learn_conversations!inner(user_email)
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user owns the conversation
    if (message.learn_conversations.user_email !== userEmail) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the message
    const { error } = await supabase
      .from('learn_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in learn messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 