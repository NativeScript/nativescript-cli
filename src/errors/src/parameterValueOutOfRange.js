import KinveyError from './kinvey';

function ParameterValueOutOfRangeError(message = 'The value specified for one of the request parameters is out of range.', debug, code) {
  return KinveyError.call(this, message, debug, code);
}

ParameterValueOutOfRangeError.prototype = Object.create(KinveyError.prototype);
ParameterValueOutOfRangeError.prototype.constructor = ParameterValueOutOfRangeError;

export default ParameterValueOutOfRangeError;

