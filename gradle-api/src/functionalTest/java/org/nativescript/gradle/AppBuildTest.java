package org.nativescript.gradle;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.gradle.testkit.runner.BuildResult;
import org.gradle.testkit.runner.GradleRunner;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * The app build: plugins' buildscript.gradle and include.gradle applied to {@code :app} the way the
 * Android runtime's template does, without the Android Gradle Plugin.
 */
class AppBuildTest {
    enum Cli {
        /** A CLI before 9.2, which writes no facts file. */
        NO_FACTS,
        /** CLI 9.2+, which passes the facts file's path. */
        FACTS_PROPERTY,
        /** platforms/android opened without the CLI, e.g. in Android Studio. */
        FACTS_FOUND,
        /** A CLI before 9.2 prepared the project after a 9.2+ one: facts left behind. */
        STALE_FACTS;

        boolean usesFacts() {
            return this == FACTS_PROPERTY || this == FACTS_FOUND;
        }
    }

    @TempDir
    Path tempDir;

    static Stream<Arguments> cases() {
        List<Arguments> cases = new ArrayList<>();
        for (String gradleVersion : Fixtures.gradleVersions()) {
            for (Cli cli : Cli.values()) {
                cases.add(Arguments.of(gradleVersion, cli));
            }
        }
        return cases.stream();
    }

