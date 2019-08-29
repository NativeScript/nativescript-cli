
import { AnalyticsEventLabelDelimiter } from "../constants";
import { cache } from "../common/decorators";
import * as path from "path";
import * as util from "util";

export class CompanyInsightsController implements ICompanyInsightsController {
	private static CACHE_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
	private get $jsonFileSettingsService(): IJsonFileSettingsService {
		return this.$injector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", {
			jsonFileSettingsPath: path.join(this.$settingsService.getProfileDir(), "company-insights-data.json")
		});
	}

	constructor(private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private $injector: IInjector,
		private $ipService: IIPService,
		private $logger: ILogger,
		private $settingsService: ISettingsService) { }

	public async getCompanyData(): Promise<ICompanyData> {
		let companyData: ICompanyData = null;
		const { currentPublicIP, cacheKey } = await this.getIPInfo();

		companyData = await this.getCompanyDataFromCache(cacheKey);

		if (!companyData && currentPublicIP) {
			companyData = await this.getCompanyDataFromPlaygroundInsightsEndpoint(currentPublicIP);
			if (companyData && currentPublicIP) {
				await this.$jsonFileSettingsService.saveSetting<ICompanyData>(cacheKey, companyData, { useCaching: true });
			}
		}

		return companyData;
	}

	private async getIPInfo(): Promise<{ currentPublicIP: string, cacheKey: string }> {
		let currentPublicIP: string = null;
		let keyInJsonFile: string = null;

		try {
			currentPublicIP = await this.$ipService.getCurrentIPv4Address();
			keyInJsonFile = `companyInformation_${currentPublicIP}`;
		} catch (err) {
			this.$logger.trace(`Unable to get current public ip address. Error is: `, err);
		}

		return { currentPublicIP, cacheKey: keyInJsonFile };
	}

	private async getCompanyDataFromCache(keyInJsonFile: string): Promise<ICompanyData> {
		let companyData: ICompanyData = null;

		try {
			if (keyInJsonFile) {
				companyData = await this.$jsonFileSettingsService.getSettingValue<ICompanyData>(keyInJsonFile, { cacheTimeout: CompanyInsightsController.CACHE_TIMEOUT });
			}
		} catch (err) {
			this.$logger.trace(`Unable to get data from file, error is:`, err);
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

$injector.register("companyInsightsController", CompanyInsightsController);
