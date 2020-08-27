import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { PacoteService } from "../../lib/services/pacote-service";
import { LoggerStub } from "../stubs";
import * as sinon from "sinon";
import * as _ from "lodash";
import { EventEmitter } from "events";
import { NpmConfigService } from "../../lib/services/npm-config-service";
import { INpmConfigService } from "../../lib/declarations";
import { IProxySettings } from "../../lib/common/declarations";
import { IInjector } from "../../lib/common/definitions/yok";

import * as pacote from "pacote";
import * as tar from "tar";
const path = require("path");

let defaultPacoteOpts: IPacoteBaseOptions = null;
let isNpmConfigSet = false;
const packageName = "testPackage";
const fullPath = `/Users/username/${packageName}`;
const destinationDir = "destinationDir";
const errorMessage = "error message";
const proxySettings: IProxySettings = {
	hostname: "hostname",
	proxy: "proxy",
	port: "8888",
	rejectUnauthorized: true,
	username: null,
	password: null,
};

interface ITestSetup {
	isLocalPackage?: boolean;
	useProxySettings?: boolean;
	npmGetCachePathError?: Error;
}

interface ITestCase extends ITestSetup {
	manifestOptions?: IPacoteManifestOptions;
	additionalExtractOpts?: IPacoteExtractOptions;
	name: string;
	expectedPackageName?: string;
}

const createTestInjector = (opts?: ITestSetup): IInjector => {
	opts = opts || {};
	const testInjector = new Yok();
	testInjector.register("npmConfigService", NpmConfigService);

	if (!isNpmConfigSet) {
		const npmConfigService: INpmConfigService = testInjector.resolve(
			"npmConfigService"
		);
		defaultPacoteOpts = npmConfigService.getConfig();
		isNpmConfigSet = true;
	}

	const npmCachePath = defaultPacoteOpts["cache"];

	testInjector.register("logger", LoggerStub);
	testInjector.register("pacoteService", PacoteService);
	testInjector.register("fs", {
		exists: (p: string): boolean => opts.isLocalPackage,
	});

	testInjector.register("proxyService", {
		getCache: async (): Promise<IProxySettings> =>
			opts.useProxySettings ? proxySettings : null,
	});
	testInjector.register("packageManager", {
		getCachePath: async (): Promise<string> => {
			if (opts.npmGetCachePathError) {
				throw opts.npmGetCachePathError;
			}

			return npmCachePath;
		},
	});
	testInjector.register("npm", {
		getCachePath: async (): Promise<string> => {
			if (opts.npmGetCachePathError) {
				throw opts.npmGetCachePathError;
			}

			return npmCachePath;
		},
	});

	return testInjector;
};

class MockStream extends EventEmitter {
	public pipe(destination: any, options?: { end?: boolean }): any {
		// Nothing to do here, just mock the method.
	}
	public end(): any {
		//
	}
}

class MockBuffer {
	constructor() {
		return Buffer.from([]);
	}
}

