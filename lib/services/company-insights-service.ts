import { AnalyticsEventLabelDelimiter } from "../constants";
import { cache } from "../common/decorators";

export class CompanyInsightsService implements ICompanyInsightsService {
	constructor(private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger) { }

	@cache()
	public async getCompanyData(): Promise<ICompanyData> {
		let companyData: ICompanyData = null;
		try {
			const response = await this.$httpClient.httpRequest(this.$config.INSIGHTS_URL_ENDPOINT);
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

$injector.register("companyInsightsService", CompanyInsightsService);
