const path = require('path');
const ngPackage = require('ng-packagr');

ngPackage
  .ngPackagr()
  .forProject(path.join(__dirname, '../ng-package.json'))
  .withTsConfig(path.join(__dirname, '../tsconfig.json'))
  .build()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
