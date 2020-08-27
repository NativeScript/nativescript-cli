import { IStringDictionary, IDictionary } from "../../common/declarations";
import * as _ from "lodash";
import { injector } from "../../common/yok";
import { IApplePortalCookieService } from "./definitions";

export class ApplePortalCookieService implements IApplePortalCookieService {
	private userSessionCookies: IStringDictionary = {};
	private validUserSessionCookieNames = [
		"myacinfo",
		"dqsid",
		"itctx",
		"itcdq",
		"acn01",
		"DES",
	];
	private validWebSessionCookieNames = ["wosid", "woinst", "itctx"];

	public getWebSessionCookie(cookiesData: string[]): string {
		const webSessionCookies = _.cloneDeep(this.userSessionCookies);

		const parsedCookies = this.parseCookiesData(
			cookiesData,
			this.validWebSessionCookieNames
		);
		_.each(
			parsedCookies,
			(parsedCookie) =>
				(webSessionCookies[parsedCookie.key] = parsedCookie.cookie)
		);

		return _.values(webSessionCookies).join("; ");
	}

	public getUserSessionCookie(): string {
		return _.values(this.userSessionCookies).join("; ");
	}

	public updateUserSessionCookie(cookiesData: string[]): void {
		const parsedCookies = this.parseCookiesData(
			cookiesData,
			this.validUserSessionCookieNames
		);
		_.each(
			parsedCookies,
			(parsedCookie) =>
				(this.userSessionCookies[parsedCookie.key] = parsedCookie.cookie)
		);
	}

	private parseCookiesData(
		cookiesData: string[],
		validCookieNames: string[]
	): IDictionary<{ key: string; value: string; cookie: string }> {
		const result: IDictionary<{
			key: string;
			value: string;
			cookie: string;
		}> = {};

		for (const c of cookiesData) {
			const parts = c.split(";");
			for (const cookie of parts) {
				const trimmedCookie = cookie.trim();
				const [cookieKey, cookieValue] = trimmedCookie.split("=");
				if (
					_.includes(validCookieNames, cookieKey) ||
					_.some(validCookieNames, (validCookieName) =>
						cookieKey.startsWith(validCookieName)
					)
				) {
					result[cookieKey] = {
						key: cookieKey,
						value: cookieValue,
						cookie: trimmedCookie,
					};
				}
			}
		}

		return result;
	}
}
injector.register("applePortalCookieService", ApplePortalCookieService);
