'use strict';

angular.module('stpls')
  .directive('pageContainer', function() {
    return {
      restrict: 'E',
      scope: {
      },
      templateUrl: 'common/directives/page/pageContainer.html',
      controller: 'PageCtrl'
    };
  });