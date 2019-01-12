'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:GuestHomeCtrl
 */
angular.module('stpls')
  .controller('GuestHomeCtrl', function($scope, $window, $stateParams, Conveyor, InsideChat, $rootScope, ClassSearch) {
    var guestHomeVisted =  false;

    //show error
    if (!(/prod/).test($window.stpls_env)) {
      $scope.error = $stateParams.error && $stateParams.msg;
    }

    $scope.search = function(e) {
      var val = e.target[0].value;
      var t = ClassSearch.kosherTerm(val);

      $rootScope.toRoute('search', {
        seo: t,
        term: t,
        sort: 'best_match',
        filter: '',
        fids: ''
      }, {
        inherit: false
      });
    }
  });
