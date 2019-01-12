'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:RewardsHelpCtrl
 */

angular.module('stpls').controller('RewardsHelpCtrl', function($scope, $modal, $rootScope, $state, $stateParams, $timeout, $interval, $window) {

    $scope.isTeacher = false;

    if ($stateParams.tier && ($stateParams.tier === 'TRW' || $stateParams.tier === 'TRP')) {
        $scope.isTeacher = true;
    }

    $scope.hideFooter = function() {
      $rootScope.hide_footer = true;
    };

});
