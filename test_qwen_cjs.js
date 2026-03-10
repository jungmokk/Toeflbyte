const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the server directory
dotenv.config({ path: path.resolve(__dirname, 'server', '.env') });

const qwenKey = process.env.QWEN_API_KEY;

if (!qwenKey) {
  console.error('❌ QWEN_API_KEY not found in server/.env');
  process.exit(1);
}

const client = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: qwenKey,
});

async function testQwen() {
  console.log('Testing Qwen-Flash API...');
  try {
    const response = await client.chat.completions.create({
      model: 'qwen-flash',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, this is a test. Reply with "OK" if you receive this.' },
      ],
    });
    console.log('✅ Qwen-Flash response:', response.choices[0].message.content);
    
    console.log('\nTesting Qwen-Plus API...');
    const responsePlus = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Reply with "FAST" if you receive this.' },
      ],
    });
    console.log('✅ Qwen-Plus response:', responsePlus.choices[0].message.content);
    
    console.log('\n🚀 All Qwen tests passed successfully!');
  } catch (error) {
    console.error('❌ Qwen API Error:', error.message);
  }
}

testQwen();
