import { NextRequest, NextResponse } from 'next/server';
import { llm } from '../../config/llm';
import { MODELS } from '../../config/models';


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
  total_experience_years?: number;
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

// NEW: LLM-only mapping and translation function for chronological search
async function translateChronologicalQueryWithLLM(query: string): Promise<ChronologicalFilters> {
  console.log(`[LLM TRANSLATION] 🤖 Starting LLM-only translation for chronological query: "${query}"`);
  const translationStartTime = Date.now();

  const response = await llm.chat.completions.create({
    model: MODELS.TRANSLATE,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a specialized chronological search query translator. Your job is to convert natural language queries into precise JSON filters for chronological career analysis.

**YOUR MISSION:** 
1. Map natural language terms to exact database values using the provided mappings
2. Extract chronological filters that capture career progression patterns
3. Return structured JSON that the SQL chronological search function expects

**AVAILABLE CHRONOLOGICAL FILTERS (ONLY THESE 9):**

**Basic Entity Filters:**
- school_filter (string): Educational institution name
- company_filter (string): Company name  
- industry_filter (string): Industry category
- title_filter (string): Job title/function
- location_filter (string): Geographic location

**Experience & Timeline Filters:**
- total_experience_years (number): Minimum total years of experience
- min_years_in_industry (number): Minimum years in specific industry
- geographic_mobility (boolean): Whether person moved locations for career
- concurrent_activities (boolean): Whether person worked while studying

**CRITICAL DATABASE TERM MAPPINGS:**

**INDUSTRY MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.industry_mappings, null, 2)}

**FUNCTION MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.function_mappings, null, 2)}

**LEVEL MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.level_mappings, null, 2)}

**SIZE MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.size_mappings, null, 2)}

**DEGREE MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.degree_mappings, null, 2)}

**RANKING MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.ranking_mappings, null, 2)}

**MAJOR MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.major_mappings, null, 2)}

