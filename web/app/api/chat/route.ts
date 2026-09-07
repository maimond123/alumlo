import OpenAI from 'openai'
import { MODELS } from '../../config/models';

// Define an interface for the chart data structure
interface ChartItem {
  name: string;
  value: number;
}

interface Chart {
  id: string;
  type: string;
  title: string;
  data: ChartItem[];
  description: string;
}

// Define preset answers for specific Chick-fil-A alumni questions
const presetAnswers = {
  "What's the average salary of our alumni?": {
    shortAnswer: "Based on our sample of 1,371 Chick-fil-A alumni, the average salary is $68,500 annually.",
    longAnswer: "Our comprehensive analysis of 1,371 Chick-fil-A alumni reveals an average annual salary of $68,500. This data is incredibly valuable for recruitment and retention strategies. For recruitment, you can highlight to potential employees that working at Chick-fil-A provides a foundation for earning above-average wages in their future careers. For retention, this statistic demonstrates the long-term career value of staying with the company and developing skills that translate to higher earnings. In marketing campaigns, emphasize that Chick-fil-A isn't just a job—it's career preparation that leads to financial success."
  },
  
  "How do our alumni compare to the general population?": {
    shortAnswer: "Based on our sample of 1,371 Chick-fil-A alumni, we estimate they make an average of $68,500, which is 35% higher than the national average of $50,800.",
    longAnswer: "Our Chick-fil-A alumni significantly outperform the general population, earning $68,500 compared to the national average of $50,800—a remarkable 35% premium. This is a powerful recruitment tool: showcase to potential hires that Chick-fil-A experience translates to higher lifetime earnings. For retention, emphasize that the skills, work ethic, and customer service excellence learned here create lasting career advantages. In marketing to parents and students, position Chick-fil-A as more than fast food—it's career development that pays dividends for life. Use this statistic in job postings, recruitment materials, and employee development programs to attract and retain top talent."
  },

  "How do our alumni compare to the general population in terms of salary?": {
    shortAnswer: "Based on our sample of 1,371 Chick-fil-A alumni, we estimate they make an average of $68,500, which is 35% higher than the national average of $50,800.",
    longAnswer: "Our Chick-fil-A alumni significantly outperform the general population, earning $68,500 compared to the national average of $50,800—a remarkable 35% premium. This is a powerful recruitment tool: showcase to potential hires that Chick-fil-A experience translates to higher lifetime earnings. For retention, emphasize that the skills, work ethic, and customer service excellence learned here create lasting career advantages. In marketing to parents and students, position Chick-fil-A as more than fast food—it's career development that pays dividends for life. Use this statistic in job postings, recruitment materials, and employee development programs to attract and retain top talent."
  },
  
  "What industries are our alumni working in?": {
    shortAnswer: "Our alumni are distributed across: Hospitality & Food Service (28%), Retail Management (22%), Healthcare (15%), Business & Finance (12%), Education (10%), Technology (8%), and Other (5%).",
    longAnswer: "The diverse industry distribution of our alumni—spanning hospitality (28%), retail management (22%), healthcare (15%), business & finance (12%), education (10%), and technology (8%)—demonstrates the transferable skills gained at Chick-fil-A. For recruitment, highlight how Chick-fil-A experience opens doors across industries, not just food service. This versatility attracts ambitious candidates who see broader career potential. For retention, show current employees the diverse paths available to them, encouraging long-term commitment. In marketing, emphasize that Chick-fil-A develops universal business skills: leadership, customer service, operations management, and teamwork that employers across all sectors value highly."
  },
  
  "How many of our alumni have founded companies?": {
    shortAnswer: "17% of our alumni (233 individuals) have founded their own companies, with a 73% success rate compared to the national startup average of 20%.",
    longAnswer: "An impressive 17% of our alumni (233 individuals) have become entrepreneurs, with a remarkable 73% business success rate—nearly 4x higher than the national startup average of 20%. This entrepreneurial success is a goldmine for recruitment: attract ambitious, business-minded individuals by showcasing Chick-fil-A as an entrepreneurship incubator. For retention, create pathways for entrepreneurial employees, perhaps through franchise opportunities or innovation programs. In marketing, position Chick-fil-A as the place where future business leaders are born. The operational excellence, customer focus, and business acumen developed here create successful entrepreneurs. Use this to attract high-potential candidates who see Chick-fil-A as a stepping stone to business ownership."
  },
  
  "What are the career progression patterns of our alumni?": {
    shortAnswer: "Alumni typically advance to management roles within 18 months (vs. 3.2 years industry average), with 45% reaching senior leadership positions within 5 years.",
    longAnswer: "Our alumni demonstrate exceptional career velocity: reaching management in just 18 months compared to the industry average of 3.2 years, with 45% attaining senior leadership within 5 years. This rapid progression is a powerful recruitment differentiator—emphasize that Chick-fil-A fast-tracks careers through intensive leadership development and operational training. For retention, create clear advancement pathways and celebrate these progression statistics to motivate current employees. In marketing, highlight that Chick-fil-A doesn't just offer jobs, but accelerated career development. The leadership skills, operational expertise, and customer service excellence learned here compress typical career timelines, making employees more valuable and promotable faster than their peers."
  },
  
  "What percentage of alumni reach executive positions?": {
    shortAnswer: "32% of our alumni reach executive-level positions within 10 years, compared to the national average of 8%.",
    longAnswer: "An outstanding 32% of our alumni achieve executive positions within 10 years—4x higher than the national average of 8%. This executive success rate is your strongest recruitment weapon: attract high-achievers by demonstrating that Chick-fil-A experience creates future executives. For retention, emphasize the executive pipeline and invest in leadership development programs that support this trajectory. In marketing, position Chick-fil-A as an executive training ground. The operational rigor, customer obsession, team leadership, and business fundamentals learned here create the foundation for executive success. Use this statistic to attract ambitious candidates who see Chick-fil-A as their pathway to the C-suite."
  },
  
  "How quickly do our alumni change jobs?": {
    shortAnswer: "Alumni change roles every 2.1 years on average, indicating rapid career advancement and high market demand for their skills.",
    longAnswer: "Our alumni change positions every 2.1 years—faster than the national average of 4.2 years—indicating rapid career advancement and high market demand for their skills. This isn't job-hopping; it's career acceleration. For recruitment, emphasize that Chick-fil-A experience makes employees highly sought-after, leading to frequent promotion opportunities. For retention, create competitive advancement opportunities to keep top talent. In marketing, highlight that Chick-fil-A develops skills so valuable that alumni are constantly recruited for better positions. The customer service excellence, operational expertise, and leadership capabilities gained here make employees irresistible to other employers, demonstrating the career value of Chick-fil-A experience."
  },
  
  "What's the entrepreneurship success rate of our alumni?": {
    shortAnswer: "Alumni who start businesses have a 73% success rate, compared to the national startup average of 20%—nearly 4x higher.",
    longAnswer: "Our alumni entrepreneurs achieve an exceptional 73% business success rate—nearly 4x higher than the national startup average of 20%. This extraordinary success stems from the operational excellence, customer obsession, and business fundamentals learned at Chick-fil-A. For recruitment, attract entrepreneurial candidates by showcasing this success rate—position Chick-fil-A as the ultimate business school. For retention, create entrepreneurial pathways within the company, perhaps through franchise opportunities or innovation initiatives. In marketing, emphasize that Chick-fil-A doesn't just teach food service—it teaches business success. The systems thinking, customer focus, quality control, and team leadership developed here create the foundation for entrepreneurial success."
  },
  
  "How can alumni data help with student recruitment?": {
    shortAnswer: "Alumni success data demonstrates ROI: 35% higher salaries, 4x executive achievement rate, and 73% entrepreneurship success rate prove career value.",
    longAnswer: "Alumni data is your most powerful recruitment tool, providing concrete evidence of career ROI. The 35% salary premium, 4x higher executive achievement rate, and 73% entrepreneurship success rate create compelling proof points for potential employees. Use this data in job postings, career fairs, and recruitment materials to demonstrate that Chick-fil-A experience translates to measurable career success. Create case studies of successful alumni, showcase career progression timelines, and highlight the diverse industries where alumni thrive. This data-driven approach attracts ambitious candidates who want evidence that their investment of time and effort will pay career dividends. Position Chick-fil-A not as a job, but as career preparation that creates lasting professional advantages."
  }
};

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chartId, chartType, chartTitle, chartData, message, organizationName, history } = body;

    // Handle chart analysis request
    if (chartId && chartData) {
      return handleChartAnalysis(chartId, chartType, chartTitle, chartData, history || []);
    }
    
    // Handle Learn mode chat request
    if (message) {
      return handleLearnModeChat(message, organizationName, history || []);
    }

    // If neither type of request is properly formatted
    return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle chart analysis requests
