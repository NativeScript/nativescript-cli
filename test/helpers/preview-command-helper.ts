import { Yok } from "../../lib/common/yok";
import { PreviewCommandHelper } from "../../lib/helpers/preview-command-helper";
import * as chai from "chai";

interface ITestCase {
	name: string;
	stdinData: string;
	qrCodeProperty?: string;
}

let qrCodesData: IDictionary<boolean> = {
	isGeneratedForAndroid: false,
	isGeneratedForiOS: false,
	isGeneratedForCurrentApp: false
};

function createTestInjector() {
	const injector = new Yok();
	injector.register("logger", {
		info: () => ({})
	});
	injector.register("playgroundQrCodeGenerator", {
		generateQrCodeForAndroid: async () => {
			qrCodesData.isGeneratedForAndroid = true;
		},
		generateQrCodeForiOS: async () => {
			qrCodesData.isGeneratedForiOS = true;
		},
		generateQrCodeForCurrentApp: async () => {
			qrCodesData.isGeneratedForCurrentApp = true;
		}
	});
	injector.register("processService", {
		attachToProcessExitSignals: () => ({})
	});
	injector.register("previewCommandHelper", PreviewCommandHelper);
	(<any>process.stdin).setRawMode = () => ({});
	return injector;
}

function arrange() {
	const injector = createTestInjector();
	const previewCommandHelper = injector.resolve("previewCommandHelper");
	return {
		previewCommandHelper
	};
}

function act(previewCommandHelper: IPreviewCommandHelper, sdtinStrToEmit: string): void {
	previewCommandHelper.run();
	process.stdin.emit("data", sdtinStrToEmit);
}

function assert(qrCodeProperty: string) {
	_.keys(qrCodesData).forEach(prop => {
		if (prop === qrCodeProperty) {
			chai.assert.isTrue(qrCodesData[prop]);
		} else {
			chai.assert.isFalse(qrCodesData[prop]);
		}
	});
}

function makeInteractive() {
	process.stdout.isTTY = true;
	process.stdin.isTTY = true;
}

function makeNonInteractive() {
	process.stdout.isTTY = false;
	process.stdin.isTTY = false;
}

function reset() {
	qrCodesData = {
		isGeneratedForAndroid: false,
		isGeneratedForiOS: false,
		isGeneratedForCurrentApp: false
	};
	process.stdin.removeAllListeners("data");
}

function execute(testCases: ITestCase[]) {
	testCases.forEach(testCase => {
		it(`${testCase.name}`, async () => {
			const { previewCommandHelper } = arrange();
			act(previewCommandHelper, testCase.stdinData);
			assert(testCase.qrCodeProperty);
		});
	});
}

describe("previewCommandHelper", () => {
	describe("when console is interactive", () => {
		beforeEach(() => {
			makeInteractive();
		});

		afterEach(() => {
			reset();
		});

		const testCases = [
			{
				name: "should generate qr code for android when a key is pressed",
				stdinData: "a",
				qrCodeProperty: "isGeneratedForAndroid",
			},
			{
				name: "should generate qr code for iOS when i key is pressed",
				stdinData: "i",
				qrCodeProperty: "isGeneratedForiOS",
			},
			{
				name: "should generate qr code for current app when q key is pressed",
				stdinData: "q",
				qrCodeProperty: "isGeneratedForCurrentApp",
			}
		];

		execute(testCases);
	});

	describe("when console is non interactive", () => {
		beforeEach(() => {
			makeNonInteractive();
		});

		afterEach(() => {
			reset();
		});

		const testCases = [
			{
				name: "should not generate qr code for android when a key is pressed",
				stdinData: "a"
			},
			{
				name: "should not generate qr code for iOS when i key is pressed",
				stdinData: "i"
			},
			{
				name: "should not generate qr code for current app when q key is pressed",
				stdinData: "q"
			}
		];

		execute(testCases);
	});
});
