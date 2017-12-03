import log from 'loglevel';

log.setDefaultLevel(log.levels.SILENT);

const originalFactory = log.methodFactory;
log.methodFactory = function methodFactory(methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function log(message, ...args) {
    message = `Kinvey: ${message}`;

    if (args.length > 0) {
      rawMethod(message, args);
    } else {
      rawMethod(message);
    }
  };
};

export {
  log as Log
};
