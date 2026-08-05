import { assert } from "chai";
describe("config.json", () => {
	const expectedData = {
		DEBUG: false,
		TYPESCRIPT_COMPILER_OPTIONS: {},
		ANDROID_DEBUG_UI_MAC: "Google Chrome",
		USE_POD_SANDBOX: false,
		DISABLE_HOOKS: false,
		// a checkout reports nothing; scripts/set-ga-id.js fills these in dist/
		GA_MEASUREMENT_ID: "",
		GA_API_SECRET: "",
	};

	it("validates content is correct", () => {
		const data = require("../../config/config.json");
		assert.deepStrictEqual(
			data,
			expectedData,
			"Data in config.json is not correct. Is this expected?",
		);
	});
});
