import { assert } from "chai";
describe("config.json", () => {
	const expectedData = {
		"DEBUG": false,
		"TYPESCRIPT_COMPILER_OPTIONS": {},
		"ANDROID_DEBUG_UI_MAC": "Google Chrome",
		"USE_POD_SANDBOX": false,
		"DISABLE_HOOKS": false,
		"UPLOAD_PLAYGROUND_FILES_ENDPOINT": "https://play.nativescript.org/api/files",
		"SHORTEN_URL_ENDPOINT": "https://play.nativescript.org/api/shortenurl?longUrl=%s",
		"INSIGHTS_URL_ENDPOINT": "https://play-server.nativescript.org/api/insights?ipAddress=%s",
		"WHOAMI_URL_ENDPOINT": "https://play.nativescript.org/api/whoami",
		"PREVIEW_APP_ENVIRONMENT": "live",
		"GA_TRACKING_ID": "UA-111455-51"
	};

	it("validates content is correct", () => {
		const data = require("../../config/config.json");
		assert.deepEqual(data, expectedData, "Data in config.json is not correct. Is this expected?");
	});
});
