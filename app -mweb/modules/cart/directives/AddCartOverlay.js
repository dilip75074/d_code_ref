'use strict';

angular.module('stpls')
    .directive('addCartOverlay', function($rootScope) {
        return {
            restrict: 'E',
            scope: {
                item: '='   //  sku item
            },
            templateUrl: 'modules/cart/directives/AddCartOverlay.html',
            link: function(scope, element, attr) {
                scope.element = element;
            },
        };
    });
