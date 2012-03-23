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

// Kinvey.Collection test suite
describe('Kinvey.Collection', function() {
    // Setup suite
    var col;
    beforeEach(function() {
        col = new Kinvey.Collection(TEST_COLLECTION);
    });

    // Collection.all()
    it('retrieves all entities', function() {
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
            col.all(function(list) {
                flag = 2 === list.length;
            }, function() {
                flag = false;
            });
        });
    });

    // Collection.count()
    it('counts the number of entities', function() {
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
            col.count(function(i) {
                flag = 2 === i;
            }, function() {
                flag = false;
            });
        });
    });

    // Collection.removeAll()
    it('removes all entities', function() {
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
            col.removeAll(function() {
                // Retrieve all entities, which should be 0
                col.all(function(list) {
                    flag = 0 === list.length;
                }, function() {
                    flag = false;
                });
            }, function() {
                flag = false;
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
