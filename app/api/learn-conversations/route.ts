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
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeMessages = searchParams.get('includeMessages') === 'true';

    const { data: conversations, error } = await supabase
      .from('learn_conversations')
      .select(`
        *,
        message_count:learn_messages(count)
      `)
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Transform the data to include message count
    const conversationsWithCount = conversations?.map(conv => ({
      ...conv,
      message_count: conv.message_count?.[0]?.count || 0
    })) || [];

    // If includeMessages is true, fetch messages for each conversation
    if (includeMessages && conversations) {
      const conversationsWithMessages = await Promise.all(
        conversationsWithCount.map(async (conversation) => {
          const { data: messages, error: messagesError } = await supabase
            .from('learn_messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            return { ...conversation, messages: [] };
          }

          return {
            ...conversation,
            messages: messages || []
          };
        })
      );

      return NextResponse.json({ conversations: conversationsWithMessages });
    }

    return NextResponse.json({ conversations: conversationsWithCount });
  } catch (error) {
    console.error('Error in learn conversations API:', error);
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
    const { title, initialMessage } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('learn_conversations')
      .insert([{
        user_email: userEmail,
        title
      }])
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add initial message if provided
    if (initialMessage) {
      const { error: messageError } = await supabase
        .from('learn_messages')
        .insert([{
          conversation_id: conversation.id,
          role: 'user',
          content: initialMessage
        }]);

      if (messageError) {
        console.error('Error adding initial message:', messageError);
        return NextResponse.json({ error: 'Failed to add initial message' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      conversationId: conversation.id,
      conversation 
    });
  } catch (error) {
    console.error('Error in learn conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, title } = body;

    if (!conversationId || !title) {
      return NextResponse.json({ error: 'Conversation ID and title are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('learn_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in learn conversations API:', error);
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
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('learn_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in learn conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 