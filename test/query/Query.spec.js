/**
 * Kinvey.Query test suite.
 */
describe('Kinvey.Query', function() {
  // Create a variety of data, so queries actually have results.
  before(function(done) {
    // Define two entities, subject to all query options.
    var complex = this.complex = new Kinvey.Entity(COLLECTION_UNDER_TEST, {
      name: 'John',
      surname: 'Smith',
      age: 50,
      hobbies: ['HTML', 'CSS', 'JavaScript'],
      _geoloc: [-71.084, 42.363]// Hey, that's our office!
    });
    var simple = this.simple = new Kinvey.Entity(COLLECTION_UNDER_TEST, {
      surname: 'Brown'
    });

    // Create anonymous user and save all.
    this.user = Kinvey.User.create(function() {
      complex.save(function() {
        simple.save(done, done);
      }, done);
    }, done);
  });

  // Reset collection and query.
  beforeEach(function() {
    this.query = new Kinvey.Query(new Kinvey.Query.MongoBuilder());
    this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
  });

  // Remove all created data.
  after(function(done) {
    var complex = this.complex;
    var user = this.user;
    this.simple.destroy(function() {
      complex.destroy(function() {
        user.destroy(done, done);
      }, done);
    }, done);
  });

  // Kinvey.Query#all
  describe('#all', function() {
    it('performs a matching all query.', function(done) {
      var complex = this.complex;
      this.query.on('hobbies').all(['HTML', 'CSS', 'JavaScript']);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs an unmatching all query.', function(done) {
      this.query.on('hobbies').all(['HTML', 'CSS', 'PHP']);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#equal
  describe('#equal', function() {
    it('performs an equal query.', function(done) {
      var complex = this.complex;
      this.query.on('name').equal('John');
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#exist
  describe('#exist', function() {
    it('performs an exist query.', function(done) {
      var complex = this.complex;
      this.query.on('name').exist();
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#greaterThan
  describe('#greaterThan', function() {
    it('performs a greater than query.', function(done) {
      var complex = this.complex;
      this.query.on('age').greaterThan(25);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#greaterThanEqual
  describe('#greaterThanEqual', function() {
    it('performs a greater than equal query.', function(done) {
      var complex = this.complex;
      this.query.on('age').greaterThanEqual(50);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#in_
  describe('#in_', function() {
    it('performs an in query.', function(done) {
      var complex = this.complex;
      this.query.on('hobbies').in_(['HTML', 'CSS']);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#lessThan
  describe('#lessThan', function() {
    it('performs a less than query.', function(done) {
      var complex = this.complex;
      this.query.on('age').lessThan(100);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#lessThanEqual
  describe('#lessThanEqual', function() {
    it('performs a less than equal query.', function(done) {
      var complex = this.complex;
      this.query.on('age').lessThanEqual(50);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#nearSphere
  describe('#nearSphere', function() {
    it('performs a matching near sphere query.', function(done) {
      var complex = this.complex;
      this.query.on('_geoloc').nearSphere([-71, 42]);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs a near sphere query with matching distance.', function(done) {
      var complex = this.complex;
      this.query.on('_geoloc').nearSphere([-71, 42], 100);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs a near sphere query with unmatching distance.', function(done) {
      this.query.on('_geoloc').nearSphere([-71, 42], 1);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#notEqual
  describe('#notEqual', function() {
    it('performs a not equal query.', function(done) {
      var complex = this.complex;
      this.query.on('surname').notEqual('Brown');
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#notIn
  describe('#notIn', function() {
    it('performs a not in query.', function(done) {
      var complex = this.complex;
      this.query.on('surname').notIn(['Brown', 'Lee']);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      }); 
    });
  });

  // Kinvey.Query#on
  describe('#on', function() {
    it('is required to be set before applying a condition.', function() {
      var query = this.query;
      (function() {
        query.equal('bar');
      }.should['throw']());
    });
  });

  // Kinvey.Query#setLimit
  describe('#setLimit', function() {
    it('sets a limit.', function(done) {
      this.query.setLimit(1);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#setSkip
  describe('#setSkip', function() {
    it('sets a skip.', function(done) {
      this.query.setSkip(2);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#sort
  describe('#sort', function() {
    it('sorts by field (ascending).', function(done) {
      var complex = this.complex;
      var simple = this.simple;

      this.query.on('surname').sort(Kinvey.Query.ASC);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(2);
        this.list[0].should.eql(simple);
        this.list[1].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('sorts by field (descending).', function(done) {
      var complex = this.complex;
      var simple = this.simple;

      this.query.on('surname').sort(Kinvey.Query.DESC);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(2);
        this.list[0].should.eql(complex);
        this.list[1].should.eql(simple);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#size
  describe('#size', function() {
    it('performs a size query.', function(done) {
      var complex = this.complex;
      this.query.on('hobbies').size(3);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#withinBox
  describe('#withinBox', function() {
    it('performs a matching within box query.', function(done) {
      var complex = this.complex;
      this.query.on('_geoloc').withinBox([[-72, 41], [-70, 43]]);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs an unmatching within box query.', function(done) {
      this.query.on('_geoloc').withinBox([[-74, 39], [-72, 41]]);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#withinCenterSphere
  describe('#withinCenterSphere', function() {
    it('performs a matching within center sphere query.', function(done) {
      var complex = this.complex;
      this.query.on('_geoloc').withinCenterSphere([-71, 42], 0.01);// ~100 miles
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs an unmatching within center sphere query.', function(done) {
      this.query.on('_geoloc').withinCenterSphere([-71, 42], 0.0025);// ~1 mile
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Query#withinPolygon
  describe('#withinPolygon', function() {
    it('performs a matching within polygon query.', function(done) {
      var complex = this.complex;

      // Yes, I've taken the time to find a polygon of MA :)
      // @link http://econym.org.uk/gmap/states.xml
      // @link http://econym.org.uk/gmap/example_states4.htm
      var massachusetts = [ [ -72.7789, 42.0003 ], [ -72.7405, 42.0330 ],
                            [ -72.3779, 42.0330 ], [ -71.7984, 42.0228 ], [ -71.8011, 42.0085 ],
                            [ -71.3850, 42.0197 ], [ -71.3837, 41.8961 ], [ -71.3411, 41.8982 ],
                            [ -71.3370, 41.8358 ], [ -71.3493, 41.8245 ], [ -71.3342, 41.7816 ],
                            [ -71.2628, 41.7529 ], [ -71.1914, 41.6719 ], [ -71.1351, 41.6616 ],
                            [ -71.1433, 41.6124 ], [ -71.1310, 41.5939 ], [ -71.1214, 41.4973 ],
                            [ -71.0266, 41.3149 ], [ -70.8316, 41.1590 ], [ -69.9225, 41.1662 ],
                            [ -69.7948, 41.3201 ], [ -69.7398, 41.8133 ], [ -70.0337, 42.1939 ],
                            [ -70.5144, 42.2173 ], [ -70.6984, 42.4133 ], [ -70.3647, 42.6420 ],
                            [ -70.4759, 42.8286 ], [ -70.6133, 42.8760 ], [ -70.8440, 42.8619 ],
                            [ -70.9154, 42.8890 ], [ -71.0651, 42.8075 ], [ -71.1337, 42.8226 ],
                            [ -71.1859, 42.7873 ], [ -71.1832, 42.7369 ], [ -71.2189, 42.7470 ],
                            [ -71.2560, 42.7400 ], [ -71.2985, 42.6986 ], [ -71.9151, 42.7127 ],
                            [ -72.5441, 42.7309 ], [ -73.2541, 42.7450 ], [ -73.2664, 42.7460 ],
                            [ -73.3406, 42.5460 ], [ -73.4436, 42.2671 ], [ -73.4917, 42.1349 ],
                            [ -73.5081, 42.0880 ], [ -73.4985, 42.0483 ], [ -73.1841, 42.0452 ],
                            [ -72.8146, 42.0371 ], [ -72.8160, 41.9962 ], [ -72.7803, 42.0024 ] ];

      this.query.on('_geoloc').withinPolygon(massachusetts);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(1);
        this.list[0].should.eql(complex);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
    it('performs an unmatching within polygon query.', function(done) {
      // Texas baby!
      var texas = [ [ -106.5715, 31.8659 ], [ -106.5042, 31.7504 ],
                    [ -106.3092, 31.6242 ], [ -106.2103, 31.4638 ], [ -106.0181, 31.3912 ],
                    [ -105.7874, 31.1846 ], [ -105.5663, 31.0012 ], [ -105.4015, 30.8456 ],
                    [ -105.0032, 30.6462 ], [ -104.8521, 30.3847 ], [ -104.7437, 30.2591 ],
                    [ -104.6915, 30.0738 ], [ -104.6777, 29.9169 ], [ -104.5679, 29.7644 ],
                    [ -104.5280, 29.6475 ], [ -104.4044, 29.5603 ], [ -104.2067, 29.4719 ],
                    [ -104.1559, 29.3834 ], [ -103.9774, 29.2948 ], [ -103.9128, 29.2804 ],
                    [ -103.8208, 29.2481 ], [ -103.5640, 29.1378 ], [ -103.4692, 29.0682 ],
                    [ -103.3154, 29.0105 ], [ -103.1616, 28.9601 ], [ -103.0957, 29.0177 ],
                    [ -103.0298, 29.1330 ], [ -102.8677, 29.2157 ], [ -102.8979, 29.2565 ],
                    [ -102.8375, 29.3570 ], [ -102.8004, 29.4898 ], [ -102.7002, 29.6881 ],
                    [ -102.5134, 29.7691 ], [ -102.3843, 29.7596 ], [ -102.3047, 29.8788 ],
                    [ -102.1509, 29.7834 ], [ -101.7004, 29.7572 ], [ -101.4917, 29.7644 ],
                    [ -101.2939, 29.6308 ], [ -101.2582, 29.5269 ], [ -101.0056, 29.3642 ],
                    [ -100.9204, 29.3056 ], [ -100.7707, 29.1642 ], [ -100.7007, 29.0946 ],
                    [ -100.6306, 28.9012 ], [ -100.4974, 28.6593 ], [ -100.3601, 28.4675 ],
                    [ -100.2969, 28.2778 ], [ -100.1733, 28.1882 ], [ -100.0195, 28.0526 ],
                    [ -99.9344, 27.9435 ], [ -99.8438, 27.7638 ], [ -99.7119, 27.6641 ],
                    [ -99.4812, 27.4839 ], [ -99.5375, 27.3059 ], [ -99.4290, 27.1948 ],
                    [ -99.4455, 27.0175 ], [ -99.3164, 26.8829 ], [ -99.2065, 26.6867 ],
                    [ -99.0967, 26.4116 ], [ -98.8138, 26.3574 ], [ -98.6668, 26.2257 ],
                    [ -98.5474, 26.2343 ], [ -98.3276, 26.1357 ], [ -98.1697, 26.0457 ],
                    [ -97.9143, 26.0518 ], [ -97.6643, 26.0050 ], [ -97.4020, 25.8419 ],
                    [ -97.3526, 25.9074 ], [ -97.0148, 25.9679 ], [ -97.0697, 26.1789 ],
                    [ -97.2249, 26.8253 ], [ -97.0752, 27.4230 ], [ -96.6096, 28.0599 ],
                    [ -95.9285, 28.4228 ], [ -95.3036, 28.7568 ], [ -94.7296, 29.0742 ],
                    [ -94.3355, 29.3810 ], [ -93.8205, 29.6021 ], [ -93.9317, 29.8013 ],
                    [ -93.8136, 29.9157 ], [ -93.7230, 30.0489 ], [ -93.6996, 30.1214 ],
                    [ -93.7216, 30.2021 ], [ -93.7038, 30.2792 ], [ -93.7628, 30.3278 ],
                    [ -93.7587, 30.3835 ], [ -93.7010, 30.4380 ], [ -93.7024, 30.5079 ],
                    [ -93.7299, 30.5362 ], [ -93.6694, 30.6296 ], [ -93.6090, 30.7466 ],
                    [ -93.5527, 30.8114 ], [ -93.5747, 30.8834 ], [ -93.5307, 30.9376 ],
                    [ -93.5074, 31.0318 ], [ -93.5266, 31.0812 ], [ -93.5335, 31.1787 ],
                    [ -93.5980, 31.1670 ], [ -93.6832, 31.3055 ], [ -93.6708, 31.3830 ],
                    [ -93.6887, 31.4369 ], [ -93.7202, 31.5107 ], [ -93.8315, 31.5820 ],
                    [ -93.8123, 31.6440 ], [ -93.8232, 31.7188 ], [ -93.8342, 31.7936 ],
                    [ -93.8782, 31.8309 ], [ -93.9221, 31.8869 ], [ -93.9661, 31.9335 ],
                    [ -94.0430, 32.0081 ], [ -94.0430, 33.4681 ], [ -94.0430, 33.5414 ],
                    [ -94.1528, 33.5689 ], [ -94.1968, 33.5872 ], [ -94.2627, 33.5872 ],
                    [ -94.3176, 33.5689 ], [ -94.3945, 33.5597 ], [ -94.4275, 33.5780 ],
                    [ -94.4275, 33.6055 ], [ -94.4495, 33.6421 ], [ -94.4879, 33.6329 ],
                    [ -94.5236, 33.6421 ], [ -94.6637, 33.6695 ], [ -94.7461, 33.7061 ],
                    [ -94.8999, 33.7791 ], [ -95.0757, 33.8818 ], [ -95.1526, 33.9251 ],
                    [ -95.2254, 33.9604 ], [ -95.2858, 33.8750 ], [ -95.5399, 33.8841 ],
                    [ -95.7568, 33.8887 ], [ -95.8420, 33.8408 ], [ -96.0274, 33.8556 ],
                    [ -96.3528, 33.6901 ], [ -96.6179, 33.8442 ], [ -96.5836, 33.8898 ],
                    [ -96.6673, 33.8955 ], [ -96.7538, 33.8179 ], [ -96.8335, 33.8613 ],
                    [ -96.8774, 33.8613 ], [ -96.9159, 33.9388 ], [ -97.0917, 33.7392 ],
                    [ -97.1645, 33.7449 ], [ -97.2180, 33.8978 ], [ -97.3746, 33.8225 ],
                    [ -97.4611, 33.8305 ], [ -97.4460, 33.8761 ], [ -97.6945, 33.9798 ],
                    [ -97.8648, 33.8476 ], [ -97.9651, 33.8978 ], [ -98.0983, 34.0299 ],
                    [ -98.1752, 34.1141 ], [ -98.3743, 34.1425 ], [ -98.4773, 34.0640 ],
                    [ -98.5529, 34.1209 ], [ -98.7520, 34.1232 ], [ -98.9539, 34.2095 ],
                    [ -99.0637, 34.2073 ], [ -99.1832, 34.2141 ], [ -99.2505, 34.3593 ],
                    [ -99.3823, 34.4613 ], [ -99.4318, 34.3774 ], [ -99.5718, 34.4160 ],
                    [ -99.6158, 34.3706 ], [ -99.8094, 34.4726 ], [ -99.9934, 34.5631 ],
                    [ -100.0017, 36.4975 ], [ -103.0408, 36.5008 ], [ -103.0655, 32.0011 ],
                    [ -106.6168, 32.0023 ] ];

      this.query.on('_geoloc').withinPolygon(texas);
      this.collection.fetch(this.query, function() {
        this.list.length.should.equal(0);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });
});