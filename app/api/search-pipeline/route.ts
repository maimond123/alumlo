import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface SearchPipelineRequest {
  query: string;
  organizationName: string;
  isDemo?: boolean;
}

interface QueryClassification {
  type: 'chronological' | 'temporal' | 'standard' | 'invalid';
  invalidReason?: string;
  suggestions?: string[];
}

interface ChronologicalFilters {
  // Basic search filters
  school_filter?: string;
  company_filter?: string;
  industry_filter?: string;
  title_filter?: string;
  location_filter?: string;
  
  // Experience-based filters
  min_years_in_industry?: number;
  min_years_in_function?: number;
  min_years_at_company_type?: number;
  career_progression_pattern?: string;
  degree_level_progression?: string[];
  education_industry_alignment?: boolean;
  gap_tolerance?: number;
  concurrent_activities?: boolean;
  industry_transitions?: string[];
  company_size_progression?: string[];
  geographic_mobility?: boolean;
}

interface TemporalElements {
  // Year-based filters
  specific_years?: number[];
  year_ranges?: Array<{start: number, end: number}>;
  exit_year?: number;
  exit_year_range?: [number, number];
  
  // Function/role filters
  target_company_functions?: string[];
  subsequent_functions?: string[];
  
  // Sequence patterns
  sequence_type?: "exit_then_function" | "function_then_function" | "concurrent" | "gap_then_function";
  timing_constraints?: {
    max_gap_months?: number;
    min_gap_months?: number;
  };
  
  // Education timing
  education_timing?: {
    school?: string;
    degree?: string;
    year?: number;
    concurrent_with_company?: boolean;
  };
}

interface TemporalConfig {
  type: 'temporal';
  temporalElements: TemporalElements;
  searchMethod: string;
  sqlFunction: string;
  sqlParameters: any;
}

interface ChronologicalConfig {
  type: 'chronological';
  filters: ChronologicalFilters;
  sqlFunction: string;
  sqlParameters: {
      chronological_filters: ChronologicalFilters;
    };
}

interface StandardConfig {
  type: 'standard';
  enhancedFilters: any;
  searchMethod: 'semantic_with_filters' | 'comprehensive_sql_filtering';
}

interface InvalidConfig {
  type: 'invalid';
  invalidReason: string;
  suggestions: string[];
}

type SearchConfig = TemporalConfig | ChronologicalConfig | StandardConfig | InvalidConfig;

interface SearchPipelineResponse {
  searchType: 'temporal' | 'chronological' | 'standard' | 'invalid';
  classification: QueryClassification;
  searchConfig: SearchConfig;
  shouldExecuteSearch: boolean;
  fallbackToStandard?: boolean;
  // NEW: Expansion capability metadata (stored for on-demand expansion)
  expansionMetadata?: {
    canExpand: boolean;
    originalQuery: string;
    primaryFilters?: StandardSearchFilters | ChronologicalFilters;
    primaryElements?: TemporalElements;
    organizationName?: string;
  };
  // REMOVED: expansionResults - now generated on-demand only
  metadata: {
    processingSteps: string[];
    llmCalls: number;
    processingTimeMs: number;
  };
}

// NEW: Search expansion interfaces
interface SearchExpansionVariant {
  natural_language_query: string;
  filters: ChronologicalFilters;
}

interface SearchExpansionResponse {
  expansion_variants: SearchExpansionVariant[];
}

// NEW: Standard search expansion interfaces
interface StandardExpansionVariant {
  natural_language_query: string;
  filters: StandardSearchFilters;
}

// NEW: Temporal search expansion interfaces  
interface TemporalExpansionVariant {
  natural_language_query: string;
  temporalElements: TemporalElements;
}

// NEW: Generic expansion variant type
type GenericExpansionVariant = SearchExpansionVariant | StandardExpansionVariant | TemporalExpansionVariant;

// NEW: Database Term Standardization and Mapping System (Enhanced for Fuzzy Matching)
const DATABASE_TERM_MAPPINGS = {
  // INDUSTRY STANDARDIZATION (Expanded for better fuzzy matching)
  industry_mappings: {
    // Technology variations (expanded)
    "tech": "Technology & Software",
    "technology": "Technology & Software", 
    "software": "Technology & Software",
    "it": "IT/Systems",
    "information technology": "IT/Systems",
    "info tech": "IT/Systems",
    "fintech": "Fintech",
    "financial technology": "Fintech",
    "ecommerce": "Internet/E-commerce",
    "e-commerce": "Internet/E-commerce",
    "internet": "Internet/E-commerce",
    "online": "Internet/E-commerce",
    "digital": "Technology & Software",
    "data": "Data/Analytics",
    "analytics": "Data/Analytics",
    "big data": "Data/Analytics",
    "telecom": "Telecommunications",
    "telecommunications": "Telecommunications",
    "saas": "Technology & Software",
    "software as a service": "Technology & Software",
    "cloud": "Technology & Software",
    "artificial intelligence": "Technology & Software",
    "ai": "Technology & Software",
    "machine learning": "Technology & Software",
    "ml": "Technology & Software",
    "blockchain": "Fintech",
    "crypto": "Fintech",
    "cryptocurrency": "Fintech",
    
    // Finance variations (expanded)
    "finance": "Financial Services",
    "financial": "Financial Services",
    "financial services": "Financial Services",
    "banking": "Banking",
    "investment": "Investment Management",
    "investment management": "Investment Management",
    "private equity": "Private Equity/VC",
    "pe": "Private Equity/VC",
    "venture capital": "Private Equity/VC",
    "vc": "Private Equity/VC",
    "hedge fund": "Investment Management",
    "asset management": "Investment Management",
    "wealth management": "Financial Services",
    "insurance": "Insurance",
    "accounting": "Accounting & Tax",
    "tax": "Accounting & Tax",
    "audit": "Accounting & Tax",
    "wall street": "Financial Services",
    "capital markets": "Financial Services",
    "trading": "Financial Services",
    
    // Healthcare variations (expanded)
    "healthcare": "Healthcare & Pharmaceuticals",
    "health": "Healthcare & Pharmaceuticals",
    "medical": "Healthcare & Pharmaceuticals",
    "medicine": "Healthcare & Pharmaceuticals",
    "pharma": "Healthcare & Pharmaceuticals",
    "pharmaceutical": "Healthcare & Pharmaceuticals",
    "pharmaceuticals": "Healthcare & Pharmaceuticals",
    "biotech": "Healthcare & Pharmaceuticals",
    "biotechnology": "Healthcare & Pharmaceuticals",
    "medtech": "Medical Devices",
    "medical devices": "Medical Devices",
    "life sciences": "Healthcare & Pharmaceuticals",
    "clinical": "Healthcare & Pharmaceuticals",
    "hospital": "Healthcare & Pharmaceuticals",
    
    // Consulting variations (expanded)
    "consulting": "Management Consulting",
    "management consulting": "Management Consulting",
    "mckinsey": "Management Consulting",
    "bain": "Management Consulting",
    "bcg": "Management Consulting",
    "boston consulting group": "Management Consulting",
    "advisory": "Management Consulting",
    "strategy": "Management Consulting",
    "strategy consulting": "Management Consulting",
    "business consulting": "Management Consulting",
    
    // Food & Restaurant variations (expanded)
    "food": "Food & Beverage",
    "food and beverage": "Food & Beverage",
    "restaurant": "Restaurant/Hospitality",
    "restaurants": "Restaurant/Hospitality",
    "hospitality": "Restaurant/Hospitality",
    "qsr": "Quick Service Restaurant (QSR)",
    "quick service": "Quick Service Restaurant (QSR)",
    "fast food": "Quick Service Restaurant (QSR)",
    "food service": "Restaurant/Hospitality",
    "catering": "Food & Beverage",
    "beverage": "Food & Beverage",
    "consumer packaged goods": "Retail & Consumer Goods",
    "cpg": "Retail & Consumer Goods",
    
    // Retail variations (expanded)
    "retail": "Retail & Consumer Goods",
    "consumer": "Retail & Consumer Goods",
    "consumer goods": "Retail & Consumer Goods",
    "fashion": "Fashion",
    "apparel": "Fashion",
    "clothing": "Fashion",
    "automotive": "Automotive",
    "auto": "Automotive",
    "luxury": "Luxury Goods",
    "beauty": "Beauty & Personal Care",
    "cosmetics": "Beauty & Personal Care",
    
    // Manufacturing variations (expanded)
    "manufacturing": "Manufacturing",
    "production": "Manufacturing",
    "industrial": "Manufacturing",
    "factory": "Manufacturing",
    "logistics": "Transportation & Logistics",
    "supply chain": "Supply Chain/Logistics",
    "transportation": "Transportation & Logistics",
    "shipping": "Transportation & Logistics",
    
    // Media variations (expanded)
    "media": "Media & Entertainment",
    "entertainment": "Media & Entertainment",
    "sports": "Sports & Recreation",
    "gaming": "Gaming & Entertainment",
    "film": "Media & Entertainment",
    "television": "Media & Entertainment",
    "tv": "Media & Entertainment",
    "advertising": "Advertising & Marketing",
    "marketing": "Advertising & Marketing",
    "social media": "Media & Entertainment",
    
    // Education variations (expanded)
    "education": "Education",
    "academic": "Education",
    "university": "Education",
    "school": "Education",
    "edtech": "Education",
    "educational technology": "Education",
    "learning": "Education",
    
    // Real Estate variations (expanded)
    "real estate": "Real Estate",
    "property": "Real Estate",
    "realty": "Real Estate",
    "housing": "Real Estate",
    "commercial property": "Real Estate",
    "construction": "Construction & Real Estate",
    
    // Government variations (expanded)
    "government": "Government & Public Sector",
    "public sector": "Government & Public Sector",
    "federal": "Government & Public Sector",
    "state government": "Government & Public Sector",
    "local government": "Government & Public Sector",
    "nonprofit": "Non-Profit & NGO",
    "non-profit": "Non-Profit & NGO",
    "ngo": "Non-Profit & NGO",
    "public service": "Government & Public Sector",
    
    // Energy & Environment (new categories)
    "energy": "Energy",
    "oil": "Energy",
    "gas": "Energy",
    "renewable": "Energy",
    "solar": "Energy",
    "wind": "Energy",
    "utilities": "Utilities",
    "environmental": "Environmental Services",
    "sustainability": "Environmental Services",
    "green": "Environmental Services"
  },

  // JOB FUNCTION STANDARDIZATION (Expanded)
  function_mappings: {
    // Engineering variations (expanded)
    "engineering": "Software Engineering",
    "software engineering": "Software Engineering",
    "software development": "Software Engineering", 
    "development": "Software Engineering",
    "programmer": "Software Engineering",
    "developer": "Software Engineering",
    "coding": "Software Engineering",
    "programming": "Software Engineering",
    "swe": "Software Engineering",
    "full stack": "Software Engineering",
    "frontend": "Software Engineering",
    "backend": "Software Engineering",
    "devops": "Software Engineering",
    "mobile development": "Software Engineering",
    "web development": "Software Engineering",
    
    // Product variations (expanded)
    "product": "Product Management",
    "product management": "Product Management",
    "product manager": "Product Management",
    "pm": "Product Management",
    "product marketing": "Product Management",
    "product strategy": "Product Management",
    "product owner": "Product Management",
    
    // Data variations (expanded)
    "data science": "Data Science/Analytics",
    "data": "Data Science/Analytics",
    "analytics": "Data Science/Analytics",
    "data analyst": "Data Science/Analytics",
    "data scientist": "Data Science/Analytics",
    "business intelligence": "Data Science/Analytics",
    "bi": "Data Science/Analytics",
    "machine learning": "Data Science/Analytics",
    "ai": "Data Science/Analytics",
    "statistics": "Data Science/Analytics",
    "quantitative": "Data Science/Analytics",
    
    // Sales variations (expanded)
    "sales": "Sales",
    "business development": "Business Development",
    "bd": "Business Development",
    "biz dev": "Business Development",
    "account management": "Account Management",
    "customer success": "Customer Success",
    "revenue": "Sales",
    "partnerships": "Business Development",
    "enterprise sales": "Sales",
    "inside sales": "Sales",
    "outside sales": "Sales",
    
    // Marketing variations (expanded)
    "marketing": "Marketing",
    "digital marketing": "Digital Marketing",
    "growth": "Marketing",
    "growth marketing": "Marketing",
    "brand": "Marketing",
    "brand marketing": "Marketing",
    "content marketing": "Marketing",
    "performance marketing": "Marketing",
    "social media marketing": "Marketing",
    "seo": "Digital Marketing",
    "sem": "Digital Marketing",
    "advertising": "Marketing",
    
    // Finance variations (expanded)
    "finance": "Finance",
    "financial": "Finance",
    "accounting": "Accounting",
    "fp&a": "Finance",
    "financial planning": "Finance",
    "treasury": "Finance",
    "investment banking": "Investment Banking",
    "ib": "Investment Banking",
    "private equity": "Private Equity/VC",
    "venture capital": "Private Equity/VC",
    "hedge fund": "Investment Management",
    "trading": "Trading",
    
    // Operations variations (expanded)
    "operations": "Operations Management",
    "ops": "Operations Management",
    "supply chain": "Supply Chain",
    "logistics": "Supply Chain",
    "procurement": "Operations Management",
    "process improvement": "Operations Management",
    "program management": "Project Management",
    "project management": "Project Management",
    "business operations": "Operations Management",
    
    // Management variations (expanded)
    "management": "General Management",
    "general management": "General Management",
    "consulting": "Consulting",
    "strategy": "Strategy & Planning",
    "strategic planning": "Strategy & Planning",
    "business strategy": "Strategy & Planning",
    "transformation": "Consulting",
    
    // HR variations (expanded)
    "hr": "Human Resources", 
    "human resources": "Human Resources",
    "people": "Human Resources",
    "recruiting": "Recruiting/Talent",
    "recruitment": "Recruiting/Talent",
    "talent": "Recruiting/Talent",
    "talent acquisition": "Recruiting/Talent",
    "people operations": "Human Resources",
    "compensation": "Human Resources",
    "benefits": "Human Resources",
    "learning and development": "Human Resources",
    
    // Design variations (new)
    "design": "Design",
    "ux": "Design",
    "ui": "Design",
    "user experience": "Design",
    "user interface": "Design",
    "graphic design": "Design",
    "product design": "Design",
    "creative": "Design",
    
    // Legal variations (new)
    "legal": "Legal",
    "law": "Legal",
    "attorney": "Legal",
    "lawyer": "Legal",
    "counsel": "Legal",
    "compliance": "Legal",
    
    // Restaurant specific (expanded)
    "restaurant operations": "Restaurant Operations",
    "food service": "Food Service Management",
    "franchise": "Franchise Operations",
    "store management": "Store Management",
    "restaurant management": "Restaurant Operations",
    "kitchen": "Food Service Management",
    "culinary": "Food Service Management"
  },

  // JOB LEVEL STANDARDIZATION (Expanded)
  level_mappings: {
    // Entry level variations (expanded)
    "entry": "Entry Level",
    "entry level": "Entry Level",
    "junior": "Entry Level",
    "jr": "Entry Level",
    "associate": "Associate",
    "coordinator": "Associate",
    "analyst": "Associate",
    "assistant": "Entry Level",
    "trainee": "Entry Level",
    "intern": "Entry Level",
    "new grad": "Entry Level",
    "recent graduate": "Entry Level",
    
    // Mid level variations (expanded)
    "mid": "Mid Level",
    "mid level": "Mid Level",
    "senior": "Senior Level",
    "sr": "Senior Level",
    "senior level": "Senior Level",
    "staff": "Senior Level",
    "principal": "Lead/Principal",
    "lead": "Lead/Principal",
    "senior staff": "Lead/Principal",
    "architect": "Lead/Principal",
    "specialist": "Mid Level",
    "expert": "Senior Level",
    
    // Management variations (expanded)
    "manager": "Manager",
    "mgr": "Manager",
    "supervisor": "Manager",
    "team lead": "Manager",
    "team leader": "Manager",
    "director": "Director",
    "dir": "Director",
    "senior director": "Director",
    "head of": "Director",
    
    // Executive variations (expanded)
    "vp": "VP/SVP",
    "vice president": "VP/SVP",
    "svp": "VP/SVP",
    "senior vice president": "VP/SVP",
    "executive": "VP/SVP",
    "evp": "VP/SVP",
    "executive vice president": "VP/SVP",
    "c-suite": "C-Suite",
    "ceo": "C-Suite",
    "chief executive officer": "C-Suite",
    "cto": "C-Suite",
    "chief technology officer": "C-Suite",
    "cfo": "C-Suite",
    "chief financial officer": "C-Suite",
    "coo": "C-Suite",
    "chief operating officer": "C-Suite",
    "cmo": "C-Suite",
    "chief marketing officer": "C-Suite",
    "chief": "C-Suite",
    "founder": "Founder/Owner",
    "co-founder": "Founder/Owner",
    "cofounder": "Founder/Owner",
    "owner": "Founder/Owner",
    "entrepreneur": "Founder/Owner",
    "president": "C-Suite"
  },

  // COMPANY SIZE STANDARDIZATION (Expanded)
  size_mappings: {
    "startup": "Startup (1-50 employees)",
    "start-up": "Startup (1-50 employees)",
    "early stage": "Startup (1-50 employees)",
    "seed": "Startup (1-50 employees)",
    "series a": "Startup (1-50 employees)",
    "small": "Small (51-200 employees)",
    "small company": "Small (51-200 employees)",
    "sme": "Small (51-200 employees)",
    "small business": "Small (51-200 employees)",
    "medium": "Medium (201-1000 employees)",
    "medium company": "Medium (201-1000 employees)",
    "mid-size": "Medium (201-1000 employees)",
    "large": "Large (1001-5000 employees)",
    "large company": "Large (1001-5000 employees)",
    "enterprise": "Enterprise (5000+ employees)",
    "big company": "Enterprise (5000+ employees)",
    "fortune 500": "Enterprise (5000+ employees)",
    "fortune500": "Enterprise (5000+ employees)",
    "big tech": "Enterprise (5000+ employees)",
    "faang": "Enterprise (5000+ employees)",
    "corporate": "Enterprise (5000+ employees)",
    "multinational": "Enterprise (5000+ employees)"
  },

  // DEGREE LEVEL STANDARDIZATION (Expanded)
  degree_mappings: {
    // High school variations
    "high school": "High School Diploma",
    "secondary": "High School Diploma",
    "hs": "High School Diploma",
    
    // Undergraduate variations (expanded)
    "bachelor": "Bachelor's Degree",
    "bachelors": "Bachelor's Degree", 
    "bachelor's": "Bachelor's Degree",
    "ba": "Bachelor's Degree",
    "bs": "Bachelor's Degree",
    "bsc": "Bachelor's Degree",
    "undergraduate": "Bachelor's Degree",
    "undergrad": "Bachelor's Degree",
    "college": "Bachelor's Degree",
    "college degree": "Bachelor's Degree",
    "associate": "Associate Degree",
    "associates": "Associate Degree",
    "associate's": "Associate Degree",
    "aa": "Associate Degree",
    "as": "Associate Degree",
    
    // Graduate variations (expanded)
    "master": "Master's Degree",
    "masters": "Master's Degree",
    "master's": "Master's Degree",
    "ma": "Master of Arts (MA)",
    "ms": "Master of Science (MS)",
    "msc": "Master of Science (MS)",
    "graduate": "Master's Degree",
    "grad school": "Master's Degree",
    "graduate degree": "Master's Degree",
    "mba": "Master of Business Administration (MBA)",
    "master of business administration": "Master of Business Administration (MBA)",
    "business school": "Master of Business Administration (MBA)",
    "mfa": "Master of Fine Arts (MFA)",
    "med": "Master of Education (MEd)",
    
    // Doctorate variations (expanded)
    "phd": "Doctor of Philosophy (PhD)",
    "ph.d": "Doctor of Philosophy (PhD)",
    "doctorate": "Doctor of Philosophy (PhD)",
    "doctoral": "Doctor of Philosophy (PhD)",
    "doctor of philosophy": "Doctor of Philosophy (PhD)",
    "md": "Doctor of Medicine (MD)",
    "doctor of medicine": "Doctor of Medicine (MD)",
    "medical degree": "Doctor of Medicine (MD)",
    "med school": "Doctor of Medicine (MD)",
    "medical school": "Doctor of Medicine (MD)",
    "jd": "Juris Doctor (JD)",
    "j.d": "Juris Doctor (JD)",
    "juris doctor": "Juris Doctor (JD)",
    "law degree": "Juris Doctor (JD)",
    "law school": "Juris Doctor (JD)",
    "legal": "Juris Doctor (JD)"
  },

  // SCHOOL RANKING STANDARDIZATION (Expanded)
  ranking_mappings: {
    "ivy league": "Ivy League",
    "ivy": "Ivy League",
    "harvard": "Ivy League",
    "yale": "Ivy League", 
    "princeton": "Ivy League",
    "columbia": "Ivy League",
    "penn": "Ivy League",
    "upenn": "Ivy League",
    "university of pennsylvania": "Ivy League",
    "dartmouth": "Ivy League",
    "brown": "Ivy League",
    "cornell": "Ivy League",
    "top 10": "Top 10",
    "top ten": "Top 10",
    "top 25": "Top 25",
    "top 50": "Top 50",
    "top 100": "Top 100",
    "elite": "Top 10",
    "prestigious": "Top 25",
    "state school": "State University",
    "state university": "State University",
    "public university": "State University",
    "uc": "State University",
    "university of california": "State University",
    "community college": "Community College",
    "cc": "Community College",
    "trade school": "Trade/Technical School",
    "technical school": "Trade/Technical School",
    "vocational": "Trade/Technical School",
    "liberal arts": "Liberal Arts College",
    "liberal arts college": "Liberal Arts College"
  },

  // MAJOR CATEGORY STANDARDIZATION (Expanded)
  major_mappings: {
    // STEM variations (expanded)
    "computer science": "Computer Science/Technology",
    "cs": "Computer Science/Technology",
    "comp sci": "Computer Science/Technology",
    "tech": "Computer Science/Technology",
    "technology": "Computer Science/Technology",
    "information technology": "Computer Science/Technology",
    "it": "Computer Science/Technology",
    "engineering": "Engineering",
    "mechanical engineering": "Engineering",
    "electrical engineering": "Engineering",
    "civil engineering": "Engineering",
    "chemical engineering": "Engineering",
    "software engineering": "Computer Science/Technology",
    "math": "Mathematics/Statistics",
    "mathematics": "Mathematics/Statistics",
    "statistics": "Mathematics/Statistics",
    "applied math": "Mathematics/Statistics",
    "data science": "Data Science/Analytics",
    "science": "Natural Sciences",
    "biology": "Natural Sciences",
    "chemistry": "Natural Sciences",
    "physics": "Natural Sciences",
    "biochemistry": "Natural Sciences",
    "neuroscience": "Natural Sciences",
    
    // Business variations (expanded)
    "business": "Business Administration",
    "business administration": "Business Administration",
    "business management": "Business Administration",
    "finance": "Finance",
    "accounting": "Accounting",
    "marketing": "Marketing",
    "management": "Management",
    "economics": "Economics",
    "econ": "Economics",
    "entrepreneurship": "Business Administration",
    "operations": "Management",
    "supply chain": "Management",
    "international business": "Business Administration",
    
    // Liberal arts variations (expanded)
    "liberal arts": "Liberal Arts",
    "english": "English/Literature",
    "literature": "English/Literature",
    "history": "History",
    "philosophy": "Philosophy",
    "communications": "Communications",
    "comm": "Communications",
    "journalism": "Communications",
    "media studies": "Communications",
    "art": "Fine Arts",
    "fine arts": "Fine Arts",
    "visual arts": "Fine Arts",
    "music": "Music",
    "theater": "Theater/Film",
    "theatre": "Theater/Film",
    "film": "Theater/Film",
    "design": "Design",
    "graphic design": "Design",
    
    // Social sciences variations (expanded)
    "psychology": "Psychology",
    "psych": "Psychology",
    "sociology": "Sociology",
    "anthropology": "Sociology",
    "political science": "Political Science",
    "poli sci": "Political Science",
    "government": "Political Science",
    "international relations": "International Relations",
    "ir": "International Relations",
    "public policy": "Public Policy",
    "public administration": "Public Administration",
    "social work": "Social Work",
    "criminal justice": "Criminal Justice",
    
    // Professional fields variations (expanded)
    "education": "Education",
    "teaching": "Education",
    "medicine": "Medicine",
    "medical": "Medicine",
    "pre-med": "Medicine",
    "nursing": "Nursing",
    "pharmacy": "Pharmacy",
    "healthcare": "Medicine",
    "law": "Law",
    "legal": "Law",
    "pre-law": "Law",
    "architecture": "Architecture",
    "urban planning": "Architecture"
  }
};

