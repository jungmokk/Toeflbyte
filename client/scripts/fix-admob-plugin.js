const fs = require('fs');
const path = require('path');

const pluginPath = path.resolve(__dirname, '../node_modules/react-native-google-mobile-ads/app.plugin.js');

if (fs.existsSync(pluginPath)) {
  let content = fs.readFileSync(pluginPath, 'utf8');
  if (content.includes("require('./plugin/build')") && !content.includes(".default")) {
    content = content.replace("require('./plugin/build')", "require('./plugin/build').default");
    fs.writeFileSync(pluginPath, content);
    console.log('Successfully patched AdMob config plugin.');
  } else {
    console.log('AdMob config plugin already patched or not found in expected format.');
  }
} else {
  console.log('AdMob config plugin not found at:', pluginPath);
}
