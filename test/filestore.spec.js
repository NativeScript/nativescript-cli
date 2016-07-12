import './setup';
import { FileStore } from '../src/filestore';
import { NotFoundError, ServerError } from '../src/errors';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('FileStore', function() {
  before(function() {
    this.store = new FileStore();
  });

  after(function() {
    delete this.store;
  });

  it('should upload a file', async function() {
    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const fileSize = file.size || file.length;

    // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, {
        _filename: 'kinvey.png',
        _public: true,
        size: fileSize,
        mimeType: 'image/png'
      })
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg'
      }, {
        'content-type': 'application/json'
      });

    // GCS status check response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', 0)
      .matchHeader('content-range', `bytes */${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': 0
      });

    // GCS complete response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize}`)
      .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(200);

    const data = await this.store.upload(file, {
      filename: 'kinvey.png',
      public: true,
      mimeType: 'image/png'
    });
    expect(data).to.have.property('_data');
  });

  it('should resume a file upload when a 308 status code is received', async function() {
    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const fileSize = file.size || file.length;

    // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, {
        size: fileSize,
        mimeType: 'application/octet-stream'
      })
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg'
      }, {
        'content-type': 'application/json'
      });

    // GCS status check response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', 0)
      .matchHeader('content-range', `bytes */${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': 0
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize}`)
      .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        range: '0-1000'
      });

    // GCS complete response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize - 1001}`)
      .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(200);

    const data = await this.store.upload(file);
    expect(data).to.have.property('_data');
  });

  it('should resume a file upload when a 5xx status code is received', async function() {
    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const fileSize = file.size || file.length;

     // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, {
        size: fileSize,
        mimeType: 'application/octet-stream'
      })
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg'
      }, {
        'content-type': 'application/json'
      });

    // GCS status check response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', 0)
      .matchHeader('content-range', `bytes */${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': 0
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize}`)
      .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        range: '0-1000'
      });

    // GCS error response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize - 1001}`)
      .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(500);

    // GCS complete response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize - 1001}`)
      .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(200);

    const data = await this.store.upload(file);
    expect(data).to.have.property('_data');
  });

  it('should fail to upload a file when a 5xx status code is received mutiple times', async function() {
    // Disable timeout for this test
    this.timeout(0);

    // Read the file
    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const fileSize = file.size || file.length;

     // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, {
        size: fileSize,
        mimeType: 'application/octet-stream'
      })
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg'
      }, {
        'content-type': 'application/json'
      });

    // GCS status check response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', 0)
      .matchHeader('content-range', `bytes */${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': 0
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize}`)
      .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        range: '0-1000'
      });

    // GCS error response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize - 1001}`)
      .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .times(15)
      .reply(500);

    const promise = this.store.upload(file, null, {
      maxBackoff: 1000
    });
    return expect(promise).to.be.rejectedWith(ServerError);
  });

  it('should fail to upload a file when a 4xx status code is received', async function() {
    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const fileSize = file.size || file.length;

     // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, {
        size: fileSize,
        mimeType: 'application/octet-stream'
      })
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg'
      }, {
        'content-type': 'application/json'
      });

    // GCS status check response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', 0)
      .matchHeader('content-range', `bytes */${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': 0
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize}`)
      .matchHeader('content-range', `bytes 0-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        range: '0-1000'
      });

    // GCS error response
    nock('https://www.googleapis.com')
      .matchHeader('content-length', `${fileSize - 1001}`)
      .matchHeader('content-range', `bytes 1001-${fileSize - 1}/${fileSize}`)
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(404);

    const promise = this.store.upload(file);
    return expect(promise).to.be.rejectedWith(NotFoundError);
  });
});