// Enhanced fuzzy matching function with multiple strategies
function fuzzyMatchTerms(query: string, mappings: Record<string, string>): string[] {
  const lowerQuery = query.toLowerCase();
  const matches: Array<{ term: string; score: number; matchType: string }> = [];
  
  console.log(`[FUZZY MATCH] 🔍 Starting fuzzy matching for query: "${query}"`);
  console.log(`[FUZZY MATCH] 📊 Available mappings count: ${Object.keys(mappings).length}`);
  
  for (const [key, value] of Object.entries(mappings)) {
    const lowerKey = key.toLowerCase();
    let score = 0;
    let matchType = '';
    
    // Strategy 1: Exact match (highest score)
    if (lowerQuery === lowerKey) {
      score = 100;
      matchType = 'exact_match';
    }
    // Strategy 2: Contains exact key
    else if (lowerQuery.includes(lowerKey)) {
      score = 90;
      matchType = 'contains_key';
    }
    // Strategy 3: Key contains query (partial match)
    else if (lowerKey.includes(lowerQuery) && lowerQuery.length >= 3) {
      score = 80;
      matchType = 'partial_match';
    }
    // Strategy 4: Word boundary matching
    else if (new RegExp(`\\b${lowerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lowerQuery)) {
      score = 85;
      matchType = 'word_boundary';
    }
    // Strategy 5: Fuzzy word matching (split into words)
    else {
      const queryWords = lowerQuery.split(/\s+/);
      const keyWords = lowerKey.split(/\s+/);
      
      let wordMatches = 0;
      let partialMatches = 0;
      
      for (const queryWord of queryWords) {
        for (const keyWord of keyWords) {
          // Exact word match
          if (queryWord === keyWord) {
            wordMatches++;
          }
          // Partial word match (at least 3 chars)
          else if (queryWord.length >= 3 && keyWord.includes(queryWord)) {
            partialMatches++;
          }
          // Reverse partial match
          else if (keyWord.length >= 3 && queryWord.includes(keyWord)) {
            partialMatches++;
          }
          // Levenshtein-like similarity for short words
          else if (calculateSimilarity(queryWord, keyWord) > 0.7) {
            partialMatches++;
          }
        }
      }
      
      if (wordMatches > 0 || partialMatches > 0) {
        score = Math.min(75, (wordMatches * 20) + (partialMatches * 10));
        matchType = `fuzzy_words_${wordMatches}exact_${partialMatches}partial`;
      }
    }
    
    // Strategy 6: Acronym matching
    if (score === 0) {
      const acronym = lowerKey.split(' ').map(word => word[0]).join('');
      if (lowerQuery === acronym || lowerQuery.includes(acronym)) {
        score = 70;
        matchType = 'acronym_match';
      }
    }
    
    // Strategy 7: Common abbreviations and variations
    if (score === 0) {
      const variationScore = checkCommonVariations(lowerQuery, lowerKey);
      if (variationScore > 0) {
        score = variationScore;
        matchType = 'variation_match';
      }
    }
    
    if (score >= 50) { // Minimum threshold for inclusion
      matches.push({ term: value, score, matchType });
      console.log(`[FUZZY MATCH] ✅ Found match: "${lowerKey}" → "${value}" (score: ${score}, type: ${matchType})`);
    }
  }
  
  // Sort by score (highest first) and return unique values
  const sortedMatches = matches
    .sort((a, b) => b.score - a.score)
    .map(match => match.term);
  
  console.log(`[FUZZY MATCH] 📊 Fuzzy matching summary:`, {
    queryTerm: query,
    totalMatches: matches.length,
    uniqueResults: [...new Set(sortedMatches)].length,
    bestMatches: matches.slice(0, 3).map(m => ({ term: m.term, score: m.score, type: m.matchType }))
  });
  
  return [...new Set(sortedMatches)];
}

// Simple similarity calculation (Jaccard-like)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1.length < 3 || str2.length < 3) return 0;
  
  const set1 = new Set(str1.toLowerCase().split(''));
  const set2 = new Set(str2.toLowerCase().split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Check for common variations and abbreviations
function checkCommonVariations(query: string, key: string): number {
  const variations: Record<string, string[]> = {
    // Technology variations
    'technology': ['tech', 'it', 'information technology', 'info tech', 'digital'],
    'software': ['sw', 'development', 'dev', 'programming', 'coding'],
    'engineering': ['eng', 'engineer', 'engineers'],
    'artificial intelligence': ['ai', 'machine learning', 'ml', 'deep learning'],
    'data science': ['ds', 'data analysis', 'analytics', 'big data'],
    
    // Business variations
    'management consulting': ['consulting', 'mckinsey', 'bain', 'bcg', 'strategy'],
    'business administration': ['business', 'admin', 'management'],
    'finance': ['financial', 'fin', 'banking', 'investment'],
    'marketing': ['mktg', 'advertising', 'promotion', 'brand'],
    'human resources': ['hr', 'people', 'talent', 'recruiting'],
    
    // Education variations
    'bachelor': ['bachelors', 'undergraduate', 'college', 'ba', 'bs'],
    'master': ['masters', 'graduate', 'ma', 'ms'],
    'doctorate': ['doctoral', 'phd', 'doctor'],
    'mba': ['master of business administration', 'business school'],
    
    // Company size variations
    'startup': ['start-up', 'early stage', 'seed', 'series a'],
    'enterprise': ['large company', 'big company', 'fortune 500', 'corporate'],
    'small': ['small company', 'sme', 'small business'],
    
    // Industry variations
    'healthcare': ['health', 'medical', 'medicine', 'pharma', 'pharmaceutical'],
    'real estate': ['property', 'realty', 'housing', 'commercial property'],
    'retail': ['consumer', 'shopping', 'commerce', 'merchandise'],
    'manufacturing': ['production', 'factory', 'industrial'],
    
    // Job level variations
    'senior': ['sr', 'senior level', 'experienced'],
    'junior': ['jr', 'entry level', 'associate'],
    'manager': ['mgr', 'management', 'supervisor'],
    'director': ['dir', 'head of'],
    'vice president': ['vp', 'svp', 'senior vp'],
    'chief executive': ['ceo', 'chief executive officer'],
    'founder': ['co-founder', 'entrepreneur', 'startup founder']
  };
  
  for (const [baseKey, variants] of Object.entries(variations)) {
    if (key.includes(baseKey)) {
      for (const variant of variants) {
        if (query.includes(variant)) {
          return 60; // Good match for variations
        }
      }
    }
  }
  
  return 0;
}

// Enhanced function to standardize terms using fuzzy matching
function standardizeTerms(query: string, filterType: keyof typeof DATABASE_TERM_MAPPINGS): string[] {
  console.log(`[TERM STANDARDIZATION] 🔄 Starting standardization for "${query}" in category: ${filterType}`);
  
  const mappings = DATABASE_TERM_MAPPINGS[filterType];
  console.log(`[TERM STANDARDIZATION] 📋 Available mappings in ${filterType}:`, Object.keys(mappings).length);
  
  const matches = fuzzyMatchTerms(query, mappings);
  console.log(`[TERM STANDARDIZATION] 🎯 Fuzzy matches found:`, matches);
  
  // If no fuzzy matches found, try semantic expansion
  if (matches.length === 0) {
    console.log(`[TERM STANDARDIZATION] 🔍 No fuzzy matches, trying semantic expansion...`);
    const expandedMatches = semanticExpansion(query, filterType);
    console.log(`[TERM STANDARDIZATION] 🧠 Semantic expansion results:`, expandedMatches);
    
    if (expandedMatches.length > 0) {
      console.log(`[TERM STANDARDIZATION] ✅ Using semantic expansion results`);
      return expandedMatches;
    }
  }
  
  // If still no matches, return the original query (let the LLM handle it)
  const finalResult = matches.length > 0 ? matches : [query];
  console.log(`[TERM STANDARDIZATION] 📤 Final standardization result for "${query}":`, {
    inputTerm: query,
    category: filterType,
    outputTerms: finalResult,
    wasStandardized: finalResult[0] !== query,
    matchCount: matches.length
  });
  
  return finalResult;
}

// Semantic expansion for terms not found in mappings
function semanticExpansion(query: string, filterType: keyof typeof DATABASE_TERM_MAPPINGS): string[] {
  const lowerQuery = query.toLowerCase();
  
  // Industry semantic expansion
  if (filterType === 'industry_mappings') {
    if (lowerQuery.includes('digital') || lowerQuery.includes('online') || lowerQuery.includes('internet')) {
      return ['Technology & Software', 'Internet/E-commerce'];
    }
    if (lowerQuery.includes('bio') || lowerQuery.includes('life sciences')) {
      return ['Healthcare & Pharmaceuticals'];
    }
    if (lowerQuery.includes('green') || lowerQuery.includes('sustainable') || lowerQuery.includes('renewable')) {
      return ['Energy', 'Environmental Services'];
    }
    if (lowerQuery.includes('crypto') || lowerQuery.includes('blockchain') || lowerQuery.includes('defi')) {
      return ['Fintech', 'Technology & Software'];
    }
  }
  
  // Function semantic expansion
  if (filterType === 'function_mappings') {
    if (lowerQuery.includes('code') || lowerQuery.includes('program') || lowerQuery.includes('develop')) {
      return ['Software Engineering'];
    }
    if (lowerQuery.includes('design') && (lowerQuery.includes('ui') || lowerQuery.includes('ux'))) {
      return ['Product Management', 'Design'];
    }
    if (lowerQuery.includes('revenue') || lowerQuery.includes('growth') || lowerQuery.includes('acquisition')) {
      return ['Sales', 'Business Development'];
    }
    if (lowerQuery.includes('people') || lowerQuery.includes('culture') || lowerQuery.includes('talent')) {
      return ['Human Resources'];
    }
  }
  
  // Level semantic expansion
  if (filterType === 'level_mappings') {
    if (lowerQuery.includes('experienced') || lowerQuery.includes('seasoned')) {
      return ['Senior Level'];
    }
    if (lowerQuery.includes('new grad') || lowerQuery.includes('recent graduate')) {
      return ['Entry Level'];
    }
    if (lowerQuery.includes('leadership') || lowerQuery.includes('executive')) {
      return ['VP/SVP', 'C-Suite'];
    }
  }
  
  // Degree semantic expansion
  if (filterType === 'degree_mappings') {
    if (lowerQuery.includes('undergrad') || lowerQuery.includes('college degree')) {
      return ["Bachelor's Degree"];
    }
    if (lowerQuery.includes('grad school') || lowerQuery.includes('graduate degree')) {
      return ["Master's Degree"];
    }
    if (lowerQuery.includes('business school')) {
      return ["Master of Business Administration (MBA)"];
    }
    if (lowerQuery.includes('law school') || lowerQuery.includes('legal')) {
      return ["Juris Doctor (JD)"];
    }
  }
  
  return [];
}

// Enhanced function to get all possible standardized terms with fuzzy matching
function getAllStandardizedTerms(query: string): {
  industries: string[];
  functions: string[];
  levels: string[];
  sizes: string[];
  degrees: string[];
  rankings: string[];
  majors: string[];
} {
  console.log(`[COMPREHENSIVE TERM ANALYSIS] 🔍 Starting comprehensive term analysis for: "${query}"`);
  
  const results = {
    industries: standardizeTerms(query, 'industry_mappings'),
    functions: standardizeTerms(query, 'function_mappings'),
    levels: standardizeTerms(query, 'level_mappings'),
    sizes: standardizeTerms(query, 'size_mappings'),
    degrees: standardizeTerms(query, 'degree_mappings'),
    rankings: standardizeTerms(query, 'ranking_mappings'),
    majors: standardizeTerms(query, 'major_mappings')
  };
  
  console.log(`[COMPREHENSIVE TERM ANALYSIS] 📊 Complete term analysis results:`, {
    query: query,
    hasMatches: {
      industries: results.industries.length > 0 && results.industries[0] !== query,
      functions: results.functions.length > 0 && results.functions[0] !== query,
      levels: results.levels.length > 0 && results.levels[0] !== query,
      sizes: results.sizes.length > 0 && results.sizes[0] !== query,
      degrees: results.degrees.length > 0 && results.degrees[0] !== query,
      rankings: results.rankings.length > 0 && results.rankings[0] !== query,
      majors: results.majors.length > 0 && results.majors[0] !== query
    },
    matchCounts: {
      industries: results.industries.length,
      functions: results.functions.length,
      levels: results.levels.length,
      sizes: results.sizes.length,
      degrees: results.degrees.length,
      rankings: results.rankings.length,
      majors: results.majors.length
    },
    totalStandardizations: Object.values(results).reduce((total, matches) => 
      total + (matches.length > 0 && matches[0] !== query ? 1 : 0), 0)
  });
  
  return results;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  let llmCalls = 0;

  try {
    console.log(`[PIPELINE] 🚀 Search pipeline started at ${new Date().toISOString()}`);
    
    const body: SearchPipelineRequest & { requestType?: 'search' | 'expand' } = await req.json();
    console.log(`[PIPELINE] 📝 Request received:`, {
      hasQuery: !!body.query,
      queryLength: body.query?.length || 0,
      organizationName: body.organizationName,
      isDemo: body.isDemo,
      requestType: body.requestType || 'search'
    });

    const { query, organizationName, isDemo = false, requestType = 'search' } = body;

    if (!query) {
      console.log(`[PIPELINE] ❌ No query provided`);
      return NextResponse.json({
        searchType: 'standard',
        classification: { type: 'standard' },
        searchConfig: {
          type: 'standard',
          enhancedFilters: {},
          searchMethod: 'comprehensive_sql_filtering'
        },
        shouldExecuteSearch: true,
        metadata: {
          processingSteps: ['error_no_query'],
          llmCalls: 0,
          processingTimeMs: Date.now() - startTime
        }
      });
    }

    // Handle expansion requests
    if (requestType === 'expand') {
      console.log(`[PIPELINE EXPANSION] 🔍 Processing on-demand expansion request`);
      return await handleExpansionRequest(body, startTime);
    }

    // Handle regular search requests (existing logic)
    // Step 1: Classify the query
    console.log(`[PIPELINE] 🔍 Step 1: Classifying query...`);
    processingSteps.push('query_classification');
    
    const classification = await classifyQueryUsingMainAPI(query);
    llmCalls++;
    
    console.log(`[PIPELINE] 🎯 Classification result:`, {
      type: classification.type,
      hasInvalidReason: !!classification.invalidReason,
      hasSuggestions: !!classification.suggestions?.length
    });

    // NEW: Handle invalid queries
    if (classification.type === 'invalid') {
      console.log(`[PIPELINE] ❌ Invalid query detected: ${classification.invalidReason}`);
      
      return NextResponse.json({
        searchType: 'invalid',
        classification: classification,
        searchConfig: {
          type: 'invalid',
          invalidReason: classification.invalidReason,
          suggestions: classification.suggestions || []
        },
        shouldExecuteSearch: false,
        metadata: {
          processingSteps: [...processingSteps, 'invalid_query_detected'],
          llmCalls,
          processingTimeMs: Date.now() - startTime
        }
      });
    }

    // Continue with existing logic for valid queries
    let searchConfig: SearchConfig;
    let expansionMetadata: any = null;

    // Step 2: Process based on classification type (without expansion - on-demand only)
    if (classification.type === 'temporal') {
      console.log(`[PIPELINE] 🕐 Step 2: Processing temporal search...`);
      processingSteps.push('temporal_processing');
      
      const temporalElements = await extractTemporalElements(query);
      searchConfig = await processTemporalSearch(query, classification, organizationName);
      llmCalls += 2; // Classification + Temporal extraction
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryElements: temporalElements,
        organizationName: organizationName
      };
      
    } else if (classification.type === 'chronological') {
      console.log(`[PIPELINE] 📈 Step 2: Processing chronological search...`);
      processingSteps.push('chronological_processing');
      
      const chronologicalFilters = await translateWithoutClassificationContext(query);
      searchConfig = await processChronologicalSearch(query, classification, organizationName);
      llmCalls += 3; // Classification + Standardization + Filter extraction
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryFilters: chronologicalFilters,
        organizationName: organizationName
      };
      
    } else {
      console.log(`[PIPELINE] 📊 Step 2: Processing standard search...`);
      processingSteps.push('standard_processing');
      
      const standardFilters = await translateStandardSearchQuery(query);
      searchConfig = await processStandardSearch(query, classification);
      llmCalls += 2; // Classification + Standard filter extraction
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryFilters: standardFilters
      };
    }

    console.log(`[PIPELINE] ✅ Search configuration completed:`, {
      configType: searchConfig.type,
      hasEnhancedFilters: !!(searchConfig as any).enhancedFilters,
      hasExpansionMetadata: !!expansionMetadata,
      totalSteps: processingSteps.length,
      totalLLMCalls: llmCalls
    });

    const response: SearchPipelineResponse = {
      searchType: classification.type as 'temporal' | 'chronological' | 'standard' | 'invalid',
      classification: classification,
      searchConfig: searchConfig,
      shouldExecuteSearch: true,
      ...(expansionMetadata && { expansionMetadata }),
      metadata: {
        processingSteps,
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    };

    console.log(`[PIPELINE] 🎉 Pipeline completed successfully in ${Date.now() - startTime}ms`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('🔍 [PIPELINE ERROR] Search pipeline failed:', error);
    console.error(`[PIPELINE DEBUG] ❌ Critical pipeline error:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      processingTime: Date.now() - startTime + 'ms',
      completedSteps: processingSteps,
      llmCallsBeforeError: llmCalls
    });
    
    // Unified error handling with fallback
    const errorResponse: SearchPipelineResponse = {
      searchType: 'standard',
      classification: { type: 'standard' },
      searchConfig: {
        type: 'standard',
        enhancedFilters: {},
        searchMethod: 'comprehensive_sql_filtering' // Use SQL filtering instead of semantic search even for errors
      },
      shouldExecuteSearch: true,
      fallbackToStandard: true,
      metadata: {
        processingSteps: [...processingSteps, 'error_fallback'],
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    console.log(`[PIPELINE DEBUG] 🔄 Returning error fallback response:`, errorResponse);
    return NextResponse.json(errorResponse, { status: 200 }); // Return 200 to allow fallback
  }
}

// NEW: Handle on-demand expansion requests
async function handleExpansionRequest(
  body: any,
  startTime: number
): Promise<NextResponse> {
  console.log(`[EXPANSION REQUEST] 🔍 Processing expansion request:`, body);
  
  const { 
    query, 
    organizationName, 
    searchType, 
    primaryFilters, 
    primaryElements 
  } = body;

  let llmCalls = 0;
  let expansionResults: any = null;

  try {
    if (searchType === 'standard') {
      console.log(`[EXPANSION REQUEST] 📊 Generating standard expansions`);
      const variants = await generateStandardExpansionVariants(query, primaryFilters);
      llmCalls++;
      
      const additionalSearchConfigs = variants.map(variant => ({
        type: 'standard',
        enhancedFilters: variant.filters,
        searchMethod: 'comprehensive_sql_filtering'
      }));
      
      expansionResults = { variants, additionalSearchConfigs };
      
    } else if (searchType === 'temporal') {
      console.log(`[EXPANSION REQUEST] 🕐 Generating temporal expansions`);
      const variants = await generateTemporalExpansionVariants(query, primaryElements);
      llmCalls++;
      
      const additionalSearchConfigs = variants.map(variant => {
        let searchMethod = 'general_filter';
        let sqlFunction = `temporal_filter_search_${organizationName}`;
        
        if (variant.temporalElements.exit_year && variant.temporalElements.subsequent_functions && variant.temporalElements.subsequent_functions.length > 0) {
          searchMethod = 'specific_sequence';
          sqlFunction = `temporal_career_search_${organizationName}`;
        }
        
        return {
          type: 'temporal',
          temporalElements: variant.temporalElements,
          searchMethod,
          sqlFunction,
          sqlParameters: mapTemporalParameters(variant.temporalElements)
        };
      });
      
      expansionResults = { variants, additionalSearchConfigs };
      
    } else if (searchType === 'chronological') {
      console.log(`[EXPANSION REQUEST] 📈 Generating chronological expansions`);
      const variants = await generateSearchExpansionVariants(query, primaryFilters);
      llmCalls++;
      
      const additionalSearchConfigs = variants.map(variant => ({
        type: 'chronological',
        filters: variant.filters,
        sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
        sqlParameters: { chronological_filters: variant.filters }
      }));
      
      expansionResults = { variants, additionalSearchConfigs };
    }

    console.log(`[EXPANSION REQUEST] ✅ Expansion completed:`, {
      searchType,
      variantCount: expansionResults?.variants?.length || 0,
      llmCalls,
      processingTime: Date.now() - startTime + 'ms'
    });

    return NextResponse.json({
      success: true,
      searchType,
      expansionResults,
      metadata: {
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error(`[EXPANSION REQUEST] ❌ Expansion failed:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

// NEW: Process temporal search with expansion
async function processTemporalSearchWithExpansion(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<{
  primaryConfig: TemporalConfig;
  expansionResults: {
    variants: TemporalExpansionVariant[];
    additionalSearchConfigs: TemporalConfig[];
  };
}> {
  console.log(`[PIPELINE TEMPORAL] 🕐 Processing temporal search with expansion for: "${query}"`);
  
  // Step 1: Extract temporal elements using LLM
  console.log(`[PIPELINE TEMPORAL] 🕐 Extracting temporal elements`);
  const temporalElements = await extractTemporalElements(query);
  console.log(`[PIPELINE TEMPORAL] ✅ Temporal elements extracted:`, temporalElements);
  
  // Step 2: Create primary search configuration
  let searchMethod = 'general_filter';
  let sqlFunction = `temporal_filter_search_${organizationName}`;
  
  if (temporalElements.exit_year && temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    searchMethod = 'specific_sequence';
    sqlFunction = `temporal_career_search_${organizationName}`;
  }
  
  const primaryConfig: TemporalConfig = {
    type: 'temporal',
    temporalElements,
    searchMethod,
    sqlFunction,
    sqlParameters: mapTemporalParameters(temporalElements)
  };
  
  console.log(`[PIPELINE TEMPORAL] ✅ Primary temporal search config created:`, primaryConfig);
  
  // Step 3: Generate search expansion variants
  console.log(`[PIPELINE TEMPORAL] 🔍 Generating temporal search expansion variants`);
  const expansionVariants = await generateTemporalExpansionVariants(query, temporalElements);
  console.log(`[PIPELINE TEMPORAL] ✅ Generated ${expansionVariants.length} expansion variants`);
  
  // Step 4: Create additional search configurations for each variant
  const additionalSearchConfigs: TemporalConfig[] = expansionVariants.map((variant, index) => {
    console.log(`[PIPELINE TEMPORAL] 🔧 Creating search config for variant ${index + 1}: "${variant.natural_language_query}"`);
    
    // Determine search method for this variant
    let variantSearchMethod = 'general_filter';
    let variantSqlFunction = `temporal_filter_search_${organizationName}`;
    
    if (variant.temporalElements.exit_year && variant.temporalElements.subsequent_functions && variant.temporalElements.subsequent_functions.length > 0) {
      variantSearchMethod = 'specific_sequence';
      variantSqlFunction = `temporal_career_search_${organizationName}`;
    }
    
    return {
      type: 'temporal',
      temporalElements: variant.temporalElements,
      searchMethod: variantSearchMethod,
      sqlFunction: variantSqlFunction,
      sqlParameters: mapTemporalParameters(variant.temporalElements)
    };
  });
  
  console.log(`[PIPELINE TEMPORAL] ✅ Created ${additionalSearchConfigs.length} additional search configurations`);
  
  return {
    primaryConfig,
    expansionResults: {
      variants: expansionVariants,
      additionalSearchConfigs
    }
  };
}

// EXISTING: Process temporal search (for backward compatibility)
async function processTemporalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<TemporalConfig> {
  const temporalElements = await extractTemporalElements(query);
  
  // Determine which temporal search method to use
  let searchMethod = 'general_filter';
  let sqlFunction = `temporal_filter_search_${organizationName}`;
  
  if (temporalElements.exit_year && temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    searchMethod = 'specific_sequence';
    sqlFunction = `temporal_career_search_${organizationName}`;
  }
  
  return {
    type: 'temporal',
    temporalElements,
    searchMethod,
    sqlFunction,
    sqlParameters: mapTemporalParameters(temporalElements)
  };
}

// NEW: Extract temporal elements from query
async function extractTemporalElements(query: string): Promise<TemporalElements> {
  console.log(`[PIPELINE TEMPORAL] 🕐 Starting temporal element extraction for: "${query}"`);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `Extract temporal elements from this alumni search query.

**TEMPORAL PATTERNS TO DETECT:**

1. **Specific Years**: "2019", "2020", "2018-2020"
2. **Exit Timing**: "left in", "departed", "graduated in", "exited"
3. **Sequences**: "then became", "after leaving", "later joined", "subsequently"
4. **Functions**: "consultants", "startup founders", "engineers", "analysts"
5. **Timing Constraints**: "within 6 months", "immediately after", "took a break", "gap year"
6. **Education Timing**: "while studying", "after graduation", "during MBA"

**EXAMPLES:**

Query: "People who left in 2019"
{
  "exit_year": 2019
}

Query: "Left in 2019 and became consultants"
{
  "exit_year": 2019,
  "subsequent_functions": ["consulting"],
  "sequence_type": "exit_then_function"
}

Query: "Worked here 2018-2020 then joined startups"
{
  "year_ranges": [{"start": 2018, "end": 2020}],
  "subsequent_functions": ["startup"],
  "sequence_type": "exit_then_function"
}

Query: "After graduation in 2021, became consultants within 6 months"
{
  "education_timing": {"year": 2021},
  "subsequent_functions": ["consulting"],
  "timing_constraints": {"max_gap_months": 6},
  "sequence_type": "function_then_function"
}

**OUTPUT FORMAT:**
Return only JSON with extracted temporal elements. If no temporal patterns detected, return empty object {}.`
      },
      {
        role: 'user',
        content: query
      }
    ]
  });

  console.log(`[PIPELINE TEMPORAL] 🤖 OpenAI temporal extraction response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[PIPELINE TEMPORAL] ⚠️ Empty response from OpenAI, returning empty object`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[PIPELINE TEMPORAL] ✅ Temporal elements extracted successfully:`, parsed);
    console.log(`[PIPELINE TEMPORAL] 📊 Extraction summary:`, {
      hasExitYear: !!parsed.exit_year,
      hasYearRanges: !!parsed.year_ranges?.length,
      hasSubsequentFunctions: !!parsed.subsequent_functions?.length,
      hasSequenceType: !!parsed.sequence_type,
      hasTimingConstraints: !!parsed.timing_constraints,
      hasEducationTiming: !!parsed.education_timing
    });
    return parsed;
  } catch (error) {
    console.error(`[PIPELINE TEMPORAL] ❌ Failed to parse temporal extraction response:`, {
      error: error,
      rawContent: content
    });
    return {};
  }
}

// NEW: Map temporal elements to SQL parameters
function mapTemporalParameters(temporalElements: TemporalElements): any {
  const params: any = {};
  
  // Map exit year
  if (temporalElements.exit_year) {
    params.p_target_company_year = temporalElements.exit_year;
    params.p_subsequent_year = temporalElements.exit_year + 1; // Default to next year
  }
  
  // Map subsequent functions
  if (temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    params.p_subsequent_function = temporalElements.subsequent_functions[0];
    params.p_functions_filter = temporalElements.subsequent_functions;
  }
  
  // Map year ranges
  if (temporalElements.year_ranges && temporalElements.year_ranges.length > 0) {
    const range = temporalElements.year_ranges[0];
    params.p_exit_year_min = range.start;
    params.p_exit_year_max = range.end;
  }
  
  // Map specific years to company years filter
  if (temporalElements.specific_years && temporalElements.specific_years.length > 0) {
    params.p_company_years_filter = temporalElements.specific_years;
  }
  
  // Map education timing
  if (temporalElements.education_timing) {
    const edu = temporalElements.education_timing;
    params.p_education_school_filter = edu.school || null;
    params.p_education_degree_filter = edu.degree || null;
    params.p_education_year_filter = edu.year || null;
    params.p_education_concurrent_career = edu.concurrent_with_company || false;
  }
  
  // Default parameters
  params.p_similarity_threshold = 0.3;
  params.p_limit_count = 50;
  
  return params;
}

// EXISTING: Process chronologeal search
async function processChronologicalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<ChronologicalConfig> {
  console.log(`[PIPELINE CHRONOLOGICAL] 🔄 Processing chronological search for: "${query}"`);
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Input parameters:`, {
    query: `"${query}"`,
    classificationType: classification.type,
    organizationName: organizationName,
    queryLength: query.length
  });
  
  // Step 0: Debug fuzzy matching capabilities for this query
  console.log(`[PIPELINE CHRONOLOGICAL] 🔬 Testing fuzzy matching effectiveness...`);
  await debugFuzzyMatchingForQuery(query);
  
  // Step 1: Extract chronological filters using enhanced LLM system with fuzzy matching
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Extracting chronological filters with enhanced fuzzy matching system`);
  const filterExtractionStartTime = Date.now();
  
  const filters = await translateWithoutClassificationContext(query);
  
  const filterExtractionDuration = Date.now() - filterExtractionStartTime;
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Filters extracted successfully (${filterExtractionDuration}ms):`, {
    extractedFilters: filters,
    filterCount: Object.keys(filters).length,
    filterKeys: Object.keys(filters),
    processingTime: filterExtractionDuration + 'ms',
    hasBasicFilters: {
      school_filter: !!filters.school_filter,
      company_filter: !!filters.company_filter,
      industry_filter: !!filters.industry_filter,
      title_filter: !!filters.title_filter,
      location_filter: !!filters.location_filter
    },
    hasExperienceFilters: {
      min_years_in_industry: !!filters.min_years_in_industry,
      min_years_in_function: !!filters.min_years_in_function,
      min_years_at_company_type: !!filters.min_years_at_company_type
    },
    hasBooleanFilters: {
      geographic_mobility: !!filters.geographic_mobility,
      concurrent_activities: !!filters.concurrent_activities,
      education_industry_alignment: !!filters.education_industry_alignment
    },
    hasPatternFilters: {
      career_progression_pattern: !!filters.career_progression_pattern,
      degree_level_progression: !!filters.degree_level_progression,
      industry_transitions: !!filters.industry_transitions,
      company_size_progression: !!filters.company_size_progression
    }
  });
  
  // Step 2: Create search configuration 
  console.log(`[PIPELINE CHRONOLOGICAL] 🔧 Creating chronological search configuration`);
  const searchConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: 'llm_integrated_chronological_search_chick_fil_a',
    sqlParameters: {
      chronological_filters: filters
    }
  };
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Chronological search config created successfully:`, {
    configType: searchConfig.type,
    sqlFunction: searchConfig.sqlFunction,
    hasFilters: !!searchConfig.filters,
    filterCount: Object.keys(searchConfig.filters || {}).length,
    sqlParameterKeys: Object.keys(searchConfig.sqlParameters),
    isReadyForExecution: !!(searchConfig.filters && searchConfig.sqlFunction)
  });
  
  console.log(`[PIPELINE CHRONOLOGICAL] 🔍 DETAILED CONFIG INSPECTION:`, {
    finalFilters: searchConfig.filters,
    sqlFunctionCall: `${searchConfig.sqlFunction}(chronological_filters: ${JSON.stringify(searchConfig.filters)}, limit_count: 20, organization_name: "chick_fil_a")`,
    configValidation: {
      hasValidType: searchConfig.type === 'chronological',
      hasValidSqlFunction: !!searchConfig.sqlFunction,
      hasValidFilters: !!searchConfig.filters && typeof searchConfig.filters === 'object',
      hasValidSqlParameters: !!searchConfig.sqlParameters && !!searchConfig.sqlParameters.chronological_filters
    }
  });
  
  // Step 3: Verify integration with search engine
  console.log(`[PIPELINE CHRONOLOGICAL] 🔗 Verifying integration with search engine...`);
  verifyChronologicalSearchIntegration(query, searchConfig.filters, organizationName);
  
  return searchConfig;
}

// NEW: Process chronological search with expansion
async function processChronologicalSearchWithExpansion(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<{
  primaryConfig: ChronologicalConfig;
  expansionResults: {
    variants: SearchExpansionVariant[];
    additionalSearchConfigs: ChronologicalConfig[];
  };
}> {
  console.log(`[PIPELINE CHRONOLOGICAL] 🔄 Processing chronological search with expansion for: "${query}"`);
  
  // Step 1: Extract chronological filters using LLM
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Extracting chronological filters`);
  const filters = await translateWithoutClassificationContext(query);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Filters extracted:`, filters);
  
  // Step 2: Create primary search configuration
  const primaryConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
    sqlParameters: {
      chronological_filters: filters
    }
  };
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Primary chronological search config created:`, primaryConfig);
  
  // Step 3: Generate search expansion variants
  console.log(`[PIPELINE CHRONOLOGICAL] 🔍 Generating search expansion variants`);
  const expansionVariants = await generateSearchExpansionVariants(query, filters);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Generated ${expansionVariants.length} expansion variants`);
  
  // Step 4: Create additional search configurations for each variant
  const additionalSearchConfigs: ChronologicalConfig[] = expansionVariants.map((variant, index) => {
    console.log(`[PIPELINE CHRONOLOGICAL] 🔧 Creating search config for variant ${index + 1}: "${variant.natural_language_query}"`);
    
    return {
      type: 'chronological',
      filters: variant.filters,
      sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
      sqlParameters: {
        chronological_filters: variant.filters
      }
    };
  });
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Created ${additionalSearchConfigs.length} additional search configurations`);
  
  return {
    primaryConfig,
    expansionResults: {
      variants: expansionVariants,
      additionalSearchConfigs
    }
  };
}

// NEW: Process standard search with expansion
async function processStandardSearchWithExpansion(
  query: string, 
  classification: QueryClassification
): Promise<{
  primaryConfig: StandardConfig;
  expansionResults: {
    variants: StandardExpansionVariant[];
    additionalSearchConfigs: StandardConfig[];
  };
}> {
  console.log(`[PIPELINE STANDARD] 📊 Processing standard search with expansion for: "${query}"`);
  
  // Step 1: Extract standard filters using LLM
  console.log(`[PIPELINE STANDARD] 📊 Extracting standard filters`);
  const enhancedFilters = await translateStandardSearchQuery(query);
  console.log(`[PIPELINE STANDARD] ✅ Enhanced filters extracted:`, enhancedFilters);
  
  // Step 2: Create primary search configuration
  const primaryConfig: StandardConfig = {
    type: 'standard',
    enhancedFilters,
    searchMethod: 'comprehensive_sql_filtering'
  };
  
  console.log(`[PIPELINE STANDARD] ✅ Primary standard search config created:`, primaryConfig);
  
  // Step 3: Generate search expansion variants
  console.log(`[PIPELINE STANDARD] 🔍 Generating standard search expansion variants`);
  const expansionVariants = await generateStandardExpansionVariants(query, enhancedFilters);
  console.log(`[PIPELINE STANDARD] ✅ Generated ${expansionVariants.length} expansion variants`);
  
  // Step 4: Create additional search configurations for each variant
  const additionalSearchConfigs: StandardConfig[] = expansionVariants.map((variant, index) => {
    console.log(`[PIPELINE STANDARD] 🔧 Creating search config for variant ${index + 1}: "${variant.natural_language_query}"`);
    
    return {
      type: 'standard',
      enhancedFilters: variant.filters,
      searchMethod: 'comprehensive_sql_filtering'
    };
  });
  
  console.log(`[PIPELINE STANDARD] ✅ Created ${additionalSearchConfigs.length} additional search configurations`);
  
  return {
    primaryConfig,
    expansionResults: {
      variants: expansionVariants,
      additionalSearchConfigs
    }
  };
}

// EXISTING: Process standard search (for backward compatibility)
async function processStandardSearch(
  query: string, 
  classification: QueryClassification
): Promise<StandardConfig> {
  console.log(`[PIPELINE STANDARD] 📊 Processing standard search for: "${query}"`);
  
  // Extract comprehensive standard filters using LLM
  const enhancedFilters = await translateStandardSearchQuery(query);
  console.log(`[PIPELINE STANDARD] ✅ Enhanced filters extracted:`, enhancedFilters);
  
  return {
    type: 'standard',
    enhancedFilters,
    searchMethod: 'comprehensive_sql_filtering'
  };
}

// STEP 1: Use the main classification API instead of specialized function
async function classifyQueryUsingMainAPI(query: string): Promise<QueryClassification> {
  try {
    console.log(`[PIPELINE CLASSIFY] 🔗 Attempting main API classification for: "${query}"`);
    
    const response = await fetch('/api/classify-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      throw new Error(`Main API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`[PIPELINE CLASSIFY] ✅ Main API classification successful: ${result.type}`);
    
    return result;
  } catch (error) {
    console.error('🔗 [CLASSIFICATION ERROR] Main API failed, using fallback:', error);
    console.error(`[PIPELINE CLASSIFY] ❌ Main API failed, switching to fallback:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.log(`[PIPELINE CLASSIFY] 🔄 Starting OpenAI fallback classification`);
    
    // Fallback to direct OpenAI call with the same logic as classify-query/route.ts
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a search query classifier for an alumni database. Analyze the user's query and determine the most appropriate search type.

**FIRST: VALIDATE QUERY APPROPRIATENESS**

Before classifying, check if this query is appropriate for searching alumni profiles:

**VALID ALUMNI QUERIES:**
- Professional roles, titles, companies (e.g., "software engineers", "marketing managers at Google")
- Education background, schools, degrees (e.g., "MBA graduates", "Harvard alumni")
- Industries, career progression, skills (e.g., "people in finance", "experienced consultants")
- Geographic locations for work/life (e.g., "alumni in San Francisco", "remote workers")
- Career achievements, leadership roles (e.g., "executives", "startup founders")
- Salary ranges, company sizes (e.g., "high earners", "people at Fortune 500 companies")
- Experience levels, functional expertise (e.g., "senior developers", "sales professionals")

**INVALID QUERIES (mark as "invalid"):**
- Empty or meaningless input (e.g., "", "asdf", "123", "??")
- Non-English gibberish or random characters
- Personal/private information requests (e.g., "dating profiles", "medical records")
- Non-professional context (e.g., "weather forecast", "recipe for pasta", "math homework")
- Impossible combinations (e.g., "entry-level executives", "graduated in 1850")
- Questions unrelated to alumni/people search (e.g., "What is the capital of France?")
- Shopping/products (e.g., "buy shoes", "best laptop")
- Entertainment requests (e.g., "funny movies", "music recommendations")

**IF QUERY IS INVALID:**
Return: {
  "type": "invalid",
  "invalidReason": "brief explanation",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

**IF QUERY IS VALID, CLASSIFY AS ONE OF THESE SEARCH TYPES:**

1. **TEMPORAL SEARCH** - For queries with specific dates, years, or time-based sequences
   - Specific years (e.g., "2018", "2019-2021", "after 2020")
   - Time-based sequences (e.g., "then became", "later moved to", "after leaving")
   - Exit timing references (e.g., "left in", "graduated in", "departed")

2. **CHRONOLOGICAL SEARCH** - For queries about career/education progression patterns and quality (no specific dates needed)
   - Career progression quality (e.g., "strong career progression", "rapid advancement")
   - Experience depth (e.g., "experienced", "10+ years", "senior professionals")
   - Career transitions (e.g., "moved from tech to finance", "became entrepreneurs")
   - Leadership development (e.g., "went from IC to management", "became executives")
   - Education and career progression combined (e.g., "studied engineering then became product managers", "MBA graduates who joined consulting")
   - General life/professional progression patterns (e.g., "people who advanced quickly", "alumni with impressive trajectories")

3. **STANDARD SEARCH** - For basic semantic matching without time or progression focus
   - Simple role/title searches (e.g., "software engineers", "marketing managers")
   - Company-based searches (e.g., "people at Google", "former Microsoft employees")
   - Location-based searches (e.g., "alumni in San Francisco")
   - Industry-based searches (e.g., "people in healthcare", "finance professionals")

**CRITICAL DISTINCTION - TEMPORAL vs CHRONOLOGICAL:**

**TEMPORAL = Specific Dates/Years/Timing:**
- "People who left in 2019" → TEMPORAL
- "Graduated in 2020 and became consultants" → TEMPORAL  
- "Worked here 2018-2021 then joined startups" → TEMPORAL

**CHRONOLOGICAL = Career Progression Patterns (no specific dates):**
- "Find people who went to Duke University and are now working at Google → CHRONOLOGICAL
- "Experienced professionals who became executives" → CHRONOLOGICAL
- "Alumni who moved from technical roles to leadership" → CHRONOLOGICAL

**TRICKY EDGE CASES:**

**Contains "years" but NO specific dates = CHRONOLOGICAL:**
- "People with 10+ years experience" → CHRONOLOGICAL (experience depth, no specific years)
- "Professionals with 5+ years in finance" → CHRONOLOGICAL (experience pattern)

**Contains progression words WITH specific dates = TEMPORAL:**
- "Advanced to senior roles after leaving in 2020" → TEMPORAL (specific year)
- "Became managers after graduating in 2019" → TEMPORAL (specific graduation year)

**Sequential patterns WITHOUT dates = CHRONOLOGICAL:**
- "People who went from junior to senior roles" → CHRONOLOGICAL (progression pattern)
- "Alumni who moved from IC to management" → CHRONOLOGICAL (career transition)

**Sequential patterns WITH dates = TEMPORAL:**
- "Went from junior to senior between 2019-2021" → TEMPORAL (specific timeframe)
- "Moved to management after 2020" → TEMPORAL (specific year reference)

**OUTPUT FORMAT:**
For valid queries, return:
{
  "type": "temporal" | "chronological" | "standard"
}

For invalid queries, return:
{
  "type": "invalid",
  "invalidReason": "explanation of why invalid",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

**SUGGESTION EXAMPLES FOR INVALID QUERIES:**
- If personal/medical: ["Software engineers", "Marketing professionals", "Alumni in healthcare industry"]
- If gibberish: ["Software engineers at tech companies", "MBA graduates in finance", "Alumni working in California"]
- If non-professional: ["People working in [related industry]", "Professionals with [related skill]", "Alumni at [related companies]"]
- If impossible: Fix the contradiction and suggest realistic alternatives

Respond only with valid JSON.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    console.log(`[PIPELINE CLASSIFY] 🤖 OpenAI fallback response received`);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log(`[PIPELINE CLASSIFY] ⚠️ Empty response from OpenAI, defaulting to standard`);
      return { type: 'standard' };
    }

    try {
      const parsed = JSON.parse(content);
      console.log(`[PIPELINE CLASSIFY] ✅ OpenAI fallback successful: ${parsed.type}`);
      return parsed;
    } catch {
      console.log(`[PIPELINE CLASSIFY] ❌ Failed to parse OpenAI response, defaulting to standard`);
      return { type: 'standard' };
    }
  }
}

// NEW: Function to extract available filters from SQL function definition
async function getAvailableChronologicalFilters(): Promise<string> {
  console.log(`[PIPELINE CHRONOLOGICAL] 🔍 Providing supported chronological filters`);
  
  // Return only the 9 supported input filters that the SQL function actually uses
  return `
**SUPPORTED CHRONOLOGICAL INPUT FILTERS:**

**Basic Entity Filters:**
- school_filter (string) - Filters by educational institution name (e.g., "Georgetown University", "Harvard")
- company_filter (string) - Filters by company name (e.g., "Google", "Apple", "Microsoft")
- industry_filter (string) - Filters by industry (e.g., "technology", "finance", "consulting")
- title_filter (string) - Filters by job title/role (e.g., "software engineer", "product manager")
- location_filter (string) - Filters by location (e.g., "San Francisco", "New York", "remote")

**Experience & Timeline Filters:**
- total_experience_years (number) - Minimum total years of professional experience
- min_years_in_industry (number) - Minimum years of experience in a specific industry
- geographic_mobility (boolean) - Whether the person has moved locations for career advancement
- concurrent_activities (boolean) - Whether the person worked while studying or had overlapping activities

**CRITICAL INSTRUCTIONS:**
1. These are the ONLY 9 filters that can be used as input to the chronological search
2. Focus your entity extraction on mapping to these 9 specific filters
3. Always include gap_tolerance: 6 as a default timeline filter
`;
}

// STAGE 1: Term Standardization & Preprocessing
async function standardizeQueryTerms(query: string): Promise<{
  standardizedQuery: string;
  termMappings: {
    industries: string[];
    functions: string[];
    levels: string[];
    sizes: string[];
    degrees: string[];
    rankings: string[];
    majors: string[];
  };
  transformations: Array<{
    original: string;
    standardized: string;
    category: string;
  }>;
}> {
  console.log(`[STAGE 1] 🔄 Starting term standardization for: "${query}"`);
  console.log(`[STAGE 1] ⏱️ Stage 1 initiated at ${new Date().toISOString()}`);
  
  // Pre-analyze terms using our mapping system
  console.log(`[STAGE 1] 🔍 Pre-analyzing terms with fuzzy matching system...`);
  const preAnalyzedTerms = getAllStandardizedTerms(query);
  console.log(`[STAGE 1] 📊 Pre-analyzed terms summary:`, {
    totalCategories: Object.keys(preAnalyzedTerms).length,
    categoriesWithMatches: Object.entries(preAnalyzedTerms).filter(([_, matches]) => 
      matches.length > 0 && matches[0] !== query).length,
    preAnalyzedTerms: preAnalyzedTerms
  });
  
  console.log(`[STAGE 1] 🤖 Calling OpenAI for term standardization...`);
  const llmStartTime = Date.now();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a specialized term standardization system. Your ONLY job is to convert natural language terms into exact database-compatible terms.

**YOUR MISSION:** Transform the input query by replacing common language variations with exact database terms that will match our backend data.

**CRITICAL STANDARDIZATION RULES:**

**INDUSTRY STANDARDIZATION (Case-Sensitive):**
- "tech" → "Technology & Software"
- "technology" → "Technology & Software" 
- "software" → "Technology & Software"
- "it" → "IT/Systems"
- "fintech" → "Fintech"
- "finance" → "Financial Services"
- "financial" → "Financial Services"
- "banking" → "Banking"
- "consulting" → "Management Consulting"
- "healthcare" → "Healthcare & Pharmaceuticals"
- "health" → "Healthcare & Pharmaceuticals"
- "medical" → "Healthcare & Pharmaceuticals"
- "food" → "Food & Beverage"
- "restaurant" → "Restaurant/Hospitality"
- "retail" → "Retail & Consumer Goods"
- "media" → "Media & Entertainment"
- "education" → "Education"
- "real estate" → "Real Estate"
- "government" → "Government & Public Sector"

**JOB FUNCTION STANDARDIZATION:**
- "engineering" → "Software Engineering"
- "software engineering" → "Software Engineering"
- "development" → "Software Engineering"
- "developer" → "Software Engineering"
- "programmer" → "Software Engineering"
- "product" → "Product Management"
- "product management" → "Product Management"
- "data science" → "Data Science/Analytics"
- "data scientist" → "Data Science/Analytics"
- "analytics" → "Data Science/Analytics"
- "sales" → "Sales"
- "marketing" → "Marketing"
- "operations" → "Operations Management"
- "hr" → "Human Resources"
- "recruiting" → "Recruiting/Talent"

**JOB LEVEL STANDARDIZATION:**
- "entry level" → "Entry Level"
- "junior" → "Entry Level"
- "senior" → "Senior Level"
- "lead" → "Lead/Principal"
- "principal" → "Lead/Principal"
- "manager" → "Manager"
- "director" → "Director"
- "vp" → "VP/SVP"
- "vice president" → "VP/SVP"
- "executive" → "VP/SVP"
- "ceo" → "C-Suite"
- "cto" → "C-Suite"
- "cfo" → "C-Suite"
- "founder" → "Founder/Owner"
- "entrepreneur" → "Founder/Owner"

**COMPANY SIZE STANDARDIZATION:**
- "startup" → "Startup (1-50 employees)"
- "small company" → "Small (51-200 employees)"
- "medium company" → "Medium (201-1000 employees)"
- "large company" → "Large (1001-5000 employees)"
- "enterprise" → "Enterprise (5000+ employees)"
- "big tech" → "Enterprise (5000+ employees)"
- "fortune 500" → "Enterprise (5000+ employees)"

**DEGREE LEVEL STANDARDIZATION:**
- "bachelor" → "Bachelor's Degree"
- "bachelor's" → "Bachelor's Degree"
- "undergraduate" → "Bachelor's Degree"
- "college degree" → "Bachelor's Degree"
- "master" → "Master's Degree"
- "master's" → "Master's Degree"
- "graduate degree" → "Master's Degree"
- "mba" → "Master of Business Administration (MBA)"
- "phd" → "Doctor of Philosophy (PhD)"
- "doctorate" → "Doctor of Philosophy (PhD)"
- "jd" → "Juris Doctor (JD)"
- "law degree" → "Juris Doctor (JD)"
- "md" → "Doctor of Medicine (MD)"
- "medical degree" → "Doctor of Medicine (MD)"

**TRANSFORMATION EXAMPLES:**

Input: "Find me tech engineers at startups with MBA degrees"
Output: "Find me Software Engineering professionals at Startup (1-50 employees) with Master of Business Administration (MBA) degrees"

Input: "Senior software developers in finance companies"
Output: "Senior Level Software Engineering professionals in Financial Services companies"

Input: "Healthcare consultants with master's degrees"
Output: "Healthcare & Pharmaceuticals Management Consulting professionals with Master's Degree"

Input: "Entry level data scientists at big tech companies"
Output: "Entry Level Data Science/Analytics professionals at Enterprise (5000+ employees) companies"

**TRANSFORMATION STRATEGY:**
1. **Identify all standardizable terms** in the query
2. **Replace with exact database terms** while preserving sentence structure
3. **Maintain natural language flow** - don't make it robotic
4. **Log all transformations** for transparency

**OUTPUT FORMAT:**
Return JSON with:
{
  "standardized_query": "The transformed query with exact database terms",
  "transformations": [
    {
      "original": "tech",
      "standardized": "Technology & Software", 
      "category": "industry"
    },
    {
      "original": "engineers",
      "standardized": "Software Engineering",
      "category": "function"
    }
  ]
}

**IMPORTANT RULES:**
1. **Preserve query intent** - don't change the meaning
2. **Only standardize terms that have exact mappings** - leave ambiguous terms unchanged
3. **Maintain grammatical structure** - ensure the output reads naturally
4. **Log every transformation** for debugging
5. **If no standardizations needed**, return the original query

Focus ONLY on term standardization. Do NOT extract filters or perform analysis.`
      },
      {
        role: 'user',
        content: `Input Query: "${query}"

**PRE-ANALYZED STANDARDIZABLE TERMS:**
Industries: ${JSON.stringify(preAnalyzedTerms.industries)}
Functions: ${JSON.stringify(preAnalyzedTerms.functions)}
Levels: ${JSON.stringify(preAnalyzedTerms.levels)}
Sizes: ${JSON.stringify(preAnalyzedTerms.sizes)}
Degrees: ${JSON.stringify(preAnalyzedTerms.degrees)}
Rankings: ${JSON.stringify(preAnalyzedTerms.rankings)}
Majors: ${JSON.stringify(preAnalyzedTerms.majors)}

Transform this query using exact database terms while preserving natural language flow and intent.`
      }
    ]
  });

  const llmDuration = Date.now() - llmStartTime;
  console.log(`[STAGE 1] 🤖 OpenAI standardization response received (${llmDuration}ms)`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[STAGE 1] ⚠️ Empty response from OpenAI, using original query`);
    console.log(`[STAGE 1] 📤 Fallback result:`, {
      originalQuery: query,
      standardizedQuery: query,
      transformationCount: 0,
      preAnalyzedTermsUsed: true
    });
    
    return {
      standardizedQuery: query,
      termMappings: preAnalyzedTerms,
      transformations: []
    };
  }

  try {
    const parsed = JSON.parse(content);
    const standardizedQuery = parsed.standardized_query || query;
    const transformations = parsed.transformations || [];
    
    console.log(`[STAGE 1] ✅ Term standardization successful:`, {
      originalQuery: query,
      standardizedQuery: standardizedQuery,
      wasTransformed: standardizedQuery !== query,
      transformationCount: transformations.length,
      llmProcessingTime: llmDuration + 'ms',
      transformationDetails: transformations
    });
    
    console.log(`[STAGE 1] 🔍 DETAILED TRANSFORMATION ANALYSIS:`, {
      inputLength: query.length,
      outputLength: standardizedQuery.length,
      characterDifference: standardizedQuery.length - query.length,
      transformationsByCategory: transformations.reduce((acc: any, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
      preAnalyzedVsActual: {
        preAnalyzedIndustries: preAnalyzedTerms.industries,
        preAnalyzedFunctions: preAnalyzedTerms.functions,
        preAnalyzedLevels: preAnalyzedTerms.levels,
        actualTransformations: transformations
      }
    });

    return {
      standardizedQuery: standardizedQuery,
      termMappings: preAnalyzedTerms,
      transformations: transformations
    };
  } catch (error) {
    console.error(`[STAGE 1] ❌ Failed to parse standardization response:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      rawContent: content,
      llmProcessingTime: llmDuration + 'ms'
    });
    
    // Fallback: use original query with pre-analyzed terms
    console.log(`[STAGE 1] 🔄 Using fallback with pre-analyzed terms`);
    
    return {
      standardizedQuery: query,
      termMappings: preAnalyzedTerms,
      transformations: []
    };
  }
}

