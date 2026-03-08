import LLMService from './src/services/llmService.js';

async function testDeepSeek() {
  console.log("Starting DeepSeek integration test...");
  
  const systemPrompt = "You are a TOEFL expert. Return a JSON object with a 'message' field.";
  const userPrompt = "Say hello and confirm you are ready for TOEFL question generation.";

  try {
    const result = await LLMService.generateContent(systemPrompt, userPrompt);
    console.log("✅ DeepSeek Response:", JSON.stringify(result, null, 2));
    
    if (result.message) {
      console.log("\nDeepSeek is working perfectly! 🚀");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.message.includes("401")) {
      console.log("Hint: API Key might be invalid.");
    } else if (error.message.includes("402")) {
      console.log("Hint: DeepSeek account might need balance/credits.");
    }
  }
}

testDeepSeek();
