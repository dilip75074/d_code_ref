'use strict';

angular.module('stpls')
  .directive('storeResult', ['Locator', function(Locator) {
    return {
      restrict: 'E',
      scope: {
        store: '=store',
        hide_distance: '=hideDistance'
      },
      templateUrl: 'modules/locator/directives/store.html',
      link: function($scope) {
          $scope.featureImageForCode = function(code) {
              return Locator.featureImageForCode(code);
          };

          $scope.toggleLegend = function() {
              $scope.$emit('locator.toggleRefineLegend');
          };

      }
    };
  }]);