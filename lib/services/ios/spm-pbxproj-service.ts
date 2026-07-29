import * as path from "path";
import * as semver from "semver";
import { injector } from "../../common/yok";
import { IFileSystem } from "../../common/declarations";

/**
 * Writes Swift Package references directly into an Xcode project's pbxproj.
 *
 * Adding a Swift package to a target means touching four places in the
 * pbxproj, which is why this is not a one-liner:
 *
 *   1. an `XCRemoteSwiftPackageReference` / `XCLocalSwiftPackageReference`
 *      object describing *where* the package comes from, listed in the
 *      project's `packageReferences`;
 *   2. an `XCSwiftPackageProductDependency` per linked product (lib);
 *   3. a `PBXBuildFile` wrapping each product dependency;
 *   4. an entry in the target's Frameworks build phase, plus the target's
 *      `packageProductDependencies`.
 *
 * Every entry is keyed by its pbxproj comment (e.g. `XCRemoteSwiftPackageReference
 * "Auth0"`), and an existing entry is updated in place rather than duplicated —
 * so applying the same set of packages repeatedly (which the CLI does on every
 * prepare) is idempotent and doesn't grow the pbxproj.
 */
export class SPMPbxprojService implements ISPMPbxprojService {
	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $xcode: IXcode,
	) {}

	/**
	 * Adds each package to its target in a single parse/write cycle.
	 *
	 * Returns true when the pbxproj was written. Missing targets are warned
	 * about and skipped rather than failing the whole batch — a package meant
	 * for a widget target shouldn't stop the app's own packages from applying.
	 */
	public addPackages(
		projectRoot: string,
		assignments: IosSPMPackageAssignment[],
	): boolean {
		if (!assignments.length) {
			return false;
		}

		const pbxProjPath = this.findPbxProjPath(projectRoot);
		if (!pbxProjPath) {
			this.$logger.trace(
				`SPM: no Xcode project found under ${projectRoot}; skipping.`,
			);
			return false;
		}

		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();

		let added = false;
		for (const { targetName, package: pkg } of assignments) {
			const targetId = this.findTargetId(project, targetName);
			if (!targetId) {
				this.$logger.warn(
					`SPM: target "${targetName}" not found in ${path.basename(pbxProjPath)} — skipping package "${pkg.name}".`,
				);
				continue;
			}

			this.addPackageToTarget(project, targetId, pkg, projectRoot);
			added = true;
		}

		if (!added) {
			return false;
		}

		this.$fs.writeFile(
			pbxProjPath,
			project.writeSync({ omitEmptyValues: true }),
		);
		return true;
	}

	/**
	 * Locates `<name>.xcodeproj/project.pbxproj` under the platform project
	 * root. The project is named after the app, so it's discovered rather than
	 * assumed.
	 */
	private findPbxProjPath(projectRoot: string): string | null {
		if (!this.$fs.exists(projectRoot)) {
			return null;
		}

		const xcodeprojName = this.$fs
			.readDirectory(projectRoot)
			.find((entry) => entry.endsWith(".xcodeproj"));
		if (!xcodeprojName) {
			return null;
		}

		const pbxProjPath = path.join(
			projectRoot,
			xcodeprojName,
			"project.pbxproj",
		);
		return this.$fs.exists(pbxProjPath) ? pbxProjPath : null;
	}

	/**
	 * Resolves a target name to its pbxproj uuid. Target names in the pbxproj
	 * are quoted when they contain spaces, so both forms are matched.
	 */
	private findTargetId(project: any, targetName: string): string | null {
		const targets = project.pbxNativeTargetSection() ?? {};
		for (const key of Object.keys(targets)) {
			if (key.endsWith("_comment")) {
				continue;
			}
			const name = targets[key]?.name;
			if (name === targetName || name === `"${targetName}"`) {
				return key;
			}
		}
		return null;
	}

	private addPackageToTarget(
		project: any,
		targetId: string,
		pkg: IosSPMPackage,
		projectRoot: string,
	): void {
		const target = project.pbxNativeTargetSection()[targetId];
		const firstProject = project.getFirstProject().firstProject;
		const packageReferences: any[] = (firstProject["packageReferences"] ??= []);
		const packageProductReferences: any[] = (target[
			"packageProductDependencies"
		] ??= []);

		// A target without a Frameworks build phase has nowhere to link the
		// products; adding the package reference alone would leave the project
		// in a state Xcode reports as corrupt, so bail out loudly instead.
		const frameworkBuildPhaseObj = project.pbxFrameworksBuildPhaseObj(targetId);
		if (!frameworkBuildPhaseObj) {
			this.$logger.warn(
				`SPM: target for package "${pkg.name}" has no Frameworks build phase — skipping.`,
			);
			return;
		}
		const frameworkBuildPhaseFiles: any[] = (frameworkBuildPhaseObj["files"] ??=
			[]);

		let packageReferenceComment: string;
		let packageReferenceSection: string;
		let packageReferenceSectionContent: Record<string, any>;

		if ("path" in pkg) {
			// local package — Xcode stores the location relative to the project
			const relativePath = path.relative(
				projectRoot,
				path.resolve(projectRoot, pkg.path),
			);
			packageReferenceComment = `XCLocalSwiftPackageReference "${relativePath}"`;
			packageReferenceSection = "XCLocalSwiftPackageReference";
			packageReferenceSectionContent = {
				isa: packageReferenceSection,
				relativePath: JSON.stringify(relativePath),
			};
		} else {
			packageReferenceComment = `XCRemoteSwiftPackageReference "${pkg.name}"`;
			packageReferenceSection = "XCRemoteSwiftPackageReference";
			packageReferenceSectionContent = {
				isa: packageReferenceSection,
				repositoryURL: JSON.stringify(pkg.repositoryURL),
				requirement: classifyVersion(pkg.version),
			};
		}

		const {
			uuid: spmPackageReferenceUUID,
			comment: spmPackageReferenceComment,
		} = this.addOrUpdateEntry(
			project,
			packageReferenceSection,
			packageReferenceComment,
			packageReferenceSectionContent,
		);

		this.addOrUpdateArrayEntry(packageReferences, spmPackageReferenceUUID, {
			value: spmPackageReferenceUUID,
			comment: packageReferenceComment,
		});

		for (const lib of pkg.libs ?? []) {
			const { uuid: spmProductDependencyUUID } = this.addOrUpdateEntry(
				project,
				"XCSwiftPackageProductDependency",
				lib,
				{
					isa: "XCSwiftPackageProductDependency",
					package: spmPackageReferenceUUID,
					package_comment: spmPackageReferenceComment,
					productName: lib,
				},
			);

			const libComment = `${lib} in Frameworks`;

			const { uuid: spmBuildFileUuid } = this.addOrUpdateEntry(
				project,
				"PBXBuildFile",
				libComment,
				{
					isa: "PBXBuildFile",
					productRef: spmProductDependencyUUID,
					productRef_comment: lib,
				},
			);

			this.addOrUpdateArrayEntry(
				packageProductReferences,
				spmProductDependencyUUID,
				{
					value: spmProductDependencyUUID,
					comment: lib,
				},
			);

			this.addOrUpdateArrayEntry(frameworkBuildPhaseFiles, spmBuildFileUuid, {
				value: spmBuildFileUuid,
				comment: libComment,
			});
		}
	}

	/** Replaces a matching array entry in place, or appends it. */
	private addOrUpdateArrayEntry(
		array: any[],
		lookupValue: string,
		value: any,
	): void {
		const existing = array.find((entry) => entry.value === lookupValue);
		if (existing) {
			Object.assign(existing, value);
			return;
		}
		array.push(value);
	}

	/**
	 * Writes an object into a pbxproj section, reusing the uuid of an entry
	 * with the same comment when one is already present. The comment is the
	 * identity of an entry here — it's what keeps repeated applies idempotent.
	 */
	private addOrUpdateEntry(
		project: any,
		section: string,
		entryComment: string,
		entry: any,
	): { uuid: string; comment: string } {
		const pbxSection = (project.hash.project.objects[section] ??= {});
		const entryUuid =
			this.findUuidByComment(project, section, entryComment) ??
			project.generateUuid();

		pbxSection[`${entryUuid}_comment`] = entryComment;
		pbxSection[entryUuid] = entry;

		return { uuid: entryUuid, comment: entryComment };
	}

	private findUuidByComment(
		project: any,
		section: string,
		comment: string,
	): string | null {
		const pbxSection = project.hash.project.objects[section] ?? {};
		const commentKey = Object.keys(pbxSection).find(
			(key) => key.endsWith("_comment") && pbxSection[key] === comment,
		);
		return commentKey ? commentKey.replace(/_comment$/, "") : null;
	}
}

