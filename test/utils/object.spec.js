import { nested, isDefined } from '../../src/utils/object';
import chai from 'chai';
const expect = chai.expect;

describe('Object Utils', function() {
  describe('nested()', function() {
    before(function() {
      this.obj = {
        foo: 'bar',
        baz: {
          foos: 'bars'
        }
      };
    });

    it('should return undefined for a non existent property', function() {
      expect(nested(this.obj, 'property')).to.be.undefined;
    });

    it('should return the object when a property is not provided and when a default value is not provided', function() {
      expect(nested(this.obj)).to.deep.equal(this.obj);
    });

    it('should return the default value when a property is not provided', function() {
      expect(nested(this.obj, undefined, 'default')).to.equal('default');
    });

    it('should return the default value for a non existent property', function() {
      expect(nested(this.obj, 'property', 'bar')).to.equal('bar');
      expect(nested(this.obj, 'baz.property', 'bar')).to.equal('bar');
      expect(nested(this.obj, 'baz.property')).to.be.undefined;
    });

    it('should return the value for a defined property', function() {
      expect(nested(this.obj, 'foo')).to.equal(this.obj.foo);
      expect(nested(this.obj, 'baz.foos')).to.equal(this.obj.baz.foos);
    });
  });

  describe('isDefined()', function() {
    it('should return false for undefined or null', function() {
      expect(isDefined(undefined)).to.be.false;
      expect(isDefined(null)).to.be.false;
    });

    it('should return true for a defined value', function() {
      expect(isDefined({})).to.be.true;
      expect(isDefined(1)).to.be.true;
      expect(isDefined('')).to.be.true;
    });
  });
});
