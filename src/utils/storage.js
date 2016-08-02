import localStorage from 'local-storage';
const userCollectionName = process.env.KINVEY_USER_COLLECTION_NAME || 'kinvey_user';

/**
 * @private
 */
export function getActiveUser(client) {
  return localStorage.get(`${client.appKey}${userCollectionName}`);
}

/**
 * @private
 */
export function setActiveUser(client, data) {
  if (data) {
    try {
      return localStorage.set(`${client.appKey}${userCollectionName}`, data);
    } catch (error) {
      return false;
    }
  }

  return localStorage.remove(`${client.appKey}${userCollectionName}`);
}

/**
 * @private
 */
export function getIdentitySession(client, identity) {
  return localStorage.get(`${client.appKey}${identity}`);
}

/**
 * @private
 */
export function setIdentitySession(client, identity, session) {
  if (session) {
    try {
      return localStorage.set(`${client.appKey}${identity}`, session);
    } catch (error) {
      return false;
    }
  }

  return localStorage.remove(`${client.appKey}${identity}`);
}
