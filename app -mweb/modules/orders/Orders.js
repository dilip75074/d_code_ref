'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Orders
 */
angular.module('stpls').factory('Orders', function($q, $cookies, MobileService) {

    var getOrderHistory = function(offset, limit, sortNameIn, sortOrderIn) {
  	    var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/order/history',
            cache: false,
            params: {
                offset: offset,
                limit: limit,
                sortName: sortNameIn,
                sortOrder: sortOrderIn
           }
        }).then(function(response) {
            var orders = response.data;
            console.log('orders', orders);
            d.resolve(orders);
        }, function(error) {
            console.log('error getting order history', error);
            d.reject(error);
        });
        return d.promise;
	};

	var getOrderStatus = function(orderNumber) {
	    var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/order/status',
            cache: false,
            params: {orderId: orderNumber, zip: '01702', aName: 'withProductDetails'} // send special aName parameter to get product details back also
        }).then(function(response) {
            var order = response.data.orderStatus[0];
            d.resolve(order);
        }, function(error) {
            console.log('error getting order status', error);
            d.reject(error);
        });
        return d.promise;
	};

	return {
		getOrderHistory: getOrderHistory,
		getOrderStatus: getOrderStatus
	};

});

