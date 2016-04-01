---
layout: default
title: ngyn - AngularJS Extensions by Configit
---

# About ngyn

**ngyn** is a collection of modules and directives initially extracted from a large scale, entity-centric, 
configuration management application created by [Configit Software](http://www.configit.com).

These components typically help reduce some of the inevitable boilerplate code which creeps into larger applications.

# Download
ngyn can be downloaded from the [github releases page](https://github.com/configit/ngyn/releases)

<a id="resourceful_routing"></a>
# Resourceful Routing

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
# ngResource Extensions
#### JavaScript
```javascript
// !! May be deprecated when angular 1.2 brings advanced interceptors
```
---

<a id="select_extensions"></a>
# Select Extensions

*NOTE: In later versions of angular this is implemented natively as `track by` ([see docs](https://docs.angularjs.org/api/ng/directive/ngRepeat))*

The AngularJS the `select` directive lacks the capability to choose an existing option based on anything other than referential equality. The `ngynSelectKey` module extends select with the capability to specify how items should be compared. This makes it trivial to match an item in the select list with a value being returned, for example from a query.

Usage is simple, just supply a value within a `key` attribute, this will typically be a property name but it can be anything which will resolve using `$scope.$eval()`, such as a function on each attribute.

#### HTML
```html
<select ng-model="user.role" 
        ng-options="r.name for r in user.availableRoles" 
        key="id">
</select>
```
#### JavaScript
```javascript
  $scope.user = {};
  $scope.user.role = { id: 1, name: 'Administrator' };
  $scope.user.availableRoles = Roles.query();
```

See the **select-key-example** in the [examples](https://github.com/configit/ngyn/tree/master/examples) folder for more information.

---

<a id="server_connection"></a>
# Server Connection

Server Connection represents a technology agnostic persistent connection to the web server.

### ServerConnection factory
You use the ServerConnection factory to create a new instance of a ServerConnection, specifying the location of the remote endpoint and wiring up event receivers. Once you have an instance of ServerConnection you can trigger server methods directly on it.

#### Example
```javascript
// Create an instance
var carsServerConnection = ServerConnection('carsEndpoint');

// Connect to the server and supply callbacks
carsServerConnection.connect( 
  $scope, 
  {
    carAdded: function( car ) { $scope.cars.push( car ); },
    carExploded: function( car ) { throw Error( car.reg + ' exploded' ) }
  }
).done(
  // done fires immediately after connect returns and is the correct place to put
  // code which relies on the underlying connection - exposed as server - being available
  function() {
    carsServerConnection.server.getCars().then( function( cars ) {
      $scope.cars = cars;
    });
  }
);
```

### Benefits
The primary benefit Server Connection provides is automatic connection management. We want our connection to be open whilst any controller bound to the currently visible DOM is requesting it, and closed when this is no longer the case. When you first call `connect`, you provide the current scope. The Server Connection is bound to this scope and will instigate a cleanup when this scope is disposed. If all scopes which require a Server Connection are disposed, the connection is closed.

If you call `connect` whilst a connection is already open the method will return immediately and any code registered in the `done` callback will fire.

### SignalR ServerConnectionBackend factory
To allow Server Connection to be technology agnostic and to aid in testing, the actual transport mechanism used is pluggable. Currently the only implemention available is against SignalR. In this configuration the string passed into `connect` is the name of the server hub

# Directives

<a id="select2_directive"></a>
## Select2 Directive

Applies the jQuery [Select2 plugin](http://ivaynberg.github.io/select2/) to an angular select element. This is an entirely progressive enhancement, just add the `ngyn-select2` tag and your select will be turned into a select2.

See the **select2-example** in the [examples](https://github.com/configit/ngyn/tree/master/examples) folder for more information and a demonstration of it's capabilities.

#### html
```html
<select nygn-select2="optionalSelect2options" options="f.name for f in friends">
  <option value="">Choose a friend</value>
</select>
```
