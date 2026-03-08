import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Using API Key:", apiKey ? "FOUND" : "NOT FOUND");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    console.log(`Success with ${modelName}:`, response.text());
  } catch (error) {
    console.error(`Error with ${modelName}:`, error.message);
  }
}

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Full Model List:");
    data.models?.forEach(m => {
      console.log(`${m.name} | Methods: ${m.supportedGenerationMethods}`);
    });
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

async function findWorkingModel() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    const models = data.models || [];
    
    // Only try models that support generateContent
    for (const m of models) {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        // Strip 'models/' prefix if present for the SDK
        const shortName = m.name.replace("models/", "");
        console.log(`Testing ${shortName}...`);
        try {
          const model = genAI.getGenerativeModel({ model: shortName });
          const result = await model.generateContent("Say 'ok'");
          const res = await result.response;
          console.log(`✅ Success with ${shortName}: ${res.text()}`);
          return shortName;
        } catch (e) {
          console.log(`❌ Failed ${shortName}: ${e.message}`);
        }
      }
    }
  } catch (error) {
    console.error("Error in findWorkingModel:", error.message);
  }
  return null;
}

async function run() {
  const working = await findWorkingModel();
  if (working) {
    console.log("FINAL WORKING MODEL:", working);
  } else {
    console.log("NO WORKING MODELS FOUND");
  }
}

run();
