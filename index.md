---
layout: default
title: ngyn - AngularJS Extensions by Configit
---
<link rel="stylesheet" type="text/css" href="stylesheets/stylesheet.css" media="screen" />

<!-- <div id="topbar">
  <a href="#resourceful_routing"><span>Resourceful Routing</span></a>
  <a href="#ngresource_extensions" class="active"><span>ngResource Extensions</span></a>
  <a href="#select_extensions"><span>Select Extensions</span></a>
  <a href="#select2_directive"><span>Select2 Directive</span></a>
</div> -->

# Resourceful Routing

### JavaScript

```javascript
route.resource('Products');
```

# ngResource Extensions
### JavaScript
```javascript
// code goes here
```

# Select Extensions
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

# Select2 Directive

### html
```html
<select ngx-select2="select2options">
  <option value=""></value>
</select>
```