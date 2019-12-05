Contribute to the Telerik NativeScript Command-Line Interface
===

*Help us improve the Telerik NativeScript CLI* 

* [Report an Issue](#report-an-issue "Learn how to report an issue")
* [Request a Feature](#request-a-feature "Learn how to submit a feature or improvement request")
* [Contribute to the Code Base](#contribute-to-the-code-base "Learn how to submit your own improvements to the code")
* [Updating the CLI Documentation](#updating-the-cli-documentation "Learn how to make changes to CLI help and documentation")

Report an Issue
===
If you find a bug in the source code or a mistake in the documentation, you can submit an issue to our [GitHub Repository][2].
Before you submit your issue, search the archive to check if a similar issues has been logged or addressed. This will let us focus on fixing issues and adding new features.
If your issue appears to be a bug, and hasn't been reported, open a new issue and select the `Bug report` option. To help us investigate your issue and respond in a timely manner, please follow the recommended bug report template.

[Back to Top][1]

Request a Feature
===
You can request a new feature by opening a new issue, selecting the `Feature request` option and following the recommended feature request template.
If you want to implement a new feature yourself, consider submitting it to the [GitHub Repository][2] as a Pull Request.

[Back to Top][1]

Contribute to the Code Base
===

Before you submit a Pull Request, consider the following guidelines.

* Search <a href="https://github.com/NativeScript/nativescript-cli/pulls">GitHub</a> for an open or closed Pull Request that relates to your submission.
* Clone the repository.
```bash
    git clone git@github.com:NativeScript/nativescript-cli.git
```
* Run the setup script. This will initialize the git submodule, install the node dependencies and build with grunt.
```bash
    npm run setup
```
* Make your changes in a new `git` branch. We use the <a href="http://nvie.com/posts/a-successful-git-branching-model/">Gitflow branching model</a> so you will have to branch from our master branch.
```bash
    git checkout -b my-fix-branch master
```
* Create your patch and include appropriate test cases.
* Build your changes locally.
```bash
    ./node_modules/.bin/grunt
```
* Ensure all the tests pass.
```bash
    ./node_modules/.bin/grunt test
```
* Ensure that your code passes the linter.
```bash
    ./node_modules/.bin/grunt lint
```
* Commit your changes following the [commit message guidelines](https://github.com/NativeScript/NativeScript/blob/master/CONTRIBUTING.md#-commit-message-guidelines) (the commit message is used to generate release notes). 
```bash
    git commit -m "fix: my awesome fix"
```
* Push your branch to GitHub.
```bash
    git push origin my-fix-branch
```
* In GitHub, send a Pull Request to nativescript-cli:master.
* If we suggest changes, you can modify your branch, rebase, and force a new push to your GitHub repository to update the Pull Request.
```bash
    git rebase master -i
    git push -f
```

That's it! Thank you for your contribution!

When the patch is reviewed and merged, you can safely delete your branch and pull the changes from the main (upstream) repository.

* Delete the remote branch on GitHub.
```bash
    git push origin --delete my-fix-branch
```
* Check out the master branch.
```bash
    git checkout master -f
```
* Delete the local branch.
```bash
    git branch -D my-fix-branch
```
* Update your master branch with the latest upstream version.
```
    git pull --ff upstream master
```

[Back to Top][1]

Updating the CLI Documentation
===

The CLI documentation is what you see when running the `tns help` command. 
This documentation is distributed as part of the CLI package and is generated from the *.md files that can be found in <a href="https://github.com/NativeScript/nativescript-cli/tree/master/docs/man_pages" target="_blank">man_pages folder</a>
The output of the documentation is html static pages that are generated on post install hook of the CLI installation. 
In addition, documentation generation is triggered every time there is no html article for the respective help command that is executed.

In order to see a change applied in your development workspace after editing the *.md files, you can use the `tns dev-generate-help` command. 
This will trigger regeneration of all html files on your local environment. Mind that you need to run from the /bin folder of the nativescript_cli.

[Back to Top][1]

[1]: #contribute-to-the-telerik-nativescript-command-line-interface
[2]: https://github.com/NativeScript/nativescript-cli
