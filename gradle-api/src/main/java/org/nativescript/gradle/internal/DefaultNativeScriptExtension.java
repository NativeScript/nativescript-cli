package org.nativescript.gradle.internal;

import java.io.File;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.gradle.api.GradleException;
import org.gradle.api.Project;
import org.gradle.api.model.ObjectFactory;
import org.nativescript.gradle.NativeScriptExtension;
import org.nativescript.gradle.PluginInfo;

public final class DefaultNativeScriptExtension implements NativeScriptExtension {
    public static final int API_LEVEL = 1;

    private final BuildInputs inputs;
    private final ObjectFactory objects;
    private final Map<String, PluginInfo> pluginInfos = new ConcurrentHashMap<>();
    private volatile Resolution resolution;

    public DefaultNativeScriptExtension(Project project) {
        this(BuildInputs.of(project), project.getObjects());
    }

    public DefaultNativeScriptExtension(BuildInputs inputs, ObjectFactory objects) {
        this.inputs = inputs;
        this.objects = objects;
    }

    // Resolved on first use rather than when applied: in the plugin build the library is applied
    // reflectively, and plugins may apply it before the template has set its extra properties.
    private Resolution resolution() {
        Resolution result = resolution;
        if (result == null) {
            synchronized (this) {
                result = resolution;
                if (result == null) {
                    result = Resolution.resolve(inputs);
                    resolution = result;
                }
            }
        }
        return result;
    }

    @Override
    public int getApiLevel() {
        return API_LEVEL;
    }

    @Override
    public boolean has(String capability) {
        return resolution().getCapabilities().contains(capability);
    }

    @Override
    public boolean isPluginBuild() {
        return resolution().isPluginBuild();
    }

    @Override
    public PluginInfo getSelf() {
        String name = resolution().getPluginName();
        return name != null ? findPlugin(name) : null;
    }

    @Override
    public boolean isBuildingPlugin(String npmName) {
        return npmName != null && npmName.equals(resolution().getPluginName());
    }

    @Override
    public File getProjectDir() {
        return resolution().getProjectDir();
    }

    @Override
    public File getAppDir() {
        return resolution().getAppDir();
    }

    @Override
    public File getAppResourcesDir() {
        return resolution().getAppResourcesDir();
    }

    @Override
    public PluginInfo plugin(String npmName) {
        PluginInfo plugin = findPlugin(npmName);
        if (plugin == null) {
            Resolution r = resolution();
            String list = r.getFacts() != null ? r.getFacts().getFile().toString() : "dependencies.json";
            throw new GradleException("NativeScript plugin '" + npmName + "' is not listed in " + list
                    + ", nor installed with a platforms/android directory in "
                    + new File(r.getProjectDir(), "node_modules") + " or a parent directory"
                    + ". Known plugins: "
                    + (r.getPlugins().isEmpty() ? "none" : String.join(", ", r.getPlugins().keySet())) + ".");
        }
        return plugin;
    }

    @Override
    public PluginInfo findPlugin(String npmName) {
        NodePackages.validate(npmName);
        PluginInfo cached = pluginInfos.get(npmName);
        if (cached != null) {
            return cached;
        }
        PluginData data = resolution().findPlugin(npmName);
        if (data == null) {
            return null;
        }
        return pluginInfos.computeIfAbsent(npmName, name -> new DefaultPluginInfo(data, objects));
    }

    @Override
    public File resolvePackage(String npmName) {
        File dir = findPackage(npmName);
        if (dir == null) {
            throw new GradleException("npm package '" + npmName + "' is not installed in "
                    + new File(getProjectDir(), "node_modules") + " or a parent directory.");
        }
        return dir;
    }

    @Override
    public File findPackage(String npmName) {
        return resolution().findPackage(npmName);
    }

    @Override
    public String toString() {
        return "extension '" + NAME + "'";
    }
}
