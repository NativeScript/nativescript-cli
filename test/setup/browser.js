global.mocha.setup('bdd');

global.onload = function onload() {
  global.mocha.checkLeaks();
  global.mocha.globals([
    'stub',
    'spy',
    'expect'
  ]);

  require('./setup')();

  beforeEach(function() {
    this.server = global.sinon.fakeServer.create();
  });

  afterEach(function() {
    this.server.restore();
  });

  if (global.mochaPhantomJS) {
    global.mochaPhantomJS.run();
  } else {
    global.mocha.run();
  }
};
