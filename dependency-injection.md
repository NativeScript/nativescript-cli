Dependency Injection
====================

The NativeScript CLI is migrating from name-based dependency injection (the
`$injector` global, where a constructor parameter named `$doctorService`
resolves the service registered under the string `"doctorService"`) to a typed,
token-based container. Both APIs are backed by **one container**, so they can be
mixed freely: a service registered under a legacy string name is resolvable
through its typed token and vice versa. The legacy `$injector` surface remains
fully supported, is marked `@deprecated` in-editor, and its usage is traced at
runtime so removal can be staged over releases.

Inside the CLI, import from `lib/common/di`. Extension and hook authors import
the same API from the `nativescript/contracts` subpath (see
[For extension and hook authors](#for-extension-and-hook-authors)).

At a glance
-----------

```ts
import { inject, DoctorService } from "nativescript/contracts";

class PlatformChecker {
	private doctorService = inject(DoctorService); // typed, no decorators needed

	async check(projectDir: string): Promise<boolean> {
		return this.doctorService.canExecuteLocalBuild({ projectDir });
	}
}
```

Services that have no typed token yet remain reachable by their registry name —
`inject("logger")` — but that is the migration bridge, not the API: prefer the
token wherever one exists, and mint a token rather than a new string name.

Tokens: `@Contract`
-------------------

A token is an abstract class annotated with `@Contract`. The class is both the
compile-time type and the runtime lookup key; the decorator records the token's
canonical string name:

```ts
import { Contract } from "nativescript/contracts";

@Contract({ name: "doctorService" }) // canonical form, no `$`
export abstract class DoctorService {
	abstract canExecuteLocalBuild(configuration?: {
		platform?: string;
		projectDir?: string;
	}): Promise<boolean>;
}
```

Rules:

- **The name is an explicit string literal** — never derived from `class.name`,
  which changes under minification.
- Names are minted at this single choke point: declaring two contracts with the
  same name **throws at load time**, because a duplicate would silently alias
  two tokens.
- The options object leaves room for future fields without changing call sites.
- Implementations do not become tokens by extending or implementing a contract;
  only the decorated class itself is a token.

Resolving: `inject()` and `Injector`
------------------------------------

`inject(token)` returns the singleton for a token from the current injection
context. It is **synchronous by design** and valid only:

- in field initializers,
- in constructor bodies,
- in provider factories,
- inside an explicit `runInInjectionContext(injector, fn)`.

It is **not** valid after an `await`. For late or conditional lookups,
self-inject the `Injector` and use `get()`:

```ts
import { inject, Injector } from "nativescript/contracts";

class EnvironmentChecker {
	private injector = inject(Injector);

	async check(projectDir: string) {
		await somethingAsync();
		return this.injector.get(DoctorService); // fine after await
	}
}
```

`Injector.get()` accepts a contract class, a string name, or a `$`-prefixed
string name — all three return the same instance. The string forms exist for
interoperability with the legacy registry; use the class token whenever one
exists.

Registering: providers
----------------------

```ts
import { provide, provideLazy, Injector } from "nativescript/contracts";

const injector = new Injector([
	// eager class binding; type-checked: the impl must satisfy the token
	provide(DoctorService, DoctorServiceImpl),

	// deferred loading: the module is require()d on first resolution only
	provideLazy(DoctorService, () => require("./doctor-service").DoctorServiceImpl),

	{ provide: Config, useValue: { DISABLE_HOOKS: false } },
	{ provide: Dispatcher, useFactory: () => createDispatcher(), shared: false },
]);

// registration is also allowed after construction; re-registering a token
// updates the existing record in place
injector.register(provide(ProjectNameService, ProjectNameServiceImpl));
```

Provider kinds:

| Kind | Shape | Notes |
|---|---|---|
| Class | `provide(Token, Impl)` / `{ provide, useClass }` | constructed with `new Impl()` inside an injection context, so `inject()` works in its fields |
| Lazy class | `provideLazy(Token, () => Impl)` / `{ provide, useLazyClass }` | loader runs on first `get()` only — keeps startup lazy |
| Value | `{ provide, useValue }` | registered instance; re-registering replaces the cached instance |
| Factory | `{ provide, useFactory }` | called inside an injection context |

`shared: false` makes a provider transient: every resolution constructs a fresh
instance. Transient instances are still retained by the container so
`dispose()` reaches them.

String keys are accepted anywhere a token is (`{ provide: "logger", useValue }`)
— that is how the legacy facade registers, and how per-call overrides address
not-yet-migrated dependencies. New registrations should mint a `@Contract`
token instead of a new string name.

For per-call construction with overrides (a fresh instance of a class with some
dependencies replaced), use `createInstance`:

```ts
const debugService = injector.createInstance(IOSDeviceDebugService, [
	{ provide: "device", useValue: device },
]);
```

Overrides shadow **one level deep only** — the direct dependencies of the class
being constructed. Nested dependencies are constructed by the injector that
owns them and never see the per-call providers.

Resolution semantics
--------------------

- Lookup is **class object first, token name on a miss**, checked per injector
  level before delegating to the parent. Both keys index the same provider
  record, so re-registering a service by its string name (as plugins are
  documented to do with `$logger`) stays visible to `inject(Logger)` consumers.
- A leading `$` is stripped from string tokens: `get("$fs")` and `get("fs")`
  are the same registration.
- The name fallback also makes **duplicated contract copies interchangeable**:
  if an extension's dependency tree carries its own copy of a contract class,
  that copy resolves to the same provider by name. "Works locally, breaks when
  installed" is not a failure mode of this design.
- Cyclic dependencies fail with the full resolution path
  (`Cyclic dependency detected on dependency 'a'. Resolution path: a -> b -> a`).

Child scopes
------------

`injector.createChild(providers)` creates a scope that shadows its parent for
the given tokens and falls through for everything else. Sibling scopes are
isolated. Scopes are how per-invocation data (hook payloads, per-call
overrides) is layered over the shared singletons without ever entering the
root container.

`forwardRef`
------------

Provider arrays are evaluated at module load. When a token is declared later in
the same file (TDZ) or reached through a circular import, wrap the reference in
a thunk; it is read only when the injector processes the provider:

```ts
import { forwardRef } from "nativescript/contracts";

const providers = [
	{ provide: forwardRef(() => DoctorService), useClass: DoctorServiceImpl },
];
```

`forwardRef` defers *references*, not construction — it cannot break an
instantiation cycle between two services. For that, self-inject the `Injector`
and resolve late (see above).

Working alongside the legacy `$injector`
----------------------------------------

The `Yok` facade (`global.$injector`) IS an `Injector` — the class extends the
token-based container — so the new API works on it directly:

```ts
$injector.resolve("doctorService") === $injector.get(DoctorService); // true
$injector.register(provide(DoctorService, DoctorServiceImpl));
runInInjectionContext($injector, () => inject(DoctorService));
```

- Legacy string names are permanent: a contract's token name is its interop
  identity, used by hooks, plugins, and the public API. Nothing is deleted
  per-service.
- Every legacy member (`resolve`, `register`, `require*`, the command-registry
  surface) carries `@deprecated` JSDoc naming its replacement.
- Legacy usage at the external entry points (param-name hooks, require-time
  extension registration, help templating) is reported through a deprecation
  tracer. It logs at trace level today; set `NS_DEPRECATIONS=warn` or
  `NS_DEPRECATIONS=error` to preview the stricter stages that later releases
  will default to.

For extension and hook authors
------------------------------

Depend on `nativescript` itself (as a `peerDependency`, plus a `devDependency`
for local development) and import from the `contracts` subpath:

```ts
import { inject, DoctorService } from "nativescript/contracts";
```

- The subpath resolves through a directory `package.json` — the CLI's
  `package.json` deliberately has **no `exports` map**, so any deep `require()`
  paths you already use keep working.
- The entry point is side-effect-free: importing it never boots a CLI runtime,
  even from a duplicated copy in your dependency tree.
- The existing `$injector`-based extension and hook mechanisms keep working
  unchanged; the typed API is additive.

Available contracts
-------------------

The first tranche, growing as services migrate:

| Token | Legacy name |
|---|---|
| `DoctorService` | `doctorService` |
| `ProjectNameService` | `projectNameService` |

Legacy → new quick reference
----------------------------

`di` below is any `Injector` you hold — including `$injector` itself, which
extends `Injector`.

| Legacy (`$injector`) | New |
|---|---|
| `resolve("name")` | `inject(Token)` in an injection context, or `di.get(Token)` |
| `resolve(SomeClass)` / `resolve(SomeClass, { dep })` | `di.createInstance(SomeClass, [{ provide: "dep", useValue }])` |
| `register("name", Impl)` | `di.register(provide(Token, Impl))` |
| `register("name", instance)` | `di.register({ provide: Token, useValue: instance })` |
| `register("name", Impl, false)` | `di.register({ provide: Token, useClass: Impl, shared: false })` |
| `require("name", "./path")` | `provideLazy(Token, () => require("./path").Impl)` |
| constructor param `$name` | `inject(Token)` field initializer |
