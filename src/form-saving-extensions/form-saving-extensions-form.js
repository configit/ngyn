'use strict';

angular.module( 'ngynFormSavingExtensions' ).directive( 'form', function() {
  return {
    name: 'ngynFormSavingExtensions',
    restrict: 'E',
    require: ['form', 'ngynFormSavingExtensions', '?ngynTrackChangesForm'],
    controller: [ '$attrs', '$element', '$scope', '$rootScope', '$timeout', '$uibModal', '$location', function( $attrs, $element, $scope, $rootScope, $timeout, $uibModal, $location ) {
      var ctrl = this;
      var controlsWithServerErrors = [];
      var hasSaveActionOnForm = false;
      var handlingUnsavedChanges = false;
      ctrl._saveAction = null;
      ctrl.state = 'unsaved';

      if ( angular.isUndefined( $attrs.noblock ) ) {
        var deregisterLocationChange = $scope.$on( '$locationChangeStart', function( evt, newUrl ) {
          if ( ctrl.canBeLeft() ) {
            return true;
          }

          if ( handlingUnsavedChanges ) {
            evt.preventDefault();
            return false;
          }

          handlingUnsavedChanges = true;

          $uibModal.open( {
            template: '<div class="modal-header">' +
                        '<h3>Leave this page?</h3>' +
                      '</div>' +
                      '<div class="modal-body">' +
                        '<p>If you leave this page, your changes will be lost.</p>' +
                        '<p>Leave anyway?</p>' +
                      '</div>'+
                      '<div class="modal-footer">' +
                        '<button class="btn btn-lg btn-primary" ng-click="$close( true )">Leave &amp; discard changes</button> ' +
                        '<button class="btn btn-link" ng-click="$close( false )">Stay on page</button>' +
                      '</div>',
            controller: function() {},
            resolve: {},
            windowClass: 'modal unsaved-changes-modal'
          } )
          .result.then( function( confirmed ) {
            if ( confirmed ) {
              var pathStartIndex = $location.absUrl().indexOf( $location.url() );
              deregisterLocationChange();
              $location.url( newUrl.substr( pathStartIndex ) );
            }

            handlingUnsavedChanges = false;
          }, function() {
            // dismissed (e.g. escape pressed)
            handlingUnsavedChanges = false;
          } );

          evt.preventDefault();
          return false;
        } );
      }

      ctrl.reset = function() {
        $timeout( function() {
          ctrl.trackChanges.removeAllChangedFields();
        } );
        ctrl.state = 'unsaved';
      }

      ctrl.markSaved = function() {
        if ( ctrl.state !== 'unsaved' ) {
          // if the form has been reset before markSaved is called we remain unsaved
          ctrl.state = 'saved';
        }

        ctrl.trackChanges.removeAllChangedFields();
      }

      ctrl.markUnsaved = function() {
        ctrl.state = 'unsaved';
      }

      ctrl.abandonChanges = function() {
        ctrl.state = 'abandoned';
        
        if ( angular.isUndefined( $attrs.noblock ) ) {
          deregisterLocationChange();
        }
      }

      ctrl.setSaveAction = function( fn, isForm ) {
        // last in wins, but saveAction defined on form always takes precedence
        if ( !hasSaveActionOnForm ) {
          ctrl._saveAction = fn;
        }

        if ( isForm ) {
          hasSaveActionOnForm = true;
        }
      }

      ctrl.canBeLeft = function() {
        var changed = ctrl.trackChanges ? ctrl.form.$changed : ctrl.form.$dirty;

        return !ctrl._saveAction || !changed || ctrl.state === 'abandoned' || ctrl.state === 'saved';
      }

      ctrl.save = function( saveAction, scope ) {

        $rootScope.$broadcast( 'ngyn:form-save-triggered', { formName: ctrl.form.$name } );

        // reset all server errors so the form can be resubmitted
        controlsWithServerErrors.forEach( function( control ) {
          control.$setValidity( 'serverError', true );
          control.$serverErrors = [];
        } );
        controlsWithServerErrors.length = 0;

        if ( ctrl.form.$invalid ) {
          $rootScope.$broadcast( 'ngyn:form-save-failed', { formName: ctrl.form.$name } );
          return;
        }

        // evaluate the return of the save method, if it doesn't return something we can watch, ignore it
        var action = scope.$eval( saveAction );
        if ( !action ) {
          return;
        }

        var promise;
        if ( action.$promise ) {
          promise = action.$promise;
        } else if ( angular.isFunction( action.then ) ) {
          promise = action;
        }

        if ( !promise ) {
          return
        }

        ctrl.state = 'saving';

        promise.then( function( response ) {
          ctrl.markSaved();
          $rootScope.$broadcast( 'ngyn:form-save-succeeded', { formName: ctrl.form.$name } );
        }, function( response ) {
          ctrl.unhandledServerErrors = [];

          ( response.data.errors || [] ).forEach( function( error ) {
            if ( angular.isUndefined( error.propertyNames ) || !error.propertyNames.length ) {
              ctrl.unhandledServerErrors.push( error );
            }
            else {
              ( error.propertyNames || [] ).forEach( function( propertyName ) {
              if ( ctrl.form[propertyName] ) {
                controlsWithServerErrors.push( ctrl.form[propertyName] );
                ctrl.form[propertyName].$setValidity( 'serverError', false );
                if ( !angular.isArray( ctrl.form[propertyName].$serverErrors ) ) {
                  ctrl.form[propertyName].$serverErrors = [];
                }

                ctrl.form[propertyName].$serverErrors.push( error );
              } else {
                ctrl.unhandledServerErrors.push( error );
              }

              } );
            }
          } );

          ctrl.markUnsaved();
          $rootScope.$broadcast( 'ngyn:form-save-failed', { formName: ctrl.form.$name } );
        } );
      }

      $element.bind( 'submit', function( evt ) {
        if ( ctrl._saveAction ) {
          $scope.$apply( function() {
            // Because Internet Explorer only respects 'disabled' for clicking
            // on the actual element, event propogation continues and
            // the save action is called even if the element is disabled. We
            // check for the existence of the disabled attribute to stop the
            // action from executing if the element is disabled.
            if ( !$attrs.disabled ) {
              ctrl.save( ctrl._saveAction, $scope );
            }
          } );
          evt.preventDefault();
        }
      } );
    } ],

    link: function( scope, elm, attrs, ctrls ) {
      var form = ctrls[0];
      var ctrl = ctrls[1];
      var trackChanges = ctrls[2];

      // pin the other directives to the controller so they can be accessed in the controller(!)
      ctrl.form = form;
      ctrl.trackChanges = trackChanges;

      scope.formSavingExtensions = ctrl;
    }
  }
} );
