/**
 * Test suite for `Kinvey.Persistence`.
 */
describe('Kinvey.Persistence', function() {

  // This test suite tests the delegation between persistence mechanisms. It
  // does not test the actual functionality of each mechanism.

  // Housekeeping: enable sync.
  before(function() {// Restore.
    return Kinvey.Sync.init({ enable: true });
  });
  after(function() {// Restore.
    return Kinvey.Sync.init({ enable: true });
  });

  // Housekeeping: stub the local and net persistence.
  ['create', 'read', 'update', 'destroy'].forEach(function(method) {
    before(function() {
      sinon.stub(Kinvey.Persistence.Local, method, Kinvey.Defer.resolve);
      sinon.stub(Kinvey.Persistence.Net,   method, Kinvey.Defer.resolve);
    });
    beforeEach(function() {// Reset.
      Kinvey.Persistence.Local[method].reset();
      Kinvey.Persistence.Net[method].reset();
    });
    after(function() {// Restore.
      Kinvey.Persistence.Local[method].restore();
      Kinvey.Persistence.Net[method].restore();
    });
  });

  // Housekeeping: define the request.
  beforeEach(function() {
    this.request = {
      namespace  : this.randomID(),
      collection : this.randomID(),
      local      : { req: true, res: true }
    };
  });
  afterEach(function() {// Cleanup.
    delete this.request;
  });

  // Kinvey.Persistence.create.
  describe('the create method', function() {
    // Test suite.
    it('should use network persistence.', function() {
      var promise = Kinvey.Persistence.create(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.create).not.to.be.called;
        expect(Kinvey.Persistence.Net.create).to.be.calledOnce;
      });
    });
    it('should use local persistence if `options.offline`.', function() {
      var promise = Kinvey.Persistence.create(this.request, { offline: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.create).to.be.calledOnce;
        expect(Kinvey.Persistence.Net.create).not.to.be.called;
      });
    });
    it('should use network persistence if the request is not available locally.', function() {
      delete this.request.local.req;

      var promise = Kinvey.Persistence.create(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.create).not.to.be.called;
        expect(Kinvey.Persistence.Net.create).to.be.calledOnce;
      });
    });
    it('should update the local persistence if `options.refresh`.', function() {
      var promise = Kinvey.Persistence.create(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.create).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.create).to.be.calledOnce;
      });
    });
    it('should use not update local persistence if the response is not cacheable.', function() {
      delete this.request.local.res;

      var promise = Kinvey.Persistence.create(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.create).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.create).not.to.be.called;
      });
    });

    // Test failures.
    describe('on local failure', function() {
      // Housekeeping: stub local persistence.
      before(function() {
        Kinvey.Persistence.Local.create.restore();
        sinon.stub(Kinvey.Persistence.Local, 'create', Kinvey.Defer.reject);
      });
      after(function() {// Restore parent stub.
        Kinvey.Persistence.Local.create.restore();
        sinon.stub(Kinvey.Persistence.Local, 'create', Kinvey.Defer.resolve);
      });

      // Housekeeping: set request to be an aggregation.
      beforeEach(function() {
        this.request.id = '_group';
      });

      // Test suite.
      it('should fail if not `options.fallback`.', function() {
        var promise = Kinvey.Persistence.create(this.request, { offline: true, fallback: false });
        return promise.then(function() {
          // We shouldn't reach this code branch.
          return expect(promise).to.be.rejected;
        }, function() {
          expect(Kinvey.Persistence.Local.create).to.be.calledOnce;
          expect(Kinvey.Persistence.Net.create).not.to.be.called;
        });
      });
      it('should fallback to network persistence.', function() {
        var promise = Kinvey.Persistence.create(this.request, { offline: true, refresh: false });
        return promise.then(function() {
          expect(Kinvey.Persistence.Local.create).to.be.calledOnce;
          expect(Kinvey.Persistence.Net.create).to.be.calledOnce;
        });
      });
    });
  });

  // Kinvey.Persistence.read.
  describe('the read method', function() {
    // Test suite.
    it('should use network persistence.', function() {
      var promise = Kinvey.Persistence.read(this.request, {});
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.read).not.to.be.called;
        expect(Kinvey.Persistence.Net.read).to.be.calledOnce;
      });
    });
    it('should use local persistence if `options.offline`.', function() {
      var promise = Kinvey.Persistence.read(this.request, { offline: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.read).to.be.calledOnce;
        expect(Kinvey.Persistence.Net.read).not.to.be.called;
      });
    });
    it('should use network persistence if the request is not available locally.', function() {
      delete this.request.local.req;

      var promise = Kinvey.Persistence.read(this.request, {});
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.read).not.to.be.called;
        expect(Kinvey.Persistence.Net.read).to.be.calledOnce;
      });
    });
    it('should update local persistence if `options.refresh`.', function() {
      var promise = Kinvey.Persistence.read(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.read).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.read).not.to.be.called;
        expect(Kinvey.Persistence.Local.create).to.be.calledOnce;
      });
    });
    it('should not update local persistence if the response is not cacheable.', function() {
      delete this.request.local.res;

      var promise = Kinvey.Persistence.read(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.read).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.read).not.to.be.called;
      });
    });

    // Test failures.
    describe('on local failure', function() {
      // Housekeeping: stub local persistence.
      before(function() {
        Kinvey.Persistence.Local.read.restore();
        sinon.stub(Kinvey.Persistence.Local, 'read', Kinvey.Defer.reject);
      });
      after(function() {// Restore parent stub.
        Kinvey.Persistence.Local.read.restore();
        sinon.stub(Kinvey.Persistence.Local, 'read', Kinvey.Defer.resolve);
      });

      // Test suite.
      it('should fail if not `options.fallback`.', function() {
        var promise = Kinvey.Persistence.read(this.request, { offline: true, fallback: false });
        return promise.then(function() {
          // We shouldn't reach this code branch.
          return expect(promise).to.be.rejected;
        }, function() {
          expect(Kinvey.Persistence.Local.read).to.be.calledOnce;
          expect(Kinvey.Persistence.Net.read).not.to.be.called;
        });
      });
      it('should fallback to network persistence.', function() {
        var promise = Kinvey.Persistence.read(this.request, { offline: true });
        return promise.then(function() {
          expect(Kinvey.Persistence.Local.read).to.be.calledOnce;
          expect(Kinvey.Persistence.Net.read).to.be.calledOnce;
        });
      });
    });
  });

  // Kinvey.Persistence.update.
  describe('the update method', function() {
    // Test suite.
    it('should use network persistence.', function() {
      var promise = Kinvey.Persistence.update(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.update).not.to.be.called;
        expect(Kinvey.Persistence.Net.update).to.be.calledOnce;
      });
    });
    it('should use local persistence if `options.offline`.', function() {
      var promise = Kinvey.Persistence.update(this.request, { offline: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.update).to.be.calledOnce;
        expect(Kinvey.Persistence.Net.update).not.to.be.called;
      });
    });
    it('should use network persistence if the request is not available locally.', function() {
      delete this.request.local.req;

      var promise = Kinvey.Persistence.update(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.update).not.to.be.called;
        expect(Kinvey.Persistence.Net.update).to.be.calledOnce;
      });
    });
    it('should update the local persistence if `options.refresh`.', function() {
      var promise = Kinvey.Persistence.update(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.update).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.update).to.be.calledOnce;
      });
    });
    it('should use not update local persistence if the response is not cacheable.', function() {
      delete this.request.local.res;

      var promise = Kinvey.Persistence.update(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.update).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.update).not.to.be.called;
      });
    });

    // Test failures.
    describe('on local failure', function() {
      // Housekeeping: stub local persistence.
      before(function() {
        Kinvey.Persistence.Local.update.restore();
        sinon.stub(Kinvey.Persistence.Local, 'update', Kinvey.Defer.reject);
      });
      after(function() {// Restore parent stub.
        Kinvey.Persistence.Local.update.restore();
        sinon.stub(Kinvey.Persistence.Local, 'update', Kinvey.Defer.resolve);
      });

      // Test suite.
      it('should fail.', function() {
        var promise = Kinvey.Persistence.update(this.request, { offline: true });
        return expect(promise).to.be.rejected;
      });
    });
  });

  // Kinvey.Persistence.destroy.
  describe('the destroy method', function() {
    // Test suite.
    it('should use network persistence.', function() {
      var promise = Kinvey.Persistence.destroy(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.destroy).not.to.be.called;
        expect(Kinvey.Persistence.Net.destroy).to.be.calledOnce;
      });
    });
    it('should use local persistence if `options.offline`.', function() {
      var promise = Kinvey.Persistence.destroy(this.request, { offline: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.destroy).to.be.calledOnce;
        expect(Kinvey.Persistence.Net.destroy).not.to.be.called;
      });
    });
    it('should use network persistence if the request is not available locally.', function() {
      delete this.request.local.req;

      var promise = Kinvey.Persistence.destroy(this.request, { refresh: false });
      return promise.then(function() {
        expect(Kinvey.Persistence.Local.destroy).not.to.be.called;
        expect(Kinvey.Persistence.Net.destroy).to.be.calledOnce;
      });
    });
    it('should update the local persistence if `options.refresh`.', function() {
      var promise = Kinvey.Persistence.destroy(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.destroy).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.destroy).to.be.calledOnce;
      });
    });
    it('should use not update local persistence if the response is not cacheable.', function() {
      delete this.request.local.res;

      var promise = Kinvey.Persistence.destroy(this.request, { refresh: true });
      return promise.then(function() {
        expect(Kinvey.Persistence.Net.destroy).to.be.calledOnce;
        expect(Kinvey.Persistence.Local.destroy).not.to.be.called;
      });
    });

    // Test failures.
    describe('on local failure', function() {
      // Housekeeping: stub local persistence.
      before(function() {
        Kinvey.Persistence.Local.destroy.restore();
        sinon.stub(Kinvey.Persistence.Local, 'destroy', Kinvey.Defer.reject);
      });
      after(function() {// Restore parent stub.
        Kinvey.Persistence.Local.destroy.restore();
        sinon.stub(Kinvey.Persistence.Local, 'destroy', Kinvey.Defer.resolve);
      });

      // Test suite.
      it('should fail.', function() {
        var promise = Kinvey.Persistence.destroy(this.request, { offline: true });
        return expect(promise).to.be.rejected;
      });
    });
  });

});