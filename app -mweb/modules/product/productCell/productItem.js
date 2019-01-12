'use strict';

angular.module ('stpls').directive ('productItem', ['$rootScope', 'Product', 'Analytics', '$timeout',
function ($rootScope, Product, Analytics, $timeout) {
    return {
        restrict : 'E',

        scope : {
            data : '=',
            analytics: '@',
            loc: '@',
            skuset: '&',
            skuType: '='
       },

        templateUrl : 'modules/product/productCell/productItem.html',


        controller : function ($scope, $element, $attrs, $rootScope, Product, Cart, Seo, hookLogic) {

            $scope.isSkuset = $scope.$eval($attrs.skuset) || false;
            $scope.isAnalytics = $scope.$eval($attrs.analytics) || false;
            $scope.location = $attrs.loc || "";
            $scope.isHLProduct = ($attrs.skuType === "hookLogic") ? true : false;
            $scope.intelligence = $attrs.intelligence || "";

            $scope.showRegPrice = Product.showRegPrice;

            $scope.clickProduct = function(p, $event) {
                //Drop product click Beacons of every HL product shown
                if ($scope.isHLProduct) {
                    hookLogic.dropPageBeacon(p.beacon.click, 'click');
                }

                //  Go to SKU Page
                $rootScope.toRoute('product', {
                    sku: p.sku,
                    seo: Seo.quartz.sku(p).uri
                });
            };

        }
    };
}]);
