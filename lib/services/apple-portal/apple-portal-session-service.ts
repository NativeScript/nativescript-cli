export class ApplePortalSessionService implements IApplePortalSessionService {
	private loginConfigEndpoint = "https://appstoreconnect.apple.com/olympus/v1/app/config?hostname=itunesconnect.apple.com";
	private defaultLoginConfig = {
		authServiceUrl : "https://idmsa.apple.com/appleautcodh",
		authServiceKey : "e0b80c3bf78523bfe80974d320935bfa30add02e1bff88ec2166c6bd5a706c42"
	};

	constructor(
		private $applePortalCookieService: IApplePortalCookieService,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger
	) { }

	public async createUserSession(credentials: ICredentials): Promise<IApplePortalUserDetail> {
		const loginConfig = await this.getLoginConfig();
		const loginUrl = `${loginConfig.authServiceUrl}/auth/signin`;
		const loginResponse = await this.$httpClient.httpRequest({
			url: loginUrl,
			method: "POST",
			body: JSON.stringify({
				accountName: credentials.username,
				password: credentials.password,
				rememberMe: true
			}),
			headers: {
				'Content-Type': 'application/json',
				'X-Requested-With': 'XMLHttpRequest',
				'X-Apple-Widget-Key': loginConfig.authServiceKey,
				'Accept': 'application/json, text/javascript'
			}
		});

		this.$applePortalCookieService.updateUserSessionCookie(loginResponse.headers["set-cookie"]);

		const sessionResponse = await this.$httpClient.httpRequest({
			url: "https://appstoreconnect.apple.com/olympus/v1/session",
			method: "GET",
			headers: {
				'Cookie': this.$applePortalCookieService.getUserSessionCookie()
			}
		});

		this.$applePortalCookieService.updateUserSessionCookie(sessionResponse.headers["set-cookie"]);

		const userDetailResponse = await this.$httpClient.httpRequest({
			url: "https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/user/detail",
			method: "GET",
			headers: {
				'Content-Type': 'application/json',
				'Cookie': this.$applePortalCookieService.getUserSessionCookie(),
			}
		});

		this.$applePortalCookieService.updateUserSessionCookie(userDetailResponse.headers["set-cookie"]);

		return JSON.parse(userDetailResponse.body).data;
	}

	public async createWebSession(contentProviderId: number, dsId: string): Promise<string> {
		const webSessionResponse = await this.$httpClient.httpRequest({
			url: "https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/v1/session/webSession",
			method: "POST",
			body: JSON.stringify({
				contentProviderId,
				dsId,
				ipAddress: null
			}),
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Accept-Encoding': 'gzip, deflate, br',
				'X-Csrf-Itc': 'itc',
				'Content-Type': 'application/json;charset=UTF-8',
				'Cookie': this.$applePortalCookieService.getUserSessionCookie()
			}
		});

		const webSessionCookie = this.$applePortalCookieService.getWebSessionCookie(webSessionResponse.headers["set-cookie"]);

		return webSessionCookie;
	}

	private async getLoginConfig(): Promise<{authServiceUrl: string, authServiceKey: string}> {
		let config = null;

		try {
			const response = await this.$httpClient.httpRequest({ url: this.loginConfigEndpoint, method: "GET" });
			config = JSON.parse(response.body);
		} catch (err) {
			this.$logger.trace(`Error while executing request to ${this.loginConfigEndpoint}. More info: ${err}`);
		}

		return config || this.defaultLoginConfig;
	}
}
$injector.register("applePortalSessionService", ApplePortalSessionService);
