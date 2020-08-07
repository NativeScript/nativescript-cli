import { IErrors, Server } from "../../common/declarations";
import {
	IApplePortalApplication,
	IApplePortalApplicationService,
	IApplePortalApplicationSummary,
	IApplePortalSessionService,
	IApplePortalUserDetail
} from "./definitions";
import * as _ from "lodash";

export class ApplePortalApplicationService implements IApplePortalApplicationService {
	constructor(
		private $applePortalSessionService: IApplePortalSessionService,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient
	) { }

	public async getApplications(user: IApplePortalUserDetail): Promise<IApplePortalApplicationSummary[]> {
		let result: IApplePortalApplicationSummary[] = [];

		for (const account of user.associatedAccounts) {
			const contentProviderId = account.contentProvider.contentProviderId;
			const dsId = user.sessionToken.dsId;
			const applications = await this.getApplicationsByProvider(contentProviderId, dsId);
			result = result.concat(applications.summaries);
		}

		return result;
	}

	public async getApplicationsByProvider(contentProviderId: number, dsId: string): Promise<IApplePortalApplication> {
		const webSessionCookie = await this.$applePortalSessionService.createWebSession(contentProviderId, dsId);
		const response = await this.$httpClient.httpRequest({
			url: "https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/apps/manageyourapps/summary/v2",
			method: "GET",
			body: JSON.stringify({
				contentProviderId
			}),
			headers: {
				'Content-Type': 'application/json',
				'Cookie': webSessionCookie
			}
		});

		return JSON.parse(response.body).data;
	}

	public async getApplicationByBundleId(user: IApplePortalUserDetail, bundleId: string): Promise<IApplePortalApplicationSummary> {
		const applications = await this.getApplications(user);
		if (!applications || !applications.length) {
			this.$errors.fail(`Cannot find any registered applications for Apple ID ${user.userName} in iTunes Connect.`);
		}

		const application = _.find(applications, app => app.bundleId === bundleId);

		if (!application) {
			this.$errors.fail(`Cannot find registered applications that match the specified identifier ${bundleId} in iTunes Connect.`);
		}

		return application;
	}
}
$injector.register("applePortalApplicationService", ApplePortalApplicationService);
