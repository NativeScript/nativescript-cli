import { assert } from "chai";
import * as path from "path";
import { Yok } from "../../lib/common/yok";
import { ProjectCleanupService } from "../../lib/services/project-cleanup-service";
import { IInjector } from "../../lib/common/definitions/yok";

const projectDir = path.join("/tmp", "nsm-cleanup-project");

function createTestInjector(deletedPaths: string[]): IInjector {
	const testInjector = new Yok();
	testInjector.register("fs", {
		exists: (p: string) => !deletedPaths.includes(p),
		getFsStats: () => ({ isDirectory: () => true }),
		getSize: () => 0,
		deleteDirectorySafe: (p: string) => deletedPaths.push(p),
		deleteFile: (p: string) => deletedPaths.push(p),
	});
	testInjector.register("logger", {
		trace: (): void => undefined,
		warn: (): void => undefined,
		info: (): void => undefined,
	});
	testInjector.register("projectHelper", { projectDir });
	testInjector.register("terminalSpinnerService", {
		createSpinner: () => ({
			clear: (): void => undefined,
			start: (): void => undefined,
			stop: (): void => undefined,
			succeed: (): void => undefined,
			fail: (): void => undefined,
			text: "",
		}),
	});

	return testInjector;
}

describe("projectCleanupService", () => {
	let deletedPaths: string[];
	let service: ProjectCleanupService;

	beforeEach(() => {
		deletedPaths = [];
		service = createTestInjector(deletedPaths).resolve(ProjectCleanupService);
	});

	it("cleans a path inside the project", async () => {
		const result = await service.clean(["platforms"], { silent: true });

		assert.isTrue(result.ok);
		assert.deepStrictEqual(deletedPaths, [path.join(projectDir, "platforms")]);
	});

	it("refuses a path that escapes the project directory", async () => {
		const result = await service.clean(["../sibling"], { silent: true });

		assert.isFalse(result.ok);
		assert.deepStrictEqual(deletedPaths, []);
	});

	it("refuses an absolute path outside the project directory", async () => {
		const result = await service.clean([path.join("/tmp", "elsewhere")], {
			silent: true,
		});

		assert.isFalse(result.ok);
		assert.deepStrictEqual(deletedPaths, []);
	});

	it("allows an absolute path that resolves inside the project", async () => {
		const result = await service.clean([path.join(projectDir, "platforms")], {
			silent: true,
		});

		assert.isTrue(result.ok);
		assert.deepStrictEqual(deletedPaths, [path.join(projectDir, "platforms")]);
	});
});
