package org.nativescript.gradle;

import java.io.File;
import java.util.Map;
import org.gradle.api.file.FileCollection;

/**
 * A plugin of the NativeScript project: an npm package with Android native code, as listed in the
 * facts file the CLI wrote.
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
     * The installed npm package. Treat it as read-only: with {@code android.pluginBuildLocation}
     * set to {@code "platforms"}, the CLI leaves {@code node_modules} untouched and works on a copy
     * of the native files instead.
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
     * <p>Meant for {@code compileOnly} in a plugin's own aar build: the app build already packages
     * these files. There, {@code compileOnly nativescript.plugin("...").artifacts} is reliable for
     * the artifacts a package ships prebuilt, and for the plugins yours lists as dependencies in its
     * {@code package.json}, whose aars the CLI builds first. The CLI also builds
     * {@code @nativescript/core} first, so core is always fine. For any other plugin, an aar the CLI
     * builds from its sources may not exist yet on a clean build.
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
     * @return an unmodifiable map
     * @since API level 1
     */
    Map<String, Object> getOptions();
}
