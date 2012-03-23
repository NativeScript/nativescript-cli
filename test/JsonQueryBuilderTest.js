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

// Kinvey.Query test suite
describe('Kinvey.JsonQueryBuilder', function() {
    // Setup suite
    var builder = null;
    beforeEach(function() {
        builder = new Kinvey.Query.JsonQueryBuilder();
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.all()
     */
    it('sets an all criteria', function() {
        var expected = {
            property: {
                $all: [ 1, 2 ]
            }
        };

        builder.put('property').all([ 1, 2 ]);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.exists()
     */
    it('sets an exists criteria', function() {
        var expected = {
            property: {
                $exists: true
            }
        };

        builder.put('property').exists(true);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.greaterThan()
     */
    it('sets a greater than criteria', function() {
        var expected = {
            property: {
                $gt: 1
            }
        };

        builder.put('property').greaterThan(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.greaterThanEquals()
     */
    it('sets a greater than or equal to criteria', function() {
        var expected = {
            property: {
                $gte: 1
            }
        };

        builder.put('property').greaterThanEquals(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.contains()
     */
    it('sets an in criteria', function() {
        var expected = {
            property: {
                $in: [ 1, 2 ]
            }
        };

        builder.put('property').contains([ 1, 2 ]);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.is()
     */
    it('sets an is criteria', function() {
        var expected = {
            property: 'value'
        };

        builder.put('property').is('value');
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.lessThan()
     */
    it('sets a less than criteria', function() {
        var expected = {
            property: {
                $lt: 1
            }
        };

        builder.put('property').lessThan(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.lessThanEquals()
     */
    it('sets a less than or equals to criteria', function() {
        var expected = {
            property: {
                $lte: 1
            }
        };

        builder.put('property').lessThanEquals(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.near()
     */
    it('sets a near criteria', function() {
        var expected = {
            property: {
                $near: [ 0, 0 ]
            }
        };

        builder.put('property').near([ 0, 0 ]);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.notEquals()
     */
    it('sets a not equals criteria', function() {
        var expected = {
            property: {
                $ne: 1
            }
        };

        builder.put('property').notEquals(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.notIn()
     */
    it('sets a not in criteria', function() {
        var expected = {
            property: {
                $nin: [ 1, 2 ]
            }
        };

        builder.put('property').notIn([ 1, 2 ]);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.size()
     */
    it('sets a size criteria', function() {
        var expected = {
            property: {
                $size: 1
            }
        };

        builder.put('property').size(1);
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.within()
     */
    it('sets a within criteria', function() {
        var expected = {
            property: {
                $within: {
                    $center: [ 0, 0 ]
                }
            }
        };

        builder.put('property').within({
            $center: [ 0, 0 ]
        });
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Kinvey.Query.JsonQueryBuilder.clear()
     */
    it('clears all criteria', function() {
        var expected = {};

        builder.put('property').is(1);
        builder.clear();
        expect(builder.get()).toEqual(expected);
    });

    /**
     * Combine multiple criteria
     */
    it('combines multiple criterias', function() {
        var expected = {
            property: {
                $lt: 1,
                $gt: 2
            }
        };

        builder.put('property').lessThan(1).greaterThan(2);
        expect(builder.get()).toEqual(expected);
    });
});