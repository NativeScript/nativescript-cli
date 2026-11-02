package org.nativescript.gradle.internal;

import java.io.File;
import java.util.Map;
import org.gradle.api.file.FileCollection;
import org.gradle.api.model.ObjectFactory;
import org.nativescript.gradle.PluginInfo;

final class DefaultPluginInfo implements PluginInfo {
    private final PluginData data;
    private final FileCollection artifacts;

    DefaultPluginInfo(PluginData data, ObjectFactory objects) {
        this.data = data;
        this.artifacts = objects.fileTree()
                .from(data.getNativeDir())
                .matching(patterns -> patterns.include("**/*.aar", "**/*.jar"));
    }

    @Override
    public String getName() {
        return data.getName();
    }

    @Override
    public File getPackageDir() {
        return data.getPackageDir();
    }

    @Override
    public File getNativeDir() {
        return data.getNativeDir();
    }

    @Override
    public FileCollection getArtifacts() {
        return artifacts;
    }

    @Override
    public Map<String, Object> getOptions() {
        return data.getOptions();
    }

    @Override
    public String getAarName() {
        return data.getAarName();
    }

    @Override
    public File getAar() {
        return data.getAar();
    }

    @Override
    public String toString() {
        return "NativeScript plugin " + data;
    }
}
