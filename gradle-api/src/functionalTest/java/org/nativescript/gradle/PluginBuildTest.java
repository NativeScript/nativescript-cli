package org.nativescript.gradle;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.gradle.testkit.runner.BuildResult;
import org.gradle.testkit.runner.GradleRunner;
import org.gradle.testkit.runner.TaskOutcome;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * The CLI's build of a plugin's aar: a CLI's template with the extracted block of the sample's
 * include.gradle appended, as the CLI does, compiling a class that uses one from core's aar.
 */
class PluginBuildTest {
    // The Android Gradle Plugin version decides which Gradle versions can run this build.
    private static final String ANDROID_GRADLE_PLUGIN = "8.12.1";
    private static final String GRADLE = "8.14.3";
    private static final String COMPILE_TASK = ":compileReleaseJavaWithJavac";
    private static final String SAMPLE_AAR_NAME = "gradle_api_sample";

    enum Template {
        /**
         * CLI 9.1 and older: a copy of the template they ship, in cli-9.1-plugin-template. It must
         * never change, so that the sample keeps being checked against what those CLIs run.
         */
        CLI_9_1,
        /** The current CLI's template, from vendor/gradle-plugin. */
        CURRENT;

        Path dir() throws URISyntaxException {
            return this == CURRENT
                    ? Fixtures.vendorGradlePluginDir()
                    : new File(PluginBuildTest.class.getResource("/cli-9.1-plugin-template").toURI()).toPath();
        }
    }

    /** {@code android.pluginBuildLocation}: where the build reads plugins' native files from. */
    enum Layout {
        NODE_MODULES,
        /** The CLI's copies in platforms/android/.ns-plugins, which dependencies.json points at. */
        PLATFORMS
    }

    // Evaluated inside a dependencies block, as the extracted block is.
    private static final String PROBE = String.join("\n",
            "",
            "dependencies {",
            "    println \"NS|pluginBuild|${nativescript.pluginBuild}\"",
            "    println \"NS|self|${nativescript.self?.name}\"",
            "    println \"NS|buildingSample|${nativescript.isBuildingPlugin('" + Fixtures.SAMPLE_NAME + "')}\"",
            "    println \"NS|projectRoot|${nativescript.projectRoot}\"",
            "    println \"NS|appDir|${nativescript.appDir}\"",
            "    println \"NS|appResourcesDir|${nativescript.appResourcesDir}\"",
            "    println \"NS|corePackage|${nativescript.findPackage('@nativescript/core')}\"",
            "}",
            "println \"NS|compileOnly|\" + configurations.compileOnly.dependencies.withType(FileCollectionDependency)"
                    + ".collectMany { it.files.files }.collect { it.path }.sort().join(',')",
            "");

    @TempDir
    Path tempDir;

    @BeforeAll
    static void requireAndroidSdk() {
        String androidHome = System.getenv("ANDROID_HOME");
        assumeTrue(androidHome != null && new File(androidHome).isDirectory(), "ANDROID_HOME is not set");
    }

    static Stream<Arguments> cases() {
        return Stream.of(
                Arguments.of(Template.CLI_9_1, Layout.NODE_MODULES),
                Arguments.of(Template.CURRENT, Layout.NODE_MODULES),
                Arguments.of(Template.CURRENT, Layout.PLATFORMS));
    }

