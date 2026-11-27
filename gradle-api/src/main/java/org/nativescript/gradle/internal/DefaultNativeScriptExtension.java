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

    private static final String PLUGIN_NAME_PROPERTY = "PLUGIN_NAME";

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

    // Read on first use rather than when applied: in the plugin build the library is applied
    // reflectively, and plugins may apply it before the template has set its extra properties.
    // Members that need no facts must not call this, and a failure is not kept.
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

    // Every CLI since 8.4 passes -PtempBuild=true only to the throwaway project that builds a
    // plugin's aar, whose template also sets PLUGIN_NAME.
    @Override
    public boolean isPluginBuild() {
        return inputs.property(Resolution.TEMP_BUILD_PROPERTY) != null;
    }

    private String pluginName() {
        return isPluginBuild() ? Resolution.asString(inputs.property(PLUGIN_NAME_PROPERTY)) : null;
    }

    @Override
    public PluginInfo getSelf() {
        if (!isPluginBuild()) {
            return null;
        }
        resolution();
        String name = pluginName();
        return name != null ? findPlugin(name) : null;
    }

    @Override
    public boolean isBuildingPlugin(String npmName) {
        return npmName != null && npmName.equals(pluginName());
    }

    @Override
    public File getProjectRoot() {
        return resolution().getProjectRoot();
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
            throw new GradleException("NativeScript plugin '" + npmName + "' is not listed in " + r.getFacts().getFile()
                    + ". Known plugins: "
                    + (r.getPlugins().isEmpty() ? "none" : String.join(", ", r.getPlugins().keySet()))
                    + ". Only packages that declare Android support in their package.json are plugins;"
                    + " find any other package with resolvePackage.");
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
                    + new File(getProjectRoot(), "node_modules") + " or a parent directory.");
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