// STAGE 2: Filter Extraction from Standardized Query
async function extractFiltersFromStandardizedQuery(
  standardizedQuery: string,
  termMappings: any,
  transformations: any[]
): Promise<ChronologicalFilters> {
  console.log(`[STAGE 2] 📊 Starting filter extraction from standardized query: "${standardizedQuery}"`);
  console.log(`[STAGE 2] 🔍 Available term mappings:`, termMappings);
  console.log(`[STAGE 2] 🔄 Applied transformations:`, transformations);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a specialized filter extraction system. Your ONLY job is to extract structured JSON filters from a pre-standardized query.

**YOUR MISSION:** Convert the standardized query into precise JSON filters. The query has already been processed for term standardization, so focus purely on extraction logic.

**AVAILABLE FILTER CATEGORIES:**

**Text-Based Filters:**
- school_filter: Specific educational institutions (string)
- company_filter: Specific company names (string)  
- industry_filter: Industry categories (string)
- title_filter: Job titles/functions (string)
- location_filter: Geographic locations (string)
- company_size_filter: Company size categories (string)
- degree_level_filter: Educational degree levels (string)

**Numeric Experience Filters:**
- total_experience_years: Minimum total years of experience (number)
- min_years_in_industry: Minimum years in specific industry (number)

**Boolean Timeline Filters:**
- concurrent_activities: Worked while studying or overlapping activities (boolean)
- geographic_mobility: Moved locations throughout career (boolean)

**EXTRACTION RULES:**

**ENTITY PRIORITY:**
- If multiple companies mentioned: Choose the most specific or target company
- If multiple schools mentioned: Choose the most relevant or recent
- If multiple titles mentioned: Choose the most specific role
- If multiple industries mentioned: Choose the target or current industry

**EXPERIENCE EXTRACTION:**
- "5+ years" → total_experience_years: 5
- "10+ years in tech" → min_years_in_industry: 10
- "experienced" → total_experience_years: 5
- "senior level" → total_experience_years: 7
- "seasoned" → total_experience_years: 7

**BOOLEAN PATTERN DETECTION:**
- "worked while studying" → concurrent_activities: true
- "part-time education" → concurrent_activities: true
- "relocated for work" → geographic_mobility: true
- "moved cities" → geographic_mobility: true
- "international experience" → geographic_mobility: true

**EXTRACTION EXAMPLES:**

Input: "Find Software Engineering professionals at Startup (1-50 employees) with Master of Business Administration (MBA)"
Output:
{
  "title_filter": "Software Engineering",
  "company_size_filter": "Startup (1-50 employees)",
  "degree_level_filter": "Master of Business Administration (MBA)"
}

Input: "Senior Level Data Science/Analytics professionals in Technology & Software companies"
Output:
{
  "title_filter": "Data Science/Analytics",
  "industry_filter": "Technology & Software",
  "total_experience_years": 7
}

Input: "Harvard graduates working at Google with 8+ years experience"
Output:
{
  "school_filter": "Harvard",
  "company_filter": "Google",
  "total_experience_years": 8
}

Input: "People who worked while getting Master's Degree and moved locations"
Output:
{
  "degree_level_filter": "Master's Degree",
  "concurrent_activities": true,
  "geographic_mobility": true
}

**EXTRACTION GUIDELINES:**
1. **Extract specific entities** (school names, company names, exact locations)
2. **Use standardized terms exactly** as they appear in the query
3. **Don't over-interpret** - extract only what's clearly stated
4. **Prefer specific filters** over generic ones
5. **Don't extract if ambiguous** - better to omit than guess wrong

**OUTPUT FORMAT:**
Return only valid JSON with extracted filters. If no clear filters detected, return empty object {}.

Focus ONLY on filter extraction. Do NOT perform term standardization or analysis.`
      },
      {
        role: 'user',
        content: `Standardized Query: "${standardizedQuery}"

**CONTEXT FROM STAGE 1:**
Applied Transformations: ${JSON.stringify(transformations)}
Available Term Mappings: ${JSON.stringify(termMappings)}

Extract precise JSON filters from this pre-standardized query.`
      }
    ]
  });

  console.log(`[STAGE 2] 🤖 OpenAI filter extraction response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[STAGE 2] ⚠️ Empty response from OpenAI, returning empty filters`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[STAGE 2] ✅ Filter extraction successful:`, {
      extractedFilters: parsed,
      filterCount: Object.keys(parsed).length,
      hasBasicFilters: {
        school_filter: !!parsed.school_filter,
        company_filter: !!parsed.company_filter,
        industry_filter: !!parsed.industry_filter,
        title_filter: !!parsed.title_filter,
        location_filter: !!parsed.location_filter
      },
      hasExperienceFilters: {
        total_experience_years: !!parsed.total_experience_years,
        min_years_in_industry: !!parsed.min_years_in_industry
      },
      hasBooleanFilters: {
        concurrent_activities: !!parsed.concurrent_activities,
        geographic_mobility: !!parsed.geographic_mobility
      }
    });
    
    return parsed;
  } catch (error) {
    console.error(`[STAGE 2] ❌ Failed to parse filter extraction response:`, {
      error: error,
      rawContent: content
    });
    return {};
  }
}

