'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Locator
 */
angular.module('stpls').factory('Locator', function($http, $rootScope, $location, $q, $timeout, $cookies, $translate, Device, Config, MobileService, Profile) {

    var sessionGeo = false;
    var sessionResultCache = {};
    var feature_images = {};

    /*  Get the store features */
    var storeFeatures = Config.getProperty('store_features');

    angular.forEach(storeFeatures, function(feature) {
        feature_images[feature.name] = feature.image;
    });

    var featureImageForCode = function(code) {
        return feature_images[code];
    };

    var checkForSessionResult = function(addr) {

        if (sessionResultCache[addr] !== undefined) {
            return sessionResultCache[addr];

        } else {
            return false;
        }
    };

    var setSessionResult = function(addr, result) {
        sessionResultCache[addr] = result;
    };

    var setSessionGeo = function(geo) {
       sessionGeo = geo;
       var store = getRememberedStore();
        if (!store) {
            //  Reset nearest store in Store Banner
            $timeout(function() { // - defer to free thread
              var result = getStoresFromLatLong(sessionGeo.lat, sessionGeo.lon, 40, 1, 0);
              result.then(function(store) {
                store = store[0];
                $rootScope.$broadcast('nearestStoreChanged', {
                    selStore: store
                });
              }, function(error) {
                  store = undefined;
              });
            }, 100);
        }
    };

    var getStoreByNumber = function(storeNum) {

        var d = $q.defer();

        MobileService.request({
            url: '/store',
            method: 'GET',
            cache: true,
            params: {
                storeNumber: storeNum
            }
        }).then(function(response) {
          var store = ((response.data && response.data.store_results && response.data.store_results.store) || []).shift();
          if (store) {
            d.resolve(store);
          } else {
            d.reject();
          }
        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    var getStoresFromLatLong = function(la, lo, r, l, o) {

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/storeGeoSearch',
            cache: true,
            params: {
                latitude: parseFloat(la).toPrecision(5),
                longitude: parseFloat(lo).toPrecision(5),
                radius: r,
                offset: o,
                limit: l
            }
        }).then(function(response) {
            d.resolve(response.data.store_results.store);
        });

        return d.promise;
    };

    var hasGeoEnabled = function() {
        return navigator.geolocation !== undefined;
    };

    var setRememberedStoreByNumber = function(storeNum) {

        getStoreByNumber(storeNum).then(function(response) {
           var store = response;
           var checked = false;
           setRememberedStore(store);

        }, function(error) {
            console.log ('error setting store.');
        })['finally'](function() {

        });
    };

    var setRememberedStore = function(store) {
        var storeNum = '';
        if (store) {
            storeNum = store.store_number;
        }

        try {
           localStorage.setItem('stpls.locator.remembered_store', JSON.stringify(store));
        } catch (ex) {
           console.log ('error saving user store.');
        }
    };

    var getRememberedStore = function() {

        try {
            var store = localStorage.getItem('stpls.locator.remembered_store');

            if (store !== null) {
                return JSON.parse(store);
            } else {
                return false;
            }

        } catch (e) {
            return false;
        }
    };

    var isRememberedStore = function(store) {

        var remStore = getRememberedStore();
        if (remStore) {
            return remStore.store_number === store.store_number;

        } else {
            return false;
        }
    };

    var getGeo = function() {

        var d = $q.defer();

        if (sessionGeo) {
            d.resolve(sessionGeo);

        } else if ($location.search()._geo === 'false') {
          d.reject('override');
        } else {
            navigator.geolocation.getCurrentPosition(function(position) {

                setSessionGeo({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
                d.resolve(sessionGeo);

            }, function() {

                $translate('LCR_NO_GEO_TEXT').then(function(translation) {

                    d.reject(translation);
                });

            }, {
                timeout: 31000,
                enableHighAccuracy: false,
                maximumAge: 90000
            });
        }

        return d.promise;
    };

    var getStoresByGeo = function(radius, limit, offset) {

        var d = $q.defer();

        var sResult = checkForSessionResult('geo');

        if (sResult) {
            d.resolve(sResult);

        } else {
            getGeo().then(function(position) {

                var stores = getStoresFromLatLong(position.lat, position.lon, radius, 100, 0);
                stores.then(function(data) {
                    if (data.length > 0) {
                        setSessionResult('geo', data);
                        d.resolve(data, position.lat, position.lon);

                    } else {

                        $translate('LCR_ERROR_STR').then(function(translation) {
                            d.reject(translation);
                        });
                    }
                }, function() {

                    $translate('LCR_ERROR_STR').then(function(translation) {
                        d.reject(translation);
                    });
                });
            }, function() {

                $translate('LCR_NO_GEO_TEXT').then(function(translation) {
                    d.reject(translation);
                });
            });
        }

        return d.promise;
    };

    var getStoresByAddr = function(addr, radius) {

        var d = $q.defer();

        if (!addr) {
            $translate('LCR_ERROR_STR').then(function(translation) {
                d.reject(translation);
            });
        }

        // Check for existing results
        if (checkForSessionResult(addr)) {

            d.resolve(checkForSessionResult(addr));

        } else {

            MobileService.request({
                method: 'GET',
                url: '/storeSearch',
                cache: true,
                params: {
                    radius: radius || 20,
                    address: addr
                }
            }).then(function(response) {

                var data;
                // One store returned
                if (response.data.store_results !== undefined && response.data.store_results.store !== undefined) {
                    data = response.data.store_results.store;
                }

                setSessionResult(addr, data);
                d.resolve(data);

            }, function() {
                $translate('LCR_ERROR_STR').then(function(translation) {
                    d.reject(translation);
                });
            });
        }

        return d.promise;
    };

    var getStoresFromExistingLatLong = function(radius, limit, offset) {

        var d = $q.defer();

        if (!sessionGeo) {
            $translate('LCR_ERROR_STR').then(function(translation) {

                d.reject(translation);

            });
        }

        var results = getStoresFromLatLong(sessionGeo.lat, sessionGeo.lon, radius, limit, offset);
        results.then(function(stores) {
            d.resolve(stores);

        }, function() {

            $translate('LCR_NO_STORES').then(function(translation) {
                d.reject(translation);
            });

        });

        return d.promise;
    };

    var getExistingLatLong = function() {

        var d = $q.defer();

        // If geo disabled
        if (!hasGeoEnabled()) {
            d.resolve(false);
        }
        // Geo already found
        else if (sessionGeo) {
            d.resolve(sessionGeo);

        } else {
            navigator.geolocation.getCurrentPosition(function(position) {

                sessionGeo = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };

                console.log(sessionGeo);
                d.resolve(sessionGeo);
            }, function() {
                $translate('LCR_NO_GEO_TEXT').then(function(translation) {
                    d.reject(translation);
                });

            });
        }

        return d.promise;
    };

    var getHoursDisplay = function(store, myStore) {

        var todaysDate = new Date();
        var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var todayDay = days[todaysDate.getDay()].toLowerCase();

        var hours = $translate.instant('LCR_CLOSED');
        var todaysHours;

        //  Find today's hours in the store hours array
        for (var i = 0; i < store.storeHours.length; i++) {
            var storeDay = store.storeHours[i];
            if (storeDay.dayName.toLowerCase() === todayDay) {
                todaysHours = storeDay.hours;
                break;
            }
        }

        if (todaysHours) {
            //  Split the hours into 'open' and 'close'
            var times = todaysHours.split('-');

            //  get Open Hours
            var open = times[0];
            open = open.replace(new RegExp(':', 'g'), '.');
            var openAsNum;
            if (open.indexOf('PM') > 0) {
                open = open.replace(new RegExp('PM', 'g'), '');
                openAsNum = parseInt (open);
                openAsNum += 12;
            } else {
                open = open.replace(new RegExp('AM', 'g'), '');
                openAsNum = parseInt (open);
            }

            //  get Close Hours
            var close = times[1];
            close = close.replace(new RegExp(':', 'g'), '.');
            var closeAsNum;
            if (close.indexOf('PM') > 0) {
                close = close.replace(new RegExp('PM', 'g'), '');
                closeAsNum = parseInt (close);
                closeAsNum += 12;
            } else {
                close = close.replace(new RegExp('AM', 'g'), '');
                closeAsNum = parseInt (close);
            }

            //  Is the store open right now?
            if (!isStoreOpen(todaysDate, openAsNum, closeAsNum)) {
                hours = $translate.instant('LCR_CLOSED');
            } else if (myStore) {
                hours = $translate.instant('LCR_OPEN_UNTIL') +
                close.replace(new RegExp('.00', 'g'), '') + 'PM'; // TODO: fix the unit
            } else {
                hours = $translate.instant('LCR_OPEN') +
                open.replace(new RegExp('.00', 'g'), '') + " - " +
                close.replace(new RegExp('.00', 'g'), '');
            }
        }

        return hours;
    };

    var isStoreOpen = function(todaysDate, openTime, closeTime) {

        var startDate = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate(), openTime.toString());
        var endDate   = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate(), closeTime.toString());

        if (startDate > todaysDate || endDate < todaysDate) {
            return false;
        } else {
            return true;
        }
    };

    return {
        featureImageForCode: featureImageForCode,
        getGeo: getGeo,
        getStoreByNumber: getStoreByNumber,
        getStoresByAddr: getStoresByAddr,
        getExistingLatLong: getExistingLatLong,
        getStoresFromExistingLatLong: getStoresFromExistingLatLong,
        getHoursDisplay: getHoursDisplay,
        getStoresByGeo: getStoresByGeo,
        setRememberedStore: setRememberedStore,
        setRememberedStoreByNumber: setRememberedStoreByNumber,
        getRememberedStore: getRememberedStore,
        isRememberedStore: isRememberedStore,
        hasGeoEnabled: hasGeoEnabled
    };

});
