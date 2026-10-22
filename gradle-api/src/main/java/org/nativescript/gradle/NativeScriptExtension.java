package org.nativescript.gradle;

import java.io.File;

/**
 * What a NativeScript plugin's Gradle code can ask about the project being built, registered as
 * the {@value #NAME} extension by {@link NativeScriptPlugin}.
 *
 * <p>Answers come from the facts file the NativeScript CLI writes ({@code
 * platforms/android/nativescript-gradle.json}) or, with CLIs that do not write one (9.1 and older),
 * from the same properties and files those CLIs' Gradle templates use. A facts file that such a CLI
 * left behind no longer matches the {@code dependencies.json} next to it, and is ignored with a
 * warning. A plugin written against
 * this API therefore builds with old and new CLIs alike.
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
 * apply plugin: "org.nativescript.api"
 *
 * dependencies {
 *     def ns = project.extensions.findByName("nativescript")
 *     if (ns != null && ns.pluginBuild) {
 *         compileOnly ns.plugin("@nativescript/core").artifacts
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
     * @param capability the capability name
     * @return true if the CLI declared it; always false with CLIs that do not write a facts file
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
     * applied there sees the plugin that depends on it, not itself.
     *
     * @return that plugin, or null in the app build or if the CLI did not name the plugin
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
     * The NativeScript project root: the directory with the app's {@code package.json}.
     *
     * @return an absolute, normalized directory
     * @since API level 1
     */
    File getProjectDir();

    /**
     * The app's source directory ({@code appPath} in the NativeScript config).
     *
     * @return an absolute, normalized directory
     * @since API level 1
     */
    File getAppDir();

    /**
     * The app's {@code App_Resources} directory ({@code appResourcesPath} in the NativeScript config).
     *
     * @return an absolute, normalized directory
     * @since API level 1
     */
    File getAppResourcesDir();

    /**
     * A plugin of the project: a package the CLI lists as having Android native code or, failing
     * that, an installed package (found as in {@link #findPackage(String)}) with a {@code
     * platforms/android} directory. The same rule applies with every CLI version, so a plugin gets
     * the same answer whichever CLI prepared the project; only the details of the CLI's list, such
     * as {@link PluginInfo#getAarName()}, depend on the version.
     *
     * @param npmName the npm package name, such as {@code @nativescript/core}
     * @return the plugin
     * @throws org.gradle.api.GradleException if there is no such plugin; the message lists the
     *     plugins that are known
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
     * @throws org.gradle.api.GradleException if the package is not found
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
     * @since API level 1
     */
    File findPackage(String npmName);
}
