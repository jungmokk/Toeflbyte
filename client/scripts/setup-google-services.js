const fs = require('fs');
const path = require('path');

/**
 * This script reconstructs the google-services.json file from an environment variable.
 * This is used for EAS builds where the file is not checked into version control.
 */

const GOOGLE_SERVICES_BASE64 = process.env.ANDROID_GOOGLE_SERVICES_BASE64;
const OUTPUT_PATH = path.join(__dirname, '..', 'google-services.json');

if (!GOOGLE_SERVICES_BASE64) {
  console.log('⚠️  ANDROID_GOOGLE_SERVICES_BASE64 environment variable is not set.');
  console.log('Skipping google-services.json reconstruction. (This is expected for local development if the file already exists)');
  process.exit(0);
}

try {
  console.log('⏳ Reconstructing google-services.json from environment variable...');
  const decodedContent = Buffer.from(GOOGLE_SERVICES_BASE64, 'base64').toString('utf-8');
  
  // Basic validation to ensure it looks like JSON
  JSON.parse(decodedContent);

  fs.writeFileSync(OUTPUT_PATH, decodedContent);
  console.log('✅ Successfully created google-services.json');
} catch (error) {
  console.error('❌ Failed to reconstruct google-services.json:');
  console.error(error.message);
  process.exit(1);
}
