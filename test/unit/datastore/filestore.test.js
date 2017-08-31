import fs from 'fs';
import path from 'path';
import nock from 'nock';
import expect from 'expect';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FileStore } from 'src/datastore';
import { KinveyError, NotFoundError, ServerError } from 'src/errors';
import { randomString } from 'src/utils';
import Query from 'src/query';

chai.use(chaiAsPromised);
chai.should();

describe('FileStore', function() {
  describe('pathname', function() {
    it('should equal /blob/<appkey>', function() {
      const store = new FileStore();
      expect(store.pathname).toEqual(`/blob/${store.client.appKey}`);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new FileStore();
        store.pathname = '/foo';
      }).toThrow();
    });
  });

  describe('find()', function() {
    it('should find the files', function() {
      const store = new FileStore();
      const file1 = { _id: randomString() };
      const file2 = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file1, file2]);

      return store.find()
        .then((files) => {
          expect(files).toEqual([file1, file2]);
        });
    });

    it('should throw an error if the query argument is not an instance of the Query class', function() {
      const store = new FileStore();
      store.find({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        })
        .then(() => {
          throw new Error('This test should fail.');
        });
    });

    it('should find the files that match the query', function() {
      const store = new FileStore();
      const file = { _id: randomString() };
      const query = new Query();
      query.equalTo('_id', file._id);

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true, query: JSON.stringify({ _id: file._id }) })
        .reply(200, [file]);

      return store.find(query)
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set tls to true by default', function() {
      const store = new FileStore();
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find()
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set tls to false', function() {
      const store = new FileStore();
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: false })
        .reply(200, [file]);

      return store.find(null, { tls: false })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should not set ttl if it is not a number', function() {
      const store = new FileStore();
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { ttl: {} })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set ttl to 10 seconds', function() {
      const store = new FileStore();
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, [file]);

      return store.find(null, { ttl: 10 })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should parse ttl to an int', function() {
      const store = new FileStore();
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, [file]);

      return store.find(null, { ttl: 10.5 })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should download the files', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { download: true })
        .then(() => {
          expect(spy).toHaveBeenCalled();
          expect.restoreSpies();
        });
    });

    it('should not download the files', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return store.find(null, { download: false })
        .then(() => {
          expect(spy).toNotHaveBeenCalled();
          expect.restoreSpies();
        });
    });
  });

  describe('download()', function() {
    it('should set tls to true by default', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id)
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should set tls to false', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: false })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { tls: false })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should not set ttl if it is not a number', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { ttl: {} })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should set ttl to 10 seconds', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { ttl: 10 })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should parse ttl to an int', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { ttl: 10.5 })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should steam the file', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      return store.download(fileEntity._id, { stream: true })
        .then((entity) => {
          expect(entity).toEqual(fileEntity);
        });
    });

    it('should not stream the file', function() {
      const store = new FileStore();
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');

      nock(this.client.apiHostname)
        .get(`${store.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return store.download(fileEntity._id, { stream: false })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });
  });

  describe('findById()', function() {
    it('should call download()', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      store.findById();
      expect(spy).toHaveBeenCalled();
    });

    it('should call download() with id', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const id = randomString();
      store.findById(id);
      expect(spy).toHaveBeenCalledWith(id, undefined);
    });

    it('should call download() with options', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const options = { foo: randomString() };
      store.findById(null, options);
      expect(spy).toHaveBeenCalledWith(null, options);
    });
  });

  describe('stream()', function() {
    it('should call download()', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      store.stream();
      expect(spy).toHaveBeenCalled();
    });

    it('should call download() with id', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      const id = randomString();
      store.stream(id);
      expect(spy).toHaveBeenCalledWith(id, { stream: true });
    });

    it('should call download() with options.stream = true if it was set to false', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'download');
      store.stream(null, { stream: false });
      expect(spy).toHaveBeenCalledWith(null, { stream: true });
    });
  });

  describe('upload()', function() {
    it('should upload a file', function() {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
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
        });

      // GCS status check response
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes */${fileSize}` }})
        // .matchHeader('content-range', `bytes */${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 0-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
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

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
          return data;
        });
      return promise.should.be.fulfilled;
    });

    it('should resume a file upload when a 308 status code is received', function() {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes */${fileSize}` }})
        // .matchHeader('content-range', `bytes */${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 0-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 1001-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
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

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
      return promise.should.be.fulfilled;
    });

    it('should resume a file upload when a 5xx status code is received', function() {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes */${fileSize}` }})
        // .matchHeader('content-range', `bytes */${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 0-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 1001-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 1001-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
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

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      })
        .then((data) => {
          expect(data).toIncludeKey('_data');
          expect(nock.isDone()).toEqual(true);
        });
      return promise.should.be.fulfilled;
    });

    it('should fail to upload a file when a 5xx status code is received mutiple times', function() {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Disable timeout for this test
      this.timeout(0);

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes */${fileSize}` }})
        // .matchHeader('content-range', `bytes */${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 0-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 1001-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
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

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.code).toEqual(500);
          throw error;
        });
      return promise.should.be.rejected;
    });

    it('should fail to upload a file when a 4xx status code is received', function() {
      const store = new FileStore();
      const file = fs.readFileSync(path.resolve(__dirname, '../fixtures/test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(store.client.apiHostname, { encodedQueryParams: true })
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes */${fileSize}` }})
        // .matchHeader('content-range', `bytes */${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 0-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
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
      nock('https://www.googleapis.com', { encodedQueryParams: true, reqheaders: { 'content-range': `bytes 1001-${fileSize - 1}/${fileSize}` }})
        // .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
        .put('/upload/storage/v1/b/5d91e6b552d148188e30d8eb106da6d8/o', () => true)
        .query({
          name: '58caed1d-9e42-4bf6-9a37-68d18cd29e3e/kinvey.png',
          uploadType: 'resumable',
          predefinedAcl: 'publicRead',
          upload_id: 'AEnB2UrXv4rk9Nosi5pA8Esyq1art9RuqxKz_mnKfWInUetzy86yQ3cFrboL1drhp1sCHT5EKdyPNXr0bHS9g6ZDUEG4h-7xgg'
        })
        .reply(404, 'NotFoundError', {
          'x-guploader-uploadid': 'AEnB2UrINxWGypPdSCcTkbOIa7WQOnXKJjsuNvR7uiwsLM_nYqU4BkwjhN3CVZM2Ix7ATZt-cf0oRGhE6e8yd0Dd7YaZKFsK7Q'
        });

      const promise = store.upload(file, {
        filename: 'kinvey.png',
        public: true,
        mimeType: 'image/png'
      }, {
        maxBackoff: 250
      })
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
          expect(error.code).toEqual(404);
          throw error;
        });
      return promise.should.be.rejected;
    });
  });

  describe('create()', function() {
    it('should call upload()', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      store.create();
      expect(spy).toHaveBeenCalled();
    });

    it('should call upload() with file', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const file = randomString();
      store.create(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const metadata = randomString();
      store.create(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const options = randomString();
      store.create(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('update()', function() {
    it('should call upload()', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      store.update();
      expect(spy).toHaveBeenCalled();
    });

    it('should call upload() with file', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const file = randomString();
      store.update(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const metadata = randomString();
      store.update(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', function() {
      const store = new FileStore();
      const spy = expect.spyOn(store, 'upload');
      const options = randomString();
      store.update(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('remove()', function() {
    it('should throw an error', function() {
      expect(() => {
        const store = new FileStore();
        store.remove();
      }).toThrow();
    });
  });

  describe('removeById()', function() {
    it('should throw a NotFoundError if the id argument does not exist', function() {
      const store = new FileStore();
      const _id = randomString();

      nock(this.client.apiHostname)
        .delete(`${store.pathname}/${_id}`)
        .reply(404);

      return store.removeById(_id)
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should remove the entity that matches the id argument', function() {
      const store = new FileStore();
      const _id = randomString();
      const reply = { count: 1 };

      nock(this.client.apiHostname)
        .delete(`${store.pathname}/${_id}`)
        .reply(200, reply);

      return store.removeById(_id)
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });
});