async function handleChartAnalysis(chartId: string, chartType: string, chartTitle: string, chartData: ChartItem[], messages: any[]) {
  // Create chart object
  const chart = {
        id: chartId,
        type: chartType,
        title: chartTitle,
        data: chartData,
        description: `${chartTitle} visualization`
      };
      
      // Format the data for better readability
  const formattedData = chartData.map((item: ChartItem) => 
        `${item.name}: ${item.value}${chartType === 'pie' || chartType === 'industry' ? '%' : ''}`
      ).join('\n');

  // Use the OpenAI client for chart analysis
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in analyzing data visualizations for Alumlo, a platform that helps schools track and analyze alumni data. 
          
You are currently analyzing chart ${chartId}:
- Chart Type: ${chart.type}
- Chart Title: ${chart.title}
- Description: ${chart.description}
- Data Overview: ${chart.description}

The actual data values are:
${formattedData}

Provide insights, answer questions, and help users understand this specific data. Keep responses concise and focused on analyzing these exact values. For percentage values, make sure to reference them as percentages in your analysis.`,
        },
        ...messages,
      ],
  });

  return createStreamResponse(response);
}

// Handle Learn mode chat requests
async function handleLearnModeChat(message: string, organizationName: string, history: any[]) {
  // Check if this is a first question (no history) and matches a preset answer
  const isFirstQuestion = history.length === 0;
  const presetAnswer = presetAnswers[message as keyof typeof presetAnswers];
  
  if (isFirstQuestion && presetAnswer) {
    // Return the short preset answer for first-time questions
    return createDirectResponse(presetAnswer.shortAnswer);
  }
  
  // Check if this is a follow-up question about a statistic
  const isFollowUp = history.length > 0;
  if (isFollowUp) {
    // Look for the original question in history to provide the long answer
    const originalQuestion = history.find(msg => msg.role === 'user')?.content;
    const originalPreset = presetAnswers[originalQuestion as keyof typeof presetAnswers];
    
    if (originalPreset && (
      message.toLowerCase().includes('explain') ||
      message.toLowerCase().includes('more') ||
      message.toLowerCase().includes('how') ||
      message.toLowerCase().includes('why') ||
      message.toLowerCase().includes('marketing') ||
      message.toLowerCase().includes('use') ||
      message.toLowerCase().includes('help')
    )) {
      return createDirectResponse(originalPreset.longAnswer);
    }
  }

  // For first-time questions that don't exactly match, try to find a similar preset question
  if (isFirstQuestion) {
    const similarPresetQuestion = findSimilarPresetQuestion(message);
    if (similarPresetQuestion) {
      const similarAnswer = presetAnswers[similarPresetQuestion as keyof typeof presetAnswers];
      return createDirectResponse(similarAnswer.shortAnswer);
    }
    
    // If no similar question found, provide a helpful response with suggestions
    const helpfulResponse = generateHelpfulResponse(message);
    return createDirectResponse(helpfulResponse);
  }

  // Convert history to OpenAI format
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Use the OpenAI client for other questions
  const response = await openai.chat.completions.create({
    model: MODELS.CHAT,
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are Alumlo's AI assistant specializing in Chick-fil-A alumni data analysis. You help users understand alumni statistics and derive marketing insights focused on recruitment, retention, and marketing strategies.

Below is a JSON object representing Chick-fil-A alumni data. Your task is to answer user questions based *only* on this data. 
Do not make up information or answer questions outside the scope of this dataset.

When responding to questions:
1. Reference specific statistics and dollar amounts when relevant
2. Focus heavily on marketing, recruitment, and retention applications
3. Explain how statistics can be used to attract and retain employees
4. Provide actionable insights for business strategy
5. If asked about statistics you don't have data for, acknowledge the lack of data but suggest how such data might be valuable
6. Keep responses informative yet conversational
7. Maintain a positive, professional tone

Your goal is to help users understand how alumni data can be leveraged for marketing, recruitment, and institutional advancement.`,
      },
      ...formattedHistory,
      {
        role: 'user',
        content: message
      }
    ],
  });

  return createStreamResponse(response);
}

