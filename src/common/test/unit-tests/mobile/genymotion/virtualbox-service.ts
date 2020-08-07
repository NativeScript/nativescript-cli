import { Yok } from "../../../../yok";
import { VirtualBoxService } from "../../../../mobile/android/genymotion/virtualbox-service";
import { assert } from "chai";

function createTestInjector() {
	const testInjector = new Yok();

	testInjector.register("childProcess", {
		trySpawnFromCloseEvent: () => ({})
	});
	testInjector.register("fs", {});
	testInjector.register("logger", {});
	testInjector.register("hostInfo", {});
	testInjector.register("virtualBoxService", VirtualBoxService);

	return testInjector;
}

describe("VirtualBoxService", () => {
	let injector: IInjector = null;
	let virtualBoxService: Mobile.IVirtualBoxService = null;

	beforeEach(() => {
		injector = createTestInjector();
		virtualBoxService = injector.resolve("virtualBoxService");
	});

	function mockData(opts: { isVirtualBoxInstalled: boolean, spawnOutput?: { stdout: string, stderr: string } }) {
		const fs = injector.resolve("fs");
		fs.exists = () => opts.isVirtualBoxInstalled;

		const childProcess = injector.resolve("childProcess");
		childProcess.trySpawnFromCloseEvent = () => opts.spawnOutput;
	}

	describe("listVms", () => {
		it("should return an empty array when virtualbox is not configured", async () => {
			mockData({isVirtualBoxInstalled: false});
			const output = await virtualBoxService.listVms();
			assert.deepEqual(output.vms, []);
			assert.isNull(output.error);
		});
		it("should return correctly virtual machines", async () => {
			mockData({isVirtualBoxInstalled: true, spawnOutput: { stdout: '"test" {4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211}', stderr: null }});
			const output = await virtualBoxService.listVms();
			assert.deepEqual(output.vms, [{id: "4a1bf7cd-a7b4-45ef-8cb0-c5a0aafad211", name: "test"}]);
			assert.isNull(output.error);
		});
		it("should return the error when some error is thrown", async () => {
			const error = "some error is thrown";
			mockData({isVirtualBoxInstalled: true, spawnOutput: { stdout: null, stderr: error}});
			const output = await virtualBoxService.listVms();
			assert.deepEqual(output.vms, []);
			assert.deepEqual(output.error, error);
		});
	});

	describe("enumerateGuestProperties", () => {
		it("should return null when virtualbox is not configured", async () => {
			mockData({isVirtualBoxInstalled: false, spawnOutput: { stdout: "", stderr: null }});
			const output = await virtualBoxService.enumerateGuestProperties("testId");
			assert.isNull(output.properties);
			assert.isNull(output.error);
		});
		it("should return the error when some error is thrown", async () => {
			const error = "some error";
			mockData({isVirtualBoxInstalled: true, spawnOutput: { stdout: null, stderr: error }});
			const output = await virtualBoxService.enumerateGuestProperties("testId");
			assert.isNull(output.properties);
			assert.deepEqual(output.error, error);
		});
	});
});
