'use strict';

/**
 * @ngdoc function
 * @name stpls.directive:analyticsItem
 * @example <analytics-item item="product" location="{{$root.$state.current.name}}" decorations="" slot="" page="1"><analytics-item>
 */
angular.module('stpls')
    .directive('analyticsItem', ['$timeout', 'Analytics', 'ShippingConfig', function($timeout, Analytics, ShippingConfig) {
        return {
            restrict: 'E',
            scope: {
                item: '=',
                format: '@',
                is: '@intelligence',
                loc: '@location', //usually route name
                slot: '@',
                page: '@'
            },
            link: function($scope) {
                $scope.$watch('item', function() {
                    var item = angular.copy($scope.item);
                    if (item) {

                        // Avoid circular dependencies Product service
                        var getItemDecorations = function(product) {
                            var d = [];
                            if (product) {
                                var decs = Analytics.propValues.decorations;
                                var bits = ShippingConfig.getShippingBitFlags();
                                var pricing = product.price || angular.copy((product.pricing || [])).shift() || {};

                                if (product.freeShipping || product.tag & bits.bitFreeShipping) {
                                    d.push(decs.freeshipping);
                                }

                                if (product.sts) {
                                    d.push(decs.freeshippingToStore);
                                }

                                if (product.seePriceInCart || product.priceInCartOnly === 'true') {
                                    d.push(decs.priceInCart);
                                }
                                if (product.instantSavings || pricing.instantSavings) {
                                    d.push(decs.instantSavings);
                                }

                                if (pricing.discounts) {
                                    angular.forEach(pricing.discounts, function (discount) {
                                        if (discount.deductFromListPrice === 'true') {
                                            d.push(decs.instantSavings);
                                        }
                                    });
                                }

                            }
                            return d;
                        };

                        item.DLO = {
                            loc: $scope.loc,
                            is: $scope.is || null,
                            dec: getItemDecorations(item),
                            sl: $scope.slot || null,
                            p: $scope.page || null
                        };
                        Analytics.addItems(item, $scope.format);
                        //destroy isolate scope to free memory
                        $timeout(function() {
                            $scope.$destroy();
                        });
                    }
                });
            }
        };
    }]);
