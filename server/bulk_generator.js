import supabase from './src/config/db.js';
import llmService from './src/services/llmService.js';
import fs from 'fs/promises';
import path from 'path';

const TOPICS = [
  'Archaeology of Ancient Mesopotamia',
  'Industrial Revolution in Britain',
  'Photosynthesis and Plant Physiology',
  'Plate Tectonics and Seismology',
  'Gothic Architecture in Europe',
  'Macroeconomics and Trade Policies',
  'Child Language Acquisition',
  'History of the Byzantine Empire',
  'Organic Chemistry Fundamentals',
  'Marine Ecosystems and Coral Bleaching',
  
  // Natural Sciences
  'Seismology and Earthquakes',
  'Black Holes and Gravitational Waves',
  'Genetics of Adaptive Immunity',
  'Introduction to Quantum Mechanics',
  'Ecology of the Amazon Rainforest',
  'Paleontology and Dinosaur Extinction',
  'Microbiology of extremophiles',
  'History of the French Revolution',
  'Rise of the Mongol Empire',
  'Classical Music in the Enlightenment',
  'European Renaissance Art History',
  'Sociological Theories of Urbanization',
  'Economics of International Trade',
  'Principles of Child Psychology',
  'Linguistic Variation and Dialects',
  'Modernism in 20th Century Literature',
  'Geological Evolution of the Himalayas',
  'Atmospheric Science and Weather Patterns',
  'Human Rights Law and Global Ethics',
  'Introduction to Cultural Anthropology',

  // Modern / Trending
  'Impact of AI on Digital Economy',
  'Decentralized Autonomous Organizations (DAOs)',
  'Generative AI in Biomedical Research',
  'Space Exploration and Mars Terraforming',
  'Sustainable Hydrogen Energy Production',
  'Renewable Energy Storage Innovation',
  'Ethical Challenges of CRISPR Gene Editing',
  'Evolution of Modern Cybersecurity Threats',
  'Digital Nomads and Remote Work Sociology',
  'Sustainable Urban Planning and Smart Cities',
  'Virtual Reality and Future of Education',
  'Global Warming and Permafrost Thawing',
  'E-commerce Trends and Global Logistics',
  'Deep-sea Exploration and Biodiversity',
  'The Sixth Mass Extinction and Conservation',
  'The Great Resignation and Labor Markets',
  'Cryptocurrency and Monetary Policy',
  'Metaphysics of Digital Consciousness',
  'The Gig Economy and Social Safety Nets',
  'Autonomous Vehicles and Infrastructure',

  // Additional 50
  'Environmental Ethics in Modern Society',
  'History of the Silk Road',
  'Introduction to Game Theory in Economics',
  'Cognitive Biases in Decision Making',
  'Sociology of Fashion and Identity',
  'The Evolution of Classical Music in the Baroque Era',
  'Renaissance Architecture and Humanism',
  'Geopolitics of Energy Resources in the 21st Century',
  'Ethics of CRISPR Technology in Humans',
  'Ancient Greek Philosophy: The Pre-Socratics',
  'Impact of the Printing Press on European Thought',
  'Geology of the Grand Canyon',
  'Atmospheric Science: The Ozone Layer Recovery',
  'Human Migration Patterns in the Neolithic Era',
  'Modern Trends in Interior Design and Sustainability',
  'The Psychology of Creativity and Innovation',
  'Economic Theories of Behavioral Economics',
  'The History of the Roman Republic',
  'Astronomy: The Lifecycle of a Red Dwarf',
  'Marine Biology: Hydrothermal Vents and Extremophiles',
  'Archaeology: Underwater Cities of the Mediterranean',
  'Introduction to Blockchain Technology in Supply Chain',
  'Sociology of Sports and Team Dynamics',
  'The Impact of Digital Advertising on Consumer Behavior',
  'Evolution of Cinematic Special Effects',
  'Modernism vs Postmodernism in Visual Arts',
  'The History of Space Law and International Treaties',
  'Biology of Hibernation in Mammals',
  'Architecture: The Influence of Bauhaus on Modern Design',
  'Environmental Impact of Textile Waste',
  'Social Media and the Future of Journalism',
  'Psychology of Social Influence and Obedience',
  'History of the Han Dynasty in China',
  'Astronomy: Potential for Life on Europa and Enceladus',
  'Marine Biology: Importance of Phytoplankton',
  'Economics of the Gig Economy in Developing Countries',
  'The Rise of E-sports and Its Societal Impact',
  'Architectural Restoration of Historic Landmarks',
  'Introduction to Nanotechnology in Materials Science',
  'Sociology of Family Structures in the Digital Age',
  'The History of the Abolitionist Movement',
  'Plant Biology: Mycorrhizal Networks in Forest Ecology',
  'Impact of Tourism on Indigenous Cultures',
  'Public Health Strategies in Combating Infectious Diseases',
  'The History of the Samurai in Feudal Japan',
  'Psychology of Sleep and Dreams',
  'Environmental Science: The Great Pacific Garbage Patch',
  'The Evolution of Modern English from Old English',
  'Economic Impact of Universal Basic Income Experiments',
  'The Future of Urban Mobility: Hyperloop and eVTOL'
];

async function generateAndSave(topic, type = 'FULL') {
  try {
    const masterPromptPath = path.resolve('../Toefl/숏폼 토플 마스터 프롬프트.md');
    const masterPrompt = await fs.readFile(masterPromptPath, 'utf8');

    const lengthGuideline = type === 'SHORT' 
      ? "PASSAGE LENGTH: Maximum 100 words. Focus on a single summary paragraph. Achieve a 1-minute completion time."
      : "PASSAGE LENGTH: 150-200 words. standard TOEFL short-form style.";

    const systemPrompt = `${masterPrompt}\n\n### SPECIFIC FORMAT RULES:\n${lengthGuideline}\n\nJSON Output: You MUST output the response in EXACT JSON format.`;
    const userPrompt = `주제 '${topic}'에 기반하여 ${type === 'SHORT' ? '1분 숏 바이트(요약형)' : '표준 숏폼'} 토플 문제 1세트를 생성해 줘.`;

    const result = await llmService.generateContent(systemPrompt, userPrompt);
    
    const { data: newQuestion, error: saveError } = await supabase
      .from('BiteQuestion')
      .insert([{
        topic: topic,
        type: type,
        content_json: JSON.stringify(result)
      }])
      .select()
      .single();

    if (saveError) {
      console.error(`Error saving ${topic}:`, saveError.message);
    } else {
      console.log(`Successfully saved ${topic} (${type}) - ID: ${newQuestion.id}`);
    }
  } catch (error) {
    console.error(`Error generating ${topic}:`, error.message);
  }
}

async function bulkGenerate() {
  console.log("Starting bulk question generation...");
  
  // Total target: 200 questions. 
  // We have 30 topics. 1 FULL + 1 SHORT per topic = 60 questions per run.
  // Let's run multiple types or repeat topics with slight variations.
  
  for (const topic of TOPICS) {
    console.log(`Processing Topic: ${topic}`);
    await generateAndSave(topic, 'FULL');
    await generateAndSave(topic, 'SHORT');
    // Wait a bit between calls to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("Bulk generation complete.");
}

bulkGenerate();
