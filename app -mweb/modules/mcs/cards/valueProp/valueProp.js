'use strict';

angular.module('stpls')
    .directive('mcsValueProp', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/valueProp/valueProp.html',
            link: function($scope, element, attrs) {

                var valueProp = {};
                //TODO: show the required image
                valueProp.image = '';
                $scope.valueProp = valueProp;
            }
        };
    });