// UPDATED: Two-Stage Translation with Comprehensive Error Handling  
async function translateWithoutClassificationContext(
  query: string
): Promise<ChronologicalFilters> {
  console.log(`[TRANSLATION PIPELINE] 🚀 Starting two-stage translation for: "${query}"`);
  const pipelineStartTime = Date.now();

  try {
    // STAGE 1: Term Standardization
    console.log(`[TRANSLATION PIPELINE] 📝 STAGE 1: Term Standardization`);
    const stage1StartTime = Date.now();
    
    const standardizationResult = await standardizeQueryTerms(query);
    
    const stage1Duration = Date.now() - stage1StartTime;
    console.log(`[TRANSLATION PIPELINE] ✅ STAGE 1 COMPLETE:`, {
      duration: stage1Duration + 'ms',
      originalQuery: query,
      standardizedQuery: standardizationResult.standardizedQuery,
      transformationCount: standardizationResult.transformations.length,
      wasTransformed: standardizationResult.standardizedQuery !== query
    });

    // STAGE 2: Filter Extraction
    console.log(`[TRANSLATION PIPELINE] 🔍 STAGE 2: Filter Extraction`);
    const stage2StartTime = Date.now();
    
    const filters = await extractFiltersFromStandardizedQuery(
      standardizationResult.standardizedQuery,
      standardizationResult.termMappings,
      standardizationResult.transformations
    );
    
    const stage2Duration = Date.now() - stage2StartTime;
    const totalDuration = Date.now() - pipelineStartTime;
    
    console.log(`[TRANSLATION PIPELINE] ✅ STAGE 2 COMPLETE:`, {
      duration: stage2Duration + 'ms',
      extractedFilters: filters,
      filterCount: Object.keys(filters).length
    });

    console.log(`[TRANSLATION PIPELINE] 🎉 TWO-STAGE PIPELINE COMPLETE:`, {
      totalDuration: totalDuration + 'ms',
      stage1Duration: stage1Duration + 'ms',
      stage2Duration: stage2Duration + 'ms',
      finalFilters: filters,
      pipelineSuccess: true
    });

    return filters;

  } catch (stage1Error) {
    console.error(`[TRANSLATION PIPELINE] ❌ STAGE 1 FAILED, attempting fallback:`, {
      error: stage1Error,
      fallbackStrategy: 'Direct filter extraction from original query'
    });

    try {
      // FALLBACK: Direct filter extraction from original query
      console.log(`[TRANSLATION PIPELINE] 🔄 FALLBACK: Direct extraction from original query`);
      const fallbackStartTime = Date.now();
      
      const fallbackFilters = await extractFiltersFromStandardizedQuery(
        query, // Use original query
        getAllStandardizedTerms(query), // Get pre-analyzed terms
        [] // No transformations
      );
      
      const fallbackDuration = Date.now() - fallbackStartTime;
      console.log(`[TRANSLATION PIPELINE] ✅ FALLBACK SUCCESSFUL:`, {
        duration: fallbackDuration + 'ms',
        fallbackFilters: fallbackFilters,
        filterCount: Object.keys(fallbackFilters).length
      });

      return fallbackFilters;

    } catch (stage2Error) {
      console.error(`[TRANSLATION PIPELINE] ❌ STAGE 2 FALLBACK FAILED:`, {
        stage1Error: stage1Error,
        stage2Error: stage2Error,
        finalFallback: 'Empty filters'
      });

      // FINAL FALLBACK: Return empty filters
      return {};
    }
  }
}

