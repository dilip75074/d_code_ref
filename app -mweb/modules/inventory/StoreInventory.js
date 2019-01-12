'use strict';

/**
 * @ngdoc function
 * @name stpls.model:StoreInventory
 */
angular.module('stpls').factory('StoreInventory', function($q, MobileService, Locator) {

    var getInventoryFromStoreRadius = function(zipCode, productSku) {

        var d = $q.defer();

        //  Using passed store as the center point,
        //  look for stores in a 20-mile radius that have inventory for
        //  the passed sku
        MobileService.request({
            method: 'GET',
            url: '/stores/inventory',
            cache: false,
            params: {
                "sku": productSku,
                "zip": zipCode,
                "limit": 20,
                "offset": 1,
                "radius": 20
            }
        }).then(function(response) {
            if (response.data.Store != undefined) {
                var stores = response.data.Store;
                d.resolve(stores);
            } else if (response) {
                d.reject(response);
            }
        }, function(error) {
            console.log('error getting stores for sku', error);
            d.reject(error);
        });

        return d.promise;
    };

    return {
        getInventoryFromStoreRadius : getInventoryFromStoreRadius
     };

});

