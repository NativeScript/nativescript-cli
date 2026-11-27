package org.nativescript.gradle;

import java.io.File;

/**
 * What a NativeScript plugin's Gradle code can ask about the project being built, registered as
 * the {@value #NAME} extension by {@link NativeScriptPlugin}.
 *
 * <p>Answers come from the facts file ({@code platforms/android/nativescript-gradle.json}) that
 * NativeScript CLI 9.2 and newer write when preparing the project. {@link #getApiLevel()}, {@link
 * #isPluginBuild()}, {@link #isBuildingPlugin(String)}, and {@link #getSelf()} outside a plugin
 * build, work without it. Every other member needs it and throws a {@link
 * org.gradle.api.GradleException} when it is used:
 *
 * <ul>
 *   <li>if there is no facts file, because a CLI before 9.2 prepared the project. The message says
 *       to update the project's CLI and prepare it again;
 *   <li>if the facts file no longer matches the {@code dependencies.json} next to it, because a
 *       different CLI prepared the project after the one that wrote it. The message says to
 *       prepare it again with the project's CLI;
 *   <li>if the facts file needs a newer version of this library than the one on the classpath.
 *       The message says to update the plugin that adds the library.
 * </ul>
 *
 * <p>Everything is worked out on first use, during configuration, and does not change afterwards.
 * Read what a task needs while configuring it rather than calling this from a task action.
 *
 * <p>Two builds can use this API:
 *
 * <ul>
 *   <li>the app build ({@code platforms/android}), where every plugin's {@code include.gradle} is
 *       applied to the {@code :app} project;
 *   <li>a plugin build, the throwaway project in which the CLI compiles one plugin's sources into
 *       an aar. Only the {@code repositories} and {@code dependencies} blocks of that plugin's own
 *       {@code include.gradle} run there, but the {@code include.gradle} files of the plugins it
 *       depends on run in full.
 * </ul>
 *
 * <p>Not intended to be implemented outside this library; methods may be added in later versions.
 * Check {@link #getApiLevel()} before calling a method newer than the version a plugin declares,
 * because another plugin may have put a newer version of this library on the classpath, never an
 * older one.
 *
 * <pre>{@code
 * dependencies {
 *     if (project.hasProperty("tempBuild")) {
 *         if (project.extensions.findByName("nativescript") == null) {
 *             throw new GradleException("my-plugin needs NativeScript CLI 9.2 or newer: npm i -D nativescript@latest")
 *         }
 *         compileOnly nativescript.plugin("@nativescript/core").artifacts
 *     }
 * }
 * }</pre>
 */
public interface NativeScriptExtension {
    /** The name the extension is registered under. */
    String NAME = "nativescript";

    /**
     * The API level this copy of the library implements: 1 for the methods documented as such, and
     * one more for each later version that adds methods.
     *
     * @return the API level, at least 1
     * @since API level 1
     */
    int getApiLevel();

    /**
     * Whether the CLI that prepared the project guarantees a behaviour. Capability names are listed
     * in the facts file's schema documentation.
     *
     * <p>Names are dotted and lowercase, {@code area.feature}, such as {@code build.abis}. A CLI only
     * ever adds capabilities: once a CLI version declares one, every later version does too.
     *
     * @param capability the capability name
     * @return true if the CLI declared it
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    boolean has(String capability);

    /**
     * Whether this Gradle build is the CLI's build of one plugin's aar rather than the app build.
     *
     * @return true in a plugin build
     * @since API level 1
     */
    boolean isPluginBuild();

    /**
     * In a plugin build, the plugin whose aar is being built. A dependency's {@code include.gradle}
     * applied there sees the plugin that depends on it, not itself. In the app build it is null
     * and needs no facts file.
     *
     * @return that plugin, or null in the app build or if the CLI did not name the plugin
     * @throws org.gradle.api.GradleException in a plugin build, if the project has no facts file or
     *     it is out of date
     * @since API level 1
     */
    PluginInfo getSelf();

    /**
     * Whether this is the plugin build of the given plugin.
     *
     * @param npmName the plugin's npm package name, such as {@code @nativescript/core}
     * @return true only in that plugin's own aar build
     * @since API level 1
     */
    boolean isBuildingPlugin(String npmName);

    /**
     * The NativeScript project root: the directory with the app's {@code package.json}. Not to be
     * confused with Gradle's {@code project.projectDir}.
     *
     * @return an absolute, normalized directory
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    File getProjectRoot();

    /**
     * The app's source directory ({@code appPath} in the NativeScript config).
     *
     * @return an absolute, normalized directory
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    File getAppDir();

    /**
     * The app's {@code App_Resources} directory ({@code appResourcesPath} in the NativeScript config).
     *
     * @return an absolute, normalized directory
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    File getAppResourcesDir();

    /**
     * A plugin of the project: a package the CLI lists in the facts file because its {@code
     * package.json} declares Android support. Any other package, even one with a {@code
     * platforms/android} directory, is not a plugin; find it with {@link #findPackage(String)}.
     *
     * @param npmName the npm package name, such as {@code @nativescript/core}
     * @return the plugin
     * @throws org.gradle.api.GradleException if there is no such plugin, in which case the message
     *     lists the plugins that are known, or if the project has no facts file or it is out of date
     * @throws IllegalArgumentException if {@code npmName} is not an npm package name
     * @since API level 1
     */
    PluginInfo plugin(String npmName);

    /**
     * Like {@link #plugin(String)}, but returns null when there is no such plugin.
     *
     * @param npmName the npm package name, such as {@code @nativescript/core}
     * @return the plugin, or null
     * @throws IllegalArgumentException if {@code npmName} is not an npm package name
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    PluginInfo findPlugin(String npmName);

    /**
     * The directory of any installed npm package, native plugin or not.
     *
     * <p>Packages the CLI lists as plugins resolve to the directory it recorded. Others are looked
     * up the way Node does: {@code node_modules/<name>} in the project root, then in each parent
     * directory. This is best effort: layouts that keep packages out of the project's {@code
     * node_modules}, such as pnpm's isolated mode for packages the app does not depend on directly,
     * may not resolve.
     *
     * @param npmName the npm package name
     * @return the package directory
     * @throws org.gradle.api.GradleException if the package is not found, or if the project has no
     *     facts file or it is out of date
     * @throws IllegalArgumentException if {@code npmName} is not an npm package name
     * @since API level 1
     */
    File resolvePackage(String npmName);

    /**
     * Like {@link #resolvePackage(String)}, but returns null when the package is not found.
     *
     * @param npmName the npm package name
     * @return the package directory, or null
     * @throws IllegalArgumentException if {@code npmName} is not an npm package name
     * @throws org.gradle.api.GradleException if the project has no facts file or it is out of date
     * @since API level 1
     */
    File findPackage(String npmName);
}
