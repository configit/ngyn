---
layout: default
title: ngyn - AngularJS Extensions by Configit
---

# Modules

## Resourceful Routing

### JavaScript

```javascript
route.resource('Products');
```

---

## ngResource Extensions
### JavaScript
```javascript
// code goes here
```
---

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

## Select2 Directive

### html
```html
<select ngx-select2="select2options">
  <option value=""></value>
</select>
```