plugins {
    `java-gradle-plugin`
    id("com.vanniktech.maven.publish") version "0.35.0"
}

// Plugins on NativeScript Android runtimes back to 8.4 build with Gradle 7.5 on JDK 11.
val oldestSupportedGradle = "7.5.1"
val oldestSupportedJava = 11

tasks.withType<JavaCompile>().configureEach {
    options.release = oldestSupportedJava
    options.encoding = "UTF-8"
    options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
}

tasks.javadoc {
    (options as StandardJavadocDocletOptions).apply {
        encoding = "UTF-8"
        addStringOption("-release", oldestSupportedJava.toString())
        addBooleanOption("Xdoclint:all,-missing", true)
    }
    exclude("org/nativescript/gradle/internal/**")
}

// java-gradle-plugin adds the running Gradle's API to `api`; compile against the oldest supported
// one instead so that using anything newer fails here rather than in a user's build.
configurations.named("api") {
    withDependencies { removeIf { it is FileCollectionDependency } }
}

val functionalTest: SourceSet by sourceSets.creating

dependencies {
    compileOnly("dev.gradleplugins:gradle-api:$oldestSupportedGradle")

    testImplementation(gradleApi())
    testImplementation(platform("org.junit:junit-bom:5.13.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    "functionalTestImplementation"(gradleTestKit())
    "functionalTestImplementation"(platform("org.junit:junit-bom:5.13.4"))
    "functionalTestImplementation"("org.junit.jupiter:junit-jupiter")
    "functionalTestRuntimeOnly"("org.junit.platform:junit-platform-launcher")
}

gradlePlugin {
    plugins {
        create("nativescript") {
            id = "org.nativescript.api"
            implementationClass = "org.nativescript.gradle.NativeScriptPlugin"
            displayName = "NativeScript Gradle API"
            description = providers.gradleProperty("POM_DESCRIPTION").get()
        }
    }
}

// Functional tests consume the library the way plugins do, from a Maven repository, so they see
// the published metadata and the real buildscript class loader scoping.
val testRepo = layout.buildDirectory.dir("test-repo")

publishing {
    repositories {
        maven {
            name = "testRepo"
            url = uri(testRepo)
        }
    }
}

val cleanTestRepo by tasks.registering(Delete::class) {
    delete(testRepo)
}

tasks.withType<PublishToMavenRepository>().configureEach {
    if (name.endsWith("ToTestRepoRepository")) {
        dependsOn(cleanTestRepo)
    }
}

// A release version is signed with keys only the publish job has; the test repository needs none.
tasks.withType<Sign>().configureEach {
    val signingKey = providers.gradleProperty("signingInMemoryKey")
    onlyIf("a signing key is configured") { signingKey.isPresent }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
    testLogging {
        events("failed", "skipped")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

val functionalTestTask = tasks.register<Test>("functionalTest") {
    description = "Runs the TestKit tests against the library published to the test repository."
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    testClassesDirs = functionalTest.output.classesDirs
    classpath = functionalTest.runtimeClasspath
    shouldRunAfter(tasks.test)

    dependsOn("publishAllPublicationsToTestRepoRepository")
    // The repository itself differs on every publish: snapshot file names carry a timestamp.
    inputs.files(tasks.jar).withNormalizer(ClasspathNormalizer::class)
    inputs.dir("samples").withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("../vendor/gradle-plugin").withPathSensitivity(PathSensitivity.RELATIVE)

    // Gradle 7.5 cannot run on JDK 21+, and TestKit starts its builds on the test JVM.
    javaLauncher = javaToolchains.launcherFor { languageVersion = JavaLanguageVersion.of(17) }

    val androidHome = providers.environmentVariable("ANDROID_HOME")
    inputs.property("androidHomeSet", androidHome.map { true }.orElse(false))

    systemProperty("nativescript.testRepo", testRepo.get().asFile.absolutePath)
    systemProperty("nativescript.libraryVersion", providers.gradleProperty("VERSION_NAME").get())
    systemProperty("nativescript.samplesDir", file("samples").absolutePath)
    systemProperty("nativescript.vendorGradlePluginDir", file("../vendor/gradle-plugin").absolutePath)
    val gradleVersions = providers.gradleProperty("functionalTestGradleVersions").orElse("7.5.1,8.14.3,9.8.1")
    inputs.property("gradleVersions", gradleVersions)
    systemProperty("nativescript.gradleVersions", gradleVersions.get())
}

tasks.check {
    dependsOn(functionalTestTask)
}
