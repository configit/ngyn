---
layout: default
title: ngyn - AngularJS Extensions by Configit
---

# About ngyn

**ngyn** is a collection of modules and directives initially extracted from a large scale, entity-centric, 
configuration management application created by [Configit Software](http://www.configit.com).

These components typically help reduce some of the inevitable boilerplate code which creeps into larger applications.

# Modules

<a id="resourceful_routing"></a>
## Resourceful Routing

Angular provides a simple, robust routing component. This is fine for applications serving entirely arbitrary routes or for applications with very few routes. As an application grows though, especially one with a large number of entities, it's likely that you'll find yourself looking to either manage a large number of routes or searching for one, or a number of special *magic routes* to help with this.

Other MVC frameworks go out of their way to help you write these *magic routes*, such as by allowing regexes or a complex set of wildcards. Angular doesn't.

Resourceful routing takes an alternate aproach, whereby you specify your entities, their hierarchical relationships to each other and the actions those entities can fulfil, routes are then automatically generated for you.

This is a philosophy [taken directly from Ruby on Rails](http://guides.rubyonrails.org/routing.html#resource-routing-the-rails-default) and the Angular implementation sticks closely to that.

### Configuration

Resourceful routes are created by the routeProvider in the config phase of the application in exactly the same manner as [angular's native routes](http://docs.angularjs.org/api/ng.$route#Example).

#### Application Module

```javascript
angular.module('myApp', ['cs.modules']).config(function(routeProvider) {
  routeProvider.resource('products');
});
```

This will create the following routes:

| Path                            | Template Url                                   |
|---------------------------------|------------------------------------------------|
|  /products/index                | client/app/products/index.html                 |
|  /products/new                  | client/app/products/new.html                   |
|  /products/:products_id/details | client/app/products/details.html               |
|  /products/:products_id/edit    | client/app/products/edit.html                  |

And the following redirects for convenience

| Path                            | Redirect Url                                   |
|---------------------------------|------------------------------------------------|
|  /products                      | products/index                                 |
|  /products/:products_id         | products/:products_id/details                  |

Angular will automatically generate another 6 redirect routes for us, matching the above with a trailing forward slash. e.g.

| Path                            | Redirect Url                                     |
|---------------------------------|------------------------------------------------|
|  /products/index/               | /products/index                                |

### Utility Functions (Url Generation)

Now that our routes are smarter than just a string matching a pattern, we can take advantage of this and ask our route provider to generate the correct urls for us.

#### Change action for current entity
```javascript
function MyController($scope, $timeout, route) {
  $scope.route = route;
  $scope.delayedNavigate = function() {
    $timeout(function() {
      route.gotoAction('new');
    }, 3000);
  }
}
```

```html
<div ng-controller="MyController">
  <a ng-href="{% raw %}{{ route.action('archive') }}{% endraw %}">Go to Archive</a>
  <button ng-click="delayedNavigate()">Create (delayed)</button>
</div>
```

route.Action and route.gotoAction are convenience functions for `route.link({action:'archive'})` and `route.gotoLink({action:'new'})` respectively.

Furthermore the only difference between link and gotoLink is that the latter causes a location change and the former simply returns the url, making it naturally suited to hyperlink hrefs.

Besides `action` the functions also take the following parameters

#### Utility function parameters
| Parameter     | Purpose     |
|---------------|-------------|
| controller | Allows navigation to a different controller. Can be combined with action |
| path | By default when controller is specified only routes within the current path will be found. Specify a path property to break out of this restriction. |
| controller_name_id | if you wish to navigate to a custom member action, the id of that member must be supplied. e.g. `route.link({ action: 'details', products_id: 1})` |


---
<a id="ngresource_extensions"></a>
## ngResource Extensions
### JavaScript
```javascript
// code goes here
```
---

<a id="select_extensions"></a>
## Select Extensions
### HTML
```html
<select ng-model="user.role" 
        ng-options="r.name for r in user.availableRoles" 
        key="id">
</select>
```
### JavaScript
```javascript
  $scope.user = {};
  $scope.user.role = { id: 1, name: 'Administrator' };
  $scope.user.availableRoles = Roles.query();
```

# Directives

<a id="select2_directive"></a>
## Select2 Directive

### html
```html
<select ngx-select2="select2options">
  <option value=""></value>
</select>
```