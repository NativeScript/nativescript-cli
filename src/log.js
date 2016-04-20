import Log from 'loglevel';
const originalFactory = Log.methodFactory;

Log.methodFactory = function methodFactory(methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function log(message) {
    rawMethod(`Kinvey: ${message}`);
  };
};

log.setDefaultLevel(Log.levels.SILENT);
export { Log };
