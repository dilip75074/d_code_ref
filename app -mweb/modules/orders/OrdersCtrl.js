'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:OrdersCtrl
 * @desc Order history list
 */
angular.module('stpls').controller('OrdersCtrl', ['$scope', '$rootScope', 'Orders', 'MobileService',
    function($scope, $rootScope, Orders, MobileService) {

        // TODO: this doesn't work if user session expires
        if (MobileService.getSessionState() !== 'registered') {
            $rootScope.toRoute('login', {
                returnRte: 'orders'
            });
        }

        $scope.order = {};
        $scope.loading = false;
        $scope.resultsComplete = false;
        $scope.currentCount = 0;
        $scope.resultsTotal = 0;

        // Default sort - latest order first
        $scope.dateAsc = 'orderDate_ASC';
        $scope.dateDesc = 'orderDate_DESC';
        $scope.numAsc = 'orderNumber_ASC';
        $scope.numDesc = 'orderNumber_DESC';
        $scope.totalAsc = 'orderTotal_ASC';
        $scope.totalDesc = 'orderTotal_DESC';

        $scope.limit = 5; //  Only show 5 initially

        $scope.sortBy = $scope.dateDesc;

        $scope.openOrder = function(orderNumber) {
            $rootScope.toRoute('order', {
                id: orderNumber
            });
        };

        $scope.updateSort = function(sortField) {
            if (sortField === 'orderDate') {
                if ($scope.sortBy.indexOf('orderDate' > 0)) {
                    //  clicked same sort, so reverse the order
                    $scope.sortBy = ($scope.sortBy != $scope.dateAsc ? $scope.dateAsc : $scope.dateDesc);
                } else {
                    $scope.sortBy = $scope.dateDesc; // default
                }
            } else if (sortField === 'orderNumber') {
                if ($scope.sortBy.indexOf('orderNumber' > 0)) {
                    //  clicked same sort, so reverse the order
                    $scope.sortBy = ($scope.sortBy != $scope.numAsc ? $scope.numAsc : $scope.numDesc);
                } else {
                    $scope.sortBy = $scope.numAsc; // default
                }
            } else if (sortField === 'orderTotal') {
                if ($scope.sortBy.indexOf('orderTotal' > 0)) {
                    //  clicked same sort, so reverse the order
                    $scope.sortBy = ($scope.sortBy != $scope.totalAsc ? $scope.totalAsc : $scope.totalDesc);
                } else {
                    $scope.sortBy = $scope.totalAsc; // default
                }
            }
            $scope.refresh();
        };

        $scope.refresh = function() {
            //  Split $scope.sortBy into fieldname and Asc/Desc
            var sortField = $scope.sortBy.split('_')[0];
            var sortAsc = $scope.sortBy.split('_')[1];

            //  Show loading spinner
            $scope.loading = true;

            if ($scope.limit === 9999) { //  this is the end
                $scope.loading = false;
                return;
            }

            Orders.getOrderHistory(1, $scope.limit, sortField, sortAsc).then(function(result) {

                var orders = result.OrderHistory;

                $scope.resultsComplete = (result.recordSetComplete === 'true');
                $scope.currentCount = parseInt(result.recordSetCount);
                $scope.resultsTotal = parseInt(result.recordSetTotal);

                // fix the dates
                $scope.orders = _.map(orders, function(order) {
                    order.orderDate = new Date(order.orderDate);
                    return order;
                });
            })['finally'](function(){
                 $scope.loading = false;
            });
        };

        $scope.showMoreResults = function() {
            $scope.limit += 5;

            $scope.refresh();
        };

        $scope.refresh();
    }
]);
