import { assert } from "chai";
import { getContractName, Injector, provide } from "../lib/common/di";
import type { InjectionToken, ProviderToken } from "../lib/common/di";
import {
	ChildProcess,
	DevicesService,
	DoctorService,
	Errors,
	FileSystem,
	HostInfo,
	HttpClient,
	Logger,
	PackageManager,
	ProjectData,
	ProjectDataService,
	ProjectNameService,
	Prompter,
	TempService,
	PBXPROJ_DOM_XCODE,
	XCODE,
} from "../lib/contracts";
import { Yok } from "../lib/common/yok";
import { Logger as LoggerImpl } from "../lib/common/logger/logger";
import { Errors as ErrorsImpl } from "../lib/common/errors";
import { FileSystem as FileSystemImpl } from "../lib/common/file-system";
import type { ISpawnResult } from "../lib/common/declarations";

const tranche: [ProviderToken<any>, string][] = [
	[ChildProcess, "childProcess"],
	[DevicesService, "devicesService"],
	[DoctorService, "doctorService"],
	[Errors, "errors"],
	[FileSystem, "fs"],
	[HostInfo, "hostInfo"],
	[HttpClient, "httpClient"],
	[Logger, "logger"],
	[PackageManager, "packageManager"],
	[ProjectData, "projectData"],
	[ProjectDataService, "projectDataService"],
	[ProjectNameService, "projectNameService"],
	[Prompter, "prompter"],
	[TempService, "tempService"],
];

describe("contracts tranche", () => {
	it("carries decorator-set token names matching the Yok-era registrations", () => {
		for (const [token, legacyName] of tranche) {
			assert.equal(getContractName(token), legacyName);
		}
	});

	it("resolves via the class, the legacy name, and the $-spelling to one instance", () => {
		class StubDoctorService extends DoctorService {
			async printWarnings(): Promise<void> {}
			async runSetupScript(): Promise<ISpawnResult> {
				return <ISpawnResult>{};
			}
			async canExecuteLocalBuild(): Promise<boolean> {
				return true;
			}
			checkForDeprecatedShortImportsInAppDir(): void {}
		}

		const injector = new Injector([provide(DoctorService, StubDoctorService)]);

		const byClass = injector.get(DoctorService);
		assert.instanceOf(byClass, StubDoctorService);
		assert.strictEqual(injector.get("doctorService"), byClass);
		assert.strictEqual(injector.get("$doctorService"), byClass);
	});

	for (const [token, legacyName] of tranche) {
		it(`aliases '${legacyName}' by class, by name and by $-spelling`, () => {
			const instance = {};
			const injector = new Injector([{ provide: token, useValue: instance }]);

			assert.strictEqual(injector.get(token), instance);
			assert.strictEqual(injector.get(legacyName), instance);
			assert.strictEqual(injector.get(`$${legacyName}`), instance);
		});
	}

	it("finds registrations made under the legacy name only", () => {
		const instance = {};
		const injector = new Injector([
			{ provide: "tempService", useValue: instance },
		]);

		assert.strictEqual(injector.get(TempService), instance);
	});

	describe("injection tokens", () => {
		const tokens: [InjectionToken<any>, string][] = [
			[XCODE, "xcode"],
			[PBXPROJ_DOM_XCODE, "pbxprojDomXcode"],
		];

		for (const [token, legacyName] of tokens) {
			it(`aliases '${legacyName}' by token, by name and by $-spelling`, () => {
				assert.equal(token.description, legacyName);

				// The registration these tokens alias is a module namespace object
				// made by `injector.register(name, module)` under lib/node/.
				const moduleValue = {};
				const injector = new Injector([
					{ provide: legacyName, useValue: moduleValue },
				]);

				assert.strictEqual(injector.get(token), moduleValue);
				assert.strictEqual(injector.get(legacyName), moduleValue);
				assert.strictEqual(injector.get(`$${legacyName}`), moduleValue);
			});
		}
	});

	describe("against a real Yok container", () => {
		it("resolves the token and the legacy name to the same instance", () => {
			const injector = new Yok();
			injector.register("config", { DEBUG: false });
			injector.register("logger", LoggerImpl);
			injector.register("errors", ErrorsImpl);
			injector.register("fs", FileSystemImpl);

			assert.instanceOf(injector.get(Logger), LoggerImpl);
			assert.strictEqual(injector.get(Logger), injector.resolve("logger"));
			assert.strictEqual(injector.get(Errors), injector.resolve("errors"));
			assert.strictEqual(injector.get(FileSystem), injector.resolve("fs"));
		});
	});
});
