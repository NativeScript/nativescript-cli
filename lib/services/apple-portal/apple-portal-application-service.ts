import { IErrors, Server } from "../../common/declarations";
import { injector } from "../../common/yok";
import * as _ from "lodash";
import {
	IApplePortalUserDetail,
	IApplePortalSessionService,
	IApplePortalApplicationService,
	IApplePortalApplicationSummary,
	IApplePortalApplication,
} from "./definitions";

export class ApplePortalApplicationService
	implements IApplePortalApplicationService {
	constructor(
		private $applePortalSessionService: IApplePortalSessionService,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient
	) {}

	public async getApplications(
		user: IApplePortalUserDetail
	): Promise<IApplePortalApplicationSummary[]> {
		let result: IApplePortalApplicationSummary[] = [];

		for (const account of user.associatedAccounts) {
			const contentProviderId = account.contentProvider.contentProviderId;
			const applications = await this.getApplicationsByProvider(
				contentProviderId
			);
			result = result.concat(applications.summaries);
		}

		return result;
	}

	public async getApplicationsByProvider(
		contentProviderId: number
	): Promise<IApplePortalApplication> {
		const webSessionCookie = await this.$applePortalSessionService.createWebSession(
			contentProviderId
		);
		const summaries: IApplePortalApplicationSummary[] = [];
		await this.getApplicationsByUrl(
			webSessionCookie,
			"https://appstoreconnect.apple.com/iris/v1/apps?include=appStoreVersions,prices",
			summaries
		);

		return { summaries: summaries };
	}

	private async getApplicationsByUrl(
		webSessionCookie: string,
		url: string,
		summaries: IApplePortalApplicationSummary[]
	): Promise<void> {
		const response = await this.$httpClient.httpRequest({
			url,
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Cookie: webSessionCookie,
			},
		});
		const result = JSON.parse(response.body);
		const data = result.data;

		for (const app of data) {
			let summary: IApplePortalApplicationSummary;
			summary = {
				bundleId: app.attributes.bundleId,
				adamId: app.id,
				name: app.attributes.name,
				versionSets: [],
			};
			summaries.push(summary);
		}

		if (result.links.next) {
			await this.getApplicationsByUrl(
				webSessionCookie,
				result.links.next,
				summaries
			);
		}
	}

	public async getApplicationByBundleId(
		user: IApplePortalUserDetail,
		bundleId: string
	): Promise<IApplePortalApplicationSummary> {
		const applications = await this.getApplications(user);
		if (!applications || !applications.length) {
			this.$errors.fail(
				`Cannot find any registered applications for Apple ID ${user.userName} in iTunes Connect.`
			);
		}

		const application = _.find(
			applications,
			(app) => app.bundleId === bundleId
		);

		if (!application) {
			this.$errors.fail(
				`Cannot find registered applications that match the specified identifier ${bundleId} in iTunes Connect.`
			);
		}

		return application;
	}
}
injector.register(
	"applePortalApplicationService",
	ApplePortalApplicationService
);
