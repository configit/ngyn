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
            template: '<div class="modal-header"><h3>Unsaved Changes</h3></div>' +
                      '<div class="modal-body"><p>The changes you have made have not been saved.</p><p>Are you sure you want to leave this page?</p></div>'+
                      '<div class="modal-footer"><button class="btn btn-lg btn-primary" ng-click="$close( true )">Continue</button><button class="btn btn-link" ng-click="$close( false )">Cancel</button></div>',
            controller: function() {},
            resolve: {},
            windowClass: 'modal'
          } )
          .result.then( function( confirmed ) {
            if ( confirmed ) {
              var pathStartIndex = $location.absUrl().indexOf( $location.url() );
              deregisterLocationChange();
              $location.url( newUrl.substr( pathStartIndex ) );
            }

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
        deregisterLocationChange();
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

        $rootScope.$broadcast( 'ngyn:form-save-triggered' );

        // reset all server errors so the form can be resubmitted
        controlsWithServerErrors.forEach( function( control ) {
          control.$setValidity( 'serverError', true );
          control.$serverErrors = [];
        } );
        controlsWithServerErrors.length = 0;

        if ( ctrl.form.$invalid ) {
          $rootScope.$broadcast( 'ngyn:form-save-failed' );
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
          $rootScope.$broadcast( 'ngyn:form-save-succeeded' );
        }, function( response ) {
          ctrl.unhandledServerErrors = [];

          ( response.data.errors || [] ).forEach( function( error ) {
            if ( angular.isUndefined( error.propertyName ) ) {
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
          $rootScope.$broadcast( 'ngyn:form-save-failed' );
        } );
      }

      $element.bind( 'submit', function( evt ) {
        if ( ctrl._saveAction ) {
          $scope.$apply( function() {
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
