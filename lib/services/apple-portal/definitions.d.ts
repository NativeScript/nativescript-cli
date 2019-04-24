interface IApplePortalSessionService {
	createUserSession(credentials: ICredentials): Promise<IApplePortalUserDetail>;
	createWebSession(contentProviderId: number, dsId: string): Promise<string>;
}

interface IApplePortalCookieService {
	getWebSessionCookie(cookiesData: string[]): string;
	getUserSessionCookie(): string;
	updateUserSessionCookie(cookie: string[]): void;
}

interface IApplePortalApplicationService {
	getApplications(credentials: ICredentials): Promise<IApplePortalApplicationSummary[]>
	getApplicationsByProvider(contentProviderId: number, dsId: string): Promise<IApplePortalApplication>;
	getApplicationByBundleId(credentials: ICredentials, bundleId: string): Promise<IApplePortalApplicationSummary>;
}

interface IApplePortalUserDetail {
	associatedAccounts: IApplePortalAssociatedAccountData[];
	sessionToken: {
		dsId: string;
		contentProviderId: number;
		ipAddress: string;
	}
	contentProviderFeatures: string[];
	contentProviderId: number;
	firstname: string;
	displayName: string;
	userName: string;
	userId: string;
	contentProvider: string;
	visibility: boolean;
	DYCVisibility: boolean;
}

interface IApplePortalAssociatedAccountData {
	contentProvider: {
		name: string;
		contentProviderId: number;
		contentProviderPublicId: string;
		contentProviderTypes: string[];
	};
	roles: string[];
	lastLogin: number;
}

interface IApplePortalApplication {
	summaries: IApplePortalApplicationSummary[];
	showSharedSecret: boolean;
	macBundlesEnabled: boolean;
	canCreateMacApps: boolean;
	cloudStorageEnabled: boolean;
	sharedSecretLink: string;
	gameCenterGroupLink: string;
	enabledPlatforms: string[];
	cloudStorageLink: string;
	catalogReportsLink: string;
	canCreateIOSApps: boolean;
}

interface IApplePortalApplicationSummary {
	name: string;
	adamId: string;
	vendorId: string;
	bundleId: string;
	appType: any;
	versionSets: any[];
	lastModifiedDate: number;
	iconUrl: string;
	issuesCount: number;
	priceTier: string;
}