'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:AccountCtrl
 */
angular.module('stpls').controller('AccountCtrl', function ($scope, $rootScope, MobileService) {

    if (MobileService.getSessionState() !== 'registered') {
        $rootScope.toRoute('login', { returnRte: 'account'});
    }

});
