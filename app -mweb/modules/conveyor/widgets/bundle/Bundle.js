'use strict';

angular.module('stplsConveyor')
  .directive('conveyorBundle', function(WidgetFactory){
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/bundle/Bundle.html'
    });
  });
