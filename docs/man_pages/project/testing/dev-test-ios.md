test ios


Usage | Synopsis
------|-------
Run tests on all connected devices | `$ ns test ios [--watch] [--debug-brk]`
Run tests on a selected device | `$ ns test ios --device <Device ID> [--watch] [--debug-brk]`
Run tests in the iOS Simulator | `$ ns test ios --emulator [--watch] [--debug-brk]`

Runs the tests in your project on connected iOS devices or the iOS Simulator.<% if(isConsole && isMacOS) { %> Your project must already be configured for unit testing by running `$ ns test init`.<% } %>

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ ns help test ios`<% } %> 

<% if((isConsole && isMacOS) || isHtml) { %>
### Options
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-ran.
* `--device` - Specifies the serial number or the index of the connected device on which you want to run tests. To list all connected devices, grouped by platform, run `$ ns device`. You cannot set `--device` and `--emulator` simultaneously.
* `--emulator` - Runs tests on the iOS Simulator. You cannot set `--device` and `--emulator` simultaneously.
* `--debug-brk` - Runs the tests under the debugger. The debugger will break just before your tests are executed, so you have a chance to place breakpoints.

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ ns device`<% } %>

<% if(isHtml) { %>
### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html).
* Verify that [you have stored your unit tests in `app` &#8594; `tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands
Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
<% } %>
