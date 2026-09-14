import { IErrors } from "../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { createTable } from "../common/helpers";
import { IPlatformValidationService } from "../declarations";
import { IProjectData } from "../definitions/project";
import {
	IApplePortalApplicationService,
	IApplePortalSessionService,
} from "../services/apple-portal/definitions";

const listiOSAppsCommandOptions = {
	appleSessionBase64: stringOption(),
} satisfies CommandOptionsSchema;

export type ListiOSAppsCommandContext = CommandContext<
	typeof listiOSAppsCommandOptions
>;

export interface IListiOSAppsCommandServices {
	$applePortalApplicationService: IApplePortalApplicationService;
	$applePortalSessionService: IApplePortalSessionService;
	$devicePlatformsConstants: Mobile.IDevicePlatformsConstants;
	$errors: IErrors;
	$logger: ILogger;
	$platformValidationService: IPlatformValidationService;
	$projectData: IProjectData;
	$prompter: IPrompter;
}

export function setupListiOSAppsCommand(): IListiOSAppsCommandServices {
	const services = {
		$applePortalApplicationService: inject<IApplePortalApplicationService>(
			"applePortalApplicationService",
		),
		$applePortalSessionService: inject<IApplePortalSessionService>(
			"applePortalSessionService",
		),
		$devicePlatformsConstants: inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$projectData: inject<IProjectData>("projectData"),
		$prompter: inject<IPrompter>("prompter"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function runListiOSAppsCommand(
	context: ListiOSAppsCommandContext,
	services: IListiOSAppsCommandServices,
): Promise<void> {
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

	let username = context.args[0];
	let password = context.args[1];

	if (!username) {
		username = await services.$prompter.getString("Apple ID", {
			allowEmpty: false,
		});
	}

	if (!password) {
		password = await services.$prompter.getPassword("Apple ID password");
	}

	const user = await services.$applePortalSessionService.createUserSession(
		{ username, password },
		{
			sessionBase64: context.options.appleSessionBase64,
		},
	);
	if (!user.areCredentialsValid) {
		services.$errors.fail(
			`Invalid username and password combination. Used '${username}' as the username.`,
		);
	}

	const applications =
		await services.$applePortalApplicationService.getApplications(user);

	if (!applications || !applications.length) {
		services.$logger.info("Seems you don't have any applications yet.");
	} else {
		const table: any = createTable(
			["Application Name", "Bundle Identifier", "In Flight Version"],
			applications.map((application) => {
				const version =
					(application &&
						application.versionSets &&
						application.versionSets.length &&
						application.versionSets[0].inFlightVersion &&
						application.versionSets[0].inFlightVersion.version) ||
					"";
				return [application.name, application.bundleId, version];
			}),
		);

		services.$logger.info(table.toString());
	}
}

export const listiOSAppsCommandDefinition = defineCommand({
	name: "appstore|*list",
	description: "Lists the applications in App Store Connect.",
	options: listiOSAppsCommandOptions,
	arguments: [{ name: "appleId" }, { name: "password" }],
	setup: setupListiOSAppsCommand,
	run: runListiOSAppsCommand,
});
