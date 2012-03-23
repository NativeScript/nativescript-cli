/*!
 * Copyright (c) 2012 Kinvey, Inc. All rights reserved.
 * 
 * Licensed to Kinvey, Inc. under one or more contributor
 * license agreements.  See the NOTICE file distributed with 
 * this work for additional information regarding copyright 
 * ownership.  Kinvey, Inc. licenses this file to you under the 
 * Apache License, Version 2.0 (the "License"); you may not 
 * use this file except in compliance with the License.  You 
 * may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Kinvey.Entity test suite
describe('Kinvey.Entity', function() {
    // Setup suite
    var entity;
    beforeEach(function() {
        entity = new Kinvey.Entity(TEST_COLLECTION);
    });

    // Kinvey.Entity.findBy()
    it('finds an entity', function() {
        // Setup tests
        var pass1 = pass2 = null;
        waitsFor(function() {
            return null !== pass1;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass1).toBeTruthy();
        });

        waitsFor(function() {
            return null !== pass2;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass2).toBeTruthy();
        });

        // Run tests
        refreshCollectionUnderTest(function() {
            // Find existant entity
            entity.findBy('prop1', 'value1', function() {
                pass1 = entity.getValue('prop1') === 'value1';
            }, function() {
                pass1 = false;
            });

            // Find nonexistant entity
            new Kinvey.Entity(TEST_COLLECTION)
                    .findBy('fake-prop', 'fake-value', function() {
                        pass2 = false;
                    }, function() {
                        pass2 = true;
                    });
        });
    });

    // Kinvey.Entity.load()
    it('loads an entity', function() {
        // Setup tests
        var pass1 = pass2 = null;
        waitsFor(function() {
            return null !== pass1;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass1).toBeTruthy();
        });

        waitsFor(function() {
            return null !== pass2;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass2).toBeTruthy();
        });

        // Run tests
        refreshCollectionUnderTest(function() {
            // Load existant entity
            entity.load('some-id', function() {
                pass1 = 'some-id' === entity.getId();
            }, function() {
                pass1 = false;
            });

            // Load nonexistant entity
            new Kinvey.Entity(TEST_COLLECTION).load('some-fake-id', function() {
                pass2 = false;
            }, function() {
                pass2 = true;
            });
        });
    });

    // Kinvey.Entity.remove()
    it('removes an entity', function() {
        // Setup test
        var flag = null;
        waitsFor(function() {
            return null !== flag;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(flag).toBeTruthy();
        });

        // Run test
        refreshCollectionUnderTest(function() {
            entity.setId('some-id');
            entity.remove(function() {
                flag = true;
            }, function() {
                flag = false;
            });
        });
    });

    // Kinvey.Entity.save()
    it('saves an entity', function() {
        // Setup tests
        var pass1 = pass2 = null;
        waitsFor(function() {
            return null !== pass1;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass1).toBeTruthy();
        });

        waitsFor(function() {
            return null !== pass2;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(pass2).toBeTruthy();
        });

        // Run tests
        refreshCollectionUnderTest(function() {
            // Save with preset id
            entity.setId('some-id');
            entity.save(function() {
                pass1 = true;
            }, function() {
                pass1 = false;
            });

            // Save without id
            new Kinvey.Entity(TEST_COLLECTION).save(function() {
                pass2 = true;
            }, function() {
                pass2 = false;
            });
        });
    });

    /**
     * Refreshes collection under test
     * 
     * @param {function()} complete complete callback
     * @throws {Error} when refreshing fails
     */
    function refreshCollectionUnderTest(complete) {
        // Error callback used when one of the request below fails
        var error = function() {
            throw new Error('Failed to refresh collection under test');
        };

        // Delete all entities, then create two new entities
        new Kinvey.Collection(TEST_COLLECTION).removeAll(function() {
            new Kinvey.Entity(TEST_COLLECTION, {
                _id: 'some-id',
                prop1: 'value1',
                prop2: 'value2'
            }).save(function() {
                new Kinvey.Entity(TEST_COLLECTION).save(function() {
                    complete();
                }, error);
            }, error);
        }, error);
    }
});
