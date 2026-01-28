import { assert } from "chai";

/**
 * Helper function to merge app and plugin SPM packages.
 * App packages take precedence over plugin packages with the same name.
 */
function mergeSPMPackages(appPackages: any[], pluginPackages: any[]): any[] {
	const spmPackages = [...appPackages];
	const appPackageNames = new Set(spmPackages.map(pkg => pkg.name));
	
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

			const firebasePackage = spmPackages.find((pkg) => pkg.name === "FirebaseCore");
			assert.isDefined(firebasePackage, "Should include FirebaseCore package");
			assert.equal(
				firebasePackage.version,
				"10.0.0",
				"Should use app's FirebaseCore version (10.0.0), not plugin's (9.0.0)",
			);

			const alamofirePackage = spmPackages.find((pkg) => pkg.name === "Alamofire");
			assert.isDefined(alamofirePackage, "Should include Alamofire package from plugin");
			assert.equal(alamofirePackage.version, "5.0.0", "Should use plugin's Alamofire version");
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
			assert.equal(spmPackages.length, 2, "Should include both plugin packages");

			const packageNames = spmPackages.map((pkg) => pkg.name);
			assert.include(packageNames, "FirebaseCore", "Should include FirebaseCore");
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
