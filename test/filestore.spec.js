import './setup';
import { FileStore } from '../src/filestore';
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

  it('should resume a file upload when a 308 status code is received', async function() {
    // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg',
        _requiredHeaders: {
          'content-type': 'application/octet-stream',
          'content-length': '53443'
        }
      }, {
        'content-type': 'application/json'
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(308, null, {
        'content-length': '0',
        range: '0-100'
      });

    // GCS complete response
    nock('https://www.googleapis.com')
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(200, null);

    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const data = await this.store.upload(file);
    expect(data).to.have.property('_data');
  });

  it('should resume a file upload when a 500 status code is received', async function() {
    // Kinvey API response
    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _uploadURL: 'https://www.googleapis.com/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o?name=06ca01e8-0e21-4afc-8256-a45c4f825c52%2F4c3cdaf6-5ae9-4c21-8e6f-219322e068bf&uploadType=resumable&upload_id=AEnB2UpqHHNAAbZT2uJSXzKNUgPSRSM9McDr5GIS5H0DFHnujASI67uF8GuHo7r9y6ZMP451_lkECDjWI084Gx2EtBiyFU-QRg',
        _requiredHeaders: {
          'content-type': 'application/octet-stream',
          'content-length': '53443'
        }
      }, {
        'content-type': 'application/json'
      });

    // GCS resumable response
    nock('https://www.googleapis.com')
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(500, null, {
        'content-length': '0',
        range: '0-100'
      });

    // GCS complete response
    nock('https://www.googleapis.com')
      .put('/upload/storage/v1/b/d2d53e8f99b64980ae43fd80a2bda953/o', () => true)
      .query(true)
      .reply(200, null);

    const file = fs.readFileSync(path.resolve(__dirname, './mocks/kinvey.png'), 'utf8');
    const data = await this.store.upload(file);
    expect(data).to.have.property('_data');
  });
});
