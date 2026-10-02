import { assert } from "chai";
import { isOpeningExternallyDisabled } from "../lib/common/opener";

describe("opener", () => {
	const saved = {
		NS_NO_OPEN: process.env.NS_NO_OPEN,
		CI: process.env.CI,
		JENKINS_HOME: process.env.JENKINS_HOME,
	};

	const setEnv = (values: { [key: string]: string }) => {
		for (const key of Object.keys(saved)) {
			delete process.env[key];
		}

		for (const key of Object.keys(values)) {
			process.env[key] = values[key];
		}
	};

	afterEach(() => {
		for (const key of Object.keys(saved)) {
			const value = (<any>saved)[key];
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	});

	it("is disabled while the test suite runs", () => {
		assert.isTrue(isOpeningExternallyDisabled());
	});

	it("is disabled on CI without any flag", () => {
		setEnv({ CI: "true" });
		assert.isTrue(isOpeningExternallyDisabled());
	});

	it("is enabled on a developer machine", () => {
		setEnv({});
		assert.isFalse(isOpeningExternallyDisabled());
	});

	it("lets the flag turn opening back on, even on CI", () => {
		setEnv({ CI: "true", NS_NO_OPEN: "0" });
		assert.isFalse(isOpeningExternallyDisabled());
	});

	it("treats any other flag value as disabling", () => {
		setEnv({ NS_NO_OPEN: "1" });
		assert.isTrue(isOpeningExternallyDisabled());
	});
});
