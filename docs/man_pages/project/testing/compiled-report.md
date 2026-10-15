<% if (isJekyll) { %>---
title: ns compiled report
position: 21
---<% } %>

# ns compiled report

### Description

Reports a `--compiled` problem to NativeScript as a GitHub issue on NativeScript/NativeScript. When a compiled build fails (the compiler refuses a construct, or Swift, Kotlin, Gradle or Xcode fails on the generated code), the CLI keeps what went wrong in `platforms/compiled/<platform>/report.json` and says to run this command. For an error a compiled app throws at runtime, pass it with `--error <file>`.

The report holds the CLI, `@nativescript/compiler` and `@nativescript/core` versions, the framework and its version, the platform, Xcode or Gradle, the Android Gradle Plugin and Kotlin, the OS, the project's dependencies with their versions, the diagnostic and the source location it names. Paths are made relative to the project; the home folder, user names, tokens and passwords are removed. Its title carries a signature, a short hash of the kind of failure and its message with names and numbers abstracted, so the same problem in different apps finds the same issue.

Nothing leaves the machine until you have seen the report and agreed. The command then searches the repository's open and closed issues for the signature: if one exists, it offers to add a 👍 to it (with your environment as a comment when no earlier report has the same platform, framework and compiler and core versions), or to open it. Otherwise it files the issue with `gh`, when it is installed and signed in, or opens the repository's `--compiled` issue form, filled in, in the browser. The source lines around the location (three either side) are added only if you agree a second time; `--yes` never skips that question. In a terminal that cannot answer, it prints the report and the issue URL and sends nothing.

Each issue filed this way becomes a case in the compiler's tests (`packages/compiler/tests/diff/cases`), then a fix, and the generated table of what `--compiled` supports is updated.

### Commands

Usage | Synopsis
---|---
The last failed build | `$ ns compiled report [<Platform>]`
A runtime error | `$ ns compiled report <Platform> --error <file>`

### Arguments

`<Platform>` is `ios` or `android`. Without it, the command reports the platform whose build failed last.

### Options

* `--error <file>` - Reports the runtime error in `<file>`. `--error=-` reads it from stdin; stdin is then not a terminal, so the report and its URL are only printed.
* `--yes` - Sends the report without asking first. You are still asked before any of your code is included.
* `--dry-run` - Prints the title, labels, body and issue URL, and sends nothing.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[build](build.html) | Builds the project, `--compiled` to compile it to native code.
[compiled verify](compiled-verify.html) | Compares a compiled release with its JavaScript release.
<% } %>
