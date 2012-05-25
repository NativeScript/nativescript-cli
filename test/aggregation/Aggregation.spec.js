/**
 * Kinvey.Aggregation test suite.
 */
describe('Kinvey.Aggregation', function() {
  // Create a variety of data, so aggregations actually has a result.
  before(function(done) {
    this.smith = new Kinvey.Entity(COLLECTION_UNDER_TEST, {
      name: 'John',
      surname: 'Smith',
      age: 30
    });
    var jones = this.jones = new Kinvey.Entity(COLLECTION_UNDER_TEST, {
      name: 'Dan',
      surname: 'Smith',
      age: 50
    });

    // Save both.
    this.smith.save(callback(done, {
      success: function() {
        jones.save(callback(done));
      }
    }));
  });

  // Reset collection and aggregation.
  beforeEach(function() {
    this.agg = new Kinvey.Aggregation();
    this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
  });

  // Remove all created data.
  after(function(done) {
    var smith = this.smith;
    this.jones.destroy(callback(done, {
      success: function() {
        smith.destroy(callback(done, {
          success: function() {
            Kinvey.getCurrentUser().destroy(callback(done));
          }
        }));
      }
    }));
  });

  // Try an average.
  describe('average', function() {
    it('calculates an average.', function(done) {
      this.agg.setInitial({
        count: 0,
        total: 0
      }).setReduce(function(doc, out) {
        out.count++;
        out.total += doc.age;
      }).setFinalize(function(doc, out) {
        out.average = out.total / out.count;
        return out;
      });
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(1);
          response[0].should.eql({ count: 2, total: 80, average: 40 });
          done();
        }
      }));
    });
  });

  // Try a count.
  describe('count', function() {
    it('performs a simple count.', function(done) {
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(1);
          response[0].should.eql({ count: 2 });
          done();
        }
      }));
    });
    it('performs a count with multiple groups.', function(done) {
      this.agg.on('name');
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(2);
          response.should.eql([
            { name: 'John', count: 1 }, { name: 'Dan', count: 1 }
          ]);
          done();
        }
      }));
    });
    it('performs a count with one group.', function(done) {
      this.agg.on('surname');
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(1);
          response[0].should.eql({ surname: 'Smith', count: 2 });
          done();
        }
      }));
    });
    it('performs a count with two groups.', function(done) {
      this.agg.on('name').on('age');
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(2);
          response.should.eql([
            { name: 'John', age: 30, count: 1 },
            { name: 'Dan', age: 50, count: 1 }
          ]);
          done();
        }
      }));
    });
  });

  // Try a conditional group.
  describe('conditional', function() {
    it('performs a filtered group.', function(done) {
      var query = new Kinvey.Query();
      query.on('age').lessThan(50);
      this.agg.on('age');

      this.collection.setQuery(query);
      this.collection.aggregate(this.agg, callback(done, {
        success: function(response) {
          response.should.have.length(1);
          response[0].should.eql({ age: 30, count: 1 });
          done();
        }
      }));
    });
  });
  
});