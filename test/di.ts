import { assert } from "chai";
import {
	Injector,
	inject,
	runInInjectionContext,
	Contract,
	InjectionToken,
	provide,
	forwardRef,
	ProvidedIn,
} from "../lib/common/di";

@Contract({ name: "diTestGreeter" })
abstract class Greeter {
	abstract greet(): string;
}

class GreeterImpl extends Greeter {
	greet(): string {
		return "hello";
	}
}

@Contract({ name: "diTestDevice" })
abstract class Device {
	abstract id: string;
}

describe("di: tokens and resolution", () => {
	it("resolves one singleton via the class, the name, and the $-prefixed name", () => {
		const injector = new Injector([provide(Greeter, GreeterImpl)]);

		const byClass = injector.get(Greeter);
		assert.instanceOf(byClass, GreeterImpl);
		assert.strictEqual(injector.get("diTestGreeter"), byClass);
		assert.strictEqual(injector.get("$diTestGreeter"), byClass);
	});

	it("does not treat an implementation class as a token via its inherited contract name", () => {
		const injector = new Injector([provide(Greeter, GreeterImpl)]);

		assert.throws(() => injector.get(<any>GreeterImpl), /unable to resolve/);
	});

	it("throws on a duplicate contract name at declaration time", () => {
		assert.throws(() => {
			@Contract({ name: "diTestGreeter" })
			abstract class Duplicate {}
			void Duplicate;
		}, /already used/);
	});

	it("resolves a duplicated contract copy (same name, different class object) to the same provider", () => {
		const injector = new Injector([provide(Greeter, GreeterImpl)]);
		const original = injector.get(Greeter);

		// Simulates what a duplicated CLI copy's decorator does: same Symbol.for
		// key, its own class object, its own registry.
		abstract class DuplicatedCopy {}
		Object.defineProperty(
			DuplicatedCopy,
			Symbol.for("nativescript:di:contractName"),
			{ value: "diTestGreeter" },
		);

		assert.strictEqual(injector.get(<any>DuplicatedCopy), original);
	});
});

