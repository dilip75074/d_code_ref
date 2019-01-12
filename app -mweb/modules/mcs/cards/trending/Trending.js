'use strict';

angular.module('stpls')
    .directive('mcsTrending', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/trending/Trending.html',
            link: function($scope, element, attrs) {
                $scope.products = $scope.data.products;
                angular.forEach($scope.products, function(c) {
                    c.image = ['http://www.staples-3p.com/s7/is/image/Staples/', c.productImage, '_sc7'].join('');
                })
                var p = /\/BI\d+\?/g;
                $scope.identifier = (p.exec($scope.data.contentSourceUrl)[0].replace(/\//g, '').replace(/\?/,''));

                $scope.clickProduct = function(product, $event) {
                    //  Go to SKU Page
                    $rootScope.toRoute('product', {
                        sku: product.skuNumber
                    });
                };
            }
        };
    });
