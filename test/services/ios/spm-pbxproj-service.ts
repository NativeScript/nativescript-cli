import { assert } from "chai";
import {
	mkdtempSync,
	mkdirSync,
	copyFileSync,
	readFileSync,
	writeFileSync,
} from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { Yok } from "../../../lib/common/yok";
import {
	SPMPbxprojService,
	classifyVersion,
} from "../../../lib/services/ios/spm-pbxproj-service";
import { FileSystem } from "../../../lib/common/file-system";
import { IInjector } from "../../../lib/common/definitions/yok";

// the target that exists in test/files/project.pbxproj
const TARGET_NAME = "TNSBlank";
// its PBXFrameworksBuildPhase uuid in that fixture (a group is also named
// "Frameworks", so tests that strip the phase must key on the uuid)
const FRAMEWORKS_PHASE_ID = "858B83F418CA22B800AB12DE";

const remotePackage: IosSPMPackage = {
	name: "swift-numerics",
	libs: ["RealModule", "ComplexModule"],
	repositoryURL: "https://github.com/apple/swift-numerics.git",
	version: "1.0.0",
};

const localPackage: IosSPMPackage = {
	name: "LocalPkg",
	libs: ["LocalPkg"],
	path: "vendor/LocalPkg",
};

let warnings: string[] = [];

function createTestInjector(): IInjector {
	const injector = new Yok();
	warnings = [];
	injector.register("fs", FileSystem);
	injector.register("logger", {
		warn: (message: string) => warnings.push(message),
		trace: (): void => undefined,
		debug: (): void => undefined,
	});
	injector.register("xcode", require("nativescript-dev-xcode"));
	injector.register("spmPbxprojService", SPMPbxprojService);
	return injector;
}

/** Creates a platform project root containing a copy of the fixture pbxproj. */
function createProjectRoot(): string {
	const projectRoot = mkdtempSync(path.join(tmpdir(), "spm-pbxproj-"));
	const xcodeprojPath = path.join(projectRoot, `${TARGET_NAME}.xcodeproj`);
	mkdirSync(xcodeprojPath);
	copyFileSync(
		path.join(__dirname, "..", "..", "files", "project.pbxproj"),
		path.join(xcodeprojPath, "project.pbxproj"),
	);
	return projectRoot;
}

function readPbxproj(projectRoot: string): string {
	return readFileSync(
		path.join(projectRoot, `${TARGET_NAME}.xcodeproj`, "project.pbxproj"),
		"utf8",
	);
}

function countOccurrences(contents: string, needle: string): number {
	return contents.split(needle).length - 1;
}

