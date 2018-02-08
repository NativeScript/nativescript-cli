const http = require('http');

const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const serveTests = (appRoot, runner) =>
  new Promise(resolve => {
    const serve = serveStatic(appRoot);

    const server = http.createServer((req, res) => {
      const done = finalhandler(req, res);
      serve(req, res, done);
    });

    server.listen(0, () => {
      const staticPort = server.address().port;
      runner.emit('serve.static', staticPort);
      console.log(`Serving static files on port: ${staticPort}`);

      return resolve(staticPort);
    });
  });

module.exports = appRoot => ['serveTests', serveTests, appRoot];
