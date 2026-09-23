import { Contract } from "../di/contract";

/**
 * The public-API-builder face of the injector facade: the machinery behind
 * `require('nativescript')`. Bound by the compatibility constraints of the
 * published library surface; do not add new entries through it.
 */
@Contract({ name: "publicApiBuilder" })
export abstract class PublicApiBuilder {
	abstract requirePublic(names: string | string[], file: string): void;
	abstract requirePublicClass(names: string | string[], file: string): void;
	abstract publicApi: any;
}
