'use strict';

angular.module('stpls').directive('switchToggle', function(){
  return {
    restrict: 'E',
    replace: true,
    require:'ngModel',
    scope: true,
    templateUrl:'common/directives/switchToggle/switchToggle.html',
    link: function(scope, element, attrs, ngModelCtrl){

      scope.disabled = attrs.$attr.disabled ? true : false;

      var KEY_SPACE = 32;

      element.on('click', function() {
        scope.$apply(scope.toggle);
      });

      element.on('keydown', function(e) {
        var key = e.which ? e.which : e.keyCode;
        if (key === KEY_SPACE) {
          scope.toggle();
        }
      });

      ngModelCtrl.$formatters.push(function(modelValue){
        return modelValue;
      });

      ngModelCtrl.$parsers.push(function(viewValue){
        return viewValue;
      });

      ngModelCtrl.$render = function(){
        scope.model = ngModelCtrl.$viewValue;
      };

      scope.toggle = function toggle() {
        if(!scope.disabled) {
          scope.model = !scope.model;
          ngModelCtrl.$setViewValue(scope.model);
        }
      };
    }};
});