    @ParameterizedTest(name = "Gradle {0}, {1}")
    @MethodSource("cases")
    void answersFromTheAppBuild(String gradleVersion, Cli cli) throws Exception {
        Path project = tempDir.toRealPath().resolve("project");
        Path platformsAndroid = project.resolve("platforms/android");
        Fixtures.copyTree(fixture().resolve("platforms/android"), platformsAndroid);
        Fixtures.copyTree(fixture().resolve("packages"), project.resolve("node_modules"));
        Path pluginB = project.resolve("node_modules/fixture-plugin-b/platforms/android/buildscript.gradle");
        Fixtures.write(pluginB, Fixtures.read(pluginB).replace("@LIBRARY_VERSION@", Fixtures.libraryVersion()));
        Path core = Fixtures.installCore(project);
        Fixtures.installSample(project);
        Fixtures.write(project.resolve("package.json"), "{ \"name\": \"fixture-app\" }\n");
        Path dependenciesJson = Fixtures.write(platformsAndroid.resolve("dependencies.json"), String.join("\n",
                "[",
                "  { \"name\": \"@nativescript/core\", \"directory\": \"../../node_modules/@nativescript/core\", \"dependencies\": [] },",
                "  { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"directory\": \"../../node_modules/" + Fixtures.SAMPLE_NAME + "\", \"dependencies\": [\"@nativescript/core\"] },",
                "  { \"name\": \"fixture-plugin-b\", \"directory\": \"../../node_modules/fixture-plugin-b\", \"dependencies\": [] }",
                "]",
                ""));

        List<String> arguments = new ArrayList<>(List.of(
                "help", "--offline", "--stacktrace", "--warning-mode=fail",
                "--init-script", Fixtures.path(Fixtures.writeInitScript(tempDir))));
        Path factsFile = platformsAndroid.resolve("nativescript-gradle.json");
        if (cli != Cli.NO_FACTS) {
            // fixture-plugin-b is left out: an installed package with platforms/android that the CLI
            // does not list is not a plugin.
            Fixtures.write(factsFile, String.join("\n",
                    "{",
                    "  \"schemaVersion\": 1,",
                    "  \"dependenciesJson\": { \"sha256\": \"" + Fixtures.sha256(dependenciesJson) + "\" },",
                    "  \"capabilities\": [\"fixture.capability\"],",
                    "  \"project\": { \"root\": \"../..\", \"appDir\": \"../../src\", \"appResourcesDir\": \"../../src/App_Resources\" },",
                    "  \"plugins\": [",
                    "    { \"name\": \"@nativescript/core\", \"packageDir\": \"../../node_modules/@nativescript/core\",",
                    "      \"nativeDir\": \"../../node_modules/@nativescript/core/platforms/android\", \"aarName\": \"core\",",
                    "      \"aar\": \"../../node_modules/@nativescript/core/platforms/android/core.aar\", \"dependencies\": [],",
                    "      \"options\": { \"flag\": true } },",
                    "    { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"packageDir\": \"../../node_modules/" + Fixtures.SAMPLE_NAME + "\",",
                    "      \"nativeDir\": \".ns-plugins/sample/platforms/android\", \"aarName\": \"sample\",",
                    "      \"aar\": \".ns-plugins/sample/platforms/android/sample.aar\", \"dependencies\": [\"@nativescript/core\"] }",
                    "  ]",
                    "}",
                    ""));
            if (cli == Cli.FACTS_PROPERTY) {
                arguments.add("-Pnativescript.factsFile=" + Fixtures.path(factsFile));
            }
            if (cli == Cli.STALE_FACTS) {
                Fixtures.write(dependenciesJson, Fixtures.read(dependenciesJson) + "\n");
            }
        }

        GradleRunner runner = GradleRunner.create()
                .withGradleVersion(gradleVersion)
                .withProjectDir(platformsAndroid.toFile())
                .withArguments(arguments)
                .forwardOutput();

        if (!cli.usesFacts()) {
            BuildResult result = runner.buildAndFail();
            String error = cli == Cli.NO_FACTS
                    ? "A plugin of this app uses org.nativescript:gradle-api, which needs the project to be prepared by"
                            + " NativeScript CLI 9.2 or newer, but there is no facts file at " + Fixtures.path(factsFile)
                            + ". Update the project's CLI with `npm i -D nativescript@latest`, then run `ns prepare android`."
                    : "The NativeScript facts file " + Fixtures.path(factsFile) + " does not match "
                            + Fixtures.path(dependenciesJson) + ": a different NativeScript CLI rewrote dependencies.json"
                            + " after the facts file was written. Run `ns prepare android` again with the NativeScript CLI"
                            + " the project uses.";
            assertTrue(result.getOutput().lines().anyMatch(line -> line.equals("> " + error)), result.getOutput());
            assertEquals("false", Fixtures.probes(result).get("b.pluginBuild"), "pluginBuild needs no facts");
            return;
        }

        BuildResult result = runner.build();
        Map<String, String> probes = Fixtures.probes(result);

        Path appDir = project.resolve("src");
        assertEquals("true", probes.get("typed"), "NativeScript.of returns the extension");
        assertEquals("true", probes.get("b.sameExtension"), "include.gradle reaches the extension by its name");
        assertEquals("false", probes.get("b.libraryClassVisible"), "include.gradle cannot see the library's classes");
        assertEquals("false", probes.get("b.pluginBuild"));
        assertEquals(Fixtures.path(project), probes.get("b.projectDir"));
        assertEquals("1", probes.get("apiLevel"));
        assertEquals("false", probes.get("pluginBuild"));
        assertEquals("null", probes.get("self"));
        assertEquals("false", probes.get("buildingSample"));
        assertEquals(Fixtures.path(project), probes.get("projectDir"));
        assertEquals(Fixtures.path(appDir), probes.get("appDir"));
        assertEquals(Fixtures.path(appDir.resolve("App_Resources")), probes.get("appResourcesDir"));
        assertEquals("true", probes.get("has"));
        assertEquals(Fixtures.path(core), probes.get("core.packageDir"));
        assertEquals(Fixtures.path(core.resolve("platforms/android")), probes.get("core.nativeDir"));
        assertEquals("inner.aar,widgets-release.aar", probes.get("core.artifacts"));
        assertEquals("core", probes.get("core.aarName"));
        assertEquals(Fixtures.path(core.resolve("platforms/android/core.aar")), probes.get("core.aar"));
        assertEquals("[flag:true]", probes.get("core.options"));
        assertEquals(
                Fixtures.path(platformsAndroid.resolve(".ns-plugins/sample/platforms/android")),
                probes.get("sample.nativeDir"));
        assertEquals(Fixtures.path(project.resolve("node_modules/js-only")), probes.get("jsOnly"));
        assertEquals("null", probes.get("jsOnlyPlugin"), "a package without native code is not a plugin");
        assertEquals("null", probes.get("unlistedPlugin"), "a package the CLI does not list is not a plugin");
        assertEquals("null", probes.get("missingPlugin"));
        assertEquals("null", probes.get("missingPackage"));
        String error = probes.get("pluginError");
        assertTrue(error.contains("'not-installed'") && error.contains("@nativescript/core, " + Fixtures.SAMPLE_NAME),
                "error names the plugin and lists the known ones: " + error);
    }

    private static Path fixture() throws URISyntaxException {
        return new File(AppBuildTest.class.getResource("/app-fixture").toURI()).toPath();
    }
}
