'use strict';

angular.module('stpls').directive('btnExpand', function(){
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, $element, $attrs, ngModel) {
      var expandClass = 'expanded';
      //initial state
      var m = ngModel;
      $element.addClass('btn_chevron_expand');

      var operator = $attrs.btnExpand.replace(/[^\!]/g,'');

      var listener = function(){
        $element[!!$scope.$eval(operator + $attrs.ngModel) ? 'addClass' : 'removeClass'](expandClass);
      };
      m.$viewChangeListeners.push(listener);
      $scope.$watch($attrs.ngModel, listener);
      listener();
      //toggling
      $element.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        m.$setViewValue(!m.$viewValue);
      });
    }
  };
});
