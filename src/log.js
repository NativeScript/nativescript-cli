import Log from 'loglevel';
const originalFactory = Log.methodFactory;

Log.methodFactory = function methodFactory(methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function log(message, ...theArgs) {
    message = `Kinvey: ${message}`;

    if (theArgs.length > 0) {
      rawMethod(message, theArgs);
    } else {
      rawMethod(message);
    }
  };
};

Log.setDefaultLevel(Log.levels.SILENT);
export { Log };
