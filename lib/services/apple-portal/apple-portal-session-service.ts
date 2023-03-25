import { isInteractive } from "../../common/helpers";
import { IErrors, Server, ICredentials } from "../../common/declarations";
import { injector } from "../../common/yok";
import {
	IAppleCreateUserSessionOptions,
	IApplePortalUserDetail,
	IApplePortalCookieService,
	IAppleLoginResult,
	IApplePortalSessionService,
} from "./definitions";
import * as crypto from "crypto";

export class ApplePortalSessionService implements IApplePortalSessionService {
	private loginConfigEndpoint =
		"https://appstoreconnect.apple.com/olympus/v1/app/config?hostname=itunesconnect.apple.com";
	private defaultLoginConfig = {
		authServiceUrl: "https://idmsa.apple.com/appleautcodh",
		authServiceKey:
			"e0b80c3bf78523bfe80974d320935bfa30add02e1bff88ec2166c6bd5a706c42",
	};

	constructor(
		private $applePortalCookieService: IApplePortalCookieService,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $prompter: IPrompter
	) {}

	public async createUserSession(
		credentials: ICredentials,
		opts?: IAppleCreateUserSessionOptions
	): Promise<IApplePortalUserDetail> {
		const loginResult = await this.login(credentials, opts);

		if (!opts || !opts.sessionBase64) {
			if (loginResult.isTwoFactorAuthenticationEnabled) {
				const authServiceKey = (await this.getLoginConfig()).authServiceKey;
				await this.handleTwoFactorAuthentication(
					loginResult.scnt,
					loginResult.xAppleIdSessionId,
					authServiceKey,
					loginResult.hashcash
				);
			}

			const sessionResponse = await this.$httpClient.httpRequest({
				url: "https://appstoreconnect.apple.com/olympus/v1/session",
				method: "GET",
				headers: {
					Cookie: this.$applePortalCookieService.getUserSessionCookie(),
				},
			});

			this.$applePortalCookieService.updateUserSessionCookie(
				sessionResponse.headers["set-cookie"]
			);
		}

		const userDetailsResponse = await this.$httpClient.httpRequest({
			url:
				"https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/user/detail",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Cookie: this.$applePortalCookieService.getUserSessionCookie(),
			},
		});

		this.$applePortalCookieService.updateUserSessionCookie(
			userDetailsResponse.headers["set-cookie"]
		);

		const userdDetails = JSON.parse(userDetailsResponse.body).data;
		const result = {
			...userdDetails,
			...loginResult,
			userSessionCookie: this.$applePortalCookieService.getUserSessionCookie(),
		};

