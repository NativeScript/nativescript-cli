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

// Kinvey test suite
describe('Kinvey', function() {
    /**
     * Kinvey.init()
     */
    it('init throws error on invalid options', function() {
        // Run tests
        expect(function() {
            Kinvey.init({// omit appKey
                appSecret: 'foo'
            });
        }).toThrow();
        expect(function() {
            Kinvey.init({// omit appSecret
                appKey: 'foo'
            });
        }).toThrow();
    });

    /**
     * Kinvey.ping()
     */
    it('pings the Kinvey service', function() {
        // Setup test
        var flag = null;
        waitsFor(function() {
            return null !== flag;
        }, TEST_TIMEOUT);
        runs(function() {
            expect(flag).toBeTruthy();
        });

        // Run test
        Kinvey.ping(function() {
            flag = true;
        }, function() {
            flag = false;
        });
    });
});
