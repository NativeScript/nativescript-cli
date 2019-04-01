import { PubnubKeys } from "./preview-app-constants";

export class PreviewSchemaService implements IPreviewSchemaService {
	private previewSchemas: IDictionary<IPreviewSchemaData> = {
		"nsplay": {
			name: "nsplay",
			previewAppId: "org.nativescript.preview",
			scannerAppId: "org.nativescript.play",
			msvKey: "cli",
			publishKey: PubnubKeys.PUBLISH_KEY,
			subscribeKey: PubnubKeys.SUBSCRIBE_KEY,
			default: true
		},
		"ksplay": {
			name: "ksplay",
			previewAppId: "com.kinvey.preview",
			scannerAppId: "com.kinvey.scanner",
			msvKey: "kinveyStudio",
			publishKey: PubnubKeys.PUBLISH_KEY,
			subscribeKey: PubnubKeys.SUBSCRIBE_KEY
		}
	};

	constructor(private $errors: IErrors,
		private $projectDataService: IProjectDataService) { }

	public getSchemaData(projectDir: string): IPreviewSchemaData {
		const projectData = this.$projectDataService.getProjectData(projectDir);

		let schemaName = projectData.previewAppSchema;
		if (!schemaName) {
			schemaName = _.findKey(this.previewSchemas, previewSchema => previewSchema.default);
		}

		const result = this.previewSchemas[schemaName];
		if (!result) {
			this.$errors.failWithoutHelp(`Invalid schema. The valid schemas are ${_.keys(this.previewSchemas)}.`);
		}

		return result;
	}
}
$injector.register("previewSchemaService", PreviewSchemaService);
