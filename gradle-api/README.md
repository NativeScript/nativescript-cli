# org.nativescript:gradle-api

A small, versioned Gradle library that NativeScript plugins call from their Android Gradle files
instead of guessing where things are on disk.

```groovy
// platforms/android/include.gradle
apply plugin: "org.nativescript.api"

def ns = nativescript
logger.info("App_Resources: ${ns.appResourcesDir}")
```

- **For plugin authors:** [Why](#why), [Adopting it](#adopting-it), [API](#api),
  [Recipes](#recipes), [Compatibility](#compatibility), [Rules](#rules-for-plugin-authors).
- **For CLI/runtime maintainers:** [How it works](#how-it-works), [The facts file](#the-facts-file),
  [Versioning rules](#versioning-rules), [Releasing](#releasing).

## Why

Plugin Gradle files today find things by building paths themselves:

```groovy
// a real-world include.gradle
def widgetsDir = "$USER_PROJECT_ROOT/node_modules/@nativescript/core/platforms/android"
// another one
maven { url = project.file('../../../node_modules/detox/Detox-android') }
// and the most common one
if (!project.hasProperty("tempBuild")) { apply plugin: 'com.google.gms.google-services' }
```

Every one of these bakes in a detail the CLI should be free to change: where `node_modules` is,
where the CLI writes a plugin's built `.aar`, how many `../` lead to the project root, or what the
`tempBuild` property means. This library answers those questions for you. The CLI tells the library
where things are; on CLIs that don't, the library works it out the way those CLIs always did.

## Adopting it

Minimum Android runtime: **8.4** (Gradle 7.5, JDK 11), the oldest toolchain the library is built
for. If your plugin still supports older runtimes, keep your current Gradle code for them: adding the
library to `buildscript.gradle` breaks their builds.

It works with every NativeScript CLI. CLI 9.2+ gives it exact answers; older CLIs use the fallback.

**1. Put the library on the build classpath** in `platforms/android/buildscript.gradle`:

```groovy
repositories {
    mavenCentral()
}
dependencies {
    classpath "org.nativescript:gradle-api:<version>"
}
```

(No version is published yet; this README is part of the proposal.)

Pin the **lowest** version that has what you need, never a range or `+`. Every plugin in an app adds
the library to the same classpath and Gradle keeps the highest version, which is always backwards
compatible.

**2. Apply it at the top of `platforms/android/include.gradle`:**

```groovy
apply plugin: "org.nativescript.api"
```

Applying it again from several plugins is fine.

**3. Use `nativescript`** in the rest of the file (see [API](#api) and [Recipes](#recipes)).

### The one thing to know: your plugin's own `.aar` build

The CLI builds a plugin's own Android sources into an `.aar` in a separate, temporary Gradle build.
In that build, **only the `dependencies {}` and `repositories {}` blocks of your `include.gradle`
run**: the CLI copies them out of the file. Nothing else in the file runs there, including the
`apply plugin:` line.

On CLI 9.2+ with `android.readOnlyNodeModules` enabled, the CLI loads your `buildscript.gradle` in
that build and applies the library for you. On older CLIs it doesn't, so the library isn't
available there. Inside those two blocks, look the extension up instead of assuming it exists, and
keep the old code as the fallback:

```groovy
dependencies {
    def ns = project.extensions.findByName("nativescript")
    if (ns != null && ns.pluginBuild) {
        compileOnly ns.plugin("@nativescript/core").artifacts
    } else if (project.hasProperty("tempBuild")) {
        compileOnly fileTree(dir: "$USER_PROJECT_ROOT/node_modules/@nativescript/core/platforms/android", include: "*.aar")
    }
}
```

Elsewhere in `include.gradle` (outside those two blocks) you can use `nativescript` directly.

Never refer to the library's classes from `include.gradle` (`import org.nativescript.gradle...`,
`NativeScript.of(project)`): Gradle compiles applied scripts with a class loader that can't see
them, even when the plugin itself is applied. Always go through the `nativescript` extension.
`NativeScript.of(project)` is for Gradle code written in Java or Kotlin.

The CLI finds those blocks by searching for the first occurrence of the words `dependencies` and
`repositories` in the file, so keep those words out of comments and code above the real blocks, and
never put a `buildscript {}` block in `include.gradle`.

## API

`apiLevel` is `1` for everything below. New methods raise it; nothing is ever removed or changed.

| Member | Returns |
|---|---|
| `nativescript.apiLevel` | The API level of the library on the classpath. |
| `nativescript.has(String)` | Whether the CLI guarantees a capability. Always `false` on CLIs before 9.2. |
| `nativescript.pluginBuild` | `true` in the CLI's temporary build of some plugin's `.aar`. |
| `nativescript.self` | In a plugin build, the plugin being built (see below). `null` in the app build. |
| `nativescript.isBuildingPlugin(String)` | Whether the plugin build is building that npm package. |
| `nativescript.projectDir` | The NativeScript project root (the folder with the app's `package.json`). |
| `nativescript.appDir` | The app source folder (`appPath` in `nativescript.config`). |
| `nativescript.appResourcesDir` | `App_Resources`. |
| `nativescript.plugin(String)` | A native plugin by npm name. Throws if the app doesn't have it. |
| `nativescript.findPlugin(String)` | Same, or `null`. |
| `nativescript.resolvePackage(String)` | Any installed npm package's folder. Throws if not found. |
| `nativescript.findPackage(String)` | Same, or `null`. |

A plugin (`PluginInfo`):

| Member | Returns |
|---|---|
| `name` | The npm package name. |
| `packageDir` | The installed package. Treat it as read-only. |
| `nativeDir` | Where Gradle reads the plugin's Android files from. |
| `artifacts` | Every `.aar` and `.jar` under `nativeDir`, as a lazy `FileCollection`. |
| `aarName`, `aar` | The name and location of the `.aar` the CLI builds from the plugin's sources (the file only exists if it has sources). `null` on CLIs before 9.2, and for installed packages the CLI doesn't list as plugins. |
| `options` | Per-plugin options. Reserved; empty for now. |

`plugin` / `findPlugin` know the plugins the CLI lists (packages declaring Android support in their
`package.json`) plus any installed package with a `platforms/android` folder, with every CLI version.
For any other npm package, use `resolvePackage` / `findPackage`.

**`pluginBuild` and `self` in practice.** Your full `include.gradle` runs in the app build and in
the `.aar` builds of plugins that *depend on you*. So a full `include.gradle` that sees
`pluginBuild == true` is always running inside another plugin's build, and `self` is that other
plugin. This is what the common `tempBuild` check was really testing:

```groovy
// apply the Google Services plugin only to the app, not to dependents' aar builds
if (!nativescript.pluginBuild) {
    apply plugin: "com.google.gms.google-services"
}
```

`resolvePackage` looks for `node_modules/<name>` from the project root upwards, like Node. It's
best effort: package managers that don't hoist (pnpm's default layout) may not resolve packages
your app doesn't depend on directly.

## Recipes

**Compile against another plugin's Android library (e.g. core's widgets) in your own `.aar` build:**
the guarded block in [The one thing to know](#the-one-thing-to-know-your-plugins-own-aar-build).
Use `compileOnly`, not `implementation`: an Android library can't bundle local `.aar` files, and the
app build already links every plugin.

**Read a file from App_Resources:**

```groovy
def config = new File(nativescript.appResourcesDir, "Android/my-plugin.json")
```

**Point at another npm package's Maven repository** (detox, react-native style):

```groovy
repositories {
    def ns = project.extensions.findByName("nativescript")
    def detox = ns != null ? ns.findPackage("detox") : file("$USER_PROJECT_ROOT/node_modules/detox")
    maven { url = new File(detox, "Detox-android") }
}
```

**Only in the app build:** `if (!nativescript.pluginBuild) { ... }`.

## Compatibility

| | CLI 9.1 and older | CLI 9.2+ | CLI 9.2+ with `readOnlyNodeModules` |
|---|---|---|---|
| Plugin not using the library | Unchanged | Unchanged | Gradle reads its files from a copy in `platforms/android/.ns-plugins/`, and its own `buildscript.gradle` also runs in its own `.aar` build |
| Plugin using the library, app build | Fallback rules | Facts from the CLI | Facts from the CLI |
| Plugin using the library, its own `.aar` build | Library not loaded: the guarded fallback runs | Library not loaded: the guarded fallback runs | Library loaded |

The fallback rules are exactly what CLIs up to 9.1 do: plugins live in
`node_modules/<name>/platforms/android`, the project root is `USER_PROJECT_ROOT`, the app and
App_Resources come from `-PappPath` / `-PappResourcesPath`, and `tempBuild` marks a plugin build.

Building `platforms/android` from Android Studio works too: CLI 9.2+ leaves the facts file there
after `ns prepare android`, so the library has the same answers without the CLI's command-line
flags.

### For app developers: keeping `node_modules` read-only (opt-in)

```ts
// nativescript.config.ts
export default {
  android: { readOnlyNodeModules: true },
} satisfies NativeScriptConfig;
```

With this, the CLI never writes into `node_modules`. It copies each native plugin's
`platforms/android` and `package.json` into `platforms/android/.ns-plugins/<name>/`, builds plugin
`.aar`s there, and points the Android build at the copies. No runtime change is needed (checked
against the runtime's Gradle templates from 6.5.3 to current), and Android Studio builds use the
copies too. Earlier builds may have left `.aar` files inside `node_modules`;
reinstall `node_modules` once after turning this on to get rid of them.

## Rules for plugin authors

- Pin the lowest library version you need; no ranges.
- Everything in the version you pin is always there: an app may end up with a newer library, never
  an older one. To use something newer only when it's available, check `apiLevel` (or `has(...)`)
  first.
- Never build paths into `node_modules` or into the CLI's output folders; ask the library.
- In `dependencies {}` / `repositories {}`, use the guarded lookup shown above.

## How it works

```
nativescript.config.ts ─┐
package.json files ─────┼─> ns prepare android ─> platforms/android/nativescript-gradle.json
App_Resources ──────────┘                          (and dependencies.json, as before)
                                                              │
                                     -Pnativescript.factsFile │ or found next to the app build
                                                              ▼
        plugin buildscript.gradle ─> org.nativescript:gradle-api ─> `nativescript` extension
                                                              │
                                     no facts file (CLI ≤ 9.1)│
                                                              ▼
                                     fallback: dependencies.json, USER_PROJECT_ROOT, tempBuild
```

The CLI decides everything (where plugins are, what they're called, project layout) and writes the
answers down. Gradle only reads them. The library hides whether the answer came from the facts file
or from the fallback.

## The facts file

`platforms/android/nativescript-gradle.json`, written by `ns prepare android` before any plugin is
built. The schema is [`schema/nativescript-gradle.schema.json`](schema/nativescript-gradle.schema.json).

```json
{
  "schemaVersion": 1,
  "cli": { "version": "9.2.0" },
  "runtime": { "name": "@nativescript/android", "version": "9.0.0" },
  "capabilities": [],
  "project": { "root": "../..", "appDir": "../../src", "appResourcesDir": "../../App_Resources" },
  "plugins": [
    {
      "name": "@nativescript/core",
      "packageDir": "../../node_modules/@nativescript/core",
      "nativeDir": "../../node_modules/@nativescript/core/platforms/android",
      "aarName": "core",
      "aar": "../../node_modules/@nativescript/core/platforms/android/core.aar",
      "dependencies": [],
      "options": {}
    }
  ]
}
```

- Paths are relative to the file, with forward slashes, so the folder can move.
- `dependenciesJson.sha256` is the hash of the `dependencies.json` the CLI wrote next to it. A CLI
  that doesn't know about this file (9.1 and older, e.g. after a downgrade) still rewrites
  `dependencies.json` but leaves this file behind; the library notices the mismatch, warns, and uses
  the fallback rules instead of outdated answers.
- `capabilities` lists behaviours the CLI guarantees, so the library can tell "not set" apart from
  "this CLI doesn't know about it". Empty in version 1.
- `options` is reserved for per-plugin settings from `nativescript.config`.

## Versioning rules

These are what keep old plugins working on new CLIs and new plugins working on old ones.

**Facts file:** fields are only added. A field never changes meaning and is never removed.
`schemaVersion` goes up when fields are added; readers accept any version and read what they know.
Paths are relative. Anything a newer CLI does differently is expressed as data in the file, not as a
rule readers must know.

**Library:** the public API only grows. Old methods keep working forever; behaviour that depends on
the CLI checks the facts file or a capability before relying on it. The library compiles for Java
11 and the Gradle 7.5 API, the oldest toolchain supported NativeScript runtimes use.

## Releasing

Builds and tests run in `.github/workflows/gradle_api.yml`. Pushing a tag `gradle-api-v<version>`
that matches `VERSION_NAME` in `gradle.properties` publishes to Maven Central, from the protected
`maven-central` GitHub environment. It needs these environment secrets:

- `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`: a Central Portal user token with publishing
  rights on the `org.nativescript` namespace.
- `MAVEN_CENTRAL_SIGNING_KEY`, `MAVEN_CENTRAL_SIGNING_KEY_PASSWORD`: the release signing key
  (ASCII-armored) and its passphrase. The public key must be on keys.openpgp.org and
  keyserver.ubuntu.com.

Publishing uses `com.vanniktech.maven.publish` 0.35.0, the newest release that runs on the Gradle
8.14 wrapper; moving to Gradle 9 allows newer ones.

Local development needs JDK 17 installed (the functional tests run Gradle 7.5.1, which doesn't
start on newer JDKs):

```bash
cd gradle-api
./gradlew check                 # unit + functional tests (AGP tests need ANDROID_HOME)
./gradlew publishToMavenLocal   # try it from a local app
```