describe("di: InjectionToken", () => {
	// A module namespace object — the case that has no class to decorate.
	const moduleValue = { parse: () => "parsed" };
	const MODULE_TOKEN = new InjectionToken<typeof moduleValue>(
		"diTestModuleToken",
	);

	it("resolves one singleton via the token, the name, and the $-prefixed name", () => {
		const injector = new Injector([
			{ provide: MODULE_TOKEN, useValue: moduleValue },
		]);

		assert.strictEqual(injector.get(MODULE_TOKEN), moduleValue);
		assert.strictEqual(injector.get("diTestModuleToken"), moduleValue);
		assert.strictEqual(injector.get("$diTestModuleToken"), moduleValue);
	});

	it("finds a registration made under the legacy name only", () => {
		// The shape lib/node/xcode.ts registers today: a name, no token in sight.
		const injector = new Injector([
			{ provide: "diTestModuleToken", useValue: moduleValue },
		]);

		assert.strictEqual(injector.get(MODULE_TOKEN), moduleValue);
	});

	it("resolves a factory-backed token to one instance across all spellings", () => {
		let builds = 0;
		const injector = new Injector([
			{
				provide: MODULE_TOKEN,
				useFactory: () => {
					builds++;
					return moduleValue;
				},
			},
		]);

		const first = injector.get(MODULE_TOKEN);
		assert.strictEqual(injector.get("diTestModuleToken"), first);
		assert.strictEqual(injector.get("$diTestModuleToken"), first);
		assert.equal(builds, 1);
	});

	it("strips a leading $ from the description", () => {
		const token = new InjectionToken("$diTestDollarToken");

		assert.equal(token.description, "diTestDollarToken");
		const injector = new Injector([{ provide: token, useValue: moduleValue }]);
		assert.strictEqual(injector.get("diTestDollarToken"), moduleValue);
	});

	it("resolves through a child scope, which can shadow it by name", () => {
		const childValue = { parse: () => "child" };
		const root = new Injector([
			{ provide: MODULE_TOKEN, useValue: moduleValue },
		]);
		const child = root.createChild();

		assert.strictEqual(child.get(MODULE_TOKEN), moduleValue);

		const shadowing = root.createChild([
			{ provide: "diTestModuleToken", useValue: childValue },
		]);
		assert.strictEqual(shadowing.get(MODULE_TOKEN), childValue);
		assert.strictEqual(root.get(MODULE_TOKEN), moduleValue);
	});

	it("honours optional on a miss", () => {
		const injector = new Injector();

		assert.isNull(injector.get(MODULE_TOKEN, { optional: true }));
		runInInjectionContext(injector, () => {
			assert.isNull(inject(MODULE_TOKEN, { optional: true }));
		});
	});

	it("names the token in an unresolvable error", () => {
		const injector = new Injector();

		assert.throws(
			() => injector.get(MODULE_TOKEN),
			/unable to resolve InjectionToken\(diTestModuleToken\)/,
		);
	});

	it("names the token in a cyclic dependency report", () => {
		const CYCLE_TOKEN = new InjectionToken("diTestCycleToken");
		class CycleConsumer {
			constructor(public $diTestCycleToken: any) {}
		}
		const injector = new Injector([
			{ provide: CYCLE_TOKEN, useLegacyClass: CycleConsumer },
		]);

		assert.throws(
			() => injector.get(CYCLE_TOKEN),
			/InjectionToken\(diTestCycleToken\) -> InjectionToken\(diTestCycleToken\)/,
		);
	});

	it("throws on a duplicate description at construction time", () => {
		assert.throws(
			() => new InjectionToken("diTestModuleToken"),
			/already used by an injection token/,
		);
	});

	it("throws when a description collides with a contract name", () => {
		assert.throws(
			() => new InjectionToken("diTestGreeter"),
			/already used by contract 'Greeter'/,
		);
	});

	it("throws when a contract name collides with a token description", () => {
		assert.throws(() => {
			@Contract({ name: "diTestModuleToken" })
			abstract class Collides {}
			void Collides;
		}, /already used by an injection token/);
	});

	it("recognizes a token minted by a duplicated copy of the module", () => {
		const injector = new Injector([
			{ provide: MODULE_TOKEN, useValue: moduleValue },
		]);

		// Same Symbol.for marker, its own object — what a second CLI copy mints.
		const duplicatedCopy = {};
		Object.defineProperty(
			duplicatedCopy,
			Symbol.for("nativescript:di:injectionTokenName"),
			{ value: "diTestModuleToken" },
		);

		assert.strictEqual(injector.get(<any>duplicatedCopy), moduleValue);
	});
});

describe("di: lazy providers", () => {
	it("does not invoke the loader until first get()", () => {
		let loads = 0;
		const injector = new Injector([
			{
				provide: "lazyThing",
				useLazyClass: () => {
					loads++;
					return GreeterImpl;
				},
			},
		]);

		assert.equal(loads, 0);
		const first = injector.get("lazyThing");
		assert.equal(loads, 1);
		assert.strictEqual(injector.get("lazyThing"), first);
		assert.equal(loads, 1);
	});

	it("consumes a pending side-effect loader once, expecting it to register the resolver", () => {
		let loads = 0;
		const injector = new Injector();
		injector.register({
			provide: "lazyRequired",
			useLazyRequire: () => {
				loads++;
				injector.register({
					provide: "lazyRequired",
					useLegacyClass: class LazyRequiredThing {},
				});
			},
		});

		const instance = injector.get("lazyRequired");
		assert.isOk(instance);
		assert.equal(loads, 1);
		assert.strictEqual(injector.get("lazyRequired"), instance);
		assert.equal(loads, 1);
	});
});

describe("di: per-level lookup order", () => {
	it("a child's string-keyed override shadows the parent for class-token consumers", () => {
		const root = new Injector([
			{ provide: Device, useValue: { id: "shared-singleton" } },
		]);
		const child = root.createChild([
			{ provide: "diTestDevice", useValue: { id: "per-call" } },
		]);

		// The class key misses in the child; the name fallback must hit the
		// child's entry BEFORE lookup delegates to the parent — otherwise the
		// per-call override is silently skipped.
		assert.equal(child.get(Device).id, "per-call");
		assert.equal(child.get("diTestDevice").id, "per-call");
		assert.equal(root.get(Device).id, "shared-singleton");
	});
});

