import ACL from '../../src/core/acl';
import KinveyError from '../../src/core/errors/error';

describe('ACL', function() {
  before(function() {
    this.acl = new ACL();
  });

  describe('creator', function() {
    it('should be undefined', function() {
      expect(this.acl.creator).to.be.undefined;
    });

    it('should not be able to be changed', function() {
      expect(() => {
        this.acl.creator = 'foo';
      }).to.throw(TypeError, /only a getter/);
    });
  });

  describe('readers', function() {
    it('should be equal to an empty array', function() {
      expect(this.acl.readers).to.deep.equal([]);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        this.acl.readers = ['foo'];
      }).to.throw(TypeError, /only a getter/);
    });
  });

  describe('writers', function() {
    it('should be equal to an empty array', function() {
      expect(this.acl.writers).to.deep.equal([]);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        this.acl.writers = ['foo'];
      }).to.throw(TypeError, /only a getter/);
    });
  });

  describe('readerGroups', function() {
    it('should be equal to an empty array', function() {
      expect(this.acl.readerGroups).to.deep.equal([]);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        this.acl.readerGroups = ['foo'];
      }).to.throw(TypeError, /only a getter/);
    });
  });

  describe('writerGroups', function() {
    it('should have a getter', function() {
      expect(this.acl.writerGroups).to.deep.equal([]);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        this.acl.writerGroups = ['foo'];
      }).to.throw(TypeError, /only a getter/);
    });
  });

  describe('globallyReadable', function() {
    it('should be undefined', function() {
      expect(this.acl.globallyReadable).to.be.undefined;
    });

    it('should be able to be changed', function() {
      expect(() => {
        const gr = 'foo';
        this.acl.globallyReadable = gr;
      }).to.not.throw();
    });
  });

  describe('globallyWritable', function() {
    it('should be undefined', function() {
      expect(this.acl.globallyWritable).to.be.undefined;
    });

    it('should be able to be changed', function() {
      expect(() => {
        const gw = 'foo';
        this.acl.globallyWritable = gw;
      }).to.not.throw();
    });
  });

  describe('constructor()', function() {
    it('should create a new ACL object without any parameters', function() {
      const acl = new ACL();
      expect(acl).to.exist.and.to.be.instanceof(ACL);
    });

    it('should create a new ACL object provided an object', function() {
      const data = {
        creator: 'foo',
        r: ['foo'],
        w: ['foo'],
        groups: {
          r: ['foo'],
          w: ['foo']
        }
      };
      const acl = new ACL(data);
      expect(acl).to.exist.and.to.be.instanceof(ACL);
      expect(acl.creator).to.equal(data.creator);
      expect(acl.readers).to.equal(data.r);
      expect(acl.writers).to.equal(data.w);
      expect(acl.readerGroups).to.equal(data.groups.r);
      expect(acl.writerGroups).to.equal(data.groups.w);
    });

    it('should throw an error when not provided an object', function() {
      expect(function() {
        const acl = new ACL('foo');
        acl.toJSON();
      }).to.throw(KinveyError, 'acl argument must be an object');
    });
  });

  describe('addReader()', function() {

  });
});
