import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { PacoteService } from '../../lib/services/pacote-service';
import { LoggerStub } from "../stubs";
import { sandbox, SinonSandbox, SinonStub } from "sinon";
import { EventEmitter } from "events";

const npmconfig = require("libnpmconfig");
const pacote = require("pacote");
const tar = require("tar");
const path = require("path");

const defaultPacoteOpts: IPacoteBaseOptions = createPacoteOptions({});
const npmCachePath = defaultPacoteOpts['cache'];
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
	password: null
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
	expectedArgs: any[];
}

function createPacoteOptions(source: Object): Object {
		let options: { [index: string]: any } = {};
		npmconfig.read().forEach((value: any, key: string) => {
			// replace env ${VARS} in strings with the process.env value
			options[key] = typeof value !== 'string' ? value :  value.replace(/\${([^}]+)}/, (_, envVar) => process.env[envVar] );
		});

		// Copy any original source keys over our defaults
		for (let key in source) {
		    options[key] = source[key];
		}
	return options;
}

const createTestInjector = (opts?: ITestSetup): IInjector => {
	opts = opts || {};

	const testInjector = new Yok();
	testInjector.register("logger", LoggerStub);
	testInjector.register("pacoteService", PacoteService);
	testInjector.register("fs", {
		exists: (p: string): boolean => opts.isLocalPackage
	});

	testInjector.register("proxyService", {
		getCache: async (): Promise<IProxySettings> => opts.useProxySettings ? proxySettings : null
	});
	testInjector.register("packageManager", {
		getCachePath: async (): Promise<string> => {
			if (opts.npmGetCachePathError) {
				throw opts.npmGetCachePathError;
			}

			return npmCachePath;
		}
	});
	testInjector.register("npm", {
		getCachePath: async (): Promise<string> => {
			if (opts.npmGetCachePathError) {
				throw opts.npmGetCachePathError;
			}

			return npmCachePath;
		}
	});

	return testInjector;
};

class MockStream extends EventEmitter {
	public pipe(destination: any, options?: { end?: boolean; }): any {
		// Nothing to do here, just mock the method.
	}
}

