import llmService from './llmService.js';
import supabase from '../config/db.js';

/**
 * Knowledge Service configured with Supabase pgvector (RAG)
 * Originally designed for NotebookLM MCP integration
 */
class MCPService {
  constructor() {
    this.knowledgeCache = {}; // Simple in-memory cache
  }

  async init() {
    console.log("Knowledge Base connected via Supabase pgvector...");
    return true;
  }

  /**
   * Fetch specific knowledge notes from Supabase knowledge_base table
   * Function performs exact title matching first, and falls back to semantic search.
   * @param {string} noteTitle Or search query
   */
  async fetchNote(noteTitle) {
    if (this.knowledgeCache[noteTitle]) {
      console.log(`[RAG-Cache] Hit for: ${noteTitle}`);
      return this.knowledgeCache[noteTitle];
    }

    console.log(`[RAG] Fetching context for: ${noteTitle}`);
    let content = "No content found for this note.";

    try {
      // 1. Try fetching exact title match
      const { data: exactMatch, error: exactError } = await supabase
        .from('knowledge_base')
        .select('content')
        .eq('title', noteTitle)
        .limit(1)
        .maybeSingle();

      if (exactError) {
        console.warn(`[RAG] Exact match query error for '${noteTitle}':`, exactError.message);
      }

      if (exactMatch && exactMatch.content) {
        content = exactMatch.content;
      } else {
        // 2. Fallback to vector similarity (Semantic Search)
        console.log(`[RAG] No exact match, trying semantic search for: ${noteTitle}`);
        
        try {
          let embedding = await llmService.generateEmbedding(noteTitle);
          
          // Ensure embedding is exactly 3072 dimensions (required by Supabase)
          // This prevents "different vector dimensions" errors while we transition models
          if (embedding.length !== 3072) {
            console.log(`[RAG] Dimension mismatch detected: ${embedding.length} vs 3072. Padding/Truncating...`);
            if (embedding.length < 3072) {
              embedding = [...embedding, ...new Array(3072 - embedding.length).fill(0)];
            } else {
              embedding = embedding.slice(0, 3072);
            }
          }
          
          // Execute the match_knowledge RPC function we created in Supabase
          const { data: similarMatches, error: searchError } = await supabase.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.7, // 70% similarity match
            match_count: 1
          });

          if (searchError) {
            console.error(`[RAG] Vector Search RPC Error for '${noteTitle}':`, searchError.message);
            // DO NOT THROW HERE, return fallback content
          } else if (similarMatches && similarMatches.length > 0) {
            content = similarMatches[0].content;
          }
        } catch (innerError) {
          console.error(`[RAG] Internal Embedding/RPC error for '${noteTitle}':`, innerError.message);
        }
      }

      this.knowledgeCache[noteTitle] = content;
      return content;

    } catch (error) {
      console.error(`[RAG] Critical knowledge base fetch error for '${noteTitle}':`, error.message);
      return content; // Always return fallback
    }
  }
}

export default new MCPService();

