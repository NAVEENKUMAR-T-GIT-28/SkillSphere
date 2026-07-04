const fs = require('fs');
const path = require('path');

const reposDir = path.join(__dirname, 'repositories');
const files = fs.readdirSync(reposDir).filter(f => f.endsWith('.js'));

let hasError = false;
for (const file of files) {
  try {
    require(path.join(reposDir, file));
    console.log(`✅ ${file} loaded successfully`);
  } catch (err) {
    console.error(`❌ ${file} failed:`, err.message);
    hasError = true;
  }
}
if (hasError) {
  process.exit(1);
} else {
  console.log('🎉 All repos loaded successfully!');
}
