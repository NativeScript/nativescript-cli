
import { AnalyticsEventLabelDelimiter } from "../constants";
import { cache } from "../common/decorators";
import * as util from "util";
import * as _ from 'lodash';
import { IConfiguration } from "../declarations";
import { Server } from "../common/declarations";
import { injector } from "../common/yok";

export class CompanyInsightsController implements ICompanyInsightsController {
	constructor(private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private $ipService: IIPService,
		private $logger: ILogger) { }

	public async getCompanyData(): Promise<ICompanyData> {
		let companyData: ICompanyData = null;
		let currentPublicIP: string = null;

		try {
			currentPublicIP = await this.$ipService.getCurrentIPv4Address();
		} catch (err) {
			this.$logger.trace(`Unable to get current public ip address. Error is: `, err);
		}

		if (currentPublicIP) {
			companyData = await this.getCompanyDataFromPlaygroundInsightsEndpoint(currentPublicIP);
		}

		return companyData;
	}

	@cache()
	private async getCompanyDataFromPlaygroundInsightsEndpoint(ipAddress: string): Promise<ICompanyData> {
		let companyData: ICompanyData = null;

		try {
			const url = util.format(this.$config.INSIGHTS_URL_ENDPOINT, encodeURIComponent(ipAddress));
			const response = await this.$httpClient.httpRequest(url);
			const data = <IPlaygroundInsightsEndpointData>(JSON.parse(response.body));
			if (data.company) {
				const industries = _.isArray(data.company.industries) ? data.company.industries.join(AnalyticsEventLabelDelimiter) : null;
				companyData = {
					name: data.company.name,
					country: data.company.country,
					revenue: data.company.revenue,
					employeeCount: data.company.employeeCount,
					industries
				};
			}
		} catch (err) {
			this.$logger.trace(`Unable to get data for company. Error is: ${err}`);
		}

		return companyData;
	}
}

injector.register("companyInsightsController", CompanyInsightsController);
