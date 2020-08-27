import { ICredentials } from "../../common/declarations";

interface IApplePortalSessionService {
	createWebSession(contentProviderId: number, dsId: string): Promise<string>;
	createUserSession(
		credentials: ICredentials,
		opts?: IAppleCreateUserSessionOptions
	): Promise<IApplePortalUserDetail>;
}

interface IApplePortalCookieService {
	getWebSessionCookie(cookiesData: string[]): string;
	getUserSessionCookie(): string;
	updateUserSessionCookie(cookie: string[]): void;
}

interface IApplePortalApplicationService {
	getApplications(
		user: IApplePortalUserDetail
	): Promise<IApplePortalApplicationSummary[]>;
	getApplicationsByProvider(
		contentProviderId: number,
		dsId: string
	): Promise<IApplePortalApplication>;
	getApplicationByBundleId(
		user: IApplePortalUserDetail,
		bundleId: string
	): Promise<IApplePortalApplicationSummary>;
}

interface IAppleCreateUserSessionOptions {
	applicationSpecificPassword?: string;
	sessionBase64: string;
	requireInteractiveConsole?: boolean;
	requireApplicationSpecificPassword?: boolean;
}

interface IAppleLoginResult {
	scnt: string;
	xAppleIdSessionId: string;
	isTwoFactorAuthenticationEnabled: boolean;
	areCredentialsValid: boolean;
}

interface IApplePortalUserDetail extends IAppleLoginResult {
	associatedAccounts: IApplePortalAssociatedAccountData[];
	sessionToken: {
		dsId: string;
		contentProviderId: number;
		ipAddress: string;
	};
	contentProviderFeatures: string[];
	contentProviderId: number;
	firstname: string;
	displayName: string;
	userName: string;
	userId: string;
	contentProvider: string;
	authServiceKey: string;
	visibility: boolean;
	DYCVisibility: boolean;
	userSessionCookie: string;
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
