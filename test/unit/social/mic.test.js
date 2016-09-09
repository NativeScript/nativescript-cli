import { MobileIdentityConnect, SocialIdentity } from '../../../src/social';
import expect from 'expect';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

describe('MobileIdentityConnect', () => {
  describe('identity', () => {
    it('should return MobileIdentityConnect', () => {
      expect(MobileIdentityConnect.identity).toEqual(SocialIdentity.MobileIdentityConnect);
      expect(new MobileIdentityConnect().identity).toEqual(SocialIdentity.MobileIdentityConnect);
    });
  });

  // describe('login with AuthorizationGrant.AuthorizationCodeLoginPage', () => {
  //   it('should return a session for a valid user', async function() {
  //     // Disable timeout for this test
  //     this.timeout(0);

  //     const mic = new MobileIdentityConnect();
  //     const session = await mic.login('http://localhost:9876/');
  //     console.log(session);
  //   });
  // });
});
