/**
 * Copyright 2015 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Test suite for `CustomRequestProperties`.
 */
describe('Kinvey.CustomRequestProperties', function() {

  /**
   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
   * @param obj1
   * @param obj2
   * @returns obj3 a new object based on obj1 and obj2
   */
  function mergeObjects(obj1, obj2) {
    var obj3 = {},
        attrname;

    for (attrname in obj1) {
      if (obj1.hasOwnProperty(attrname)) {
        obj3[attrname] = obj1[attrname];
      }
    }

    for (attrname in obj2) {
      if (obj2.hasOwnProperty(attrname)) {
        obj3[attrname] = obj2[attrname];
      }
    }

    return obj3;
  }

  after(function() {
    // Clear the version
    Kinvey.CustomRequestProperties.clear();
  });

  describe('get properties', function() {
    var properties = {
      foo: 'bar'
    };

    beforeEach(function() {
      Kinvey.CustomRequestProperties.setProperties(properties);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.CustomRequestProperties.clear();
    });

    it('should return all the properties', function() {
      expect(Kinvey.CustomRequestProperties.properties()).to.deep.equal(properties);
    });

    it('should return an single value for a property', function() {
      expect(Kinvey.CustomRequestProperties.property('foo')).to.equal(properties.foo);
    });
  });

  describe('set properties', function() {
    var properties = {
      foo: 'bar'
    };

    afterEach(function() {
      // Clear the version
      Kinvey.CustomRequestProperties.clear();
    });

    // Test suite.
    it('should set the properties by object', function() {
      Kinvey.CustomRequestProperties.setProperties(properties);
      expect(Kinvey.CustomRequestProperties.properties()).to.deep.equal(properties);
    });

    it('should set the property by name and value', function() {
      Kinvey.CustomRequestProperties.setProperty('foo', properties.foo);
      expect(Kinvey.CustomRequestProperties.properties()).to.deep.equal(properties);
    });
  });

  describe('add properties', function() {
    var properties = {
      foo: 'bar'
    };

    beforeEach(function() {
      Kinvey.CustomRequestProperties.setProperties(properties);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.CustomRequestProperties.clear();
    });

    it('should add the properties as an object to the exisiting properties', function() {
      var myProperties = {
        foo2: 'baz'
      };

      Kinvey.CustomRequestProperties.addProperties(myProperties);
      expect(Kinvey.CustomRequestProperties.properties()).to.deep.equal(mergeObjects(properties, myProperties));
    });
  });

  describe('clear properties', function() {
    var properties = {
      foo: 'bar'
    };

    beforeEach(function() {
      // Set the version
      Kinvey.CustomRequestProperties.setProperties(properties);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.CustomRequestProperties.clear();
    });

    it('should return and empty object', function() {
      Kinvey.CustomRequestProperties.clear();
      expect(Kinvey.CustomRequestProperties.properties()).to.deep.equal({});
    });
  });

});
