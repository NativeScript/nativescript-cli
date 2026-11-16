package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.gradle.api.GradleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ResolutionTest {
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

    @Nested
    class LegacyAppBuild {
        @Test
        void resolvesFromTemplateInputs() throws IOException {
            write(platformsAndroid.resolve("dependencies.json"), "["
                    + "{\"name\": \"@scope/a\", \"directory\": \"../../node_modules/@scope/a\", \"dependencies\": []},"
                    + "{\"name\": \"b\", \"directory\": \"../../node_modules/b\", \"dependencies\": [\"@scope/a\"]}"
                    + "]");
            FakeInputs inputs = appBuild().property("USER_PROJECT_ROOT", platformsAndroid + "/../..");

            Resolution resolution = Resolution.resolve(inputs);

            assertNull(resolution.getFacts());
            assertFalse(resolution.isPluginBuild());
            assertNull(resolution.getPluginName());
            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(project.resolve("app").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("app/App_Resources").toFile(), resolution.getAppResourcesDir());
            assertTrue(resolution.getCapabilities().isEmpty());
            assertEquals(Arrays.asList("@scope/a", "b"), new ArrayList<>(resolution.getPlugins().keySet()));

            PluginData a = resolution.getPlugins().get("@scope/a");
            assertEquals("@scope/a", a.getName());
            assertEquals(project.resolve("node_modules/@scope/a").toFile(), a.getPackageDir());
            assertEquals(project.resolve("node_modules/@scope/a/platforms/android").toFile(), a.getNativeDir());
            assertNull(a.getAarName());
            assertNull(a.getAar());
            assertTrue(a.getOptions().isEmpty());
            assertEquals(Collections.emptyList(), a.getDependencies());
            assertEquals(Collections.singletonList("@scope/a"), resolution.getPlugins().get("b").getDependencies());
        }

        @Test
        void defaultsProjectDirToTwoLevelsUp() {
            assertEquals(project.toFile(), Resolution.resolve(appBuild()).getProjectDir());
        }

        @Test
        void ignoresEnvironmentVariables() throws IOException {
            Path elsewhere = Files.createDirectories(base.resolve("elsewhere"));
            writeFacts(elsewhere.resolve(Resolution.FACTS_FILE_NAME), elsewhere, "[]");
            FakeInputs inputs = appBuild()
                    .env("USER_PROJECT_ROOT", elsewhere.toString())
                    .env("USER_PROJECT_PLATFORMS_ANDROID", elsewhere.toString());

            Resolution resolution = Resolution.resolve(inputs);

            assertNull(resolution.getFacts());
            assertEquals(project.toFile(), resolution.getProjectDir());
        }

        @Test
        void ignoresPluginNameOutsidePluginBuilds() {
            assertNull(Resolution.resolve(appBuild().property("PLUGIN_NAME", "x")).getPluginName());
        }

        @Test
        void resolvesRelativeAppPathProperty() {
            Resolution resolution = Resolution.resolve(appBuild().property("appPath", "src"));

            assertEquals(project.resolve("src").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("src/App_Resources").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void keepsAbsoluteAppPathProperty() {
            Path app = base.resolve("other/app");

            Resolution resolution = Resolution.resolve(appBuild().property("appPath", app.toString()));

            assertEquals(app.toFile(), resolution.getAppDir());
            assertEquals(app.resolve("App_Resources").toFile(), resolution.getAppResourcesDir());
        }

        // The Android template stores appPath in ext as a java.nio.file.Path, not a String.
        @Test
        void acceptsPathObjectsAsProperties() {
            Path app = base.resolve("other/app");

            Resolution resolution = Resolution.resolve(
                    appBuild().property("appPath", app).property("appResourcesPath", Path.of("res")));

            assertEquals(app.toFile(), resolution.getAppDir());
            assertEquals(project.resolve("res").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void resolvesAppResourcesPathProperty() {
            assertEquals(
                    project.resolve("res").toFile(),
                    Resolution.resolve(appBuild().property("appResourcesPath", "res")).getAppResourcesDir());
            Path absolute = base.resolve("abs/res");
            assertEquals(
                    absolute.toFile(),
                    Resolution.resolve(appBuild().property("appResourcesPath", absolute.toString()))
                            .getAppResourcesDir());
        }

        @Test
        void readsPathsFromNsConfig() throws IOException {
            write(project.resolve("nsconfig.json"), "{\"appPath\": \"source\", \"appResourcesPath\": \"resources\"}");

            Resolution resolution = Resolution.resolve(appBuild());

            assertEquals(project.resolve("source").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("resources").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void derivesAppResourcesFromNsConfigAppPath() throws IOException {
            write(project.resolve("nsconfig.json"), "{\"appPath\": \"source\"}");

            Resolution resolution = Resolution.resolve(appBuild());

            assertEquals(project.resolve("source").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("source/App_Resources").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void propertiesWinOverNsConfig() throws IOException {
            write(project.resolve("nsconfig.json"), "{\"appPath\": \"source\", \"appResourcesPath\": \"resources\"}");

            Resolution resolution =
                    Resolution.resolve(appBuild().property("appPath", "src").property("appResourcesPath", "res"));

            assertEquals(project.resolve("src").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("res").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void treatsEmptyPropertiesAndNsConfigValuesAsAbsent() throws IOException {
            write(project.resolve("nsconfig.json"), "{\"appPath\": \"\", \"appResourcesPath\": 5}");

            Resolution resolution = Resolution.resolve(appBuild().property("appPath", ""));

            assertEquals(project.resolve("app").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("app/App_Resources").toFile(), resolution.getAppResourcesDir());
        }

        @Test
        void reportsInvalidNsConfig() throws IOException {
            Path nsconfig = project.resolve("nsconfig.json");
            write(nsconfig, "{\"appPath\": ");

            GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
            assertTrue(e.getMessage().contains(nsconfig.toString()), e.getMessage());
        }

        @Test
        void hasNoPluginsWithoutDependenciesJson() {
            assertTrue(Resolution.resolve(appBuild()).getPlugins().isEmpty());
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
    }

    @Nested
    class LegacyPluginBuild {
        @Test
        void resolvesFromProperties() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            FakeInputs inputs = pluginBuild()
                    .property("USER_PROJECT_PLATFORMS_ANDROID", platformsAndroid.toString())
                    .property("USER_PROJECT_ROOT", project.toString());

            Resolution resolution = Resolution.resolve(inputs);

            assertNull(resolution.getFacts());
            assertTrue(resolution.isPluginBuild());
            assertEquals("@scope/p", resolution.getPluginName());
            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(project.resolve("app").toFile(), resolution.getAppDir());
            assertEquals(Collections.singleton("x"), resolution.getPlugins().keySet());
            assertEquals(
                    project.resolve("node_modules/x/platforms/android").toFile(),
                    resolution.getPlugins().get("x").getNativeDir());
        }

        @Test
        void fallsBackToEnvironmentVariables() throws IOException {
            Path otherProject = Files.createDirectories(base.resolve("other"));
            Path otherAndroid = Files.createDirectories(base.resolve("elsewhere/android"));
            writeDependencies(otherAndroid, "../modules/x");

            Resolution resolution = Resolution.resolve(pluginBuild()
                    .env("USER_PROJECT_PLATFORMS_ANDROID", otherAndroid.toString())
                    .env("USER_PROJECT_ROOT", otherProject.toString()));

            assertEquals(otherProject.toFile(), resolution.getProjectDir());
            assertEquals(
                    base.resolve("elsewhere/modules/x").toFile(),
                    resolution.getPlugins().get("x").getPackageDir());
        }

        @Test
        void propertiesWinOverEnvironmentVariables() throws IOException {
            Path otherProject = Files.createDirectories(base.resolve("other"));
            Path otherAndroid = Files.createDirectories(base.resolve("elsewhere/android"));
            writeDependencies(platformsAndroid, "../../node_modules/x");
            writeDependencies(otherAndroid, "../modules/y");

            Resolution resolution = Resolution.resolve(pluginBuild()
                    .property("USER_PROJECT_PLATFORMS_ANDROID", platformsAndroid.toString())
                    .property("USER_PROJECT_ROOT", project.toString())
                    .env("USER_PROJECT_PLATFORMS_ANDROID", otherAndroid.toString())
                    .env("USER_PROJECT_ROOT", otherProject.toString()));

            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(Collections.singleton("x"), resolution.getPlugins().keySet());
        }

        @Test
        void defaultsToThreeLevelsUpAndItsPlatformsAndroid() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");

            Resolution resolution = Resolution.resolve(pluginBuild());

            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(project.resolve("node_modules/x").toFile(), resolution.getPlugins().get("x").getPackageDir());
        }

        @Test
        void doesNotReadDependenciesJsonFromItsOwnRoot() throws IOException {
            writeDependencies(tempPluginRoot, "../../node_modules/x");

            assertTrue(Resolution.resolve(pluginBuild()).getPlugins().isEmpty());
        }
    }

    @Nested
    class FactsLookup {
        @Test
        void usesFactsWhoseDependenciesJsonHashMatches() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            writeFactsMatchingDependencies(platformsAndroid, "\"from-facts\"");

            Resolution resolution = Resolution.resolve(appBuild());

            assertNotNull(resolution.getFacts());
            assertEquals(Collections.singleton("from-facts"), resolution.getCapabilities());
        }

        @Test
        void ignoresFactsWhenDependenciesJsonChangedSince() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            writeFactsMatchingDependencies(platformsAndroid, "\"from-facts\"");
            writeDependencies(platformsAndroid, "../../node_modules/rewritten");

            Resolution resolution = Resolution.resolve(appBuild());

            assertNull(resolution.getFacts());
            assertTrue(resolution.getCapabilities().isEmpty());
            assertEquals(Collections.singleton("rewritten"), resolution.getPlugins().keySet());
        }

        @Test
        void ignoresFactsWhenDependenciesJsonIsMissing() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            writeFactsMatchingDependencies(platformsAndroid, "\"from-facts\"");
            Files.delete(platformsAndroid.resolve("dependencies.json"));

            Resolution resolution = Resolution.resolve(appBuild());

            assertNull(resolution.getFacts());
            assertTrue(resolution.getPlugins().isEmpty());
        }

        @Test
        void ignoresStaleExplicitFactsFileInsteadOfFailing() throws IOException {
            Path dir = Files.createDirectories(base.resolve("explicit"));
            writeDependencies(dir, "../project/node_modules/x");
            Path explicit = writeFactsMatchingDependencies(dir, "\"explicit\"");
            writeDependencies(dir, "../project/node_modules/changed");

            Resolution resolution =
                    Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, explicit.toString()));

            assertNull(resolution.getFacts());
            assertTrue(resolution.getCapabilities().isEmpty());
        }

        @Test
        void trustsFactsWithoutDependenciesJsonHash() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", "\"no-hash\"");
            writeDependencies(platformsAndroid, "../../node_modules/rewritten");

            Resolution resolution = Resolution.resolve(appBuild());

            assertNotNull(resolution.getFacts());
            assertEquals(Collections.singleton("no-hash"), resolution.getCapabilities());
        }

        @Test
        void explicitPropertyWins() throws IOException {
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", "\"in-root\"");
            Path explicit = base.resolve("explicit/facts.json");
            Files.createDirectories(explicit.getParent());
            writeFacts(explicit, project, "[]", "\"explicit\"");

            Resolution resolution =
                    Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, explicit.toString()));

            assertEquals(explicit.toFile(), resolution.getFacts().getFile());
            assertEquals(Collections.singleton("explicit"), resolution.getCapabilities());
        }

        @Test
        void resolvesRelativePropertyAgainstRootDir() throws IOException {
            Path facts = platformsAndroid.resolve("sub/facts.json");
            Files.createDirectories(facts.getParent());
            writeFacts(facts, project, "[]");

            Resolution resolution =
                    Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, "sub/facts.json"));

            assertEquals(facts.toFile(), resolution.getFacts().getFile());
        }

        @Test
        void reportsMissingExplicitFile() {
            Path missing = base.resolve("missing.json");

            GradleException e = assertThrows(
                    GradleException.class,
                    () -> Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, missing.toString())));
            assertTrue(e.getMessage().contains(missing.toString()), e.getMessage());
        }

        @Test
        void findsFactsInRootDir() throws IOException {
            Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
            writeFacts(factsFile, project, "[" + plugin("@s/listed", "../../node_modules/@s/listed") + "]", "\"cap\"");

            Resolution resolution = Resolution.resolve(appBuild());

            assertNotNull(resolution.getFacts());
            assertEquals(factsFile.toFile(), resolution.getFacts().getFile());
            assertFalse(resolution.isPluginBuild());
            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(project.resolve("src").toFile(), resolution.getAppDir());
            assertEquals(project.resolve("src/App_Resources").toFile(), resolution.getAppResourcesDir());
            assertEquals(Collections.singleton("cap"), resolution.getCapabilities());
            assertEquals(Collections.singleton("@s/listed"), resolution.getPlugins().keySet());
            assertEquals("s_listed", resolution.getPlugins().get("@s/listed").getAarName());
        }

        @Test
        void factsTakePrecedenceOverDependenciesJson() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/legacy");
            writeFacts(
                    platformsAndroid.resolve(Resolution.FACTS_FILE_NAME),
                    project,
                    "[" + plugin("from-facts", "../../node_modules/from-facts") + "]");

            Resolution resolution = Resolution.resolve(appBuild());

            assertEquals(Collections.singleton("from-facts"), resolution.getPlugins().keySet());
        }

        @Test
        void factsTakePrecedenceOverTemplateProperties() throws IOException {
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]");

            Resolution resolution = Resolution.resolve(appBuild()
                    .property("USER_PROJECT_ROOT", base.toString())
                    .property("appPath", "elsewhere"));

            assertEquals(project.toFile(), resolution.getProjectDir());
            assertEquals(project.resolve("src").toFile(), resolution.getAppDir());
        }

        @Test
        void pluginBuildFindsFactsInUserProjectPlatformsAndroidProperty() throws IOException {
            Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
            writeFacts(factsFile, project, "[]", "\"cap\"");

            Resolution resolution = Resolution.resolve(
                    pluginBuild().property("USER_PROJECT_PLATFORMS_ANDROID", platformsAndroid.toString()));

            assertEquals(factsFile.toFile(), resolution.getFacts().getFile());
            assertTrue(resolution.isPluginBuild());
            assertEquals("@scope/p", resolution.getPluginName());
            assertEquals(Collections.singleton("cap"), resolution.getCapabilities());
        }

        @Test
        void pluginBuildFindsFactsInUserProjectPlatformsAndroidEnvironmentVariable() throws IOException {
            Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
            writeFacts(factsFile, project, "[]");

            Resolution resolution = Resolution.resolve(
                    pluginBuild().env("USER_PROJECT_PLATFORMS_ANDROID", platformsAndroid.toString()));

            assertEquals(factsFile.toFile(), resolution.getFacts().getFile());
        }

        @Test
        void pluginBuildWithoutFactsLocationFallsBackToLegacy() throws IOException {
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]");

            assertNull(Resolution.resolve(pluginBuild()).getFacts());
        }

        @Test
        void reportsInvalidFacts() throws IOException {
            Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
            write(factsFile, "{}");

            GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
            assertTrue(e.getMessage().startsWith("Invalid NativeScript facts file " + factsFile), e.getMessage());
        }
    }

    @Nested
    class PackageLookup {
        @Test
        void findPluginReturnsListedPlugin() throws IOException {
            writeDependencies(platformsAndroid, "../../node_modules/x");
            Resolution resolution = Resolution.resolve(appBuild());

            assertSame(resolution.getPlugins().get("x"), resolution.findPlugin("x"));
        }

        @Test
        void findPluginFallsBackToInstalledPackageWithoutFacts() throws IOException {
            Path pkg = installPackage(project, "@s/unlisted");
            Files.createDirectories(pkg.resolve("platforms/android"));

            PluginData plugin = Resolution.resolve(appBuild()).findPlugin("@s/unlisted");

            assertNotNull(plugin);
            assertEquals("@s/unlisted", plugin.getName());
            assertEquals(pkg.toFile(), plugin.getPackageDir());
            assertEquals(pkg.resolve("platforms/android").toFile(), plugin.getNativeDir());
            assertNull(plugin.getAarName());
            assertNull(plugin.getAar());
            assertTrue(plugin.getDependencies().isEmpty());
            assertTrue(plugin.getOptions().isEmpty());
        }

        @Test
        void findPluginIgnoresInstalledPackageWithoutNativeDir() throws IOException {
            installPackage(project, "js-only");
            Resolution resolution = Resolution.resolve(appBuild());

            assertNull(resolution.findPlugin("js-only"));
            assertNotNull(resolution.findPackage("js-only"));
        }

        @Test
        void findPluginFallsBackToInstalledPackageWithFacts() throws IOException {
            Path pkg = installPackage(project, "@s/unlisted");
            Files.createDirectories(pkg.resolve("platforms/android"));
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]");
            Resolution resolution = Resolution.resolve(appBuild());

            PluginData plugin = resolution.findPlugin("@s/unlisted");

            assertNotNull(resolution.getFacts());
            assertNotNull(plugin);
            assertEquals(pkg.toFile(), plugin.getPackageDir());
            assertEquals(pkg.resolve("platforms/android").toFile(), plugin.getNativeDir());
            assertNull(plugin.getAarName());
            assertNull(plugin.getAar());
            assertTrue(plugin.getOptions().isEmpty());
        }

        @Test
        void findPluginWithFactsIgnoresInstalledPackageWithoutNativeDir() throws IOException {
            installPackage(project, "js-only");
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]");
            Resolution resolution = Resolution.resolve(appBuild());

            assertNotNull(resolution.getFacts());
            assertNull(resolution.findPlugin("js-only"));
            assertNull(resolution.findPlugin("not-installed"));
        }

        @Test
        void findPluginWithFactsPrefersListedDataOverInstalledPackage() throws IOException {
            Path installed = installPackage(project, "@s/listed");
            Files.createDirectories(installed.resolve("platforms/android"));
            writeFacts(
                    platformsAndroid.resolve(Resolution.FACTS_FILE_NAME),
                    project,
                    "[" + plugin("@s/listed", "../../vendor/listed") + "]");

            PluginData plugin = Resolution.resolve(appBuild()).findPlugin("@s/listed");

            assertEquals(project.resolve("vendor/listed/platforms/android").toFile(), plugin.getNativeDir());
            assertEquals("s_listed", plugin.getAarName());
        }

        @Test
        void findPluginWalksUpLikeNode() throws IOException {
            Path pkg = installPackage(base, "hoisted");
            Files.createDirectories(pkg.resolve("platforms/android"));

            Resolution resolution = Resolution.resolve(appBuild());

            assertEquals(pkg.toFile(), resolution.findPlugin("hoisted").getPackageDir());
            assertEquals(pkg.toFile(), resolution.findPackage("hoisted"));
        }

        @Test
        void nearestInstallWins() throws IOException {
            installPackage(base, "dup");
            Path near = installPackage(project, "dup");

            assertEquals(near.toFile(), Resolution.resolve(appBuild()).findPackage("dup"));
        }

        @Test
        void directoryWithoutPackageJsonIsNotAPackage() throws IOException {
            Files.createDirectories(project.resolve("node_modules/empty"));

            Resolution resolution = Resolution.resolve(appBuild());

            assertNull(resolution.findPlugin("empty"));
            assertNull(resolution.findPackage("empty"));
        }

        @Test
        void returnsNullWhenNotInstalled() {
            Resolution resolution = Resolution.resolve(appBuild());

            assertNull(resolution.findPlugin("nativescript-gradle-api-test-not-installed"));
            assertNull(resolution.findPackage("@nativescript-gradle-api-test/not-installed"));
        }

        @Test
        void findPackageReturnsListedPackageDirOverNodeLookup() throws IOException {
            installPackage(project, "@s/listed");
            writeFacts(
                    platformsAndroid.resolve(Resolution.FACTS_FILE_NAME),
                    project,
                    "[" + plugin("@s/listed", "../../vendor/listed") + "]");

            Resolution resolution = Resolution.resolve(appBuild());

            assertEquals(project.resolve("vendor/listed").toFile(), resolution.findPackage("@s/listed"));
        }

        @Test
        void findPackageFindsScopedInstalledPackage() throws IOException {
            Path pkg = installPackage(project, "@scope/name");

            assertEquals(pkg.toFile(), Resolution.resolve(appBuild()).findPackage("@scope/name"));
        }

        @Test
        void lookupStartsAtFactsProjectRoot() throws IOException {
            Path otherProject = Files.createDirectories(base.resolve("other"));
            Path pkg = installPackage(otherProject, "elsewhere");
            writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), otherProject, "[]");

            assertEquals(pkg.toFile(), Resolution.resolve(appBuild()).findPackage("elsewhere"));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "../x", "@scope", "@scope/", "a/b", "@a/b/c", "a\\b", "..", ".", "@/x", "@s/..", "c:x"})
        void rejectsInvalidNames(String name) {
            Resolution resolution = Resolution.resolve(appBuild());

            assertThrows(IllegalArgumentException.class, () -> resolution.findPlugin(name));
            assertThrows(IllegalArgumentException.class, () -> resolution.findPackage(name));
        }

        @Test
        void rejectsNullName() {
            Resolution resolution = Resolution.resolve(appBuild());

            assertThrows(IllegalArgumentException.class, () -> resolution.findPlugin(null));
            assertThrows(IllegalArgumentException.class, () -> resolution.findPackage(null));
        }
    }

    private FakeInputs appBuild() {
        return new FakeInputs(platformsAndroid.toFile());
    }

    private FakeInputs pluginBuild() {
        return new FakeInputs(tempPluginRoot.toFile()).property("tempBuild", "true").property("PLUGIN_NAME", "@scope/p");
    }

    private static Path installPackage(Path dir, String name) throws IOException {
        Path pkg = dir.resolve("node_modules").resolve(name);
        Files.createDirectories(pkg);
        write(pkg.resolve("package.json"), "{\"name\": \"" + name + "\"}");
        return pkg;
    }

    private static void writeDependencies(Path dir, String directory) throws IOException {
        String name = directory.substring(directory.lastIndexOf('/') + 1);
        write(dir.resolve("dependencies.json"),
                "[{\"name\": \"" + name + "\", \"directory\": \"" + directory + "\", \"dependencies\": []}]");
    }

    /** Writes facts whose project root is {@code root}, given relative to the file's directory. */
    private static void writeFacts(Path file, Path root, String plugins, String... capabilities) throws IOException {
        String rootPath = file.getParent().relativize(root).toString().replace('\\', '/');
        if (rootPath.isEmpty()) {
            rootPath = ".";
        }
        write(file, "{\"schemaVersion\": 1, \"capabilities\": [" + String.join(", ", capabilities) + "],"
                + " \"project\": {\"root\": \"" + rootPath + "\", \"appDir\": \"" + rootPath + "/src\","
                + " \"appResourcesDir\": \"" + rootPath + "/src/App_Resources\"},"
                + " \"plugins\": " + plugins + "}");
    }

    /**
     * Writes facts next to {@code dir}'s current dependencies.json, recording its hash as the CLI
     * does, with the project root at {@code project}.
     */
    private Path writeFactsMatchingDependencies(Path dir, String capability) throws IOException {
        Path file = dir.resolve(Resolution.FACTS_FILE_NAME);
        writeFacts(file, project, "[]", capability);
        String sha256 = Facts.sha256(Files.readAllBytes(dir.resolve("dependencies.json")));
        String text = new String(Files.readAllBytes(file), StandardCharsets.UTF_8);
        write(file, text.replaceFirst("\\{", "{\"dependenciesJson\": {\"sha256\": \"" + sha256 + "\"}, "));
        return file;
    }

    private static String plugin(String name, String packageDir) {
        String aarName = name.replace("@", "").replace('/', '_');
        return "{\"name\": \"" + name + "\", \"packageDir\": \"" + packageDir + "\","
                + " \"nativeDir\": \"" + packageDir + "/platforms/android\", \"aarName\": \"" + aarName + "\","
                + " \"aar\": \"" + packageDir + "/platforms/android/" + aarName + ".aar\", \"dependencies\": []}";
    }

    private static void write(Path file, String text) throws IOException {
        Files.write(file, text.getBytes(StandardCharsets.UTF_8));
    }

    private static final class FakeInputs implements BuildInputs {
        private final Map<String, Object> properties = new HashMap<>();
        private final Map<String, String> environment = new HashMap<>();
        private final File rootDir;

        FakeInputs(File rootDir) {
            this.rootDir = rootDir;
        }

        FakeInputs property(String name, Object value) {
            properties.put(name, value);
            return this;
        }

        FakeInputs env(String name, String value) {
            environment.put(name, value);
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
