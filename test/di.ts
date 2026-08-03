import { assert } from "chai";
import {
	Injector,
	inject,
	runInInjectionContext,
	Contract,
	provide,
	forwardRef,
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
