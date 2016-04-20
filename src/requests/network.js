import { KinveyRequest } from './request';
import { NetworkRack } from '../rack/rack';
import { NoResponseError, InvalidCredentialsError } from '../errors';
import { HttpMethod, AuthType } from '../enums';
import { Response } from './response';
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
    const promise = super.execute().then(() => this.rack.execute(this)).then(response => {
      if (!response) {
        throw new NoResponseError();
      }

      if (!(response instanceof Response)) {
        return new Response({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        });
      }

      return response;
    }).then(response => {
      if (!response.isSuccess()) {
        throw response.error;
      }

      return response;
    }).catch(error => {
      if (error instanceof InvalidCredentialsError && this.automaticallyRefreshAuthToken) {
        this.automaticallyRefreshAuthToken = false;
        const socialIdentity = this.client.socialIdentity;

        // Refresh MIC Auth Token
        if (socialIdentity && socialIdentity.identity === micIdentity) {
          // Refresh the token
          const token = socialIdentity.token;
          const request = new NetworkRequest({
            method: HttpMethod.POST,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            authType: AuthType.App,
            url: url.format({
              protocol: socialIdentity.client.protocol,
              host: socialIdentity.client.host,
              pathname: tokenPathname
            }),
            properties: this.properties,
            data: {
              grant_type: 'refresh_token',
              client_id: token.audience,
              redirect_uri: socialIdentity.redirectUri,
              refresh_token: token.refresh_token
            }
          });
          request.automaticallyRefreshAuthToken = false;

          return request.execute().then(response => response.data).then(token => {
            // Login the user with the new token
            const activeUser = this.client.user;
            const socialIdentity = activeUser[socialIdentityAttribute];
            socialIdentity[socialIdentity.identity] = token;
            activeUser[socialIdentityAttribute] = socialIdentity;

            const request = new NetworkRequest({
              method: HttpMethod.POST,
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
            request.automaticallyRefreshAuthToken = false;
            return request.execute();
          }).then(response => {
            // Store the new data
            this.client.user = response.data;
            this.client.socialIdentity = {
              identity: socialIdentity.identity,
              redirectUri: socialIdentity.redirectUri,
              token: response.data[socialIdentityAttribute][socialIdentity.identity],
              client: socialIdentity.client
            };

            // Execute the original request
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

  cancel() {
    const promise = super.cancel().then(() => this.rack.cancel());
    return promise;
  }
}
