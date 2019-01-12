'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Cart
 */
angular.module('stpls').factory('Cart', function($rootScope, $http, $q, $cookies, $timeout, $translate, Account, MobileService, Analytics, ShippingConfig, Product, DefaultStore, InsideChat) {

    var apiCanceller = null;
    var currentItem = null;
    var initiated = false;
    var cart = null;
    var cartReloadCount = 0;

    var flags = ShippingConfig.getShippingBitFlags();
    var bitFreeShipping = flags.bitFreeShipping;
    var bitBopis = flags.bitBopis;
    var bitAddOn = flags.bitAddOn;
    var bitHeavyWeight = flags.bitHeavyWeight;
    var bitRetailOnly = flags.bitRetailOnly;

    //  Guest Cart Items to persist
    var guestCartItems = [];

    var setCartReloadCount = function(value) {
        if (value === 0)
            cartReloadCount = 0;
        else if (value === 1)
            cartReloadCount += 1;
    };

    var getCartReloadCount = function() {
        return cartReloadCount;
    };

    var setProductShippingTag = function(product) {

        var deliveryModes;
        if (product.shippingInfo && product.shippingInfo.deliveryModeAvailable) {
            deliveryModes = product.shippingInfo.deliveryModeAvailable;
        }

        if (isTrue(product.bopis)) {
            product.tag == bitBopis;
        }
        if (isTrue(product.retailOnly)) {
            product.tag |= bitRetailOnly;
        }
        //  New tags for Bopis / RetailOnly
        if (deliveryModes) {
           if (deliveryModes.pickUp) {
               product.tag |= bitBopis;
           }
           if (!deliveryModes.shipToAddress && !deliveryModes.shipToStore) {
               product.tag |= bitRetailOnly;
               product.retailOnly = 'true';
           }
        }
        if (isTrue(product.retailOnly)) {
            return;
        }

        if (product.isAddOnSKU) {
            product.tag |= bitAddOn;
        } else if (product.isHeavyWeightSKU) {
            product.tag |= bitHeavyWeight;
        }
    };

    var setCurrentItem = function(item) {
        currentItem = item;
    };

    var getCurrentItem = function() {
        return currentItem;
    };

    var getThisCart = function() {
        return cart;
    };

    var setThisCart = function(cartIn) {
        cart = cartIn;
    };

    var getCartFromBackend = function(trackCartPosition) {

        if(apiCanceller) apiCanceller.resolve();
        var d = $q.defer();
        Analytics.signalModification();

        trackCartPosition = trackCartPosition || false;

        //  Add to test rewards threshold
        //client_id: '18e60d3ded68e073930bacdeefc574e5',

        apiCanceller = $q.defer();
        MobileService.request({
            method: 'GET',
            url: '/cart',
            timeout : apiCanceller.promise,
            params: {
                zip: Account.getZipCode(),
                skuCoupon: 'Y' //  This controls if product-level coupons are added
            }
        }).then(function(response) {
            if (response.data) {
                if (response.data.ErrorMessage) {
                    d.reject(response.data.ErrorMessage);
                } else if (response.data.message) {
                    d.reject(response.data.message);
                } else {
                    initiated = true;
                    cart = response.data;

                    InsideChat.trackerUpdateCart(cart, false, trackCartPosition);

                    d.resolve(response.data);

                    Analytics.updateToCart(cart);
                    guestCartItems = [];

                    var items = cart.productsInCart;
                    angular.forEach(items, function(product) {

                        var deliveryMode = 'STA';
                        var storeNum = '0349';
                        if (product.shippingInfo && product.shippingInfo.deliveryModeSelected) {
                            deliveryMode = product.shippingInfo.deliveryModeSelected;
                            var address = product.shippingInfo.deliveryAddressSelected;
                            if (address) {
                                storeNum = address.storeNumber;
                            }
                        }
                        setProductShippingTag(product);

                        product.qty = parseInt(product.qty);

                        //  Massage list price as extendedListPrice to reflect qty * list price
                        product.pricingInfo = Product.getPricing(product);
                        product.pricingInfo.extendedListPrice = product.pricingInfo.listPrice * product.qty;

                        //  if Guest, save cart data in local storage
                        if (!MobileService.getSessionUserName()) {
                            var guestCartItem = {
                                sku: product.sku,
                                qty: product.qty,
                                deliveryMethod: deliveryMode,
                                bopisStore: storeNum
                            };
                            guestCartItems.push(guestCartItem);
                        }
                    });

                    //  if Guest, save cart data in local storage
                    if (!MobileService.getSessionUserName()) {
                        setGuestCart (guestCartItems);
                    }
                }

            } else {
                InsideChat.trackerUpdateCart(undefined, false, trackCartPosition);
                d.reject(response);
            }
            Analytics.endModification();
        }, function(response) {
            InsideChat.trackerUpdateCart(undefined, false, trackCartPosition);
            d.reject(response.status);
            Analytics.endModification();
        })['finally'](function() {
            apiCanceller = null;
        });

        return d.promise;
    };

    /*  Find a coupon index in the passed coupons array
     *  based on the passed coupon code
     */
    var findCouponIndexByCode = function(arraytosearch, valuetosearch) {

        for (var idx = 0; idx < arraytosearch.length; idx++) {
            if (arraytosearch[idx].code === valuetosearch) {
                return idx;
            }
        }
        return null;
    };

    var isTrue = function(val) {
      return !!~['true', true].indexOf(val);
    };

    var isFalse = function(val) {
      return !!~['false', false].indexOf(val);
    };

    /*  Use this to check for cart errors BEFORE
     *  adding an item to the cart.
     */
    var canAddToCart = function(item, showPopup) {
        var errorMsg = false;

        if (item.sku.match (/^SS/)) {
            errorMsg = $translate.instant ('CART_SKUSETMASTER');
            if (showPopup) {
                popupError (item, errorMsg);
                return false;
            } else {
                return errorMsg;
            }

        } else if (isTrue(item.bopis) || isTrue(item.esd)) {    //  Check BOPIS first
            return true;

        } else if (isTrue(item.retailOnly)) {                   //  Retail Only If not BOPIS
            errorMsg = $translate.instant ('CART_INSTORE_ONLY');
            if (showPopup) {
                popupError (item, errorMsg);
                return false;
            } else {
                return errorMsg;
            }

        } else if (item.businessService && !isFalse(item.businessService)) {//  test before instock test
            errorMsg = $translate.instant ('CART_DOTCOM_ONLY');
            if (showPopup) {
                popupError (item, errorMsg);
                return false;
            } else {
                return errorMsg;
            }

        } else if (isTrue(item.inStock)) {
            return true;

        } else if (item.inStock !== undefined && !isTrue(item.inStock)) {
            errorMsg = $translate.instant ('CART_OOS_ONLINE');
            if (showPopup) {
                popupError (item, errorMsg);
                return false;
            } else {
                return errorMsg;
            }
        }

        return true;
    };

    /**
     * @ngdoc function
     * @name stpls.model:Cart.addItems
     * @param items {array} of structs containing sku & qty
     */
    var addItems = function(items) {

        var d = $q.defer();

        var itemsData = [];

        angular.forEach(items, function(item) {
           // Precaution for item passed without this data
            if (!item.shippingInfo) {
                item.shippingInfo = {
                     deliveryModeSelected: 'STA',
                     deliveryAddressSelected: {
                         storeNumber: ''
                     }
                };
            } else if (!item.shippingInfo.deliveryModeSelected) {
                item.shippingInfo = {
                     deliveryModeSelected: 'STA',
                     deliveryAddressSelected: {
                         storeNumber: ''
                     }
                 };
            } else if (item.shippingInfo.deliveryModeSelected === 'STA') {
                item.shippingInfo.deliveryAddressSelected.storeNumber = '';
            }

            itemsData.push({
                'sku': item.sku,
                'qty': item.qty,
                'deliveryMode': item.shippingInfo.deliveryModeSelected,
                'storeNumber': item.shippingInfo.deliveryAddressSelected.storeNumber
            });
        });

        if (itemsData.length > 0) {
            var message = $translate.instant('CART_DEFAULT_ERROR');
            var reject = function(){
              d.reject(message);
            };
            MobileService.getSession().then(function() {

                MobileService.request({
                    method: 'POST',
                    url: '/cart',
                    headers: {
                        'content-type': 'application/json'
                    },
                    params: {
                        zip: Account.getZipCode()
                    },
                    dataType: 'json',
                    cache: false,
                    data: {
                        'data': itemsData
                    }
                }).then(function(response) {

                    // If added
                    if (response.data.message === undefined && !response.data.errors) {

                        //  Always refresh the cart after any
                        //  modification.  This will update
                        //  pricing, etc.
                        getCartFromBackend().then(function(response) {
                            initiated = true;
                            cart = response;

                            //angular.forEach(items, function(item) {
                            //    InsideChat.trackerAddToCart(item, cart.preTaxTotal);
                            //});

                            // Call this because we were not in the cart itself
                            //  when this happened
                            $rootScope.setCartCount(cart.itemCount);

                            d.resolve(response);
                        }, function(error) {
                            initiated = true;
                            d.reject($translate.instant('CHK_CART_ERROR'));
                        });

                    } else if (response.data.errors) {
                        var errors0 = response.data.errors[0];
                        if (errors0.errorKey.indexOf('out of stock') !== -1) {
                            message = $translate.instant('CART_OOS');
                        }
                        reject(message || errors0.errorKey);
                    } else {
                        if (response.data && response.data.message.indexOf('out of stock') !== -1) {
                            message = $translate.instant('CART_OOS');
                        } else if (response.data.message.indexOf('retail only sku issue') !== -1) {
                            message = $translate.instant('CART_INSTORE_ONLY');
                        } else {
                            message = response.data.message;
                        }
                        reject(message);
                    }
                }, reject);

            }, reject);
        }

        Analytics.addToCart(itemsData, d.promise);
        return d.promise;
    };

   /**
     * @ngdoc function
     * @name stpls.model:Cart.addToCart
     * @param item: item json structure
     * @param popError:  true to show Alert when item cannot be added, otherwise show error in overlay.
     */
    var addToCart = function(item, popError, bopisDecided) {
        var d = $q.defer();

        //  Check for favorable conditions first
        var rc = canAddToCart (item, popError);
        if (rc !== true) {
            item.atcError = rc;
            item.cartMask = true;
            d.resolve(item.atcError);
        } else {
            item.atcError = (item.atcError !== true) ? item.atcError : false;
            /*if (isTrue(item.bopis) && !bopisDecided) {
                //  if  bopisDecided, means we came from Sku Page, where user already
                //  turned switch on or off
                //
                // BOPIS-ITEM:  Add it with BOPIS On, Need a Store
                //
                var defaultstore = DefaultStore.getStore();
                if (!defaultstore) {
                    defaultstore = DefaultStore.getFraminghamStore();
                }
                //  Set default shipping info
                item.shippingInfo = {
                    deliveryModeSelected: 'ISP',
                    deliveryAddressSelected: {
                            address: defaultstore.address,
                            city: defaultstore.city,
                            state: defaultstore.state,
                            zipCode: defaultstore.zip,
                            storeNumber: defaultstore.storeNumber
                    }
                };
                //  Does this store have inventory for the item?
                //  If so, we can use this store, if not, we will
                //  take the first store that does have inventory.
                DefaultStore.getInventoryInStore(defaultstore, item).then(
                   function(response) {
                     if (response) {
                        defaultstore = response;
                        item.shippingInfo.deliveryAddressSelected = {
                            address: defaultstore.address,
                            city: defaultstore.city,
                            state: defaultstore.state,
                            zipCode: defaultstore.zip,
                            storeNumber: defaultstore.storeNumber
                        };
                     } else {
                         //  no stores?
                         if (item.retailOnly) {
                             throw $translate.instant ('CART_INSTORE_ONLY_OOS');
                         } else {
                             item.shippingInfo.deliveryModeSelected = 'STA';
                             item.shippingInfo.deliveryAddressSelected.storeNumber = '';
                         }
                     }
                   },
                   function error() {
                      return '';
                   })
                   .then(function(response) {
                       var modItem = angular.copy(item);
                       modItem.qty = 1;
                       return addItems([modItem]);
                   }).then(function(response) {
                       item.atcError = false;
                       d.resolve(item.atcError);
                   }).catch(function(error) {
                       item.atcError = error;
                       d.reject(item.atcError);
                   });

             } else { */
                 /*
                  * NOW, BOPIS-ELIGIBLE, NON-BOPIS-ITEM, or BOPIS is already set from SKU Page:
                  */
                 var modItem = angular.copy(item);
                 modItem.qty = 1;
                 addItems([modItem]).then(function() {
                    item.atcError = false;
                    d.resolve (item.atcError);
                 }).catch(function(error) {
                    item.atcError = error;
                    d.reject(item.atcError);
                 });
            // }
        }

        return d.promise;
    };

    var removeItem = function(item) {

        var d = $q.defer();

        MobileService.request({
            method: 'DELETE',
            url: '/cart/' + item.orderItemId,
            params: {
                zip: Account.getZipCode()
            },
            cache: false

        }).then(function(response) {

            // If removed
            Analytics.cartItemCTA(item, 'remove', response.data.message);
            if (response.data.message === undefined) {
                //  Always refresh the cart after any
                //  modification.  This will update
                //  pricing, etc.
                getCartFromBackend().then(function(response) {
                    initiated = true;
                    cart = response;

                    d.resolve(response);
                }, function(error) {
                    initiated = true;
                    d.reject($translate.instant('CHK_CART_ERROR'));
                });
            } else {

                d.reject(response.data.message);
            }
        });

        return d.promise;
    };

    var popupError = function(item, errorMessage) {
        $rootScope.prompt({
            header: {
                close: true,
                title: $translate.instant('CART_ERROR_TITLE')
            },
            product: item,
            message: errorMessage,
            actions: {
                primary: {
                    title: $translate.instant('CART_CLOSE'),
                    callback: function() {
                        window.location.reload();
                    }
                },
            }
        });
    };

    var isSKUInCart = function(sku) {

        var inCart = false;
        if (!cart) {
            return false;
        }

        var items = cart.productsInCart;

        for (var i in items) {

            if (items[i].sku === sku) {
                inCart = items[i];
                break;
            }
        }

        return inCart;
    };

    var modifyItem = function(item) {

        var d = $q.defer();

        var bopisStore = null;
        var bopisMode = null;

        if (item.bopis) {
            // Bopis-Eligible
            if (item.shippingInfo && item.shippingInfo.deliveryModeSelected && item.shippingInfo.deliveryAddressSelected) {
                bopisStore = item.shippingInfo.deliveryAddressSelected.storeNumber;
                bopisMode = item.shippingInfo.deliveryModeSelected;
            } else {
                bopisStore = '';
                bopisMode = 'STA';
            }
        }

        MobileService.request({
            method: 'PUT',
            url: '/cart',
            headers: {
                'content-type': 'application/json'
            },
            params: {
                zip: Account.getZipCode()
            },
            dataType: 'json',
            cache: false,
            data: {
                'data': [{
                    'orderItemId': item.orderItemId,
                    'sku': item.sku,
                    'qty': item.qty,
                    'storeNumber': bopisStore,
                    'deliveryMode': bopisMode
                }]
            }

        }).then(function(response) {
            if (response.data) {
                if (response.data.ErrorMessage) {
                    if (response.data.ErrorMessage.indexOf('insufficient quantity') > -1) {
                        var jsonDetails = response.data['Item Details'];
                        if (jsonDetails && jsonDetails[0]) {
                            var value = jsonDetails[0].availableQuantity;
                            var msg = $translate.instant('CART_INVERROR');
                            msg = msg.replace ('%qtyValue%', value);
                            popupError(item, msg);
                            console.log('error modifying item.', msg);
                            d.reject(new Error(msg));
                        }
                    }
                    d.reject(new Error(response.data.ErrorMessage));
                } else if (response.data.errors) {
                    var message = '';
                    var errors0 = response.data.errors[0];
                    if (errors0.errorKey.indexOf('out of stock') !== -1) {
                        message = $translate.instant('CART_OOS_ONLINE');
                    }
                    d.reject(new Error(message));
                } else if (response.data.message) {
                    if (response.data.message.indexOf('more than we have in stock') > -1) {
                        popupError(item, response.data.message);
                        console.log('error modifying item.', response.data.message);
                     }
                    d.reject(new Error($translate.instant('CART_OOS_ONLINE')));
                } else {
                    //  Always refresh the cart after any
                    //  modification.  This will update
                    //  pricing, etc.
                    getCartFromBackend().then(function(response) {
                        initiated = true;
                        cart = response;

                        d.resolve(response);
                    }, function(error) {
                        initiated = true;
                        d.reject(new Error($translate.instant('CHK_CART_ERROR')));
                    });
                }
            } else {
                d.reject(response.data.message);
            }
        }, function(error) {
            console.log('error updating cart item', error);
            d.reject(error);
        });

        return d.promise;
    };

    var updateBopisStore = function(storeNum, address, city, state, zip) {

        if (currentItem) {
            currentItem.shippingInfo.deliveryModeSelected = 'ISP';
            currentItem.shippingInfo.deliveryAddressSelected = {
                address: address,
                city: city,
                state: state,
                zipCode: zip,
                storeNumber: storeNum
            };

            //  Save cookie for last selected store
            var store = DefaultStore.getStoreFormat();
            store.address = currentItem.shippingInfo.deliveryAddressSelected.address;
            store.city = currentItem.shippingInfo.deliveryAddressSelected.city;
            store.state = currentItem.shippingInfo.deliveryAddressSelected.state;
            store.phoneNumber = '';
            store.zip = currentItem.shippingInfo.deliveryAddressSelected.zipCode;
            store.distance = '';
            store.stockLevel = '';
            store.invQty = 0;
            store.storeNumber = currentItem.shippingInfo.deliveryAddressSelected.storeNumber;
            DefaultStore.saveStore(store);

            return modifyItem(currentItem);
        }
    };

    var getInfo = function() {

        return (initiated ? cart : false);

    };

    var init = function() {

        var d = $q.defer();

        // If session exists
        if (MobileService.hasSession()) {

            getCartFromBackend().then(function(response) {
                initiated = true;
                if (response) {
                    cart = response;
                }
                d.resolve(response);

            }, function(error) {
                initiated = true;
                d.reject($translate.instant('CHK_CART_ERROR'));

            });

        } else {

            // Check for locally-stored guest cart
            getGuestCart();

            initiated = true;
            d.resolve();
        }

        return d.promise;
    };


    var clear = function() {

        currentItem = null;
        initiated = false;
        cart = null;
    };

    var anyOversizeSku = function() {
        var hasOversizeSku = false;
        if (!cart) {
            return false;
        }

        var items = cart.productsInCart;

        for (var i in items) {

            if (items[i].isHeavyWeightSKU) {
                hasOversizeSku = true;
                break;
            }
        }

        return hasOversizeSku;

    };

    var getOversizeItemCount = function() {
        var c = 0;
        if (!cart) {
            return 0;
        }
        var items = cart.productsInCart;

        for (var i in items) {

            if (items[i].isHeavyWeightSKU && !items[i].freeShipping && items[i].retailOnly !== 'true') {
                c += Number(items[i].qty);
            }
        }

        return c;

    };

    var hasFreeShippingItem = function() {
        var hasFreeShippingItem = false;
        if (!cart) {
            return false;
        }
        var items = cart.productsInCart;

        for (var i in items) {

            if (items[i].freeShipping && items[i].retailOnly !== 'true') {
                hasFreeShippingItem = true;
                break;
            }
        }

        return hasFreeShippingItem;

    };

    var anyAddOnSku = function() {
        var hasAddOnSku = false;
        if (!cart) {
            return false;
        }
        var shipToStoreAttr = (localStorage.getItem('shipAllToStore') === 'true');
        if (shipToStoreAttr) { return false; }

        var items = cart.productsInCart;
        for (var i in items) {

            if (items[i].isAddOnSKU && items[i].shippingInfo.deliveryModeSelected !== 'ISP' && items[i].retailOnly !== 'true') {
                hasAddOnSku = true;
                break;
            }
        }

        return hasAddOnSku;

    };

    var getAddOnSkuCount = function() {
        var c = 0;
        if (!cart) {
            return 0;
        }
        var items = cart.productsInCart;

        for (var i in items) {

            if (items[i].isAddOnSKU && items[i].retailOnly !== 'true') {
                c += Number(items[i].qty);
            }
        }

        return c;

    };

    var isAddOnProductReady = function() {

        var minAddOnBasketSize = getMinAddOnBasketSize();

        return (!anyAddOnSku() || minAddOnBasketSize < Number(cart.subTotal));
    };

    var getMinAddOnBasketSize = function() {
       if (cart && cart.addOnBasketSize) {
           return Number(cart.addOnBasketSize);
       } else {
           var config = ShippingConfig.getShippingConfig();
           return config.addOnBasketSize;
       }
    };

    var setGuestCart = function(cartItems) {
         try {
            localStorage.setItem('stpls.guest.cart', JSON.stringify(cartItems));
         } catch (e) {
            console.log ('error setting stpls.guest.cart localStorage item.');
         }
    };

    var getGuestCart = function() {
        // Check for locally-stored guest cart
        if (!MobileService.getSessionUserName()) {
             try {
                var guestCartItems = JSON.parse(localStorage.getItem('stpls.guest.cart') || '{}');
                //  Add these items to the cart
                if (guestCartItems && guestCartItems.length > 0) {
                    addItems(guestCartItems);
                }
            } catch (e) {
                guestCartItems = null;      //  fail silently
            }
         }
         guestCartItems = null;
    };

    return {

        init: init,
        setCartReloadCount: setCartReloadCount,
        getCartReloadCount: getCartReloadCount,
        addToCart: addToCart,
        addItems: addItems,
        removeItem: removeItem,
        modifyItem: modifyItem,
        isSKUInCart: isSKUInCart,
        getInfo: getInfo,
        updateBopisStore: updateBopisStore,
        setCurrentItem: setCurrentItem,
        getCurrentItem: getCurrentItem,
        findCouponIndexByCode: findCouponIndexByCode,
        canAddToCart: canAddToCart,
        getCartFromBackend: getCartFromBackend,
        getThisCart: getThisCart,
        setThisCart: setThisCart,
        isAddOnProductReady: isAddOnProductReady,
        getAddOnSkuCount: getAddOnSkuCount,
        getMinAddOnBasketSize: getMinAddOnBasketSize,
        anyOversizeSku: anyOversizeSku,
        getOversizeItemCount: getOversizeItemCount,
        hasFreeShippingItem: hasFreeShippingItem,
        setGuestCart: setGuestCart,
        getGuestCart: getGuestCart,
        clear: clear

    };

});
