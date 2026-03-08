import supabase from './src/config/db.js';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve('../pdf_toefl_data.json');

async function seed() {
  try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const pdfData = JSON.parse(rawData);

    console.log(`Seeding database with ${pdfData.length} questions extracted from PDFs...`);

    for (const q of pdfData) {
      const { data, error } = await supabase
        .from('BiteQuestion')
        .insert([{
          topic: q.topic,
          type: q.type,
          content_json: q.content_json
        }])
        .select();
      
      if (error) {
        console.error(`Error seeding ${q.topic}:`, error.message);
      } else {
        console.log(`Success: Seeded ${q.topic} (${q.type})`);
      }
    }
    console.log("PDF data seeding complete!");
  } catch (err) {
    console.error("Failed to read PDF data:", err.message);
  }
}

seed();
