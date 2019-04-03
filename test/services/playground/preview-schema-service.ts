import { Yok } from "../../../lib/common/yok";
import { PreviewSchemaService } from "../../../lib/services/livesync/playground/preview-schema-service";
import { PubnubKeys } from "../../../lib/services/livesync/playground/preview-app-constants";
import { assert } from "chai";

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("previewSchemaService", PreviewSchemaService);
	injector.register("projectDataService", () => ({}));
	injector.register("errors", () => ({}));

	return injector;
}

const nsPlaySchema = {
	name: 'nsplay',
	scannerAppId: 'org.nativescript.play',
	scannerAppStoreId: '1263543946',
	previewAppId: 'org.nativescript.preview',
	previewAppStoreId: '1264484702',
	msvKey: 'cli',
	publishKey: PubnubKeys.PUBLISH_KEY,
	subscribeKey: PubnubKeys.SUBSCRIBE_KEY,
	default: true
};

const ksPreviewSchema = {
	name: 'kspreview',
	scannerAppId: 'com.kinvey.scanner',
	scannerAppStoreId: '1458317125',
	previewAppId: 'com.kinvey.preview',
	previewAppStoreId: '1458502055',
	msvKey: 'kinveyStudio',
	publishKey: PubnubKeys.PUBLISH_KEY,
	subscribeKey: PubnubKeys.SUBSCRIBE_KEY
};

describe("PreviewSchemaService", () => {
	let injector: IInjector;
	let previewSchemaService: IPreviewSchemaService;

	beforeEach(() => {
		injector = createTestInjector();
		previewSchemaService = injector.resolve("previewSchemaService");
	});

	const testCases = [
		{
			name: "should return default nsplay schema when no previewAppSchema in nsconfig",
			previewAppSchema: <any>null,
			expectedSchema: nsPlaySchema
		},
		{
			name: "should return nsplay schema when { 'previewAppSchema': 'nsplay' } in nsconfig",
			previewAppSchema: "nsplay",
			expectedSchema: nsPlaySchema
		},
		{
			name: "should return kspreview schema when { 'previewAppSchema': 'kspreview' } in nsconfig",
			previewAppSchema: "kspreview",
			expectedSchema: ksPreviewSchema
		},
		{
			name: "should throw an error when invalid previewAppSchema is specified in nsconfig",
			previewAppSchema: "someInvalidSchema",
			expectedToThrow: true
		}
	];

	_.each(testCases, testCase => {
		it(`${testCase.name}`, () => {
			const projectDataService = injector.resolve("projectDataService");
			projectDataService.getProjectData = () => ({ previewAppSchema: testCase.previewAppSchema });

			let actualError = null;
			if (testCase.expectedToThrow) {
				const errors = injector.resolve("errors");
				errors.failWithoutHelp = (err: string) => actualError = err;
			}

			const schemaData = previewSchemaService.getSchemaData("someTestProjectDir");

			assert.deepEqual(schemaData, testCase.expectedSchema);
			if (testCase.expectedToThrow) {
				assert.isNotNull(actualError);
			}
		});
	});
});
