<!--
We, the rest of the NativeScript community, thank you for your
contribution! 
To help the rest of the community review your change, please follow the instructions in the template.
-->

<!-- PULL REQUEST TEMPLATE -->
<!-- (Update "[ ]" to "[x]" to check a box) -->

## PR Checklist

- [ ] The PR title follows our guidelines: https://github.com/NativeScript/NativeScript/blob/master/CONTRIBUTING.md#commit-messages.
- [ ] There is an issue for the bug/feature this PR is for. To avoid wasting your time, it's best to open a suggestion issue first and wait for approval before working on it.
- [ ] You have signed the [CLA](http://www.nativescript.org/cla).
- [ ] All existing tests are passing: https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#contribute-to-the-code-base
- [ ] Tests for the changes are included.

## What is the current behavior?
<!-- Please describe the current behavior that you are modifying, or link to a relevant issue. -->

## What is the new behavior?
<!-- Describe the changes. -->

Fixes/Implements/Closes #[Issue Number].

<!-- If this PR contains a breaking change, please describe the impact and migration path for existing applications below. -->

<!-- 
BREAKING CHANGES:


[Describe the impact of the changes here.]

Migration steps:
[Provide a migration path for existing applications.]
-->


<!-- 
E2E TESTS

Additional e2e tests can be executed by comment including trigger phrase.

Phrases:
`test cli-smoke`: Smoke tests for `tns run`.
`test cli-create`: Tests for `tns create` commans.
`test cli-plugin`: Tests for `tns plugin *` commands.
`test cli-preview`: Tests for `tns preview` command.
`test cli-regression`: Tests for backward compatibility with old projects.
`test cli-resources`: Test for resource generate.
`test cli-tests`: Tests for `tns test` command.
`test cli-vue`: Smoke tests for VueJS projects based on {N} cli.
`test cli-templates`: Tests for `tns run` on {N} templates.

Define other packages used in e2e tests:

- If PR targets master branch e2e tests will take runtimes and modules @next.
- If PR targets release branch e2e tests will take runtimes and modules @rc.
- You can control version of other packages used in e2e test by adding `package_version#<tag>` as param in trigger phrase  (for example `test package_version#latest`).
-->
