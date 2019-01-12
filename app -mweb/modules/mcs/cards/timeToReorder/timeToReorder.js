'use strict';

angular.module('stpls')
    .directive('mcsTimeToReorder', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/timeToReorder/timeToReorder.html',
            controller: ['$scope', '$rootScope', 'Cart', 'MobileService', 'EZReorder', 'Product', '$timeout', function ($scope, $rootScope, Cart, MobileService, EZReorder, Product, $timeout) {
                if (MobileService.getSessionState() !== 'registered') {
                    return;
                }

                $scope.showRegPrice = function(product) {
                    return Product.showRegPrice(product);
                };

                EZReorder.getResults(null, 10, 1, 'ASC').then(function(data){
                    $scope.reorderProducts = data.results;
                    angular.forEach($scope.reorderProducts, function(p) {
                        Product.getPricing(p);
                    });
                });
                $scope.addToCart = function(data) {
                    data.cart = 'loading';
                    data.cartMaskPending = true;
                    Cart.addToCart (data, false).then (function (response) {
                    }, function(error){
                    })['finally'] (function () {
                        data.noItems = (data.atcError) ? 0 : 1;
                        data.cart = '';
                        data.cartMask = true;
                        data.cartMaskPending = false;
                        countDownATCOverlay(data);
                    });
                };

                var countDownATCOverlay = function (data) {
                    //  2 seconds
                    $timeout(function() {
                        data.cartMask = false;
                    }, 2000);
                };

                $scope.clickProduct = function(p, $event) {
                    //  Go to SKU Page
                    $rootScope.toRoute('product', {
                        sku: p.sku
                    });
                };
            }]
        };
    });
