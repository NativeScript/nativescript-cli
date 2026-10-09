<% if (isJekyll) { %>---
title: ns compiled verify
position: 20
---<% } %>

# ns compiled verify

### Description

Builds the project's JavaScript release and its compiled release (`--compiled`), runs both the same way on one iOS Simulator and compares them: a screenshot of each step, pixel by pixel, and whether either app stops running. Use it before shipping a compiled release.

The steps are the project's `verify.json`, when it has one. Each screen launches the app afresh; coordinates are points on the simulator's screen:

```json
{
  "screens": [
    { "name": "home", "steps": [["shot", "start"], ["tap", 200, 400], ["wait", 1], ["type", "Ada"], ["shot", "typed"]] }
  ]
}
```

Steps: `shot <name>`, `tap <x> <y> [seconds held]`, `taps <x> <y> [count]`, `swipe <x> <y> <toX> <toY>`, `drag <x> <y> <toX> <toY> [seconds]`, `type <text>`, `wait <seconds>`, `openurl <url>`. Without `verify.json`, the app is compared once it settles after launch.

The screenshots and `report.json` are written to `platforms/compiled/verify`. The command fails when a screenshot differs or an app stops running.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on macOS systems.<% } %>

### Commands

Usage | Synopsis
---|---
General | `$ ns compiled verify [ios]`

### Prerequisites

* `@nativescript/compiler` as a devDependency of the project.
* Xcode with an iOS Simulator runtime.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[build ios](build-ios.html) | Builds the project for iOS, `--compiled` to compile it to native code.
<% } %>