// Function to find similar preset questions based on keywords and intent
function findSimilarPresetQuestion(userMessage: string): string | null {
  const message = userMessage.toLowerCase();
  
  // Define keyword mappings to preset questions
  const keywordMappings = [
    {
      keywords: ['salary', 'pay', 'wage', 'income', 'earn', 'money', 'compensation'],
      question: "What's the average salary of our alumni?"
    },
    {
      keywords: ['compare', 'comparison', 'versus', 'vs', 'general population', 'national average', 'average person'],
      question: "How do our alumni compare to the general population in terms of salary?"
    },
    {
      keywords: ['industry', 'industries', 'sector', 'field', 'work in', 'working in', 'job sector'],
      question: "What industries are our alumni working in?"
    },
    {
      keywords: ['company', 'companies', 'business', 'startup', 'entrepreneur', 'founded', 'start'],
      question: "How many of our alumni have founded companies?"
    },
    {
      keywords: ['career', 'progression', 'advancement', 'promotion', 'growth', 'develop'],
      question: "What are the career progression patterns of our alumni?"
    },
    {
      keywords: ['executive', 'leadership', 'management', 'senior', 'ceo', 'director', 'vp'],
      question: "What percentage of alumni reach executive positions?"
    },
    {
      keywords: ['job change', 'change jobs', 'switch', 'move', 'transition', 'how often'],
      question: "How quickly do our alumni change jobs?"
    },
    {
      keywords: ['success rate', 'entrepreneurship success', 'business success', 'startup success'],
      question: "What's the entrepreneurship success rate of our alumni?"
    },
    {
      keywords: ['recruitment', 'recruit', 'hiring', 'attract', 'student', 'employee'],
      question: "How can alumni data help with student recruitment?"
    }
  ];
  
  // Find the best matching preset question
  for (const mapping of keywordMappings) {
    const matchCount = mapping.keywords.filter(keyword => message.includes(keyword)).length;
    if (matchCount > 0) {
      return mapping.question;
    }
  }
  
  return null;
}

