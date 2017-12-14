import expect from 'expect';
import cloneDeep from 'lodash/cloneDeep';
import { Stream } from './stream';
import * as nockHelper from '../nock-helper';
import { invalidOrMissingCheckRegexp } from '../utilities';
import { randomString } from '../../utils';
import { Client } from '../../client';

// TODO: add more tests

describe('Stream', () => {
  const streamName = 'SomeStream';
  const substreamId = 'someId';
  /** @type {Stream} */
  let stream;

  before(function () {
    const client = Client.init({
      appKey: randomString(),
      appSecret: randomString()
    });
    nockHelper.setClient(client);
  });

  beforeEach(() => {
    stream = new Stream(streamName);
  });

  describe('getSubstreams', () => {
    it('should make an GET request and return a list of substreams', () => {
      const responseMock = [1, 2, 3];
      const scope = nockHelper.mockSubstreamsRequest(streamName, responseMock);

      return stream.getSubstreams()
        .then((resp) => {
          scope.done();
          expect(resp).toEqual(responseMock);
        });
    });
  });

  describe('getACL', () => {
    it('should throw an error if supplied substream id is invalid', (done) => {
      stream.getACL('')
        .then(() => done(new Error('getACL succeeded with invalid id')))
        .catch((err) => {
          expect(err).toExist();
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        });
    });

    it('should throw an error if no substream is provided', (done) => {
      stream.getACL()
        .then(() => done(new Error('getACL succeeded with invalid id')))
        .catch((err) => {
          expect(err).toExist();
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        });
    });

    it('should make a request to the provided substream id', () => {
      const mockResponse = { anyObject: true };
      const scope = nockHelper.mockGetStreamACLRequest(streamName, substreamId, mockResponse);

      return stream.getACL(substreamId)
        .then((aclObj) => {
          scope.done();
          expect(aclObj).toEqual(mockResponse);
        });
    });
  });

  describe('setACL', () => {
    it('should throw an error if supplied substream id is invalid', (done) => {
      const aclObj = { groups: { publish: [4] } };

      stream.setACL(substreamId, aclObj)
        .then(() => done(new Error('setACL succeeded with invalid acl object')))
        .catch((err) => {
          expect(err.message).toMatch(/invalid/i);
          done();
        })
        .catch(e => done(e));
    });

    it('should make an PUT request to appropriate URL, with expected body', () => {
      const aclObj = { groups: { publish: ['qwe'], test: 1 } };
      const scope = nockHelper.mockSetStreamACLRequest(streamName, substreamId, aclObj);

      return stream.setACL(substreamId, aclObj)
        .then((resp) => {
          scope.done();
          const expected = cloneDeep(aclObj);
          delete expected.groups.test;
          expect(resp).toEqual(expected);
        });
    });

    it('should work with a StreamACL object, or plain object', () => {
      const acl = new Stream.StreamACL()
        .addPublishers('some id')
        .addSubscribers('some other id');

      const scope = nockHelper.mockSetStreamACLRequest(streamName, substreamId, acl.toPlainObject());
      return stream.setACL(substreamId, acl)
        .then((resp) => {
          scope.done();
          const expected = cloneDeep(acl.toPlainObject());
          expect(resp).toEqual(expected);
        });
    });
  });
});
