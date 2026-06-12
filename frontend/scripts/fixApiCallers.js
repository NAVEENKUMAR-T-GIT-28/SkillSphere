const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace `const data = await api.get` with `const { data, meta } = await api.get`
  // But wait, some places might do `const data = await api.post`
  // It's safer to just replace `const data = await api.` or `const newSkill = await api.`
  // Actually:
  content = content.replace(/const data = await api\.(get|post)\((.*?)\);/g, 'const { data, meta } = await api.$1($2);');
  content = content.replace(/const response = await api\.get\((.*?)\);/g, 'const { data: response, meta } = await api.get($1);');
  content = content.replace(/const new(\w+) = await api\.post\((.*?)\);/g, 'const { data: new$1 } = await api.post($2);');
  content = content.replace(/savedProfile = await api\.(patch|post)\((.*?)\);/g, '({ data: savedProfile } = await api.$1($2));');
  content = content.replace(/const application = await api\.post\((.*?)\);/g, 'const { data: application } = await api.post($1);');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
