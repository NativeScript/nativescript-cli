package org.nativescript.gradle.internal;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;
import org.gradle.api.logging.Logging;

/**
 * Everything the extension answers, worked out once from the CLI's facts file or, for CLIs that do
 * not write one (9.1 and older), from the same inputs their Gradle templates read.
 */
public final class Resolution {
    public static final String FACTS_FILE_NAME = "nativescript-gradle.json";
    public static final String FACTS_FILE_PROPERTY = "nativescript.factsFile";

    private static final String PLATFORMS_ANDROID = "platforms/android";
    private static final Logger LOGGER = Logging.getLogger(Resolution.class);

    private final Facts facts;
    private final boolean pluginBuild;
    private final String pluginName;
    private final File projectDir;
    private final File appDir;
    private final File appResourcesDir;
    private final Map<String, PluginData> plugins;
    private final Set<String> capabilities;

    private Resolution(
            Facts facts,
            boolean pluginBuild,
            String pluginName,
            File projectDir,
            File appDir,
            File appResourcesDir,
            Map<String, PluginData> plugins,
            Set<String> capabilities) {
        this.facts = facts;
        this.pluginBuild = pluginBuild;
        this.pluginName = pluginName;
        this.projectDir = projectDir;
        this.appDir = appDir;
        this.appResourcesDir = appResourcesDir;
        this.plugins = plugins;
        this.capabilities = capabilities;
    }

    public static Resolution resolve(BuildInputs inputs) {
        // The CLI passes -PtempBuild=true only to the throwaway project that builds a plugin's aar,
        // whose template also sets PLUGIN_NAME.
        boolean pluginBuild = inputs.property("tempBuild") != null;
        String pluginName = pluginBuild ? asString(inputs.property("PLUGIN_NAME")) : null;

        File factsFile = locateFacts(inputs, pluginBuild);
        Facts facts = factsFile != null ? Facts.read(factsFile) : null;
        String staleness = facts != null ? facts.staleness() : null;
        if (staleness != null) {
            LOGGER.warn("Ignoring {}: {}. Using the fallback rules.", factsFile, staleness);
            facts = null;
        }
        if (facts != null) {
            return new Resolution(
                    facts,
                    pluginBuild,
                    pluginName,
                    facts.getProjectRoot(),
                    facts.getAppDir(),
                    facts.getAppResourcesDir(),
                    facts.getPlugins(),
                    facts.getCapabilities());
        }
        return resolveLegacy(inputs, pluginBuild, pluginName);
    }

    private static File locateFacts(BuildInputs inputs, boolean pluginBuild) {
        String explicit = asString(inputs.property(FACTS_FILE_PROPERTY));
        if (explicit != null) {
            File file = absolute(inputs.rootDir(), explicit);
            if (!file.isFile()) {
                throw new GradleException("-P" + FACTS_FILE_PROPERTY + " points to " + file + ", which does not exist.");
            }
            return file;
        }
        // Lets the app build find the facts without -P, as when Android Studio opens platforms/android.
        File inRoot = new File(inputs.rootDir(), FACTS_FILE_NAME);
        if (inRoot.isFile()) {
            return inRoot.getAbsoluteFile();
        }
        File platformsAndroid = explicitPlatformsAndroid(inputs, pluginBuild);
        if (platformsAndroid != null) {
            File file = new File(platformsAndroid, FACTS_FILE_NAME);
            if (file.isFile()) {
                return file;
            }
        }
        return null;
    }

    private static Resolution resolveLegacy(BuildInputs inputs, boolean pluginBuild, String pluginName) {
        File rootDir = inputs.rootDir();
        File projectDir = legacyProjectDir(inputs, pluginBuild);

        // dependencies.json directories are relative to the folder holding it: the app's
        // platforms/android, which is the app build's root but not the plugin build's.
        File dependenciesBase;
        if (pluginBuild) {
            File platformsAndroid = explicitPlatformsAndroid(inputs, true);
            dependenciesBase = platformsAndroid != null ? platformsAndroid : normalize(new File(projectDir, PLATFORMS_ANDROID));
        } else {
            dependenciesBase = normalize(rootDir);
        }
        Map<String, PluginData> plugins = readDependenciesJson(new File(dependenciesBase, "dependencies.json"));

        NsConfig nsConfig = new NsConfig(new File(projectDir, "nsconfig.json"));
        String appPath = asString(inputs.property("appPath"));
        if (appPath == null) {
            appPath = nsConfig.get("appPath");
        }
        File appDir = absolute(projectDir, appPath != null ? appPath : "app");

        String appResourcesPath = asString(inputs.property("appResourcesPath"));
        if (appResourcesPath == null) {
            appResourcesPath = nsConfig.get("appResourcesPath");
        }
        File appResourcesDir = appResourcesPath != null
                ? absolute(projectDir, appResourcesPath)
                : normalize(new File(appDir, "App_Resources"));

        return new Resolution(
                null, pluginBuild, pluginName, projectDir, appDir, appResourcesDir, plugins, Collections.emptySet());
    }

    private static File legacyProjectDir(BuildInputs inputs, boolean pluginBuild) {
        File rootDir = inputs.rootDir();
        String value = asString(inputs.property("USER_PROJECT_ROOT"));
        if (value == null && pluginBuild) {
            value = inputs.environmentVariable("USER_PROJECT_ROOT");
        }
        if (value != null) {
            return absolute(rootDir, value);
        }
        // The templates' own defaults: platforms/android, and platforms/tempPlugin/<name>.
        return normalize(new File(rootDir, pluginBuild ? "../../.." : "../.."));
    }

