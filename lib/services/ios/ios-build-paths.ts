import * as path from "path";
import * as constants from "../../constants";

export const DERIVED_DATA_RELATIVE_PATH = path.join(
	constants.BUILD_DIR,
	"DerivedData",
);

/**
 * With a workspace-relative DerivedData location, Xcode appends the workspace
 * name to it, so this matches what Xcode uses and lets CLI and Xcode builds
 * share one cache.
 */
export const getDerivedDataPath = (
	projectRoot: string,
	projectName: string,
): string => path.join(projectRoot, DERIVED_DATA_RELATIVE_PATH, projectName);

/**
 * Lives next to the platform folder rather than in it, so regenerating
 * platforms/ios still reuses unchanged compiles; deleting platforms/ clears it.
 */
export const getCompilationCachePath = (
	platformsDir: string,
	platformName: string,
): string =>
	path.join(platformsDir, ".cache", platformName, "CompilationCache");

/**
 * Where builds put their .app/.ipa before DerivedData moved into the
 * platforms folder. CI scripts and Detox configs still point here.
 */
export const getLegacyBuildOutputPath = (
	projectRoot: string,
	buildOutputPath: string,
): string =>
	path.join(projectRoot, constants.BUILD_DIR, path.basename(buildOutputPath));

/**
 * Xcode keeps one Package.resolved per workspace: the CocoaPods workspace when
 * there is one, otherwise the project's embedded workspace.
 */
export const getPackageResolvedPaths = (
	projectRoot: string,
	projectName: string,
): string[] => [
	path.join(
		projectRoot,
		`${projectName}.xcworkspace`,
		"xcshareddata",
		"swiftpm",
		"Package.resolved",
	),
	path.join(
		projectRoot,
		`${projectName}.xcodeproj`,
		"project.xcworkspace",
		"xcshareddata",
		"swiftpm",
		"Package.resolved",
	),
];
