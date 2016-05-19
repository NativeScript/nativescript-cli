import { RequestMethod, AuthType, KinveyRequest } from './request';
import { NetworkRack } from '../rack/rack';
import { NoResponseError, InvalidCredentialsError } from '../errors';
import { Response } from './response';
import { setActiveUser, setActiveSocialIdentity } from '../utils/storage';
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

  async execute() {
    try {
      await super.execute();
      let response = await this.rack.execute(this);
      this.executing = false;

      if (!response) {
        throw new NoResponseError();
      }

      if (!(response instanceof Response)) {
        response = new Response({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        });
      }

      if (!response.isSuccess()) {
        throw response.error;
      }

      return response;
    } catch (error) {
      if (error instanceof InvalidCredentialsError && this.automaticallyRefreshAuthToken) {
        this.automaticallyRefreshAuthToken = false;
        const activeSocialIdentity = this.client.activeSocialIdentity;

        // Refresh MIC Auth Token
        if (activeSocialIdentity && activeSocialIdentity.identity === micIdentity) {
          // Refresh the token
          const token = activeSocialIdentity.token;
          const refreshTokenRequest = new NetworkRequest({
            method: RequestMethod.POST,
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
          refreshTokenRequest.automaticallyRefreshAuthToken = false;
          const newToken = await refreshTokenRequest.execute().then(response => response.data);

          // Login the user with the new token
          const activeUser = this.client.activeUser;
          const socialIdentity = activeUser[socialIdentityAttribute];
          socialIdentity[activeSocialIdentity.identity] = newToken;
          activeUser[socialIdentityAttribute] = activeSocialIdentity;

          const loginRequest = new NetworkRequest({
            method: RequestMethod.POST,
            authType: AuthType.App,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `/${usersNamespace}/${this.client.appKey}/login`
            }),
            properties: this.properties,
            data: activeUser,
            timeout: this.timeout,
            client: this.client
          });
          loginRequest.automaticallyRefreshAuthToken = false;
          const user = await loginRequest.execute().then(response => response.data);

          // Store the new data
          setActiveUser(this.client, user);
          setActiveSocialIdentity(this.client, {
            identity: activeSocialIdentity.identity,
            redirectUri: activeSocialIdentity.redirectUri,
            token: user[socialIdentityAttribute][activeSocialIdentity.identity],
            client: activeSocialIdentity.client
          });

          try {
            // Execute the original request
            const response = await this.execute();
            this.automaticallyRefreshAuthToken = true;
            return response;
          } catch (error) {
            this.automaticallyRefreshAuthToken = true;
            throw error;
          }
        }
      }

      throw error;
    }
  }

  cancel() {
    const promise = super.cancel().then(() => this.rack.cancel());
    return promise;
  }
}