describe("di: child scopes", () => {
	it("hydrated children see the payload, fall back for services, and stay isolated", () => {
		const loggerValue = { log: true };
		const payloadA = { args: ["a"] };
		const payloadB = { args: ["b"] };

		const root = new Injector([{ provide: "logger", useValue: loggerValue }]);
		const childA = root.createChild([
			{ provide: "hookArgs", useValue: payloadA },
		]);
		const childB = root.createChild([
			{ provide: "hookArgs", useValue: payloadB },
		]);

		assert.strictEqual(childA.get("hookArgs"), payloadA);
		assert.strictEqual(childA.get("$hookArgs"), payloadA);
		assert.strictEqual(childB.get("hookArgs"), payloadB);
		assert.strictEqual(childA.get("logger"), loggerValue);
		assert.throws(() => root.get("hookArgs"), /unable to resolve/);
	});

	it("inject(Injector) returns the nearest injector", () => {
		const root = new Injector();
		const child = root.createChild();

		runInInjectionContext(child, () => {
			assert.strictEqual(inject(Injector), child);
		});
		runInInjectionContext(root, () => {
			assert.strictEqual(inject(Injector), root);
		});
	});
});

describe("di: forwardRef", () => {
	it("defers a token reference from provider-literal creation to registration", () => {
		let LateToken: any;
		// The literal is built while the binding is still unassigned — the thunk
		// is only read when the injector processes the provider.
		const providers = [
			{ provide: forwardRef(() => LateToken), useClass: GreeterImpl },
		];
		LateToken = Greeter;

		const injector = new Injector(providers);

		const instance = injector.get(Greeter);
		assert.instanceOf(instance, GreeterImpl);
		assert.strictEqual(injector.get("diTestGreeter"), instance);
	});

	it("resolves forwardRef tokens at lookup and inside inject()", () => {
		const injector = new Injector([provide(Greeter, GreeterImpl)]);
		const direct = injector.get(Greeter);

		assert.strictEqual(injector.get(forwardRef(() => Greeter)), direct);
		runInInjectionContext(injector, () => {
			assert.strictEqual(inject(forwardRef(() => Greeter)), direct);
		});
	});
});

describe("di: cross-copy injection context", () => {
	// inject.js has no runtime imports, so a copied file loaded from another
	// path is a genuine second instance of the module — the same situation as
	// a nested nativescript install serving a hook or extension module.
	const loadSecondCopy = (): any => {
		const fs = require("fs");
		const os = require("os");
		const path = require("path");
		const source = require.resolve("../lib/common/di/inject.js");
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-di-copy-"));
		const target = path.join(dir, "inject.js");
		fs.copyFileSync(source, target);
		return require(target);
	};

	it("a second copy's inject() resolves against the running copy's context, with a one-time warning", () => {
		const copyB = loadSecondCopy();
		const warnings: string[] = [];
		const loggerValue = {
			warn: (message: string) => warnings.push(message),
		};
		const injector = new Injector([
			{ provide: "logger", useValue: loggerValue },
		]);

		runInInjectionContext(injector, () => {
			// The running copy serving its own context never warns.
			assert.strictEqual(inject("logger"), loggerValue);
			assert.equal(warnings.length, 0);

			// The second copy resolves through the shared slot — and warns once.
			assert.strictEqual(copyB.inject("logger"), loggerValue);
			assert.strictEqual(copyB.inject("logger"), loggerValue);
		});

		assert.equal(warnings.length, 1);
		assert.include(warnings[0], "second copy of the NativeScript CLI");
		assert.include(warnings[0], "peerDependency");
	});

	it("a second copy outside any context still throws the teaching error", () => {
		const copyB = loadSecondCopy();
		assert.throws(() => copyB.inject("logger"), /injection context/);
	});
});

