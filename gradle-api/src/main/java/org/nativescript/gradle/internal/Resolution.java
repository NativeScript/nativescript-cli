package org.nativescript.gradle.internal;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.gradle.api.GradleException;

/** Everything the extension answers about the project, from the facts file the CLI wrote. */
public final class Resolution {
    public static final String FACTS_FILE_NAME = "nativescript-gradle.json";
    public static final String FACTS_FILE_PROPERTY = "nativescript.factsFile";
    public static final String TEMP_BUILD_PROPERTY = "tempBuild";

    private static final String PLATFORMS_ANDROID_VARIABLE = "USER_PROJECT_PLATFORMS_ANDROID";

    private final Facts facts;

    private Resolution(Facts facts) {
        this.facts = facts;
    }

    /**
     * Reads the project's facts file.
     *
     * @throws GradleException if there is none, if it no longer matches the dependencies.json next
     *     to it, if it needs a newer version of this library, or if it is invalid
     */
    public static Resolution resolve(BuildInputs inputs) {
        List<File> searched = new ArrayList<>();
        Located located = locateFacts(inputs, searched);
        if (located == null) {
            throw new GradleException("A plugin of this app uses org.nativescript:gradle-api, which needs the project"
                    + " to be prepared by NativeScript CLI 9.2 or newer, but there is no facts file at "
                    + searched.stream().map(File::toString).collect(Collectors.joining(" or "))
                    + ". Update the project's CLI with `npm i -D nativescript@latest`, then run `ns prepare android`.");
        }
        Facts facts = Facts.read(located.file, located.content);
        facts.checkDependenciesJson(inputs.fileContents(facts.getDependenciesJsonFile()));
        return new Resolution(facts);
    }

    private static Located locateFacts(BuildInputs inputs, List<File> searched) {
        String explicit = asString(inputs.property(FACTS_FILE_PROPERTY));
        if (explicit != null) {
            File file = absolute(inputs.rootDir(), explicit);
            Located located = Located.of(inputs, file);
            if (located == null) {
                throw new GradleException("-P" + FACTS_FILE_PROPERTY + " points to " + file + ", which does not exist.");
            }
            return located;
        }
        // Lets the app build find the facts without -P, as when Android Studio opens platforms/android.
        File inRoot = absolute(inputs.rootDir(), FACTS_FILE_NAME);
        searched.add(inRoot);
        Located located = Located.of(inputs, inRoot);
        if (located != null) {
            return located;
        }
        // Only the plugin build template defines this; the CLI sets the variable when embedding the
        // app in a host project.
        String platformsAndroid = asString(inputs.property(PLATFORMS_ANDROID_VARIABLE));
        if (platformsAndroid == null && inputs.property(TEMP_BUILD_PROPERTY) != null) {
            platformsAndroid = inputs.environmentVariable(PLATFORMS_ANDROID_VARIABLE);
        }
        if (platformsAndroid != null) {
            File file = new File(absolute(inputs.rootDir(), platformsAndroid), FACTS_FILE_NAME);
            if (!searched.contains(file)) {
                searched.add(file);
                return Located.of(inputs, file);
            }
        }
        return null;
    }

    public Facts getFacts() {
        return facts;
    }

    public File getProjectRoot() {
        return facts.getProjectRoot();
    }

    public File getAppDir() {
        return facts.getAppDir();
    }

    public File getAppResourcesDir() {
        return facts.getAppResourcesDir();
    }

    public Set<String> getCapabilities() {
        return facts.getCapabilities();
    }

    /** The plugins the CLI listed, by npm name. */
    public Map<String, PluginData> getPlugins() {
        return facts.getPlugins();
    }

    /** A plugin the CLI listed, or null. */
    public PluginData findPlugin(String name) {
        NodePackages.validate(name);
        return facts.getPlugins().get(name);
    }

    /** The installed package's directory, null if not found. */
    public File findPackage(String name) {
        NodePackages.validate(name);
        PluginData listed = facts.getPlugins().get(name);
        if (listed != null) {
            return listed.getPackageDir();
        }
        return NodePackages.find(facts.getProjectRoot(), name);
    }

    static String asString(Object value) {
        if (value == null) {
            return null;
        }
        String string = value.toString();
        return string.isEmpty() ? null : string;
    }

    private static File absolute(File base, String path) {
        return base.toPath().resolve(path).toAbsolutePath().normalize().toFile();
    }

    private static final class Located {
        final File file;
        final byte[] content;

        private Located(File file, byte[] content) {
            this.file = file;
            this.content = content;
        }

        static Located of(BuildInputs inputs, File file) {
            byte[] content = inputs.fileContents(file);
            return content != null ? new Located(file, content) : null;
        }
    }
}
