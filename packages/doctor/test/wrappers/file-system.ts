import { tmpdir } from "os";
import { assert } from "chai";
import * as rimraf from "rimraf";

import { FileSystem } from "../../src/wrappers/file-system";

describe("FileSystem", () => {
	describe("extractZip", () => {
		const d = new Date();
		const datetime = [
			d.getFullYear(),
			d.getMonth() + 1,
			d.getDate(),
			d.getHours(),
			d.getMinutes(),
			d.getSeconds(),
			d.getMilliseconds(),
		].join("");
		const tmpDir = `${tmpdir()}/${datetime}`;
		const testFilePath = `${__dirname}/example.zip`;
		const filesThatNeedToExist = [
			`${tmpDir}/test/android-local-build-requirements.ts`,
			`${tmpDir}/test/android-tools-info.ts`,
			`${tmpDir}/test/ios-local-build-requirements.ts`,
			`${tmpDir}/test/sys-info.ts`,
			`${tmpDir}/test/wrappers/file-system.ts`,
		];

		it("should extract in example zip archive in tmp folder", (done) => {
			const fs = new FileSystem();

			fs.extractZip(testFilePath, tmpDir)
				.then(() => {
					const allExists = filesThatNeedToExist
						.map(fs.exists)
						.reduce((acc, r) => acc && r, true);

					assert.isTrue(allExists);

					done();
				})
				.catch((e) => done(e));
		});

		afterEach((done) => rimraf(tmpDir, done));
	});
});
