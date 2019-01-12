'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Personalization
 */
angular.module('stpls').factory('Personalization', function($q, $window, $cookies, $timeout, $rootScope, $interval, $ocLazyLoad, Config, Profile, MobileService) {

    var config = Config.getProperty("sparx");
    var appid = config.appid;
    var resxPageId;
    var tokenItem='eddiToken';
    var refreshTokenInterval = null;
    var eddiToken;
    var deviceIdItem='eddiDeviceId';
    var eddiDeviceId;

    // Get the resxPageId used by Certona for tracking purposes.
    function createResxPageId() {
        resxPageId = Math.floor(Math.random() * 1000000000000000) + '';
        var localDate = new Date();
        var year = localDate.getFullYear() + '';
        var month = (localDate.getMonth() + 1) + '';
        var day = localDate.getDate() + '';
        var hour = localDate.getHours() + '';

        resxPageId = 'res' + year.substring(2) + lpad(month,2) + lpad(day,2) + lpad(hour,2) + resxPageId;

        return resxPageId;
    }

    // Return the current resxPageId or create a new one if it doesn't exist
    function getResxPageId(){
        if(resxPageId){
            return resxPageId;
        }
        else {
            return createResxPageId();
        }
    }

    function lpad(input, length) {
        return (Array(length).join('0') + input).slice(-length);
    }

    var callMarvinAPI = function (option) {
        var schemeType = {
            trendingProduct: 'HOME_1',
            recommendedProduct: 'HOME_2',
            carredProducts: 'HOME_3',
            custUltimatelyBought: 'SKU_1',        //  SKU Page
            freqBoughtTogether: 'SKU_BUNDLE'      //  SKU Page
        };

        var d = $q.defer();
        var scheme = schemeType[option.type];

        var pageId = getResxPageId();
        var trackingId = $cookies.get('RES_TRACKINGID');

        if (eddiToken) {
            MobileService.request({
                method: 'GET',
                url: '/marvin',
                params: {
                    scheme: scheme,
                    appId: appid,
                    pageID: pageId,
                    context: option.context,
                    engine: 'SPARX',
                    trackingId: trackingId,
                    marvinVersion: 2,
                    EDDIE_CUSTOMER_TOKEN: eddiToken
                }
            }).then(function(response) {
                var products = response.data;
                d.resolve(products);

            }, function() {
                d.reject('No product found.');
            });
        } else {
            d.reject('Missing token.');
        }

        return d.promise;
    };

    function getSparxToken() {
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/sparx/get',
            params: {
                EDDIE_DEVICE_TOKEN: eddiDeviceId
            }
        }).then(function(response) {
            handleSparxSessionResponse(response);
            d.resolve();
        }, function() {
            d.reject();
        });

        return d.promise;
    }

    function ensureSparxSession(token) {
        var d = $q.defer();

        if (token) {
            MobileService.request({
                method: 'GET',
                url: '/sparx/ensure',
                params: {
                    EDDIE_DEVICE_TOKEN: eddiDeviceId,
                    EDDIE_CUSTOMER_TOKEN: token
                }
            }).then(function(response) {
                handleSparxSessionResponse(response);
                d.resolve();
            }, function() {
                eddiToken = false;
                $cookies.remove(tokenItem); // removed the bad token
                getSparxToken().then(function() {
                    d.resolve();
                }, function() {
                    d.reject();
                });
            });
        } else {
            console.log("Missing Sparx token");
            d.reject();
        }

        return d.promise;
    }

    function handleSparxSessionResponse(response) {
        var reply = (response.data || {}).reply;
        if (reply) {
            saveToken(reply['hog-session-token']);
            saveDeviceToken(reply['hog-device-tracker-id']);
        }
    }

    function saveDeviceToken(deviceId) {
        if (deviceId) {
            eddiDeviceId = deviceId;
            localStorage.setItem(deviceIdItem, deviceId);
        }
    }

    function getDeviceId(token) {
        eddiDeviceId = localStorage.getItem(deviceIdItem);
    }

    function saveToken(token) {
        if (token) {
            var notify = !eddiToken;
            eddiToken = token;
            $cookies.put(tokenItem, token);
            if (!refreshTokenInterval) {
                refreshTokenInterval = $interval(function() {
                    ensureSparxSession(eddiToken);
                }, 36e5); // one hour
            }

            if (notify) {
                $rootScope.$broadcast('callMarvin');
            }
        }
    }

    function getMarvinReady() {
        return !!eddiToken;
    }

    function getSession() {
        getDeviceId();
        var token = $cookies.get(tokenItem);
        if (token) {
            ensureSparxSession(token);
        } else {
            getSparxToken();
        }
    }

    function loadJs() {
        var analyticsJS = config.host.replace('{env}', config.env[$window.stpls_env]);
        $ocLazyLoad.load(analyticsJS).then(function(){
        }, function(error) {
            console.log("load sparx js failed");
        });
    }

    function init() {
        getSession();
        loadJs();
    }

    init();

    return {
        getMarvinReady: getMarvinReady,
        callMarvinAPI: callMarvinAPI
    };
});