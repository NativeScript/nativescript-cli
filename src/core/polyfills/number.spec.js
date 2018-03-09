/* eslint-env mocha */

import { expect } from 'chai';
import { isNaN } from './number';

describe('Number polyfill', () => {
  describe('isNaN()', () => {
    it('should return false', () => {
      expect(isNaN('')).to.equal(false);
    });

    it('should return true', () => {
      expect(isNaN(NaN)).to.equal(true);
    });

    it('should return true', () => {
      expect(isNaN(parseFloat(''))).to.equal(true);
    });
  });
});
