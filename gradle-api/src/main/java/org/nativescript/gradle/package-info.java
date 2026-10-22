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
 * <p>and applies it at the top of its {@code platforms/android/include.gradle}:
 *
 * <pre>{@code
 * apply plugin: "org.nativescript.api"
 * }</pre>
 *
 * <p>The {@link org.nativescript.gradle.NativeScriptExtension nativescript} extension then answers
 * questions about the project. {@code include.gradle} cannot see the library's classes (see {@link
 * org.nativescript.gradle.NativeScript}), so it uses the extension dynamically:
 *
 * <pre>{@code
 * def ns = project.extensions.getByName("nativescript")
 * }</pre>
 *
 * <p>Everything outside this package is internal.
 */
package org.nativescript.gradle;
