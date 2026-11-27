package org.nativescript.gradle.internal;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;
import org.gradle.api.logging.Logging;

/**
 * The CLI's {@code nativescript-gradle.json}, described by {@code schema/nativescript-gradle.schema.json}.
 *
 * <p>Fields are only ever added to the format, so unknown fields are ignored and a newer {@code
 * schemaVersion} is read like this one, unless its {@code minReaderSchemaVersion} is newer than
 * {@link #SUPPORTED_SCHEMA_VERSION}.
 */
public final class Facts {
    /**
     * The facts schema version this library supports: it knows every field up to this {@code
     * schemaVersion}, and refuses files whose {@code minReaderSchemaVersion} is higher.
     */
    public static final int SUPPORTED_SCHEMA_VERSION = 1;

    private static final Logger LOGGER = Logging.getLogger(Facts.class);

    // Checked against the file's whole content, not its mtime: the class loader holding this cache
    // outlives builds in the daemon, and a rewrite can keep the size and land in the same mtime tick.
    private static final Map<String, CachedFacts> CACHE = new ConcurrentHashMap<>();

    private final File file;
    private final String dependenciesJsonSha256;
    private final Set<String> capabilities;
    private final File projectRoot;
    private final File appDir;
    private final File appResourcesDir;
    private final Map<String, PluginData> plugins;

    private Facts(
            File file,
            String dependenciesJsonSha256,
            Set<String> capabilities,
            File projectRoot,
            File appDir,
            File appResourcesDir,
            Map<String, PluginData> plugins) {
        this.file = file;
        this.dependenciesJsonSha256 = dependenciesJsonSha256;
        this.capabilities = Collections.unmodifiableSet(capabilities);
        this.projectRoot = projectRoot;
        this.appDir = appDir;
        this.appResourcesDir = appResourcesDir;
        this.plugins = Collections.unmodifiableMap(plugins);
    }

    /**
     * Parses {@code content}, read from {@code file}, reusing the previous result for that file while
     * its content is unchanged.
     *
     * @throws GradleException if {@code content} is not valid facts
     */
    public static Facts read(File file, byte[] content) {
        File absolute = file.getAbsoluteFile();
        String key = absolute.getPath();
        CachedFacts cached = CACHE.get(key);
        if (cached != null && Arrays.equals(cached.content, content)) {
            return cached.facts;
        }
        Facts facts = parse(absolute, new String(content, StandardCharsets.UTF_8));
        CACHE.put(key, new CachedFacts(content, facts));
        return facts;
    }

    /**
     * Parses facts whose relative paths are relative to {@code file}'s directory. Does not touch the
     * file system.
     *
     * @throws GradleException if {@code text} is not valid facts
     */
    public static Facts parse(File file, String text) {
        Object root;
        try {
            root = Json.parse(text);
        } catch (Json.ParseException e) {
            throw invalid(file, e.getMessage());
        }
        Path base = file.getAbsoluteFile().toPath().getParent();
        Reader reader = new Reader(file, base);
        Map<String, Object> top = reader.object(root, "the top level");

        // The two versions are checked before any other field, so that a file this library cannot
        // read asks for a newer library rather than being reported as invalid.
        int minReaderSchemaVersion = reader.integer(top, "minReaderSchemaVersion", "");
        if (minReaderSchemaVersion < 1) {
            throw invalid(file, "minReaderSchemaVersion must be at least 1");
        }
        int schemaVersion = reader.integer(top, "schemaVersion", "");
        if (schemaVersion < 1) {
            throw invalid(file, "schemaVersion must be at least 1");
        }
        if (minReaderSchemaVersion > schemaVersion) {
            throw invalid(file, "minReaderSchemaVersion must not be greater than schemaVersion");
        }
        if (minReaderSchemaVersion > SUPPORTED_SCHEMA_VERSION) {
            throw new GradleException("The NativeScript facts file " + file + " needs org.nativescript:gradle-api"
                    + " supporting facts schema " + minReaderSchemaVersion + ", but this version of the library"
                    + " supports up to " + SUPPORTED_SCHEMA_VERSION + ". Update the plugins of this app that"
                    + " use org.nativescript:gradle-api: any one that pins a newer version of the library is enough.");
        }

        if (schemaVersion > SUPPORTED_SCHEMA_VERSION) {
            LOGGER.info(
                    "{} has schemaVersion {}; this version of org.nativescript:gradle-api knows up to {}"
                            + " and ignores the fields it does not know.",
                    file,
                    schemaVersion,
                    SUPPORTED_SCHEMA_VERSION);
        }

        Map<String, Object> dependenciesJson = reader.object(top.get("dependenciesJson"), "dependenciesJson");
        String dependenciesJsonSha256 = reader.requiredString(dependenciesJson, "sha256", "dependenciesJson.");
        if (!dependenciesJsonSha256.matches("[0-9a-f]{64}")) {
            throw invalid(file, "dependenciesJson.sha256 must be 64 lowercase hex digits");
        }

        Set<String> capabilities = new LinkedHashSet<>();
        if (top.containsKey("capabilities")) {
            List<Object> list = reader.array(top.get("capabilities"), "capabilities");
            for (int i = 0; i < list.size(); i++) {
                capabilities.add(reader.string(list.get(i), "capabilities[" + i + "]"));
            }
        }

        Map<String, Object> project = reader.object(top.get("project"), "project");
        File projectRoot = reader.path(project, "root", "project.");
        File appDir = reader.path(project, "appDir", "project.");
        File appResourcesDir = reader.path(project, "appResourcesDir", "project.");

        Map<String, PluginData> plugins = new LinkedHashMap<>();
        List<Object> pluginList = reader.array(top.get("plugins"), "plugins");
        for (int i = 0; i < pluginList.size(); i++) {
            String at = "plugins[" + i + "]";
            Map<String, Object> entry = reader.object(pluginList.get(i), at);
            String prefix = at + ".";
            String name = reader.requiredString(entry, "name", prefix);
            List<Object> deps = reader.array(entry.get("dependencies"), prefix + "dependencies");
            List<String> dependencies = new ArrayList<>();
            for (int d = 0; d < deps.size(); d++) {
                dependencies.add(reader.string(deps.get(d), prefix + "dependencies[" + d + "]"));
            }
            Map<String, Object> options =
                    entry.containsKey("options") ? reader.object(entry.get("options"), prefix + "options") : Collections.emptyMap();
            File packageDir = reader.path(entry, "packageDir", prefix);
            File nativeDir = reader.path(entry, "nativeDir", prefix);
            // Required by the schema but not exposed: where aars live is the CLI's business.
            reader.requiredString(entry, "aarName", prefix);
            reader.path(entry, "aar", prefix);
            PluginData plugin = new PluginData(name, packageDir, nativeDir, dependencies, options);
            if (plugins.put(name, plugin) != null) {
                throw invalid(file, "plugin '" + name + "' is listed more than once");
            }
        }

        return new Facts(
                file, dependenciesJsonSha256, capabilities, projectRoot, appDir, appResourcesDir, plugins);
    }

