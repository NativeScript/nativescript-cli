import {
	Command,
	CommandOptionsSchema,
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

export class ListiOSAppsCommand extends Command({
	name: "appstore|*list",
	description: "Lists the applications in App Store Connect.",
	options: listiOSAppsCommandOptions,
	arguments: [{ name: "appleId" }, { name: "password" }],
}) {
	private $applePortalApplicationService =
		inject<IApplePortalApplicationService>("applePortalApplicationService");
	private $applePortalSessionService = inject<IApplePortalSessionService>(
		"applePortalSessionService",
	);
	private $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
		"devicePlatformsConstants",
	);
	private $logger = inject<ILogger>("logger");
	private $platformValidationService = inject<IPlatformValidationService>(
		"platformValidationService",
	);
	private $projectData = inject<IProjectData>("projectData");
	private $prompter = inject<IPrompter>("prompter");

	constructor() {
		super();
		this.$projectData.initializeProjectData();
	}

	public async run(): Promise<void> {
		if (
			!this.$platformValidationService.isPlatformSupportedForOS(
				this.$devicePlatformsConstants.iOS,
				this.$projectData,
			)
		) {
			this.context.fail(
				`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`,
				{ help: false },
			);
		}

		let username = this.args[0];
		let password = this.args[1];

		if (!username) {
			username = await this.$prompter.getString("Apple ID", {
				allowEmpty: false,
			});
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		const user = await this.$applePortalSessionService.createUserSession(
			{ username, password },
			{
				sessionBase64: this.options.appleSessionBase64,
			},
		);
		if (!user.areCredentialsValid) {
			this.context.fail(
				`Invalid username and password combination. Used '${username}' as the username.`,
				{ help: false },
			);
		}

		const applications =
			await this.$applePortalApplicationService.getApplications(user);

		if (!applications || !applications.length) {
			this.$logger.info("Seems you don't have any applications yet.");
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

			this.$logger.info(table.toString());
		}
	}
}
