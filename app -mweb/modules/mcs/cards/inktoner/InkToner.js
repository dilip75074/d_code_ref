'use strict';

angular.module('stpls')
    .directive('mcsInkToner', function($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/inktoner/InkToner.html',
            link: function($scope, element, attrs) {

            },
            controller: ['$scope', 'Product', function ($scope, Product) {
                var p = /\/BI\d+/g;
                $scope.identifier = (p.exec($scope.data.contentSourceUrl)[0].replace(/\//g, ''));

                $scope.showRegPrice = function(product) {
                    return product && Product.showRegPrice(product);
                };


                var p = $scope.data.products[0];
                var product = {};
                product.name = p.productName;
                product.image = ['http://www.staples-3p.com/s7/is/image/Staples/', p.productImage, '_sc7'].join('');
                product.finalPrice = p.productPrice;
                product.rating = p.ratings;
                product.saveNow = p.offerPrice;
                product.listPrice = p.listPrice;
                product.showRegPrice = parseFloat(product.listPrice) > parseFloat(product.finalPrice);
                $scope.product = product;

            }]
        };
    });
