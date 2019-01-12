'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:OrderDetailCtrl
 */
angular.module('stpls').controller('OrderDetailCtrl', ['$scope', '$q', '$rootScope', '$stateParams', '$translate', '$timeout', 'Cart', 'Orders', 'Product', 'Analytics', 'Seo',
    function($scope, $q, $rootScope, $stateParams, $translate, $timeout, Cart, Orders, Product, Analytics, Seo) {

    $scope.order = {};
    $scope.orderNum = $stateParams.id;
    $scope.loading = true;
    $scope.errorMsg;

    Orders.getOrderStatus($stateParams.id).then(function(result) {

        angular.forEach(result.products, function(product) {
            product.qty = 1;
            product.checked = false; // default not checked
            Product.setSkuTags(product);
        });

        $scope.loading = false;
        $scope.order = result;
        $scope.order.orderDate = new Date($scope.order.orderDate);
        if ($scope.order.shipment[0]) {
            $scope.order.orderStatus = $scope.order.shipment[0].shipmentStatusDescription;
        }
    }, function(error) {
        $scope.loading = false;
        $scope.errorMsg = $translate.instant('ORD_DETERR_LBL');
        console.log('error', error);
    });


    $scope.addToCart = function(item) {

        item.cart = 'loading';
        if (item.businessService) {
            var validStartedSku = Product.getStarted (item);
            if (!validStartedSku) {
                Cart.addToCart (item, false).then (function (response) {
                    item.noItems = 1;
                }, function(error){
                    item.noItems = 0;
                })['finally'] (function () {
                    item.cart = '';
                    item.cartMask = true;
                    countDownATCOverlay(item);
                });
            } else {
                return;
            }
        } else {
            Cart.addToCart (item, false).then (function (response) {
                item.noItems = 1;
            }, function(error){
                item.noItems = 0;
            })['finally'] (function () {
                item.cart = '';
                item.cartMask = true;
                countDownATCOverlay(item);
            });
        }
    };

    var countDownATCOverlay = function (item) {
        //  2 seconds
        $timeout(function() {
            item.cartMask = undefined;
        }, 2000);
    };

    $scope.directToProduct = function(product) {
        $rootScope.toRoute('product', {
            sku : product.sku,
            seo: Seo.quartz.sku(product).uri
        });
    };

    //Analytics signals for loading
    Analytics.addWatch($scope, 'loading');
}

]);
