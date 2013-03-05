---
layout: default
title: ngyn - AngularJS Extensions by Configit
---

# Modules

<a id="resourceful_routing"></a>
## Resourceful Routing

### JavaScript

```javascript
route.resource('Products');
```

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