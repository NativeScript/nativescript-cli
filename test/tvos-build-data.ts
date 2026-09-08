import { assert } from "chai";
import { IOSBuildData } from "../lib/data/build-data";

describe("tvOS distribution build data", () => {
	it("turns the parsed --for-appstore flag into a device distribution build", () => {
		const build = new IOSBuildData("/review", "tvos", {
			forAppstore: true,
			release: true,
		});
		assert.isTrue(build.buildForAppStore);
		assert.isTrue(build.buildForDevice);
		assert.isTrue(build.release);
	});
	it("preserves simulator builds without distribution flags", () => {
		const build = new IOSBuildData("/review", "tvos", { emulator: true });
		assert.isNotTrue(build.buildForAppStore);
		assert.isNotTrue(build.buildForDevice);
	});
});
