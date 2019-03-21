import KinveyError from '../errors/kinvey';

export default async function restore() {
  throw new KinveyError('This function requires a master secret to be provided for your application. We strongly advise not to do this.');
}
