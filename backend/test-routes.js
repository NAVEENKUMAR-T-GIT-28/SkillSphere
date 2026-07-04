const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.js'));

let errors = 0;
files.forEach(file => {
  try {
    require(path.join(routesPath, file));
    console.log(`✅ Successfully loaded ${file}`);
  } catch (err) {
    console.error(`❌ Error loading ${file}:`, err.message);
    errors++;
  }
});

if (errors > 0) {
  process.exit(1);
} else {
  console.log('🎉 All routes loaded successfully!');
  process.exit(0);
}
