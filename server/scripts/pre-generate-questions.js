import llmService from '../src/services/llmService.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

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
  'Meteorology and Severe Weather Patterns'
];

async function preGenerateQuestions(countPerTopic = 2) {
  console.log(`🚀 Starting pre-generation of ${TOPICS.length * countPerTopic} questions...`);

  for (const topic of TOPICS) {
    console.log(`\n📚 Processing topic: ${topic}`);
    
    for (let i = 0; i < countPerTopic; i++) {
        try {
            const systemPrompt = `You are a professional TOEFL iBT Reading instructor. 
Create a 'Bite-sized' reading passage and one accurate question.
Response must be in JSON format:
{
  "topic": "${topic}",
  "passage": "A middle-academic level passage (150-200 words)...",
  "question": "A high-quality TOEFL type question...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "answer": "A/B/C/D",
  "explanation": "Detailed explanation in Korean...",
  "keyWords": [{"word": "...", "meaning": "..."}]
}`;

            const userPrompt = `Generate a unique TOEFL reading practice about ${topic}. Ensure the difficulty is appropriate for undergraduate level.`;
            
            console.log(`  - Generating question ${i + 1}/${countPerTopic}...`);
            const generatedData = await llmService.generateContent(systemPrompt, userPrompt);

            // Save to DB
            const newQuestion = await prisma.biteQuestion.create({
                data: {
                    topic: topic,
                    content_json: JSON.stringify(generatedData)
                }
            });

            console.log(`  ✅ Successfully saved: Question ID ${newQuestion.id}`);
            
            // Artificial delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`  ❌ Error generating for ${topic}:`, error.message);
        }
    }
  }

  console.log('\n✨ Pre-generation completed!');
}

preGenerateQuestions(3) // Change this number to generate more/less per topic
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
