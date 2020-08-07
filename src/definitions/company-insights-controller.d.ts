/**
 * Describes the information for a company.
 */
interface ICompanyData {
	/**
	 * The name of the company.
	 */
	name: string;

	/**
	 * The country where the company is located.
	 */
	country: string;

	/**
	 * The revenue (stringified) of the company.
	 */
	revenue: string;

	/**
	 * The industries in which the company is determined to work.
	 * NOTE: The single value contains multiple industries separated with __
	 */
	industries: string;

	/**
	 * Number of employees in the company (stringified).
	 */
	employeeCount: string;
}

/**
 * Describes information about the company returned by the Playground's /api/insights endpoint.
 */
interface IPlaygroundInsightsCompanyData {
	name: string;
	country: string;
	revenue: string;
	industries: string[];
	employeeCount: string;
}

/**
 * Describes the information returned by the Playground's /api/insights endpoint.
 */
interface IPlaygroundInsightsEndpointData {
	company: IPlaygroundInsightsCompanyData;
}

/**
 * Describes the service that can be used to get insights about the company using the CLI.
 */
interface ICompanyInsightsController {
	/**
	 * Describes information about the company.
	 * @returns {Promise<ICompanyData>}
	 */
	getCompanyData(): Promise<ICompanyData>;
}
