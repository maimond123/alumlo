import requests # Will be replaced by openai
import json
import os # Added for environment variables
import openai # Added for OpenAI API

# --- Configuration ---
# API_ENDPOINT = "http://localhost:3000/api/expand-query" # No longer needed

# Initialize OpenAI Client
# Ensure your OPENAI_API_KEY environment variable is set
try:
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY environment variable not set.")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    print("Please ensure the 'openai' library is installed and OPENAI_API_KEY is set.")
    exit()

# --- More Detailed and Complex Input Queries ---
# These queries are designed to test the API's ability to handle nuance
# and leverage the detailed schema for expansion.
INPUT_QUERIES = [
    "Senior software architects with over 10 years experience in cloud platforms, who previously worked at [Your Organization] and now hold leadership roles in AI-driven startups.",
    "Product VPs in B2C e-commerce companies with a strong background in user growth and retention, and an MBA from an Ivy League school, currently based in San Francisco.",
    "Marketing executives who have successfully launched global campaigns for enterprise software, possess deep expertise in digital strategy, and have a history of achieving significant market share growth after their tenure at [Your Organization].",
    "Data Science leaders specializing in Natural Language Processing, with a PhD and publications in top-tier journals, currently leading teams in the healthcare technology sector and having exited [Your Organization] before 2015.",
    "Investment directors in venture capital firms focusing on Series A/B fintech and blockchain startups, with prior experience as founders or early employees at successful tech companies post-[Your Organization].",
    "Management consultants who transitioned to strategy roles in renewable energy companies, hold a Master's degree in Environmental Science, and have experience managing P&L for major projects.",
    "Operations VPs with a track record of scaling food service chains internationally, strong in supply chain optimization and franchise management, and at least 8 years of post-[Your Organization] experience.",
    "Chief Financial Officers at publicly traded biotech companies, with expertise in M&A, IPO processes, and have previously held finance leadership positions at other large corporations after [Your Organization].",
    "Alumni from [Your Organization] with demonstrated experience in turning around struggling business units, now serving on boards of non-profit organizations focused on education.",
    "Individuals with dual degrees in Engineering and Business, who have founded multiple tech companies, and are known for their thought leadership in sustainable technology, having left [Your Organization] more than 15 years ago.",
    "Human Resources executives who specialized in talent acquisition for hyper-growth tech startups in Europe, with a focus on building diverse and inclusive teams, and have experience implementing global HR policies post-[Your Organization].",
    "Legal counsels specializing in intellectual property for AI companies, with experience in patent litigation and technology licensing, and a background that includes a law degree from a top 20 school and a technical undergraduate degree.",
    "Sales leaders who built and scaled sales teams for cybersecurity firms targeting the financial services industry, consistently exceeding multi-million dollar quotas, and have experience in both North American and APAC markets after [Your Organization].",
    "Alumni who became university professors in Computer Science at R1 institutions, specializing in machine learning ethics, and have published extensively after their industry experience at [Your Organization].",
    "Chief Product Officers who have experience with platform businesses, API product strategy, and have managed globally distributed product teams in companies with over 1000 employees, post-[Your Organization].",
    "Alumni with [Your Organization] experience in restaurant operations who later achieved C-suite roles in non-food service industries.",
    "Early-career alumni (left [Your Organization] < 3 years ago) showing rapid career acceleration in data analytics at tech startups.",
    "Alumni with STEM PhDs who have transitioned into quantitative finance roles at hedge funds after [Your Organization].",
    "Mid-career professionals from [Your Organization] who leveraged their operational expertise to become successful entrepreneurs in logistics and supply chain.",
    "Alumni with significant post-[Your Organization] experience in international development and policy-making at global NGOs."
]

# --- Prompts (Replicated from app/api/expand-query/route.ts) ---

