import log from 'loglevel';
const originalFactory = log.methodFactory;

log.methodFactory = function methodFactory(methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function log(message) {
    rawMethod(`Kinvey: ${message}`);
  };
};

log.setLevel(log.levels.ERROR);
export default log;
