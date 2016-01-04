global.mocha.setup('bdd');

global.onload = function() {
  global.mocha.checkLeaks();
  global.mocha.globals([
    'stub',
    'spy',
    'expect'
  ]);

  require('./setup')();

  if (global.mochaPhantomJS) {
    global.mochaPhantomJS.run();
  } else {
    global.mocha.run();
  }
};
