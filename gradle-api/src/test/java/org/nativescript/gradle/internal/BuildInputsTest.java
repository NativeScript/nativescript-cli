package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class BuildInputsTest {
    @TempDir
    Path tempDir;

    @Test
    void fileContentsAreNullUnlessThereIsARegularFile() throws IOException {
        BuildInputs inputs = BuildInputs.of(
                ProjectBuilder.builder().withProjectDir(tempDir.resolve("gradle").toFile()).build());
        Path file = tempDir.resolve("facts.json");
        Files.write(file, "{}".getBytes(StandardCharsets.UTF_8));
        Path dir = Files.createDirectories(tempDir.resolve("dir.json"));

        assertArrayEquals("{}".getBytes(StandardCharsets.UTF_8), inputs.fileContents(file.toFile()));
        assertNull(inputs.fileContents(tempDir.resolve("missing.json").toFile()));
        assertNull(inputs.fileContents(dir.toFile()));
    }
}
