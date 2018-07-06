import { expect, use } from 'chai';
import parse from '../../../src/http/parse';
import Response from '../../../src/http/response';

// Register chai-as-promised
use(require('chai-as-promised'));

// Data
const DATA = { test: 'foo' };

describe('parse()', () => {
  it('should throw an error if no response is provided', () => {
    expect(parse()).to.eventually.be.rejectedWith(/No response provided./);
  });

  describe('unrecognized Content-Type', () => {
    const textResponse = new Response({
      statusCode: 200,
      headers: { 'Content-Type': 'text' },
      data: DATA.toString()
    });

    it('should return the response unchanged', async () => {
      const parsedResponse = await parse(textResponse);
      expect(parsedResponse).to.deep.equal(textResponse);
    });
  });

  describe('Content-Type: application/json', () => {
    const jsonResponse = new Response({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(DATA)
    });

    it('should parse the data', async () => {
      const parsedResponse = await parse(jsonResponse);
      expect(parsedResponse.statusCode).to.equal(jsonResponse.statusCode);
      expect(parsedResponse.headers).to.deep.equal(jsonResponse.headers);
      expect(parsedResponse.data).to.deep.equal(DATA);
    });
  });
});
