'use strict';

/**
 * @ngdoc function
 * @name stpls.model:ApplePayService
 */
angular.module ('stpls').factory ('ApplePayService', function ($rootScope, $http, $q, MobileService) {

    var processApplePayPayment = function (shippingData, billingData, paymentData) {

        var d = $q.defer ();

        var dataRequest = {
            encryptedPayment : paymentData.cardData,
        };

        if (shippingData) {
            dataRequest.deliveryFirstName = shippingData.deliveryFirstName;
            dataRequest.deliveryLastName = shippingData.deliveryLastName;
            dataRequest.deliveryAddress1 = shippingData.deliveryAddress1;
            dataRequest.deliveryAddress2 = shippingData.deliveryAddress2;
            dataRequest.deliveryCity = shippingData.deliveryCity;
            dataRequest.deliveryState = shippingData.deliveryState;
            dataRequest.deliveryZipCode = shippingData.deliveryZipCode;
            dataRequest.deliveryPhone = shippingData.deliveryPhone;
            dataRequest.deliveryPhoneExtension = shippingData.deliveryPhoneExtension;
            dataRequest.deliveryLocation = shippingData.deliveryLocation;
            dataRequest.emailAddress = shippingData.email;
            dataRequest.reenterEmailAddress = shippingData.email;
        }

        if (billingData) {
            dataRequest.billingFirstName = billingData.billingFirstName;
            dataRequest.billingLastName = billingData.billingLastName;
            dataRequest.billingAddress1 = billingData.billingAddress1;
            dataRequest.billingCity = billingData.billingCity;
            dataRequest.billingState = billingData.billingState;
            dataRequest.billingZipCode = billingData.billingZipCode;
            dataRequest.billingPhone = billingData.billingPhone;
        }

        MobileService.request ({
            method : 'POST',
            url : '/cart/processPayment/ApplePay?submitOrder=Y',
            headers : {
                'content-type' : 'application/json'
            },
            dataType : 'json',
            cache : false,
            data : dataRequest

        }).then (function (response) {
            d.resolve (response);

        }, function (error) {
            console.log ('error received from /cart/processPayment/ApplePay', JSON.stringify (error));
            d.reject (error);
        });

        return d.promise;
    };

    var validateMerchantWithApple = function (url, merchantId, domain, display) {

        var d = $q.defer ();

        MobileService.request ({
            method : 'POST',
            url : '/applepay/session',
            headers : {
                'content-type' : 'application/json'
            },
            dataType : 'json',
            cache : false,
            data : {
                'url' : url,
                'merchantIdentifier' : merchantId,
                'domainName' : domain,
                'displayName' : display
            }

        }).then (function (response) {
            d.resolve (response);

        }, function (error) {
            console.log ('error received from /applepay/session', error);
            d.reject (error);
        });

        return d.promise;
    };

    return {
        validateMerchantWithApple : validateMerchantWithApple,
        processApplePayPayment : processApplePayPayment
    };

});
