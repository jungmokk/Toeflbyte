import OpenAI from 'openai';
import fs from 'fs/promises';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function analyzePDF() {
  const pdfText = await fs.readFile('../pdf_full_text.txt', 'utf8');
  const sampleText = pdfText.substring(0, 10000);

  const systemPrompt = `You are a professional TOEFL content analyzer. Analyze the provided raw text and extract core logic, style, and structure. Return in JSON format.`;
  const userPrompt = `Analyze this TOEFL content and provide the core 'Rules of Question Design':\n\n${sampleText}`;

  console.log("Analyzing PDF content with DeepSeek...");
  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });
  
  const analysis = JSON.parse(response.choices[0].message.content);
  await fs.writeFile('toefl_core_logic.json', JSON.stringify(analysis, null, 2));
  console.log("Analysis saved to toefl_core_logic.json");
}

analyzePDF();