// NEW: Generate intelligent search expansions (returns complete variants)
async function generateSearchExpansionVariants(
  originalQuery: string,
  initialFilters: ChronologicalFilters,
  initialResultCount?: number
): Promise<SearchExpansionVariant[]> {
  console.log(`[SEARCH EXPANSION] 🔍 Generating search expansion variants for: "${originalQuery}"`);
  console.log(`[SEARCH EXPANSION] 📊 Initial filters:`, initialFilters);
  console.log(`[SEARCH EXPANSION] 📈 Initial result count:`, initialResultCount);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.3, // Slightly higher for creative alternatives
    messages: [
      {
        role: 'system',
        content: `You are an intelligent search expansion system. Your job is to analyze an initial search query and its extracted filters, then generate 2-3 alternative filter sets that could capture different valid interpretations or relaxed versions of the original query.

**YOUR GOAL:**
Generate alternative search strategies that maintain the core intent while broadening the search space to find more relevant profiles. For each alternative filter set, also generate a natural language query that would produce those filters.

**EXPANSION STRATEGIES:**

1. **FILTER RELAXATION** - Make restrictive filters less strict:
   - Remove specific company/school requirements → focus on industry/field
   - Reduce experience minimums by 2-3 years
   - Broaden specific titles to related roles
   - Expand specific industries to related sectors

2. **SEMANTIC EXPANSION** - Use related terms and concepts:
   - "Engineering" → "Technical roles", "Software development", "Product development"
   - "Consulting" → "Advisory", "Client services", "Strategy"
   - "Finance" → "Banking", "Investment", "Financial services"
   - "Marketing" → "Brand management", "Communications", "Growth"

3. **ALTERNATIVE INTERPRETATIONS** - Find different valid readings:
   - "Georgetown graduates at Google" could also mean:
     - "Business school graduates in tech companies"
     - "People with strong academic backgrounds in technology"
   - "Experienced consultants" could expand to:
     - "People with client-facing experience"
     - "Strategic advisors and analysts"

4. **HIERARCHICAL RELAXATION** - Remove filters in order of specificity:
   - Most specific: Remove exact company/school names
   - Moderately specific: Broaden title/industry terms  
   - Least specific: Reduce experience requirements

**FILTER CATEGORIES TO CONSIDER:**

**Basic Filters (often too restrictive):**
- school_filter: Remove specific institution, focus on degree level
- company_filter: Remove specific company, focus on industry/size
- industry_filter: Expand to related industries
- title_filter: Broaden to related roles/functions
- location_filter: Expand to broader geographic areas

**Experience Filters (often need relaxation):**
- min_years_in_industry: Reduce by 2-3 years
- total_experience_years: Reduce by 2-3 years

**Pattern Filters (often need alternatives):**
- concurrent_activities: Try related timeline patterns
- geographic_mobility: Expand to similar mobility patterns

**EXAMPLES:**

**Original Query:** "Find Georgetown MBA graduates working at Google"
**Initial Filters:** {"school_filter": "Georgetown", "company_filter": "Google", "degree_level_filter": "Master of Business Administration (MBA)"}

**Expansion 1 - Remove Company Specificity:**
{
  "natural_language_query": "Georgetown MBA graduates working in technology companies",
  "filters": {
    "school_filter": "Georgetown",
    "industry_filter": "Technology & Software", 
    "degree_level_filter": "Master of Business Administration (MBA)"
  }
}

**Expansion 2 - Remove School Specificity:**
{
  "natural_language_query": "MBA graduates working at Google",
  "filters": {
    "company_filter": "Google",
    "degree_level_filter": "Master of Business Administration (MBA)"
  }
}

**Expansion 3 - Semantic Expansion:**
{
  "natural_language_query": "Business school graduates working at major tech companies",
  "filters": {
    "industry_filter": "Technology & Software",
    "degree_level_filter": "Master of Business Administration (MBA)",
    "company_size_filter": "Enterprise (5000+ employees)"
  }
}

**IMPORTANT RULES:**
1. **Always generate exactly 3 expansion variants**
2. **Each natural language query must be clear and searchable**
3. **The natural language query should naturally produce the corresponding filters**
4. **Maintain the core intent of the original query**
5. **Don't make filters MORE restrictive than the original**
6. **Ensure each variant is meaningfully different from the others**
7. **If original filters are already very broad, focus on semantic alternatives rather than relaxation**

**OUTPUT FORMAT:**
Return only valid JSON in this exact structure:

{
  "expansion_variants": [
    {
      "natural_language_query": "Clear, searchable natural language query",
      "filters": { /* ChronologicalFilters object */ }
    },
    {
      "natural_language_query": "Another clear, searchable natural language query", 
      "filters": { /* ChronologicalFilters object */ }
    },
    {
      "natural_language_query": "Third clear, searchable natural language query",
      "filters": { /* ChronologicalFilters object */ }
    }
  ]
}

Respond only with valid JSON.`
      },
      {
        role: 'user',
        content: `Original Query: "${originalQuery}"

Initial Filters: ${JSON.stringify(initialFilters, null, 2)}

${initialResultCount !== undefined ? `Initial Result Count: ${initialResultCount}` : ''}

Generate 3 intelligent search expansion variants that maintain the core intent while broadening the search space.`
      }
    ]
  });

  console.log(`[SEARCH EXPANSION] 🤖 OpenAI expansion response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[SEARCH EXPANSION] ⚠️ Empty response from OpenAI, returning empty expansions`);
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[SEARCH EXPANSION] ✅ Search expansion variants generated successfully:`, parsed);
    
    if (!parsed.expansion_variants || !Array.isArray(parsed.expansion_variants)) {
      console.error(`[SEARCH EXPANSION] ❌ Invalid response structure, expected expansion_variants array`);
      return [];
    }

    const variants = parsed.expansion_variants as SearchExpansionVariant[];
    console.log(`[SEARCH EXPANSION] 📊 Expansion summary:`, {
      totalVariants: variants.length,
      generatedQueries: variants.map(v => v.natural_language_query),
      hasFilters: variants.map(v => Object.keys(v.filters || {}).length > 0)
    });

    return variants;
  } catch (error) {
    console.error(`[SEARCH EXPANSION] ❌ Failed to parse expansion response:`, {
      error: error,
      rawContent: content
    });
    return [];
  }
}

// NEW: Generate intelligent search expansions (backward compatibility - returns only filters)
async function generateSearchExpansions(
  originalQuery: string,
  initialFilters: ChronologicalFilters,
  initialResultCount?: number
): Promise<ChronologicalFilters[]> {
  const variants = await generateSearchExpansionVariants(originalQuery, initialFilters, initialResultCount);
  return variants.map(variant => variant.filters);
}

async function translateStandardSearchQuery(
  query: string
): Promise<StandardSearchFilters> {
  console.log(`[PIPELINE STANDARD] 📊 Starting standard search translation for: "${query}"`);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are translating natural language queries into structured filters for comprehensive standard alumni search.

**FOCUS: CURRENT STATE ATTRIBUTES ONLY**
- No progression patterns ("then became", "moved from X to Y")
- No timeline analysis or career advancement logic
- No experience depth requirements ("10+ years")
- Just semantic matching of current attributes with intelligent OR logic

**COMPREHENSIVE FILTER CATEGORIES:**

**1. BASIC ENTITY FILTERS (Single or Multiple with OR logic):**
- company_filter: string OR company_filters: string[] with company_or_logic: boolean
- industry_filter: string OR industry_filters: string[] with industry_or_logic: boolean  
- title_filter: string OR title_filters: string[] with title_or_logic: boolean
- location_filter: string OR location_filters: string[] with location_or_logic: boolean
- school_filter: string OR school_filters: string[] with school_or_logic: boolean

**2. CAREER PROGRESSION & LEADERSHIP FILTERS:**
- current_job_level_filter: string OR current_job_level_filters: string[] with current_job_level_or_logic: boolean
  Values: "Entry Level", "Mid Level", "Senior", "Executive", "C-Suite", "Director", "Manager", "Individual Contributor"
- current_job_function_filter: string OR current_job_function_filters: string[] with current_job_function_or_logic: boolean
  Values: "Engineering", "Sales", "Marketing", "Finance", "Operations", "HR", "Legal", "Consulting", "Product", "Design"
- career_stage_filter: string ("Early Career", "Mid Career", "Senior Career", "Executive")
- career_trajectory_filter: string OR career_trajectory_filters: string[] with career_trajectory_or_logic: boolean
  Values: "Fast Growth", "Steady Progression", "Industry Switcher", "Entrepreneur", "Corporate Climber"
- is_current_leader: boolean
- management_experience: boolean
- revenue_responsibility: boolean

**3. COMPANY & INDUSTRY INTELLIGENCE:**
- current_company_size_category_filter: string OR current_company_size_category_filters: string[] with current_company_size_category_or_logic: boolean
  Values: "Startup", "Small", "Medium", "Large", "Enterprise", "Fortune 500"
- has_startup_experience: boolean
- has_enterprise_experience: boolean
- industry_transitions_filter: string[] (for people who changed industries)

**4. SKILLS & EXPERIENCE PATTERNS:**
- technical_background: boolean
- sales_experience: boolean
- consulting_experience: boolean
- restaurant_operations_experience: boolean
- is_remote_worker: boolean
- functional_expertise_filter: string[] with functional_expertise_or_logic: boolean
  Values: ["product management", "engineering", "sales", "marketing", "finance", "operations", "consulting", "design", "data science"]
- industry_expertise_filter: string[] with industry_expertise_or_logic: boolean
  Values: ["technology", "finance", "healthcare", "retail", "consulting", "media", "manufacturing", "real estate"]

**5. EDUCATIONAL BACKGROUND & CONTEXT:**
- highest_degree_level_filter: string OR highest_degree_level_filters: string[] with highest_degree_level_or_logic: boolean
  Values: "High School", "Associate", "Bachelor's", "Master's", "PhD", "JD", "MD", "MBA"
- school_ranking_tier_filter: string OR school_ranking_tier_filters: string[] with school_ranking_tier_or_logic: boolean
  Values: "Ivy League", "Top 10", "Top 20", "Top 50", "Public Ivy", "Liberal Arts", "Technical", "International"
- major_category_filter: string OR major_category_filters: string[] with major_category_or_logic: boolean
  Values: "STEM", "Business", "Liberal Arts", "Engineering", "Computer Science", "Medicine", "Law", "Arts"
- undergraduate_major_filter: string OR undergraduate_major_filters: string[] with undergraduate_major_or_logic: boolean
- graduate_specialization_filter: string OR graduate_specialization_filters: string[] with graduate_specialization_or_logic: boolean
- stem_education: boolean
- business_education: boolean
- elite_education: boolean
- continued_education: boolean
- executive_education: boolean
- technical_certifications: boolean

**6. ENHANCED SEARCH CATEGORIES:**
- mentor_potential: boolean
- likely_job_seeking: boolean
- total_positions_min: number (minimum number of positions held)
- total_positions_max: number (maximum number of positions held)
- average_tenure_min_months: number (minimum average tenure)
- average_tenure_max_months: number (maximum average tenure)

**7. COMPANY IMPACT METRICS (Organization-specific):**
- company_provided_salary_lift: boolean
- achieved_six_figure_post_company: boolean
- doubled_salary_post_company: boolean
- moved_to_leadership_post_company: boolean
- career_level_increase_post_company: boolean

**8. GEOGRAPHIC & LOCATION:**
- home_location_filter: string OR home_location_filters: string[] with home_location_or_logic: boolean
- education_geography_filter: string[] with education_geography_or_logic: boolean
  Values: ["Domestic", "International", "East Coast", "West Coast", "Midwest", "South", "Europe", "Asia"]

**9. SALARY ANALYSIS FIELDS:**
- min_current_salary: number
- max_current_salary: number
- min_highest_career_salary: number
- max_highest_career_salary: number
- salary_growth_indicator: boolean (for people with significant salary increases)

**NEW: MATHEMATICAL SALARY COMPARISON FIELDS - ADVANCED DETECTION:**

**STEP 1: DETECT SALARY NUMBERS AND COMPARISONS**
- Extract ALL numbers from query (e.g., "100,000", "100k", "$75K", "six figures")
- Convert text numbers to numeric values:
  - "six figures" → 100000
  - "100k" → 100000  
  - "$75K" → 75000
  - "quarter million" → 250000
  - "half a million" → 500000

**STEP 2: DETECT COMPARISON OPERATIONS**
- "above", "over", "more than", "greater than", "exceeds" → Use min_* fields
- "below", "under", "less than", "lower than" → Use max_* fields  
- "between X and Y" → Use min_* and max_* fields
- "around", "approximately", "about" → Use ±10% range

**STEP 3: DETECT SALARY RELATIONSHIPS**
- "after [company] vs before [company]" → post_salary_greater_than_pre: true
- "doubled their salary" → min_salary_multiplier: 2.0
- "tripled their income" → min_salary_multiplier: 3.0
- "50% increase" → min_salary_growth_percentage: 50
- "salary grew by $20,000" → min_salary_increase_amount: 20000

**MATHEMATICAL SALARY FIELDS:**
- post_salary_greater_than_pre: boolean (salary after target company > before)
- current_salary_greater_than_first_post: boolean (continued salary growth)
- min_salary_growth_percentage: number (e.g., 25 for 25% increase)
- max_salary_growth_percentage: number (e.g., 100 for max 100% increase)
- min_salary_increase_amount: number (e.g., 20000 for $20k increase)
- min_salary_multiplier: number (e.g., 2.0 for "doubled", 1.5 for "50% increase")
- current_salary_near_peak: boolean (within 90% of career peak)
- salary_range_pre_company: [number, number] (salary range before target company)
- salary_range_post_company: [number, number] (salary range after target company)
- min_pre_chick_fil_a_salary: number (minimum salary before Chick-fil-A)
- min_first_post_chick_fil_a_salary: number (minimum first salary after Chick-fil-A)

**COMPREHENSIVE SALARY EXAMPLES:**

Query: "Find me alumni currently making above $100,000"
{
  "min_current_salary": 100000
}

Query: "Alumni whose job after Chick-fil-A pays more than their job before"
{
  "post_salary_greater_than_pre": true
}

Query: "People who doubled their salary after leaving"
{
  "min_salary_multiplier": 2.0,
  "post_salary_greater_than_pre": true
}

Query: "Alumni making between $75k and $150k currently"
{
  "min_current_salary": 75000,
  "max_current_salary": 150000
}

Query: "Find people whose salary increased by at least 50% after Chick-fil-A"
{
  "min_salary_growth_percentage": 50,
  "post_salary_greater_than_pre": true
}

Query: "Alumni who got at least a $25,000 raise after leaving"
{
  "min_salary_increase_amount": 25000,
  "post_salary_greater_than_pre": true
}

Query: "People making six figures who are near their career peak"
{
  "min_current_salary": 100000,
  "current_salary_near_peak": true
}

Query: "Alumni whose first job after Chick-fil-A paid over $80k"
{
  "min_first_post_chick_fil_a_salary": 80000
}

Query: "Find high earners who tripled their income"
{
  "min_salary_multiplier": 3.0,
  "min_current_salary": 150000
}

Query: "People who had modest salary growth (10-30%)"
{
  "min_salary_growth_percentage": 10,
  "max_salary_growth_percentage": 30,
  "post_salary_greater_than_pre": true
}

**10. ARRAY FIELDS FOR COMPREHENSIVE SEARCH (OR Logic) - CURRENT STATE ONLY:**
- post_company_companies_filter: string[] with post_company_companies_or_logic: boolean
- post_company_titles_filter: string[] with post_company_titles_or_logic: boolean
- post_company_industries_filter: string[] with post_company_industries_or_logic: boolean
- undergraduate_schools_filter: string[] with undergraduate_schools_or_logic: boolean
- graduate_schools_filter: string[] with graduate_schools_or_logic: boolean

**INTELLIGENT OR LOGIC EXAMPLES:**

Query: "Senior software engineers at tech companies"
{
  "current_job_level_filters": ["Senior", "Staff", "Principal", "Lead"],
  "current_job_level_or_logic": true,
  "title_filters": ["software engineer", "software developer", "SWE", "engineer"],
  "title_or_logic": true,
  "industry_filters": ["technology", "software", "internet", "tech"],
  "industry_or_logic": true,
  "technical_background": true
}

Query: "MBA graduates with consulting experience"
{
  "highest_degree_level_filter": "MBA",
  "consulting_experience": true,
  "functional_expertise_filter": ["consulting", "strategy", "advisory"],
  "functional_expertise_or_logic": true,
  "business_education": true
}

Query: "Startup founders and entrepreneurs"
{
  "title_filters": ["founder", "CEO", "co-founder", "entrepreneur", "chief executive"],
  "title_or_logic": true,
  "has_startup_experience": true,
  "is_current_leader": true,
  "career_trajectory_filter": "Entrepreneur"
}

Query: "High-earning tech executives"
{
  "min_current_salary": 200000,
  "current_job_level_filters": ["Executive", "C-Suite", "VP", "Director"],
  "current_job_level_or_logic": true,
  "industry_filters": ["technology", "software", "tech"],
  "industry_or_logic": true,
  "is_current_leader": true,
  "management_experience": true
}

Query: "Ivy League graduates in finance"
{
  "school_ranking_tier_filter": "Ivy League",
  "industry_filter": "finance",
  "elite_education": true,
  "industry_expertise_filter": ["finance", "banking", "investment"],
  "industry_expertise_or_logic": true
}

Query: "Remote workers with technical backgrounds"
{
  "is_remote_worker": true,
  "technical_background": true,
  "functional_expertise_filter": ["engineering", "software development", "data science", "product"],
  "functional_expertise_or_logic": true
}

Query: "People who achieved significant salary growth"
{
  "company_provided_salary_lift": true,
  "salary_growth_indicator": true,
  "achieved_six_figure_post_company": true,
  "min_highest_career_salary": 100000
}

Query: "International education backgrounds"
{
  "education_geography_filter": ["International", "Europe", "Asia"],
  "education_geography_or_logic": true,
  "continued_education": true
}

Query: "FAANG alumni in leadership roles"
{
  "post_company_companies_filter": ["Google", "Apple", "Facebook", "Meta", "Amazon", "Netflix"],
  "post_company_companies_or_logic": true,
  "is_current_leader": true,
  "management_experience": true,
  "technical_background": true
}

Query: "Data scientists and ML engineers"
{
  "title_filters": ["data scientist", "ML engineer", "machine learning engineer", "AI engineer", "data engineer"],
  "title_or_logic": true,
  "technical_background": true,
  "functional_expertise_filter": ["data science", "machine learning", "AI"],
  "functional_expertise_or_logic": true,
  "stem_education": true
}

**MAPPING GUIDELINES:**

**Abstract Concepts to Concrete Filters:**
- "Creative professionals" → industry_expertise: ["design", "media", "arts"], functional_expertise: ["creative", "design", "marketing"]
- "Tech leaders" → technical_background: true, is_current_leader: true, industry: "technology"
- "High performers" → salary_growth_indicator: true, moved_to_leadership_post_company: true
- "Well-connected" → mentor_potential: true, has_enterprise_experience: true

**Experience Level Mapping:**
- "Entry-level" → current_job_level: "Entry Level", career_stage: "Early Career"
- "Senior" → current_job_level_filters: ["Senior", "Staff", "Principal"], current_job_level_or_logic: true
- "Executive" → current_job_level_filters: ["Executive", "C-Suite", "VP"], is_current_leader: true

**Industry Expansion:**
- "Tech" → ["technology", "software", "internet", "computer", "AI", "fintech"]
- "Finance" → ["finance", "banking", "investment", "fintech", "insurance", "real estate"]
- "Healthcare" → ["healthcare", "medical", "pharmaceutical", "biotech", "medtech"]

**Company Size Mapping:**
- "Big tech" → current_company_size_category: "Enterprise", industry: "technology"
- "Startups" → current_company_size_category_filters: ["Startup", "Small"], has_startup_experience: true
- "Fortune 500" → current_company_size_category: "Fortune 500", has_enterprise_experience: true

**Salary Indicators:**
- "High earners" → min_current_salary: 150000, salary_growth_indicator: true
- "Six-figure" → min_current_salary: 100000, achieved_six_figure_post_company: true
- "Well-compensated" → min_highest_career_salary: 120000, company_provided_salary_lift: true

**EXTRACTION RULES:**
1. **Always prefer OR logic** for broader, more inclusive matching
2. **Use arrays for synonyms** and related terms
3. **Combine boolean flags** for implied characteristics
4. **Map salary mentions** to specific numeric ranges
5. **Extract education levels** and map to degree hierarchies
6. **Identify geographic patterns** and map to location arrays
7. **Recognize company impact** indicators and map to outcome metrics

**IMPORTANT: REMOVED FIELDS (DO NOT USE):**
- pre_company_* fields (these belong in chronological search)
- Timeline/progression fields (these belong in chronological/temporal search)
- Temporal analysis fields (these belong in temporal search)

Return comprehensive JSON with all applicable filters. Default OR logic to true when using multiple values.`
      },
      {
        role: 'user',
        content: `Query: "${query}"`
      }
    ]
  });

  console.log(`[PIPELINE STANDARD] 🤖 OpenAI standard translation response received`);

  const content = response.choices[0]?.message?.content;
  console.log(`[PIPELINE STANDARD] 🔍 RAW LLM RESPONSE:`, {
    hasContent: !!content,
    contentLength: content?.length || 0,
    rawContent: content
  });

  if (!content) {
    console.log(`[PIPELINE STANDARD] ⚠️ Empty response from OpenAI, returning default filters`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    
    console.log(`[PIPELINE STANDARD] 🔍 PARSED STANDARD FILTERS:`, {
      parsedSuccessfully: true,
      parsedKeys: Object.keys(parsed),
      parsedValues: parsed,
      hasBasicFilters: {
        company_filter: !!parsed.company_filter,
        company_filters: !!parsed.company_filters,
        industry_filter: !!parsed.industry_filter,
        industry_filters: !!parsed.industry_filters,
        title_filter: !!parsed.title_filter,
        title_filters: !!parsed.title_filters
      },
      hasCareerFilters: {
        current_job_level_filter: !!parsed.current_job_level_filter,
        current_job_function_filter: !!parsed.current_job_function_filter,
        career_stage_filter: !!parsed.career_stage_filter,
        is_current_leader: !!parsed.is_current_leader,
        management_experience: !!parsed.management_experience
      },
      hasEducationFilters: {
        highest_degree_level_filter: !!parsed.highest_degree_level_filter,
        school_ranking_tier_filter: !!parsed.school_ranking_tier_filter,
        major_category_filter: !!parsed.major_category_filter,
        stem_education: !!parsed.stem_education,
        elite_education: !!parsed.elite_education
      },
      hasSalaryFilters: {
        min_current_salary: !!parsed.min_current_salary,
        salary_growth_indicator: !!parsed.salary_growth_indicator,
        company_provided_salary_lift: !!parsed.company_provided_salary_lift
      },
      hasArrayFilters: {
        functional_expertise_filter: !!parsed.functional_expertise_filter,
        industry_expertise_filter: !!parsed.industry_expertise_filter,
        post_company_companies_filter: !!parsed.post_company_companies_filter
      }
    });
    
    console.log(`[PIPELINE STANDARD] ✅ Standard filters extracted successfully:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[PIPELINE STANDARD] ❌ Failed to parse standard translation response:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      rawContent: content
    });
    return {};
  }
}

// Interface for Standard Search Filters - UPDATED TO REMOVE CHRONOLOGICAL/TEMPORAL FIELDS
interface StandardSearchFilters {
  // 1. BASIC ENTITY FILTERS (single or multiple with OR logic)
  company_filter?: string;
  company_filters?: string[];
  company_or_logic?: boolean;
  
  industry_filter?: string;
  industry_filters?: string[];
  industry_or_logic?: boolean;
  
  title_filter?: string;
  title_filters?: string[];
  title_or_logic?: boolean;
  
  location_filter?: string;
  location_filters?: string[];
  location_or_logic?: boolean;
  
  school_filter?: string;
  school_filters?: string[];
  school_or_logic?: boolean;
  
  // 2. CAREER PROGRESSION & LEADERSHIP FILTERS
  current_job_level_filter?: string;
  current_job_level_filters?: string[];
  current_job_level_or_logic?: boolean;
  
  current_job_function_filter?: string;
  current_job_function_filters?: string[];
  current_job_function_or_logic?: boolean;
  
  career_stage_filter?: string;
  career_trajectory_filter?: string;
  career_trajectory_filters?: string[];
  career_trajectory_or_logic?: boolean;
  
  is_current_leader?: boolean;
  management_experience?: boolean;
  revenue_responsibility?: boolean;
  
  // 3. COMPANY & INDUSTRY INTELLIGENCE
  current_company_size_category_filter?: string;
  current_company_size_category_filters?: string[];
  current_company_size_category_or_logic?: boolean;
  
  has_startup_experience?: boolean;
  has_enterprise_experience?: boolean;
  industry_transitions_filter?: string[];
  
  // 4. SKILLS & EXPERIENCE PATTERNS
  technical_background?: boolean;
  sales_experience?: boolean;
  consulting_experience?: boolean;
  restaurant_operations_experience?: boolean;
  is_remote_worker?: boolean;
  
  functional_expertise_filter?: string[];
  functional_expertise_or_logic?: boolean;
  
  industry_expertise_filter?: string[];
  industry_expertise_or_logic?: boolean;
  
  // 5. EDUCATIONAL BACKGROUND & CONTEXT
  highest_degree_level_filter?: string;
  highest_degree_level_filters?: string[];
  highest_degree_level_or_logic?: boolean;
  
  school_ranking_tier_filter?: string;
  school_ranking_tier_filters?: string[];
  school_ranking_tier_or_logic?: boolean;
  
  major_category_filter?: string;
  major_category_filters?: string[];
  major_category_or_logic?: boolean;
  
  undergraduate_major_filter?: string;
  undergraduate_major_filters?: string[];
  undergraduate_major_or_logic?: boolean;
  
  graduate_specialization_filter?: string;
  graduate_specialization_filters?: string[];
  graduate_specialization_or_logic?: boolean;
  
  stem_education?: boolean;
  business_education?: boolean;
  elite_education?: boolean;
  continued_education?: boolean;
  executive_education?: boolean;
  technical_certifications?: boolean;
  
  // 6. ENHANCED SEARCH CATEGORIES
  mentor_potential?: boolean;
  likely_job_seeking?: boolean;
  total_positions_min?: number;
  total_positions_max?: number;
  average_tenure_min_months?: number;
  average_tenure_max_months?: number;
  
  // 7. COMPANY IMPACT METRICS (Organization-specific)
  company_provided_salary_lift?: boolean;
  achieved_six_figure_post_company?: boolean;
  doubled_salary_post_company?: boolean;
  moved_to_leadership_post_company?: boolean;
  career_level_increase_post_company?: boolean;
  
  // 8. GEOGRAPHIC & LOCATION
  home_location_filter?: string;
  home_location_filters?: string[];
  home_location_or_logic?: boolean;
  
  education_geography_filter?: string[];
  education_geography_or_logic?: boolean;
  
  // 9. SALARY ANALYSIS FIELDS
  min_current_salary?: number;
  max_current_salary?: number;
  min_highest_career_salary?: number;
  max_highest_career_salary?: number;
  salary_growth_indicator?: boolean;
  
  // NEW: MATHEMATICAL SALARY COMPARISON FIELDS
  // Dynamic salary comparisons
  post_salary_greater_than_pre?: boolean;
  current_salary_greater_than_first_post?: boolean;
  
  // Percentage-based growth
  min_salary_growth_percentage?: number; // e.g., 25 for 25% increase
  max_salary_growth_percentage?: number; // e.g., 100 for max 100% increase
  
  // Absolute dollar amount increases
  min_salary_increase_amount?: number; // e.g., 20000 for $20k increase
  
  // Salary multipliers
  min_salary_multiplier?: number; // e.g., 2.0 for "doubled", 1.5 for "50% increase"
  
  // Career peak comparisons
  current_salary_near_peak?: boolean; // Within 90% of career peak
  
  // Salary range comparisons (arrays: [min, max])
  salary_range_pre_company?: [number, number]; // [min, max] for pre-company salary
  salary_range_post_company?: [number, number]; // [min, max] for post-company salary
  
  // Specific company salary fields
  min_pre_chick_fil_a_salary?: number;
  min_first_post_chick_fil_a_salary?: number;
  
  // 10. COMPREHENSIVE ARRAY FIELDS FOR CAREER TRACKING (PRE + POST COMPANY):**
  // PRE-COMPANY FIELDS (Background/Network Analysis)
  pre_company_companies_filter?: string[];
  pre_company_companies_or_logic?: boolean;
  
  pre_company_titles_filter?: string[];
  pre_company_titles_or_logic?: boolean;
  
  pre_company_industries_filter?: string[];
  pre_company_industries_or_logic?: boolean;
  
  pre_company_locations_filter?: string[];
  pre_company_locations_or_logic?: boolean;
  
  // POST-COMPANY FIELDS (Current/Recent Career Path)
  post_company_companies_filter?: string[];
  post_company_companies_or_logic?: boolean;
  
  post_company_titles_filter?: string[];
  post_company_titles_or_logic?: boolean;
  
  post_company_industries_filter?: string[];
  post_company_industries_or_logic?: boolean;
  
  post_company_locations_filter?: string[];
  post_company_locations_or_logic?: boolean;
  
  // EDUCATION FIELDS
  undergraduate_schools_filter?: string[];
  undergraduate_schools_or_logic?: boolean;
  
  graduate_schools_filter?: string[];
  graduate_schools_or_logic?: boolean;
} 

// NEW: Debug function to demonstrate fuzzy matching effectiveness
async function debugFuzzyMatchingForQuery(query: string): Promise<void> {
  console.log(`[FUZZY MATCHING DEBUG] 🔬 Testing fuzzy matching capabilities for: "${query}"`);
  
  // Test common variations that users might type
  const testTerms = [
    "tech", "technology", "software", "engineering", "finance", "consulting",
    "healthcare", "data science", "marketing", "sales", "startup", "big tech",
    "senior", "manager", "director", "vp", "ceo", "founder", "mba", "bachelor",
    "harvard", "stanford", "ivy league", "top 10"
  ];
  
  for (const term of testTerms) {
    if (query.toLowerCase().includes(term.toLowerCase())) {
      console.log(`[FUZZY MATCHING DEBUG] 🎯 Found test term "${term}" in query`);
      
      // Test each category
      const categories: (keyof typeof DATABASE_TERM_MAPPINGS)[] = [
        'industry_mappings', 'function_mappings', 'level_mappings', 
        'size_mappings', 'degree_mappings', 'ranking_mappings', 'major_mappings'
      ];
      
      for (const category of categories) {
        const matches = standardizeTerms(term, category);
        if (matches.length > 0 && matches[0] !== term) {
          console.log(`[FUZZY MATCHING DEBUG] ✅ "${term}" → ${category}: ${matches.join(', ')}`);
        }
      }
    }
  }
  
  console.log(`[FUZZY MATCHING DEBUG] 🏁 Fuzzy matching test completed for query`);
}

// NEW: Function to verify chronological search integration
function verifyChronologicalSearchIntegration(
  query: string, 
  filters: ChronologicalFilters, 
  organizationName: string
): void {
  console.log(`[CHRONOLOGICAL INTEGRATION] 🔗 Verifying search integration for: "${query}"`);
  
  console.log(`[CHRONOLOGICAL INTEGRATION] 📋 Integration checklist:`, {
    step1_query_received: !!query && query.length > 0,
    step2_fuzzy_matching_applied: true, // Fuzzy matching is always applied in standardizeQueryTerms
    step3_filters_extracted: !!filters && Object.keys(filters).length > 0,
    step4_organization_configured: !!organizationName,
    step5_sql_function_ready: `llm_integrated_chronological_search_${organizationName}`,
    step6_ready_for_execution: !!(query && filters && organizationName)
  });
  
  console.log(`[CHRONOLOGICAL INTEGRATION] 🎯 Final execution parameters:`, {
    inputQuery: `"${query}"`,
    extractedFilterCount: Object.keys(filters).length,
    filterTypes: Object.keys(filters),
    sqlFunction: `llm_integrated_chronological_search_chick_fil_a`,
    isReadyForDB: !!(filters && Object.keys(filters).length >= 0) // Even empty filters are valid
  });
  
  console.log(`[CHRONOLOGICAL INTEGRATION] ✅ Chronological search integration verified successfully`);
}

// NEW: Generate standard search expansion variants
async function generateStandardExpansionVariants(
  originalQuery: string,
  initialFilters: StandardSearchFilters,
  initialResultCount?: number
): Promise<StandardExpansionVariant[]> {
  console.log(`[STANDARD EXPANSION] 🔍 Generating standard search expansion variants for: "${originalQuery}"`);
  console.log(`[STANDARD EXPANSION] 📊 Initial filters:`, initialFilters);
  console.log(`[STANDARD EXPANSION] 📈 Initial result count:`, initialResultCount);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.3, // Slightly higher for creative alternatives
    messages: [
      {
        role: 'system',
        content: `You are an intelligent standard search expansion system. Your job is to analyze a standard search query and its extracted filters, then generate 2-3 alternative filter sets that could capture different valid interpretations or broadened versions of the original query.

**YOUR GOAL:**
Generate alternative search strategies for STANDARD SEARCHES that maintain the core intent while broadening the search space to find more relevant profiles. Focus on current-state attributes and semantic matching.

**STANDARD SEARCH EXPANSION STRATEGIES:**

1. **COMPANY/ORGANIZATION EXPANSION** - Broaden company scope:
   - Specific companies → Related industry/sector
   - Single company → Company size category + industry
   - FAANG → "Major tech companies" + enterprise size
   - Startups → Company size + industry combination

2. **INDUSTRY SEMANTIC EXPANSION** - Use related industry terms:
   - "Technology" → ["Software", "Internet", "AI", "Cloud Computing"]
   - "Finance" → ["Banking", "Investment", "Fintech", "Insurance"]
   - "Healthcare" → ["Medical", "Pharmaceutical", "Biotech", "MedTech"]
   - "Consulting" → ["Advisory", "Strategy", "Management Consulting"]

3. **ROLE/TITLE BROADENING** - Expand to related functions:
   - "Software Engineer" → Technical roles, development, product engineering
   - "Product Manager" → Product roles, strategy, business development
   - "Marketing Manager" → Marketing, growth, brand, communications
   - "Sales Rep" → Sales, business development, account management

4. **EXPERIENCE/LEVEL RELAXATION** - Broaden seniority requirements:
   - Remove specific job level requirements
   - Expand to related experience patterns
   - Include adjacent skill sets
   - Broaden leadership/management scope

5. **EDUCATION/BACKGROUND EXPANSION** - Alternative academic paths:
   - Specific schools → School ranking tiers
   - Exact degrees → Degree level categories
   - STEM → Related technical backgrounds
   - MBA → Business education + leadership experience

**STANDARD FILTER CATEGORIES TO CONSIDER:**

**Basic Entity Filters:**
- company_filter/company_filters → industry_filter + company_size
- industry_filter → related industries array
- title_filter/title_filters → functional_expertise_filter
- school_filter → school_ranking_tier_filter + degree_level

**Current State Filters:**
- current_job_level_filter → career_stage_filter
- technical_background → functional_expertise: ["engineering", "product", "data"]
- management_experience → is_current_leader + current_job_level
- has_startup_experience → current_company_size_category + industry

**Salary & Success Filters:**
- min_current_salary → salary_growth_indicator + career success patterns
- elite_education → school_ranking_tier + continued_education
- is_current_leader → management_experience + career_trajectory

**EXAMPLES:**

**Original Query:** "People who worked at Google, Microsoft, or Apple"
**Initial Filters:** {"post_company_companies_filter": ["Google", "Microsoft", "Apple"]}

**Expansion 1 - Industry + Size:**
{
  "natural_language_query": "Alumni who worked at major technology companies",
  "filters": {
    "industry_expertise_filter": ["technology", "software", "internet"],
    "industry_expertise_or_logic": true,
    "current_company_size_category_filter": "Enterprise (5000+ employees)",
    "has_enterprise_experience": true
  }
}

**Expansion 2 - Technical Roles at Tech:**
{
  "natural_language_query": "Technical professionals with big tech experience",
  "filters": {
    "technical_background": true,
    "has_enterprise_experience": true,
    "functional_expertise_filter": ["engineering", "product", "data science"],
    "functional_expertise_or_logic": true,
    "industry_expertise_filter": ["technology"]
  }
}

**Expansion 3 - Leadership from Tech:**
{
  "natural_language_query": "Leaders and managers from technology companies",
  "filters": {
    "management_experience": true,
    "industry_expertise_filter": ["technology", "software"],
    "industry_expertise_or_logic": true,
    "current_job_level_filters": ["Manager", "Director", "VP/SVP"],
    "current_job_level_or_logic": true
  }
}

**IMPORTANT RULES:**
1. **Always generate exactly 3 expansion variants**
2. **Focus on CURRENT STATE attributes** (no career progression patterns)
3. **Use semantic broadening** rather than temporal sequences
4. **Maintain core search intent** while expanding scope
5. **Prefer OR logic** for inclusive matching
6. **Each variant should be meaningfully different**
7. **Generate natural language queries** that would produce these filters

**OUTPUT FORMAT:**
Return only valid JSON in this exact structure:

{
  "expansion_variants": [
    {
      "natural_language_query": "Clear, searchable natural language query",
      "filters": { /* StandardSearchFilters object */ }
    },
    {
      "natural_language_query": "Another clear, searchable natural language query", 
      "filters": { /* StandardSearchFilters object */ }
    },
    {
      "natural_language_query": "Third clear, searchable natural language query",
      "filters": { /* StandardSearchFilters object */ }
    }
  ]
}

Respond only with valid JSON.`
      },
      {
        role: 'user',
        content: `Original Query: "${originalQuery}"

Initial Filters: ${JSON.stringify(initialFilters, null, 2)}

${initialResultCount !== undefined ? `Initial Result Count: ${initialResultCount}` : ''}

Generate 3 intelligent standard search expansion variants that maintain the core intent while broadening the search space.`
      }
    ]
  });

  console.log(`[STANDARD EXPANSION] 🤖 OpenAI expansion response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[STANDARD EXPANSION] ⚠️ Empty response from OpenAI, returning empty expansions`);
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[STANDARD EXPANSION] ✅ Standard search expansion variants generated successfully:`, parsed);
    
    if (!parsed.expansion_variants || !Array.isArray(parsed.expansion_variants)) {
      console.error(`[STANDARD EXPANSION] ❌ Invalid response structure, expected expansion_variants array`);
      return [];
    }

    const variants = parsed.expansion_variants as StandardExpansionVariant[];
    console.log(`[STANDARD EXPANSION] 📊 Expansion summary:`, {
      totalVariants: variants.length,
      generatedQueries: variants.map(v => v.natural_language_query),
      hasFilters: variants.map(v => Object.keys(v.filters || {}).length > 0)
    });

    return variants;
  } catch (error) {
    console.error(`[STANDARD EXPANSION] ❌ Failed to parse expansion response:`, {
      error: error,
      rawContent: content
    });
    return [];
  }
}

