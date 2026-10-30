import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FileSystem } from "../lib/common/file-system";
import { IOSProjectService } from "../lib/services/ios-project-service";

describe("iOSProjectService getRootGroup", () => {
	let projectDir: string;
	let sourcesDir: string;
	let cwd: string;

	beforeEach(() => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "native-source-"));
		projectDir = path.join(root, "apps", "app");
		sourcesDir = path.join(root, "libs", "native");
		fs.mkdirSync(projectDir, { recursive: true });
		fs.mkdirSync(sourcesDir, { recursive: true });
		fs.writeFileSync(path.join(sourcesDir, "Source.swift"), "");
		cwd = process.cwd();
		process.chdir(root);
	});

	afterEach(() => {
		process.chdir(cwd);
	});

	const getFiles = async (rootPath: string): Promise<string[]> => {
		const { files } = await (<any>IOSProjectService.prototype).getRootGroup.call(
			{ $fs: new FileSystem(<any>{}) },
			"Native",
			rootPath,
			projectDir,
		);
		return files.map((file: string) => fs.realpathSync(file));
	};

	const expectedSource = () =>
		fs.realpathSync(path.join(sourcesDir, "Source.swift"));

	it("resolves a glob against the project, not the working directory", async () => {
		assert.deepEqual(await getFiles("../../libs/native/*.swift"), [
			expectedSource(),
		]);
	});

	it("resolves a folder against the project, not the working directory", async () => {
		assert.deepEqual(await getFiles("../../libs/native"), [expectedSource()]);
	});
});
