'use strict';

angular.module('stpls')
    .directive('mcsTophat', function(MobileService, $rootScope) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            data: '='
        },
        templateUrl: 'modules/mcs/cards/tophat/tophat.html',
        link: function($scope, element, attrs) {
        }
    };
});