describe("di: inject options", () => {
	it("optional resolves to null for an unknown token, and normally for a known one", () => {
		const injector = new Injector([provide(Greeter, GreeterImpl)]);

		assert.isNull(injector.get("nothing-here", { optional: true }));
		assert.instanceOf(injector.get(Greeter, { optional: true }), GreeterImpl);

		runInInjectionContext(injector, () => {
			assert.isNull(inject("nothing-here", { optional: true }));
		});
	});

	it("optional does not swallow a found-but-misconfigured record", () => {
		const injector = new Injector([
			{ provide: "brokenLiteral", useValue: {}, shared: false },
		]);

		assert.throws(
			() => injector.get("brokenLiteral", { optional: true }),
			/no resolver registered/,
		);
	});

	it("skipSelf escapes a child scope's shadowing entry", () => {
		const root = new Injector([
			{ provide: "logger", useValue: { from: "root" } },
		]);
		const child = root.createChild([
			{ provide: "logger", useValue: { from: "payload" } },
		]);

		assert.equal(child.get<any>("logger").from, "payload");
		assert.equal(child.get<any>("logger", { skipSelf: true }).from, "root");
		// On the root there is no parent to skip to.
		assert.isNull(root.get("logger", { skipSelf: true, optional: true }));
	});

	it("self refuses parent fallthrough", () => {
		const root = new Injector([{ provide: "rootOnly", useValue: { tag: 1 } }]);
		const child = root.createChild([
			{ provide: "childOnly", useValue: { tag: 2 } },
		]);

		assert.equal(child.get<any>("childOnly", { self: true }).tag, 2);
		assert.throws(
			() => child.get("rootOnly", { self: true }),
			/unable to resolve/,
		);
		assert.isNull(child.get("rootOnly", { self: true, optional: true }));
	});

	it("rejects combining self and skipSelf", () => {
		const injector = new Injector();
		assert.throws(
			() => injector.get("anything", { self: true, skipSelf: true }),
			/cannot combine self and skipSelf/,
		);
	});
});

describe("di: cycles", () => {
	it("reports the full resolution path", () => {
		class CycleA {
			constructor(public $cycleB: any) {}
		}
		class CycleB {
			constructor(public $cycleA: any) {}
		}
		const injector = new Injector([
			{ provide: "cycleA", useLegacyClass: CycleA },
			{ provide: "cycleB", useLegacyClass: CycleB },
		]);

		assert.throws(
			() => injector.get("cycleA"),
			/Cyclic dependency detected on dependency 'cycleA'.*cycleA -> cycleB -> cycleA/,
		);
	});
});

describe("di: transients and disposal", () => {
	it("shared:false constructs per resolution, retains every instance, and disposes in reverse order", () => {
		const disposed: number[] = [];
		let seq = 0;
		const injector = new Injector([
			{
				provide: "transientThing",
				shared: false,
				useFactory: () => {
					const id = ++seq;
					return {
						id,
						dispose: () => disposed.push(id),
					};
				},
			},
		]);

		const first = injector.get<any>("transientThing");
		const second = injector.get<any>("transientThing");
		assert.notStrictEqual(first, second);

		injector.dispose();
		assert.deepEqual(disposed, [2, 1]);
	});

	it("disposes shared singletons in reverse instantiation order", () => {
		const disposed: string[] = [];
		const injector = new Injector([
			{
				provide: "firstService",
				useFactory: () => ({ dispose: () => disposed.push("first") }),
			},
			{
				provide: "secondService",
				useFactory: () => ({ dispose: () => disposed.push("second") }),
			},
		]);

		injector.get("firstService");
		injector.get("secondService");
		injector.dispose();

		assert.deepEqual(disposed, ["second", "first"]);
	});
});

