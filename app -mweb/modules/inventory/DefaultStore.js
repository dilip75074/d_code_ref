'use strict';

/**
 * @ngdoc function
 * @name stpls.model:DefaultStore
 */
angular.module('stpls').factory('DefaultStore', function($rootScope, $q, MobileService, StoreInventory) {

    //  Framingham is last resort store of choice
    var FRAMINGHAM = {
        address: '659 Worcester Rd.',
        city: 'Framingham',
        state: 'MA',
        phoneNumber: '5088203020',
        zip: '01701',
        distance: '',
        stockLevel: '',
        invQty: 0,
        storeNumber: '0349'
    };

    var defaultStore = {
        address: '',
        city: '',
        state: '',
        phoneNumber: '',
        zip: '',
        distance: '',
        stockLevel: '',
        invQty: 0,
        storeNumber: ''
    };

    var saveStore = function(store) {
        localStorage.setItem('defaultStore', JSON.stringify(store));
    };

    var saveStoreFromInv = function(store) {
        //  Store from Inventory system is different format,
        //  so convert it before saving it.
        var newStore = defaultStore;
        newStore.address = store.address;
        newStore.city = store.city;
        newStore.state = store.state;
        newStore.phoneNumber = store.phoneNumber;
        newStore.zip = store.postalCode;
        newStore.storeNumber = store.storeNumber;
        if (store.inventory[0]) {
            newStore.stockLevel = store.inventory[0].stockLevelMessage;
            newStore.invQty = store.inventory[0].quantity;
        }
        saveStore(newStore);
    };

    var saveStoreFromHeader = function(store) {
        //  Store from Header (Locator) is in different format,
        //  so convert it before saving it.
        var newStore = defaultStore;
        newStore.address = store.store_address.address_line1;
        newStore.city = store.store_address.city;
        newStore.state = store.store_address.state;
        newStore.phoneNumber = store.store_address.phone_number;
        newStore.zip = store.store_address.zip;
        newStore.storeNumber = store.store_number;
        saveStore(newStore);
    };

    //  When you don't know the format
    var saveGenericStore = function(store) {
        var newStore = defaultStore;

        if (store.store_address && store.store_address.address_line1) {
            newStore.address = store.store_address.address_line1;
        } else if (store.address) {
            newStore.address = store.address;
        }
        if (store.store_address && store.store_address.city) {
            newStore.city = store.store_address.city;
        } else if (store.city) {
            newStore.city = store.city;
        }
        if (store.store_address && store.store_address.state) {
            newStore.state = store.store_address.state;
        } else if (store.city) {
            newStore.state = store.state;
        }
        if (store.store_address && store.store_address.phone_number) {
            newStore.phoneNumber = store.store_address.phone_number;
        } else if (store.city) {
            newStore.phoneNumber = store.phoneNumber;
        }
        if (store.store_address && store.store_address.zip) {
            newStore.zip = store.store_address.zip;
        } else if (store.postalCode) {
            newStore.zip = store.postalCode;
        } else if (store.zipCode) {
            newStore.zip = store.zipCode;
        }

        if (store.store_number) {
            newStore.storeNumber = store.store_number;
        } else if (store.storeNumber) {
            newStore.storeNumber = store.storeNumber;
        }
        saveStore(newStore);
    };

    var getInventoryInStore = function(store, item) {
        if (!store) {
            return $q.when();
        }

        if (item.bopis !== 'true' &&  item.retailOnly !== 'true') {
         return $q.when();
        }

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/stores/inventory',
            cache: false,
            params: {
                "sku": item.sku,
                "zip": store.zip,
                "limit": 1,
                "offset": 1,
                "radius": 20
            }
        }).then(function(response) {
            if (response.data.Store != undefined) {
                var stores = response.data.Store;
                var storeFound = false;
                if (stores.length > 0) {
                    //  find our store in this array
                    for (var i = 0; i < stores.length; i++) {
                        if (stores[i].storeNumber === store.storeNumber) {
                            store.stockLevel = stores[i].inventory[0].stockLevelMessage;
                            store.invQty = stores[i].inventory[0].quantity;
                            storeFound = true;
                            break;
                        };
                    }

                    if (store.invQty === 0 || !storeFound) {
                        //  No inventory, use the nearest store instead
                        store = stores[0];
                        store.stockLevel = stores[0].inventory[0].stockLevelMessage;
                        store.invQty = stores[0].inventory[0].quantity;
                        saveStoreFromInv(store);
                    } else {
                        saveStore(store);
                    }
                 }
                 d.resolve (store);
              } else if (response) {
                d.resolve(null);
            }
        }, function(error) {
            console.log('error getting stores for sku', error);
            d.resolve(null);
        });

        return d.promise;
    };

    var getStore = function() {
       var store = JSON.parse (localStorage.getItem ('defaultStore'));
       return store;
    };

    var getStoreFormat = function() {
        return defaultStore;
    };

    var getFraminghamStore = function() {
        return FRAMINGHAM;
    };

    return {
        saveStore : saveStore,
        getStore : getStore,
        getStoreFormat : getStoreFormat,
        getFraminghamStore : getFraminghamStore,
        saveStoreFromHeader : saveStoreFromHeader,
        getInventoryInStore : getInventoryInStore,
        saveGenericStore : saveGenericStore
    };

});