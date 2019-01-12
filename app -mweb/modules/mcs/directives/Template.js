'use strict';

angular.module('stpls')
  .directive('homeCards', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'modules/mcs/views/Template.html',
      controller: 'McsCtrl',
      scope: {
        template: '='
      }
    };
  });
