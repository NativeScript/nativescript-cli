package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.nativescript.gradle.internal.TestFiles.installPackage;
import static org.nativescript.gradle.internal.TestFiles.plugin;
import static org.nativescript.gradle.internal.TestFiles.write;
import static org.nativescript.gradle.internal.TestFiles.writeFacts;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.gradle.api.GradleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ResolutionTest {
    private static final String PLATFORMS_ANDROID_VARIABLE = "USER_PROJECT_PLATFORMS_ANDROID";
    private static final String RERUN = " Run `ns prepare android` again with the NativeScript CLI the project uses.";

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

    static String noFactsMessage(Path... searched) {
        StringBuilder paths = new StringBuilder();
        for (Path path : searched) {
            paths.append(paths.length() == 0 ? "" : " or ").append(path.resolve(Resolution.FACTS_FILE_NAME));
        }
        return "A plugin of this app uses org.nativescript:gradle-api, which needs the project to be prepared by"
                + " NativeScript CLI 9.2 or newer, but there is no facts file at " + paths
                + ". Update the project's CLI with `npm i -D nativescript@latest`, then run `ns prepare android`.";
    }

    @ParameterizedTest(name = "{0} build")
    @ValueSource(strings = {"app", "plugin"})
    void reportsMissingFacts(String build) {
        FakeInputs inputs = build.equals("app")
                ? appBuild()
                : pluginBuild().property(PLATFORMS_ANDROID_VARIABLE, platformsAndroid.toString());

        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(inputs));

        assertEquals(
                build.equals("app") ? noFactsMessage(platformsAndroid) : noFactsMessage(tempPluginRoot, platformsAndroid),
                e.getMessage());
    }

    // The hash recorded is that of "[]\n"; dependencies.json gets the given text plus a newline.
    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', value = {
        // case | facts passed with -Pnativescript.factsFile | facts record the hash | dependencies.json | error
        "hash matches                                 | false | true  | []  |",
        "hash differs                                 | false | true  | [ ] | mismatch",
        "dependencies.json missing                    | false | true  |     | missing",
        "no hash recorded, dependencies.json changed  | false | false | [ ] |",
        "stale -Pnativescript.factsFile               | true  | true  | [ ] | mismatch",
    })
    void checksFactsAgainstDependenciesJson(
            String description, boolean explicit, boolean hashed, String dependenciesJson, String error)
            throws IOException {
        Path dir = explicit ? base.resolve("explicit") : platformsAndroid;
        Path dependencies = dir.resolve("dependencies.json");
        if (dependenciesJson != null) {
            write(dependencies, dependenciesJson + "\n");
        }
        String sha256 = hashed ? "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570" : null;
        Path facts = writeFacts(dir.resolve(Resolution.FACTS_FILE_NAME), project, "[]", sha256);
        FakeInputs inputs = appBuild().property(Resolution.FACTS_FILE_PROPERTY, explicit ? facts.toString() : null);

        if (error == null) {
            assertEquals(facts.toFile(), Resolution.resolve(inputs).getFacts().getFile());
            return;
        }
        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(inputs));
        String expected = error.equals("missing")
                ? "There is no " + dependencies + " next to the NativeScript facts file " + facts + "." + RERUN
                : "The NativeScript facts file " + facts + " does not match " + dependencies
                        + ": a different NativeScript CLI rewrote dependencies.json after the facts file was written."
                        + RERUN;
        assertEquals(expected, e.getMessage());
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
    void reportsMissingExplicitFactsFile() throws IOException {
        writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);
        Path missing = base.resolve("missing.json");

        GradleException e = assertThrows(
                GradleException.class,
                () -> Resolution.resolve(appBuild().property(Resolution.FACTS_FILE_PROPERTY, missing.toString())));
        assertEquals("-Pnativescript.factsFile points to " + missing + ", which does not exist.", e.getMessage());
    }

    @ParameterizedTest(name = "{0} build, {1}")
    @CsvSource({"plugin, property, true", "plugin, environment variable, true", "app, environment variable, false"})
    void looksForFactsInUserProjectPlatformsAndroid(String build, String source, boolean found) throws IOException {
        Path elsewhere = base.resolve("elsewhere");
        Path facts = writeFacts(elsewhere.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);
        FakeInputs inputs = build.equals("plugin") ? pluginBuild() : appBuild();
        if (source.equals("property")) {
            inputs.property(PLATFORMS_ANDROID_VARIABLE, elsewhere.toString());
        } else {
            inputs.env(PLATFORMS_ANDROID_VARIABLE, elsewhere.toString());
        }

        if (found) {
            assertEquals(facts.toFile(), Resolution.resolve(inputs).getFacts().getFile());
        } else {
            GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(inputs));
            assertEquals(noFactsMessage(platformsAndroid), e.getMessage());
        }
    }

    @Test
    void reportsInvalidFacts() throws IOException {
        Path factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
        write(factsFile, "{}");

        GradleException e = assertThrows(GradleException.class, () -> Resolution.resolve(appBuild()));
        assertTrue(e.getMessage().startsWith("Invalid NativeScript facts file " + factsFile), e.getMessage());
    }

    @Test
    void findsOnlyListedPlugins() throws IOException {
        Files.createDirectories(installPackage(project, "listed").resolve("platforms/android"));
        Path unlisted = installPackage(project, "@s/unlisted");
        Files.createDirectories(unlisted.resolve("platforms/android"));
        writeFacts(
                platformsAndroid.resolve(Resolution.FACTS_FILE_NAME),
                project,
                "[" + plugin("listed", "../../vendor/listed") + "]",
                null);

        Resolution resolution = Resolution.resolve(appBuild());

        PluginData listed = resolution.findPlugin("listed");
        assertEquals(project.resolve("vendor/listed/platforms/android").toFile(), listed.getNativeDir());
        assertEquals(project.resolve("vendor/listed").toFile(), resolution.findPackage("listed"));
        assertNull(resolution.findPlugin("@s/unlisted"), "an installed package the CLI does not list");
        assertEquals(unlisted.toFile(), resolution.findPackage("@s/unlisted"));
        assertNull(resolution.findPlugin("not-installed"));
    }

    @Test
    void findsPackagesLikeNode() throws IOException {
        Path hoisted = installPackage(base, "hoisted");
        installPackage(base, "dup");
        Path near = installPackage(project, "dup");
        Files.createDirectories(project.resolve("node_modules/no-package-json"));
        writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);

        Resolution resolution = Resolution.resolve(appBuild());

        assertEquals(hoisted.toFile(), resolution.findPackage("hoisted"));
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
    void rejectsInvalidNames(String name) throws IOException {
        writeFacts(platformsAndroid.resolve(Resolution.FACTS_FILE_NAME), project, "[]", null);
        Resolution resolution = Resolution.resolve(appBuild());

        assertThrows(IllegalArgumentException.class, () -> resolution.findPlugin(name));
        assertThrows(IllegalArgumentException.class, () -> resolution.findPackage(name));
    }

    private FakeInputs appBuild() {
        return new FakeInputs(platformsAndroid.toFile());
    }

    private FakeInputs pluginBuild() {
        return new FakeInputs(tempPluginRoot.toFile())
                .property("tempBuild", "true")
                .property("PLUGIN_NAME", "@scope/p");
    }
}