describe("SPMPbxprojService", () => {
	let service: ISPMPbxprojService;
	let projectRoot: string;

	beforeEach(() => {
		service = createTestInjector().resolve("spmPbxprojService");
		projectRoot = createProjectRoot();
	});

	describe("classifyVersion", () => {
		const testCases: Array<{
			version: string;
			expected: Record<string, string>;
		}> = [
			{
				version: "1.0.0",
				expected: { kind: "exactVersion", version: "1.0.0" },
			},
			{
				version: "^2.5.0",
				expected: { kind: "upToNextMajorVersion", minimumVersion: "2.5.0" },
			},
			{
				version: "~3.1.0",
				expected: { kind: "upToNextMinorVersion", minimumVersion: "3.1.0" },
			},
			{
				version: ">=1.2.0 <2.0.0",
				expected: {
					kind: "versionRange",
					minimumVersion: "1.2.0",
					maximumVersion: "2.0.0",
				},
			},
			{ version: "main", expected: { kind: "branch", branch: "main" } },
			{
				version: "#5f03bfdc8cb6300ef8355695a3d27d11ba19f6a3",
				expected: {
					kind: "revision",
					revision: "5f03bfdc8cb6300ef8355695a3d27d11ba19f6a3",
				},
			},
		];

		testCases.forEach(({ version, expected }) => {
			it(`maps "${version}" to ${expected.kind}`, () => {
				assert.deepEqual(classifyVersion(version), expected);
			});
		});
	});

	describe("addPackages", () => {
		it("writes a remote package reference and links each of its libs", () => {
			const result = service.addPackages(projectRoot, [
				{ targetName: TARGET_NAME, package: remotePackage },
			]);

			assert.isTrue(result);
			const contents = readPbxproj(projectRoot);

			// the package reference itself, listed on the project
			assert.include(
				contents,
				'XCRemoteSwiftPackageReference "swift-numerics"',
				"expected a remote package reference section entry",
			);
			assert.include(contents, "repositoryURL = ");
			assert.include(contents, "https://github.com/apple/swift-numerics.git");
			assert.include(contents, "kind = exactVersion");
			assert.include(contents, "packageReferences = (");

			// one product dependency + build file + Frameworks entry per lib
			for (const lib of remotePackage.libs) {
				assert.include(
					contents,
					`productName = ${lib}`,
					`expected a product dependency for ${lib}`,
				);
				assert.include(
					contents,
					`${lib} in Frameworks`,
					`expected ${lib} in the Frameworks build phase`,
				);
			}
			assert.include(contents, "packageProductDependencies = (");
		});

		it("writes a local package reference relative to the project root", () => {
			const absolutePackagePath = path.join(projectRoot, "vendor", "LocalPkg");
			const result = service.addPackages(projectRoot, [
				{
					targetName: TARGET_NAME,
					package: { ...localPackage, path: absolutePackagePath },
				},
			]);

			assert.isTrue(result);
			const contents = readPbxproj(projectRoot);

			assert.include(
				contents,
				'XCLocalSwiftPackageReference "vendor/LocalPkg"',
				"expected the local package to be recorded by relative path",
			);
			assert.include(contents, "relativePath = ");
			assert.notInclude(
				contents,
				absolutePackagePath,
				"the absolute path must not leak into the pbxproj",
			);
		});

		it("is idempotent — reapplying the same packages does not duplicate entries", () => {
			const assignments: IosSPMPackageAssignment[] = [
				{ targetName: TARGET_NAME, package: remotePackage },
			];

			assert.isTrue(service.addPackages(projectRoot, assignments));
			const afterFirst = readPbxproj(projectRoot);

			assert.isTrue(service.addPackages(projectRoot, assignments));
			const afterSecond = readPbxproj(projectRoot);

			assert.equal(
				afterSecond,
				afterFirst,
				"reapplying the same packages should leave the pbxproj byte-identical",
			);
			assert.equal(
				countOccurrences(
					afterSecond,
					'XCRemoteSwiftPackageReference "swift-numerics" */ = {',
				),
				1,
				"the package reference should be defined exactly once",
			);
			assert.equal(
				countOccurrences(afterSecond, "RealModule in Frameworks */ = {"),
				1,
				"the build file should be defined exactly once",
			);
		});

		it("updates an existing package reference in place when the version changes", () => {
			assert.isTrue(
				service.addPackages(projectRoot, [
					{ targetName: TARGET_NAME, package: remotePackage },
				]),
			);
			assert.isTrue(
				service.addPackages(projectRoot, [
					{
						targetName: TARGET_NAME,
						package: { ...remotePackage, version: "2.0.0" },
					},
				]),
			);

			const contents = readPbxproj(projectRoot);
			assert.equal(
				countOccurrences(
					contents,
					'XCRemoteSwiftPackageReference "swift-numerics" */ = {',
				),
				1,
				"the package should still be defined exactly once",
			);
			assert.include(contents, "version = 2.0.0");
			assert.notInclude(contents, "version = 1.0.0");
		});

		it("skips a target without a Frameworks build phase, warns, and writes nothing", () => {
			// strip the Frameworks build phase from the fixture target — both the
			// section entry and its slot in the target's buildPhases
			const pbxPath = path.join(
				projectRoot,
				`${TARGET_NAME}.xcodeproj`,
				"project.pbxproj",
			);
			const stripped = readFileSync(pbxPath, "utf8")
				.replace(
					new RegExp(
						`^\\s*${FRAMEWORKS_PHASE_ID} /\\* Frameworks \\*/,\\n`,
						"m",
					),
					"",
				)
				.replace(
					new RegExp(
						`^\\s*${FRAMEWORKS_PHASE_ID} /\\* Frameworks \\*/ = \\{[\\s\\S]*?\\};\\n`,
						"m",
					),
					"",
				);
			writeFileSync(pbxPath, stripped);

			const result = service.addPackages(projectRoot, [
				{ targetName: TARGET_NAME, package: remotePackage },
			]);

			assert.isFalse(
				result,
				"nothing could be applied, so nothing was written",
			);
			assert.isTrue(
				warnings.some((w) => w.includes("no Frameworks build phase")),
				`expected a warning about the missing build phase, got: ${warnings}`,
			);
			const contents = readPbxproj(projectRoot);
			assert.notInclude(contents, "XCRemoteSwiftPackageReference");
			assert.notInclude(
				contents,
				"packageReferences",
				"the skipped package must leave no trace, not even an empty list",
			);
		});

		it("keeps same-named products from different packages distinct", () => {
			const otherPackage: IosSPMPackage = {
				name: "other-numerics",
				libs: ["RealModule"],
				repositoryURL: "https://example.com/other/other-numerics.git",
				version: "2.0.0",
			};
			const assignments: IosSPMPackageAssignment[] = [
				{ targetName: TARGET_NAME, package: remotePackage },
				{ targetName: TARGET_NAME, package: otherPackage },
			];

			assert.isTrue(service.addPackages(projectRoot, assignments));
			// reapply to prove the scoped lookup is still idempotent
			assert.isTrue(service.addPackages(projectRoot, assignments));

			const xcode = require("nativescript-dev-xcode");
			const project = new xcode.project(
				path.join(projectRoot, `${TARGET_NAME}.xcodeproj`, "project.pbxproj"),
			);
			project.parseSync();
			const section =
				project.hash.project.objects["XCSwiftPackageProductDependency"];
			const realModuleDeps = Object.keys(section)
				.filter((key) => !key.endsWith("_comment"))
				.map((key) => section[key])
				.filter((entry) => entry.productName === "RealModule");

			assert.equal(
				realModuleDeps.length,
				2,
				"each package should own its own RealModule product dependency",
			);
			assert.equal(
				new Set(realModuleDeps.map((entry) => entry.package)).size,
				2,
				"the two product dependencies should point at different packages",
			);
		});

		it("quotes requirement values a pbxproj cannot hold bare", () => {
			assert.isTrue(
				service.addPackages(projectRoot, [
					{
						targetName: TARGET_NAME,
						package: { ...remotePackage, version: "1.0.0-beta.1" },
					},
				]),
			);

			assert.include(readPbxproj(projectRoot), 'version = "1.0.0-beta.1";');
		});

		it("quotes branch requirements containing spaces", () => {
			assert.isTrue(
				service.addPackages(projectRoot, [
					{
						targetName: TARGET_NAME,
						package: { ...remotePackage, version: "release 1.0" },
					},
				]),
			);

			assert.include(readPbxproj(projectRoot), 'branch = "release 1.0";');
		});

		it("skips a package whose target is missing, and warns", () => {
			const result = service.addPackages(projectRoot, [
				{ targetName: "NoSuchTarget", package: remotePackage },
			]);

			assert.isFalse(
				result,
				"nothing could be applied, so nothing was written",
			);
			assert.isTrue(
				warnings.some((w) => w.includes("NoSuchTarget")),
				`expected a warning naming the missing target, got: ${warnings}`,
			);
			assert.notInclude(
				readPbxproj(projectRoot),
				"XCRemoteSwiftPackageReference",
			);
		});

		it("still applies packages for targets that do exist when another is missing", () => {
			const result = service.addPackages(projectRoot, [
				{ targetName: "NoSuchTarget", package: localPackage },
				{ targetName: TARGET_NAME, package: remotePackage },
			]);

			assert.isTrue(result);
			const contents = readPbxproj(projectRoot);
			assert.include(
				contents,
				'XCRemoteSwiftPackageReference "swift-numerics"',
			);
			assert.notInclude(contents, "XCLocalSwiftPackageReference");
		});

		it("returns false when there are no packages to apply", () => {
			assert.isFalse(service.addPackages(projectRoot, []));
		});

		it("returns false when the project root has no .xcodeproj", () => {
			const emptyRoot = mkdtempSync(path.join(tmpdir(), "spm-empty-"));
			assert.isFalse(
				service.addPackages(emptyRoot, [
					{ targetName: TARGET_NAME, package: remotePackage },
				]),
			);
		});

		it("returns false when the project root does not exist", () => {
			assert.isFalse(
				service.addPackages(path.join(tmpdir(), "spm-does-not-exist"), [
					{ targetName: TARGET_NAME, package: remotePackage },
				]),
			);
		});
	});
});
