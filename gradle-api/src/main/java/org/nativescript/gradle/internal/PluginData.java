package org.nativescript.gradle.internal;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/** What is known about one npm package with Android native code. Immutable. */
public final class PluginData {
    private final String name;
    private final File packageDir;
    private final File nativeDir;
    private final String aarName;
    private final File aar;
    private final List<String> dependencies;
    private final Map<String, Object> options;

    public PluginData(
            String name,
            File packageDir,
            File nativeDir,
            String aarName,
            File aar,
            List<String> dependencies,
            Map<String, Object> options) {
        this.name = name;
        this.packageDir = packageDir;
        this.nativeDir = nativeDir;
        this.aarName = aarName;
        this.aar = aar;
        this.dependencies = Collections.unmodifiableList(dependencies);
        this.options = Collections.unmodifiableMap(options);
    }

    public String getName() {
        return name;
    }

    public File getPackageDir() {
        return packageDir;
    }

    public File getNativeDir() {
        return nativeDir;
    }

    /** Null unless the CLI wrote facts. */
    public String getAarName() {
        return aarName;
    }

    /** Null unless the CLI wrote facts. */
    public File getAar() {
        return aar;
    }

    public List<String> getDependencies() {
        return dependencies;
    }

    public Map<String, Object> getOptions() {
        return options;
    }

    @Override
    public String toString() {
        return name + " (" + nativeDir + ")";
    }
}
