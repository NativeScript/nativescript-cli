#!/usr/bin/env node

var fsModule = require('fs');

// Adds a publishConfig section to the package.json file
// and sets a tag to it

var path = './package.json';
var fileOptions = {encoding: "utf-8"};
var content = fsModule.readFileSync(path, fileOptions);

var packageDef = JSON.parse(content);
if (!packageDef.publishConfig) {
    packageDef.publishConfig = {};
}

if ($TRAVIS_BRANCH === 'release') {
    packageDef.publishConfig.tag = 'rc';
} else {
    packageDef.publishConfig.tag = 'next';
}

var newContent = JSON.stringify(packageDef, null, '  ');
fsModule.writeFileSync(path, newContent, fileOptions);
