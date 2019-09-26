<% if (isJekyll) { %>---
title: tns proxy set
position: 13
---<% } %>

# tns proxy set

### Description

Sets the proxy settings of the NativeScript CLI.

### Commands

Usage | Synopsis
------|-------
General | `$ tns proxy set [<Url> <% if(isWindows) {%>[<Username> [<Password>]]<%}%>]`

### Options

* `--insecure` - Allows insecure SSL connections and transfers to be performed. In case your proxy doesn't have a CA certificate or has an invalid one you need to use this flag.

### Arguments

* `<Url>` is the full url of the proxy. For example, http://127.0.0.1:8888. If you do not provide the url when running the command, the NativeScript CLI will prompt you to provide it.
<% if(isWindows) {%>
* `<Username>` and `<Password>` are your credentials for the proxy. These are not necessary, however, if you provide a `<Username>` you need to provide a `<Password>` too.
<% } %>

<% if(isHtml) { %>

### Command Limitations

* You can set credentials only on Windows systems.
* Proxy settings for npm, (Android) Gradle and (optional) Docker need to be set separately.
    * configuring `npm` proxy - https://docs.npmjs.com/misc/config#https-proxy
    * (Android) configuring Gradle proxy - set global configuration in the user directory - _<USER_HOME>/.gradle/gradle.properties_ - https://docs.gradle.org/3.3/userguide/build_environment.html#sec:accessing_the_web_via_a_proxy
    * configuring Docker proxy - https://docs.docker.com/network/proxy/

### Related Commands

Command | Description
----------|----------
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
<% } %>
