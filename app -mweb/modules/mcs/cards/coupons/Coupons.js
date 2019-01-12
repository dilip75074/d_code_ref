'use strict';

angular.module('stpls')
    .directive('mcsCoupons', function( $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/coupons/Coupons.html',
            link: function($scope, element, attrs) {
                $scope.coupons = $scope.data.couponData;
                angular.forEach($scope.coupons, function(c) {
                    // TODO:
                    c.image = ['http://www.staples-3p.com/s7/is/image/Staples/', c.image, '_sc7'].join('');
                })

                $scope.clickProduct = function(coupon, $event) {
                    //  Go to SKU Page
                    $rootScope.toRoute('product', {
                        sku: coupon.skuNumber
                    });
                };
            }
        };
    });
