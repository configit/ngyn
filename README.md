ngyn
=======

ngyn is a collection of modules and directives initially extracted from a large scale, entity-centric, configuration management application created by Configit Software.

These components typically help reduce some of the inevitable boilerplate code which creeps into larger applications.

Modules Currently include

* __Resourceful Routing__: Adds advanced rails style routing to AngularJS. Particularly useful in entity-centric apps.
* __Resource Extensions__: Hooks for adding data on the way out or parsing it on the way in.
* __Select Key__: Allows you to specify a way to match an ng-option element to the select's ng-model.
* __Select2__: A directive to perform an in-place progressive enhancement to convert a select element into a select2 one.
* __Track Changes__: Tracks changes to form fields in a $changed property. Like $dirty/$pristine, but resets when value matches original.
* __Form Saving Extensions__: Assists in validating that a form was completed or abandoned, prompting the user to confirm.

Full documentation: http://configit.github.io/ngyn

## Building
To perform a single build, which concatenates the source files into `ngyn.js` and `ngyn.min.js` inside the dist folder, run:

```shell
npm run build
```

To perform a build then run all tests:

```shell
npm test
```

When developing the most common task you will require is to watch all source and test files and re-run tests on any change, this is simply:

```shell
npm start
# This is an alias for:
npm run test:watch
```

There is also a `build:watch` task which you may find useful.