describe("pacoteService", () => {
	const manifestResult: any = {};
	const manifestOptions: IPacoteManifestOptions = { fullMetadata: true };
	let sandboxInstance: SinonSandbox = null;
	let manifestStub: SinonStub = null;
	let tarballStreamStub: SinonStub = null;
	let tarXStub: SinonStub = null;
	let tarballSourceStream: MockStream = null;
	let tarExtractDestinationStream: MockStream = null;

	beforeEach(() => {
		sandboxInstance = sandbox.create();
		manifestStub = sandboxInstance.stub(pacote, "manifest").returns(Promise.resolve(manifestResult));
		tarballSourceStream = new MockStream();
		tarballStreamStub = sandboxInstance.stub(pacote.tarball, "stream").returns(tarballSourceStream);
		tarExtractDestinationStream = new MockStream();
		tarXStub = sandboxInstance.stub(tar, "x").returns(tarExtractDestinationStream);
	});

	afterEach(() => {
		sandboxInstance.restore();
	});

	const setupTest = (opts?: ITestSetup): IPacoteService => {
		opts = opts || {};
		const testInjector = createTestInjector(opts);

		if (opts.isLocalPackage) {
		    const oldPath = path.resolve;
		    sandboxInstance.stub(path, "resolve").callsFake((value:string) => {
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
					expectedArgs: [packageName, _.extend({}, defaultPacoteOpts)]
				},
				{
					name: "with 'cache' and passed options",
					manifestOptions,
					expectedArgs: [packageName, _.extend({}, defaultPacoteOpts, manifestOptions)]
				},
				{
					name: "with 'cache' and proxy settings",
					useProxySettings: true,
					expectedArgs: [packageName, _.extend({}, defaultPacoteOpts, proxySettings)]
				},
				{
					name: "with 'cache', passed options and proxy settings when proxy is configured",
					manifestOptions,
					useProxySettings: true,
					expectedArgs: [packageName, _.extend({}, defaultPacoteOpts, manifestOptions, proxySettings)]
				},
				{
					name: "with full path to file when it is local one",
					isLocalPackage: true,
					expectedArgs: [fullPath, _.extend({}, defaultPacoteOpts)]
				},
				{
					name: "with full path to file, 'cache' and passed options when local path is passed",
					manifestOptions,
					isLocalPackage: true,
					expectedArgs: [fullPath, _.extend({}, defaultPacoteOpts, manifestOptions)]
				},
				{
					name: "with full path to file, 'cache' and proxy settings when proxy is configured",
					manifestOptions,
					isLocalPackage: true,
					useProxySettings: true,
					expectedArgs: [fullPath, _.extend({}, defaultPacoteOpts, manifestOptions, proxySettings)]
				},
				{
					name: "with full path to file, 'cache', passed options and proxy settings when proxy is configured and local path is passed",
					manifestOptions,
					useProxySettings: true,
					isLocalPackage: true,
					expectedArgs: [fullPath, _.extend({}, defaultPacoteOpts, manifestOptions, proxySettings)]
				},
			];

			testData.forEach(testCase => {
				it(testCase.name, async () => {
					const pacoteService = setupTest(testCase);
					const result = await pacoteService.manifest(packageName, testCase.manifestOptions);

					assert.equal(result, manifestResult);
					assert.deepEqual(manifestStub.firstCall.args, testCase.expectedArgs);
				});
			});
		});

		it("fails with npm error when unable to get npm cache", async () => {
			const npmGetCachePathError = new Error("npm error");
			const pacoteService = setupTest({ npmGetCachePathError });
			await assert.isRejected(pacoteService.manifest(packageName, null), npmGetCachePathError.message);
		});
	});

	describe("extractPackage", () => {
		it("fails with correct error when pacote.tarball.stream raises error event", async () => {
			const pacoteService = setupTest();

			const pacoteExtractPackagePromise = pacoteService.extractPackage(packageName, destinationDir);
			setImmediate(() => {
				tarballSourceStream.emit("error", new Error(errorMessage));
			});

			await assert.isRejected(pacoteExtractPackagePromise, errorMessage);
		});

		it("fails with correct error when the destination stream raises error event", async () => {
			const pacoteService = setupTest();

			const pacoteExtractPackagePromise = pacoteService.extractPackage(packageName, destinationDir);
			setImmediate(() => {
				tarExtractDestinationStream.emit("error", new Error(errorMessage));
			});

			await assert.isRejected(pacoteExtractPackagePromise, errorMessage);
		});

		it("resolves when the destination stream emits finish event", async () => {
			const pacoteService = setupTest();

			const pacoteExtractPackagePromise = pacoteService.extractPackage(packageName, destinationDir);
			setImmediate(() => {
				tarExtractDestinationStream.emit("finish");
			});

			await assert.isFulfilled(pacoteExtractPackagePromise);
		});

		describe("passes correct options to tar.x", () => {
			const defaultExtractOpts = { strip: 1, C: destinationDir };
			const additionalExtractOpts: IPacoteExtractOptions = {
				filter: (p: string, stat: any) => true
			};

			const testData: ITestCase[] = [
				{
					name: "when only default options should be passed",
					expectedArgs: [defaultExtractOpts],
				},
				{
					name: "when additional options are passed",
					expectedArgs: [_.extend({}, defaultExtractOpts, additionalExtractOpts)],
					additionalExtractOpts
				},
			];

			testData.forEach(testCase => {
				it(testCase.name, async () => {
					const pacoteService = setupTest();

					const pacoteExtractPackagePromise = pacoteService.extractPackage(packageName, destinationDir, testCase.additionalExtractOpts);
					setImmediate(() => {
						tarExtractDestinationStream.emit("finish");
					});

					await assert.isFulfilled(pacoteExtractPackagePromise);

					assert.deepEqual(tarXStub.firstCall.args, testCase.expectedArgs);
				});
			});
		});

		describe("passes correct options to pacote.tarball.stream", () => {
			const testData: ITestCase[] = [
				{
					name: "when proxy is not set",
					expectedArgs: [packageName, defaultPacoteOpts]
				},
				{
					name: "when proxy is not set and a local path is passed",
					isLocalPackage: true,
					expectedArgs: [fullPath, defaultPacoteOpts]
				},
				{
					name: "when proxy is set",
					useProxySettings: true,
					expectedArgs: [packageName, _.extend({}, defaultPacoteOpts, proxySettings)]
				},
				{
					name: "when proxy is set and a local path is passed",
					useProxySettings: true,
					isLocalPackage: true,
					expectedArgs: [fullPath, _.extend({}, defaultPacoteOpts, proxySettings)]
				},

			];

			testData.forEach(testCase => {
				it(testCase.name, async () => {
					const pacoteService = setupTest(testCase);

					const pacoteExtractPackagePromise = pacoteService.extractPackage(packageName, destinationDir);
					setImmediate(() => {
						tarExtractDestinationStream.emit("finish");
					});

					await assert.isFulfilled(pacoteExtractPackagePromise);
					assert.deepEqual(tarballStreamStub.firstCall.args, testCase.expectedArgs);
				});
			});
		});
	});
});
