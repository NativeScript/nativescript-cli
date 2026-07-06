import { assert } from "chai";
import { SPMService } from "../lib/services/ios/spm-service";

/**
 * Helper function to merge app and plugin SPM packages.
 * App packages take precedence over plugin packages with the same name.
 */
function mergeSPMPackages(appPackages: any[], pluginPackages: any[]): any[] {
	const spmPackages = [...appPackages];
	const appPackageNames = new Set(spmPackages.map((pkg) => pkg.name));

	for (const pluginPkg of pluginPackages) {
		if (!appPackageNames.has(pluginPkg.name)) {
			spmPackages.push(pluginPkg);
		}
	}

	return spmPackages;
}

describe("SPM Service - Package Override Logic", () => {
	describe("merging app and plugin SPM packages", () => {
		it("should allow app packages to override plugin packages with the same name", () => {
			// This test validates the merge logic without requiring MobileProject
			const appPackages = [
				{
					name: "FirebaseCore",
					repositoryURL: "https://github.com/firebase/firebase-ios-sdk",
					version: "10.0.0",
					libs: ["FirebaseCore"],
				},
			];

			const pluginPackages = [
				{
					name: "FirebaseCore",
					repositoryURL: "https://github.com/firebase/firebase-ios-sdk",
					version: "9.0.0",
					libs: ["FirebaseCore"],
				},
				{
					name: "Alamofire",
					repositoryURL: "https://github.com/Alamofire/Alamofire",
					version: "5.0.0",
					libs: ["Alamofire"],
				},
			];

			const spmPackages = mergeSPMPackages(appPackages, pluginPackages);

			// Verify the result
			assert.equal(spmPackages.length, 2, "Should have 2 packages total");

			const firebasePackage = spmPackages.find(
				(pkg) => pkg.name === "FirebaseCore",
			);
			assert.isDefined(firebasePackage, "Should include FirebaseCore package");
			assert.equal(
				firebasePackage.version,
				"10.0.0",
				"Should use app's FirebaseCore version (10.0.0), not plugin's (9.0.0)",
			);

			const alamofirePackage = spmPackages.find(
				(pkg) => pkg.name === "Alamofire",
			);
			assert.isDefined(
				alamofirePackage,
				"Should include Alamofire package from plugin",
			);
			assert.equal(
				alamofirePackage.version,
				"5.0.0",
				"Should use plugin's Alamofire version",
			);
		});

		it("should include all plugin packages when no app packages exist", () => {
			const appPackages: any[] = [];

			const pluginPackages = [
				{
					name: "FirebaseCore",
					repositoryURL: "https://github.com/firebase/firebase-ios-sdk",
					version: "9.0.0",
					libs: ["FirebaseCore"],
				},
				{
					name: "Alamofire",
					repositoryURL: "https://github.com/Alamofire/Alamofire",
					version: "5.0.0",
					libs: ["Alamofire"],
				},
			];

			const spmPackages = mergeSPMPackages(appPackages, pluginPackages);

			// Verify the result
			assert.equal(
				spmPackages.length,
				2,
				"Should include both plugin packages",
			);

			const packageNames = spmPackages.map((pkg) => pkg.name);
			assert.include(
				packageNames,
				"FirebaseCore",
				"Should include FirebaseCore",
			);
			assert.include(packageNames, "Alamofire", "Should include Alamofire");
		});

		it("should handle local packages override correctly", () => {
			const appPackages = [
				{
					name: "LocalSDK",
					path: "./custom-sdk",
					libs: ["LocalSDK"],
				},
			];

			const pluginPackages = [
				{
					name: "LocalSDK",
					path: "./plugin-sdk",
					libs: ["LocalSDK"],
				},
			];

			const spmPackages = mergeSPMPackages(appPackages, pluginPackages);

			// Verify the result
			assert.equal(spmPackages.length, 1, "Should have exactly 1 package");

			const localPackage = spmPackages.find((pkg) => pkg.name === "LocalSDK");
			assert.isDefined(localPackage, "Should include LocalSDK package");
			assert.equal(
				(localPackage as any).path,
				"./custom-sdk",
				"Should use app's LocalSDK path, not plugin's",
			);
		});

		it("should keep all packages when there are no name conflicts", () => {
			const appPackages = [
				{
					name: "FirebaseCore",
					repositoryURL: "https://github.com/firebase/firebase-ios-sdk",
					version: "10.0.0",
					libs: ["FirebaseCore"],
				},
			];

			const pluginPackages = [
				{
					name: "Alamofire",
					repositoryURL: "https://github.com/Alamofire/Alamofire",
					version: "5.0.0",
					libs: ["Alamofire"],
				},
				{
					name: "Kingfisher",
					repositoryURL: "https://github.com/onevcat/Kingfisher",
					version: "7.0.0",
					libs: ["Kingfisher"],
				},
			];

			const spmPackages = mergeSPMPackages(appPackages, pluginPackages);

			// Verify the result
			assert.equal(spmPackages.length, 3, "Should have all 3 packages");

			const packageNames = spmPackages.map((pkg) => pkg.name);
			assert.include(packageNames, "FirebaseCore");
			assert.include(packageNames, "Alamofire");
			assert.include(packageNames, "Kingfisher");
		});
	});
});

