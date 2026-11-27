# org.nativescript:gradle-api

A small, versioned Gradle library that NativeScript plugins call from their Android Gradle files
instead of guessing where things are on disk. It needs **NativeScript CLI 9.2 or newer**.

```groovy
// platforms/android/include.gradle
apply plugin: "org.nativescript.api"

logger.info("App_Resources: ${nativescript.appResourcesDir}")
```

- **For plugin authors:** [Why](#why), [Adopting it](#adopting-it),
  [Your plugin's own `.aar` build](#your-plugins-own-aar-build),
  [Depending on other plugins](#depending-on-other-plugins), [API](#api), [Errors](#errors),
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
`tempBuild` property means. This library answers those questions for you, from a file in which the
CLI writes the answers down.

## Adopting it

Requirements:

- **NativeScript CLI 9.2 or newer** in the apps that use your plugin. The CLI is installed per
  project (`npm i -D nativescript@latest`), and 9.2 builds projects made with older CLIs, so this
  asks nothing of an app beyond updating that dev dependency. With an older CLI, the build stops
  with a message that says so (see [Errors](#errors)).
- **Android runtime 8.4 or newer** (Gradle 7.5, JDK 11), the oldest toolchain the library is built
  for. If your plugin still supports older runtimes, keep your current Gradle code for them: adding
  the library to `buildscript.gradle` breaks their builds.

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

**2. If you use `nativescript` in the app build**, apply the library at the top of
`platforms/android/include.gradle`. The whole file runs in the app build, including its
`repositories {}` and `dependencies {}` blocks; only code inside the `tempBuild` check of
[the next section](#your-plugins-own-aar-build) is skipped there.

```groovy
apply plugin: "org.nativescript.api"
```

Applying it again from several plugins is fine.

**3. Use `nativescript`** (see [API](#api) and [Recipes](#recipes)).

Mention the CLI 9.2+ requirement in your plugin's README and changelog, and release it as a major
version: apps on older CLIs find out at build time, from the check in the next section.

Never refer to the library's classes from `include.gradle` (`import org.nativescript.gradle...`,
`NativeScript.of(project)`): Gradle compiles applied scripts with a class loader that can't see
them, even when the plugin itself is applied. Always go through the `nativescript` extension.
`NativeScript.of(project)` is for Gradle code written in Java or Kotlin.

## Your plugin's own `.aar` build

The CLI builds a plugin's own Android sources into an `.aar` in a separate, temporary Gradle build.
In that build, **only the `repositories {}` and `dependencies {}` blocks of your `include.gradle`
run**: the CLI copies them out of the file. Nothing else in the file runs there, including the
`apply plugin:` line. CLI 9.2+ runs your `buildscript.gradle` in that build and applies the library
itself, so `nativescript` is available in those two blocks.

CLIs before 9.2 don't load the library there, and Gradle would stop with "Could not get unknown
property 'nativescript'", which doesn't tell the app developer what to do. Check for the extension
first and give them a clear message instead:

```groovy
dependencies {
    if (project.hasProperty("tempBuild")) {
        if (project.extensions.findByName("nativescript") == null) {
            throw new GradleException("@nativescript/gradle-api-sample needs NativeScript CLI 9.2 or newer: npm i -D nativescript@latest")
        }
        compileOnly nativescript.plugin("@nativescript/core").artifacts
    }
}
```

- `tempBuild` is set in every plugin `.aar` build by every CLI since 8.4: your own build, and the
  builds of plugins that depend on yours, where your full `include.gradle` runs. The check keeps
  the block out of the app build, which runs it too but already links every plugin.
- Each copied block runs on its own, without the rest of the file, and the CLI copies
  `repositories {}` before `dependencies {}`. If both use `nativescript`, start both with the check.
- With CLI 9.2+ the check always passes in your own build; it exists only for older CLIs.

The CLI finds those blocks by searching for the first occurrence of the words `dependencies` and
`repositories` in the file, so keep those words out of comments and code above the real blocks, and
never put a `buildscript {}` block in `include.gradle`.

## Depending on other plugins

| What your plugin needs | What it writes |
|---|---|
| Another plugin it lists in its `package.json` `dependencies` | Nothing: in its own `.aar` build the CLI adds that plugin's `.aar`/`.jar` files as `implementation`, and in the app build every plugin is linked. |
| A plugin it doesn't list (typically `@nativescript/core`, usually a peer) | `compileOnly nativescript.plugin("...").artifacts` inside the `tempBuild` check, as in [the block above](#your-plugins-own-aar-build). Not `implementation`: Android's library plugin rejects a local `.aar` as `implementation` when it packages yours ("Direct local .aar file dependencies are not supported when building an AAR"), and the app links that plugin anyway. |
| Its own prebuilt `.jar`/`.aar` | Nothing, if they're in `platforms/android` or `platforms/android/libs`: the app build links them. |
| A Maven library | The usual `implementation "group:artifact:version"`. |

Never write `implementation files(...)` or `flatDir` pointing into another package or into
`node_modules`: the CLI decides where plugins' files are (see
[`pluginBuildLocation`](#for-app-developers-building-plugins-in-platformsandroid-opt-in)), and the
app build already links them.

Known limits of the CLI's and runtime's templates today:

- A plugin's `.aar` files are found by name in `platforms/android` and `platforms/android/libs`
  only. An `.aar` in any other subfolder fails to resolve ("Could not resolve :name.") in the app
  build and in the `.aar` builds of plugins that depend on it.
- In the `.aar` build of a plugin that depends on a plugin with `.jar` files, the CLI's template
  fails with "Could not get unknown property 'pluginsJarLibraries'".
- In your own `.aar` build, your own prebuilt `.jar`/`.aar` files are not on the compile classpath:
  your Java/Kotlin sources can't use classes from them.

## API

`apiLevel` is `1` for everything below. New methods raise it; nothing is ever removed or changed.

| Member | Needs facts | Returns |
|---|---|---|
| `nativescript.apiLevel` | No | The API level of the library on the classpath. |
| `nativescript.pluginBuild` | No | `true` in the CLI's temporary build of some plugin's `.aar`. |
| `nativescript.isBuildingPlugin(String)` | No | Whether the plugin build is building that npm package. |
| `nativescript.has(String)` | Yes | Whether the CLI guarantees a capability. |
| `nativescript.self` | Yes | In a plugin build, the plugin being built (see below). `null` in the app build. |
| `nativescript.projectDir` | Yes | The NativeScript project root (the folder with the app's `package.json`). |
| `nativescript.appDir` | Yes | The app source folder (`appPath` in `nativescript.config`). |
| `nativescript.appResourcesDir` | Yes | `App_Resources`. |
| `nativescript.plugin(String)` | Yes | A plugin the CLI lists, by npm name. Throws if the app doesn't have it. |
| `nativescript.findPlugin(String)` | Yes | Same, or `null`. |
| `nativescript.resolvePackage(String)` | Yes | Any installed npm package's folder. Throws if not found. |
| `nativescript.findPackage(String)` | Yes | Same, or `null`. |

"Needs facts" members read the facts file CLI 9.2+ writes, and throw one of the [errors](#errors)
below when it is missing or out of date. Without it, only the first three work.

A plugin (`PluginInfo`):

| Member | Returns |
|---|---|
| `name` | The npm package name. |
| `packageDir` | The installed package. Treat it as read-only. |
| `nativeDir` | Where Gradle reads the plugin's Android files from. |
| `artifacts` | Every `.aar` and `.jar` under `nativeDir`, as a lazy `FileCollection`. |
| `aarName`, `aar` | The name and location of the `.aar` the CLI builds from the plugin's sources (the file only exists if it has sources). |
| `options` | Per-plugin options. Reserved; empty for now. |

`plugin` / `findPlugin` only know the plugins the CLI lists: packages that declare Android support
in their `package.json` (`"nativescript": { "platforms": { "android": ... } }`), such as
`@nativescript/core`. A package with a `platforms/android` folder but no such declaration is not a
plugin. For any other npm package, use `resolvePackage` / `findPackage`.

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

`resolvePackage` returns the folder the CLI recorded for a plugin, and otherwise looks for
`node_modules/<name>` from the project root upwards, like Node. It's best effort: package managers
that don't hoist (pnpm's default layout) may not resolve packages your app doesn't depend on
directly.

## Errors

The library reads the facts file on the first use of a member that needs it, and stops the build
with one of these messages when it can't:

- **No facts file**, because a CLI before 9.2 prepared the project:

  > A plugin of this app uses org.nativescript:gradle-api, which needs the project to be prepared
  > by NativeScript CLI 9.2 or newer, but there is no facts file at
  > `<project>/platforms/android/nativescript-gradle.json`. Update the project's CLI with
  > `npm i -D nativescript@latest`, then run `ns prepare android`.

- **Out-of-date facts file**, because a different CLI (such as an older global one) prepared the
  project after the one that wrote it:

  > The NativeScript facts file `<…>/nativescript-gradle.json` does not match
  > `<…>/dependencies.json`: a different NativeScript CLI rewrote dependencies.json after the facts
  > file was written. Run `ns prepare android` again with the NativeScript CLI the project uses.

  (Or, if `dependencies.json` is gone: "There is no `<…>/dependencies.json` next to the
  NativeScript facts file `<…>`." followed by the same advice.)

## Recipes

**Compile against another plugin's Android library (e.g. core's widgets) in your own `.aar` build:**
the block in [Your plugin's own `.aar` build](#your-plugins-own-aar-build).

**Read a file from App_Resources:**

```groovy
def config = new File(nativescript.appResourcesDir, "Android/my-plugin.json")
```

**Point at another npm package's Maven repository** (detox, react-native style):

```groovy
apply plugin: "org.nativescript.api" // the block also runs in the app build

repositories {
    if (project.extensions.findByName("nativescript") == null) {
        throw new GradleException("my-plugin needs NativeScript CLI 9.2 or newer: npm i -D nativescript@latest")
    }
    maven { url = new File(nativescript.resolvePackage("detox"), "Detox-android") }
}
```

**Only in the app build:** `if (!nativescript.pluginBuild) { ... }`.

## Compatibility

| | CLI 9.1 and older | CLI 9.2+ |
|---|---|---|
| Plugin not using the library | Unchanged | Its own `buildscript.gradle` also runs in its own `.aar` build |
| Plugin using the library, app build | `apiLevel`, `pluginBuild` and `isBuildingPlugin` work; anything else stops the build with the [no facts file](#errors) error | Facts from the CLI |
| Plugin using the library, its own `.aar` build | Library not loaded, so the [check](#your-plugins-own-aar-build) stops the build with the plugin's message (or, if a plugin it depends on applied the library, the [no facts file](#errors) error) | Library loaded and applied, facts from the CLI |
| Project prepared again by an older CLI after 9.2 | The [out-of-date facts file](#errors) error | |

With [`pluginBuildLocation: "platforms"`](#for-app-developers-building-plugins-in-platformsandroid-opt-in)
(CLI 9.2+), Gradle also reads every plugin's files from a copy in `platforms/android/.ns-plugins/`.

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

- Require NativeScript CLI 9.2+: say so in your README and changelog, and start each copied block
  that uses `nativescript` with the [check](#your-plugins-own-aar-build).
- Pin the lowest library version you need; no ranges.
- Everything in the version you pin is always there: an app may end up with a newer library, never
  an older one. To use something newer only when it's available, check `apiLevel` (or `has(...)`)
  first.
- Never build paths into `node_modules` or into the CLI's output folders; ask the library.

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
                         no facts file, or it doesn't match   │
                         dependencies.json                    ▼
                                                    error: prepare with CLI 9.2+
```

The CLI decides everything (where plugins are, what they're called, project layout) and writes the
answers down. Gradle only reads them. The library never guesses: without a facts file that matches
the project, it stops the build and says what to run.

## The facts file

`platforms/android/nativescript-gradle.json`, written by `ns prepare android` before any plugin is
built. The schema is [`schema/nativescript-gradle.schema.json`](schema/nativescript-gradle.schema.json).

```json
{
  "schemaVersion": 1,
  "cli": { "version": "9.2.0" },
  "runtime": { "name": "@nativescript/android", "version": "9.0.0" },
  "capabilities": [],
  "dependenciesJson": { "sha256": "…" },
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
  that doesn't know about this file (9.1 and older, e.g. a global one used by mistake) still
  rewrites `dependencies.json` but leaves this file behind; the library notices the mismatch and
  stops with the [out-of-date facts file](#errors) error rather than give outdated answers.
- `capabilities` lists behaviours the CLI guarantees, so the library can tell "not set" apart from
  "this CLI doesn't know about it". Empty in version 1.
- `options` is reserved for per-plugin settings from `nativescript.config`.

## Versioning rules

These are what keep old plugins working on new CLIs, and new plugins working on CLIs from 9.2 on.

**Facts file:** fields are only added. A field never changes meaning and is never removed.
`schemaVersion` goes up when fields are added; readers accept any version and read what they know.
Paths are relative. Anything a newer CLI does differently is expressed as data in the file, not as a
rule readers must know. A facts file that doesn't match the `dependencies.json` next to it is an
error, never used.

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
