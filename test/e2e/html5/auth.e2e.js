/* eslint-env mocha */

import { expect } from 'chai';
import { Client } from '../../../src/html5/client';
import { randomString } from '../../../src/core/utils';

describe('HTML5:Client', () => {
  const client = Client.init({
    appKey: randomString(),
    appSecret: randomString()
  });

  describe('setActiveUser()', () => {
    it('should store the active user with localStorage', () => {
      const activeUser = { _id: randomString() };
      client.setActiveUser(activeUser);
      expect(JSON.parse(global.localStorage.getItem(`${client.appKey}.active_user`))).to.deep.equal(activeUser);
    });
  });
});
