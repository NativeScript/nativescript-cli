import localStorage from 'local-storage';
const userCollectionName = process.env.KINVEY_USER_COLLECTION_NAME || 'kinvey_user';
const socialIdentityCollectionName = process.env.KINVEY_SOCIAL_IDENTITY_COLLECTION_NAME
                                                || 'kinvey_socialIdentity';
const syncKeyCollectionName = process.env.KINVEY_SYNC_KEY_COLLECTION_NAME || 'kinvey_syncKey';

// Get the active user
export function getActiveUser(client) {
  return localStorage.get(`${client.appKey}${userCollectionName}`);
}

// Set the active user
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

// Get the active social identity
export function getActiveSocialIdentity(client) {
  return localStorage.get(`${client.appKey}${socialIdentityCollectionName}`);
}

// Set the active social identity
export function setActiveSocialIdentity(client, data) {
  if (data) {
    try {
      return localStorage.set(`${client.appKey}${socialIdentityCollectionName}`, data);
    } catch (error) {
      return false;
    }
  }

  return localStorage.remove(`${client.appKey}${socialIdentityCollectionName}`);
}

// Get the sync key
export function getSyncKey(client) {
  return localStorage.get(`${client.appKey}${syncKeyCollectionName}`);
}

// Set the sync key
export function setSyncKey(client, key) {
  if (key) {
    try {
      return localStorage.set(`${client.appKey}${syncKeyCollectionName}`, key);
    } catch (error) {
      return false;
    }
  }

  return localStorage.remove(`${client.appKey}${syncKeyCollectionName}`);
}
