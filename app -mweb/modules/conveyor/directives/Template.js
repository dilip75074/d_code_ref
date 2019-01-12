'use strict';
/**
 * @ngdoc directive
 * @name stplsConveyor.directive:conveyorTemplate
 * @restrict E
 *
 * @description
 * Conveyor template is used to render an explicit conveyor template (like homepage)
 *
 * @param {object=} template. the simplified template object from manifest
 *
 * @example
<conveyor-template template="template"></conveyor-template>
*/
angular.module('stplsConveyor')
  .directive('conveyorTemplate', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'modules/conveyor/views/Template.html',
      controller: 'ConveyorCtrl',
      scope: {
        template: '='
      }
    };
  });