describe("SPM Service - resolution log parsing", () => {
	// describeSPMActivity / shortenPackageRef are pure helpers with no runtime
	// dependencies, so we exercise the real implementation directly (the
	// constructor only stashes injected services it never touches here).
	const service: any = new (SPMService as any)();

	describe("describeSPMActivity", () => {
		it("flags the NativeScript runtime binary download specifically", () => {
			assert.equal(
				service.describeSPMActivity(
					"Downloading binary artifact https://github.com/NativeScript/ios-spm/releases/download/9.0.3/NativeScript.xcframework.zip",
				),
				"Downloading the NativeScript runtime (first build only)",
			);
		});

		it("flags other binary artifact downloads generically", () => {
			assert.equal(
				service.describeSPMActivity(
					"Downloading binary artifact https://example.com/SomeSDK.xcframework.zip",
				),
				"Downloading Swift Package binaries (first build only)",
			);
		});

		it("summarizes fetching with the package name in parentheses", () => {
			assert.equal(
				service.describeSPMActivity(
					"Fetching from https://github.com/NativeScript/ios-spm.git",
				),
				"Fetching Swift Packages (ios-spm)",
			);
		});

		it("summarizes cloning with the package name in parentheses", () => {
			assert.equal(
				service.describeSPMActivity(
					"Cloning https://github.com/Alamofire/Alamofire.git",
				),
				"Cloning Swift Packages (Alamofire)",
			);
		});

		it("omits the parenthesized name when the line has no URL", () => {
			assert.equal(
				service.describeSPMActivity("Fetching cached package"),
				"Fetching Swift Packages",
			);
		});

		it("recognizes version computation", () => {
			assert.equal(
				service.describeSPMActivity(
					"Computing version for https://github.com/NativeScript/ios-spm.git",
				),
				"Computing package versions",
			);
		});

		it("recognizes the package graph resolution start", () => {
			assert.equal(
				service.describeSPMActivity("Resolve Package Graph"),
				"Resolving Swift Package graph",
			);
		});

		it("recognizes the resolved/finalize step", () => {
			assert.equal(
				service.describeSPMActivity("Resolved source packages:"),
				"Finalizing Swift Package dependencies",
			);
		});

		it("tolerates leading/trailing whitespace", () => {
			assert.equal(
				service.describeSPMActivity(
					"   Fetching https://github.com/NativeScript/ios-spm.git  ",
				),
				"Fetching Swift Packages (ios-spm)",
			);
		});

		it("returns null for blank lines", () => {
			assert.isNull(service.describeSPMActivity(""));
			assert.isNull(service.describeSPMActivity("   "));
		});

		it("returns null for unrelated build output", () => {
			assert.isNull(
				service.describeSPMActivity("CompileSwift normal arm64 Foo.swift"),
			);
		});
	});

	describe("shortenPackageRef", () => {
		it("extracts the repo name and strips the .git suffix", () => {
			assert.equal(
				service.shortenPackageRef(
					"Fetching from https://github.com/NativeScript/ios-spm.git",
				),
				"ios-spm",
			);
		});

		it("handles URLs without a .git suffix", () => {
			assert.equal(
				service.shortenPackageRef(
					"Cloning https://github.com/Alamofire/Alamofire",
				),
				"Alamofire",
			);
		});

		it("returns null when there is no URL", () => {
			assert.isNull(service.shortenPackageRef("Fetching cached package"));
		});
	});

	describe("formatElapsed", () => {
		it("always renders minutes and seconds", () => {
			assert.equal(service.formatElapsed(0), "0m 0s");
			assert.equal(service.formatElapsed(42), "0m 42s");
			assert.equal(service.formatElapsed(60), "1m 0s");
			assert.equal(service.formatElapsed(315), "5m 15s");
			assert.equal(service.formatElapsed(3725), "62m 5s");
		});
	});
});
