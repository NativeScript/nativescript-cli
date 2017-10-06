const fs = require('fs');
const path = require('path');

// Copy package.json
const pkg = require('../src/core/package.json');
delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
fs.writeFileSync('dist/core/package.json', JSON.stringify(pkg, null, 2));

// Copy README
const readme = fs.readFileSync(path.join(__dirname, '../src/core/README.md')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/core/README.md'), readme);

// Copy LICENSE
const license = fs.readFileSync(path.join(__dirname, '../src/core/LICENSE')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/core/LICENSE'), license);