		return result;
	}

	public async createWebSession(contentProviderId: number): Promise<string> {
		const webSessionResponse = await this.$httpClient.httpRequest({
			url: "https://appstoreconnect.apple.com/olympus/v1/session",
			method: "POST",
			body: {
				provider: {
					providerId: contentProviderId,
				},
			},
			headers: {
				Accept: "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br",
				"X-Csrf-Itc": "itc",
				"Content-Type": "application/json;charset=UTF-8",
				"X-Requested-With": "olympus-ui",
				Cookie: this.$applePortalCookieService.getUserSessionCookie(),
			},
		});

		const webSessionCookie = this.$applePortalCookieService.getWebSessionCookie(
			webSessionResponse.headers["set-cookie"]
		);

		return webSessionCookie;
	}

	private async login(
		credentials: ICredentials,
		opts?: IAppleCreateUserSessionOptions
	): Promise<IAppleLoginResult> {
		const result = {
			scnt: <string>null,
			xAppleIdSessionId: <string>null,
			isTwoFactorAuthenticationEnabled: false,
			areCredentialsValid: true,
			hashcash: <string>null,
		};

		if (opts && opts.sessionBase64) {
			const decodedSession = Buffer.from(opts.sessionBase64, "base64").toString(
				"utf8"
			);

			this.$applePortalCookieService.updateUserSessionCookie([decodedSession]);

			result.isTwoFactorAuthenticationEnabled =
				decodedSession.indexOf("DES") > -1;
		} else {
			try {
				await this.loginCore(credentials);
			} catch (err) {
				const statusCode = err && err.response && err.response.status;

				const bits = err?.response?.headers["x-apple-hc-bits"];
				const challenge = err?.response?.headers["x-apple-hc-challenge"];
				const hashcash = makeHashCash(bits, challenge);
				result.hashcash = hashcash;

				result.areCredentialsValid = statusCode !== 401 && statusCode !== 403;
				result.isTwoFactorAuthenticationEnabled = statusCode === 409;

				if (
					result.isTwoFactorAuthenticationEnabled &&
					opts &&
					opts.requireApplicationSpecificPassword &&
					!opts.applicationSpecificPassword
				) {
					this.$errors
						.fail(`Your account has two-factor authentication enabled but --appleApplicationSpecificPassword option is not provided.
To generate an application-specific password, please go to https://appleid.apple.com/account/manage.
This password will be used for the iTunes Transporter, which is used to upload your application.`);
				}

				if (
					result.isTwoFactorAuthenticationEnabled &&
					opts &&
					opts.requireInteractiveConsole &&
					!isInteractive()
				) {
					this.$errors
						.fail(`Your account has two-factor authentication enabled, but your console is not interactive.
For more details how to set up your environment, please execute "tns publish ios --help".`);
				}

				const headers = (err && err.response && err.response.headers) || {};
				result.scnt = headers.scnt;
				result.xAppleIdSessionId = headers["x-apple-id-session-id"];
			}
		}

		return result;
	}

	private async loginCore(credentials: ICredentials): Promise<void> {
		const loginConfig = await this.getLoginConfig();
		const loginUrl = `${loginConfig.authServiceUrl}/auth/signin`;
		const headers = {
			"Content-Type": "application/json",
			"X-Requested-With": "XMLHttpRequest",
			"X-Apple-Widget-Key": loginConfig.authServiceKey,
			Accept: "application/json, text/javascript",
		};
		const body = {
			accountName: credentials.username,
			password: credentials.password,
			rememberMe: true,
		};

		const loginResponse = await this.$httpClient.httpRequest({
			url: loginUrl,
			method: "POST",
			body,
			headers,
		});

		this.$applePortalCookieService.updateUserSessionCookie(
			loginResponse.headers["set-cookie"]
		);
	}

	private async getLoginConfig(): Promise<{
		authServiceUrl: string;
		authServiceKey: string;
	}> {
		let config = null;

		try {
			const response = await this.$httpClient.httpRequest({
				url: this.loginConfigEndpoint,
				method: "GET",
			});
			config = JSON.parse(response.body);
		} catch (err) {
			this.$logger.trace(
				`Error while executing request to ${this.loginConfigEndpoint}. More info: ${err}`
			);
		}

		return config || this.defaultLoginConfig;
	}

	private async handleTwoFactorAuthentication(
		scnt: string,
		xAppleIdSessionId: string,
		authServiceKey: string,
		hashcash: string
	): Promise<void> {
		const headers = {
			scnt: scnt,
			"X-Apple-Id-Session-Id": xAppleIdSessionId,
			"X-Apple-Widget-Key": authServiceKey,
			"X-Apple-HC": hashcash,
			Accept: "application/json",
		};
		const authResponse = await this.$httpClient.httpRequest({
			url: "https://idmsa.apple.com/appleauth/auth",
			method: "GET",
			headers,
		});

		const data = JSON.parse(authResponse.body);

		const isSMS =
			data.trustedPhoneNumbers &&
			data.trustedPhoneNumbers.length === 1 &&
			data.noTrustedDevices; // 1 device and no trusted devices means sms was automatically sent.
		const multiSMS =
			data.trustedPhoneNumbers &&
			data.trustedPhoneNumbers.length !== 1 &&
			data.noTrustedDevices; // Not handling more than 1 sms device and no trusted devices.

		let token: string;

		if (
			data.trustedPhoneNumbers &&
			data.trustedPhoneNumbers.length &&
			!multiSMS
		) {
			const parsedAuthResponse = JSON.parse(authResponse.body);
			token = await this.$prompter.getString(
				`Please enter the ${parsedAuthResponse.securityCode.length} digit code`,
				{ allowEmpty: false }
			);
			const body: any = {
				securityCode: {
					code: token.toString(),
				},
			};
			let url = `https://idmsa.apple.com/appleauth/auth/verify/trusteddevice/securitycode`;

			if (isSMS) {
				// No trusted devices means it must be sms.
				body.mode = "sms";
				body.phoneNumber = {
					id: data.trustedPhoneNumbers[0].id,
				};
				url = `https://idmsa.apple.com/appleauth/auth/verify/phone/securitycode`;
			}

			await this.$httpClient.httpRequest({
				url,
				method: "POST",
				body,
				headers: { ...headers, "Content-Type": "application/json" },
			});

			const authTrustResponse = await this.$httpClient.httpRequest({
				url: "https://idmsa.apple.com/appleauth/auth/2sv/trust",
				method: "GET",
				headers,
			});

			this.$applePortalCookieService.updateUserSessionCookie(
				authTrustResponse.headers["set-cookie"]
			);
		} else if (multiSMS) {
			this.$errors.fail(
				`The NativeScript CLI does not support SMS authenticaton with multiple registered phone numbers.`
			);
		} else {
			this.$errors.fail(
				`Although response from Apple indicated activated Two-step Verification or Two-factor Authentication, NativeScript CLI don't know how to handle this response: ${data}`
			);
		}
	}
}
injector.register("applePortalSessionService", ApplePortalSessionService);

function makeHashCash(bits: string, challenge: string): string {
	const version = 1;

	const dateString = getHashCanDateString();
	let result: string;
	for (let counter = 0; ; counter++) {
		const hc = [version, bits, dateString, challenge, `:${counter}`].join(":");

		const shasumData = crypto.createHash("sha1");

		shasumData.update(hc);
		const digest = shasumData.digest();
		if (checkBits(+bits, digest)) {
			result = hc;
			break;
		}
	}
	return result;
}

function getHashCanDateString(): string {
	const now = new Date();

	return `${now.getFullYear()}${padTo2Digits(now.getMonth() + 1)}${padTo2Digits(
		now.getDate()
	)}${padTo2Digits(now.getHours())}${padTo2Digits(
		now.getMinutes()
	)}${padTo2Digits(now.getSeconds())}`;
}
function padTo2Digits(num: number) {
	return num.toString().padStart(2, "0");
}

function checkBits(bits: number, digest: Buffer) {
	let result = true;
	for (let i = 0; i < bits; ++i) {
		result = checkBit(i, digest);
		if (!result) break;
	}
	return result;
}

function checkBit(position: number, buffer: Buffer): boolean {
	const bitOffset = position & 7; // in byte
	const byteIndex = position >> 3; // in buffer
	const bit = (buffer[byteIndex] >> bitOffset) & 1;
	return bit === 0;
}