    /** USER_PROJECT_PLATFORMS_ANDROID, which only the plugin build template defines. */
    private static File explicitPlatformsAndroid(BuildInputs inputs, boolean pluginBuild) {
        String value = asString(inputs.property("USER_PROJECT_PLATFORMS_ANDROID"));
        if (value == null && pluginBuild) {
            value = inputs.environmentVariable("USER_PROJECT_PLATFORMS_ANDROID");
        }
        return value != null ? absolute(inputs.rootDir(), value) : null;
    }

    private static Map<String, PluginData> readDependenciesJson(File file) {
        if (!file.isFile()) {
            return Collections.emptyMap();
        }
        Object root;
        try {
            root = Json.parse(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new GradleException("Could not read " + file + ": " + e, e);
        } catch (Json.ParseException e) {
            throw new GradleException("Invalid " + file + ": " + e.getMessage(), e);
        }
        if (!(root instanceof List)) {
            throw new GradleException("Invalid " + file + ": expected an array");
        }
        File base = file.getAbsoluteFile().getParentFile();
        Map<String, PluginData> plugins = new LinkedHashMap<>();
        for (Object item : (List<?>) root) {
            if (!(item instanceof Map)) {
                throw new GradleException("Invalid " + file + ": every entry must be an object");
            }
            Map<?, ?> entry = (Map<?, ?>) item;
            if (!(entry.get("name") instanceof String) || !(entry.get("directory") instanceof String)) {
                throw new GradleException("Invalid " + file + ": every entry needs a string name and directory");
            }
            String name = (String) entry.get("name");
            File packageDir = absolute(base, (String) entry.get("directory"));
            List<String> dependencies = new ArrayList<>();
            if (entry.get("dependencies") instanceof List) {
                for (Object dependency : (List<?>) entry.get("dependencies")) {
                    if (dependency instanceof String) {
                        dependencies.add((String) dependency);
                    }
                }
            }
            plugins.putIfAbsent(name, new PluginData(
                    name,
                    packageDir,
                    normalize(new File(packageDir, PLATFORMS_ANDROID)),
                    null,
                    null,
                    dependencies,
                    Collections.emptyMap()));
        }
        return Collections.unmodifiableMap(plugins);
    }

    /** Null in legacy mode. */
    public Facts getFacts() {
        return facts;
    }

    public boolean isPluginBuild() {
        return pluginBuild;
    }

    /** The plugin whose aar this build makes; null outside plugin builds. */
    public String getPluginName() {
        return pluginName;
    }

    public File getProjectDir() {
        return projectDir;
    }

    public File getAppDir() {
        return appDir;
    }

    public File getAppResourcesDir() {
        return appResourcesDir;
    }

    public Set<String> getCapabilities() {
        return capabilities;
    }

    /** The plugins the CLI listed, by npm name. */
    public Map<String, PluginData> getPlugins() {
        return plugins;
    }

    /**
     * A plugin the CLI listed, else an installed package that has a {@code platforms/android}
     * directory. The fallback applies with and without facts, so that a plugin's Gradle code gets the
     * same answers from every CLI: neither list need contain every package a plugin build compiles
     * against.
     */
    public PluginData findPlugin(String name) {
        NodePackages.validate(name);
        PluginData listed = plugins.get(name);
        if (listed != null) {
            return listed;
        }
        File packageDir = NodePackages.find(projectDir, name);
        if (packageDir == null) {
            return null;
        }
        File nativeDir = normalize(new File(packageDir, PLATFORMS_ANDROID));
        if (!nativeDir.isDirectory()) {
            return null;
        }
        return new PluginData(
                name,
                packageDir,
                nativeDir,
                null,
                null,
                Collections.emptyList(),
                Collections.emptyMap());
    }

    /** The installed package's directory, null if not found. */
    public File findPackage(String name) {
        NodePackages.validate(name);
        PluginData listed = plugins.get(name);
        if (listed != null) {
            return listed.getPackageDir();
        }
        return NodePackages.find(projectDir, name);
    }

    private static String asString(Object value) {
        if (value == null) {
            return null;
        }
        String string = value.toString();
        return string.isEmpty() ? null : string;
    }

    private static File absolute(File base, String path) {
        return base.toPath().resolve(path).toAbsolutePath().normalize().toFile();
    }

    private static File normalize(File file) {
        return file.toPath().toAbsolutePath().normalize().toFile();
    }

    /** The nsconfig.json the templates fall back to, read only if needed. */
    private static final class NsConfig {
        private final File file;
        private Map<?, ?> values;

        NsConfig(File file) {
            this.file = file;
        }

        String get(String key) {
            if (values == null) {
                values = read();
            }
            Object value = values.get(key);
            return value instanceof String && !((String) value).isEmpty() ? (String) value : null;
        }

        private Map<?, ?> read() {
            if (!file.isFile()) {
                return Collections.emptyMap();
            }
            try {
                Object root = Json.parse(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
                return root instanceof Map ? (Map<?, ?>) root : Collections.emptyMap();
            } catch (IOException e) {
                throw new GradleException("Could not read " + file + ": " + e, e);
            } catch (Json.ParseException e) {
                throw new GradleException("Invalid " + file + ": " + e.getMessage(), e);
            }
        }
    }
}
