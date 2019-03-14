import KinveyError from '../errors/kinvey';

export async function register() {
  throw new KinveyError('Push notifications are currently not supported on the platform.');
}

export async function unregister(options: any = {}) {
  throw new KinveyError('Push notifications are currently not supported on the platform.');
}
