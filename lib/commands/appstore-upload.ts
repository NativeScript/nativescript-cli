import * as path from "path";
import { IErrors, IHostInfo } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	objectOption,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";
import { BuildController } from "../controllers/build-controller";
import { IOSBuildData } from "../data/build-data";
import {
	IITMSTransporterService,
	IOptions,
	IPlatformValidationService,
} from "../declarations";
import { IProjectData } from "../definitions/project";
import { IApplePortalSessionService } from "../services/apple-portal/definitions";

const publishIOSCommandOptions = {
	appleApplicationSpecificPassword: stringOption(),
	appleSessionBase64: stringOption(),
	ipa: stringOption(),
	provision: objectOption(),
	release: booleanOption(),
	teamId: objectOption(),
} satisfies CommandOptionsSchema;

export type PublishIOSCommandContext = CommandContext<
	typeof publishIOSCommandOptions
>;

export interface IPublishIOSCommandServices {
	$applePortalSessionService: IApplePortalSessionService;
	$buildController: BuildController;
	$devicePlatformsConstants: Mobile.IDevicePlatformsConstants;
	$errors: IErrors;
	$hostInfo: IHostInfo;
	$itmsTransporterService: IITMSTransporterService;
	$logger: ILogger;
	$options: IOptions;
	$platformValidationService: IPlatformValidationService;
	$projectData: IProjectData;
	$prompter: IPrompter;
}

export function setupPublishIOSCommand(): IPublishIOSCommandServices {
	const services = {
		$applePortalSessionService: inject<IApplePortalSessionService>(
			"applePortalSessionService",
		),
		$buildController: inject<BuildController>("buildController"),
		$devicePlatformsConstants: inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		),
		$errors: inject<IErrors>("errors"),
		$hostInfo: inject<IHostInfo>("hostInfo"),
		$itmsTransporterService: inject<IITMSTransporterService>(
			"itmsTransporterService",
		),
		$logger: inject<ILogger>("logger"),
		$options: inject<IOptions>("options"),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$projectData: inject<IProjectData>("projectData"),
		$prompter: inject<IPrompter>("prompter"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export function canExecutePublishIOSCommand(
	context: PublishIOSCommandContext,
	services: IPublishIOSCommandServices,
): boolean {
	if (!services.$hostInfo.isDarwin) {
		services.$errors.fail("iOS publishing is only available on macOS.");
	}

	if (
		!services.$platformValidationService.isPlatformSupportedForOS(
			services.$devicePlatformsConstants.iOS,
			services.$projectData,
		)
	) {
		services.$errors.fail(
			`Applications for platform ${services.$devicePlatformsConstants.iOS} can not be built on this OS`,
		);
	}

	return true;
}

export async function runPublishIOSCommand(
	context: PublishIOSCommandContext,
	services: IPublishIOSCommandServices,
): Promise<void> {
	await services.$itmsTransporterService.validate(
		context.options.appleApplicationSpecificPassword,
	);

	const username =
		context.args[0] ||
		(await services.$prompter.getString("Apple ID", { allowEmpty: false }));

	const password =
		context.args[1] ||
		(await services.$prompter.getPassword("Apple ID password"));

	const user = await services.$applePortalSessionService.createUserSession(
		{ username, password },
		{
			applicationSpecificPassword:
				context.options.appleApplicationSpecificPassword,
			sessionBase64: context.options.appleSessionBase64,
			requireInteractiveConsole: true,
			requireApplicationSpecificPassword: true,
		},
	);
	if (!user.areCredentialsValid) {
		services.$errors.fail(
			`Invalid username and password combination. Used '${username}' as the username.`,
		);
	}

	const mobileProvisionIdentifier =
		context.options.provision ?? context.args[2];

	let ipaFilePath = context.options.ipa
		? path.resolve(context.options.ipa)
		: null;

	if (!mobileProvisionIdentifier && !ipaFilePath) {
		services.$logger.warn(
			"No mobile provision identifier set. A default mobile provision will be used. You can set one in app/App_Resources/iOS/build.xcconfig",
		);
	}

	// The build data is spread off the parsed command line, so the flags the
	// upload implies have to be set on the options service rather than on the
	// context, which is a copy.
	services.$options.release = true;

	if (!ipaFilePath) {
		const platform = services.$devicePlatformsConstants.iOS.toLowerCase();
		// No .ipa path provided, build .ipa on out own.
		if (mobileProvisionIdentifier) {
			// This is not very correct as if we build multiple targets we will try to sign all of them using the signing identity here.
			services.$logger.info(
				"Building .ipa with the selected mobile provision and/or certificate. " +
					mobileProvisionIdentifier,
			);

			services.$options.provision = mobileProvisionIdentifier;

			const buildData = new IOSBuildData(
				services.$projectData.projectDir,
				platform,
				{ ...services.$options.argv, buildForAppStore: true, watch: false },
			);
			ipaFilePath = await services.$buildController.prepareAndBuild(buildData);
		} else {
			services.$logger.info(
				"No .ipa, mobile provision or certificate set. Perfect! Now we'll build .xcarchive and let Xcode pick the distribution certificate and provisioning profile for you when exporting .ipa for AppStore submission.",
			);
			const buildData = new IOSBuildData(
				services.$projectData.projectDir,
				platform,
				{ ...services.$options.argv, buildForAppStore: true, watch: false },
			);
			ipaFilePath = await services.$buildController.prepareAndBuild(buildData);
			services.$logger.info(`Export at: ${ipaFilePath}`);
		}
	}

	await services.$itmsTransporterService.upload({
		credentials: { username, password },
		user,
		applicationSpecificPassword:
			context.options.appleApplicationSpecificPassword,
		ipaFilePath,
		shouldExtractIpa: !!context.options.ipa,
		verboseLogging: services.$logger.getLevel() === "TRACE",
		teamId: context.options.teamId,
	});
}

export const publishIOSCommandDefinition = defineCommand({
	name: ["publish|ios", "appstore|upload"],
	description: "Uploads a project to App Store Connect.",
	options: publishIOSCommandOptions,
	// Arguments have never been rejected here, only ignored past the third.
	arguments: "any",
	setup: setupPublishIOSCommand,
	canExecute: canExecutePublishIOSCommand,
	run: runPublishIOSCommand,
});

registerCommand(publishIOSCommandDefinition);
