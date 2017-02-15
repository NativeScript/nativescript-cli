import { FileStore as store } from 'src/datastore';
import { KinveyError, NotFoundError, ServerError } from 'src/errors';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import expect from 'expect';

describe('FileStore', function() {
  describe('upload()', function() {
    it('should upload a file', function() {
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.baseUrl, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      return store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should resume a file upload when a 308 status code is received', function() {
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.baseUrl, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      return store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should resume a file upload when a 5xx status code is received', function() {
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.baseUrl, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(500, 'ServerError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS complete response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(200, {
          kind: 'storage#object',
          id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000',
          selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/279af537-39a3-4f50-a578-0b5a639c04a2%2Fkinvey.png',
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          bucket: '5d91e6b552d148188e30d8eb106da6d8',
          generation: '1471377776175000',
          metageneration: '1',
          contentType: 'image/png',
          timeCreated: '2016-08-16T20:02:56.170Z',
          updated: '2016-08-16T20:02:56.170Z',
          storageClass: 'STANDARD',
          size: '24181',
          md5Hash: 'uDj9xHXl0fJiJdNitgQHUA==',
          mediaLink: 'https://www.googleapis.com/download/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png?generation=1471377776175000&alt=media',
          cacheControl: 'private, max-age=0, no-transform',
          acl: [{
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            role: 'OWNER',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            etag: 'CJjPt63dxs4CEAE='
          }, {
            kind: 'storage#objectAccessControl',
            id: '5d91e6b552d148188e30d8eb106da6d8/58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png/1471377776175000/allUsers',
            selfLink: 'https://www.googleapis.com/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o/58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png/acl/allUsers',
            bucket: '5d91e6b552d148188e30d8eb106da6d8',
            object: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
            generation: '1471377776175000',
            entity: 'allUsers',
            role: 'READER',
            etag: 'CJjPt63dxs4CEAE='
          }],
          owner: {
            entity: 'user-00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f',
            entityId: '00b4903a97d32a07d52ec70a8d0394967758e899886e3a64b82d01f2900a448f'
          },
          crc32c: 'ghJtBQ==',
          etag: 'CJjPt63dxs4CEAE='
        }, {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q',
          'content-type': 'application/json; charset=UTF-8',
          'content-length': '2503'
        });

      return store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should fail to upload a file when a 5xx status code is received mutiple times', function() {
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Disable timeout for this test
      this.timeout(0);

      // Kinvey API response
      nock(store.client.baseUrl, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .times(15)
        .reply(500, 'ServerError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      return store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.code).toEqual(500);
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should fail to upload a file when a 4xx status code is received', function() {
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.baseUrl, { encodedQueryParams: true })
        .post(store.pathname, {
          _filename: 'kinvey.png',
          _public: true,
          size: fileSize,
          mimeType: 'image/png'
        })
        .query(true)
        .reply(201, {
          size: 24181,
          mimeType: 'image/png',
          _filename: 'kinvey.png',
          _public: true,
          _id: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e',
          _acl: {
            creator: '57b265b6b10771153261b833'
          },
          _kmd: {
            lmt: '2016-08-16T19:52:37.446Z',
            ect: '2016-08-16T19:52:37.446Z'
          },
          _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o?name=58caed1d-9e42-4bf6-9a37-68d18cd29e3e%2Fkinvey.png&uploadType=resumable&predefinedAcl=publicRead&upload_id=AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          _expiresAt: '2016-08-23T19:52:37.821Z',
          _requiredHeaders: {}
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '612',
          'x-kinvey-request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-kinvey-api-version': '4'
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true })
        .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o')
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          'x-guploader-uploadid': 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg',
          'content-length': '0',
          'content-type': 'text/html; charset=UTF-8'
        });

      // GCS resumable response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(308, '', {
          range: '0-1000',
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      // GCS error response
      nock('https://www.googleapis.com')
        .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .times(15)
        .reply(404, 'NotFoundError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      return store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
          expect(error.code).toEqual(404);
          expect(nock.isDone()).toEqual(true);
        });
    });
  });
});
