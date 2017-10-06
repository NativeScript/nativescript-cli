const fs = require('fs');
const path = require('path');

// Copy package.json
const pkg = require('../src/html5/package.json');
delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
fs.writeFileSync('dist/html5/package.json', JSON.stringify(pkg, null, 2));

// Copy README
const readme = fs.readFileSync(path.join(__dirname, '../src/html5/README.md')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/html5/README.md'), readme);

// Copy LICENSE
const license = fs.readFileSync(path.join(__dirname, '../src/html5/LICENSE')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/html5/LICENSE'), license);
