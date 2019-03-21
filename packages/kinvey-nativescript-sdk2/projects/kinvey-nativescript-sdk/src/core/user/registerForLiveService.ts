import KinveyError from '../errors/kinvey';
import getActiveUser from './getActiveUser';

export default async function registerForLiveService() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.registerForLiveService();
  }

  throw new KinveyError('There is no active user');
}
