module.exports = process.env.PROMISE_QUEUE_COVERAGE ?
    require('./lib-cov') :
    require('./lib');
