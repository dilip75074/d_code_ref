'use strict';

angular.module('stplsTemplates')
  .directive('storeHeader', function() {
    return {
      restrict: 'E',
      scope: {

      },
      templateUrl: 'common/directives/storeHeader/storeHeader.html',
      controller: 'StoreHeaderCtrl'
    };
  });
