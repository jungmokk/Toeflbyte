import supabase from './src/config/db.js';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve('../scraped_toefl_data.json');

async function seed() {
  try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const scrapedData = JSON.parse(rawData);

    console.log(`Seeding database with ${scrapedData.length} scraped questions...`);

    for (const q of scrapedData) {
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
    console.log("Seeding complete!");
  } catch (err) {
    console.error("Failed to read scraped data:", err.message);
  }
}

seed();
