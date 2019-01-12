'use strict';

angular.module('stplsConveyor')
  .directive('conveyorPageTophat', function(WidgetFactory) {
    return WidgetFactory.directive({
      template: '<div class="conveyor-tophat">' +
        '<a stp-href="{{config.link}}" title="{{config.title}}">' +
        '<img class="img-responsive nofade" lazy-load-image="true" lazy-src="{{config.src | s7Image}}" />' +
        '</a>' +
        '</div>'
    });
  })
  // directive to override the global page tophat (tricky)
  .directive('conveyorTophat', function(WidgetFactory, Conveyor) {
    return WidgetFactory.directive({
      controller: ['$scope', function($scope) {
        Conveyor.setTophat($scope.widget);
      }]
    });
  });
