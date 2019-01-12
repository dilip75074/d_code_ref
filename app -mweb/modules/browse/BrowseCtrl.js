'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:BrowseCtrl
 */
angular.module('stpls')
   .controller('BrowseCtrl', function ($scope, $stateParams, Browse) {
       // an incoming identifier from the URL (for opening the specific category on page load)
       $scope.identifier = $stateParams.identifier;
  });
