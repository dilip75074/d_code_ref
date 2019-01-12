'use strict';


angular.module('stpls')
    .directive('shippingIndicator', function($translate, $rootScope, ShippingConfig) {
        return {
            restrict: 'E',
            scope: {
                tag: '@shippingTag'
            },
            templateUrl: 'modules/cart/directives/shippingIndicator.html',
            link: function(scope, element, attrs) {
                var config = ShippingConfig.getShippingConfig();

                scope.tagFilter = function(bit) {
                    // freeShipping 1, bopis 2, addOn 4, oversize 8, retailonly 16
                    return !!(scope.tag & bit);
                };

                scope.addOnTag = function() {
                    return String($translate.instant('PROD_MINIMUM_TAG')).replace('%v%', config.addOnBasketSize);
                };

                scope.showShippingLogicInfo = function(isAddOn) {
                    var msg, msgAddOn;

                    if (isAddOn) {
                        msg = String($translate.instant('PROD_FREE_SHIPPING_INFO')).replace('%v%', config.addOnBasketSize);
                        msgAddOn =  scope.addOnTag();
                    } else {
                        msg = String($translate.instant('PROD_OVERSIZE_SHIPPING_INFO')).replace('%v%', config.heavyWeightShipCharge);
                    }

                    $rootScope.prompt({
                        shippingLogic: {
                            isAddOnSKU: isAddOn,
                            addOnIndicator: msgAddOn,
                            message: msg
                        }
                    });
                };
            }
        };

    });