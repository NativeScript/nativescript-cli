test android


Usage | Synopsis
------|-------
Run tests on all connected devices | `$ tns test android [--watch] [--debug-brk]`
Run tests on a selected device | `$ tns test android --device <Device ID> [--watch] [--debug-brk]`

Runs the tests in your project on connected Android devices and running native emulators.<% if(isConsole) { %> Your project must already be configured for unit testing by running `$ tns test init`.<% } %>

### Options
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-run.
* `--device` - Specifies the serial number or the index of the connected device on which to run the tests. To list all connected devices, grouped by platform, run `$ tns device`
* `--debug-brk` - Runs the tests under the debugger. The debugger will break just before your tests are executed, so you have a chance to place breakpoints.

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ tns device`

<% if(isHtml) { %>
### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html).
* Verify that [you have stored your unit tests in `app` &#8594; `tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands
Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
