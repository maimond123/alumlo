// app/test/embedding-quality-test.js
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test phrases related to finance and Goldman Sachs
const testPhrases = [
  "Goldman Sachs",
  "investment banking",
  "finance professional",
  "Wall Street",
  "financial analyst",
  "investment banker at Goldman Sachs",
  "banking industry",
  "Morgan Stanley", // competitor for comparison
  "software engineer", // unrelated for comparison
  "doctor" // unrelated for comparison
];

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  // Ensure both vectors are arrays
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    console.error('Vector format error:');
    console.error('vecA type:', typeof vecA, Array.isArray(vecA));
    console.error('vecB type:', typeof vecB, Array.isArray(vecB));
    console.error('vecA sample:', vecA && typeof vecA === 'object' ? Object.keys(vecA).slice(0, 5) : vecA);
    console.error('vecB sample:', vecB && typeof vecB === 'object' ? Object.keys(vecB).slice(0, 5) : vecB);
    throw new Error('Vectors must be arrays for cosine similarity calculation');
  }
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function to convert embedding to array if needed
function ensureEmbeddingIsArray(embedding) {
  if (Array.isArray(embedding)) {
    return embedding;
  }
  
  // If it's a string, try to parse it
  if (typeof embedding === 'string') {
    try {
      // Try parsing as JSON
      return JSON.parse(embedding);
    } catch (e) {
      // If it's not JSON, it might be a comma-separated string
      return embedding.split(',').map(Number);
    }
  }
  
  // If it's an object with numeric keys (like a sparse array)
  if (embedding && typeof embedding === 'object') {
    // Check if it has a data property (common in some embedding formats)
    if (embedding.data && Array.isArray(embedding.data)) {
      return embedding.data;
    }
    
    // Try to convert object to array if it has numeric keys
    const keys = Object.keys(embedding).sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0 && !isNaN(Number(keys[0]))) {
      return keys.map(k => embedding[k]);
    }
  }
  
  console.error('Unknown embedding format:', embedding);
  throw new Error('Could not convert embedding to array');
}

async function testEmbeddingQuality() {
  console.log("Starting embedding quality test...");
  
  try {
    // Initialize the embedding model
    console.log("Initializing embedding model...");
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    // Generate embeddings for test phrases
    console.log("Generating embeddings for test phrases...");
    const phraseEmbeddings = {};
    
    for (const phrase of testPhrases) {
      const embedding = await embedder(phrase, { pooling: 'mean', normalize: true });
      phraseEmbeddings[phrase] = Array.from(embedding.data);
      console.log(`Generated embedding for phrase: "${phrase}"`);
    }
    
    // Fetch profile embeddings from the database
    console.log("Fetching profile embeddings from database...");
    const { data: profiles, error } = await supabase
      .from('lawrenceville_vector')
      .select('id, name, profile_data, embedding')
      .limit(10);
    
    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }
    
    console.log(`Fetched ${profiles.length} profiles from database`);
    
    // First, let's inspect the embedding format
    console.log("\n=== EMBEDDING FORMAT INSPECTION ===\n");
    if (profiles.length > 0) {
      const sampleEmbedding = profiles[0].embedding;
      console.log(`Sample embedding type: ${typeof sampleEmbedding}`);
      if (typeof sampleEmbedding === 'object') {
        console.log(`Is array: ${Array.isArray(sampleEmbedding)}`);
        console.log(`Keys: ${Object.keys(sampleEmbedding).slice(0, 5)}...`);
        console.log(`Sample values: ${JSON.stringify(Object.values(sampleEmbedding).slice(0, 5))}...`);
      } else if (typeof sampleEmbedding === 'string') {
        console.log(`String length: ${sampleEmbedding.length}`);
        console.log(`Sample: ${sampleEmbedding.substring(0, 100)}...`);
      }
    }
    
    // Compare test phrase embeddings with profile embeddings
    console.log("\n=== SIMILARITY ANALYSIS ===\n");
    
    for (const profile of profiles) {
      console.log(`\nProfile: ${profile.name}`);
      
      // Extract job information for context
      const experiences = profile.profile_data.experiences || [];
      const currentJob = experiences.length > 0 ? 
        `${experiences[0].title} at ${experiences[0].company}` : 
        'No current job';
      
      console.log(`Current job: ${currentJob}`);
      
      try {
        // Convert embedding to array format
        const profileEmbedding = ensureEmbeddingIsArray(profile.embedding);
        
        // Calculate similarity with each test phrase
        const similarities = testPhrases.map(phrase => ({
          phrase,
          similarity: cosineSimilarity(phraseEmbeddings[phrase], profileEmbedding)
        }));
        
        // Sort by similarity (highest first)
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        // Print top 5 most similar phrases
        console.log("Top phrase similarities:");
        similarities.slice(0, 5).forEach(({ phrase, similarity }) => {
          console.log(`  "${phrase}": ${similarity.toFixed(4)}`);
        });
        
        // Check if any finance-related phrases are in top 3
        const financeRelated = ["Goldman Sachs", "investment banking", "finance professional", 
                               "Wall Street", "financial analyst", "investment banker at Goldman Sachs"];
        const topFinanceMatch = similarities
          .filter(s => financeRelated.includes(s.phrase))
          .slice(0, 1)[0];
        
        // Check if this is a finance profile
        const isFinanceProfile = experiences.some(exp => 
          (exp.company && exp.company.includes("Goldman")) || 
          (exp.company && exp.company.includes("Morgan")) || 
          exp.industry === "Financial Services");
        
        if (isFinanceProfile) {
          console.log(`\n✓ FINANCE PROFILE - Top finance match: "${topFinanceMatch?.phrase}" (${topFinanceMatch?.similarity.toFixed(4)})`);
        } else {
          console.log(`\n✗ NON-FINANCE PROFILE - Top finance match: "${topFinanceMatch?.phrase}" (${topFinanceMatch?.similarity.toFixed(4)})`);
        }
      } catch (error) {
        console.error(`Error processing profile ${profile.name}:`, error.message);
      }
    }
    
    // Save results to file for further analysis
    fs.writeFileSync('embedding-test-results.json', JSON.stringify({
      phraseEmbeddings,
      profiles: profiles.map(p => ({
        id: p.id,
        name: p.name,
        currentJob: p.profile_data.experiences?.[0],
        embedding: p.embedding
      }))
    }, null, 2));
    
    console.log("\nTest completed. Results saved to embedding-test-results.json");
    
  } catch (error) {
    console.error("Error in embedding quality test:", error);
  }
}

testEmbeddingQuality().catch(console.error);