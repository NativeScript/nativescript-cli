package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.gradle.api.GradleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ResolutionTest {
    private static final String PLATFORMS_ANDROID_VARIABLE = "USER_PROJECT_PLATFORMS_ANDROID";

    @TempDir
    Path tempDir;

    /** Real path of the temp dir, which on macOS sits behind the /var symlink. */
    private Path base;

    private Path project;
    private Path platformsAndroid;
    private Path tempPluginRoot;

    @BeforeEach
    void setUp() throws IOException {
        base = tempDir.toRealPath();
        project = base.resolve("proj");
        platformsAndroid = project.resolve("platforms/android");
        tempPluginRoot = project.resolve("platforms/tempPlugin/p");
        Files.createDirectories(platformsAndroid);
        Files.createDirectories(tempPluginRoot);
    }

    // Paths are relative to the temp dir. Each dependencies.json lists one plugin named after its own
    // directory, so the plugins show which file was read.
    @ParameterizedTest(name = "{0} build, properties ({1}, {2}), environment ({3}, {4})")
    @CsvSource({
        // build, USER_PROJECT_ROOT and USER_PROJECT_PLATFORMS_ANDROID as properties, then as environment
        // variables, then the expected project dir and dependencies.json dir
        "app,    ,      ,          ,      ,                      proj,  proj/platforms/android",
        "app,    other, ,          ,      ,                      other, proj/platforms/android",
        "app,    ,      ,          env,   env/platforms/android, proj,  proj/platforms/android",
        "plugin, ,      ,          ,      ,                      proj,  proj/platforms/android",
        "plugin, other, ,          ,      ,                      other, other/platforms/android",
        "plugin, ,      ,          other, ,                      other, other/platforms/android",
        "plugin, ,      elsewhere, ,      ,                      proj,  elsewhere",
        "plugin, ,      ,          ,      elsewhere,             proj,  elsewhere",
        "plugin, other, elsewhere, env,   env/platforms/android, other, elsewhere",
    })
    void resolvesLegacyProjectDirAndDependenciesJson(
            String build,
            String rootProperty,
            String platformsAndroidProperty,
            String rootEnvironment,
            String platformsAndroidEnvironment,
            String projectDir,
            String dependenciesDir)
            throws IOException {
        for (String dir :
                List.of("proj/platforms/android", "other/platforms/android", "elsewhere", "env/platforms/android")) {
            writeDependencies(base.resolve(dir), dir, "node_modules/x");
        }
        writeDependencies(tempPluginRoot, "the plugin build's own root", "node_modules/x");

        Resolution resolution = Resolution.resolve(inputs(build)
                .property("PLUGIN_NAME", "@scope/p")
                .property("USER_PROJECT_ROOT", inTemp(rootProperty))
                .property(PLATFORMS_ANDROID_VARIABLE, inTemp(platformsAndroidProperty))
                .env("USER_PROJECT_ROOT", inTemp(rootEnvironment))
                .env(PLATFORMS_ANDROID_VARIABLE, inTemp(platformsAndroidEnvironment)));

        boolean pluginBuild = build.equals("plugin");
        assertNull(resolution.getFacts());
        assertEquals(base.resolve(projectDir).toFile(), resolution.getProjectDir());
        assertEquals(Collections.singleton(dependenciesDir), resolution.getPlugins().keySet());
        assertEquals(pluginBuild, resolution.isPluginBuild());
        assertEquals(pluginBuild ? "@scope/p" : null, resolution.getPluginName());
    }

    static Stream<Arguments> legacyAppPaths() {
        String nsconfig = "{\"appPath\": \"source\", \"appResourcesPath\": \"resources\"}";
        // Paths starting with / are relative to the temp dir, others to the project dir.
        Object[][] cases = {
            // appPath, appResourcesPath, nsconfig.json, app dir, App_Resources dir
            {null, null, null, "app", "app/App_Resources"},
            {"src", null, null, "src", "src/App_Resources"},
            {"/abs/app", null, null, "/abs/app", "/abs/app/App_Resources"},
            {null, "res", null, "app", "res"},
            {null, "/abs/res", null, "app", "/abs/res"},
            {null, null, nsconfig, "source", "resources"},
            {null, null, "{\"appPath\": \"source\"}", "source", "source/App_Resources"},
            {"src", "res", nsconfig, "src", "res"},
            {"", null, "{\"appPath\": \"\", \"appResourcesPath\": 5}", "app", "app/App_Resources"},
            // The Android app template stores appPath in ext as a java.nio.file.Path.
            {Path.of("src"), Path.of("res"), null, "src", "res"},
        };
        return Stream.of("app", "plugin")
                .flatMap(build -> Arrays.stream(cases).map(c -> Arguments.of(build, c[0], c[1], c[2], c[3], c[4])));
    }

    @ParameterizedTest(name = "{0} build: appPath={1}, appResourcesPath={2}, nsconfig={3}")
    @MethodSource("legacyAppPaths")
    void resolvesLegacyAppPaths(
            String build,
            Object appPath,
            Object appResourcesPath,
            String nsconfig,
            String appDir,
            String appResourcesDir)
            throws IOException {
        if (nsconfig != null) {
            write(project.resolve("nsconfig.json"), nsconfig);
        }

        Resolution resolution = Resolution.resolve(inputs(build)
                .property("appPath", inTempIfAbsolute(appPath))
                .property("appResourcesPath", inTempIfAbsolute(appResourcesPath)));

        assertEquals(expectedPath(appDir), resolution.getAppDir());
        assertEquals(expectedPath(appResourcesDir), resolution.getAppResourcesDir());
    }

    @Test
    void hasNoPluginsWithoutDependenciesJson() {
        assertTrue(Resolution.resolve(appBuild()).getPlugins().isEmpty());
    }

    @Test
    void reportsInvalidNsConfig() throws IOException {
        Path nsconfig = project.resolve("nsconfig.json");
        write(nsconfig, "{\"appPath\": ");

        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
        assertTrue(e.getMessage().contains(nsconfig.toString()), e.getMessage());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "[{\"name\": \"a\", ",
        "{}",
        "[1]",
        "[{\"name\": \"a\"}]",
        "[{\"name\": 1, \"directory\": \"x\"}]",
    })
    void reportsInvalidDependenciesJson(String text) throws IOException {
        Path file = platformsAndroid.resolve("dependencies.json");
        write(file, text);

        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
        assertTrue(e.getMessage().startsWith("Invalid " + file), e.getMessage());
    }

    // The hash recorded is that of "[]\n"; dependencies.json gets the given text plus a newline.
    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', value = {
        // case | facts passed with -Pnativescript.factsFile | facts record the hash | dependencies.json | facts used
        "hash matches                                 | false | true  | []  | true",
        "hash differs                                 | false | true  | [ ] | false",
        "dependencies.json missing                    | false | true  |     | false",
        "no hash recorded, dependencies.json changed  | false | false | [ ] | true",
        "stale -Pnativescript.factsFile               | true  | true  | [ ] | false",
    })
    void checksFactsAgainstDependenciesJson(
            String description, boolean explicit, boolean hashed, String dependenciesJson, boolean used)
            throws IOException {
        Path dir = explicit ? base.resolve("explicit") : platformsAndroid;
        if (dependenciesJson != null) {
            write(dir.resolve("dependencies.json"), dependenciesJson + "\n");
        }
        String sha256 = hashed ? "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570" : null;
        Path facts = writeFacts(dir.resolve(Resolution.FACTS_FILE_NAME), project, "[]", sha256);

        FakeInputs inputs = appBuild().property(Resolution.FACTS_FILE_PROPERTY, explicit ? facts.toString() : null);

        assertEquals(used, Resolution.resolve(inputs).getFacts() != null);
    }

    @Test
    void explicitFactsFileIsResolvedAgainstRootDirAndWins() throws IOException {
        writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);
        Path explicit = writeFacts(platformsAndroid.resolve("sub/facts.json"), project, "[]", null);

        Resolution resolution =
                Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, "sub/facts.json"));

        assertEquals(explicit.toFile(), resolution.getFacts().getFile());
    }

    @Test
    void reportsMissingExplicitFactsFile() {
        Path missing = base.resolve("missing.json");

        GradleException e = assertThrows(
                GradleException.class,
                () -> Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, missing.toString())));
        assertTrue(e.getMessage().contains(missing.toString()), e.getMessage());
    }

    @ParameterizedTest(name = "{0} build, {1}")
    @CsvSource({"plugin, property, true", "plugin, environment variable, true", "app, environment variable, false"})
    void looksForFactsInUserProjectPlatformsAndroid(String build, String source, boolean found) throws IOException {
        Path elsewhere = base.resolve("elsewhere");
        Path facts = writeFacts(elsewhere.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);
        FakeInputs inputs = inputs(build);
        if (source.equals("property")) {
            inputs.property(PLATFORMS_ANDROID_VARIABLE, elsewhere.toString());
        } else {
            inputs.env(PLATFORMS_ANDROID_VARIABLE, elsewhere.toString());
        }

        Resolution resolution = Resolution.resolve(inputs);

        Facts used = resolution.getFacts();
        assertEquals(found ? facts.toFile() : null, used != null ? used.getFile() : null);
        assertEquals(build.equals("plugin"), resolution.isPluginBuild());
        assertEquals(build.equals("plugin") ? "@scope/p" : null, resolution.getPluginName());
    }

    @Test
    void reportsInvalidFacts() throws IOException {
        Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
        write(factsFile, "{}");

        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
        assertTrue(e.getMessage().startsWith("Invalid NativeScript facts file " + factsFile), e.getMessage());
    }

    @ParameterizedTest(name = "with facts: {0}")
    @ValueSource(booleans = {false, true})
    void findsTheSamePluginsWithAndWithoutFacts(boolean withFacts) throws IOException {
        Files.createDirectories(installPackage(project, "listed").resolve("platforms/android"));
        Path unlisted = installPackage(project, "@s/unlisted");
        Files.createDirectories(unlisted.resolve("platforms/android"));
        installPackage(project, "js-only");
        if (withFacts) {
            String plugins = "[" + plugin("listed", "../../vendor/listed") + "]";
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, plugins, null);
        } else {
            writeDependencies(platformsAndroid, "listed", "../../vendor/listed");
        }

        Resolution resolution = Resolution.resolve(appBuild());

        assertEquals(withFacts, resolution.getFacts() != null);
        PluginData listed = resolution.findPlugin("listed");
        assertEquals(project.resolve("vendor/listed/platforms/android").toFile(), listed.getNativeDir());
        assertEquals(withFacts ? "listed" : null, listed.getAarName());
        assertEquals(project.resolve("vendor/listed").toFile(), resolution.findPackage("listed"));

        PluginData plugin = resolution.findPlugin("@s/unlisted");
        assertEquals("@s/unlisted", plugin.getName());
        assertEquals(unlisted.toFile(), plugin.getPackageDir());
        assertEquals(unlisted.resolve("platforms/android").toFile(), plugin.getNativeDir());
        assertNull(plugin.getAarName());
        assertNull(plugin.getAar());
        assertTrue(plugin.getOptions().isEmpty());

        assertNull(resolution.findPlugin("js-only"));
        assertNull(resolution.findPlugin("not-installed"));
    }

    @Test
    void findsPackagesLikeNode() throws IOException {
        Path hoisted = installPackage(base, "hoisted");
        Files.createDirectories(hoisted.resolve("platforms/android"));
        installPackage(base, "dup");
        Path near = installPackage(project, "dup");
        Files.createDirectories(project.resolve("node_modules/no-package-json"));

        Resolution resolution = Resolution.resolve(appBuild());

        assertEquals(hoisted.toFile(), resolution.findPlugin("hoisted").getPackageDir());
        assertEquals(near.toFile(), resolution.findPackage("dup"));
        assertNull(resolution.findPackage("no-package-json"));
    }

    @Test
    void lookupStartsAtFactsProjectRoot() throws IOException {
        Path otherProject = Files.createDirectories(base.resolve("other"));
        Path pkg = installPackage(otherProject, "elsewhere");
        writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), otherProject, "[]", null);

        assertEquals(pkg.toFile(), Resolution.resolve(appBuild()).findPackage("elsewhere"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"../x", "@scope", "@scope/", "a/b", "@a/b/c", "a\\b", "..", ".", "@/x", "@s/..", "c:x"})
    void rejectsInvalidNames(String name) {
        Resolution resolution = Resolution.resolve(appBuild());

        assertThrows(IllegalArgumentException.class, () -> resolution.findPlugin(name));
        assertThrows(IllegalArgumentException.class, () -> resolution.findPackage(name));
    }

    private FakeInputs inputs(String build) {
        return build.equals("plugin") ? pluginBuild() : appBuild();
    }

    private FakeInputs appBuild() {
        return new FakeInputs(platformsAndroid.toFile());
    }

    private FakeInputs pluginBuild() {
        return new FakeInputs(tempPluginRoot.toFile())
                .property("tempBuild", "true")
                .property("PLUGIN_NAME", "@scope/p");
    }

    private String inTemp(String path) {
        return path != null ? base.resolve(path).toString() : null;
    }

    private Object inTempIfAbsolute(Object path) {
        return path instanceof String && ((String) path).startsWith("/") ? inTemp(((String) path).substring(1)) : path;
    }

    private File expectedPath(String path) {
        return (path.startsWith("/") ? base.resolve(path.substring(1)) : project.resolve(path)).toFile();
    }

    private static Path installPackage(Path dir, String name) throws IOException {
        Path pkg = dir.resolve("node_modules").resolve(name);
        write(pkg.resolve("package.json"), "{\"name\": \"" + name + "\"}");
        return pkg;
    }

    private static void writeDependencies(Path dir, String name, String directory) throws IOException {
        write(dir.resolve("dependencies.json"), "[{\"name\": \"" + name + "\", \"directory\": \"" + directory + "\"}]");
    }

    private static Path writeFacts(Path file, Path root, String plugins, String dependenciesJsonSha256)
            throws IOException {
        String rootPath = root.toString().replace('\\', '/');
        String hash = dependenciesJsonSha256 != null
                ? "\"dependenciesJson\": {\"sha256\": \"" + dependenciesJsonSha256 + "\"}, "
                : "";
        write(file, "{\"schemaVersion\": 1, " + hash
                + "\"project\": {\"root\": \"" + rootPath + "\", \"appDir\": \"" + rootPath + "/src\","
                + " \"appResourcesDir\": \"" + rootPath + "/src/App_Resources\"},"
                + " \"plugins\": " + plugins + "}");
        return file;
    }

    private static String plugin(String name, String packageDir) {
        return "{\"name\": \"" + name + "\", \"packageDir\": \"" + packageDir + "\","
                + " \"nativeDir\": \"" + packageDir + "/platforms/android\", \"aarName\": \"" + name + "\","
                + " \"aar\": \"" + packageDir + "/platforms/android/" + name + ".aar\", \"dependencies\": []}";
    }

    private static void write(Path file, String text) throws IOException {
        Files.createDirectories(file.getParent());
        Files.write(file, text.getBytes(StandardCharsets.UTF_8));
    }

    private static final class FakeInputs implements BuildInputs {
        private final Map<String, Object> properties = new HashMap<>();
        private final Map<String, String> environment = new HashMap<>();
        private final File rootDir;

        FakeInputs(File rootDir) {
            this.rootDir = rootDir;
        }

        /** Does nothing if {@code value} is null, so tables can leave inputs out. */
        FakeInputs property(String name, Object value) {
            if (value != null) {
                properties.put(name, value);
            }
            return this;
        }

        FakeInputs env(String name, String value) {
            if (value != null) {
                environment.put(name, value);
            }
            return this;
        }

        @Override
        public Object property(String name) {
            return properties.get(name);
        }

        @Override
        public String environmentVariable(String name) {
            return environment.get(name);
        }

        @Override
        public File rootDir() {
            return rootDir;
        }
    }
}
