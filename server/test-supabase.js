import supabase from './src/config/db.js';

async function testSupabase() {
  console.log("--- Supabase Connection Test ---");
  try {
    // 1. Basic Table Access
    console.log("1. Testing 'knowledge_base' table access...");
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_base')
      .select('title')
      .limit(1);
    
    if (kbError) {
      console.error("Knowledge Base Table Error:", kbError);
    } else {
      console.log("Success: Found", kbData.length, "rows in knowledge_base.");
    }

    // 2. BiteQuestion Table Access
    console.log("\n2. Testing 'BiteQuestion' table access...");
    const { data: qData, error: qError } = await supabase
      .from('BiteQuestion')
      .select('id')
      .limit(1);
    
    if (qError) {
      console.error("BiteQuestion Table Error:", qError);
    } else {
      console.log("Success: Found", qData.length, "rows in BiteQuestion.");
    }

    // 3. RPC Test (Optional if defined)
    console.log("\n3. Testing 'match_knowledge' RPC (if exists)...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_knowledge', {
      query_embedding: new Array(1536).fill(0), // Mock embedding
      match_threshold: 0.5,
      match_count: 1
    });

    if (rpcError) {
      console.warn("RPC match_knowledge might not exist or failed:", rpcError.message);
    } else {
      console.log("Success: RPC match_knowledge responded.");
    }

  } catch (err) {
    console.error("Critical Connection Failure:", err);
  }
  console.log("\n--- Test Finished ---");
}

testSupabase();
