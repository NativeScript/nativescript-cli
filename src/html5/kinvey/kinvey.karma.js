/* eslint-env mocha */
/* eslint-disable consistent-return */

import url from 'url';
import { expect } from 'chai';
import { Kinvey } from './kinvey';
import { CacheMiddleware } from '../middleware';
import { CacheRack, CacheRequest, RequestMethod } from '../../core/request';
import { randomString } from '../../core/utils';
import { User } from '../../core/entity';

describe('HTML5:Kinvey', () => {
  before(() => {
    CacheRack.useCacheMiddleware(new CacheMiddleware());
  });

  describe('initialize()', () => {
    it('should return active user stored in cache', () => {
      const appKey = randomString();
      const appSecret = randomString();
      return Kinvey.initialize({
        appKey: appKey,
        appSecret: appSecret
      })
        .then(() => {
          const { client } = Kinvey;
          const legacyActiveUser = { _id: randomString() };
          const request = new CacheRequest({
            method: RequestMethod.POST,
            url: url.format({
              protocol: client.apiProtocol,
              host: client.apiHost,
              pathname: `/user/${client.appKey}/kinvey_active_user`
            }),
            body: legacyActiveUser
          });
          return request.execute()
            .then(() => {
              return Kinvey.initialize({
                appKey: appKey,
                appSecret: appSecret
              });
            })
            .then((activeUser) => {
              expect(activeUser).to.be.instanceof(User);
              expect(activeUser.data).to.deep.equal(legacyActiveUser);
            });
        });
    });
  });
});
