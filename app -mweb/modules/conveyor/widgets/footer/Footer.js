'use strict';

angular.module('stplsConveyor')
  .directive('conveyorFooter', function($document, WidgetFactory) {
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/footer/Footer.html',
      controller: ['$scope', '$element', '$timeout', function($scope, $element, $timeout) {
        // set items array for banner format
        if ($scope.widget && !$scope.widget.items) {
          $scope.widget.items = [$scope.widget.config];
        }

        // relocate widget
        $element.detach();
        var mainView = $document[0].querySelector('[ui-view="content"]');
        if (mainView) {
          angular.element(mainView).after($element);
        };

        // cleanup
        $scope.$on('$destroy', function() {
          $timeout($element.remove.bind($element));
        });
      }]
    });
  });
