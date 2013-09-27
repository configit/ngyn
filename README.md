ngyn
=======

ngyn is a collection of modules and directives initially extracted from a large scale, entity-centric, configuration management application created by Configit Software.

These components typically help reduce some of the inevitable boilerplate code which creeps into larger applications.

Modules Currently include

* __Resourceful Routing__: Adds advanced rails style routing to AngularJS. Particularly useful in entity-centric apps.
* __Resource Extensions__: Hooks for adding data on the way out or parsing it on the way in.
* __Select Key__: Allows you to specify a way to match an ng-option element to the select's ng-model.
* __Select2__: A directive to perform an in-place progressive enhancement to convert a select element into a select2 one.

Full documentation: http://configit.github.io/ngyn

## Building
Todo a single build run

```bash
npm install
node_modules/grunt-cli/bin/grunt
```

This will concat the `src/` files and copy them to the `dist/` folder.

When developing it can be useful to auto build and run tests each time a file is
modified. To start watching files run

```bash
node_modules/grunt-cli/bin/grunt karma:background watch
```

This will start a [karma](http://karma-runner.github.io/0.10/index.html) process and watch for file changes.

To create nuget package run

```bash
node_modules/grunt-cli/bin/grunt packages --Major=1 --Minor=2 --Revision=2381
```

this will create a `packages-build/ngyn-1.2.2381.nupkg` file