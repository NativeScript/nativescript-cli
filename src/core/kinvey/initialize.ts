import KinveyError from '../errors/kinvey';

/**
 * @deprecated Please use init().
 */
export default function initialize() {
  return Promise.reject(new KinveyError('initialize() has been deprecated. Please use init().'));
}
