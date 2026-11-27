package org.nativescript.gradle.internal;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

final class FakeInputs implements BuildInputs {
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
