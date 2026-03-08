import supabase from './src/config/db.js';

const mockQuestions = [
  {
    topic: "History",
    type: "FULL",
    content_json: JSON.stringify({
      passage: "The Rosetta Stone, found in 1799, was key to deciphering Egyptian hieroglyphs. It contains a decree issued in Memphis in 196 BC on behalf of King Ptolemy V. The decree appears in three scripts: Ancient Egyptian hieroglyphs, Demotic script, and Ancient Greek. Because it presents essentially the same text in all three scripts, the stone provided the key to the modern understanding of Egyptian hieroglyphs. Scholars like Jean-François Champollion spent years analyzing the stone before finally unlocking the secrets of the ancient writing system.",
      question: "Why was the Rosetta Stone significant for scholars?",
      options: [
        "It contained the only surviving record of King Ptolemy V's reign.",
        "It provided a way to understand Ancient Egyptian writing using Greek.",
        "It was the oldest archaeological artifact found in Egypt at the time.",
        "It proved that the Memphis decree was originally written in Greek."
      ],
      answer: "B",
      explanation: "The stone had the same text in three scripts (Hieroglyphs, Demotic, and Greek), allowing scholars to translate the unknown Egyptian scripts by comparing them to the known Greek text."
    })
  },
  {
    topic: "Biology",
    type: "SHORT",
    content_json: JSON.stringify({
      passage: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. In plants, photosynthesis generally involves the green pigment chlorophyll and generates oxygen as a byproduct. This process is fundamental to life on Earth as it provides the primary source of organic material for almost all living things and oxygen for respiration.",
      question: "What is a primary byproduct of photosynthesis mentioned in the passage?",
      options: [
        "Carbon dioxide",
        "Chlorophyll",
        "Oxygen",
        "Sunlight"
      ],
      answer: "C",
      explanation: "The passage explicitly states that photosynthesis 'generates oxygen as a byproduct'."
    })
  },
  {
    topic: "Environment",
    type: "FULL",
    content_json: JSON.stringify({
      passage: "Global warming refers to the long-term increase in Earth's average surface temperature due to human activities, primarily the emission of greenhouse gases. These gases, such as carbon dioxide and methane, trap heat in the atmosphere, leading to various environmental changes, including melting polar ice caps, rising sea levels, and more extreme weather patterns. Reducing carbon footprints is essential to mitigating these effects.",
      question: "What is the primary cause of global warming according to the text?",
      options: [
        "Natural fluctuations in Earth's orbit",
        "Human activities and greenhouse gas emissions",
        "Changes in solar radiation levels",
        "Volcanic eruptions and seismic activity"
      ],
      answer: "B",
      explanation: "The passage identifies human activities, specifically greenhouse gas emissions, as the primary cause of global warming."
    })
  }
];

async function seed() {
  console.log("Seeding database with initial questions...");
  for (const q of mockQuestions) {
    const { data, error } = await supabase
      .from('BiteQuestion')
      .insert([q])
      .select();
    
    if (error) {
      console.error(`Error seeding ${q.topic}:`, error.message);
    } else {
      console.log(`Success: Seeded ${q.topic} (${q.type})`);
    }
  }
  console.log("Seeding complete!");
}

seed();
