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

// Util test suite
describe('Util', function() {
    /**
     * _.extend()
     */
    it('extends an objects with another object', function() {
        var expected = { a: 1, b: 1 };
        expect(extend({a: 1}, {b: 1})).toEqual(expected);
        expect(extend({b: 1}, {a: 1})).toEqual(expected);
    });

    /**
     * _.inherits()
     */
    it('extends a class with another class', function() {
        // Define two mock classes
        var SubClass = function() {
            SubClass._super.constructor.call(this);// call parent constructor
            this.a = 1;
        };
        var SupClass = function() {
            this.b = 1;
        };
        inherits(SubClass, SupClass);// SubClass extends SupClass

        // Test inheritance
        expect(new SubClass() instanceof SubClass).toBeTruthy();
        expect(new SubClass() instanceof SupClass).toBeTruthy();

        expect(new SupClass() instanceof SubClass).toBeFalsy();
        expect(new SupClass() instanceof SupClass).toBeTruthy();

        // Test property inheritance
        expect(new SubClass().b).toEqual(1);

        expect(new SupClass().a).toBeUndefined();
    });
});
