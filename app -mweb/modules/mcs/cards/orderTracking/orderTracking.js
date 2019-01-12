'use strict';

angular.module('stpls')
    .directive('mcsOrderTracking', function($rootScope, Orders, Product) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/orderTracking/orderTracking.html',
            link: function($scope, element, attrs) {

                $scope.openOrder = function(orderNumber) {
                    $rootScope.toRoute('order', {
                        id: orderNumber
                    });
                };

                $scope.enabled = false;

                $scope.parseProtocol = function(url) {
                    var urlData = new URL(url);

                    url = url.split(urlData.protocol)[1];

                    return url;
                };

                Orders.getOrderHistory(1, 1, 'orderDate', 'DESC').then(function(response) {
                    var orderId = response.OrderHistory[0].orderNumber;
                    
                    Orders.getOrderStatus(orderId).then(function(response) {
                        var order = response;

                        var thisOrder = {};
                        var num = order.shipment.length;

                        $scope.enabled = true;
                        thisOrder.title = order.shipment[0].shipmentSku[0].skuDescription;

                        if (num > 1) {
                            thisOrder.subtitle = '+' + (num - 1) + ' more item(s)';
                        }

                        thisOrder.number = order.shipment[0].orderNumber;
                        thisOrder.status = order.shipment[0].shipmentStatusDescription;
                        thisOrder.deliveryDate = new Date(order.shipment[0].scheduledDeliveryDate).toLocaleDateString();

                        Product.getBySKU(order.shipment[0].shipmentSku[0].skuNumber).then(function(res) {
                            thisOrder.image = $scope.parseProtocol(res.images[0]);
                            thisOrder.product = res;
                        });

                        switch (thisOrder.status) {
                            case 'Processing':
                                thisOrder.statusTag = 'processing';
                                break;
                            case 'In transit':
                                thisOrder.statusTag = 'inTransit';
                                break;
                            case 'Delivered':
                            case 'Picked up':
                                thisOrder.statusTag = 'delivered';
                                break;
                            case 'Ready for pick up':
                                thisOrder.statusTag = 'readyPickup';
                                break;
                            case 'Did not pick up':
                                thisOrder.statusTag = 'didNotPickup';
                                break;
                            default:
                                thisOrder.statusTag = 'processing';
                                break;
                        }

                        if (thisOrder.statusTag != 'delivered' || (Math.abs(new Date(order.shipment[0].scheduledDeliveryDate) - new Date()) / 36e5) <= 48) {
                            $scope.enabled = true;
                            $scope.order = thisOrder;
                        } else {
                            $scope.enabled = false;
                        }
                    });
                });
            }
        };
    });
