import { Kinvey } from '../../../src/kinvey';
import expect from 'expect';

Kinvey.init({
  appKey: 'kid_HkTD2CJc',
  appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
});

Kinvey.ping().then((response) => {
  console.log(response);
});

describe('Compare Numbers', function() {
  it('1 should equal 1', function() {
    expect(1).toEqual(1);
  });

  // it('2 should be greater than 1', function() {
  //   expect(2).to.be.greaterThan(1);
  // });
});
