import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { Injector, inject, runInInjectionContext } from "../../lib/common/di";

// Pins the externally reachable injector surface: every IInjector member
// (lib/common/definitions/yok.d.ts) plus dispose, subclassability, the
// injector self-registration, and the global assignment. The Yok facade must
// keep all of these behaving through the DI migration.

const FACADE_METHODS = [
	"require",
	"requirePublic",
	"requirePublicClass",
	"requireCommand",
	"requireKeyCommand",
	"resolve",
	"resolveCommand",
	"resolveKeyCommand",
	"register",
	"registerCommand",
	"registerKeyCommand",
	"getRegisteredCommandsNames",
	"getRegisteredKeyCommandsNames",
	"dynamicCall",
	"getDynamicCallData",
	"isDefaultCommand",
	"isValidHierarchicalCommand",
	"getChildrenCommandsNames",
	"buildHierarchicalCommand",
	"dispose",
];

describe("injector facade surface", () => {
	it("exposes every IInjector member", () => {
		const inj: any = new Yok();
		for (const member of FACADE_METHODS) {
			assert.isFunction(inj[member], `missing facade method: ${member}`);
		}
		assert.instanceOf(inj.dynamicCallRegex, RegExp);
		assert.isObject(inj.publicApi);
		assert.isObject(inj.publicApi.__modules__);
		assert.isBoolean(inj.overrideAlreadyRequiredModule);
	});

	it("registers itself under 'injector', resolvable with and without the $ prefix", () => {
		const inj = new Yok();
		assert.strictEqual(inj.resolve("injector"), inj);
		assert.strictEqual(inj.resolve("$injector"), inj);
	});

	it("remains subclassable (the InjectorStub pattern in test/stubs.ts)", () => {
		class SubInjector extends Yok {}
		const sub = new SubInjector();
		sub.register("subclassed", { value: 42 });
		assert.equal(sub.resolve("subclassed").value, 42);
		assert.strictEqual(sub.resolve("injector"), sub);
	});

	it("assigns the process-wide global.$injector", () => {
		assert.isOk((<any>global).$injector);
		for (const member of FACADE_METHODS) {
			assert.isFunction(
				(<any>global).$injector[member],
				`global.$injector missing: ${member}`,
			);
		}
	});

	it("IS an Injector: instanceof holds and the new API works on the facade directly", () => {
		const inj = new Yok();
		assert.instanceOf(inj, Injector);

		// Provider-form registration dispatches to the container...
		inj.register({ provide: "viaProvider", useValue: { tag: 1 } });
		assert.equal(inj.get<any>("viaProvider").tag, 1);
		// ...while string-form registration keeps legacy semantics.
		inj.register("viaLegacy", { tag: 2 });
		assert.equal(inj.resolve("viaLegacy").tag, 2);
		assert.strictEqual(inj.get("viaLegacy"), inj.resolve("viaLegacy"));

		// One identity: the injection context IS the facade.
		runInInjectionContext(inj, () => {
			assert.strictEqual(inject(Injector), inj);
		});
	});

	it("calls lowercase/anonymous resolvers as factories instead of new-ing them", () => {
		const inj = new Yok();
		inj.register("factoryMade", function () {
			return { madeByFactory: true };
		});
		assert.isTrue(inj.resolve("factoryMade").madeByFactory);
	});
});
