'use strict';

angular.module('stpls')
    .directive('mcsUser', function(MobileService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'modules/mcs/cards/user/User.html',
            link: function($scope, element, attrs) {
                $scope.session_user = MobileService.getSessionUserName();
            }
        };
    });
