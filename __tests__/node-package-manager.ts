import { Yok } from "../src/common/yok";
import * as stubs from "./stubs";
import { assert } from "chai";
import { NodePackageManager } from "../src/node-package-manager";
import { IInjector } from "../src/common/definitions/yok";

function createTestInjector(configuration: {
} = {}): IInjector {
	const injector = new Yok();
	injector.register("hostInfo", {});
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("childProcess", stubs.ChildProcessStub);
	injector.register("httpClient", {});
	injector.register("fs", stubs.FileSystemStub);
	injector.register("npm", NodePackageManager);
	injector.register("pacoteService", {
		manifest: () => Promise.resolve()
	});

	return injector;
}

describe("node-package-manager", () => {

	describe("getPackageNameParts", () => {
		[
			{
				name: "should return both name and version when valid fullName passed",
				templateFullName: "some-template@1.0.0",
				expectedVersion: "1.0.0",
				expectedName: "some-template",
			},
			{
				name: "should return both name and version when valid fullName with scope passed",
				templateFullName: "@nativescript/some-template@1.0.0",
				expectedVersion: "1.0.0",
				expectedName: "@nativescript/some-template",
			},
			{
				name: "should return only name when version is not specified and the template is scoped",
				templateFullName: "@nativescript/some-template",
				expectedVersion: "",
				expectedName: "@nativescript/some-template",
			},
			{
				name: "should return only name when version is not specified",
				templateFullName: "some-template",
				expectedVersion: "",
				expectedName: "some-template",
			}
		].forEach(testCase => {
			it(testCase.name, async () => {
				const testInjector = createTestInjector();
				const npm = testInjector.resolve<NodePackageManager>("npm");
				const templateNameParts = await npm.getPackageNameParts(testCase.templateFullName);
				assert.strictEqual(templateNameParts.name, testCase.expectedName);
				assert.strictEqual(templateNameParts.version, testCase.expectedVersion);
			});
		});
	});

	describe("getPackageFullName", () => {
		[
			{
				name: "should return name and version when specified",
				templateName: "some-template",
				templateVersion: "1.0.0",
				expectedFullName: "some-template@1.0.0",
			},
			{
				name: "should return only the github url when no version specified",
				templateName: "https://github.com/NativeScript/template-drawer-navigation-ng#master",
				templateVersion: "",
				expectedFullName: "https://github.com/NativeScript/template-drawer-navigation-ng#master",
			},
			{
				name: "should return only the name when no version specified",
				templateName: "some-template",
				templateVersion: "",
				expectedFullName: "some-template",
			}
		].forEach(testCase => {
			it(testCase.name, async () => {
				const testInjector = createTestInjector();
				const npm = testInjector.resolve<NodePackageManager>("npm");
				const templateFullName = await npm.getPackageFullName({ name: testCase.templateName, version: testCase.templateVersion });
				assert.strictEqual(templateFullName, testCase.expectedFullName);
			});
		});
	});
});
