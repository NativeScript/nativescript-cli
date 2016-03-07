var path = require('path');
var fs = require('fs');
var packagePath = path.join('./', 'package.json');
var packageConfig = JSON.parse(fs.readFileSync(packagePath));
var packageName = packageConfig.name;
var modulePrototype = require('module').Module.prototype;

if (!modulePrototype._originalRequire) {
  modulePrototype._originalRequire = modulePrototype.require;
  modulePrototype.require = function(filePath) {
    if (filePath.indexOf(packageName) !== -1) {
      return modulePrototype._originalRequire.call(this, path.join(__dirname, 'src', filePath.replace(packageName, '')));
    } else if (filePath.indexOf('test') !== -1) {
      return modulePrototype._originalRequire.call(this, path.join(__dirname, 'test', filePath.replace('test', '')));
    }

    return modulePrototype._originalRequire.call(this, filePath);
  };
}

var kinvey = require('kinvey-sdk-core/kinvey');
console.log(kinvey);
