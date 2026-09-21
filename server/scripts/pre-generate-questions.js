import llmService from '../src/services/llmService.js';
import supabase from '../src/config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { syncRecentNews } from '../src/services/newsService.js';

dotenv.config();

const TOPICS = [
  'Archaeology of Ancient Egypt',
  'Astronomy and Planetary Formation',
  'Marine Biology and Coral Reefs',
  'History of the Renaissance Art',
  'Geology and Plate Tectonics',
  'Sociology of Urbanization',
  'Economics of the Great Depression',
  'Environmental Science and Climate Change',
  'Psychology of Cognitive Development',
  'Early American Literature',
  'Oceanography and Deep Sea Currents',
  'Botany and Plant Adaptation',
  'Zoology and Animal Migration',
  'Linguistics and Language Evolution',
  'Anthropology of Tribal Societies',
  'Architecture of Gothic Cathedrals',
  'Physics of Thermodynamics',
  'Chemistry of Industrial Polymers',
  'Music Theory and Baroque Composition',
  'Meteorology and Severe Weather Patterns',
  'Current Affairs'
];

const TOEFL_QUESTION_TYPES = [
  { name: "Factual Information", desc: "According to the passage, [X] happened because...", rule: "Find the specific detail stated explicitly in the passage." },
  { name: "Negative Factual Information", desc: "Which of the following is NOT True about [X]?", rule: "Use 'EXCEPT' or 'NOT' in the question. Three options must be true, one must be false or not mentioned." },
  { name: "Inference", desc: "Which of the following can be inferred about [X]?", rule: "The answer is not explicitly stated but strongly implied by the facts." },
  { name: "Rhetorical Purpose", desc: "The author mentions [X] in order to...", rule: "Analyze WHY the author included special information or examples." },
  { name: "Vocabulary", desc: "The word [X] is closest in meaning to...", rule: "Pick a synonym that fits the context of the passage." },
  { name: "Reference", desc: "The word [it/they/which] refers to...", rule: "Identify the antecedent of a pronoun or relative pronoun." },
  { name: "Sentence Simplification", desc: "Which of the following best expresses the essential information...", rule: "Pick the option that keeps all core information but removes unnecessary details without changing meaning." },
  { name: "Insert Text", desc: "[■] square bracket placement question.", rule: "Provide a sentence to be inserted and mark 4 potential places in the passage with [A], [B], [C], [D] or [■]." }
];

async function preGenerateQuestions(countPerTopic = 2) {
  console.log(`🚀 Starting pre-generation of ${TOPICS.length * countPerTopic} questions using Supabase client...`);
  
  // Update news data before starting
  console.log("📡 Updating latest academic news context...");
  await syncRecentNews();

  const newsPath = path.join(process.cwd(), 'src', 'config', 'news_context.json');
  let newsData = [];
  try {
      newsData = JSON.parse(await fs.readFile(newsPath, 'utf8'));
  } catch (e) {
      console.warn("News context not available, proceeding without it.");
  }

  let typeIndex = 0;
  let totalTokens = 0;
  let totalPrompt = 0;
  let totalCompletion = 0;

  for (const topic of TOPICS) {
    console.log(`\n📚 Processing topic: ${topic}`);
    
    for (let i = 0; i < countPerTopic; i++) {
        try {
            const selectedType = TOEFL_QUESTION_TYPES[typeIndex % TOEFL_QUESTION_TYPES.length];
            typeIndex++;

            let newsContext = "";
            let currentTopic = topic;

            if (topic === "Current Affairs" && newsData.length > 0) {
                const selectedNews = newsData[Math.floor(Math.random() * newsData.length)];
                newsContext = `RECENT NEWS CONTEXT (from ${selectedNews.date}):\n${selectedNews.title}: ${selectedNews.content}`;
                currentTopic = `Current News: ${selectedNews.topic}`;
            }

            const systemPrompt = `You are a professional TOEFL iBT Reading instructor. 
Create a 'Bite-sized' reading passage and one accurate question. 
TYPE: ${selectedType.name}
DESC: ${selectedType.desc}
RULE: ${selectedType.rule}

### NEWS CONTEXT (Use this if provided): ${newsContext || "General academic knowledge"}

Response must be in JSON format:
{
  "topic": "${currentTopic}",
  "questionType": "${selectedType.name}",
  "passage": "A middle-academic level passage (150-200 words)...",
  "question": "A high-quality TOEFL type question...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "answer": "A/B/C/D",
  "explanation": "Detailed explanation in Korean...",
  "keyWords": [{"word": "...", "meaning": "..."}]
}`;

            const userPrompt = `Generate a unique TOEFL reading practice about ${currentTopic}. Ensure difficulty is appropriate. Type: ${selectedType.name}`;
            
            console.log(`  - Generating [${selectedType.name}] question ${i + 1}/${countPerTopic}...`);
            const generatedData = await llmService.generateFast(systemPrompt, userPrompt, "qwen-plus");

            if (!generatedData) throw new Error("AI returned null");

            // 토큰 사용량 합계 (llmService에서 _usage 필드에 포함함)
            if (generatedData._usage) {
              totalPrompt += generatedData._usage.prompt_tokens;
              totalCompletion += generatedData._usage.completion_tokens;
              totalTokens += generatedData._usage.total_tokens;
            }

            // Save to DB using Supabase
            const { data, error } = await supabase
                .from('BiteQuestion')
                .insert([{
                    topic: currentTopic,
                    userId: null,
                    type: 'FULL',
                    content_json: JSON.stringify({ ...generatedData, questionType: selectedType.name, isCurrentAffair: !!newsContext })
                }])
                .select()
                .single();

            if (error) throw error;

            console.log(`  ✅ Saved: ID ${data.id} (${selectedType.name}). Usage: ${generatedData._usage?.total_tokens || 'Unknown'} tokens`);
            
            // Short delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`  ❌ Error:`, error.message);
        }
    }
  }

  console.log('\n✨ Pre-generation completed!');
  console.log('-----------------------------------');
  console.log(`📊 TOTAL TOKEN USAGE SUMMARY:`);
  console.log(`   - Prompt: ${totalPrompt}`);
  console.log(`   - Completion: ${totalCompletion}`);
  console.log(`   - Total: ${totalTokens}`);
  console.log('-----------------------------------');
}

preGenerateQuestions(3).catch(console.error);

