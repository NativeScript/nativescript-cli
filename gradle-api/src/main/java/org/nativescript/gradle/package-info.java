/**
 * Gradle API for NativeScript plugins.
 *
 * <p>A plugin puts the library on the build's classpath from its {@code
 * platforms/android/buildscript.gradle}:
 *
 * <pre>{@code
 * repositories { mavenCentral() }
 * dependencies { classpath "org.nativescript:gradle-api:<version>" }
 * }</pre>
 *
 * <p>It needs the project to be prepared by NativeScript CLI 9.2 or newer, which also loads it in
 * the plugin's own aar build and applies it there. A plugin that uses the {@link
 * org.nativescript.gradle.NativeScriptExtension nativescript} extension in the app build applies it
 * at the top of its {@code platforms/android/include.gradle}:
 *
 * <pre>{@code
 * apply plugin: "org.nativescript.api"
 * }</pre>
 *
 * <p>{@code include.gradle} cannot see the library's classes (see {@link
 * org.nativescript.gradle.NativeScript}), so it uses the extension dynamically: by its name, {@code
 * nativescript}, or through {@code project.extensions.findByName("nativescript")}. The extension's
 * documentation lists what works without the facts file the CLI writes.
 *
 * <p>Everything outside this package is internal.
 */
package org.nativescript.gradle;
