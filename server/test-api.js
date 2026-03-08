import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key exists:", !!apiKey);
  
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  // Testing with 1.5-flash
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const modelName = "gemini-2.0-flash-lite";
  try {
    console.log(`Testing model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("hello");
    const response = await result.response;
    console.log(`✅ ${modelName} worked! Response: ${response.text()}`);
  } catch (err) {
    console.error(`❌ ${modelName} failed: ${err.message}`);
  }
}

testGemini();
