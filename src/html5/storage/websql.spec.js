import Promise from 'es6-promise';
import { expect, use } from 'chai';
import { stub } from 'sinon';
import { WebSQL } from './websql';
import { NotFoundError } from '../../core/errors';

use(require('chai-as-promised'));

describe('WebSQL', () => {
  describe('findById()', () => {
    it('should throw a NotFoundError for an id that does not exist', () => {
      const websql = new WebSQL('test');
      const openTransactionStub = stub(websql, 'openTransaction').callsFake(() => {
        return Promise.resolve({ result: [] });
      });
      const promise = websql.findById('iddoesnotexist');
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });
  });
});
