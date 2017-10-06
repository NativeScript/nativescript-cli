const fs = require('fs');
const path = require('path');

// Copy package.json
const pkg = require('../package.json');
delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));

// Copy README
const readme = fs.readFileSync(path.join(__dirname, '../README.md')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/README.md'), readme);

// Copy LICENSE
const license = fs.readFileSync(path.join(__dirname, '../LICENSE')).toString();
fs.writeFileSync(path.join(__dirname, '../dist/LICENSE'), license);