METADATA_SYSTEM_PROMPT = '''You are analyzing a search query for an alumni database to understand its core topic and metadata.

Analyze the query and return a JSON object with:
1. "core_topic": the main subject/focus of the search (what the user is fundamentally looking for)
2. "key_attributes": array of specific characteristics, qualifiers, or filters mentioned
3. "search_dimensions": array of different aspects or dimensions that could be explored related to this topic
4. "context_level": description of how broad or specific the query is

Be dynamic and adaptive - don't force queries into predefined categories. Instead, understand what the user is actually seeking and identify the natural dimensions for expansion.

Examples:
- "People who went to college" → {
    "core_topic": "educational background", 
    "key_attributes": ["college education", "degree holders"], 
    "search_dimensions": ["degree level", "institution type", "field of study", "graduation timing", "academic achievement"], 
    "context_level": "broad educational filter"
  }

- "Senior engineers at tech startups" → {
    "core_topic": "professional role and company context", 
    "key_attributes": ["senior level", "engineering function", "technology sector", "startup environment"], 
    "search_dimensions": ["seniority variations", "technical specializations", "company stages", "industry focus", "team leadership"], 
    "context_level": "specific career and company profile"
  }

- "Alumni living in California" → {
    "core_topic": "geographic location", 
    "key_attributes": ["California residence", "geographic mobility"], 
    "search_dimensions": ["specific cities", "regional preferences", "work arrangements", "relocation patterns", "proximity factors"], 
    "context_level": "broad geographic filter"
  }

Return only the JSON object.'''

def get_expansion_prompt_template():
    return '''You are an expert in crafting advanced search queries for a rich alumni database. Your goal is to help users explore the database thoroughly by generating diverse and insightful related search queries.

Original query: "{query}"

Query analysis from a previous step:
- Core topic: {core_topic}
- Key attributes: {key_attributes}
- Searchable dimensions: {search_dimensions}
- Context: {context_level}

Based on this analysis and the detailed database schema below, generate 3 related search queries. These queries should be **significantly more thorough** and explore different facets of the original query by leveraging the specific data points available.

**Detailed Database Schema Highlights:**

Our alumni database contains comprehensive information, including but not limited to:

1.  **Core Profile:** Name, headline, location, current company, current title, current industry.
2.  **[Your Organization] Specifics:** Exit year from [Your Organization], multiple stints at [Your Organization].
3.  **Career History:** Detailed lists of post-[Your Organization] companies, titles, industries, and locations.
4.  **Education History:** Undergraduate, graduate, high school, and education pursued pre, during, or post-[Your Organization]. Specifics like majors, specializations, and school rankings.
5.  **Career Progression & Leadership:** Job levels (e.g., entry, mid, senior, executive), job functions (e.g., engineering, marketing, operations), leadership indicators (e.g., `is_current_leader`, `management_experience`), revenue responsibility, years since leaving [Your Organization].
6.  **Company & Industry Intelligence:** Current company size (e.g., startup, SME, enterprise), experience in startups vs. enterprise, patterns of industry transitions.
7.  **Skills & Experience:** Indicators for technical backgrounds, sales, consulting, or specific operational experience (e.g., restaurant operations), remote work status, location in major metro areas, total number of positions held, average job tenure.
8.  **Advanced Education Details:** Highest degree obtained, school ranking tiers (e.g., elite, top-tier), STEM vs. business education, continued learning (e.g., executive education, technical certifications).
9.  **Derived Insights:** Career trajectory assessments (e.g., fast-track, specialized), mentor potential, post-[Your Organization] success level, how [Your Organization] experience was leveraged.
10. **[Your Organization]-Specific Career Metrics:** Salary growth post-[Your Organization], career acceleration scores, time to achieve specific salary milestones or management roles, percentages of roles in different functions (operations, management), C-suite achievements.
11. **Targeted Search Categories:** Pre-defined `functional_expertise` (e.g., "Product Management", "Data Science"), `industry_expertise` (e.g., "SaaS", "Healthcare"), current `career_stage` (e.g., "Early Career", "Mid-Career", "Executive"), `likely_job_seeking` status.
12. **Temporal Analysis:** Detailed career timelines, lists of years at [Your Organization], post-[Your Organization] career paths with functions and companies over time.
13. **Natural Language Fields:** Rich text descriptions of career progression, expertise, education, company experience, and geographic profiles, suitable for semantic matching.

**Guidelines for Generating Expansions:**

-   **Be Thorough & Specific:** Leverage the detailed fields above to make your suggested queries highly specific and nuanced. Don\'t just list broad categories; think about how these fields can be combined.
-   **Explore Dimensions Creatively:** Use the "Searchable dimensions" from the analysis and the schema details to create variations that find similar yet complementary profiles. Think about what a user trying to understand the alumni pool deeply would want to explore next.
-   **Distinct & Complementary:** Each of the 3 expansions should be relevant to the original query\'s core topic but offer a unique angle or a deeper dive into one of the available data dimensions.
-   **Actionable Queries:** Phrase them as if a user would type them into a search bar.
-   **Conciseness:** Keep each suggested expansion under 15 words if possible, but prioritize clarity and specificity.
-   **Focus on Variety:** Try to touch upon different categories from the schema in your suggestions if appropriate for the original query.

**Output Format:**
Provide exactly 3 expansions, separated by "•" characters. No numbering, no intro/outro text, just the queries.

Example Input: "Alumni in tech leadership"
Example Output: "Tech leaders with startup experience • Alumni in C-suite roles at enterprise tech companies • Engineering VPs with 10+ years since [Your Organization]"'''


