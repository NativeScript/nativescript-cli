import { expect } from 'chai';
import isNumber from 'lodash/isNumber';
import first from 'lodash/first';
import sortBy from 'lodash/sortBy';
import { DataStore, DataStoreType, Query, User } from '__SDK__';
import * as Constants from './constants';

export function ensureArray(entities) {
  return [].concat(entities);
}

export function assertEntityMetadata(entities) {
  ensureArray(entities).forEach((entity) => {
    expect(entity._kmd.lmt).to.exist;
    expect(entity._kmd.ect).to.exist;
    expect(entity._acl.creator).to.exist;
  });
}

export function deleteEntityMetadata(entities) {
  ensureArray(entities).forEach((entity) => {
    if (entity) {
      delete entity._kmd;
      delete entity._acl;
    }
  });
  return entities;
}

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

export function randomEmailAddress(size, prefix) {
  return `${randomString(size, prefix)}@test.com`;
}

export function getEntity(_id, textValue, numberValue, array) {
  const entity = {
    [Constants.TextFieldName]: textValue || randomString(),
    [Constants.NumberFieldName]: numberValue || numberValue === 0 ? numberValue : Math.random(),
    [Constants.ArrayFieldName]: array || [randomString(), randomString()]
  };

  if (_id) {
    entity._id = _id;
  }

  return entity;
}

export function cleanUpCollectionData(collectionName) {
  const networkStore = DataStore.collection(collectionName, DataStoreType.Network);
  const syncStore = DataStore.collection(collectionName, DataStoreType.Sync);
  return networkStore.find().toPromise()
    .then((entities) => {
      if (entities && entities.length > 0) {
        const query = new Query();
        query.contains('_id', entities.map(a => a._id));
        return networkStore.remove(query);
      }
      return Promise.resolve();
    })
    .then(() => syncStore.clearSync())
    .then(() => syncStore.clear());
}

function deleteUsers(userIds) {
  return Promise.all(userIds.map(userId => {
    return User.remove(userId, { hard: true });
  }));
}

export function cleanUpAppData(collectionName, createdUserIds) {
  let currentUserId;
  return User.logout()
    .then(() => {
      return User.signup();
    })
    .then((user) => {
      currentUserId = user.data._id;
      return cleanUpCollectionData(collectionName);
    })
    .then(() => {
      return deleteUsers(createdUserIds);
    })
    .then(() => {
      return deleteUsers([currentUserId]);
    })
    .then(() => {
      createdUserIds.length = 0;
      return User.logout();
    });
}

// validates the result of a find() or a count() operation according to the DataStore type with an optional sorting
// works with a single entity, an array of entities or with numbers
export function validateReadResult(dataStoreType, spy, cacheExpectedEntities, backendExpectedEntities, sortBeforeCompare) {
  let firstCallArgs = spy.firstCall.args[0];
  let secondCallArgs;
  if (dataStoreType === DataStoreType.Cache) {
    secondCallArgs = spy.secondCall.args[0];
  }

  const isComparingEntities = !isNumber(cacheExpectedEntities);
  const isSavedEntity = Object.prototype.hasOwnProperty.call(first(ensureArray(cacheExpectedEntities)), '_id');
  const shouldPrepareForComparison = isComparingEntities && isSavedEntity;

  // if we have entities, which have an _id field, we remove the metadata in order to compare properly and sort by _id if needed
  if (shouldPrepareForComparison) {
    deleteEntityMetadata(firstCallArgs);
    if (sortBeforeCompare) {
      firstCallArgs = sortBy(firstCallArgs, '_id');
      cacheExpectedEntities = sortBy(cacheExpectedEntities, '_id');
      backendExpectedEntities = sortBy(backendExpectedEntities, '_id');
    }
    if (secondCallArgs) {
      deleteEntityMetadata(secondCallArgs);
      if (sortBeforeCompare) {
        secondCallArgs = sortBy(secondCallArgs, '_id');
      }
    }
  }

  // the actual comparison, according to the Data Store type
  if (dataStoreType === DataStoreType.Network) {
    expect(spy.calledOnce).to.be.true;
    expect(firstCallArgs).to.deep.equal(backendExpectedEntities);
  } else if (dataStoreType === DataStoreType.Sync) {
    expect(spy.calledOnce).to.be.true;
    expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
  } else {
    expect(spy.calledTwice).to.be.true;
    expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
    expect(secondCallArgs).to.deep.equal(backendExpectedEntities);
  }
}
