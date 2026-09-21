import supabase from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeQuestions() {
  try {
    const { count, error: countError } = await supabase
      .from('BiteQuestion')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`TOTAL_COUNT: ${count}`);

    const { data, error } = await supabase
      .from('BiteQuestion')
      .select('id, content_json');

    if (error) throw error;

    console.log(`SAMPLED_ROWS: ${data.length}`);

    const categories = {
      'Factual Information': 0,
      'Negative Factual Information': 0,
      'Inference': 0,
      'Rhetorical Purpose': 0,
      'Vocabulary': 0,
      'Reference': 0,
      'Sentence Simplification': 0,
      'Insert Text': 0,
      'Prose Summary': 0,
      'Fill in a Table': 0,
      'Unknown': 0
    };

    data.forEach(row => {
      try {
        const content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json;
        const q = content.question.toLowerCase();
        
        if (q.includes('according to') || q.includes('paragraph') || q.includes('stated in')) {
          if (q.includes('not') || q.includes('except')) {
            categories['Negative Factual Information']++;
          } else {
            categories['Factual Information']++;
          }
        } else if (q.includes('infer') || q.includes('imply') || q.includes('suggest')) {
          categories['Inference']++;
        } else if (q.includes('why') || q.includes('mention') || q.includes('purpose')) {
          categories['Rhetorical Purpose']++;
        } else if (q.includes('closest in meaning') || q.includes('synonym')) {
          categories['Vocabulary']++;
        } else if (q.includes('refers to')) {
          categories['Reference']++;
        } else if (q.includes('best expresses') || q.includes('essential information')) {
          categories['Sentence Simplification']++;
        } else if (q.includes('[ ]') || q.includes('square brackets')) {
          categories['Insert Text']++;
        } else if (q.includes('introductory sentence') || q.includes('summary')) {
          categories['Prose Summary']++;
        } else {
          categories['Unknown']++;
        }
      } catch (e) {
        categories['Unknown']++;
      }
    });

    console.log('CATEGORIES:' + JSON.stringify(categories));
  } catch (error) {
    console.error('ERROR:', error);
  }
}

analyzeQuestions();