describe("di: createInstance", () => {
	class MidDep {
		constructor(public $leafDep: any) {}
	}

	class EntryConsumer {
		constructor(
			public $midDep: any,
			public $leafDep: any,
		) {}
	}

	it("resolves annotated $-params, with per-call providers shadowing one level only", () => {
		const root = new Injector([
			{ provide: "leafDep", useValue: { tag: "root-leaf" } },
			{ provide: "midDep", useLegacyClass: MidDep },
		]);

		const instance = root.createInstance(EntryConsumer, [
			{ provide: "leafDep", useValue: { tag: "override-leaf" } },
		]);

		assert.equal(instance.$leafDep.tag, "override-leaf");
		// The nested dependency is constructed by its owning injector, so the
		// per-call override must not leak into it — Yok's bag never propagated.
		assert.equal(instance.$midDep.$leafDep.tag, "root-leaf");
	});

	it("applies a raw ctorArguments bag with own-key semantics and no $ normalization", () => {
		const root = new Injector([
			{ provide: "leafDep", useValue: { tag: "root-leaf" } },
			{ provide: "midDep", useLegacyClass: MidDep },
		]);
		const fakeMid = { fake: "mid" };

		const instance = root.createInstance(EntryConsumer, [], {
			$midDep: fakeMid,
		});

		assert.strictEqual(instance.$midDep, fakeMid);
		assert.equal(instance.$leafDep.tag, "root-leaf");
	});

	it("invokes lowercase resolvers as factories instead of new-ing them", () => {
		const injector = new Injector([
			{
				provide: "factoryMade",
				useLegacyClass: function makeThing() {
					return { viaFactory: true };
				},
			},
		]);

		assert.isTrue(injector.get<any>("factoryMade").viaFactory);
	});
});

describe("di: inject()", () => {
	it("works in field initializers during construction", () => {
		class UsesInject {
			public greeter = inject(Greeter);
			public injector = inject(Injector);
		}
		const injector = new Injector([
			provide(Greeter, GreeterImpl),
			{ provide: "usesInject", useClass: UsesInject },
		]);

		const instance = injector.get<UsesInject>("usesInject");
		assert.instanceOf(instance.greeter, GreeterImpl);
		assert.strictEqual(instance.injector, injector);
	});

	it("throws outside an injection context", () => {
		assert.throws(() => inject(Greeter), /injection context/);
	});

	it("restores the previous context, including across nesting", () => {
		const outer = new Injector();
		const inner = new Injector();

		runInInjectionContext(outer, () => {
			runInInjectionContext(inner, () => {
				assert.strictEqual(inject(Injector), inner);
			});
			assert.strictEqual(inject(Injector), outer);
		});
		assert.throws(() => inject(Injector), /injection context/);
	});
});

describe("di: register semantics", () => {
	it("a non-shared object literal has no resolver — Yok quirk preserved", () => {
		const injector = new Injector([
			{ provide: "literalTransient", useValue: {}, shared: false },
		]);

		assert.throws(
			() => injector.get("literalTransient"),
			/no resolver registered/,
		);
	});

	it("re-registering a shared value replaces the cached instance", () => {
		const injector = new Injector([{ provide: "config", useValue: { v: 1 } }]);
		assert.equal(injector.get<any>("config").v, 1);

		injector.register({ provide: "config", useValue: { v: 2 } });
		assert.equal(injector.get<any>("config").v, 2);
	});

	it("re-registering a resolver keeps an already-cached instance", () => {
		const injector = new Injector([
			{ provide: "svc", useFactory: () => ({ v: 1 }) },
		]);
		const first = injector.get("svc");

		injector.register({ provide: "svc", useFactory: () => ({ v: 2 }) });
		assert.strictEqual(injector.get("svc"), first);
	});

	it("a contract registration joins an existing record under the same name", () => {
		const injector = new Injector([
			{ provide: "diTestGreeter", useValue: { preexisting: true } },
		]);
		const cached = injector.get("diTestGreeter");

		injector.register(provide(Greeter, GreeterImpl));

		// Mutate-not-replace: the class key now aliases the same record, whose
		// cached instance wins over the newly registered resolver.
		assert.strictEqual(injector.get(Greeter), cached);
	});

	it("enumerates registered names by prefix", () => {
		const injector = new Injector([
			{ provide: "commands.build", useValue: {} },
			{ provide: "commands.run", useValue: {} },
			{ provide: "unrelated", useValue: {} },
		]);

		assert.sameMembers(injector.getRegisteredNames("commands."), [
			"commands.build",
			"commands.run",
		]);
	});
});

