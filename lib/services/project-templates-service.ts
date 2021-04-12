import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { performanceLog } from "../common/decorators";
import {
	IProjectTemplatesService,
	ITemplateData,
	ITemplatePackageJsonContent,
} from "../definitions/project";
import {
	IPackageInstallationManager,
	INodePackageManager,
	IStaticConfig,
} from "../declarations";
import {
	IFileSystem,
	IAnalyticsService,
	IDictionary,
} from "../common/declarations";
import { injector } from "../common/yok";

export class ProjectTemplatesService implements IProjectTemplatesService {
	private templatePackageContents: IDictionary<any> = {};

	public constructor(
		private $analyticsService: IAnalyticsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pacoteService: IPacoteService,
		private $packageManager: INodePackageManager,
		private $staticConfig: IStaticConfig
	) {}

	@performanceLog()
	public async prepareTemplate(
		templateValue: string,
		projectDir: string
	): Promise<ITemplateData> {
		if (!templateValue) {
			templateValue = constants.RESERVED_TEMPLATE_NAMES["default"];
		}

		const templateNameParts = await this.$packageManager.getPackageNameParts(
			templateValue
		);
		templateValue =
			constants.RESERVED_TEMPLATE_NAMES[templateNameParts.name] ||
			templateNameParts.name;

		const version = await this.getDesiredVersion(
			templateValue,
			templateNameParts.version
		);

		const fullTemplateName = await this.$packageManager.getPackageFullName({
			name: templateValue,
			version: version,
		});

		const templatePackageJsonContent = await this.getTemplatePackageJsonContent(
			fullTemplateName
		);

		const templateNameToBeTracked = this.getTemplateNameToBeTracked(
			templateValue,
			templatePackageJsonContent
		);
		if (templateNameToBeTracked) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: constants.TrackActionNames.CreateProject,
				isForDevice: null,
				additionalData: templateNameToBeTracked,
			});

			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: constants.TrackActionNames.UsingTemplate,
				additionalData: templateNameToBeTracked,
			});
		}

		return {
			templateName: templateValue,
			templatePackageJsonContent,
			version,
		};
	}

	private async getTemplatePackageJsonContent(
		templateName: string
	): Promise<ITemplatePackageJsonContent> {
		if (!this.templatePackageContents[templateName]) {
			this.templatePackageContents[
				templateName
			] = await this.$pacoteService.manifest(templateName, {
				fullMetadata: true,
			});
		}

		return this.templatePackageContents[templateName];
	}

	private getTemplateNameToBeTracked(
		templateName: string,
		packageJsonContent: any
	): string {
		try {
			if (this.$fs.exists(templateName)) {
				const templateNameToBeTracked =
					(packageJsonContent && packageJsonContent.name) ||
					path.basename(templateName);
				return `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateNameToBeTracked}`;
			}

			return templateName;
		} catch (err) {
			this.$logger.trace(
				`Unable to get template name to be tracked, error is: ${err}`
			);
		}
	}

	private async getDesiredVersion(
		templateName: string,
		defaultVersion?: string
	) {
		if (defaultVersion) {
			return defaultVersion;
		}

		try {
			const cliMajorVersion = semver.parse(
				semver.coerce(this.$staticConfig.version)
			).major;
			return `^${cliMajorVersion}.0.0`;
		} catch (err) {
			return this.$packageInstallationManager.getLatestCompatibleVersionSafe(
				templateName
			);
		}
	}
}
injector.register("projectTemplatesService", ProjectTemplatesService);
