'use strict';

angular.module('stpls')
    .directive('mcsDeals', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/deals/Deals.html',
            link: function($scope, element, attrs) {
            },
            controller: ['$scope', '$rootScope', 'Product', 'DealsService', 'Cart', function ($scope, $rootScope, Product, DealsService, Cart) {
                var p = /\/BI\d+/g;
                $scope.identifier = (p.exec($scope.data.contentSourceUrl)[0].replace(/\//g, ''));

                $scope.data = {};

                $scope.data.title = 'Daily Deals!'

                $scope.data.cart = '';

                var params = {
                    identifier : $scope.identifier
                };
                var results = DealsService.getInitial(params).then(function(data) {
                    if (data.results && data.results.length > 0) {
                        var p = data.results[0];
                        $scope.product = p;
                        $scope.location = 'home:dd:' + (p.isHero ? 'hero' : 'secondary');
                    }
                });

                $scope.showRegPrice = function(product) {
                    return product && Product.showRegPrice(product);
                };

                $scope.addToCart = function(data) {
                    $scope.data.cart = 'loading';

                    data.cartMaskPending = true;
                    Cart.addToCart (data, false).then (function (response) {
                    }, function(error) {
                    })['finally'] (function () {
                        data.noItems = (data.atcError) ? 0 : 1;
                        $scope.data.cart = 'added';
                        data.cartMask = true;
                        data.cartMaskPending = false;

                        setTimeout(function() {
                          $scope.data.cart = '';
                          data.cartMask = false;
                        }, 500);
                    });
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
