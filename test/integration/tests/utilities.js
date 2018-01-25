(function () {
  function ensureArray(entities) {
    return [].concat(entities);
  }

  function assertEntityMetadata(entities) {
    ensureArray(entities).forEach((entity) => {
      expect(entity._kmd.lmt).to.exist;
      expect(entity._kmd.ect).to.exist;
      expect(entity._acl.creator).to.exist;
    });
  }

  function deleteEntityMetadata(entities) {
    ensureArray(entities).forEach((entity) => {
      delete entity._kmd;
      delete entity._acl;
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

  function randomString(size = 18, prefix = '') {
    return `${prefix}${uid(size)}`;
  }

  function randomEmailAddress() {
    return `${randomString()}@test.com`;
  }

  function getEntity(_id, textValue, numberValue, array) {
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

  // saves an array of entities and returns the result sorted by _id for an easier usage in 'find with modifiers' tests
  function saveEntities(collectionName, entities) {
    const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
    const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
    return Promise.all(entities.map(entity => {
      return networkStore.save(entity);
    }))
      .then(() => syncStore.pull())
      .then(result => _.sortBy(deleteEntityMetadata(result), '_id'));
  }

  function deleteUsers(userIds) {
    return Promise.all(userIds.map(userId => {
      return Kinvey.User.remove(userId, {
        hard: true
      });
    }));
  }

  // validates the result of a find() or a count() operation according to the DataStore type with an optional sorting
  // works with a single entity, an array of entities or with numbers
  function validateReadResult(dataStoreType, spy, cacheExpectedEntities, backendExpectedEntities, sortBeforeCompare) {
    let firstCallArgs = spy.firstCall.args[0];
    let secondCallArgs;
    if (dataStoreType === Kinvey.DataStoreType.Cache) {
      secondCallArgs = spy.secondCall.args[0];
    }

    const isComparingEntities = !_.isNumber(cacheExpectedEntities);
    const isSavedEntity = Object.prototype.hasOwnProperty.call(_.first(ensureArray(cacheExpectedEntities)), '_id');
    const shouldPrepareForComparison = isComparingEntities && isSavedEntity;

    // if we have entities, which have an _id field, we remove the metadata in order to compare properly and sort by _id if needed
    if (shouldPrepareForComparison) {
      deleteEntityMetadata(firstCallArgs);
      if (sortBeforeCompare) {
        firstCallArgs = _.sortBy(firstCallArgs, '_id');
        cacheExpectedEntities = _.sortBy(cacheExpectedEntities, '_id');
        backendExpectedEntities = _.sortBy(backendExpectedEntities, '_id');
      }
      if (secondCallArgs) {
        deleteEntityMetadata(secondCallArgs);
        if (sortBeforeCompare) {
          secondCallArgs = _.sortBy(secondCallArgs, '_id');
        }
      }
    }

    // the actual comparison, according to the Data Store type
    if (dataStoreType === Kinvey.DataStoreType.Network) {
      expect(spy.calledOnce).to.be.true;
      expect(firstCallArgs).to.deep.equal(backendExpectedEntities);
    } else if (dataStoreType === Kinvey.DataStoreType.Sync) {
      expect(spy.calledOnce).to.be.true;
      expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
    } else {
      expect(spy.calledTwice).to.be.true;
      expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
      expect(secondCallArgs).to.deep.equal(backendExpectedEntities);
    }
  }

  function retrieveEntity(collectionName, dataStoreType, entity, searchField) {
    const store = Kinvey.DataStore.collection(collectionName, dataStoreType);
    const query = new Kinvey.Query();
    const propertyToSearchBy = searchField || '_id';
    query.equalTo(propertyToSearchBy, entity[propertyToSearchBy]);
    return store.find(query).toPromise()
      .then(result => result[0]);
  }

  function validatePendingSyncCount(dataStoreType, collectionName, itemsForSyncCount) {
    if (dataStoreType !== Kinvey.DataStoreType.Network) {
      let expectedCount = 0;
      if (dataStoreType === Kinvey.DataStoreType.Sync) {
        expectedCount = itemsForSyncCount;
      }
      const store = Kinvey.DataStore.collection(collectionName, dataStoreType);
      return store.pendingSyncCount()
        .then((syncCount) => {
          expect(syncCount).to.equal(expectedCount);
        });
    }
    return Promise.resolve();
  }

  function validateEntity(dataStoreType, collectionName, expectedEntity, searchField) {
    let entityFromCache;
    let entityFromBackend;

    return retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, expectedEntity, searchField)
      .then((result) => {
        if (result) {
          entityFromCache = deleteEntityMetadata(result);
        }
        return retrieveEntity(collectionName, Kinvey.DataStoreType.Network, expectedEntity, searchField);
      })
      .then((result) => {
        if (result) {
          entityFromBackend = deleteEntityMetadata(result);
        }
        if (dataStoreType === Kinvey.DataStoreType.Network) {
          expect(entityFromCache).to.be.undefined;
          expect(entityFromBackend).to.deep.equal(expectedEntity);
        } else if (dataStoreType === Kinvey.DataStoreType.Sync) {
          expect(entityFromCache).to.deep.equal(expectedEntity);
          expect(entityFromBackend).to.be.undefined;
        } else {
          expect(entityFromCache).to.deep.equal(expectedEntity);
          expect(entityFromBackend).to.deep.equal(expectedEntity);
        }
      });
  }

  function cleanUpCollectionData(collectionName) {
    const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
    const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
    return networkStore.find().toPromise()
      .then((entities) => {
        if (entities && entities.length > 0) {
          const query = new Kinvey.Query();
          query.contains('_id', entities.map(a => a._id));
          return networkStore.remove(query);
        }
        return Promise.resolve();
      })
      .then(() => syncStore.clearSync())
      .then(() => syncStore.clear());
  }

  function cleanUpAppData(collectionName, createdUserIds) {
    return Kinvey.User.logout()
      .then(() => {
        return Kinvey.User.signup();
      })
      .then((user) => {
        createdUserIds.push(user.data._id);
        return cleanUpCollectionData(collectionName);
      })
      .then(() => {
        return deleteUsers(createdUserIds);
      })
      .then(() => {
        createdUserIds.length = 0;
        return Kinvey.User.logout();
      });
  }

  const utilities = {
    uid,
    randomString,
    randomEmailAddress,
    getEntity,
    saveEntities,
    deleteUsers,
    ensureArray,
    assertEntityMetadata,
    deleteEntityMetadata,
    validateReadResult,
    retrieveEntity,
    validatePendingSyncCount,
    validateEntity,
    cleanUpCollectionData,
    cleanUpAppData
  };

  if (typeof module === 'object') {
    module.exports = utilities;
  } else {
    window.utilities = utilities;
  }
})();
