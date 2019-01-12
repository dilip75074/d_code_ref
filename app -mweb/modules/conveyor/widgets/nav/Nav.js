'use strict';

angular.module('stplsConveyor')
  .directive('conveyorNav', function(WidgetFactory){
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/nav/Nav.html'
    });
  });