    private static GradleException invalid(File file, String problem) {
        return new GradleException("Invalid NativeScript facts file " + file + ": " + problem);
    }

    /** The dependencies.json these facts must match, next to the facts file. */
    public File getDependenciesJsonFile() {
        return new File(file.getAbsoluteFile().getParentFile(), "dependencies.json");
    }

    /**
     * Fails if these facts no longer describe the project: a CLI that does not write facts rewrites
     * the dependencies.json next to them but leaves them behind.
     *
     * @param content the current bytes of {@link #getDependenciesJsonFile()}, null if it is missing
     * @throws GradleException if dependencies.json is missing or does not have the recorded hash
     */
    public void checkDependenciesJson(byte[] content) {
        File dependenciesJson = getDependenciesJsonFile();
        String rerun = " Run `ns prepare android` again with the NativeScript CLI the project uses.";
        if (content == null) {
            throw new GradleException(
                    "There is no " + dependenciesJson + " next to the NativeScript facts file " + file + "." + rerun);
        }
        if (!sha256(content).equals(dependenciesJsonSha256)) {
            throw new GradleException("The NativeScript facts file " + file + " does not match " + dependenciesJson
                    + ": a different NativeScript CLI rewrote " + dependenciesJson.getName()
                    + " after the facts file was written." + rerun);
        }
    }

    static String sha256(byte[] content) {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Every Java platform provides SHA-256", e);
        }
        StringBuilder hex = new StringBuilder(64);
        for (byte b : digest.digest(content)) {
            hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
        }
        return hex.toString();
    }

    public File getFile() {
        return file;
    }

    public Set<String> getCapabilities() {
        return capabilities;
    }

    public File getProjectRoot() {
        return projectRoot;
    }

    public File getAppDir() {
        return appDir;
    }

    public File getAppResourcesDir() {
        return appResourcesDir;
    }

    /** By npm name, in the order the CLI listed them. */
    public Map<String, PluginData> getPlugins() {
        return plugins;
    }

    private static final class CachedFacts {
        final byte[] content;
        final Facts facts;

        CachedFacts(byte[] content, Facts facts) {
            this.content = content;
            this.facts = facts;
        }
    }

    private static final class Reader {
        private final File file;
        private final Path base;

        Reader(File file, Path base) {
            this.file = file;
            this.base = base;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> object(Object value, String what) {
            if (!(value instanceof Map)) {
                throw invalid(file, what + " must be an object");
            }
            return (Map<String, Object>) value;
        }

        @SuppressWarnings("unchecked")
        List<Object> array(Object value, String what) {
            if (!(value instanceof List)) {
                throw invalid(file, what + " must be an array");
            }
            return (List<Object>) value;
        }

        String string(Object value, String what) {
            if (!(value instanceof String)) {
                throw invalid(file, what + " must be a string");
            }
            return (String) value;
        }

        String requiredString(Map<String, Object> object, String key, String prefix) {
            String value = string(object.get(key), prefix + key);
            if (value.isEmpty()) {
                throw invalid(file, prefix + key + " must not be empty");
            }
            return value;
        }

        int integer(Map<String, Object> object, String key, String prefix) {
            Object value = object.get(key);
            if (!(value instanceof Integer)) {
                throw invalid(file, prefix + key + " must be an integer");
            }
            return (Integer) value;
        }

        File path(Map<String, Object> object, String key, String prefix) {
            return base.resolve(requiredString(object, key, prefix)).normalize().toFile();
        }
    }
}
