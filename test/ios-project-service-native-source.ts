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

	describe("header search paths", () => {
		const prepare = async (rootPath: string): Promise<string[]> => {
			const searchPaths: string[] = [];
			const proto = <any>IOSProjectService.prototype;
			await proto.prepareNativeSourceCode.call(
				{
					$fs: new FileSystem(<any>{}),
					$logger: { warn: () => {} },
					getRootGroup: proto.getRootGroup,
					savePbxProj: () => {},
					createPbxProj: () => ({
						addPbxGroup: () => {},
						getFirstTarget: () => ({ uuid: "target" }),
						addToHeaderSearchPaths: (searchPath: string) =>
							searchPaths.push(searchPath),
					}),
				},
				"Native",
				rootPath,
				{ projectDir },
			);
			return searchPaths.map((searchPath) => fs.realpathSync(searchPath));
		};

		it("uses the folders of the headers a glob matches", async () => {
			const nested = path.join(sourcesDir, "nested");
			fs.mkdirSync(nested);
			fs.writeFileSync(path.join(nested, "One.h"), "");
			fs.writeFileSync(path.join(nested, "Two.h"), "");

			assert.deepEqual(await prepare("../../libs/native/**/*.{h,swift}"), [
				fs.realpathSync(nested),
			]);
		});

		it("adds nothing for a glob without headers", async () => {
			assert.deepEqual(await prepare("../../libs/native/*.swift"), []);
		});

		it("uses the folder itself, against the project", async () => {
			assert.deepEqual(await prepare("../../libs/native"), [
				fs.realpathSync(sourcesDir),
			]);
		});
	});
});
