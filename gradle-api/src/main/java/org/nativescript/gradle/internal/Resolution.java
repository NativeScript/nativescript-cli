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
     *     to it, or if it is invalid
     */
    public static Resolution resolve(BuildInputs inputs) {
        List<File> searched = new ArrayList<>();
        File factsFile = locateFacts(inputs, searched);
        if (factsFile == null) {
            throw new GradleException("A plugin of this app uses org.nativescript:gradle-api, which needs the project"
                    + " to be prepared by NativeScript CLI 9.2 or newer, but there is no facts file at "
                    + searched.stream().map(File::toString).collect(Collectors.joining(" or "))
                    + ". Update the project's CLI with `npm i -D nativescript@latest`, then run `ns prepare android`.");
        }
        Facts facts = Facts.read(factsFile);
        facts.checkDependenciesJson();
        return new Resolution(facts);
    }

    private static File locateFacts(BuildInputs inputs, List<File> searched) {
        String explicit = asString(inputs.property(FACTS_FILE_PROPERTY));
        if (explicit != null) {
            File file = absolute(inputs.rootDir(), explicit);
            if (!file.isFile()) {
                throw new GradleException("-P" + FACTS_FILE_PROPERTY + " points to " + file + ", which does not exist.");
            }
            return file;
        }
        // Lets the app build find the facts without -P, as when Android Studio opens platforms/android.
        File inRoot = absolute(inputs.rootDir(), FACTS_FILE_NAME);
        searched.add(inRoot);
        if (inRoot.isFile()) {
            return inRoot;
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
            }
            if (file.isFile()) {
                return file;
            }
        }
        return null;
    }

    public Facts getFacts() {
        return facts;
    }

    public File getProjectDir() {
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
}