describe("pacoteService", () => {
	const manifestResult: any = {};
	const manifestOptions: IPacoteManifestOptions = { fullMetadata: true };
	let sandboxInstance: sinon.SinonSandbox = null;
	let manifestStub: sinon.SinonStub = null;
	let tarballStreamStub: sinon.SinonStub = null;
	let tarXStub: sinon.SinonStub = null;
	let tarballSourceBuffer: MockBuffer = null;
	let tarExtractDestinationStream: MockStream = null;

	beforeEach(() => {
		sandboxInstance = sinon.createSandbox();
		manifestStub = sandboxInstance
			.stub(pacote, "manifest")
			.returns(Promise.resolve(manifestResult));
		tarballSourceBuffer = new MockBuffer();
		tarballStreamStub = sandboxInstance
			.stub(pacote, "tarball")
			.returns(Promise.resolve(<any>tarballSourceBuffer));
		tarExtractDestinationStream = new MockStream();
		tarXStub = sandboxInstance
			.stub(tar, "x")
			.returns(<any>tarExtractDestinationStream);
	});

	afterEach(() => {
		sandboxInstance.restore();
	});

	const setupTest = (opts?: ITestSetup): IPacoteService => {
		opts = opts || {};

		const testInjector = createTestInjector(opts);

		if (opts.isLocalPackage) {
			const oldPath = path.resolve;
			sandboxInstance.stub(path, "resolve").callsFake((value: string) => {
				if (value === packageName) {
					return fullPath;
				}
				return oldPath(value);
			});
		}

		return testInjector.resolve<IPacoteService>("pacoteService");
	};

	describe("manifest", () => {
		describe("calls pacote.manifest", () => {
			const testData: ITestCase[] = [
				{
					name: "with 'cache' only when no opts are passed",
					expectedPackageName: packageName,
				},
				{
					name: "with 'cache' and passed options",
					manifestOptions,
					expectedPackageName: packageName,
				},
				{
					name: "with 'cache' and proxy settings",
					useProxySettings: true,
					expectedPackageName: packageName,
				},
				{
					name:
						"with 'cache', passed options and proxy settings when proxy is configured",
					manifestOptions,
					useProxySettings: true,
					expectedPackageName: packageName,
				},
				{
					name: "with full path to file when it is local one",
					isLocalPackage: true,
					expectedPackageName: fullPath,
				},
				{
					name:
						"with full path to file, 'cache' and passed options when local path is passed",
					manifestOptions,
					isLocalPackage: true,
					expectedPackageName: fullPath,
				},
				{
					name:
						"with full path to file, 'cache' and proxy settings when proxy is configured",
					manifestOptions,
					isLocalPackage: true,
					useProxySettings: true,
					expectedPackageName: fullPath,
				},
				{
					name:
						"with full path to file, 'cache', passed options and proxy settings when proxy is configured and local path is passed",
					manifestOptions,
					useProxySettings: true,
					isLocalPackage: true,
					expectedPackageName: fullPath,
				},
			];

			testData.forEach((testCase) => {
				it(testCase.name, async () => {
					const pacoteService = setupTest(testCase);
					const result = await pacoteService.manifest(
						packageName,
						testCase.manifestOptions
					);

					const expectedArgs = [
						testCase.expectedPackageName,
						_.extend(
							{},
							defaultPacoteOpts,
							testCase.manifestOptions || {},
							testCase.useProxySettings ? proxySettings : {}
						),
					];

					assert.equal(result, manifestResult);
					assert.deepStrictEqual(manifestStub.firstCall.args, expectedArgs);
				});
			});
		});

		it("fails with npm error when unable to get npm cache", async () => {
			const npmGetCachePathError = new Error("npm error");
			const pacoteService = setupTest({ npmGetCachePathError });
			await assert.isRejected(
				pacoteService.manifest(packageName, null),
				npmGetCachePathError.message
			);
		});
	});

	describe("extractPackage", () => {
		it("fails with correct error when pacote.tarball raises error event", async () => {
			const pacoteService = setupTest();

			tarballStreamStub.returns(Promise.reject(new Error(errorMessage)));
			const pacoteExtractPackagePromise = pacoteService.extractPackage(
				packageName,
				destinationDir
			);

			await assert.isRejected(pacoteExtractPackagePromise, errorMessage);
		});

		it("fails with correct error when the destination stream raises error event", async () => {
			const pacoteService = setupTest();

			const pacoteExtractPackagePromise = pacoteService.extractPackage(
				packageName,
				destinationDir
			);
			setImmediate(() => {
				tarExtractDestinationStream.emit("error", new Error(errorMessage));
			});

			await assert.isRejected(pacoteExtractPackagePromise, errorMessage);
		});

		it("resolves when the destination stream emits finish event", async () => {
			const pacoteService = setupTest();

			const pacoteExtractPackagePromise = pacoteService.extractPackage(
				packageName,
				destinationDir
			);
			setImmediate(() => {
				tarExtractDestinationStream.emit("finish");
			});

			await assert.isFulfilled(pacoteExtractPackagePromise);
		});

		describe("passes correct options to tar.x", () => {
			const defaultExtractOpts = { strip: 1, C: destinationDir };
			const additionalExtractOpts: IPacoteExtractOptions = {
				filter: (p: string, stat: any) => true,
			};

			const testData: ITestCase[] = [
				{
					name: "when only default options should be passed",
				},
				{
					name: "when additional options are passed",
					additionalExtractOpts,
				},
			];

			testData.forEach((testCase) => {
				it(testCase.name, async () => {
					const pacoteService = setupTest();

					const pacoteExtractPackagePromise = pacoteService.extractPackage(
						packageName,
						destinationDir,
						testCase.additionalExtractOpts
					);
					setImmediate(() => {
						tarExtractDestinationStream.emit("finish");
					});

					await assert.isFulfilled(pacoteExtractPackagePromise);

					const expectedArgs = [
						_.extend(
							{},
							defaultExtractOpts,
							testCase.additionalExtractOpts || {}
						),
					];

					assert.deepStrictEqual(tarXStub.firstCall.args, expectedArgs);
				});
			});
		});

		describe("passes correct options to pacote.tarball.stream", () => {
			const testData: ITestCase[] = [
				{
					name: "when proxy is not set",
					expectedPackageName: packageName,
				},
				{
					name: "when proxy is not set and a local path is passed",
					isLocalPackage: true,
					expectedPackageName: fullPath,
				},
				{
					name: "when proxy is set",
					useProxySettings: true,
					expectedPackageName: packageName,
				},
				{
					name: "when proxy is set and a local path is passed",
					useProxySettings: true,
					isLocalPackage: true,
					expectedPackageName: fullPath,
				},
			];

			testData.forEach((testCase) => {
				it(testCase.name, async () => {
					const pacoteService = setupTest(testCase);

					const pacoteExtractPackagePromise = pacoteService.extractPackage(
						packageName,
						destinationDir
					);
					setImmediate(() => {
						tarExtractDestinationStream.emit("finish");
					});

					const expectedArgs = [
						testCase.expectedPackageName,
						_.extend(
							{},
							defaultPacoteOpts,
							testCase.useProxySettings ? proxySettings : {}
						),
					];

					await assert.isFulfilled(pacoteExtractPackagePromise);
					assert.deepStrictEqual(
						tarballStreamStub.firstCall.args,
						expectedArgs
					);
				});
			});
		});
	});
});
