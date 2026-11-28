import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FileSystem } from "../lib/common/file-system";
import { IOSProjectService } from "../lib/services/ios-project-service";

describe("iOSProjectService getRootGroup", () => {
	let root: string;
	let projectDir: string;
	let sourcesDir: string;
	let cwd: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "native-source-"));
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
		fs.rmSync(root, { recursive: true, force: true });
	});

	const getFiles = async (rootPath: string): Promise<string[]> => {
		const proto = <any>IOSProjectService.prototype;
		const { files } = await proto.getRootGroup.call(
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

	const prepare = async (rootPath: string) => {
		const groupPaths: string[] = [];
		const groupFiles: string[] = [];
		const searchPaths: string[] = [];
		const proto = <any>IOSProjectService.prototype;
		await proto.prepareNativeSourceCode.call(
			{
				$fs: new FileSystem(<any>{}),
				$logger: { warn: () => {} },
				getRootGroup: proto.getRootGroup,
				savePbxProj: () => {},
				createPbxProj: () => ({
					addPbxGroup: (files: string[], name: string, groupPath: string) => {
						groupPaths.push(groupPath);
						groupFiles.push(...files);
					},
					getFirstTarget: () => ({ uuid: "target" }),
					addToHeaderSearchPaths: (searchPath: string) =>
						searchPaths.push(searchPath),
				}),
			},
			"Native",
			rootPath,
			{ projectDir },
		);
		return {
			groupPaths,
			groupFiles: groupFiles.map((file) => fs.realpathSync(file)),
			searchPaths: searchPaths.map((searchPath) => fs.realpathSync(searchPath)),
		};
	};

	describe("pbxgroup", () => {
		[".", path.join("apps", "app")].forEach((workingDir) => {
			it(`keeps the configured folder as its key, run from ${workingDir}`, async () => {
				process.chdir(path.join(root, workingDir));

				const { groupPaths, groupFiles } = await prepare("../../libs/native");

				assert.deepEqual(groupPaths, ["../../libs/native"]);
				assert.deepEqual(groupFiles, [expectedSource()]);
			});
		});
	});

	describe("header search paths", () => {
		const searchPathsFor = async (rootPath: string) =>
			(await prepare(rootPath)).searchPaths;

		it("uses the folders of the headers a glob matches", async () => {
			const nested = path.join(sourcesDir, "nested");
			fs.mkdirSync(nested);
			fs.writeFileSync(path.join(nested, "One.h"), "");
			fs.writeFileSync(path.join(nested, "Two.h"), "");

			assert.deepEqual(
				await searchPathsFor("../../libs/native/**/*.{h,swift}"),
				[fs.realpathSync(nested)],
			);
		});

		it("adds nothing for a glob without headers", async () => {
			assert.deepEqual(await searchPathsFor("../../libs/native/*.swift"), []);
		});

		it("uses the folder itself, against the project", async () => {
			assert.deepEqual(await searchPathsFor("../../libs/native"), [
				fs.realpathSync(sourcesDir),
			]);
		});
	});
});
