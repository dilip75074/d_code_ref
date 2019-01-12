'use strict';

/**
 * @ngdoc function
 * @name stpls.model:ShippingConfig
 */
angular.module('stpls').factory('ShippingConfig', function($q, Config, Profile, MobileService) {
    var bitFlags = {
        bitFreeShipping: 0x1,
        bitBopis: 0x2,
        bitAddOn: 0x4,
        bitHeavyWeight:  0x8,
        bitRetailOnly: 0x10
    };

    var initialized;

    var config = Config.getProperty('shippingConfig');
    var env = Config.getEnvironment();
    var defaultConfig = config[env] || config['default'];

    var guestConfig = false;
    var registerUserConfig = false;

    var getShippingConfig = function() {
        var res;
        if (MobileService.getSessionUserName()) {
            // Register user without rewards account, fallback to guest account
            res = registerUserConfig || guestConfig;
        } else {
            res = guestConfig;
        }
        return res || defaultConfig;
    };

    var ensureGuestConfig = function () {
        if (guestConfig) {
            return;
        }
        shippingConfig('GUS').then(function(response){
            guestConfig = response;
        }).catch(function(error) {
            guestConfig = defaultConfig;
        });
    };

    var ensureRegisterUserConfig = function () {
        if (MobileService.getSessionUserName()) {
            getCustomerTier().then(function(customerTier){
                return customerTier;
            }).then(function(customerTier) {
                return shippingConfig(customerTier);
            }).then(function(config) {
                registerUserConfig = config;
            }).catch(function(error) {
                // Register user without rewards account, fallback to guest account
                ensureGuestConfig();
            });
        }
    };

    var init = function() {
        if (MobileService.getSessionUserName()) {
            ensureRegisterUserConfig();
        } else {
            ensureGuestConfig();
        }

        initialized = true;
    };

    var getCustomerTier = function() {

        var d = $q.defer();
        var p;
        if (initialized) {
            p = Profile.getProfile();
        } else {
            // Avoid duplicated call in pageCtrl's Profile.init()
            p = Profile.profileAgg(true);
        }

        p.then(function(profile){
            var customerTier = profile.customerTier;
            if (customerTier) {
                d.resolve(customerTier);
            } else {
                d.reject();
            }
        }, function(error){
            console.log('error getting profile', error);
            d.reject(error);
        });

        return d.promise;
    };

    var shippingConfig = function(tier) {

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/shippingconfig/user',
            dataType: 'json',
            params: {
                tier: tier,
                customerchannel: defaultConfig.channel
            },
            cache: true
        }).then(function(response){
            var config;
            if (response.data[0]) {
                config = response.data[0];
            } else {
                config = response.data;
            }
            if (!config) {
               d.reject('unable to obtain shipping config from response.');
               return;
            }
            var result = {
                addOnBasketSize: Number(config.minimumBasketSizeForAddOnItem),
                heavyWeightShipCharge: Number(config.shipChargeForHeavyWeightSkus),
                baseShippingCharge: Number(config.baseShippingCharge)
            };
            d.resolve(result);

        }, function(error){
            console.log('error getting guest shipping config', error);
            d.reject(error);

        });

        return d.promise;
    };

    var getShippingBitFlags = function() {
        return bitFlags;
    };

    init();

    return {
        init: init,
        getShippingConfig: getShippingConfig,
        getShippingBitFlags: getShippingBitFlags
    };

});

