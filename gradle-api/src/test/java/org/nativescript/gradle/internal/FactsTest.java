package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.gradle.api.GradleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FactsTest {
    private static final String SCHEMA = "\"schemaVersion\": 1";
    private static final String PROJECT = "\"project\": {\"root\": \"../..\", \"appDir\": \"../../app\","
            + " \"appResourcesDir\": \"../../app/App_Resources\"}";
    private static final String NO_PLUGINS = "\"plugins\": []";

    @TempDir
    Path tempDir;

    private Path projectDir;
    private Path platformsAndroid;
    private File factsFile;

    @BeforeEach
    void setUp() throws IOException {
        projectDir = tempDir.toRealPath();
        platformsAndroid = projectDir.resolve("platforms/android");
        Files.createDirectories(platformsAndroid);
        factsFile = platformsAndroid.resolve("nativescript-gradle.json").toFile();
    }

    @Test
    void sha256MatchesTheCli() {
        // The CLI writes dependenciesJson.sha256 from its own TypeScript implementation; this literal is
        // that implementation's digest of the same bytes.
        assertEquals(
                "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570",
                Facts.sha256("[]\n".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void readsNewerSchemaVersionAndIgnoresUnknownFields() throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/facts/v2-unknown-fields.json")) {
            Files.copy(in, factsFile.toPath());
        }

        Facts facts = Facts.read(factsFile);

        assertEquals(Collections.singleton("some.future.capability"), facts.getCapabilities());
        assertEquals(projectDir.toFile(), facts.getProjectRoot());
        assertEquals(projectDir.resolve("app").toFile(), facts.getAppDir());
        assertEquals(projectDir.resolve("app/App_Resources").toFile(), facts.getAppResourcesDir());
        assertEquals(Collections.singleton("nativescript-plugin"), facts.getPlugins().keySet());
        PluginData plugin = facts.getPlugins().get("nativescript-plugin");
        assertEquals("nativescript_plugin", plugin.getAarName());
        assertEquals(Collections.singletonMap("someOption", Arrays.asList("a", "b")), plugin.getOptions());
        assertThrows(UnsupportedOperationException.class, () -> plugin.getOptions().put("k", "v"));
    }

    @Test
    void optionalFieldsDefaultToEmpty() {
        Facts facts = parse(withPlugins(plugin("p")));

        assertTrue(facts.getPlugins().get("p").getOptions().isEmpty());
        assertTrue(facts.getCapabilities().isEmpty());
    }

    @Test
    void resolvesRelativePathsAgainstTheFileAndKeepsAbsoluteOnes() {
        Path elsewhere = projectDir.resolve("elsewhere");
        String project = "\"project\": {\"root\": \"" + elsewhere.toString().replace("\\", "\\\\") + "\","
                + " \"appDir\": \"../../x/./y/../app\", \"appResourcesDir\": \"res/\"}";

        Facts facts = parse(object(SCHEMA, project, NO_PLUGINS));

        assertEquals(elsewhere.toFile(), facts.getProjectRoot());
        assertEquals(projectDir.resolve("x/app").toFile(), facts.getAppDir());
        assertEquals(platformsAndroid.resolve("res").toFile(), facts.getAppResourcesDir());
    }

    static Stream<Arguments> invalidFacts() {
        return Stream.of(
                Arguments.of(
                        "{\n  " + SCHEMA + ",\n}",
                        "Unexpected character '}', expected a string key at line 3, column 1"),
                Arguments.of("[]", "the top level must be an object"),
                Arguments.of(object(PROJECT, NO_PLUGINS), "schemaVersion must be an integer"),
                Arguments.of(withSchemaVersion("\"1\""), "schemaVersion must be an integer"),
                Arguments.of(withSchemaVersion("1.5"), "schemaVersion must be an integer"),
                Arguments.of(withSchemaVersion("0"), "schemaVersion must be at least 1"),
                Arguments.of(withField("\"dependenciesJson\": \"x\""), "dependenciesJson must be an object"),
                Arguments.of(withField("\"dependenciesJson\": {}"), "dependenciesJson.sha256 must be a string"),
                Arguments.of(withSha256("A".repeat(64)), "dependenciesJson.sha256 must be 64 lowercase hex digits"),
                Arguments.of(withSha256("37517e5f"), "dependenciesJson.sha256 must be 64 lowercase hex digits"),
                Arguments.of(withField("\"capabilities\": \"a\""), "capabilities must be an array"),
                Arguments.of(withField("\"capabilities\": [\"a\", 1]"), "capabilities[1] must be a string"),
                Arguments.of(object(SCHEMA, NO_PLUGINS), "project must be an object"),
                Arguments.of(
                        withProject("\"root\": 1, \"appDir\": \"a\", \"appResourcesDir\": \"r\""),
                        "project.root must be a string"),
                Arguments.of(
                        withProject("\"root\": \".\", \"appResourcesDir\": \"r\""),
                        "project.appDir must be a string"),
                Arguments.of(
                        withProject("\"root\": \".\", \"appDir\": \"a\", \"appResourcesDir\": \"\""),
                        "project.appResourcesDir must not be empty"),
                Arguments.of(object(SCHEMA, PROJECT), "plugins must be an array"),
                Arguments.of(withPlugins(plugin("a"), "\"b\""), "plugins[1] must be an object"),
                Arguments.of(withPlugins(plugin("p", "name", null)), "plugins[0].name must be a string"),
                Arguments.of(withPlugins(plugin("p", "packageDir", null)), "plugins[0].packageDir must be a string"),
                Arguments.of(withPlugins(plugin("p", "nativeDir", null)), "plugins[0].nativeDir must be a string"),
                Arguments.of(withPlugins(plugin("p", "aarName", null)), "plugins[0].aarName must be a string"),
                Arguments.of(withPlugins(plugin("p", "aarName", "\"\"")), "plugins[0].aarName must not be empty"),
                Arguments.of(withPlugins(plugin("p", "aar", null)), "plugins[0].aar must be a string"),
                Arguments.of(
                        withPlugins(plugin("p", "dependencies", null)),
                        "plugins[0].dependencies must be an array"),
                Arguments.of(
                        withPlugins(plugin("p", "dependencies", "[\"a\", 1]")),
                        "plugins[0].dependencies[1] must be a string"),
                Arguments.of(withPlugins(plugin("p", "options", "[]")), "plugins[0].options must be an object"),
                Arguments.of(
                        withPlugins(plugin("a"), plugin("b"), plugin("a")),
                        "plugin 'a' is listed more than once"));
    }

    @ParameterizedTest(name = "{1}")
    @MethodSource("invalidFacts")
    void reportsInvalidFacts(String text, String problem) {
        GradleException e = assertThrows(GradleException.class, () -> parse(text));
        assertEquals("Invalid NativeScript facts file " + factsFile + ": " + problem, e.getMessage());
    }

    @Test
    void readReusesTheResultUntilTheContentChanges() throws IOException {
        write(factsFile, withField("\"capabilities\": [\"a\"]"));
        Facts first = Facts.read(factsFile);
        assertSame(first, Facts.read(factsFile));

        long lastModified = factsFile.lastModified();
        write(factsFile, withField("\"capabilities\": [\"b\"]"));
        assertTrue(factsFile.setLastModified(lastModified));

        assertEquals(Collections.singleton("b"), Facts.read(factsFile).getCapabilities());
    }

    private static String plugin(String name) {
        return plugin(name, null, null);
    }

    /** A valid plugin entry, with {@code field} set to the JSON {@code value}, or removed if it is null. */
    private static String plugin(String name, String field, String value) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("name", "\"" + name + "\"");
        fields.put("packageDir", "\"../../node_modules/" + name + "\"");
        fields.put("nativeDir", "\"../../node_modules/" + name + "/platforms/android\"");
        fields.put("aarName", "\"" + name + "\"");
        fields.put("aar", "\"../../node_modules/" + name + "/platforms/android/" + name + ".aar\"");
        fields.put("dependencies", "[]");
        if (field != null) {
            if (value == null) {
                fields.remove(field);
            } else {
                fields.put(field, value);
            }
        }
        return fields.entrySet().stream()
                .map(e -> "\"" + e.getKey() + "\": " + e.getValue())
                .collect(Collectors.joining(", ", "{", "}"));
    }

    private static String plugins(String... plugins) {
        return "\"plugins\": [" + String.join(", ", plugins) + "]";
    }

    private static String withSchemaVersion(String version) {
        return object("\"schemaVersion\": " + version, PROJECT, NO_PLUGINS);
    }

    private static String withField(String field) {
        return object(SCHEMA, field, PROJECT, NO_PLUGINS);
    }

    private static String withSha256(String sha256) {
        return withField("\"dependenciesJson\": {\"sha256\": \"" + sha256 + "\"}");
    }

    private static String withProject(String fields) {
        return object(SCHEMA, "\"project\": {" + fields + "}", NO_PLUGINS);
    }

    private static String withPlugins(String... plugins) {
        return object(SCHEMA, PROJECT, plugins(plugins));
    }

    private static String object(String... fields) {
        return "{" + String.join(", ", fields) + "}";
    }

    private Facts parse(String text) {
        return Facts.parse(factsFile, text);
    }

    private static void write(File file, String text) throws IOException {
        Files.write(file.toPath(), text.getBytes(StandardCharsets.UTF_8));
    }
}
