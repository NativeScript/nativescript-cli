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
        /** CLI 9.1 and older: no facts file. */
        LEGACY,
        /** A facts-writing CLI, which passes the file's path. */
        FACTS_PROPERTY,
        /** platforms/android opened without the CLI, e.g. in Android Studio. */
        FACTS_FOUND,
        /** An older CLI prepared the project after a facts-writing one: facts left behind. */
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
        Path sample = Fixtures.installSample(project);
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
        if (cli != Cli.LEGACY) {
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

        BuildResult result = GradleRunner.create()
                .withGradleVersion(gradleVersion)
                .withProjectDir(platformsAndroid.toFile())
                .withArguments(arguments)
                .forwardOutput()
                .build();
        Map<String, String> probes = Fixtures.probes(result);

        boolean facts = cli.usesFacts();
        String staleWarning = "Ignoring " + Fixtures.path(factsFile) + ": it does not match " + Fixtures.path(dependenciesJson)
                + ", which a different NativeScript CLI wrote. Using the fallback rules.";
        assertEquals(cli == Cli.STALE_FACTS, result.getOutput().contains(staleWarning), result.getOutput());
        Path appDir = project.resolve(facts ? "src" : "app");
        assertEquals("true", probes.get("typed"), "NativeScript.of returns the extension");
        assertEquals("true", probes.get("b.sameExtension"), "a second plugin's include.gradle sees the same extension");
        assertEquals("false", probes.get("b.libraryClassVisible"), "include.gradle cannot see the library's classes");
        assertEquals(Fixtures.path(project), probes.get("b.projectDir"));
        assertEquals("1", probes.get("apiLevel"));
        assertEquals("false", probes.get("pluginBuild"));
        assertEquals("null", probes.get("self"));
        assertEquals("false", probes.get("buildingSample"));
        assertEquals(Fixtures.path(project), probes.get("projectDir"));
        assertEquals(Fixtures.path(appDir), probes.get("appDir"));
        assertEquals(Fixtures.path(appDir.resolve("App_Resources")), probes.get("appResourcesDir"));
        assertEquals(String.valueOf(facts), probes.get("has"));
        assertEquals(Fixtures.path(core), probes.get("core.packageDir"));
        assertEquals(Fixtures.path(core.resolve("platforms/android")), probes.get("core.nativeDir"));
        assertEquals("inner.aar,widgets-release.aar", probes.get("core.artifacts"));
        assertEquals(facts ? "core" : "null", probes.get("core.aarName"));
        assertEquals(facts ? Fixtures.path(core.resolve("platforms/android/core.aar")) : "null", probes.get("core.aar"));
        assertEquals(facts ? "[flag:true]" : "[:]", probes.get("core.options"));
        assertEquals(
                facts ? Fixtures.path(platformsAndroid.resolve(".ns-plugins/sample/platforms/android"))
                        : Fixtures.path(sample.resolve("platforms/android")),
                probes.get("sample.nativeDir"));
        assertEquals(Fixtures.path(project.resolve("node_modules/js-only")), probes.get("jsOnly"));
        assertEquals("null", probes.get("jsOnlyPlugin"), "a package without native code is not a plugin");
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
