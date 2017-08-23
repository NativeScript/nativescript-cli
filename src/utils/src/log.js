import log from 'loglevel';

/**
 * @private
 */
log.setDefaultLevel(log.levels.SILENT);

/**
 * @private
 */
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

/**
 * @private
 */
export default log;
