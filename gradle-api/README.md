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

CLI 9.2+ also runs your `buildscript.gradle` in that build and applies the library for you, so
`nativescript` is available in those two blocks. Older CLIs don't, so if your plugin supports them,
write those two blocks as shown in [Supporting CLIs before 9.2](#supporting-clis-before-92).

Elsewhere in `include.gradle` (outside those two blocks) you can use `nativescript` directly.

Never refer to the library's classes from `include.gradle` (`import org.nativescript.gradle...`,
`NativeScript.of(project)`): Gradle compiles applied scripts with a class loader that can't see
them, even when the plugin itself is applied. Always go through the `nativescript` extension.
`NativeScript.of(project)` is for Gradle code written in Java or Kotlin.

The CLI finds those blocks by searching for the first occurrence of the words `dependencies` and
`repositories` in the file, so keep those words out of comments and code above the real blocks, and
never put a `buildscript {}` block in `include.gradle`.

### Supporting CLIs before 9.2

Before 9.2, the CLI doesn't run your own `buildscript.gradle` in your `.aar` build, so the
extension is usually missing in your copied `dependencies {}` / `repositories {}` blocks. (It is
there when a plugin yours depends on loaded the library, so don't treat its presence as a CLI
version check.) Look it up, and fall back to what those CLIs provide when it's missing:

```groovy
dependencies {
    if (project.hasProperty("tempBuild")) {
        def ns = project.extensions.findByName("nativescript")
        if (ns != null) {
            compileOnly ns.plugin("@nativescript/core").artifacts
        } else {
            compileOnly fileTree(dir: "$USER_PROJECT_ROOT/node_modules/@nativescript/core/platforms/android", include: ["**/*.aar", "**/*.jar"])
        }
    }
}
```

- `tempBuild` is set in every plugin `.aar` build by every CLI since 8.4: your own build, and the
  builds of plugins that depend on yours, where your full `include.gradle` runs. It needs no
  library, so it is the outer check.
- Each copied block runs on its own, without the rest of the file: blocks can't share variables,
  so each looks the extension up itself.

What older CLIs provide in those blocks:

| Library | CLIs before 9.2 |
|---|---|
| `ns.pluginBuild` | `project.hasProperty("tempBuild")` |
| `ns.projectDir` | `file(USER_PROJECT_ROOT)` |
| `ns.appResourcesDir` | `file(getAppResourcesPath())` |
| `ns.findPackage("<name>")` | `file("$USER_PROJECT_ROOT/node_modules/<name>")` |
| `ns.plugin("<name>").artifacts` | `fileTree(dir: "$USER_PROJECT_ROOT/node_modules/<name>/platforms/android", include: ["**/*.aar", "**/*.jar"])` |

The right-hand column only holds in a plugin's `.aar` build, and assumes a hoisted `node_modules`
at the project root.

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
the block in [Supporting CLIs before 9.2](#supporting-clis-before-92).
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

| | CLI 9.1 and older | CLI 9.2+ |
|---|---|---|
| Plugin not using the library | Unchanged | Its own `buildscript.gradle` also runs in its own `.aar` build |
| Plugin using the library, app build | Fallback rules | Facts from the CLI |
| Plugin using the library, its own `.aar` build | Library not applied unless a plugin it depends on loaded it: the [fallback branch](#supporting-clis-before-92) runs | Library applied |

With [`pluginBuildLocation: "platforms"`](#for-app-developers-building-plugins-in-platformsandroid-opt-in)
(CLI 9.2+), Gradle also reads every plugin's files from a copy in `platforms/android/.ns-plugins/`.

The fallback rules are exactly what CLIs up to 9.1 do: plugins live in
`node_modules/<name>/platforms/android`, the project root is `USER_PROJECT_ROOT`, the app and
App_Resources come from `-PappPath` / `-PappResourcesPath`, and `tempBuild` marks a plugin build.

Building `platforms/android` from Android Studio works too: CLI 9.2+ leaves the facts file there
after `ns prepare android`, so the library has the same answers without the CLI's command-line
flags.

### For app developers: building plugins in `platforms/android` (opt-in)

```ts
// nativescript.config.ts
export default {
  android: { pluginBuildLocation: "platforms" },
} satisfies NativeScriptConfig;
```

`android.pluginBuildLocation` sets where the CLI builds plugins' native Android code. The default,
`"node_modules"`, builds each plugin's `.aar` inside its package, as CLIs up to 9.1 do. With
`"platforms"`, the CLI never writes into `node_modules`. It copies each native plugin's
`platforms/android` and `package.json` into `platforms/android/.ns-plugins/<name>/`, builds plugin
`.aar`s there, and points the Android build at the copies. No runtime change is needed (checked
against the runtime's Gradle templates from 6.5.3 to current), and Android Studio builds use the
copies too. Earlier builds may have left `.aar` files inside `node_modules`;
reinstall `node_modules` once after turning this on to get rid of them.

`"platforms"` is opt-in while plugins adopt this library, and is expected to become the default in a
future major version of the CLI.

## Rules for plugin authors

- Pin the lowest library version you need; no ranges.
- Everything in the version you pin is always there: an app may end up with a newer library, never
  an older one. To use something newer only when it's available, check `apiLevel` (or `has(...)`)
  first.
- Never build paths into `node_modules` or into the CLI's output folders; ask the library.
- In `dependencies {}` / `repositories {}`, look the extension up and keep a fallback while you
  support CLIs before 9.2 ([how](#supporting-clis-before-92)).

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
