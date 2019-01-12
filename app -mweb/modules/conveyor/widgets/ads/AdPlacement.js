'use strict';

angular.module('stplsConveyor')
  .directive('conveyorAds', function(WidgetFactory) {
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/ads/AdPlacement.html',
      controller: ['$scope', function($scope) {
        $scope.getParams = function() {
          //probably should do an engine-based mapping here
          return angular.copy($scope.config);
        };
      }]
    });
  });
