import { expect, use } from 'chai';
import { serialize, parse } from './utils';

// Register chai-as-promised
use(require('chai-as-promised'));

// Data
const DATA = { test: 'foo' };

describe('serialize()', () => {
  describe('unrecognized Content-Type', () => {
    it('should return the request unchanged', async () => {
      const serializedData = await serialize('application/xml', DATA);
      expect(serializedData).to.deep.equal(DATA);
    });
  });

  describe('Content-Type: application/x-www-form-urlencoded', () => {
    it('should serialize the body', async () => {
      const serializedData = await serialize('application/x-www-form-urlencoded', DATA);
      const str = [];
      Object.keys(DATA).forEach((key) => {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(DATA[key])}`);
      });
      const formBody = str.join('&');
      expect(serializedData).to.equal(formBody);
    });
  });

  describe('Content-Type: application/json', () => {
    it('should serialize the body', async () => {
      const serializedData = await serialize('application/json', DATA);
      expect(serializedData).to.equal(JSON.stringify(DATA));
    });
  });
});

describe('parse()', () => {
  describe('unrecognized Content-Type', () => {
    it('should return the response unchanged', async () => {
      const parsedData = await parse('text', DATA.toString());
      expect(parsedData).to.deep.equal(DATA.toString());
    });
  });

  describe('Content-Type: application/json', () => {
    it('should parse the data', async () => {
      const parsedData = await parse('application/json', JSON.stringify(DATA));
      expect(parsedData).to.deep.equal(DATA);
    });
  });
});
