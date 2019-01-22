const path = require('path');
const build = require('./build');
const { PACKAGES_DIR, ROOT_DIR } = require('../utils');

const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const BUILD_DIR = path.resolve(PACKAGES_DIR, 'kinvey-html5-sdk', 'src');
const EXTENSIONS = ['.html5'];

build(SRC_DIR, BUILD_DIR, EXTENSIONS);
