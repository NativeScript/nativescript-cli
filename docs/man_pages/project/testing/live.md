<% if (isJekyll) { %>---
title: ns live
position: 2
---<% } %>

# ns live

### Description

Creates a project on preview.nativescript.org, opens its browser IDE and runs it live: on your phone through NativeScript Preview, or on this Mac. Edits from the IDE or its AI agent hot-reload the app. Run the command again in the same folder to reopen the project.

The project's keys are saved to `.ns-edge.json` in the current folder. Without a create token the project is free: a few hosted agent turns a day, no backend, deleted after 30 days unused.

### Commands

Usage | Synopsis
---|---
Creates a phone project and prints a QR code for NativeScript Preview | `ns live`
Creates a Mac project and runs it on this Mac, streamed into the IDE | `ns live --mac`
Creates an Electron project with native views and runs it on this Mac | `ns live --electron`

### Options

* `--new` - Creates another project instead of reopening this folder's.
* `--no-open` - Doesn't open the IDE in the browser.
* `--allow-eval` - With `--mac` or `--electron`, lets the project's agent run code on this Mac.
* `--token <token>` - A create token for a full project (also read from `NS_EDGE_CREATE_TOKEN`).

<% if(isHtml) { %>

### Command Limitations

* `--mac` and `--electron` need an Apple Silicon Mac with macOS 14.4 or later.
* `ns live` runs `npx @nativescript/cloudflare-cli live`, which you can also run without the NativeScript CLI installed.

<% } %>
