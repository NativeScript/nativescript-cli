import { KinveyRequest } from './request';
import { NetworkRack } from '../rack/rack';
import { InvalidCredentialsError } from '../errors';
import { HttpMethod, AuthType } from '../enums';
import url from 'url';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const micIdentity = process.env.KINVEY_MIC_IDENTITY || 'kinveyAuth';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = NetworkRack.sharedInstance();
    this.automaticallyRefreshAuthToken = true;
  }

  execute() {
    const promise = super.execute().catch(error => {
      if (error instanceof InvalidCredentialsError && this.automaticallyRefreshAuthToken) {
        this.automaticallyRefreshAuthToken = false;
        const activeSocialIdentity = this.client.getActiveSocialIdentity();

        // Refresh MIC Auth Token
        if (activeSocialIdentity && activeSocialIdentity.identity === micIdentity) {
          const token = activeSocialIdentity.token;
          const request = new NetworkRequest({
            method: HttpMethod.POST,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            authType: AuthType.App,
            url: url.format({
              protocol: activeSocialIdentity.client.protocol,
              host: activeSocialIdentity.client.host,
              pathname: tokenPathname
            }),
            properties: this.properties,
            data: {
              grant_type: 'refresh_token',
              client_id: token.audience,
              redirect_uri: activeSocialIdentity.redirectUri,
              refresh_token: token.refresh_token
            }
          });
          request.automaticallyRefreshAuthToken = false;

          return request.execute().then(response => {
            return response.data;
          }).then(token => {
            const activeUserData = this.client.getActiveUserData();
            const socialIdentity = activeUserData[socialIdentityAttribute];
            socialIdentity[activeSocialIdentity.identity] = token;
            activeUserData[socialIdentityAttribute] = socialIdentity;

            const request = new NetworkRequest({
              method: HttpMethod.POST,
              authType: AuthType.App,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: `/${usersNamespace}/${this.client.appKey}/login`
              }),
              properties: this.properties,
              data: activeUserData,
              timeout: this.timeout,
              client: this.client
            });
            request.automaticallyRefreshAuthToken = false;
            return request.execute();
          }).then(response => {
            this.client.setActiveUserData(response.data);
            this.client.setActiveSocialIdentity({
              identity: activeSocialIdentity.identity,
              redirectUri: activeSocialIdentity.redirectUri,
              token: response.data[socialIdentityAttribute][activeSocialIdentity.identity]
            });

            return this.execute();
          }).catch(() => {
            throw error;
          });
        }
      }

      throw error;
    }).then(response => {
      this.automaticallyRefreshAuthToken = true;
      return response;
    }).catch(error => {
      this.automaticallyRefreshAuthToken = true;
      throw error;
    });

    return promise;
  }
}
