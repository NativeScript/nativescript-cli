function testFunc() {

  const dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Sync, Kinvey.DataStoreType.Cache];
  const invalidQueryMessage = 'Invalid query. It must be an instance of the Query class.';
  const notFoundErrorName = 'NotFoundError';
  const collectionName = externalConfig.collectionName;

  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`CRUD Entity - ${currentDataStoreType}`, () => {
      const textFieldName = Constants.TextFieldName;
      const numberFieldName = Constants.NumberFieldName;
      const arrayFieldName = Constants.ArrayFieldName;

      let networkStore;
      let storeToTest;
      const dataStoreType = currentDataStoreType;
      let createdUserIds = [];

      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());

      before((done) => {
        utilities.cleanUpAppData(collectionName, createdUserIds)
          .then(() => {
            return Kinvey.User.signup()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            //store for setup
            networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
            //store to test
            storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
            done();
          })
          .catch(done);
      });

      after((done) => {
        utilities.cleanUpAppData(collectionName, createdUserIds)
          .then(() => done())
          .catch(done)
      });
      describe('find and count operations', () => {

        before((done) => {
          networkStore.save(entity1)
            .then(() => {
              return networkStore.save(entity2)
            })
            .then(() => {
              if (dataStoreType !== Kinvey.DataStoreType.Network) {
                return storeToTest.pull()
              }
            })
            .then(() => {
              return networkStore.save(entity3)
            })
            .then(() => done())
            .catch(done)
        });

        describe('count()', () => {
          it('should throw an error for an invalid query', (done) => {
            storeToTest.count({})
              .subscribe(null, (error) => {
                try {
                  expect(error.message).to.equal(invalidQueryMessage);
                  done();
                } catch (e) {
                  done(e);
                }
              });
          });

          it('should return the count for the collection', (done) => {
            const onNextSpy = sinon.spy();
            storeToTest.count()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, 2, 3);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should return the count of the entities that match the query', (done) => {
            const query = new Kinvey.Query();
            query.equalTo('_id', entity2._id);
            const onNextSpy = sinon.spy();
            storeToTest.count(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, 1, 1);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('find()', function () {
          it('should throw an error if the query argument is not an instance of the Query class', (done) => {
            storeToTest.find({})
              .subscribe(null, (error) => {
                try {
                  expect(error.message).to.equal(invalidQueryMessage);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should return all the entities', (done) => {
            const onNextSpy = sinon.spy();
            storeToTest.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, [entity1, entity2], [entity1, entity2, entity3], true)
                  return utilities.retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, entity3)
                    .then((result) => {
                      if (result) {
                        result = utilities.deleteEntityMetadata(result);
                      }
                      expect(result).to.deep.equal(dataStoreType === Kinvey.DataStoreType.Cache ? entity3 : undefined);
                      done();
                    }).catch(done);
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should find the entities that match the query', (done) => {
            const onNextSpy = sinon.spy();
            const query = new Kinvey.Query();
            query.equalTo('_id', entity2._id);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, [entity2], [entity2])
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('findById()', () => {
          it('should throw a NotFoundError if the id argument does not exist', (done) => {
            const entityId = utilities.randomString();
            storeToTest.findById(entityId).toPromise()
              .catch((error) => {
                expect(error.name).to.contain(notFoundErrorName);
                done();
              }).catch(done);
          });

          it('should return undefined if an id is not provided', (done) => {
            storeToTest.findById().toPromise()
              .then((result) => {
                expect(result).to.be.undefined;
                done();
              }).catch(done);
          });

          it('should return the entity that matches the id argument', (done) => {
            const onNextSpy = sinon.spy();
            storeToTest.findById(entity2._id)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, entity2, entity2)
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });
      });

      // These are smoke tests and will not be executed for now.
      // If we decide to execute 'Modifiers' describe only for Sync data store, these tests will be added back
      describe.skip('find with modifiers', () => {
        let entities = [];
        const dataCount = 10;
        before((done) => {

          for (let i = 0; i < dataCount; i++) {
            entities.push(utilities.getEntity());
          }

          utilities.cleanUpCollectionData(collectionName)
            .then(() => {
              return utilities.saveEntities(collectionName, entities)
            })
            .then((result) => {
              entities = result;
              done();
            }).catch(done);
        });

        it('should sort ascending and skip correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.skip = dataCount - 2;
          query.ascending('_id');
          const expectedEntities = [entities[dataCount - 2], entities[dataCount - 1]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should sort descending and limit correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.limit = 2;
          query.descending('_id');
          const expectedEntities = [entities[dataCount - 1], entities[dataCount - 2]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should skip and limit correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.limit = 1;
          query.skip = dataCount - 2;
          query.ascending('_id');
          const expectedEntity = entities[dataCount - 2];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        //skipped because of a bug for syncStore and different behaviour of fields for Sync and Network
        it.skip('with fields should return only the specified fields', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.fields = [[textFieldName]];
          query.ascending('_id');
          const expectedEntity = { [textFieldName]: entities[dataCount - 2][textFieldName] };
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('Querying', () => {
        let entities = [];
        const dataCount = 10;
        const secondSortField = 'secondSortField'
        let onNextSpy;
        let query;

        before((done) => {

          for (let i = 0; i < dataCount; i++) {
            entities.push(utilities.getEntity(null, `test_${i}`, i, [`test_${i % 5}`, `second_test_${i % 5}`, `third_test_${i % 5}`]));
          }

          const textArray = ['aaa', 'aaB', 'aac']
          for (let i = 0; i < dataCount; i++) {
            entities[i].secondSortField = textArray[i % 3];
          }

          // used to test exists and size operators and null values
          entities[dataCount - 1][textFieldName] = null;
          delete entities[dataCount - 1][numberFieldName]
          entities[dataCount - 1][arrayFieldName] = [];
          entities[dataCount - 2][arrayFieldName] = [{}, {}];

          utilities.cleanUpCollectionData(collectionName)
            .then(() => {
              return utilities.saveEntities(collectionName, entities)
            })
            .then((result) => {
              entities = _.sortBy(result, numberFieldName);
              done();
            }).catch(done);
        });

        beforeEach((done) => {
          onNextSpy = sinon.spy();
          query = new Kinvey.Query();
          done();
        });

        describe('Comparison operators', function () {

          it('query.equalTo', (done) => {
            query.equalTo(textFieldName, entities[5][textFieldName]);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.equalTo with null', (done) => {
            query.equalTo(textFieldName, null);
            const expectedEntities = [entities[dataCount - 1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.notEqualTo', (done) => {
            query.notEqualTo(textFieldName, entities[5][textFieldName]);
            const expectedEntities = entities.filter(entity => entity != entities[5]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          //should be added back for execution when MLIBZ-2157 is fixed
          it.skip('query.notEqualTo with null', (done) => {
            query.notEqualTo(textFieldName, null);
            const expectedEntities = entities.filter(entity => entity[textFieldName] != null);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.greaterThan', (done) => {
            query.greaterThan(numberFieldName, entities[dataCount - 3][numberFieldName]);
            const expectedEntities = [entities[dataCount - 2]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.greaterThanOrEqualTo', (done) => {
            query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
            const expectedEntities = [entities[dataCount - 3], entities[dataCount - 2]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.lessThan', (done) => {
            query.lessThan(numberFieldName, entities[2][numberFieldName]);
            const expectedEntities = [entities[0], entities[1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.lessThanOrEqualTo', (done) => {
            query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
            const expectedEntities = [entities[0], entities[1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.exists', (done) => {
            query.exists(numberFieldName);
            const expectedEntities = entities.filter(entity => entity != entities[dataCount - 1]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.mod', (done) => {
            query.mod(numberFieldName, 4, 2);
            const expectedEntities = entities.filter(entity => entity[numberFieldName] % 4 === 2);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          //TODO: Add more tests for regular expression
          it('query.matches - with RegExp literal', (done) => {
            query.matches(textFieldName, /^test_5/);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.matches - with RegExp object', (done) => {
            query.matches(textFieldName, new RegExp('^test_5'));
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('multiple operators', (done) => {
            query.lessThan(numberFieldName, entities[2][numberFieldName])
              .greaterThan(numberFieldName, entities[0][numberFieldName]);
            const expectedEntities = [entities[1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('Array Operators', () => {

          describe('query.contains()', () => {

            it('with single value', (done) => {
              query.contains(textFieldName, entities[5][textFieldName]);
              const expectedEntities = [entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('string field with an array of values', (done) => {
              query.contains(textFieldName, entities[0][arrayFieldName]);
              const expectedEntities = [entities[0]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('array field with an array of values', (done) => {
              query.contains(arrayFieldName, entities[0][arrayFieldName]);
              const expectedEntities = [entities[0], entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('in combination with an existing filter', (done) => {
              query.notEqualTo(numberFieldName, entities[1][numberFieldName]);
              query.contains(textFieldName, [entities[0][textFieldName], entities[1][textFieldName]]);
              const expectedEntities = [entities[0]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('with null value', (done) => {
              query.contains(textFieldName, [null]);
              const expectedEntities = [entities[dataCount - 1]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });
          });

          describe('query.containsAll()', () => {

            it('with single value', (done) => {
              query.containsAll(textFieldName, entities[5][textFieldName]);
              const expectedEntities = [entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('string field with an array of values', (done) => {
              query.containsAll(textFieldName, [entities[5][textFieldName]]);
              const expectedEntities = [entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('array field with an array of values', (done) => {
              const arrayFieldValue = entities[5][arrayFieldName];
              const filteredArray = arrayFieldValue.filter(entity => entity != arrayFieldValue[2]);
              query.containsAll(arrayFieldName, filteredArray);
              const expectedEntities = [entities[0], entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('in combination with an existing filter', (done) => {
              query.notEqualTo(numberFieldName, entities[0][numberFieldName]);
              query.containsAll(arrayFieldName, entities[5][arrayFieldName]);
              const expectedEntities = [entities[5]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });
          });

          describe('query.notContainedIn()', () => {

            it('with single value', (done) => {
              query.notContainedIn(textFieldName, entities[5][textFieldName]);
              const expectedEntities = entities.filter(entity => entity != entities[5]);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('string property with an array of values', (done) => {
              query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
              const expectedEntities = entities.filter(entity => entity != entities[0]);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('array field with an array of values', (done) => {
              query.notContainedIn(arrayFieldName, entities[0][arrayFieldName]);
              const expectedEntities = entities.filter(entity => entity != entities[0] && entity != entities[5]);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('in combination with an existing filter', (done) => {
              query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
              query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
              const expectedEntities = [entities[1]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });
          });

          describe('query.size()', () => {

            it('should return the elements with an array field, having the submitted size', (done) => {
              query.size(arrayFieldName, 3);
              const expectedEntities = entities.filter(entity => entity != entities[dataCount - 1] && entity != entities[dataCount - 2]);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should return the elements with an empty array field, if the submitted size = 0', (done) => {
              query.size(arrayFieldName, 0);
              const expectedEntities = [entities[dataCount - 1]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('in combination with an existing filter', (done) => {
              query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
              query.size(arrayFieldName, 3);
              const expectedEntities = [entities[dataCount - 3]];
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });
          });
        });

        describe('Modifiers', () => {

          let expectedAscendingCache;
          let expectedAscendingServer;
          let expectedDescending;

          describe('Sort', () => {

            before((done) => {
              expectedAscendingCache = _.sortBy(entities, numberFieldName);
              expectedAscendingServer = _.sortBy(entities, numberFieldName);
              expectedAscendingServer.splice(0, 0, expectedAscendingServer.pop());
              expectedDescending = expectedAscendingServer.slice().reverse();
              done();
            });

            it('should sort ascending', (done) => {
              query.ascending(numberFieldName);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    //when MLIBZ-2156 is fixed, expectedAscendingCache should be replaced with expectedAscendingServer
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedAscendingCache, expectedAscendingServer);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should sort descending', (done) => {
              query.descending(numberFieldName);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedDescending, expectedDescending);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should sort by two fields ascending and descending', (done) => {
              query.ascending(secondSortField);
              query.descending(textFieldName);
              query.notEqualTo('_id', entities[dataCount - 1]._id);
              const sortedEntities = _.orderBy(entities, [secondSortField, numberFieldName], ['asc', 'desc'])
              const expectedEntities = sortedEntities.filter(entity => entity != entities[dataCount - 1])
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should skip correctly', (done) => {
              query.skip = dataCount - 3;
              query.descending(numberFieldName);
              const expectedEntities = expectedDescending.slice(dataCount - 3, dataCount);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should limit correctly', (done) => {
              query.limit = 2;
              query.descending(numberFieldName);
              const expectedEntities = expectedDescending.slice(0, 2);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });

            it('should skip and then limit correctly', (done) => {
              query.limit = 2;
              query.skip = 3
              query.descending(numberFieldName);
              const expectedEntities = expectedDescending.slice(3, 5);
              storeToTest.find(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            });
          });
        });
      });

      describe('save()', () => {

        before((done) => {
          utilities.cleanUpCollectionData(collectionName)
            .then(() => {
              return utilities.saveEntities(collectionName, [entity1, entity2])
            })
            .then(() => done())
            .catch(done);
        });

        beforeEach((done) => {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.clearSync()
              .then(() => done())
          } else {
            done();
          }
        });

        it('should throw an error when trying to save an array of entities', (done) => {
          storeToTest.save([entity1, entity2])
            .catch((error) => {
              expect(error.message).to.equal('Unable to create an array of entities.');
              done();
            }).catch(done);
        });

        it('should create a new entity without _id', (done) => {
          const newEntity = {
            [textFieldName]: utilities.randomString()
          };
          
          storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.exist;
              expect(createdEntity[textFieldName]).to.equal(newEntity[textFieldName]);
              if (dataStoreType === Kinvey.DataStoreType.Sync) {
                expect(createdEntity._kmd.local).to.be.true;
              } else {
                utilities.assertEntityMetadata(createdEntity);
              }
              newEntity._id = createdEntity._id;
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1)
            })
            .then(() => done())
            .catch(done);
        });

        it('should create a new entity using its _id', (done) => {
          const id = utilities.randomString();
          const textFieldValue = utilities.randomString();
          const newEntity = utilities.getEntity(id, textFieldValue);

          storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.equal(id);
              expect(createdEntity[textFieldName]).to.equal(textFieldValue);
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => done())
            .catch(done);
        });

        it('should update an existing entity', (done) => {
          const entityToUpdate = {
            _id: entity1._id,
            [textFieldName]: entity1[textFieldName],
            newProperty: utilities.randomString()
          };

          storeToTest.save(entityToUpdate)
            .then((updatedEntity) => {
              expect(updatedEntity._id).to.equal(entity1._id);
              expect(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
              return utilities.validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty')
            })
            .then(() => {
              return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1)
            })
            .then(() => done())
            .catch(done);
        });
      });

      describe('destroy operations', () => {

        before((done) => {
          utilities.cleanUpCollectionData(collectionName)
            .then(() => {
              return utilities.saveEntities(collectionName, [entity1, entity2])
            })
            .then(() => done())
            .catch(done);
        });

        describe('removeById()', () => {
          it('should throw an error if the id argument does not exist', (done) => {
            storeToTest.removeById(utilities.randomString())
              .catch((error) => {
                if (dataStoreType === Kinvey.DataStoreType.Network) {
                  expect(error.name).to.contain(notFoundErrorName);
                } else {
                  expect(error).to.exist
                }
                done();
              }).catch(done);
          });

          it('should remove only the entity that matches the id argument', (done) => {
            const newEntity = {
              _id: utilities.randomString()
            };
            storeToTest.save(newEntity)
              .then(() => {
                return storeToTest.removeById(newEntity._id)
              })
              .then((result) => {
                expect(result.count).to.equal(1);
                const onNextSpy = sinon.spy();
                const query = new Kinvey.Query();
                query.equalTo('_id', newEntity._id);
                return storeToTest.count(query)
                  .subscribe(onNextSpy, done, () => {
                    try {
                      utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0)
                      return storeToTest.count().toPromise()
                        .then((count) => {
                          expect(count).to.equal(2);
                          done();
                        }).catch(done);
                    } catch (error) {
                      done(error);
                    }
                  });
              });
          });
        });

        describe('remove()', () => {

          before((done) => {
            if (dataStoreType !== Kinvey.DataStoreType.Network) {
              return storeToTest.clearSync()
                .then(() => done())
            } else {
              done();
            }
          });

          it('should throw an error for an invalid query', (done) => {
            storeToTest.remove({})
              .catch((error) => {
                expect(error.message).to.equal(invalidQueryMessage);
                done();
              }).catch(done);
          });

          it('should remove all entities that match the query', (done) => {
            const newEntity = utilities.getEntity();
            const query = new Kinvey.Query();
            query.equalTo(textFieldName, newEntity[textFieldName]);
            let initialCount;
            utilities.saveEntities(collectionName, [newEntity, newEntity])
              .then(() => {
                return storeToTest.count().toPromise()
              })
              .then((count) => {
                initialCount = count;
                return storeToTest.remove(query)
              })
              .then((result) => {
                expect(result.count).to.equal(2);
                const onNextSpy = sinon.spy();
                return storeToTest.count(query)
                  .subscribe(onNextSpy, done, () => {
                    try {
                      utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0)
                      return storeToTest.count().toPromise()
                        .then((count) => {
                          expect(count).to.equal(initialCount - 2);
                          done();
                        }).catch(done);
                    } catch (error) {
                      done(error);
                    }
                  });
              }).catch(done);
          });

          it('should return a { count: 0 } when no entities are removed', (done) => {
            const query = new Kinvey.Query();
            query.equalTo('_id', utilities.randomString());
            storeToTest.remove(query)
              .then((result) => {
                expect(result.count).to.equal(0);
                done()
              }).catch(done);
          });
        });
      });
    });
  });
}

runner.run(testFunc);