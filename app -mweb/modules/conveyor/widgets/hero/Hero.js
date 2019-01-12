'use strict';

angular.module('stplsConveyor')
  .directive('conveyorHero', function(WidgetFactory) {
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/hero/Hero.html',
      controller: ['$scope', function($scope) {
        $scope.getWords = function() {
          return ($scope.config.text || '').trim().split(/\s+/);
        };
      }]
    });
  });
