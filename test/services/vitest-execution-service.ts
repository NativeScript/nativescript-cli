import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { VitestExecutionService } from "../../lib/services/vitest-execution-service";
import { IProjectData } from "../../lib/definitions/project";

const WATCH_WARNING =
	"'--watch' is not supported for on-device Vitest runs yet; running once.";

describe("vitestExecutionService", () => {
	let projectDir: string;
	let warnings: string[];
	let originalArgv: string[];

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-vitest-"));
		const vitestDir = path.join(projectDir, "node_modules", "vitest");
		fs.mkdirSync(vitestDir, { recursive: true });
		fs.writeFileSync(
			path.join(vitestDir, "package.json"),
			JSON.stringify({ name: "vitest", version: "0.0.0" }),
		);
		warnings = [];
		originalArgv = process.argv;
	});

	afterEach(() => {
		process.argv = originalArgv;
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	const startTestRun = async (
		argv: string[],
		options: { watch: boolean },
	): Promise<void> => {
		process.argv = ["node", "ns", "test", "ios", ...argv];
		const service = new VitestExecutionService(
			<any>{
				spawnFromEvent: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
			},
			<any>{
				fail: (message: string): never => {
					throw new Error(message);
				},
			},
			<any>{},
			<any>{ warn: (message: string) => warnings.push(message) },
			<any>options,
		);
		await service.startTestRun("iOS", <IProjectData>{ projectDir });
	};

	describe("--watch warning", () => {
		it("is not shown when watch is only on by default", async () => {
			await startTestRun([], { watch: true });
			assert.notInclude(warnings, WATCH_WARNING);
		});

		it("is shown when --watch is passed explicitly", async () => {
			await startTestRun(["--watch"], { watch: true });
			assert.include(warnings, WATCH_WARNING);
		});

		it("is not shown when --no-watch is passed", async () => {
			await startTestRun(["--no-watch"], { watch: false });
			assert.notInclude(warnings, WATCH_WARNING);
		});
	});
});
