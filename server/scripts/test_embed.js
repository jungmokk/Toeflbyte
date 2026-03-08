import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testEmbedding() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    console.log(data.models.filter(m => m.supportedGenerationMethods.includes("embedContent")).map(m => m.name));
  } catch (error) {
    console.error(error.message);
  }
}

testEmbedding();
