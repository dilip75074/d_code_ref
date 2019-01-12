'use strict';

/**
 * @ngdoc function
 * @name stpls.model:VisaCheckout
 */
angular.module('stpls').factory('VisaCheckout', function($q, $rootScope, $state, $ocLazyLoad, MobileService, Config) {

    var visacheckoutSetting = false;
    var pendingPayment = false;
    var visaCheckoutMode = false;
    var hideVisaShippingAddress = false;
    var couponMessage = false;
    var vmeCouponKey = 'vmeCoupon';
    var callId = null;

    var onVmeReady = function() {

        // console.log('onVmeReady.');
        visacheckoutSetting.settings.shipping.collectShipping = hideVisaShippingAddress ? 'false' : 'true';
        V.init(visacheckoutSetting);

        V.on('payment.success', function(payment) {

            //console.log('Payment.Success: ', payment);

            processPaymentAndCheckout(payment);

        });

        V.on('payment.cancel', function (payment) {

            console.log("Payment canceled: ", payment);

        });

        V.on('payment.error', function (payment, error) {

            console.log("Payment error ", error  );
            showError();

        });
    };

    function processPaymentAndCheckout(payment) {

        pendingPayment = payment;
        $rootScope.$broadcast('continue.visaCheckout');
    }

    function processPayment() {

        console.log('Process Payment...');
        var payment = pendingPayment;
        pendingPayment = false;
        visaCheckoutMode = true;
        callId = payment.callid;

        var d = $q.defer();

        MobileService.request({
            method: 'POST',
            url: '/cart/processPayment/VME',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            data: {
                callId: payment.callid,
                encryptedKey: payment.encKey,
                encryptedPayment: payment.encPaymentData
            }
        }).then(function(response){
            d.resolve(response);

        }, function(error){
            d.reject(error);

        });

        return d.promise;
    }

    function showError() {

        var msgCart = "We can not process your payment using Visa Checkout at this time. Please continue using our Secure Checkout.";
        var msgCheckout = "We're sorry, we are unable to process V.me payments at this time, please try again later.";
        var msg = msgCart;
        if ($state.current.name == 'checkout') {
            msg = msgCheckout;
        }

        var gotoCart = function() {
            if ($state.current.name == 'checkout')
                $rootScope.toRoute('cart');
        };

        $rootScope.prompt({
            header: {
                close: true,
                title: 'Error'
            },
            message: msg,
            actions: {
                primary: {
                    title: 'OK',
                    callback: gotoCart
                }
            }
        });
    }

    var fileLoaded = false;

    var initVisaCheckout = function(hideShippingAddress) {

        if (typeof hideShippingAddress != 'undefined') {
            hideVisaShippingAddress = !!hideShippingAddress;
        }

        var d = $q.defer();
        if (fileLoaded) {
            initVisaCheckoutCore(d);
        }
        else {
            var config = Config.getProperty('visa_sdk_url');
            var env = Config.getEnvironment();
            var sdkUrl = config[env] || config['default'];

            $ocLazyLoad.load(sdkUrl).then(function(){
                fileLoaded = true;
                initVisaCheckoutCore(d);
            }, function(error) {
                d.reject(error);
            });
        }

        return d.promise;
    };

    function initializePayment() {

        console.log('initializePayment...');

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/cart/initialize/VME',
            dataType: 'json',
            cache: false
        }).then(function(response){
            d.resolve(response);

        }, function(error){
            d.reject(error);

        });

        return d.promise;
    }

    function initVisaCheckoutCore(d) {

        if (visacheckoutSetting && visacheckoutSetting.apikey) {
            onVmeReady();
            d.resolve({ data: true});
        }
        else {
            initializePayment().then(function(response){

                var s = response.data;
                visacheckoutSetting = {
                    apikey: s.apiKey,
                    externalProfileId: s.externalProfileId,
                    settings: {
                        dataLevel: s.dataLevel,
                        displayName: s.displayName,
                        shipping: {collectShipping: 'true'},
                        logoUrl: s.logoUrl,
                        review: {buttonAction: 'Continue'}},
                    countryCode: 'US',
                    websiteUrl: s.websiteUrl,
                    paymentRequest: {currencyCode: s.currencyCode}
                };

                onVmeReady();
                d.resolve({ data: true});
            }, function(error) {
                showError();
                d.reject(error);
            });
        }

    }

    function continueVisaCheckout() {
        return pendingPayment && pendingPayment.callid;
    }

    function setVisaCheckoutModeOff() {
        visaCheckoutMode = false;
    }

    function isVisaCheckoutModeEnabled() {
        return visaCheckoutMode || continueVisaCheckout() || getCoupon();
    }

    function saveCoupon(paymentInfo) {
        couponMessage = paymentInfo.couponMessage;
        localStorage.setItem(vmeCouponKey, couponMessage);
    }

    function removeCoupon() {
        couponMessage = false;
        localStorage.removeItem(vmeCouponKey);
    }

    function getCoupon() {
        if (!couponMessage) {
            couponMessage = localStorage.getItem(vmeCouponKey);
        }
        return couponMessage;
    }

    function clear() {
        callId = null;
        removeCoupon();
    }

    function getCallId() {
        return callId;
    }

    return {
        initVisaCheckout: initVisaCheckout,
        showError:showError,
        setVisaCheckoutModeOff: setVisaCheckoutModeOff,
        isVisaCheckoutModeEnabled: isVisaCheckoutModeEnabled,
        continueVisaCheckout : continueVisaCheckout,
        saveCoupon: saveCoupon,
        removeCoupon: removeCoupon,
        clear: clear,
        getCoupon: getCoupon,
        getCallId: getCallId,
        processPayment: processPayment
    };

});