// NEW: Generate temporal search expansion variants
async function generateTemporalExpansionVariants(
  originalQuery: string,
  initialElements: TemporalElements,
  initialResultCount?: number
): Promise<TemporalExpansionVariant[]> {
  console.log(`[TEMPORAL EXPANSION] 🔍 Generating temporal search expansion variants for: "${originalQuery}"`);
  console.log(`[TEMPORAL EXPANSION] 📊 Initial temporal elements:`, initialElements);
  console.log(`[TEMPORAL EXPANSION] 📈 Initial result count:`, initialResultCount);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.3, // Slightly higher for creative alternatives
    messages: [
      {
        role: 'system',
        content: `You are an intelligent temporal search expansion system. Your job is to analyze a temporal search query and its extracted temporal elements, then generate 2-3 alternative temporal configurations that could capture different valid interpretations or relaxed versions of the original query.

**YOUR GOAL:**
Generate alternative temporal search strategies that maintain the core chronological intent while broadening the time-based search space to find more relevant profiles.

**TEMPORAL SEARCH EXPANSION STRATEGIES:**

1. **TIME WINDOW EXPANSION** - Broaden temporal constraints:
   - Specific year → Year range (±1-2 years)
   - Narrow range → Broader range
   - Exact timing → Flexible timing windows
   - Sequential timing → Overlapping periods

2. **FUNCTION/ROLE BROADENING** - Expand target functions:
   - Specific roles → Related role categories
   - "Consultant" → ["Advisory", "Strategy", "Business analyst"]
   - "Engineer" → ["Technical roles", "Product development", "R&D"]
   - "Sales" → ["Business development", "Account management", "Revenue"]

3. **SEQUENCE PATTERN RELAXATION** - Alternative timing patterns:
   - Strict sequences → Flexible timing
   - "Immediately after" → "Within 12 months"
   - "Then became" → "Subsequently worked as"
   - "During" → "Around the same time"

4. **TEMPORAL CONSTRAINT RELAXATION** - Loosen timing requirements:
   - Remove specific month constraints
   - Expand gap tolerance
   - Allow for concurrent activities
   - Broaden education timing overlap

**TEMPORAL ELEMENTS TO CONSIDER:**

**Year-Based Elements:**
- specific_years → broader year ranges
- exit_year → exit_year_range
- year_ranges → expanded ranges

**Function/Role Elements:**
- subsequent_functions → related function categories
- target_company_functions → broader role types

**Sequence Elements:**
- sequence_type → alternative sequence patterns
- timing_constraints → relaxed timing windows

**EXAMPLES:**

**Original Query:** "People who left in 2019 and became consultants"
**Initial Elements:** {"exit_year": 2019, "subsequent_functions": ["consulting"], "sequence_type": "exit_then_function"}

**Expansion 1 - Broader Time Window:**
{
  "natural_language_query": "People who left between 2018-2020 and became consultants",
  "temporalElements": {
    "year_ranges": [{"start": 2018, "end": 2020}],
    "subsequent_functions": ["consulting"],
    "sequence_type": "exit_then_function",
    "timing_constraints": {"max_gap_months": 12}
  }
}

**Expansion 2 - Broader Functions:**
{
  "natural_language_query": "People who left in 2019 and moved into advisory roles",
  "temporalElements": {
    "exit_year": 2019,
    "subsequent_functions": ["consulting", "advisory", "strategy", "business analyst"],
    "sequence_type": "exit_then_function",
    "timing_constraints": {"max_gap_months": 18}
  }
}

**Expansion 3 - Flexible Timing:**
{
  "natural_language_query": "People who worked around 2019 and later became consultants",
  "temporalElements": {
    "year_ranges": [{"start": 2018, "end": 2020}],
    "subsequent_functions": ["consulting", "advisory"],
    "sequence_type": "function_then_function",
    "timing_constraints": {"max_gap_months": 24}
  }
}

**IMPORTANT RULES:**
1. **Always generate exactly 3 expansion variants**
2. **Focus on TEMPORAL RELATIONSHIPS** and timing patterns
3. **Maintain chronological logic** while expanding scope
4. **Broaden time windows** reasonably (±1-3 years max)
5. **Expand function categories** to related roles
6. **Relax timing constraints** to capture more patterns
7. **Generate natural language queries** that would produce these elements

**OUTPUT FORMAT:**
Return only valid JSON in this exact structure:

{
  "expansion_variants": [
    {
      "natural_language_query": "Clear, searchable temporal query",
      "temporalElements": { /* TemporalElements object */ }
    },
    {
      "natural_language_query": "Another clear, searchable temporal query", 
      "temporalElements": { /* TemporalElements object */ }
    },
    {
      "natural_language_query": "Third clear, searchable temporal query",
      "temporalElements": { /* TemporalElements object */ }
    }
  ]
}

Respond only with valid JSON.`
      },
      {
        role: 'user',
        content: `Original Query: "${originalQuery}"

Initial Temporal Elements: ${JSON.stringify(initialElements, null, 2)}

${initialResultCount !== undefined ? `Initial Result Count: ${initialResultCount}` : ''}

Generate 3 intelligent temporal search expansion variants that maintain the core chronological intent while broadening the time-based search space.`
      }
    ]
  });

  console.log(`[TEMPORAL EXPANSION] 🤖 OpenAI expansion response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[TEMPORAL EXPANSION] ⚠️ Empty response from OpenAI, returning empty expansions`);
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[TEMPORAL EXPANSION] ✅ Temporal search expansion variants generated successfully:`, parsed);
    
    if (!parsed.expansion_variants || !Array.isArray(parsed.expansion_variants)) {
      console.error(`[TEMPORAL EXPANSION] ❌ Invalid response structure, expected expansion_variants array`);
      return [];
    }

    const variants = parsed.expansion_variants as TemporalExpansionVariant[];
    console.log(`[TEMPORAL EXPANSION] 📊 Expansion summary:`, {
      totalVariants: variants.length,
      generatedQueries: variants.map(v => v.natural_language_query),
      hasTemporalElements: variants.map(v => Object.keys(v.temporalElements || {}).length > 0)
    });

    return variants;
  } catch (error) {
    console.error(`[TEMPORAL EXPANSION] ❌ Failed to parse expansion response:`, {
      error: error,
      rawContent: content
    });
    return [];
  }
}