describe("di: type providers", () => {
	it("registers a bare class as a provider of itself", () => {
		class Widget {}
		const injector = new Injector([Widget]);

		const first = injector.get(Widget);
		assert.instanceOf(first, Widget);
		assert.strictEqual(injector.get(Widget), first);

		class Gadget {}
		injector.register(Gadget);
		assert.instanceOf(injector.get(Gadget), Gadget);
		assert.instanceOf(injector.createChild([Widget]).get(Widget), Widget);
	});
});

describe("di: multi providers", () => {
	const HOOKS = new InjectionToken<string[]>("diTestMultiHooks");

	it("collects every multi provider for a token into an array, in order", () => {
		const injector = new Injector([
			{ provide: HOOKS, multi: true, useValue: "first" },
			{ provide: HOOKS, multi: true, useFactory: () => "second" },
		]);
		injector.register({ provide: HOOKS, multi: true, useValue: "third" });

		assert.deepEqual(injector.get(HOOKS), ["first", "second", "third"]);
	});

	it("resolves each entry once and answers optional lookups", () => {
		let built = 0;
		const injector = new Injector([
			{
				provide: HOOKS,
				multi: true,
				useFactory: () => {
					built++;
					return "built";
				},
			},
		]);

		injector.get(HOOKS);
		injector.get(HOOKS);

		assert.equal(built, 1);
		assert.isNull(new Injector([]).get(HOOKS, { optional: true }));
	});

	it("lets a child's entries shadow the parent's array", () => {
		const parent = new Injector([
			{ provide: HOOKS, multi: true, useValue: "parent" },
		]);
		const child = parent.createChild([
			{ provide: HOOKS, multi: true, useValue: "child" },
		]);

		assert.deepEqual(child.get(HOOKS), ["child"]);
		assert.deepEqual(parent.createChild([]).get(HOOKS), ["parent"]);
	});

	it("refuses to mix multi and single providers on one token", () => {
		assert.throws(
			() =>
				new Injector([
					{ provide: HOOKS, multi: true, useValue: "a" },
					{ provide: HOOKS, useValue: "b" },
				]),
			/takes multi providers/,
		);
		assert.throws(
			() =>
				new Injector([
					{ provide: HOOKS, useValue: "b" },
					{ provide: HOOKS, multi: true, useValue: "a" },
				]),
			/registered as a single provider/,
		);
	});
});

