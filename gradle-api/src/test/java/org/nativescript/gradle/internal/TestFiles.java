package org.nativescript.gradle.internal;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

final class TestFiles {
    /** The SHA-256 of {@code "[]\n"}. */
    static final String EMPTY_DEPENDENCIES_JSON_SHA256 = "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570";

    private TestFiles() {}

    /** {@link #writeFacts(Path, Path, String, String)} with a matching dependencies.json next to the file. */
    static Path writeFacts(Path file, Path root, String plugins) throws IOException {
        write(file.resolveSibling("dependencies.json"), "[]\n");
        return writeFacts(file, root, plugins, EMPTY_DEPENDENCIES_JSON_SHA256);
    }

    /** Facts for the project at {@code root}, whose app is in {@code src}. */
    static Path writeFacts(Path file, Path root, String plugins, String dependenciesJsonSha256) throws IOException {
        String rootPath = root.toString().replace('\\', '/');
        write(file, "{\"minReaderSchemaVersion\": 1, \"schemaVersion\": 1, "
                + "\"dependenciesJson\": {\"sha256\": \"" + dependenciesJsonSha256 + "\"}, "
                + "\"capabilities\": [\"some.capability\"], "
                + "\"project\": {\"root\": \"" + rootPath + "\", \"appDir\": \"" + rootPath + "/src\","
                + " \"appResourcesDir\": \"" + rootPath + "/src/App_Resources\"},"
                + " \"plugins\": " + plugins + "}");
        return file;
    }

    /** A plugin entry whose package is at {@code packageDir}, relative to the facts file. */
    static String plugin(String name, String packageDir) {
        return "{\"name\": \"" + name + "\", \"packageDir\": \"" + packageDir + "\","
                + " \"nativeDir\": \"" + packageDir + "/platforms/android\", \"aarName\": \"" + name.replaceAll("\\W", "_")
                + "\", \"aar\": \"" + packageDir + "/platforms/android/x.aar\", \"dependencies\": []}";
    }

    static Path installPackage(Path dir, String name) throws IOException {
        Path pkg = dir.resolve("node_modules").resolve(name);
        write(pkg.resolve("package.json"), "{\"name\": \"" + name + "\"}");
        return pkg;
    }

    static void write(Path file, String text) throws IOException {
        Files.createDirectories(file.getParent());
        Files.write(file, text.getBytes(StandardCharsets.UTF_8));
    }
}