/**
 * Maps a package version string to the `requirement` object Xcode expects:
 *
 *   "1.0.0"           -> { kind: exactVersion, version }
 *   "^1.0.0"          -> { kind: upToNextMajorVersion, minimumVersion }
 *   "~1.0.0"          -> { kind: upToNextMinorVersion, minimumVersion }
 *   ">=1.0.0 <2.0.0"  -> { kind: versionRange, minimumVersion, maximumVersion }
 *   "#<sha>"          -> { kind: revision, revision }
 *   anything else     -> { kind: branch, branch }
 *
 * A non-semver value is treated as a branch name, which is how a package can
 * be pinned to e.g. "main".
 */
export function classifyVersion(version: string): Record<string, string> {
	if (version.startsWith("#")) {
		return {
			kind: "revision",
			revision: version.replace("#", ""),
		};
	}

	if (semver.valid(version)) {
		return {
			kind: "exactVersion",
			version,
		};
	}

	const range = semver.validRange(version);
	if (range) {
		const minimumVersion = semver.minVersion(range)?.version;
		if (version.startsWith("^")) {
			return {
				kind: "upToNextMajorVersion",
				minimumVersion,
			};
		}
		if (version.startsWith("~")) {
			return {
				kind: "upToNextMinorVersion",
				minimumVersion,
			};
		}

		const maximumVersion = semver.coerce(
			version.replace(minimumVersion ?? "", ""),
		)?.version;

		if (maximumVersion && maximumVersion !== minimumVersion) {
			return {
				kind: "versionRange",
				minimumVersion,
				maximumVersion,
			};
		}

		return {
			kind: "upToNextMajorVersion",
			minimumVersion,
		};
	}

	return {
		kind: "branch",
		branch: version,
	};
}

injector.register("spmPbxprojService", SPMPbxprojService);
