'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Checkout
 */
angular.module('stpls').factory('Checkout', function($rootScope, $http, $q, $cookies, Account, MobileService) {

    var checkout;

    /*  Event triggered on Login / Logout */
    $rootScope.$on('loginlogout', function(event, data) {
        clear(false);
    });

    var getInfo = function() {
        return checkout;
    };

    var setInfo = function(c) {
        checkout = c;
    };

    /*  Kount  */
    var kountCollect = function(orderId) {

        if (orderId === null) {
            return $q.when();
        }
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/kountLogo',
            cache: false,
            params: {
                s: orderId
            },
         }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Update Shipping Address during Checkout Process  */
    var updateShippingAddress = function(shippingData) {

        if (shippingData === null) {
            return $q.when();
        }
        var d = $q.defer();

        MobileService.request({
            method: 'POST',
            url: '/cart/shippingAddress',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            params: {
                zip: shippingData.deliveryZipCode || shippingData.shipToStoreZipCode || Account.getZipCode()
            },
            data: shippingData
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  get Shipping Address during Checkout Process  */
    var getShippingAddress = function() {

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/cart/shippingAddress',
            headers: {
                'cache-control': 'proxy-revalidate'
            }
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Update Billing Address during Checkout Process */
    var updateBillingAddress = function(billingData) {

        if (billingData === null) {
            return $q.when();;
        }
        var d = $q.defer();

        MobileService.request({
            method: 'POST',
            url: '/cart/billingAddress',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            params: {
                zip: Account.getZipCode()
            },
            data: billingData
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Call preCheckout process on Cart */
    var cartPreCheckout = function(paramsIn) {

        var d = $q.defer();

        var paramsInput = {};
        if (paramsIn) {
            paramsInput = paramsIn;
        }
        MobileService.request({
            method: 'PUT',
            url: '/cart/precheckout',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            data: paramsInput,
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Call Tax Calc on Cart */
    var cartTaxCalc = function() {

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/cart/tax',
            headers: {
                'content-type': 'application/json',
                'cache-control': 'proxy-revalidate'
            },
            dataType: 'json',
            cache: false,
            params: {},
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Update Payment in Cart */
    var updatePayment = function(payment) {

        if (payment === null) {
            return $q.when();
        }
        var d = $q.defer();

        MobileService.request({
            method: 'POST',
            url: '/cart/payment',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            params: {
                zip: Account.getZipCode()
            },
            data: payment
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*  Submit Cart Order */
    var submitOrder = function(order) {

        var d = $q.defer();
        var option = {
            method: 'POST',
            url: '/cart/confirm',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            params: {
                zip: Account.getZipCode()
            }
        };

        if (order) {
            option.data = order;
        }

        MobileService.request(option).then(function(response) {
            d.resolve(response);

        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };


    var clear = function(){

        checkout = null;

        if (!MobileService.getSessionUserName()) {
            //  guest cart submitted, be sure to clear it
            localStorage.removeItem('stpls.guest.cart');
        }
    };

    return {
        updateShippingAddress: updateShippingAddress,
        updateBillingAddress: updateBillingAddress,
        getShippingAddress: getShippingAddress,
        cartPreCheckout: cartPreCheckout,
        cartTaxCalc: cartTaxCalc,
        updatePayment: updatePayment,
        submitOrder: submitOrder,

        getInfo: getInfo,
        setInfo: setInfo,
        kountCollect: kountCollect,

        clear: clear
    };

});