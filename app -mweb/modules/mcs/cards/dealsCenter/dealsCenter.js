'use strict';

angular.module('stpls')
    .directive('mcsDealsCenter', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/services/services.html',
            link: function($scope, element, attrs) {

                var service = {};
                //TODO: show the required image
                service.image = 'http://s7d5.scene7.com/is/image/Staples/56039_ios_960x420_laptops?$iOS%20and%20new%20mWeb$';
                $scope.service = service;

                $scope.bannerClick = function($event) {
                    //TODO: route to the required services location
                    $rootScope.toRoute('deals', {adref: 'mobile_nav'});
                };
            }
        };
    });
