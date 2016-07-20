import { RequestMethod, AuthType, KinveyRequest, KinveyRequestConfig } from './request';
import { KinveyRackManager } from '../rack/rack';
import { NoResponseError, InvalidCredentialsError } from '../errors';
import { KinveyResponse, KinveyResponseConfig } from './response';
import { SocialIdentity } from '../social/src/enums';
import { setActiveUser } from '../utils/storage';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  constructor(options = {}) {
    super(options);
    this.rack = KinveyRackManager.networkRack;
    this.automaticallyRefreshAuthToken = options.automaticallyRefreshAuthToken === true;
  }

  async execute(rawResponse = false) {
    try {
      await super.execute();
      let response = await this.rack.execute(this);
      this.executing = false;

      if (!response) {
        throw new NoResponseError();
      }

      if (!(response instanceof KinveyResponse)) {
        response = new KinveyResponse(new KinveyResponseConfig({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        }));
      }

      if (rawResponse === false && response.isSuccess() === false) {
        throw response.error;
      }

      return response;
    } catch (error) {
      if (error instanceof InvalidCredentialsError && this.automaticallyRefreshAuthToken) {
        this.automaticallyRefreshAuthToken = false;
        let activeUser = this.client.activeUser;
        const identities = activeUser ? Object.keys(activeUser[socialIdentityAttribute]) : [];
        const micIdentityIndex = identities.indexOf(SocialIdentity.MobileIdentityConnect);
        let micSession = micIdentityIndex >= 0 ? identities[micIdentityIndex] : undefined;

        if (micSession) {
          // Refresh MIC Auth Token
          const config = new KinveyRequestConfig({
            method: RequestMethod.POST,
            authType: AuthType.App,
            url: url.format({
              protocol: micSession.protocol,
              host: micSession.host,
              pathname: tokenPathname
            }),
            body: {
              grant_type: 'refresh_token',
              client_id: micSession.audience,
              redirect_uri: micSession.redirect_uri,
              refresh_token: micSession.refresh_token
            },
            timeout: this.timeout,
            properties: this.properties,
            automaticallyRefreshAuthToken: false
          });
          config.headers.set('Content-Type', 'application/x-www-form-urlencoded');
          const refreshTokenRequest = new NetworkRequest(config);
          micSession = await refreshTokenRequest.execute().then(response => response.data);

          // Update the active user with the new mic session
          identities[SocialIdentity.MobileIdentityConnect] = micSession;
          activeUser[socialIdentityAttribute] = identities;
          const loginRequestConfig = new KinveyRequestConfig({
            method: RequestMethod.PUT,
            authType: AuthType.Default,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `/${usersNamespace}/${this.client.appKey}/${activeUser[idAttribute]}`
            }),
            properties: this.properties,
            body: activeUser,
            timeout: this.timeout,
            client: this.client,
            automaticallyRefreshAuthToken: false
          });
          const loginRequest = new NetworkRequest(loginRequestConfig);
          activeUser = await loginRequest.execute().then(response => response.data);

          // Store the updated active user
          setActiveUser(this.client, activeUser);

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
