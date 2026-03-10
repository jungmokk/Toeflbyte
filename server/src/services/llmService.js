import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

class LLMService {
  constructor() {
    // 1. DeepSeek (Primary Alternative)
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (deepseekKey) {
      this.openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: deepseekKey,
      });
      console.log("LLMService: DeepSeek initialized as primary.");
    }

    // 2. Gemini (Fallback or specific tasks)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      console.log("LLMService: Gemini initialized.");
    }

    // 3. Qwen (Alibaba DashScope - High efficiency)
    const qwenKey = process.env.QWEN_API_KEY;
    if (qwenKey) {
      this.qwen = new OpenAI({
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: qwenKey,
      });
      console.log("LLMService: Qwen initialized.");
    }
  }

  /**
   * Generates structured content (TOFEL Bite)
   * Focuses on Gemini-Flash for speed and cost-effectiveness
   */
  async generateContent(systemPrompt, userPrompt) {
    // Priority to DeepSeek for bulk generation to avoid Gemini quota limits
    if (this.openai) {
      try {
        console.log("Generating with DeepSeek (High load mode)...");
        const response = await this.openai.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error("DeepSeek API Error:", error.message);
      }
    }

    if (this.genAI) {
      try {
        console.log("Generating with Gemini (Fallback)...");
        const result = await this.geminiModel.generateContent([
          { text: systemPrompt },
          { text: userPrompt }
        ]);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
      } catch (error) {
        console.error("Gemini API Error (Fallback):", error.message);
        throw error;
      }
    }
  }

  /**
   * Generates content using Qwen-Plus (Balanced) or Qwen-Flash (Fast)
   */
  async generateFast(systemPrompt, userPrompt, model = "qwen-plus") {
    if (this.qwen) {
      try {
        console.log(`Generating with Qwen (${model})...`);
        const response = await this.qwen.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error(`Qwen API Error (${model}):`, error.message);
      }
    }
    // Fallback to existing Gemini if Qwen fails
    return this.generateContent(systemPrompt, userPrompt);
  }

  /**
   * Fast word definition for UI interaction - Uses Qwen-Flash ($0.03/1M)
   */
  async defineWord(word, context, language = 'ko') {
    if (this.qwen) {
      try {
        const langNames = { ko: "Korean", ja: "Japanese", "zh-TW": "Traditional Chinese (Taiwan)" };
        const targetLang = langNames[language] || "Korean";
        const systemPrompt = `You are a helpful TOEFL vocabulary assistant. Return JSON: { "meaning": "Short ${targetLang} meaning", "example": "Short English sentence using the word in TOEFL style" }`;
        const userPrompt = `Define '${word}' based on this context: '${context}'`;

        const response = await this.qwen.chat.completions.create({
          model: "qwen-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error("Qwen defineWord Error, falling back to Gemini:", error.message);
      }
    }

    // Existing Gemini Fallback
    const langNames = { ko: "Korean", ja: "Japanese", "zh-TW": "Traditional Chinese (Taiwan)" };
    const targetLang = langNames[language] || "Korean";
    const systemPrompt = `You are a helpful TOEFL vocabulary assistant. Return JSON: { "meaning": "Short ${targetLang} meaning", "example": "Short English sentence using the word in TOEFL style" }`;
    const userPrompt = `Define '${word}' based on this context: '${context}'`;
    
    const result = await this.geminiModel.generateContent([{ text: systemPrompt }, { text: userPrompt }]);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  }

  /**
   * For chat-based interactions (Tutor) with history support
   */
  async generateChat(systemPrompt, userPrompt, history = []) {
    // Try DeepSeek
    if (this.openai) {
      try {
        console.log("Chatting with DeepSeek (History length: " + history.length + ")");
        
        // Build messages array: System -> History -> Current User Prompt
        const messages = [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: userPrompt }
        ];

        const response = await this.openai.chat.completions.create({
          model: "deepseek-chat",
          messages: messages,
          stream: false
        });
        return response.choices[0].message.content;
      } catch (error) {
        console.error("DeepSeek Chat Error, falling back to Gemini:", error.message);
      }
    }

    // Fallback to Gemini
    if (this.geminiModel) {
      try {
        console.log("Chatting with Gemini (Fallback)...");
        
        // Convert our history to Gemini format
        const geminiHistory = history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const chat = this.geminiModel.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I will act as the Star Tutor." }] },
            ...geminiHistory
          ],
        });

        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error("Gemini Chat Error:", error.message);
        throw error;
      }
    }

    throw new Error("No LLM service available for chat.");
  }

  /**
   * Generates embeddings for the RAG system using Gemini
   */
  async generateEmbedding(text) {
    if (this.genAI) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             model: "models/gemini-embedding-001",
             content: { parts: [{ text: text }] }
          })
        });
        const data = await response.json();
        if (data.embedding) return data.embedding.values;
        if (data.error) throw new Error(data.error.message);
        throw new Error("Missing embedding in response");
      } catch (error) {
        console.error("Gemini Embedding Error:", error.message);
        throw error;
      }
    }
    throw new Error("No LLM service available for embeddings.");
  }
}

export default new LLMService();
