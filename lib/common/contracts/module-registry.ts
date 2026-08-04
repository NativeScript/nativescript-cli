import { Contract } from "../di/contract";

/**
 * @deprecated The lazy module-loader face of the injector facade — the
 * require-time path map. Wholly replaced by provideLazy(); this contract
 * exists so its remaining consumers are typed against exactly what they use
 * until the bootstrap migrates.
 */
@Contract({ name: "moduleRegistry" })
export abstract class ModuleRegistry {
	abstract require(names: string | string[], file: string): void;
	abstract overrideAlreadyRequiredModule: boolean;
}
