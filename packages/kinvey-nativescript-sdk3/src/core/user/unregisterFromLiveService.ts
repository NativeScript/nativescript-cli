import KinveyError from '../errors/kinvey';
import getActiveUser from './getActiveUser';

export default async function unregisterFromLiveService() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.unregisterFromLiveService();
  }

  throw new KinveyError('There is no active user');
}
