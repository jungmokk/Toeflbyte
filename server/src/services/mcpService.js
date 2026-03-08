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

      if (exactMatch && exactMatch.content) {
        content = exactMatch.content;
      } else {
        // 2. Fallback to vector similarity (Semantic Search)
        console.log(`[RAG] No exact match, trying semantic search for: ${noteTitle}`);
        const embedding = await llmService.generateEmbedding(noteTitle);
        
        // Execute the match_knowledge RPC function we created in Supabase
        const { data: similarMatches, error: searchError } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.7, // 70% similarity match
          match_count: 1
        });

        if (similarMatches && similarMatches.length > 0) {
          content = similarMatches[0].content;
        } else if (searchError) {
          console.error("Vector Search Error:", searchError);
        }
      }

      this.knowledgeCache[noteTitle] = content;
      return content;

    } catch (error) {
      console.error("[RAG] Knowledge base fetch error:", error);
      return content;
    }
  }
}

export default new MCPService();

