import { nested, randomString, isDefined } from 'src/utils';
import expect from 'expect';

describe('Object', function() {
  describe('nested()', function() {
    it('should return the obj if a property and default value is not provided', function() {
      const obj = {};
      const value = nested(obj);
      expect(value).toEqual(obj);
    });

    it('should return the default value if a property is not provided but a default value is', function() {
      const obj = {};
      const defaultValue = randomString();
      const value = nested(obj, null, defaultValue);
      expect(value).toEqual(defaultValue);
    });

    it('should return undefined if a default value is not provided', function() {
      const obj = {};
      const value = nested(obj, randomString());
      expect(value).toEqual(undefined);
    });

    it('should return the default value', function() {
      const obj = {};
      const defaultValue = randomString();
      const value = nested(obj, randomString(), defaultValue);
      expect(value).toEqual(defaultValue);
    });

    it('should return a top level property', function() {
      const obj = { foo: randomString() };
      const value = nested(obj, 'foo');
      expect(value).toEqual(obj.foo);
    });

    it('should return a nested property', function() {
      const obj = { foo: { bar: randomString() } };
      const value = nested(obj, 'foo.bar');
      expect(value).toEqual(obj.foo.bar);
    });
  });

  describe('isDefined()', function() {
    it('should return false for a null value', function() {
      expect(isDefined(null)).toEqual(false);
    });

    it('should return false for a void 0 value', function() {
      expect(isDefined(void 0)).toEqual(false);
    });

    it('should return false for an undefined value', function() {
      expect(isDefined(undefined)).toEqual(false);
    });

    it('should return true for a defined value', function() {
      expect(isDefined({})).toEqual(true);
    });
  });
});