    @ParameterizedTest(name = "{0} template, plugins in {1}")
    @MethodSource("cases")
    void compilesThePluginAgainstCore(Template template, Layout layout) throws Exception {
        Path project = tempDir.toRealPath().resolve("project");
        Path platformsAndroid = project.resolve("platforms/android");
        Path core = Fixtures.installCore(project);
        Path sample = Fixtures.installSample(project);
        Fixtures.write(project.resolve("package.json"), "{ \"name\": \"fixture-app\" }\n");

        // dependencies.json directories, relative to platforms/android.
        String coreDir = "../../node_modules/@nativescript/core";
        String sampleDir = "../../node_modules/" + Fixtures.SAMPLE_NAME;
        if (layout == Layout.PLATFORMS) {
            // Moved rather than copied, so that the build only finds core's libraries through the facts.
            coreDir = ".ns-plugins/core";
            sampleDir = ".ns-plugins/" + SAMPLE_AAR_NAME;
            mirror(core, platformsAndroid.resolve(coreDir));
            mirror(sample, platformsAndroid.resolve(sampleDir));
        }
        Path coreNativeDir = platformsAndroid.resolve(coreDir).resolve("platforms/android").normalize();
        // Core is a peer of the sample, as of most plugins: the template adds no dependency on it,
        // so the compile relies on the include.gradle block.
        Path dependenciesJson = Fixtures.write(platformsAndroid.resolve("dependencies.json"), String.join("\n",
                "[",
                "  { \"name\": \"@nativescript/core\", \"directory\": \"" + coreDir + "\", \"dependencies\": [] },",
                "  { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"directory\": \"" + sampleDir + "\", \"dependencies\": [] }",
                "]",
                ""));

        Path pluginDir = project.resolve("platforms/tempPlugin/" + SAMPLE_AAR_NAME);
        for (String name : List.of("build.gradle", "settings.gradle", "gradle.properties")) {
            String text = Fixtures.read(template.dir().resolve(name))
                    .replace("{{pluginName}}", Fixtures.SAMPLE_NAME)
                    .replace("{{pluginNamespace}}", "org.nativescript.gradle_api_sample")
                    .replace("{{runtimeAndroidPluginVersion}}", ANDROID_GRADLE_PLUGIN);
            assertFalse(text.contains("{{"), "unknown placeholder left in " + name);
            Fixtures.write(pluginDir.resolve(name), text);
        }
        Path buildGradle = pluginDir.resolve("build.gradle");
        Fixtures.write(buildGradle, Fixtures.read(buildGradle) + "\n" + Fixtures.read(extractedIncludeGradle()) + "\n" + PROBE);
        Fixtures.write(pluginDir.resolve("src/main/AndroidManifest.xml"),
                "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" />\n");
        Fixtures.write(pluginDir.resolve("src/main/java/org/nativescript/gradle_api_sample/UsesCore.java"), String.join("\n",
                "package org.nativescript.gradle_api_sample;",
                "",
                "public final class UsesCore {",
                "    public static Class<?> coreClass() { return " + Fixtures.CORE_CLASS + ".class; }",
                "}",
                ""));

        List<String> arguments = new ArrayList<>(List.of(
                COMPILE_TASK, "--stacktrace",
                "--init-script", Fixtures.path(Fixtures.writeInitScript(tempDir)),
                "-PtempBuild=true",
                "-PappPath=" + Fixtures.path(project.resolve("app")),
                "-PappResourcesPath=" + Fixtures.path(project.resolve("app/App_Resources"))));
        if (template == Template.CURRENT) {
            Path factsFile = Fixtures.write(platformsAndroid.resolve("nativescript-gradle.json"), String.join("\n",
                    "{",
                    "  \"schemaVersion\": 1,",
                    "  \"minReaderSchemaVersion\": 1,",
                    "  \"dependenciesJson\": { \"sha256\": \"" + Fixtures.sha256(dependenciesJson) + "\" },",
                    "  \"capabilities\": [],",
                    "  \"project\": { \"root\": \"../..\", \"appDir\": \"../../src\", \"appResourcesDir\": \"../../src/App_Resources\" },",
                    "  \"plugins\": [",
                    "    { \"name\": \"@nativescript/core\", \"packageDir\": \"../../node_modules/@nativescript/core\",",
                    "      \"nativeDir\": \"" + coreDir + "/platforms/android\", \"aarName\": \"core\",",
                    "      \"aar\": \"" + coreDir + "/platforms/android/core.aar\", \"dependencies\": [] },",
                    "    { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"packageDir\": \"../../node_modules/" + Fixtures.SAMPLE_NAME + "\",",
                    "      \"nativeDir\": \"" + sampleDir + "/platforms/android\", \"aarName\": \"" + SAMPLE_AAR_NAME + "\",",
                    "      \"aar\": \"" + sampleDir + "/platforms/android/" + SAMPLE_AAR_NAME + ".aar\", \"dependencies\": [] }",
                    "  ]",
                    "}",
                    ""));
            arguments.add("-Pnativescript.factsFile=" + Fixtures.path(factsFile));
        }

        // Outside host-project embedding the CLI sets neither variable, so the template's defaults apply.
        Map<String, String> environment = new HashMap<>(System.getenv());
        environment.remove("USER_PROJECT_ROOT");
        environment.remove("USER_PROJECT_PLATFORMS_ANDROID");
        GradleRunner runner = GradleRunner.create()
                .withGradleVersion(GRADLE)
                .withProjectDir(pluginDir.toFile())
                .withArguments(arguments)
                .withEnvironment(environment)
                .forwardOutput();

        if (template == Template.CLI_9_1) {
            BuildResult result = runner.buildAndFail();
            String error = "> " + Fixtures.SAMPLE_NAME + " needs NativeScript CLI 9.2 or newer: npm i -D nativescript@latest";
            assertTrue(result.getOutput().lines().anyMatch(error::equals), result.getOutput());
            return;
        }

        BuildResult result = runner.build();
        Map<String, String> probes = Fixtures.probes(result);

        assertEquals(TaskOutcome.SUCCESS, result.task(COMPILE_TASK).getOutcome());
        assertEquals(
                Fixtures.path(coreNativeDir.resolve("nested/inner.aar")) + ","
                        + Fixtures.path(coreNativeDir.resolve("widgets-release.aar")),
                probes.get("compileOnly"));
        assertEquals("true", probes.get("pluginBuild"));
        assertEquals(Fixtures.SAMPLE_NAME, probes.get("self"));
        assertEquals("true", probes.get("buildingSample"));
        assertEquals(Fixtures.path(project), probes.get("projectRoot"));
        assertEquals(Fixtures.path(project.resolve("src")), probes.get("appDir"));
        assertEquals(Fixtures.path(project.resolve("src/App_Resources")), probes.get("appResourcesDir"));
        assertEquals(Fixtures.path(core), probes.get("corePackage"));
    }

    /** What the CLI puts in a plugin's copy in .ns-plugins: its package.json and platforms/android. */
    private static void mirror(Path packageDir, Path mirrorDir) throws IOException {
        Files.createDirectories(mirrorDir.resolve("platforms"));
        Files.move(packageDir.resolve("platforms/android"), mirrorDir.resolve("platforms/android"));
        Files.copy(packageDir.resolve("package.json"), mirrorDir.resolve("package.json"));
    }

    static Path extractedIncludeGradle() throws URISyntaxException {
        return new File(PluginBuildTest.class.getResource("/extracted/sample-plugin-include.gradle").toURI()).toPath();
    }
}