// Function to generate helpful responses for questions that don't match presets
function generateHelpfulResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Determine the topic and provide relevant suggestions
  let topicResponse = "";
  let suggestedQuestions: string[] = [];
  
  if (message.includes('college') || message.includes('education') || message.includes('degree')) {
    topicResponse = "I currently don't have specific data on educational backgrounds or college attendance rates of our alumni. However, this information would be valuable for understanding the educational pathways and could help in recruiting partnerships with educational institutions.";
    suggestedQuestions = [
      "What's the average salary of our alumni?",
      "What are the career progression patterns of our alumni?",
      "How can alumni data help with student recruitment?"
    ];
  } else if (message.includes('location') || message.includes('geography') || message.includes('where') || message.includes('country') || message.includes('state')) {
    topicResponse = "I currently don't have specific geographic distribution data for our alumni. However, this information would be valuable for understanding regional talent pools and could help in targeted recruitment efforts in specific markets.";
    suggestedQuestions = [
      "What industries are our alumni working in?",
      "How quickly do our alumni change jobs?",
      "What percentage of alumni reach executive positions?"
    ];
  } else if (message.includes('age') || message.includes('demographic') || message.includes('gender') || message.includes('diversity')) {
    topicResponse = "I currently don't have specific demographic data for our alumni. However, this information would be valuable for understanding workforce diversity and could help in developing targeted recruitment and retention strategies.";
    suggestedQuestions = [
      "What's the average salary of our alumni?",
      "What are the career progression patterns of our alumni?",
      "How can alumni data help with student recruitment?"
    ];
  } else if (message.includes('retention') || message.includes('stay') || message.includes('tenure') || message.includes('length')) {
    topicResponse = "I currently don't have specific data on employee tenure or retention rates. However, this information would be valuable for understanding employee loyalty and could help in developing better retention strategies.";
    suggestedQuestions = [
      "How quickly do our alumni change jobs?",
      "What are the career progression patterns of our alumni?",
      "What percentage of alumni reach executive positions?"
    ];
  } else {
    topicResponse = "I currently don't have specific data on that topic. However, such information could be valuable for developing comprehensive recruitment and retention strategies.";
    suggestedQuestions = [
      "What's the average salary of our alumni?",
      "How do our alumni compare to the general population in terms of salary?",
      "What industries are our alumni working in?"
    ];
  }
  
  const suggestedQuestionsText = suggestedQuestions
    .map(q => `• ${q}`)
    .join('\n');
  
  return `${topicResponse}

Here are some related questions I can help you with:

${suggestedQuestionsText}`;
}

// Create a direct response for preset answers
function createDirectResponse(content: string) {
  const stream = new ReadableStream({
    start(controller) {
      // Send the content all at once for preset answers
      controller.enqueue(new TextEncoder().encode(content));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Create a streaming response from OpenAI
function createStreamResponse(response: any) {
    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send the content chunk
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
      controller.close();
    }
  });

    return new Response(stream, {
      headers: {
      'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
  });
}

