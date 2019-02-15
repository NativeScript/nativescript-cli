import KinveyError from '../errors/kinvey';
import getActiveUser from './getActiveUser';

export default async function unregisterForLiveService() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.unregisterForLiveService();
  }

  throw new KinveyError('There is no active user');
}