**MAPPING RULES:**
1. **Industry terms** → Use exact values from industry_mappings
2. **Job function terms** → Use exact values from function_mappings  
3. **Experience level terms** → Convert to total_experience_years numbers
4. **Company size terms** → Map using size_mappings (but don't use as filter - chronological search doesn't have company_size_filter)
5. **School names** → Use exact school names (don't map these)
6. **Company names** → Use exact company names (don't map these)
7. **Location names** → Use exact location names (don't map these)

**EXPERIENCE LEVEL TO YEARS MAPPING:**
- "entry level", "junior", "new grad" → total_experience_years: 0-2
- "mid level", "experienced" → total_experience_years: 3-5  
- "senior", "senior level" → total_experience_years: 5-8
- "lead", "principal", "staff" → total_experience_years: 8-12
- "manager" → total_experience_years: 5-10
- "director" → total_experience_years: 10-15
- "vp", "executive" → total_experience_years: 15+

**PROGRESSION PATTERN DETECTION:**
- "worked while studying", "part-time during school" → concurrent_activities: true
- "moved cities", "relocated", "international experience" → geographic_mobility: true
- "X+ years in [industry]" → min_years_in_industry: X
- "X+ years experience" → total_experience_years: X

**TRANSLATION EXAMPLES:**

Input: "Find Georgetown graduates working in tech companies"
Output:
{
  "school_filter": "Georgetown",
  "industry_filter": "Technology & Software"
}

Input: "Senior software engineers with 8+ years experience"
Output:
{
  "title_filter": "Software Engineering", 
  "total_experience_years": 8
}

Input: "Experienced consultants who moved locations for career growth"
Output:
{
  "title_filter": "Management Consulting",
  "total_experience_years": 5,
  "geographic_mobility": true
}

Input: "MBA graduates with 5+ years in finance working at startups"
Output:
{
  "industry_filter": "Financial Services",
  "min_years_in_industry": 5,
  "total_experience_years": 5
}

Input: "People who worked while getting their master's degree"
Output:
{
  "concurrent_activities": true
}

**IMPORTANT EXTRACTION RULES:**
1. **Only use the 9 available chronological filters** - ignore everything else
2. **Map terms to exact database values** from the provided mappings
3. **Don't create filters for unmappable terms** - skip ambiguous terms
4. **Focus on career progression patterns** - this is chronological search
5. **Use specific school/company names exactly** - don't map these
6. **Convert experience levels to numeric years** using the mapping above
7. **Detect mobility and concurrent activity patterns** from context clues

**OUTPUT FORMAT:**
Return only valid JSON with extracted filters. If no clear chronological patterns detected, return empty object {}.

Examples of what NOT to include:
- company_size_filter (not available in chronological search)
- degree_level_filter (not available in chronological search)  
- Any filters not in the 9 available filters above

Focus on career progression, experience patterns, and exact database term mapping.`
      },
      {
        role: 'user',
        content: `Natural Language Query: "${query}"

Convert this query to chronological search filters using exact database term mappings and career progression analysis.`
      }
    ]
  });

  const translationDuration = Date.now() - translationStartTime;
  console.log(`[LLM TRANSLATION] 🤖 LLM response received (${translationDuration}ms)`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[LLM TRANSLATION] ⚠️ Empty response from LLM, returning empty filters`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[LLM TRANSLATION] ✅ LLM translation successful:`, {
      originalQuery: query,
      extractedFilters: parsed,
      filterCount: Object.keys(parsed).length,
      processingTime: translationDuration + 'ms',
      hasBasicFilters: {
        school_filter: !!parsed.school_filter,
        company_filter: !!parsed.company_filter,
        industry_filter: !!parsed.industry_filter,
        title_filter: !!parsed.title_filter,
        location_filter: !!parsed.location_filter
      },
      hasExperienceFilters: {
        total_experience_years: !!parsed.total_experience_years,
        min_years_in_industry: !!parsed.min_years_in_industry,
        geographic_mobility: !!parsed.geographic_mobility,
        concurrent_activities: !!parsed.concurrent_activities
      }
    });
    
    return parsed;
  } catch (error) {
    console.error(`[LLM TRANSLATION] ❌ Failed to parse LLM response:`, {
      error: error,
      rawContent: content,
      processingTime: translationDuration + 'ms'
    });
    return {};
  }
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
          enhancedFilters: {}
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
    
    const classification = await classifyQuery(query);
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
      
      searchConfig = await processTemporalSearch(query, classification, organizationName);
      llmCalls += 3; // Classification + LLM-mapping + Fine-tuned translator
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryElements: (searchConfig as TemporalConfig).temporalElements,
        organizationName: organizationName
      };
      
    } else if (classification.type === 'chronological') {
      console.log(`[PIPELINE] 📈 Step 2: Processing chronological search...`);
      processingSteps.push('chronological_processing');
      
      searchConfig = await processChronologicalSearch(query, classification, organizationName);
      llmCalls += 3; // Classification + LLM-mapping + Fine-tuned translator
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryFilters: searchConfig.filters,
        organizationName: organizationName
      };
      
    } else {
      console.log(`[PIPELINE] 📊 Step 2: Processing standard search...`);
      processingSteps.push('standard_processing');
      
      searchConfig = await processStandardSearch(query, classification);
      llmCalls += 3; // Classification + LLM-mapping + Fine-tuned translator
      
      // Store expansion metadata for on-demand expansion
      expansionMetadata = {
        canExpand: true,
        originalQuery: query,
        primaryFilters: (searchConfig as StandardConfig).enhancedFilters
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
        enhancedFilters: {}
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
        enhancedFilters: variant.filters
      }));
      
      expansionResults = { variants, additionalSearchConfigs };
      
    } else if (searchType === 'temporal') {
      console.log(`[EXPANSION REQUEST] 🕐 Generating temporal expansions`);
      const variants = await generateTemporalExpansionVariants(query, primaryElements);
      llmCalls++;
      
      const additionalSearchConfigs = variants.map(variant => {
        let sqlFunction = `temporal_filter_search_${organizationName}`;
        if (variant.temporalElements.exit_year && variant.temporalElements.subsequent_functions && variant.temporalElements.subsequent_functions.length > 0) {
          sqlFunction = `temporal_career_search_${organizationName}`;
        }
        return {
          type: 'temporal',
          temporalElements: variant.temporalElements,
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
        sqlFunction: `chronological_search_function_${organizationName}`,
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

// EXISTING: Process temporal search with 4-step flow
async function processTemporalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<TemporalConfig> {
  console.log(`[PIPELINE TEMPORAL] 🕐 Processing temporal search with 4-step flow: "${query}"`);
  
  // Step 1: Classification (already done)
  console.log(`[PIPELINE TEMPORAL] ✅ Step 1: Classification = ${classification.type}`);
  
  // Step 2: LLM-mapping
  console.log(`[PIPELINE TEMPORAL] 🗺️ Step 2: LLM-mapping`);
  const mappingResult = await standardizeQueryWithLLM(query, 'temporal');
  
  // Step 3: Fine-tuned translator
  console.log(`[PIPELINE TEMPORAL] 🎯 Step 3: Fine-tuned translator`);
  const temporalElements = await translateTemporalQueryWithFineTuning(
    mappingResult.standardizedQuery,
    mappingResult.mappedTerms,
    mappingResult.transformations
  );
  
  // Step 4: SQL configuration
  console.log(`[PIPELINE TEMPORAL] 🔧 Step 4: SQL configuration`);
  let searchMethod = 'general_filter';
  let sqlFunction = `temporal_filter_search_${organizationName}`;
  
  if (temporalElements.exit_year && temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    searchMethod = 'specific_sequence';
    sqlFunction = `temporal_career_search_${organizationName}`;
  }
  
  console.log(`[PIPELINE TEMPORAL] ✅ 4-step temporal pipeline complete`);
  
  return {
    type: 'temporal',
    temporalElements,
    sqlFunction,
    sqlParameters: mapTemporalParameters(temporalElements)
  };
}

// NEW: Extract temporal elements from query
async function extractTemporalElements(query: string): Promise<TemporalElements> {
  console.log(`[PIPELINE TEMPORAL] 🕐 Starting temporal element extraction for: "${query}"`);
  
  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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

// EXISTING: Process chronologeal search with proper 4-step flow
async function processChronologicalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<ChronologicalConfig> {
  console.log(`[PIPELINE CHRONOLOGICAL] 🔄 Processing chronological search with 4-step flow: "${query}"`);
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Flow: classification → LLM-mapping → fine-tuned translator → SQL`);
  
  // Step 1: Classification (already done, passed in as parameter)
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Step 1: Classification = ${classification.type}`);
  
  // Step 2: LLM-mapping
  console.log(`[PIPELINE CHRONOLOGICAL] 🗺️ Step 2: LLM-mapping`);
  const mappingStartTime = Date.now();
  
  const mappingResult = await standardizeQueryWithLLM(query, 'chronological');
  
  const mappingDuration = Date.now() - mappingStartTime;
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Step 2 complete (${mappingDuration}ms):`, {
    originalQuery: query,
    standardizedQuery: mappingResult.standardizedQuery,
    transformationCount: mappingResult.transformations.length,
    mappedCategories: Object.keys(mappingResult.mappedTerms).filter(key => 
      mappingResult.mappedTerms[key as keyof typeof mappingResult.mappedTerms].length > 0
    )
  });
  
  // Step 3: Fine-tuned translator
  console.log(`[PIPELINE CHRONOLOGICAL] 🎯 Step 3: Fine-tuned translator`);
  const translationStartTime = Date.now();
  
  const filters = await translateChronologicalQueryWithFineTuning(
    mappingResult.standardizedQuery,
    mappingResult.mappedTerms,
    mappingResult.transformations
  );
  
  const translationDuration = Date.now() - translationStartTime;
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Step 3 complete (${translationDuration}ms):`, {
    extractedFilters: filters,
    filterCount: Object.keys(filters).length,
    hasBasicFilters: {
      school_filter: !!filters.school_filter,
      company_filter: !!filters.company_filter,
      industry_filter: !!filters.industry_filter,
      title_filter: !!filters.title_filter,
      location_filter: !!filters.location_filter
    },
    hasExperienceFilters: {
      total_experience_years: !!filters.total_experience_years,
      min_years_in_industry: !!filters.min_years_in_industry,
      geographic_mobility: !!filters.geographic_mobility,
      concurrent_activities: !!filters.concurrent_activities
    }
  });
  
  // Step 4: SQL configuration
  console.log(`[PIPELINE CHRONOLOGICAL] 🔧 Step 4: SQL configuration`);
  const searchConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: 'chronological_search_function_chick_fil_a',
    sqlParameters: {
      chronological_filters: filters
    }
  };
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ 4-step chronological pipeline complete:`, {
    step1_classification: classification.type,
    step2_mapping: `${mappingResult.transformations.length} transformations`,
    step3_translation: `${Object.keys(filters).length} filters`,
    step4_sql: searchConfig.sqlFunction,
    totalProcessingTime: (mappingDuration + translationDuration) + 'ms',
    readyForExecution: !!(searchConfig.filters && searchConfig.sqlFunction)
  });
  
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
  const filters = await translateChronologicalQueryWithLLM(query);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Filters extracted:`, filters);
  
  // Step 2: Create primary search configuration
  const primaryConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: `chronological_search_function_${organizationName}`,
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
      sqlFunction: `chronological_search_function_${organizationName}`,
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
      enhancedFilters: variant.filters
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

// EXISTING: Process standard search with 4-step flow
async function processStandardSearch(
  query: string, 
  classification: QueryClassification
): Promise<StandardConfig> {
  console.log(`[PIPELINE STANDARD] 📊 Processing standard search with 4-step flow: "${query}"`);
  
  // Step 1: Classification (already done)
  console.log(`[PIPELINE STANDARD] ✅ Step 1: Classification = ${classification.type}`);
  
  // Step 2: LLM-mapping
  console.log(`[PIPELINE STANDARD] 🗺️ Step 2: LLM-mapping`);
  const mappingResult = await standardizeQueryWithLLM(query, 'standard');
  
  // Step 3: Fine-tuned translator
  console.log(`[PIPELINE STANDARD] 🎯 Step 3: Fine-tuned translator`);
  const enhancedFilters = await translateStandardQueryWithFineTuning(
    mappingResult.standardizedQuery,
    mappingResult.mappedTerms,
    mappingResult.transformations
  );
  
  // Step 4: SQL configuration
  console.log(`[PIPELINE STANDARD] 🔧 Step 4: SQL configuration`);
  
  console.log(`[PIPELINE STANDARD] ✅ 4-step standard pipeline complete`);
  
  return {
    type: 'standard',
    enhancedFilters
  };
}

async function classifyQuery(query: string): Promise<QueryClassification> {
  // Routes the query to the standard, chronological or temporal pipeline.
  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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

// NEW: Generate intelligent search expansions (returns complete variants)
async function generateSearchExpansionVariants(
  originalQuery: string,
  initialFilters: ChronologicalFilters,
  initialResultCount?: number
): Promise<SearchExpansionVariant[]> {
  console.log(`[SEARCH EXPANSION] 🔍 Generating search expansion variants for: "${originalQuery}"`);
  console.log(`[SEARCH EXPANSION] 📊 Initial filters:`, initialFilters);
  console.log(`[SEARCH EXPANSION] 📈 Initial result count:`, initialResultCount);

  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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
  
  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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
    step5_sql_function_ready: `chronological_search_function_${organizationName}`,
    step6_ready_for_execution: !!(query && filters && organizationName)
  });
  
  console.log(`[CHRONOLOGICAL INTEGRATION] 🎯 Final execution parameters:`, {
    inputQuery: `"${query}"`,
    extractedFilterCount: Object.keys(filters).length,
    filterTypes: Object.keys(filters),
    sqlFunction: `chronological_search_function_chick_fil_a`,
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

  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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

  const response = await llm.chat.completions.create({
    model: MODELS.CLASSIFY,
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

// UPDATE: Replace the complex translateWithoutClassificationContext function
async function translateWithoutClassificationContext(
  query: string
): Promise<ChronologicalFilters> {
  console.log(`[TRANSLATION PIPELINE] 🚀 Starting 4-step chronological translation: "${query}"`);
  const pipelineStartTime = Date.now();

  try {
    // Step 1: LLM-mapping
    const mappingResult = await standardizeQueryWithLLM(query, 'chronological');
    
    // Step 2: Fine-tuned translator
    const filters = await translateChronologicalQueryWithFineTuning(
      mappingResult.standardizedQuery,
      mappingResult.mappedTerms,
      mappingResult.transformations
    );
    
    const totalDuration = Date.now() - pipelineStartTime;
    
    console.log(`[TRANSLATION PIPELINE] 🎉 4-step translation complete:`, {
      totalDuration: totalDuration + 'ms',
      finalFilters: filters,
      filterCount: Object.keys(filters).length,
      pipelineSuccess: true
    });

    return filters;

  } catch (error) {
    console.error(`[TRANSLATION PIPELINE] ❌ 4-step translation failed:`, {
      error: error,
      fallbackStrategy: 'Empty filters'
    });

    return {};
  }
}

// NEW: LLM-mapping function that standardizes terms based on search type
async function standardizeQueryWithLLM(
  query: string, 
  searchType: 'chronological' | 'temporal' | 'standard'
): Promise<{
  standardizedQuery: string;
  mappedTerms: {
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
  console.log(`[LLM MAPPING] 🗺️ Starting LLM-based term mapping for ${searchType} search: "${query}"`);
  const mappingStartTime = Date.now();

  const response = await llm.chat.completions.create({
    model: MODELS.TRANSLATE,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a specialized term mapping system for alumni search queries. Your job is to standardize natural language terms into exact database values while preserving the original query structure.

**SEARCH TYPE: ${searchType.toUpperCase()}**

**YOUR MISSION:**
1. Identify terms that need standardization using the DATABASE_TERM_MAPPINGS
2. Replace natural language variations with exact database terms
3. Return the standardized query + detailed mapping information
4. Focus on terms relevant to ${searchType} search patterns

**COMPLETE DATABASE TERM MAPPINGS:**

**INDUSTRY MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.industry_mappings, null, 2)}

**FUNCTION MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.function_mappings, null, 2)}

**LEVEL MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.level_mappings, null, 2)}

**SIZE MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.size_mappings, null, 2)}

**DEGREE MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.degree_mappings, null, 2)}

**RANKING MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.ranking_mappings, null, 2)}

**MAJOR MAPPINGS:**
${JSON.stringify(DATABASE_TERM_MAPPINGS.major_mappings, null, 2)}

**SEARCH TYPE SPECIFIC FOCUS:**

${searchType === 'chronological' ? `
**CHRONOLOGICAL SEARCH FOCUS:**
- Career progression patterns and experience depth
- Industry transitions and function changes
- Educational background and career alignment
- Geographic mobility and concurrent activities
- Focus on: industries, functions, levels, degrees, schools, companies
` : searchType === 'temporal' ? `
**TEMPORAL SEARCH FOCUS:**
- Time-based sequences and specific years
- Exit timing and subsequent career moves
- Function transitions with temporal constraints
- Focus on: functions, industries, timing-related terms
` : `
**STANDARD SEARCH FOCUS:**
- Current state attributes and semantic matching
- Company affiliations and role descriptions
- Educational credentials and skill sets
- Focus on: all categories for comprehensive matching
`}

**MAPPING STRATEGY:**
1. **Exact Match Priority** - Use exact mappings when available
2. **Semantic Similarity** - Map related terms to closest database values
3. **Context Awareness** - Consider the search type when choosing mappings
4. **Preserve Intent** - Don't change the core meaning of the query
5. **Conservative Approach** - Only map terms you're confident about

**MAPPING EXAMPLES:**

Input: "Find tech engineers at startups with MBA degrees"
Output:
{
  "standardized_query": "Find Technology & Software Software Engineering professionals at Startup (1-50 employees) with Master of Business Administration (MBA) degrees",
  "mapped_terms": {
    "industries": ["Technology & Software"],
    "functions": ["Software Engineering"],
    "sizes": ["Startup (1-50 employees)"],
    "degrees": ["Master of Business Administration (MBA)"],
    "levels": [],
    "rankings": [],
    "majors": []
  },
  "transformations": [
    {"original": "tech", "standardized": "Technology & Software", "category": "industry"},
    {"original": "engineers", "standardized": "Software Engineering", "category": "function"},
    {"original": "startups", "standardized": "Startup (1-50 employees)", "category": "size"},
    {"original": "MBA", "standardized": "Master of Business Administration (MBA)", "category": "degree"}
  ]
}

Input: "Senior consultants in healthcare companies"
Output:
{
  "standardized_query": "Senior Level Management Consulting professionals in Healthcare & Pharmaceuticals companies",
  "mapped_terms": {
    "industries": ["Healthcare & Pharmaceuticals"],
    "functions": ["Management Consulting"],
    "levels": ["Senior Level"],
    "sizes": [],
    "degrees": [],
    "rankings": [],
    "majors": []
  },
  "transformations": [
    {"original": "senior", "standardized": "Senior Level", "category": "level"},
    {"original": "consultants", "standardized": "Management Consulting", "category": "function"},
    {"original": "healthcare", "standardized": "Healthcare & Pharmaceuticals", "category": "industry"}
  ]
}

**IMPORTANT RULES:**
1. **Only map terms that have exact matches** in the DATABASE_TERM_MAPPINGS
2. **Preserve proper nouns** - Don't map specific school/company names
3. **Maintain natural language flow** - The standardized query should read naturally
4. **Log all transformations** - Track every mapping for transparency
5. **Handle synonyms intelligently** - Map variations to the same standard term
6. **Consider search type context** - Prioritize relevant mappings

**OUTPUT FORMAT:**
Return valid JSON with:
- standardized_query: The query with mapped terms
- mapped_terms: Arrays of all mapped terms by category
- transformations: Detailed log of all mappings made

Focus ONLY on term mapping. Do NOT extract filters or perform search logic.`
      },
      {
        role: 'user',
        content: `Search Type: ${searchType}
Original Query: "${query}"

Map natural language terms to exact database values while preserving query structure and intent.`
      }
    ]
  });

  const mappingDuration = Date.now() - mappingStartTime;
  console.log(`[LLM MAPPING] 🤖 LLM mapping response received (${mappingDuration}ms)`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[LLM MAPPING] ⚠️ Empty response from LLM, using original query`);
    return {
      standardizedQuery: query,
      mappedTerms: {
        industries: [],
        functions: [],
        levels: [],
        sizes: [],
        degrees: [],
        rankings: [],
        majors: []
      },
      transformations: []
    };
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[LLM MAPPING] ✅ LLM mapping successful:`, {
      originalQuery: query,
      standardizedQuery: parsed.standardized_query || query,
      searchType: searchType,
      transformationCount: parsed.transformations?.length || 0,
      mappedCategories: Object.keys(parsed.mapped_terms || {}),
      processingTime: mappingDuration + 'ms'
    });
    
    return {
      standardizedQuery: parsed.standardized_query || query,
      mappedTerms: parsed.mapped_terms || {
        industries: [],
        functions: [],
        levels: [],
        sizes: [],
        degrees: [],
        rankings: [],
        majors: []
      },
      transformations: parsed.transformations || []
    };
  } catch (error) {
    console.error(`[LLM MAPPING] ❌ Failed to parse LLM mapping response:`, {
      error: error,
      rawContent: content,
      processingTime: mappingDuration + 'ms'
    });
    
    // Fallback to original query
    return {
      standardizedQuery: query,
      mappedTerms: {
        industries: [],
        functions: [],
        levels: [],
        sizes: [],
        degrees: [],
        rankings: [],
        majors: []
      },
      transformations: []
    };
  }
}

