package org.nativescript.gradle;

import java.io.File;
import java.util.Map;
import org.gradle.api.file.FileCollection;

/**
 * A plugin of the NativeScript project: an npm package with Android native code.
 *
 * <p>Not intended to be implemented outside this library; methods may be added in later versions.
 *
 * @see NativeScriptExtension#plugin(String)
 */
public interface PluginInfo {
    /**
     * The npm package name.
     *
     * @return the name, such as {@code @nativescript/core}
     * @since API level 1
     */
    String getName();

    /**
     * The installed npm package. Treat it as read-only: the CLI may keep {@code node_modules}
     * read-only and work on a copy of the native files instead.
     *
     * @return an absolute, normalized directory
     * @since API level 1
     */
    File getPackageDir();

    /**
     * The directory the build reads the plugin's Android files from: the package's {@code
     * platforms/android}, or the CLI's copy of it.
     *
     * @return an absolute, normalized directory
     * @since API level 1
     */
    File getNativeDir();

    /**
     * Every {@code .aar} and {@code .jar} under the {@linkplain #getNativeDir() native directory},
     * including the aar the CLI builds from the plugin's sources once it exists. Evaluated lazily.
     *
     * <p>Meant for {@code compileOnly} in a dependent plugin's build: the app build already
     * packages these files.
     *
     * @return a live view of those files
     * @since API level 1
     */
    FileCollection getArtifacts();

    /**
     * Options the project sets for this plugin. Values are JSON values: {@code String}, {@code
     * Boolean}, {@code Integer}, {@code Long}, {@code java.math.BigInteger}, {@code
     * java.math.BigDecimal}, {@code null}, and unmodifiable {@code List}s and {@code Map}s of them.
     *
     * @return an unmodifiable map; empty with CLIs that do not write a facts file
     * @since API level 1
     */
    Map<String, Object> getOptions();

    /**
     * File name, without extension, of the aar the CLI builds from the plugin's sources; unique
     * across the project.
     *
     * @return the name, or null with CLIs that do not write a facts file, and for installed
     *     packages the CLI does not list as plugins
     * @since API level 1
     */
    String getAarName();

    /**
     * Where the CLI puts the aar it builds from the plugin's sources. The file only exists once
     * built, and only if the plugin has sources.
     *
     * @return the file, or null with CLIs that do not write a facts file, and for installed
     *     packages the CLI does not list as plugins
     * @since API level 1
     */
    File getAar();
}