def get_expanded_queries_from_openai(original_query):
    """
    Calls OpenAI API directly to get metadata and then expanded queries.
    """
    metadata = None
    expanded_queries = []
    metadata_content_for_error = "Not fetched"


    try:
        # Step 1: Get Metadata
        metadata_response = client.chat.completions.create(
            model='gpt-4.1-mini', # As in route.ts
            messages=[
                {"role": "system", "content": METADATA_SYSTEM_PROMPT},
                {"role": "user", "content": original_query}
            ]
        )
        metadata_content_for_error = metadata_response.choices[0].message.content
        if metadata_content_for_error:
            metadata = json.loads(metadata_content_for_error)
        else:
            metadata = {} # Default to empty dict if no content

        # Step 2: Get Expansions using the metadata
        expansion_prompt_template = get_expansion_prompt_template()
        
        core_topic = metadata.get('core_topic', 'N/A')
        key_attributes_list = metadata.get('key_attributes', [])
        key_attributes_str = ', '.join(key_attributes_list) if isinstance(key_attributes_list, list) else str(key_attributes_list)
        
        search_dimensions_list = metadata.get('search_dimensions', [])
        search_dimensions_str = ', '.join(search_dimensions_list) if isinstance(search_dimensions_list, list) else str(search_dimensions_list)
        
        context_level = metadata.get('context_level', 'N/A')

        formatted_expansion_prompt = expansion_prompt_template.format(
            query=original_query,
            core_topic=core_topic,
            key_attributes=key_attributes_str,
            search_dimensions=search_dimensions_str,
            context_level=context_level
        )
        
        expansion_response = client.chat.completions.create(
            model='gpt-4o-mini', # As in route.ts
            messages=[
                {"role": "system", "content": formatted_expansion_prompt},
            ]
        )
        
        full_expansion_content = expansion_response.choices[0].message.content or ""
            expanded_queries = [q.strip() for q in full_expansion_content.split('•') if q.strip()]
        
            return expanded_queries, metadata

    except openai.APIError as e:
        print(f"OpenAI API Error for query '{original_query}': {e}")
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error for query '{original_query}' (likely from metadata): {e}")
        print(f"Problematic content: {metadata_content_for_error}")
    except Exception as e:
        print(f"An unexpected error occurred for query '{original_query}': {e}")
    
    return expanded_queries, metadata


def main():
    print("Starting query expansion validation (direct OpenAI)...\n")
    
    all_results = []

    for i, query in enumerate(INPUT_QUERIES):
        print(f"Processing query {i+1}/{len(INPUT_QUERIES)}: \"{query}\"")
        
        expanded_queries, metadata = get_expanded_queries_from_openai(query) # Updated function call
        
        result_entry = {
            "original_query": query,
            "expanded_queries": expanded_queries,
            "metadata": metadata 
        }
        all_results.append(result_entry)
        
        print(f"  Original Query: {query}")
        if metadata:
             print(f"    Core Topic: {metadata.get('core_topic', 'N/A')}")
             print(f"    Key Attributes: {metadata.get('key_attributes', [])}") # Print as list for clarity
             print(f"    Search Dimensions: {metadata.get('search_dimensions', [])}")
             print(f"    Context Level: {metadata.get('context_level', 'N/A')}")
        else:
            print("    No metadata returned or error in fetching.")
            
        if expanded_queries:
            print("  Expanded Queries:")
            for idx, eq in enumerate(expanded_queries):
                print(f"    {idx+1}. {eq}")
        else:
            print("  No expanded queries returned or an error occurred.")
        print("-" * 50)
        print() 

    output_filename = "expansion_validation_results_openai_direct.json"
    with open(output_filename, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\nAll results saved to {output_filename}")

    print("Query expansion validation complete.")

if __name__ == "__main__":
    main()