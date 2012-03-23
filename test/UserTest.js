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

// Kinvey.User test suite
describe('Kinvey.User', function() {
    // FIXME initializing user needs testing
    
//    /**
//     * Kinvey.User.findBy()
//     */
//    it('finds a user', function() {
//        // Setup tests
//        var pass1 = pass2 = null;
//        waitsFor(function() {
//            return null !== pass1;
//        }, TEST_TIMEOUT);
//        runs(function() {
//            expect(pass1).toBeTruthy(); 
//        });
//        
//        waitsFor(function() {
//            return null !== pass2;
//        }, TEST_TIMEOUT);
//        runs(function() {
//            expect(pass2).toBeTruthy();
//        });
//
//        // Run tests
//        var user = new Kinvey.User();
//        user.findBy('username', currentUser.getUsername(), function() {
//            pass1 = user.getUsername() === currentUser.getUsername();
//        }, function() {
//            pass1 = false;
//        });
//
//        new Kinvey.User().findBy('property', 'value', function() {
//            pass2 = false;
//        }, function() {
//            pass2 = true;
//        });
//    });
//    
//    /**
//     * Kinvey.User.load()
//     */
//    it('loads a user', function() {
//        // Setup tests
//        var pass1 = pass2 = null;
//        waitsFor(function() {
//            return null !== pass1;
//        }, TEST_TIMEOUT);
//        runs(function() {
//            expect(pass1).toBeTruthy();
//        });
//
//        waitsFor(function() {
//            return null !== pass2;
//        }, TEST_TIMEOUT);
//        runs(function() {
//            expect(pass2).toBeTruthy();
//        });
//
//        // Run tests
//        new Kinvey.User().load(currentUser.getId(), function() {
//            pass1 = true;
//        }, function() {
//            pass1 = false;
//        });
//
//        new Kinvey.User().load('some-fake-id', function() {
//            pass2 = false;
//        }, function() {
//            pass2 = true;
//        });
//    });
//
////    // Kinvey.User.remove()
////    it('removes a user', function() {
////        // Setup test
////        var flag = null;
////        waitsFor(function() {
////            return null !== flag;
////        }, TEST_TIMEOUT);
////        runs(function() {
////            expect(flag).toBeTruthy();
////        });
////
////        // Run test
////        var user = new Kinvey.User();
////        user.setId('some-fake-id');
////        user.remove(function() {
////            flag = true;
////        }, function() {
////            flag = false;
////        });
////    });
//
//    /**
//     * Kinvey.User.save()
//     */
//    it('saves a user', function() {
//        // Setup test
//        var flag = null;
//        waitsFor(function() {
//            return null !== flag;
//        }, TEST_TIMEOUT);
//        runs(function() {
//            expect(flag).toBeTruthy();
//        });
//
//        // Run test
//        currentUser.save(function() {
//            flag = true;
//        }, function() {
//            flag = false;
//        });
//    });
});
