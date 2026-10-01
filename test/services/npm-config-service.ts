import { assert } from "chai";
import * as sinon from "sinon";
import * as childProcess from "child_process";
import { NpmConfigService } from "../../lib/services/npm-config-service";

describe("npmConfigService", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	const getConfigFor = (npmConfig: Record<string, any>) => {
		sandbox
			.stub(childProcess, "execSync")
			.returns(Buffer.from(JSON.stringify(npmConfig)));
		return new NpmConfigService().getConfig();
	};

	it("converts `before` to a Date", () => {
		const iso = "2026-09-30T01:51:31.276Z";
		const config = getConfigFor({ before: iso, "min-release-age": null });

		assert.instanceOf(config.before, Date);
		assert.equal(config.before.toISOString(), iso);
	});

	it("drops an unparseable `before`", () => {
		const config = getConfigFor({ before: "not a date" });

		assert.isNull(config.before);
	});

	it("leaves a null `before` untouched", () => {
		const config = getConfigFor({ before: null });

		assert.isNull(config.before);
	});

	it("substitutes ${ENV} references in string values", () => {
		process.env.NS_NPM_CONFIG_TEST_TOKEN = "secret";
		try {
			const config = getConfigFor({
				"//registry.npmjs.org/:_authToken": "${NS_NPM_CONFIG_TEST_TOKEN}",
			});

			assert.equal(config["//registry.npmjs.org/:_authToken"], "secret");
		} finally {
			delete process.env.NS_NPM_CONFIG_TEST_TOKEN;
		}
	});
});
