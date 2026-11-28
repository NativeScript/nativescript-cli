<% if (isJekyll) { %>---
title: ns metadata trim
position: 26
---<% } %>

# ns metadata trim

### Description

Reduces the native API metadata an app ships to what its JavaScript uses. The app's emitted bundle is analyzed for the native symbols it references, and the generator keeps those plus the types they depend on.

Rules in `native-api-usage.json` still apply. Entries from `whitelist` and from plugins' `uses` are kept in addition to what the analysis finds, and `blacklist` entries are removed. A blacklisted type that a kept API's signature needs can't be removed: on Apple platforms it stays in the metadata, and on Android the build fails and names it. In a NativeScript project these files are found automatically for iOS and Android; other hosts pass them with `--native-api-usage`.

If the bundle reads globals dynamically (an alias of `globalThis`, for example), its usage cannot be determined and nothing is trimmed.

### Commands

Usage | Synopsis
---|---
Generate trimmed macOS metadata and embed it in a framework | `$ ns metadata trim macos <Bundle> --analyzer <Path> --generator <Path> [--framework <Path>] [--out <Directory>]`
Generate trimmed iOS metadata | `$ ns metadata trim ios <Bundle> --analyzer <Path> --generator <Path> [--sdk <Sdk>] [--framework <Path>]`
Write the whitelist for an Android project | `$ ns metadata trim android <Bundle> --android-project <Directory>`

### Arguments

* `<Bundle>` - One or more emitted JavaScript files or directories.

### Options

* `--out` - Output directory. Defaults to `metadata-trim`.
* `--keep` - A `Module:Symbol` pattern to keep regardless of the analysis. Repeat for several.
* `--native-api-usage` - A `native-api-usage.json` file to apply, in the app or plugin format. Repeat for several.
* `--analyzer` - `ns-metadata-symbols` on Apple platforms; overrides the runtime's `seed.js` on Android.
* `--generator` - `objc-metadata-generator`. Use the one from the runtime release the app ships.
* `--framework` - A `NativeScript.framework` to copy into the output directory with the trimmed metadata embedded.
* `--android-project` - The Android project whose `whitelist.mdg` Gradle should use. Build it with `-PnsFilterMetadata`.
* `--sdk` - Xcode SDK name. Defaults to `macosx` or `iphonesimulator`.
* `--arch` - Target architecture. Defaults to `arm64`.
* `--min-version` - Minimum OS version to generate for.
