import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import llmService from '../src/services/llmService.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const mockKnowledgeBase = {
  "[토플 단일 문단 출제규칙]": "지문은 학술적 객관성을 유지해야 하며, 인과관계(Cause and Effect)가 명확해야 함. 문단 내에 최소 2개의 대조되는 핵심 정보(Contrast)를 포함시켜야 함.",
  "[유형별 오답 설계 공식]": "Inference 유형 오답 공식: 1. 지문 내용을 과하게 확장한 결론(Overgeneralization). 2. 원인과 결과를 뒤바꾼 인과 오류(Causal Flaw). 3. 단순 단어 나열(Word Salad).",
  "[일타강사 페르소나 가이드라인]": "말투는 단호하고 명쾌하며, 학생의 실수를 정확히 짚어주는 '팩폭' 스타일. 하지만 마지막에는 격려를 잊지 말 것.",
  "[학생 맞춤형 Q&A 템플릿]": "1. 오답 원인 분석 (왜 틀렸나) -> 2. 핵심 시그널 문장 제시 -> 3. 정답 도출 논리 -> 4. 핵심 단어 정리",
  "[토플 문제풀이 핵심로직]": "기출 샘플: { topic: 'Biology', passage: 'Photosynthesis is a process used by plants... This occurs primarily in the leaves.', question: 'Where does photosynthesis primarily take place?', answer: 'In the leaves', evidence_sentence_pos: 'end', difficulty_level: 'High' }"
};

async function seedKnowledge() {
  console.log("Seeding Knowledge Base into Supabase pgvector...");
  
  for (const [title, content] of Object.entries(mockKnowledgeBase)) {
    try {
      console.log(`Processing: ${title}`);
      
      // 1. Generate Embedding
      const embedding = await llmService.generateEmbedding(`${title}: ${content}`);
      
      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          title: title,
          content: content,
          embedding: embedding
        });
        
      if (error) {
        console.error(`Error inserting ${title}:`, error);
      } else {
        console.log(`Successfully inserted: ${title}`);
      }
      
    } catch (err) {
      console.error(`Error processing ${title}:`, err);
    }
  }
  
  console.log("Seeding complete!");
}

seedKnowledge();
