import { expect } from 'chai';

import { Kinvey } from '../../../src/html5/kinvey';
import { User } from '../../../src/core/entity';

import { CacheRack, NetworkRack } from '../../../src/core/request';
import { CacheMiddleware, HttpMiddleware } from '../../../src/html5/middleware';

CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

const client = Kinvey.init({
  appKey: 'kid_HkTD2CJc',
  appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
});

describe('HTML5:Auth', () => {
  it('should store the active user in localStorage', () => {
    return User.login('test', 'test')
      .then((activeUser) => {
        const storedActiveUser = JSON.parse(window.localStorage.getItem(`${client.appKey}.active_user`));
        expect(storedActiveUser).to.deep.equal(activeUser.data);
      });
  });
});
