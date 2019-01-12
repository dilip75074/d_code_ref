'use strict';

angular.module('stplsConveyor')
  .directive('conveyorText', function(WidgetFactory){
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/text/Text.html'
    });
  });
