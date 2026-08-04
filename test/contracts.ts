import { assert } from "chai";
import { getContractName, Injector, provide } from "../lib/common/di";
import { DoctorService, ProjectNameService } from "../lib/contracts";
import type { ISpawnResult } from "../lib/common/declarations";

describe("contracts tranche", () => {
	it("carries decorator-set token names matching the Yok-era registrations", () => {
		assert.equal(getContractName(DoctorService), "doctorService");
		assert.equal(getContractName(ProjectNameService), "projectNameService");
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
});
