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
`cli-preview`: Tests for `tns preview` command.
`cli-regression`: Tests for backward compatibility with old projects.
`cli-resources`: Test for resource generate.
`cli-tests`: Tests for `tns test` command.
`cli-vue`: Smoke tests for VueJS projects based on {N} cli.
`cli-templates`: Tests for `tns run` on {N} templates.

Notes:
If PR is against release branch additional comment should be added:
`test package_version#<tag>` (for example `test package_version#latest`)
This will tell what version of other packages will be used in tests.
-->