describe("di: providedIn scopes", () => {
	const SCOPED_ARGS = new InjectionToken<{ args: string[] }>(
		"diTestScopedArgs",
	);

	@Contract({ name: "diTestScopedMarkedContract", providedIn: "invocation" })
	abstract class MarkedContract {
		abstract id: number;
	}

	@Contract({ name: "diTestScopedPlainContract" })
	abstract class PlainContract {
		abstract id: number;
	}

	let seq = 0;

	class Counter {
		public id = ++seq;
	}

	@ProvidedIn("invocation")
	class MarkedCounter {
		public id = ++seq;
	}

	@ProvidedIn("root")
	class RootMarkedCounter {
		public id = ++seq;
	}

	const invocationOf = (root: Injector, providers: any[] = []): Injector =>
		root.createChild(providers, { scope: "invocation" });

	it("instantiates once per scoped injector, not on the record's owner", () => {
		const root = new Injector([
			{
				provide: "diTestScopedCounter",
				providedIn: "invocation",
				useClass: Counter,
			},
		]);
		const first = invocationOf(root);
		const second = invocationOf(root);

		const a = first.get<Counter>("diTestScopedCounter");
		assert.strictEqual(first.get("diTestScopedCounter"), a);
		assert.notStrictEqual(second.get("diTestScopedCounter"), a);
		assert.strictEqual(first.createChild().get("diTestScopedCounter"), a);
	});

	it("resolves the instance's inject() dependencies against the scoped injector", () => {
		class ReadsArgs {
			public args = inject(SCOPED_ARGS);
			public injector = inject(Injector);
		}
		const root = new Injector([
			{
				provide: "diTestScopedReader",
				providedIn: "invocation",
				useClass: ReadsArgs,
			},
		]);
		const payload = { args: ["one"] };
		const invocation = invocationOf(root, [
			{ provide: SCOPED_ARGS, useValue: payload },
		]);

		const reader = invocation
			.createChild()
			.get<ReadsArgs>("diTestScopedReader");
		assert.strictEqual(reader.args, payload);
		assert.strictEqual(reader.injector, invocation);
	});

	it("resolves a legacy class's $-parameters against the scoped injector", () => {
		class LegacyReader {
			constructor(public $diTestScopedArgs: any) {}
		}
		const root = new Injector([
			{
				provide: "diTestScopedLegacy",
				providedIn: "invocation",
				useLegacyClass: LegacyReader,
			},
		]);
		const payload = { args: ["legacy"] };
		const invocation = invocationOf(root, [
			{ provide: SCOPED_ARGS, useValue: payload },
		]);

		assert.strictEqual(
			invocation.get<LegacyReader>("diTestScopedLegacy").$diTestScopedArgs,
			payload,
		);
	});

	it("reads @ProvidedIn from useClass, useLegacyClass and a bare class provider", () => {
		const root = new Injector([
			{ provide: "diTestScopedViaUseClass", useClass: MarkedCounter },
			{ provide: "diTestScopedViaLegacy", useLegacyClass: MarkedCounter },
			MarkedCounter,
		]);
		const invocation = invocationOf(root);

		for (const token of <any[]>[
			"diTestScopedViaUseClass",
			"diTestScopedViaLegacy",
			MarkedCounter,
		]) {
			assert.throws(
				() => root.get(token),
				/provided in the 'invocation' scope/,
			);
			const instance = invocation.get(token);
			assert.instanceOf(instance, MarkedCounter);
			assert.strictEqual(invocation.get(token), instance);
		}
	});

	it("reads providedIn from the token's @Contract", () => {
		class MarkedImpl extends MarkedContract {
			public id = ++seq;
		}
		const root = new Injector([provide(MarkedContract, MarkedImpl)]);

		assert.throws(
			() => root.get(MarkedContract),
			/diTestScopedMarkedContract is provided in the 'invocation' scope/,
		);
		const first = invocationOf(root).get(MarkedContract);
		assert.instanceOf(first, MarkedImpl);
		assert.notStrictEqual(invocationOf(root).get(MarkedContract), first);
	});

	it("prefers the provider field, then the class marker, then the token marker", () => {
		class PlainImpl extends MarkedContract {
			public id = ++seq;
		}
		@ProvidedIn("root")
		class RootMarkedImpl extends MarkedContract {
			public id = ++seq;
		}
		@ProvidedIn("invocation")
		class InvocationMarkedImpl extends PlainContract {
			public id = ++seq;
		}

		const fieldOverToken = new Injector([
			{ provide: MarkedContract, providedIn: "root", useClass: PlainImpl },
		]);
		assert.strictEqual(
			invocationOf(fieldOverToken).get(MarkedContract),
			fieldOverToken.get(MarkedContract),
		);

		const fieldOverClass = new Injector([
			{
				provide: "diTestScopedFieldOverClass",
				providedIn: "root",
				useClass: MarkedCounter,
			},
		]);
		assert.instanceOf(
			fieldOverClass.get("diTestScopedFieldOverClass"),
			MarkedCounter,
		);

		const classOverToken = new Injector([
			provide(MarkedContract, RootMarkedImpl),
		]);
		assert.instanceOf(classOverToken.get(MarkedContract), RootMarkedImpl);

		const classOverUnmarkedToken = new Injector([
			provide(PlainContract, InvocationMarkedImpl),
		]);
		assert.throws(
			() => classOverUnmarkedToken.get(PlainContract),
			/provided in the 'invocation' scope/,
		);
	});

	it("matches 'root' to the injector with no parent", () => {
		const root = new Injector([RootMarkedCounter]);
		const nested = invocationOf(root).createChild();

		assert.strictEqual(
			nested.get(RootMarkedCounter),
			root.get(RootMarkedCounter),
		);
	});

	it("matches any scope name given to createChild", () => {
		const root = new Injector([
			{
				provide: "diTestScopedDevice",
				providedIn: "device",
				useClass: Counter,
			},
		]);
		const deviceA = root.createChild([], { scope: "device" });
		const deviceB = root.createChild([], { scope: "device" });

		assert.throws(
			() => invocationOf(root).get("diTestScopedDevice"),
			/provided in the 'device' scope/,
		);
		assert.notStrictEqual(
			deviceA.get("diTestScopedDevice"),
			deviceB.get("diTestScopedDevice"),
		);
	});

	it("throws outside the scope even for an optional lookup", () => {
		const root = new Injector([
			{
				provide: "diTestScopedOutside",
				providedIn: "invocation",
				useClass: Counter,
			},
		]);
		const expected =
			/diTestScopedOutside is provided in the 'invocation' scope; it cannot be resolved from outside one/;

		assert.throws(() => root.get("diTestScopedOutside"), expected);
		assert.throws(
			() => root.createChild().get("diTestScopedOutside"),
			expected,
		);
		assert.throws(
			() => root.get("diTestScopedOutside", { optional: true }),
			expected,
		);
		runInInjectionContext(root, () => {
			assert.throws(
				() => inject("diTestScopedOutside", { optional: true }),
				expected,
			);
		});
	});

	it("refuses a root singleton that injects an invocation-scoped service", () => {
		class HoldsScoped {
			public scoped = inject("diTestScopedHeld");
		}
		const root = new Injector([
			{
				provide: "diTestScopedHeld",
				providedIn: "invocation",
				useClass: Counter,
			},
			{ provide: "diTestScopedHolder", useClass: HoldsScoped },
		]);

		// The singleton is built by its owner, the root, even when the lookup
		// starts inside an invocation.
		assert.throws(
			() => invocationOf(root).get("diTestScopedHolder"),
			/diTestScopedHeld is provided in the 'invocation' scope/,
		);
	});

	it("reports a cycle between scoped services", () => {
		class ScopedA {
			constructor(public $diTestScopedCycleB: any) {}
		}
		class ScopedB {
			constructor(public $diTestScopedCycleA: any) {}
		}
		const root = new Injector([
			{
				provide: "diTestScopedCycleA",
				providedIn: "invocation",
				useLegacyClass: ScopedA,
			},
			{
				provide: "diTestScopedCycleB",
				providedIn: "invocation",
				useLegacyClass: ScopedB,
			},
		]);

		assert.throws(
			() => invocationOf(root).get("diTestScopedCycleA"),
			/Cyclic dependency detected on dependency 'diTestScopedCycleA'/,
		);
	});

	it("leaves disposal of scoped instances to the scoped injector", () => {
		const disposed: string[] = [];
		const root = new Injector([
			{
				provide: "diTestScopedDisposable",
				providedIn: "invocation",
				useFactory: () => ({ dispose: () => disposed.push("scoped") }),
			},
		]);
		const invocation = invocationOf(root);
		invocation.get("diTestScopedDisposable");

		root.dispose();
		assert.deepEqual(disposed, []);

		invocation.dispose();
		assert.deepEqual(disposed, ["scoped"]);
	});

	it("rejects providedIn on a multi provider", () => {
		const MULTI = new InjectionToken<number[]>("diTestScopedMulti");
		const expected =
			/InjectionToken\(diTestScopedMulti\): a multi provider cannot be scoped with providedIn; scope the token's consumers instead/;

		assert.throws(
			() =>
				new Injector([
					{
						provide: MULTI,
						multi: true,
						providedIn: "invocation",
						useValue: 1,
					},
				]),
			expected,
		);
		assert.throws(
			() =>
				new Injector().register({
					provide: MULTI,
					multi: true,
					useClass: MarkedCounter,
				}),
			expected,
		);
	});
});