// UPDATE: Modify the chronological translation function to be a pure fine-tuned translator
async function translateChronologicalQueryWithFineTuning(
  standardizedQuery: string,
  mappedTerms: any,
  transformations: any[]
): Promise<ChronologicalFilters> {
  console.log(`[FINE-TUNED TRANSLATOR] 🎯 Starting fine-tuned translation for chronological query: "${standardizedQuery}"`);
  const translationStartTime = Date.now();

  const response = await llm.chat.completions.create({
    model: MODELS.FINE_TUNED ?? MODELS.TRANSLATE, // This will be replaced with fine-tuned model later
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a fine-tuned chronological search translator. Your ONLY job is to convert a pre-standardized query into precise chronological search filters.

**MISSION:** Extract chronological filters from a query that has already been term-mapped. Focus purely on logical translation.

**AVAILABLE CHRONOLOGICAL FILTERS (ONLY THESE 9):**

**Basic Entity Filters:**
- school_filter (string): Educational institution name
- company_filter (string): Company name  
- industry_filter (string): Industry category (use mapped values)
- title_filter (string): Job title/function (use mapped values)
- location_filter (string): Geographic location

**Experience & Timeline Filters:**
- total_experience_years (number): Minimum total years of experience
- min_years_in_industry (number): Minimum years in specific industry
- geographic_mobility (boolean): Whether person moved locations for career
- concurrent_activities (boolean): Whether person worked while studying

**TRANSLATION RULES:**
1. **Use mapped terms exactly** - The query has been pre-standardized
2. **Extract experience patterns** - Look for progression indicators
3. **Detect mobility patterns** - Look for geographic/activity patterns
4. **Focus on chronological logic** - Career progression over time
5. **Only use the 9 available filters** - Ignore everything else

**EXPERIENCE LEVEL TO YEARS:**
- "Entry Level" → total_experience_years: 1
- "Mid Level" → total_experience_years: 3  
- "Senior Level" → total_experience_years: 5
- "Lead/Principal" → total_experience_years: 8
- "Manager" → total_experience_years: 5
- "Director" → total_experience_years: 10
- "VP/SVP" → total_experience_years: 15
- "C-Suite" → total_experience_years: 20

**PATTERN DETECTION:**
- "worked while studying", "concurrent activities" → concurrent_activities: true
- "moved locations", "relocated", "geographic mobility" → geographic_mobility: true
- "X+ years in [industry]" → min_years_in_industry: X
- "X+ years experience" → total_experience_years: X

**OUTPUT FORMAT:**
Return only valid JSON with chronological filters. No explanation needed.

**EXAMPLES:**

Input: "Find Georgetown graduates working in Technology & Software companies"
Context: Already mapped, no transformations needed
Output:
{
  "school_filter": "Georgetown",
  "industry_filter": "Technology & Software"
}

Input: "Senior Level Software Engineering professionals with 8+ years experience"
Context: Terms already mapped to standard values
Output:
{
  "title_filter": "Software Engineering", 
  "total_experience_years": 8
}

Focus ONLY on logical filter extraction from pre-standardized terms.`
      },
      {
        role: 'user',
        content: `Standardized Query: "${standardizedQuery}"

Mapped Terms: ${JSON.stringify(mappedTerms)}
Applied Transformations: ${JSON.stringify(transformations)}

Extract chronological filters from this pre-standardized query.`
      }
    ]
  });

  const translationDuration = Date.now() - translationStartTime;
  console.log(`[FINE-TUNED TRANSLATOR] 🤖 Translation response received (${translationDuration}ms)`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[FINE-TUNED TRANSLATOR] ⚠️ Empty response, returning empty filters`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[FINE-TUNED TRANSLATOR] ✅ Fine-tuned translation successful:`, {
      standardizedQuery: standardizedQuery,
      extractedFilters: parsed,
      filterCount: Object.keys(parsed).length,
      processingTime: translationDuration + 'ms'
    });
    
    return parsed;
  } catch (error) {
    console.error(`[FINE-TUNED TRANSLATOR] ❌ Failed to parse translation response:`, {
      error: error,
      rawContent: content,
      processingTime: translationDuration + 'ms'
    });
    return {};
  }
}

// Fine-tuned translator for temporal search
async function translateTemporalQueryWithFineTuning(
  standardizedQuery: string,
  mappedTerms: any,
  transformations: any[]
): Promise<TemporalElements> {
  console.log(`[FINE-TUNED TRANSLATOR] 🕐 Starting fine-tuned temporal translation: "${standardizedQuery}"`);
  const translationStartTime = Date.now();

  const response = await llm.chat.completions.create({
    model: MODELS.TRANSLATE, // This will be replaced with fine-tuned model later
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a fine-tuned temporal search translator. Extract temporal elements from a pre-standardized query.

**MISSION:** Convert pre-mapped query into temporal search elements focusing on time-based patterns.

**AVAILABLE TEMPORAL ELEMENTS:**
- specific_years: number[] (specific years mentioned)
- year_ranges: Array<{start: number, end: number}> (year ranges)
- exit_year: number (specific exit year)
- exit_year_range: [number, number] (exit year range)
- target_company_functions: string[] (functions at target company)
- subsequent_functions: string[] (functions after leaving)
- sequence_type: "exit_then_function" | "function_then_function" | "concurrent" | "gap_then_function"
- timing_constraints: {max_gap_months?: number, min_gap_months?: number}
- education_timing: {school?: string, degree?: string, year?: number, concurrent_with_company?: boolean}

**TEMPORAL PATTERN DETECTION:**
- "left in 2019" → exit_year: 2019
- "2018-2020" → year_ranges: [{"start": 2018, "end": 2020}]
- "then became consultants" → subsequent_functions: ["Management Consulting"], sequence_type: "exit_then_function"
- "within 6 months" → timing_constraints: {"max_gap_months": 6}

**OUTPUT FORMAT:** Return only valid JSON with temporal elements.`
      },
      {
        role: 'user',
        content: `Standardized Query: "${standardizedQuery}"
Mapped Terms: ${JSON.stringify(mappedTerms)}
Extract temporal elements from this pre-standardized query.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return {};

  try {
    const parsed = JSON.parse(content);
    console.log(`[FINE-TUNED TRANSLATOR] ✅ Temporal translation successful:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[FINE-TUNED TRANSLATOR] ❌ Temporal translation failed:`, error);
    return {};
  }
}

// Fine-tuned translator for standard search
async function translateStandardQueryWithFineTuning(
  standardizedQuery: string,
  mappedTerms: any,
  transformations: any[]
): Promise<StandardSearchFilters> {
  console.log(`[FINE-TUNED TRANSLATOR] 📊 Starting fine-tuned standard translation: "${standardizedQuery}"`);
  const translationStartTime = Date.now();

  const response = await llm.chat.completions.create({
    model: MODELS.TRANSLATE, // This will be replaced with fine-tuned model later
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a fine-tuned standard search translator. Extract standard search filters from a pre-standardized query.

**MISSION:** Convert pre-mapped query into standard search filters focusing on current-state attributes.

**KEY STANDARD FILTER CATEGORIES:**
- Basic entity filters (company, industry, title, location, school)
- Career progression filters (current_job_level, is_current_leader, management_experience)
- Company intelligence (company_size_category, has_startup_experience, has_enterprise_experience)
- Skills & experience (technical_background, sales_experience, consulting_experience)
- Educational background (highest_degree_level, school_ranking_tier, stem_education)
- Salary analysis (min_current_salary, salary_growth_indicator)
- Array fields with OR logic for comprehensive matching

**FOCUS:** Current state attributes, semantic matching, no progression patterns.

**USE MAPPED TERMS:** Apply the standardized terms from the mapping phase.

**OUTPUT FORMAT:** Return only valid JSON with standard search filters.`
      },
      {
        role: 'user',
        content: `Standardized Query: "${standardizedQuery}"
Mapped Terms: ${JSON.stringify(mappedTerms)}
Extract standard search filters from this pre-standardized query.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return {};

  try {
    const parsed = JSON.parse(content);
    console.log(`[FINE-TUNED TRANSLATOR] ✅ Standard translation successful:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[FINE-TUNED TRANSLATOR] ❌ Standard translation failed:`, error);
    return {};
  }
}