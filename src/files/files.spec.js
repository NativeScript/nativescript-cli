import fs from 'fs';
import path from 'path';
import nock from 'nock';
import expect from 'expect';
import chai from 'chai';
import KinveyError from '../errors/kinvey';
import { randomString } from '../../tests/utils';
import { Query } from '../query';
import login from '../user/login';
import init from '../kinvey/init';
import sinon from 'sinon';
import * as Files from './';
//import fileFuncs from './fileModule';

describe('Files', () => {//TODO: The whole suite fails
  let client;

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com"
    });
    Files.pathname = `/blob/${client.appKey}`;
  });

  before(() => {
    const username = randomString();
    const password = randomString();
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: username,
      _acl: {
        creator: randomString()
      }
    };

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return login(username, password);
  });

  describe('pathname', () => {// TODO: No path getter
    it('should equal /blob/<appkey>', () => {
      expect(Files.pathname).toEqual(`/blob/${client.appKey}`);
    });

    it('should not be able to be changed', () => {//TODO: errors should be reverted
      expect(() => {
        Files.pathname = '/foo';
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('find()', () => {
    it('should find the files', () => {
      const file1 = { _id: randomString() };
      const file2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true })
        .reply(200, [file1, file2]);

      return Files.find()
        .then((files) => {
          expect(files).toEqual([file1, file2]);
        });
    });

    it('should throw an error if the query argument is not an instance of the Query class', () => {//TODO: errors should be reverted
      Files.find({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        })
        .then(() => {
          throw new Error('This test should fail.');
        });
    });

    it('should find the files that match the query', () => {
      const file = { _id: randomString() };
      const query = new Query();
      query.equalTo('_id', file._id);

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true, query: JSON.stringify({ _id: file._id }) })
        .reply(200, [file]);

      return Files.find(query)
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set tls to true by default', () => {
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return Files.find()
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set tls to false', () => {
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: false })
        .reply(200, [file]);

      return Files.find(null, { tls: false })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should not set ttl if it is not a number', () => {
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return Files.find(null, { ttl: {} })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should set ttl to 10 seconds', () => {
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, [file]);

      return Files.find(null, { ttl: 10 })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should parse ttl to an int', () => {
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, [file]);

      return Files.find(null, { ttl: 10.5 })
        .then((files) => {
          expect(files).toEqual([file]);
        });
    });

    it('should download the files', () => {//TODO: in the old sdk the downloadByUrl was not called and the test passed, now it is called but the file has not downloadUrl, so it fails
      const spy = expect.spyOn(Files, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return Files.find(null, { download: true })
        .then(() => {
          expect(spy).toHaveBeenCalled();
          expect.restoreSpies();
        });
    });

    it('should not download the files', () => {//TODO: in the old sdk the downloadByUrl was not called and the test passed, now it is called but the file has not downloadUrl, so it fails
      const spy = expect.spyOn(Files, 'downloadByUrl');
      const file = { _id: randomString() };

      nock(client.apiHostname)
        .get(Files.pathname)
        .query({ tls: true })
        .reply(200, [file]);

      return Files.find(null, { download: false })
        .then(() => {
          expect(spy).toNotHaveBeenCalled();
          expect.restoreSpies();
        });
    });
  });

  describe('download()', () => {
    it('should set tls to true by default', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id)
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should set tls to false', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: false })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id, { tls: false })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should not set ttl if it is not a number', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id, { ttl: {} })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should set ttl to 10 seconds', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id, { ttl: 10 })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should parse ttl to an int', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true, ttl_in_seconds: 10 })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id, { ttl: 10.5 })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });

    it('should stream the file', () => {//TODO: the stream.true does not seem to be used anywhere
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      return Files.download(fileEntity._id, { stream: true })
        .then((entity) => {
          expect(entity).toEqual(fileEntity);
        });
    });

    it('should not stream the file', () => {
      const fileEntity = { _id: randomString(), _downloadURL: 'http://tests.com' };
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');

      nock(client.apiHostname)
        .get(`${Files.pathname}/${fileEntity._id}`)
        .query({ tls: true })
        .reply(200, fileEntity);

      nock(fileEntity._downloadURL)
        .get('/')
        .reply(200, file);

      return Files.download(fileEntity._id, { stream: false })
        .then((response) => {
          expect(response).toEqual(file);
        });
    });
  });

  describe('findById()', () => {
    it('should call download()', () => {//TODO: IN the old SDK findById used to call download
      const spy = expect.spyOn(Files, 'download');
      Files.findById(randomString());
      expect(Files.download).toHaveBeenCalled();
    });

    it('should call download() with id', () => {//TODO: IN the old SDK findById used to call download
      const spy = expect.spyOn(Files, 'download');
      const id = randomString();
      Files.findById(id);
      expect(spy).toHaveBeenCalledWith(id, undefined);
    });

    it('should call download() with options', () => {//TODO: IN the old SDK findById used to call download
      const spy = expect.spyOn(Files, 'download');
      const options = { foo: randomString() };
      Files.findById(null, options);
      expect(spy).toHaveBeenCalledWith(null, options);
    });
  });

  describe('stream()', () => {
    it('should call download()', () => {//In the old SDK stream used to call download
      const spy = expect.spyOn(Files, 'download');
      Files.stream();
      expect(spy).toHaveBeenCalled();
    });

    it('should call download() with id', () => {//In the old SDK stream used to call download
      const spy = expect.spyOn(Files, 'download');
      const id = randomString();
      Files.stream(id);
      expect(spy).toHaveBeenCalledWith(id, { stream: true });
    });

    it('should call download() with options.stream = true if it was set to false', () => {//In the old SDK stream used to call download
      const spy = expect.spyOn(Files, 'download');
      Files.stream(null, { stream: false });
      expect(spy).toHaveBeenCalledWith(null, { stream: true });
    });
  });

  describe('upload()', () => {
    it('should upload a file', () => {
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(Files.pathname, {
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

      const promise = Files.upload(file, {
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

    it('should resume a file upload when a 308 status code is received', () => {
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(Files.pathname, {
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
          'x-./request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-./api-version': '4'
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

      const promise = Files.upload(file, {
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

    it('should resume a file upload when a 5xx status code is received', () => {//500 is considered an error and is thrown at rquest.execute so the evaluation of the response on upload does not happen
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(Files.pathname, {
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
          'x-./request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-./api-version': '4'
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

      const promise = Files.upload(file, {
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

    it('should fail to upload a file when a 5xx status code is received mutiple times', () => {//I think this only succeeds because of the above error
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(Files.pathname, {
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
          'x-./request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-./api-version': '4'
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

      const promise = Files.upload(file, {
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

    it('should fail to upload a file when a 4xx status code is received', () => {
      const file = fs.readFileSync(path.resolve(__dirname, './test.png'), 'utf8');
      const fileSize = file.size || file.length;

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(Files.pathname, {
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
          'x-./request-id': 'def63a2d5ac246d69e3c9b90352b7772',
          'x-./api-version': '4'
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

      const promise = Files.upload(file, {
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

  describe('create()', () => {
    it('should call upload()', () => {
      const spy = sinon.spy(fileFuncs, 'upload');
      fileFuncs.create();
      expect(spy.calledOnce).toEqual(true);
    });

    it('should call upload() with file', () => {
      const spy = expect.spyOn(Files, 'upload');
      const file = randomString();
      Files.create(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', () => {
      const spy = expect.spyOn(Files, 'upload');
      const metadata = randomString();
      Files.create(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', () => {
      const spy = expect.spyOn(Files, 'upload');
      const options = randomString();
      Files.create(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('update()', () => {
    it('should call upload()', () => {
      const spy = expect.spyOn(Files, 'upload');
      Files.update();
      expect(spy).toHaveBeenCalled();
    });

    it('should call upload() with file', () => {
      const spy = expect.spyOn(Files, 'upload');
      const file = randomString();
      Files.update(file);
      expect(spy).toHaveBeenCalledWith(file, undefined, undefined);
    });

    it('should call upload() with metadata', () => {
      const spy = expect.spyOn(Files, 'upload');
      const metadata = randomString();
      Files.update(null, metadata);
      expect(spy).toHaveBeenCalledWith(null, metadata, undefined);
    });

    it('should call upload() with options', () => {
      const spy = expect.spyOn(Files, 'upload');
      const options = randomString();
      Files.update(null, null, options);
      expect(spy).toHaveBeenCalledWith(null, null, options);
    });
  });

  describe('remove()', () => {
    it('should throw an error', () => {
      expect(() => {
        Files.remove();
      }).toThrow();
    });
  });

  describe('removeById()', () => {
    it('should throw a NotFoundError if the id argument does not exist', () => {
      const _id = randomString();

      nock(client.apiHostname)
        .delete(`${Files.pathname}/${_id}`)
        .reply(404);

      return Files.removeById(_id)
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should remove the entity that matches the id argument', () => {
      const _id = randomString();
      const reply = { count: 1 };

      nock(client.apiHostname)
        .delete(`${Files.pathname}/${_id}`)
        .reply(200, reply);

      return Files.removeById(_id)
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });
});
