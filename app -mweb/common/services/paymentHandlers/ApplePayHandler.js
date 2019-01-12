'use strict';

/**
 * @ngdoc function
 * @name stpls.model:ApplePayHandler
 */
angular.module('stpls').factory('ApplePayHandler', function($q, $rootScope, $state, $ocLazyLoad, $translate, $http, MobileService, Config, Checkout, Cart, ApplePayService) {

    var config,
        aplConfig;
    var checkoutError;
    var checkoutWarn;
    var total = [];
    var lineitems = [];
    var paymentRequest;
    var saveShipMethod;
    var shipToStore_Store;
    var states = ['AL','AZ','AR','CA','CO','CT','DE','DC','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME',
    'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH',
    'OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];


    //  This will get sent to
    //  order confirmation
    var checkoutData = {
        cart : null,
        ccType : false,
        sessionUser : '',
        couponRewardsTotal : 0.00,
        handling : 0.00,
        orderTotal : 0.00,
        pretaxTotal : 0.00,
        shippingFee : 0.00,
        subtotal : 0.00,
        tax : 0.00,
        orderId : '',
        staplesOrderNum : '',
        shipName : '',
        shipAddr : '',
        eMailAddr : '',
        shippingName : '',
        shippingPhone : '',
        shipping : {
            address : '',
            id : '',
            addressLine1 : '', //  need detail too
            addressLine2 : '', //  need detail too
            city : '', //  need detail too
            state : '', //  need detail too
            zip : '' //  need detail too
        },
        billing : {
            name : '',
            address : '',
            phone : '',
            id : '',
            addressLine1 : '', //  need detail too
            addressLine2 : '', //  need detail too
            city : '', //  need detail too
            state : '', //  need detail too
            zip : '' //  need detail too
        },
        card : {
            cardArt : '',
            number : '',
            expiry : null,
            cvc : '',
            type : '',
            notes : '',
            id : ''
        },
        useShipAsBill : true,
        addressMode : '1',
        pickupName : '',
        pickupPhone : ''
    };

    //  Is Apple Pay available on the device,
    //  And has user setup a payment,
    //  And SkyNet has enabled Apple Pay in the app
    var isApplePayAvailable = function() {
        var d = $q.defer();

        try {
            if (window.ApplePaySession && window.ApplePaySession.supportsVersion(version()) && enabled()) {
                var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantId());
                promise.then(function(canMakePayments) {
                    d.resolve(canMakePayments);
                });
            } else {
                d.resolve(false);
            }
        } catch(ex) {
            d.resolve(false);
        }

        return d.promise;
    };

    var applePaySelected = function(amountIn, showShipTo, shipMethod, shipToStore) {
        //  shippingType: ['shipping', 'storePickup']
        checkoutData.cart = Cart.getThisCart();

        shipToStore_Store = shipToStore;
        //  Create payment request
        paymentRequest = {
            currencyCode : currencyCode(),
            countryCode : countryCode(),
            total : {
                label : $translate.instant('PAY_STPLS_LABEL'),
                amount : amountIn
            },
            supportedNetworks : payNetworks(),
            merchantCapabilities : merchantCapabilities(),
            requiredShippingContactFields : ['postalAddress', 'phone', 'email', 'name'],
            requiredBillingContactFields : ['postalAddress', 'phone', 'name'],
            shippingType : 'shipping',
            applicationData : '8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92'
        };

        saveShipMethod = shipMethod;

        //  Create Apple Pay session
        var session = new ApplePaySession(version(), paymentRequest);

        session.oncancel = function(event) {
        };

        session.onvalidatemerchant = function(event) {
            if (event && event.validationURL) {
                ApplePayService.validateMerchantWithApple(event.validationURL, merchantId(), domain(), 'Staples.com').then(function(response) {

                    session.completeMerchantValidation(response.data);

                }, function(error) {

                });
            }
        };

        session.onpaymentauthorized = function(event) {

            var paymentData = event.payment.token.paymentData;
            var paymentMethod = event.payment.token.paymentMethod;
            var shippingContact = event.payment.shippingContact;

            var phone_asNumber;
            if (shippingContact.phoneNumber) {
                phone_asNumber = parsePhoneNumber(shippingContact.phoneNumber);
            }

            if (phone_asNumber.length < 10 || phone_asNumber.length > 10) {
                session.completePayment(ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT);
                return;
            }

            var billingContact = event.payment.billingContact;
            billingContact.administrativeArea = billingContact.administrativeArea.toUpperCase();
            if (billingContact.locality === '')  {
                session.completePayment(ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS);
                return;
            }
            if (states.indexOf(billingContact.administrativeArea) < 0) {
                session.completePayment(ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS);
                return;
            }

            var shippingData = createShippingData (shippingContact);
            var xtraShippingData = {
                deliveryFirstName : shippingContact.givenName,
                deliveryLastName : shippingContact.familyName,
                deliveryCompanyName : '',
                deliveryPhone : phone_asNumber,
                deliveryPhoneExtension : '',
                email : shippingContact.emailAddress,
                deliveryAddress1 : shippingContact.addressLines[0],
                deliveryCity : shippingContact.locality,
                deliveryState : shippingContact.administrativeArea,
                deliveryZipCode : shippingContact.postalCode
            };
            //  Save confirmation data
            checkoutData.shipName = shippingContact.givenName + ' ' +  shippingContact.familyName;
            checkoutData.shipAddr = shippingContact.addressLines[0] + ', ' + shippingContact.locality
                + ', ' + shippingContact.administrativeArea
                + ', ' + shippingContact.postalCode;
            checkoutData.eMailAddr = shippingContact.emailAddress;
            checkoutData.shippingName = checkoutData.shipName;
            checkoutData.shippingPhone = phone_asNumber;
            checkoutData.shipping.address = checkoutData.shipAddr;
            checkoutData.shipping.addressLine1 = shippingContact.addressLines[0];
            if (shippingContact.addressLines.length > 1) {
                checkoutData.shipping.addressLine2 = shippingContact.addressLines[1];
            } else {
                checkoutData.shipping.addressLine2 = '';
            }
            checkoutData.shipping.city = shippingContact.locality;
            checkoutData.shipping.state = shippingContact.administrativeArea;
            checkoutData.shipping.zip = shippingContact.postalCodes;

            var billingData = {
                billingFirstName : billingContact.givenName,
                billingLastName : billingContact.familyName,
                billingCompanyName : '',
                billingAddress1 : billingContact.addressLines[0],
                billingCity : billingContact.locality,
                billingState : billingContact.administrativeArea,
                billingZipCode : billingContact.postalCode,
                billingPhone : phone_asNumber,
            };

            //  Save confirmation data
            checkoutData.billing.name = billingContact.givenName + ' ' +  billingContact.familyName;
            checkoutData.billing.address = billingData.billingAddress1 + ', ' + billingData.billingCity + ', '  + billingData.billingState
                + ', ' + billingData.billingZipCode;
            checkoutData.billing.phone = phone_asNumber;
            checkoutData.billing.addressLine1 = billingData.billingAddress1;
            checkoutData.billing.addressLine2 = '';
            checkoutData.billing.city = billingData.billingCity;
            checkoutData.billing.state = billingData.billingState;
            checkoutData.billing.zip = billingData.billingZipCode;

            var paymentDataParam = {
                cardType : paymentMethod.network,
                cardDisplay : paymentMethod.displayname,
                cardData : paymentData
            };

            //  Save confirmation data
            checkoutData.card.number = paymentDataParam.cardDisplay;

            if (saveShipMethod !== 'STA') {

                handleBopisorSTSOrder(session, shippingData, xtraShippingData, billingData, paymentDataParam);

            } else {

                ApplePayService.processApplePayPayment(shippingData, billingData, paymentDataParam).then(function(response) {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);

                    //  For Analytics
                    checkoutData.ccType = 'ApplePay';

                    //  Show Order Confirmation
                    checkoutData.staplesOrderNum = response.data.staplesOrderNumber;
                    checkoutData.orderId = response.data.orderId;
                    Checkout.setInfo(checkoutData);
                    $rootScope.setCartCount(0);
                    $rootScope.toRoute('confirmorder');

                }, function(error) {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                    $rootScope.$broadcast('applePayError', {
                        errorMsg: $translate.instant('ADR_DELETE_ERROR')
                    });
                });
            }
        };

        session.onpaymentmethodselected = function(event) {
            var myPaymentMethod = event.paymentMethod;
            var displayName = event.paymentMethod.displayName;
            var network = event.paymentMethod.network;
            if (total.length === 0) {
                total = paymentRequest.total;
            }
            session.completePaymentMethodSelection(total, lineitems);
        };

        session.onshippingcontactselected = function(event) {
            var myShippingContact = event.shippingContact;

            total = [];
            lineitems = [];
            if (myShippingContact.country === 'United States') {
                myShippingContact.country = 'USA';
            }
            myShippingContact.administrativeArea = myShippingContact.administrativeArea.toUpperCase();
            checkoutError = null;
            checkoutWarn = null;

            if (myShippingContact.country !== 'USA') {
                session.completeShippingContactSelection(ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS, [], paymentRequest.total, lineitems);
                return;
            }
            if (myShippingContact.locality === '')  {
                session.completeShippingContactSelection(ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS, [], paymentRequest.total, lineitems);
                return;
            }
            if (states.indexOf(myShippingContact.administrativeArea) < 0) {
               session.completeShippingContactSelection(ApplePaySession.STATUS_INVALID_SHIPPING_POSTAL_ADDRESS, [], paymentRequest.total, lineitems);
               return;
            }

            var phone_asNumber;
            if (myShippingContact.phoneNumber) {
                phone_asNumber = parsePhoneNumber(myShippingContact.phoneNumber);
                if (phone_asNumber.length < 10 || phone_asNumber.length > 10) {
                    session.completeShippingContactSelection(ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT, [], paymentRequest.total, lineitems);
                    return;
                }
            }

            ///////////////////////////////////
            //  PRE-CHECKOUT
            ///////////////////////////////////
            var parameters = {
                'shipToCity' : myShippingContact.locality,
                'shipToState' : myShippingContact.administrativeArea,
                'shipToZip' : myShippingContact.postalCode,
                'shipToCountry' : myShippingContact.country,
                'paymentType' : 'APPLEPAY'
            };

            Checkout.cartPreCheckout(parameters).then(function(response) {
                if (response && response.data) {
                    if (response.data.InventoryCheckAlert) {
                        checkoutWarn = response.data.InventoryCheckAlert;
                    }

                    var tax = '0.00';
                    var shipping = '0.00';
                    var couponTotal = '0.00';
                    var subtotal = '0.00';
                    var orderTotal = '0.00';
                    if (response.data.tax) {
                        checkoutData.tax = Number(response.data.tax).toFixed(2);
                        tax = checkoutData.tax.toString();
                    }
                    if (response.data.handling) {
                        checkoutData.handling = Number(response.data.handling).toFixed(2);
                        var handling = checkoutData.handling.toString();
                    }
                    if (response.data.shipping) {
                        checkoutData.shippingFee = Number(response.data.shipping).toFixed(2);
                        shipping = checkoutData.shippingFee.toString();
                    }

                    var couponNum = 0.00;
                    if (response.data.couponTotal) {
                        couponNum = Number(response.data.couponTotal);
                    }
                    if (response.data.rewardsTotal) {
                        var rewardsNum = Number(response.data.rewardsTotal);
                        couponNum += rewardsNum;
                    }
                    checkoutData.couponRewardsTotal = Number(couponNum).toFixed(2);
                    couponTotal = checkoutData.couponRewardsTotal.toString();

                    if (response.data.pretaxTotal) {
                        checkoutData.pretaxTotal = Number(response.data.pretaxTotal).toFixed(2);
                    }
                    if (response.data.orderTotal) {
                        checkoutData.orderTotal = Number(response.data.orderTotal).toFixed(2);
                        orderTotal = checkoutData.orderTotal.toString();
                    }
                    if (response.data.subtotal) {
                        checkoutData.subtotal = Number(response.data.subtotal).toFixed(2);
                        subtotal = checkoutData.subtotal.toString();
                    }

                    if (!checkoutError) {
                        total = { label : $translate.instant('PAY_STPLS_LABEL'), amount : orderTotal };

                        var item = { label : $translate.instant('CHK_SUB'), amount : subtotal };
                        lineitems.push(item);

                        item = { label : $translate.instant('CHK_COUPON_TOTAL'), amount : couponTotal };
                        if (couponTotal !== '0' && couponTotal !== '0.00' & couponTotal !== '.00') {
                            lineitems.push(item);
                        }

                        item = { label : $translate.instant('CHK_TAX'), amount : tax };
                        if (tax !== '0' && tax !== '0.00' & tax !== '.00') {
                            lineitems.push(item);
                        }

                        item = { label : $translate.instant('CHK_SHIPPING_TOTAL'), amount : shipping };
                        if (shipping !== '0.0' && shipping !== '0' && shipping !== '0.00' & shipping !== '.00') {
                            lineitems.push(item);
                        }
                        var shipMethods = [];
                        session.completeShippingContactSelection(ApplePaySession.STATUS_SUCCESS, shipMethods, total, lineitems);
                   } else {
                        session.completeShippingContactSelection(ApplePaySession.STATUS_FAILURE, shipMethods, total, lineitems);

                   }
                }
            }, function(error) {

            })['finally'](function() {
            });

            if (checkoutError) {
                $rootScope.$broadcast('applePayError', {
                    errorMsg: checkoutError
                });
                session.abort();
            }
        };

        session.onshippingmethodselected = function(event) {
            //  this shouldn't happen because we don't let user choose
            var myShippingMethod = event.shippingMethod;
        };

        session.begin();
    };

    var handleBopisorSTSOrder = function(session, shippingData, xtraShippingData, billingData, paymentDataParam) {

        ///////////////////////////////////
        //  SHIPPING ADDRESS UPDATE
        ///////////////////////////////////
        Checkout.updateShippingAddress (shippingData).then (function (response) {

            return Checkout.updateBillingAddress (billingData);

        }).then (function (response) {
            //////////////////////////////
            //  SUBMIT ORDER
            //////////////////////////////
            return ApplePayService.processApplePayPayment(xtraShippingData, billingData, paymentDataParam);

        }).then (function (response) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);

            //  For Analytics
            checkoutData.ccType = 'ApplePay';

            //  Show Order Confirmation
            checkoutData.staplesOrderNum = response.data.staplesOrderNumber;
            checkoutData.orderId = response.data.orderId;
            Checkout.setInfo(checkoutData);
            $rootScope.setCartCount(0);
            $rootScope.toRoute('confirmorder');

        }).catch (function (error) {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
             $rootScope.$broadcast('applePayError', {
                 errorMsg: $translate.instant('ADR_DELETE_ERROR')
             });

        });
    };

    var createShippingData = function(shippingContact) {

        var shippingData;

        var addressLine2 = '';
        if (shippingContact.addressLines.length > 1) {
            addressLine2 = shippingContact.addressLines[1];
        }

        var phone_asNumber;
        if (shippingContact.phoneNumber) {
            phone_asNumber = parsePhoneNumber(shippingContact.phoneNumber);
        }

        if (saveShipMethod === 'ISP') {  //  BOPIS
            shippingData = {
                deliveryLocation : 'pickUpInStore',
                emailAddress : shippingContact.emailAddress,
                reenterEmailAddress : shippingContact.emailAddress,
                pickupContactFirstName : shippingContact.givenName,
                pickupContactLastName : shippingContact.familyName,
                pickupContactPhoneNumber : phone_asNumber
            };
        } else if (saveShipMethod === 'STS') {  //  SHIP-TO-STORE (NOT SUPPORTED RIGHT NOW)
            shippingData = {
                deliveryLocation : 'shiptostore',
                shipToStoreFirstName : shippingContact.givenName,
                shipToStoreLastName : shippingContact.familyName,
                shipToStorePhone : phone_asNumber,
                shipToStoreAddress1 : shipToStore_Store.address,
                shipToStoreCity : shipToStore_Store.city,
                shipToStoreState : shipToStore_Store.state,
                shipToStoreZipCode : shipToStore_Store.zipCode,
                shipToStoreNumber : shipToStore_Store.storeNumber,
                emailAddress : shippingContact.emailAddress,
                reenterEmailAddress : shippingContact.emailAddress
            };
        } else {
            shippingData = {
                deliveryLocation : 'shiptohome',
                deliveryFirstName : shippingContact.givenName,
                deliveryLastName : shippingContact.familyName,
                deliveryCompanyName : '',
                deliveryPhone : phone_asNumber,
                deliveryPhoneExtension : '',
                email : shippingContact.emailAddress,
                deliveryAddress1 : shippingContact.addressLines[0],
                deliveryAddress2 : addressLine2,
                deliveryCity : shippingContact.locality,
                deliveryState : shippingContact.administrativeArea,
                deliveryZipCode : shippingContact.postalCode
            };
        }
        return shippingData;
    };


    var parsePhoneNumber = function(phoneIn) {
        var phoneNum;
        var hasUSCountryCode = phoneIn.indexOf('+1');
        if (hasUSCountryCode >= 0) {
            phoneNum = phoneIn.replace('+1', '');
        } else {
            phoneNum = phoneIn;
        }
        return phoneNum.replace(/[^0-9]/g, '');
    };

    var version = function() {
        if (!config) {
            var aplConfig = Config.getProperty('applepay');
            var env = Config.getEnvironment();
            config = aplConfig[env] || aplConfig['default'];
        }
        return config.version;
    };

    var merchantId = function() {
        if (!aplConfig) {
            aplConfig = Config.getProperty('applepay');
        }
        return aplConfig.merchantId;
    };

    var enabled = function() {
        if (!config) {
            var aplConfig = Config.getProperty('applepay');
            var env = Config.getEnvironment();
            config = aplConfig[env] || aplConfig['default'];
        }
        return config.enabled;
    };

    var domain = function() {
        if (!config) {
            var aplConfig = Config.getProperty('applepay');
            var env = Config.getEnvironment();
            config = aplConfig[env] || aplConfig['default'];
        }
        return config.domain;
    };

    var payNetworks = function() {
        if (!config) {
            var aplConfig = Config.getProperty('applepay');
            var env = Config.getEnvironment();
            config = aplConfig[env] || aplConfig['default'];
        }
        return config.payNetworks;
    };

    var currencyCode = function() {
        if (!aplConfig) {
            aplConfig = Config.getProperty('applepay');
        }
        return aplConfig.currencyCode;
    };

    var countryCode = function() {
        if (!aplConfig) {
            aplConfig = Config.getProperty('applepay');
        }
        return aplConfig.countryCode;
    };

    var merchantCapabilities = function() {
        if (!aplConfig) {
            aplConfig = Config.getProperty('applepay');
        }
        return aplConfig.merchantCapabilities;
    };

    return {
        isApplePayAvailable : isApplePayAvailable,
        applePaySelected : applePaySelected
    };

});

