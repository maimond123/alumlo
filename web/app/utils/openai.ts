// Secure OpenAI client for frontend use
export async function callOpenAI(endpoint: string, params: any) {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          ...params,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'An error occurred');
      }
  
      return await response.json();
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }