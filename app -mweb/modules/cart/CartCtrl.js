'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:CartCtrl
 */
angular.module('stpls').controller('CartCtrl', function($scope, $stateParams, $rootScope, $state, $interval, $window, $translate, scroll, Checkout, MobileService, Rewards, Coupons, Cart, Locator, Account, StoreInventory, VisaCheckout, Analytics, ShippingConfig, DefaultStore, InsideChat, Config, ApplePayHandler) {

    var shippingConfg = ShippingConfig.getShippingConfig();
    var baseShippingChargeDefault = shippingConfg.baseShippingCharge;


    var bopisItemCount = 0;
    var STSItemCount = 0;
    var esdItemCount = 0;
    var visacheckoutInit = false;
    var shippingBits = ShippingConfig.getShippingBitFlags();

    $scope.freeDelivery = false;
    $scope.freeDeliveryRemain = 0.00;
    $scope.coupons = null;
    $scope.sessionUser = MobileService.getSessionUserName();
    $scope.sessionUserFreeDelivery = false;

    $scope.cart = false;
    $scope.rewards = null;
    $scope.inkRewards = null;
    $scope.rewardsNumber = null;
    $scope.currentItem = null;
    $scope.addCouponError = null;
    $scope.rewardsError = null;
    $scope.loading = false;
    $scope.shipAllToStore = false;
    $scope.shipToStore = null;
    $scope.shouldShowShipToStore = false;
    $scope.defaultStore = null;
    $scope.couponTotal = 0.00;
    $scope.preTaxTotal = 0;
    $scope.shippingFee = 0;
    $scope.allBopisOrSTS = false;
    $scope.esdOnly = false;
    $scope.hasOverSizedFee = false;
    $scope.cartHasError = false;

    $scope.paymentPreference;
    $scope.remember_preference = false;
    $scope.canShowApplePay;
    $scope.checkout_selected = false;
    $scope.applepay_error = null;
    $scope.morePaymentsOpen = false;

    /*  For ApplePay & AmexPay */
    $scope.payment_vendors = [];
    var applePayId = "2";

    /*  Triggered when apple pay has error  */
    $rootScope.$on ('applePayError', function (event, data) {
        $scope.applepay_error = data.errorMsg;
    });

    $scope.expand = {
      coupons: true
    };

    $scope.$watch('expand.coupons', function(yn){
      if (yn) {
        scroll.to('cart-bottom');
      }
    });

    $scope.toggleMorePayments = function() {
      $scope.morePaymentsOpen = !$scope.morePaymentsOpen;
    };

    $scope.inputFocused = function(e) {
      var el = e.target.parentElement.parentElement.parentElement.parentElement;

      el.scrollIntoView();
    };

    $scope.checkoutMethodSelected = function(vendorId) {
      if (vendorId) {
          $scope.paymentPreference = vendorId;
      }

      if ($scope.remember_preference) {
          localStorage.setItem('paymentPreference', $scope.paymentPreference);
      }

      switch($scope.paymentPreference) {
        case 1:                    //   Secure checkout
            secureCheckout();

            break;
        case 2:                    //   Apple Pay
            var shipMethod = 'STA';

            if ($scope.shipAllToStore) {
                shipMethod = "STS";
            } else if ($scope.allBopisOrSTS) {   //  include STS, so check STS first
                shipMethod = 'ISP';
            }

            if (shipMethod === 'STS') {
                ApplePayHandler.applePaySelected($scope.preTaxTotal.toFixed(2), !$scope.allBopisOrSTS, shipMethod, $scope.shipToStore);
            } else {
               ApplePayHandler.applePaySelected($scope.preTaxTotal.toFixed(2), !$scope.allBopisOrSTS, shipMethod, null);
            }

            break;
        case '3':                    //   Visa Checkout
            //  handled elsewhere
            break;
        case '4':                    //   Amex Pay
            console.log ('Amex Pay is under construction.  Please select another payment method');

            break;
        default:
            secureCheckout();

            break;
        }
        $scope.checkout_selected = false;
    };

    $scope.showVisaCheckout = true;

    var init = function() {

      //  Get list of payment vendors
      var aplConfig = Config.getProperty('payment_vendors');
      var env = Config.getEnvironment();
      var config = aplConfig[env] || aplConfig['default'];
      angular.forEach(config.vendorlist, function(vendor) {
          if (vendor.id === applePayId) {
             if ($scope.canShowApplePay) {
                  //  Only add ApplePay, if device is configured for Apple Pay
                  $scope.payment_vendors.push(vendor);
             }
           } else {
              $scope.payment_vendors.push(vendor);
           }
      });

      //  Get user's payment preference, if any has been set
      $scope.paymentPreference = localStorage.getItem('paymentPreference')  || null;
      $scope.remember_preference = localStorage.getItem('rememberPreference')  || false;

        $rootScope.$watch(function() {
            return $scope.cart.itemCount;
        }, function(newVal) {
            $rootScope.setCartCount(newVal);
        });

        /*$scope.$on('$viewContentLoaded', function() {
            Cart.getCartFromBackend().then(function(response) {
                $scope.cart = response;
                $rootScope.setCartCount ($scope.cart.productsInCart);
            }, function(error) {
                $rootScope.setCartCount (0);
            });
        });*/

        //  Update settings from cookies for Ship-To-Store
        $scope.shipAllToStore = (localStorage.getItem('shipAllToStore') === 'true');

        if ($scope.shipAllToStore) {
            $scope.shipToStore = JSON.parse(localStorage.getItem('shipToStoreAddress'));
        }
        if (!$scope.shipToStore) {
            if ($scope.defaultStore && $scope.defaultStore.storeNumber) {
                $scope.shipToStore = {
                    address: $scope.defaultStore.address,
                    city: $scope.defaultStore.city,
                    state: $scope.defaultStore.state,
                    zipCode: $scope.defaultStore.zip,
                    phoneNumber: $scope.defaultStore.phone_number,
                    storeNumber: $scope.defaultStore.storeNumber
                };
            } else {
                var framingham_store = DefaultStore.getFraminghamStore();
                $scope.shipToStore = {
                    address: framingham_store.address,
                    city: framingham_store.city,
                    state: framingham_store.state,
                    zipCode: framingham_store.zip,
                    phoneNumber: framingham_store.phone_number,
                    storeNumber: framingham_store.storeNumber
                };
            }
        }

        if ($scope.shipAllToStore && !$scope.shipToStore) {
            $scope.shipToStore = $scope.defaultStore;
        }

        $scope.loading = true;
        //  Make sure we have cart items
        Cart.getCartFromBackend(true).then(function(response) {
            if (response) {

                $scope.cart = response;
                if ($scope.cart.itemCount === undefined) {
                    $scope.cart.itemCount == 0;
                }
                $scope.cartHasError = false;
                var items = $scope.cart.productsInCart;
                angular.forEach(items, function(product) {
                    product.qty = parseInt(product.qty);
                    product.orderItemId = parseInt(product.orderItemId);
                    product.stores = null;

                    //  Get BOPIS Store
                    product.bopisSelected = false;
                    if (product.bopis === 'true') {
                        if (product.shippingInfo && product.shippingInfo.deliveryModeSelected) {
                            product.bopisSelected = (product.shippingInfo.deliveryModeSelected === 'ISP');
                        }

                        //  If BOPIS-Eligible, but not Turned on, and OOS on-line, then flag it
                        if (!product.bopisSelected && (product.inStock && product.inStock !== 'true')) {
                            product.bopisError = $translate.instant('CART_OOS_BOPISERROR');
                        }
                        //  Make sure we have a valid object to work with, so
                        //  default to Framingham unless we have something else.
                        if (!product.shippingInfo || !product.shippingInfo.deliveryAddressSelected) {
                            //  This BOPIS item does not have a store assignment,
                            //  so we will assign a default store
                            if (!$scope.defaultStore) {
                                //  If defaultStore not selected, then get the nearest store
                                var results = StoreInventory.getInventoryFromStoreRadius(Account.getZipCode(), product.sku);
                                results.then(function(data) {
                                    if (data) {
                                        product.stores = data;

                                        if (product.stores.length > 0) {
                                             $scope.defaultStore = {
                                                address: product.stores[0].address,
                                                city: product.stores[0].city,
                                                state: product.stores[0].state,
                                                phoneNumber: product.stores[0].phone_number,
                                                zip: product.stores[0].postalCode,
                                                distance: '',
                                                stockLevel: '',
                                                invQty: 0,
                                                storeNumber: product.stores[0].storeNumber
                                            };
                                            //  No, don't save what we default to
                                            //DefaultStore.saveStore($scope.defaultStore);
                                        }
                                    } else {
                                        product.stores = {};
                                        $scope.defaultStore = DefaultStore.getFraminghamStore();;
                                    }
                                }, function(error) {
                                    product.stores = {};
                                    $scope.defaultStore = DefaultStore.getFraminghamStore();;
                                    console.log('error getting nearest store', error);
                                });
                            }
                        }
                    } else {
                        if (product.inStock && product.inStock !== 'true') {
                            //  Product in cart has gone OOS online
                            product.bopisError = $translate.instant('CART_OOS_NONBOPISERROR');
                        }
                    }

                    if (product.bopisError) {
                        $scope.cartHasError = true;
                    };

                });
            }
        }, function(status) {
            /*Status = -1, when API is cancelled*/
            if (status === -1) {
                Cart.setCartReloadCount(0);
            }
            if (status === 400 && Cart.getCartReloadCount() <= 1) {
                $state.reload();
                Cart.setCartReloadCount(1);
            }
            else if (status === 400 && Cart.getCartReloadCount() > 1) {
                Cart.setCartReloadCount(0);
            }
        })['finally'](function() {
            $scope.loading = false;
            //  Get Rewards
            if (MobileService.getSessionState() === 'registered') {
                var results = Rewards.getRewardsDashboard();
                results.then(function(data) {
                    if (data) {
                        var str = data.rewardsNumber;
                        $scope.rewardsNumber = str.substr(0, 3) + ' ' + str.substr(3, 4) + ' ' + str.substr(7, 3);
                        $scope.rewards = data.rewardDetails[0].reward;
                        $scope.inkRewards = data.inkRecyclingDetails[0].reward;
                    }
                 }, function(error) {
                    $scope.rewardsError = error;
                 })['finally'](function() {
                    $scope.updateCartSupplementalInfo();
                    $scope.breakdown = true;
                 });
            } else {
               $scope.updateCartSupplementalInfo();
               $scope.breakdown = true;
            }

            $rootScope.setCartCount($scope.cart.itemCount);
        });
    };

    //  Get default store, as follows:
    //      1) Last selected store
    //      2) My Store
    //      3) Nearest Store based on sku
    //      4) Framingham # 0349 (hope we don't hit this)
    //
    var store = DefaultStore.getStore();

    if (store) {
        $scope.defaultStore = store;
    } else {
        var myStore = Locator.getRememberedStore();
        if (myStore) {
            var store = DefaultStore.getStoreFormat();
            store.address = myStore.store_address.address_line1;
            store.city = myStore.store_address.city;
            store.state = myStore.store_address.state;
            store.phoneNumber = myStore.store_address.phone_number;
            store.zip = myStore.store_address.zip;
            store.distance = myStore.dis;
            store.stockLevel = '';
            store.invQty = 0;
            store.storeNumber = myStore.store_number;
            //  No, don't save what we default to
            //DefaultStore.saveStore(store);
            $scope.defaultStore = store;
        }
    }

    ApplePayHandler.isApplePayAvailable().then(function(response) {
        console.log(response);
        $scope.canShowApplePay = response;
        init();
    });

    $scope.canShowShipToStore = function() {
        bopisItemCount = 0;
        STSItemCount = 0;
        esdItemCount = 0;
        angular.forEach($scope.cart.productsInCart, function(product) {
            if (product.esd) {
                esdItemCount++;
            } else if (product.tag & shippingBits.bitBopis) {
                bopisItemCount++;
            }
            if (product.shippingInfo && product.shippingInfo.deliveryModeAvailable) {
               if (product.shippingInfo.deliveryModeAvailable.shipToStore) {
                   STSItemCount++;
               }
            }
        });

        var hasAnyBopis = ($scope.cart.productsInCart && (bopisItemCount > 0)); //  Any Bopis items?
        var allSTSAllowed = ($scope.cart.productsInCart && (STSItemCount === $scope.cart.productsInCart.length)); //  Are all items STS allowed?

        $scope.esdOnly = ($scope.cart.productsInCart && (esdItemCount === $scope.cart.productsInCart.length)); //  All ESD items, no Ship-to-Store.
        $scope.shouldShowShipToStore = (!hasAnyBopis && !$scope.esdOnly && allSTSAllowed && !$scope.canShowApplePay);
        if (!$scope.shouldShowShipToStore) {
            //  As cart items change, make sure this setting
            //  is accurate regardless of cookie
            $scope.shipAllToStore = false;
        }
    };

    $scope.addCoupon = function(code, refreshRewards) {

        if (!code || code.trim() === '') {
            $scope.addCouponError = $translate.instant('CART_EMPTY_COUPON');
            return;
        }

        $scope.loading = true;
        Coupons.addCouponToCart(code).then(function() {
            $scope.refreshCouponsRewards(refreshRewards);

        }, function(error) {
            var msg = error.message;
            if (error.message === undefined) {
                msg = error;
            }
            $scope.loading = false;
            $scope.addCouponError = msg;
            console.log('error add coupon to cart.', msg);
        });
    };

    $scope.removeCoupon = function(couponObj) {
        var code = couponObj.code;
        if (!code || code.trim() === '') {
            $scope.addCouponError = $translate.instant('CART_EMPTY_COUPON');
            return;
        }

        // If the being removed the coupon is the Visa Checkout coupon, remove it from Visa Checkout
        var vmeCouponMsg = VisaCheckout.getCoupon();
        if (vmeCouponMsg) {
            var shortMsg = (couponObj.description || [])[0].shortDescription || '';
            var longMsg = (couponObj.description || [])[0].longDescription || '';
            if (shortMsg.indexOf(vmeCouponMsg) >= 0 || longMsg.indexOf(vmeCouponMsg) >= 0) {
                VisaCheckout.removeCoupon();
            }
        }

        $scope.loading = true;
        Coupons.deleteCouponInCart(code).then(function() {

            //  when deleting, it can be a reward or coupon,
            //  so refresh both
            $scope.refreshCouponsRewards(true);
            $scope.loading = false;

        }, function(error) {
            var msg = error.message;
            if (error.message === undefined) {
                msg = error;
            }
            $scope.loading = false;
            $scope.addCouponError = msg;
            console.log('error remove coupon from cart.', msg);
        });
    };

    $scope.updateCartSupplementalInfo = function() {
        $scope.canShowShipToStore();

        $scope.coupons = $scope.cart.Coupon;
        $scope.couponTotal = 0.00;
        for (var c in $scope.coupons) {
            $scope.couponTotal += parseFloat($scope.coupons[c].adjustedAmount);
        }

        $scope.freeDeliveryRemain = Number($scope.cart.baseShippingThreshold) - Number($scope.cart.subTotal);

        $scope.freeDelivery = (($scope.cart.delivery === 'Free') || ($scope.freeDeliveryRemain <= 0.00));
        $scope.allBopisOrSTS = isAllBopisOrSts();
        $scope.showAddOnInfo = !$scope.shipAllToStore && !Cart.isAddOnProductReady() && !$scope.allBopisOrSTS;

        $scope.addOnSKUCount = Cart.getAddOnSkuCount();
        $scope.minAddOnBasketSize = Cart.getMinAddOnBasketSize();

        $rootScope.setCartCount($scope.cart.itemCount);

        angular.forEach($scope.cart.productsInCart, function(product) {
            if ((product.shippingInfo && product.shippingInfo.deliveryModeSelected === 'ISP') || product.esd === true) {
                product.expectedBusinessDayDelivery = '';
            }
            //  Get BOPIS Store
            product.bopisSelected = false;
            if (product.bopis === 'true') {
                if (product.shippingInfo && product.shippingInfo.deliveryModeSelected) {
                    product.bopisSelected = (product.shippingInfo.deliveryModeSelected === 'ISP');
                }
            }
            // set flag for wasQty
            product.wasQty = product.qty;
        });

        updateShippingFeeAndTotal();
    };

    function updateShippingFeeAndTotal() {
        var cart = $scope.cart;

        var shippingFee = 0;
        var oversizeShippingFee = 0;

        $scope.sessionUserFreeDelivery = false;
        $scope.preTaxTotal = Number(cart.preTaxTotal);

        if ($scope.shipAllToStore || $scope.allBopisOrSTS || $scope.esdOnly) {
            $scope.freeDelivery = true;
            $scope.shippingFee = 0;
            if (Number(cart.delivery) > 0) {
                //  adjust pre-tax subtotal if we remove the delivery fee
                $scope.preTaxTotal -= Number(cart.delivery);
            }
            if (Number(cart.totalHandlingCost) > 0) {
                $scope.preTaxTotal -= Number(cart.totalHandlingCost);
            }
        } else {

            $scope.freeDelivery = false;
            var baseShippingThreshold = Number(cart.baseShippingThreshold);

            // basic shipping fee
            shippingFee = cart.delivery && cart.delivery != 'Free' ? Number(cart.delivery) : 0;

            if ((baseShippingThreshold > Number(cart.subTotal) && !Cart.hasFreeShippingItem()) || (shippingFee > 0))  {
                 $scope.freeDelivery = false;
                 shippingFee = shippingFee || baseShippingChargeDefault;
            } else {
                $scope.freeDelivery = true;
                $scope.sessionUserFreeDelivery = $scope.sessionUser && baseShippingThreshold === 0;
             }

            // oversize shipping fee
            oversizeShippingFee = Number(cart.totalHandlingCost);
        }

        $scope.shippingFee = shippingFee;
        $scope.oversizeShippingFee = oversizeShippingFee;

        $scope.hasOverSizedFee = (oversizeShippingFee > 0);

        Analytics.captureDLO(Analytics.DLO.cart, {
          subtotal: $scope.preTaxTotal.toFixed(2),
          shipping: $scope.shippingFee.toFixed(2)
        });
    };

    $scope.refreshCouponsRewards = function(refreshRewards) {
        $scope.loading = true;

        Cart.getCartFromBackend().then(function(response) {
            $scope.cart = response;
            $scope.updateCartSupplementalInfo();

            var couponInput = document.getElementById('addCouponCode');
            couponInput.value = '';
            if (!refreshRewards) {
                $scope.loading = false;
            }
            return response;

        }).then(function(response) {

            //  Check if User Logged In - only get rewards for registered user
            $scope.rewardsError = null;
            if (refreshRewards) {
                if (MobileService.getSessionState() === 'registered') {
                    var results = Rewards.getRewardsDashboard();
                    results.then(function(data) {
                        if (data) {
                            var str = data.rewardsNumber;
                            $scope.rewardsNumber = str.substr(0, 3) + ' ' + str.substr(3, 4) + ' ' + str.substr(7, 3);
                            $scope.rewards = data.rewardDetails[0].reward;
                            $scope.inkRewards = data.inkRecyclingDetails[0].reward;
                        }
                        $scope.loading = false;
                    }, function(error) {
                        $scope.rewardsError = error;
                        $scope.loading = false;
                    });
                }
            }
        });
    };

    $scope.inputKeyPress = function() {
        $scope.addCouponError = null;
    };

    /*  User updated quantity field */
    $scope.quantityChanged = function(item, qty) {
        $scope.loading = true;
        $scope.currentItem = item;

        //if (qty >= 0) {
        if (qty > 0) { //  Don't allow 0 qty to delete the item
            item.qty = qty;
        }

        Cart.modifyItem(item).then(function(response) {
            $scope.cart = response;
            $scope.updateCartSupplementalInfo();

            $scope.loading = false;
        }, function(error) {
            $scope.loading = false;
        });

        $scope.updateCartSupplementalInfo();
    };

    $scope.shipToStoreClicked = function() {
        $scope.shipAllToStore = !$scope.shipAllToStore;

        localStorage.setItem('shipAllToStore', $scope.shipAllToStore);

        if ($scope.shipAllToStore) {
            //  Save Ship-To Store
            localStorage.setItem('shipToStoreAddress', JSON.stringify($scope.shipToStore));
        } else {
            localStorage.removeItem('shipToStoreAddress');
        }

        $scope.loading = true;
        InsideChat.trackerCartSTS($scope.cart, $scope.shipAllToStore);

        Cart.getCartFromBackend().then(function(response) {
          $scope.cart = response;
        }, function(error) {
        })['finally'](function() {
          updateVisaCheckoutSetting();
          $scope.updateCartSupplementalInfo();
          $scope.loading = false;
        });
    };

    /*  User switched Bopis flag */
    $scope.bopisClicked = function(item) {
        $scope.loading = true;
        $scope.currentItem = item;

        if (!$scope.defaultStore) {
            // This shouldn't happen unless inv system is down
            $scope.defaultStore = DefaultStore.getFraminghamStore();
        }
        item.bopisError = null;
        if (item.bopisSelected) {
            //  check if a store has been selected
            if (!item.shippingInfo) {
                item.shippingInfo = {
                    deliveryModeSelected: 'STA'
                }; //  default, this will create shippingInfo node
            }
            if (!item.shippingInfo.deliveryAddressSelected) {
                item.shippingInfo.deliveryAddressSelected = {
                    address: $scope.defaultStore.address,
                    city: $scope.defaultStore.city,
                    state: $scope.defaultStore.state,
                    zipCode: $scope.defaultStore.zip,
                    storeNumber: $scope.defaultStore.storeNumber
                };
             }
            item.shippingInfo.deliveryModeSelected = 'ISP';
            item.shippingInfo.deliveryAddressSelected.storeNumber = $scope.defaultStore.storeNumber;
        } else {
            item.shippingInfo.deliveryModeSelected = 'STA';
            item.shippingInfo.deliveryAddressSelected.storeNumber = '';
        }

         Cart.modifyItem(item).then(function(response) {
            $scope.cart = response;
            $scope.updateCartSupplementalInfo();
            updateVisaCheckoutSetting();
            $scope.loading = false;

        }, function(error) {
            $scope.loading = false;
            if ((error.message && error.message.indexOf('out-of-stock') > -1) ||
               (error.message && error.message.indexOf('out of stock') > -1)) {
                item.bopisError = $translate.instant('CART_OOS_BOPISERROR');
            } else {
                item.bopisError = error.message;
            }
            if (error.message === undefined) {
                item.bopisError = $scope.handleErrorObject(error);
            }

        })['finally'](function() {
            calcCartErrors();

            var items = $scope.cart.productsInCart;
            angular.forEach(items, function(product) {
                product.bopisSelected = false;
                if (product.bopis === 'true') {
                    if (product.shippingInfo && product.shippingInfo.deliveryModeSelected) {
                        product.bopisSelected = (product.shippingInfo.deliveryModeSelected === 'ISP');
                    }
                    if (!product.bopisSelected) {
                        product.shippingInfo.deliveryModeSelected = 'STA';
                    }
                }
            });
        });
    };

    var calcCartErrors = function() {
        $scope.cartHasError = false;
        var items = $scope.cart.productsInCart;
        angular.forEach(items, function(product) {
           if (product.bopisError) {
                $scope.cartHasError = true;
           };
        });
    };

    $scope.handleErrorObject = function(error) {
        var msg = '';
        var key;
        if (error.status === 404) {
            msg = 'Error calling url ' + error.config.url.toString() + '.  Not found.';
            return msg;
        }

        if (error.data && error.data.errorMessage) {
            msg = error.data.errorMessage;
        }
        if ((msg.indexOf('out-of-stock') > -1) ||
           (msg.indexOf('out of stock') > -1)) {
            msg = $translate.instant('CART_OOS_BOPISERROR');
        }
        return msg;
    };

    $scope.checkBopisStores = function(item) {

        $scope.currentItem = item;
        Cart.setCurrentItem(item);
        var storeNum;
        var zipCode;
        if (item.shippingInfo.deliveryAddressSelected && item.shippingInfo.deliveryAddressSelected.storeNumber) {
            storeNum = item.shippingInfo.deliveryAddressSelected.storeNumber;
            zipCode = item.shippingInfo.deliveryAddressSelected.zipCode;
        } else {
            storeNum = $scope.defaultStore.storeNumber;
            zipCode = $scope.defaultStore.zip;
        }

        $rootScope.toRoute('bopisStores', {
            sku: item.sku,
            storeNo: storeNum,
            zip: zipCode,
            product:item,
            returnRte: 'cart'
         });
    };

    $scope.checkShipToStores = function() {

        $rootScope.toRoute('shipToStores', {
            storeNo: $scope.shipToStore.storeNumber,
            zip: $scope.shipToStore.zipCode
        });
    };

    $scope.removeItem = function(item) {

        var newitem = angular.copy(item);

        if (item.price) {
            var ded = parseFloat(item.price.finalDeduction);
            var final = parseFloat(item.price.finalPrice);
            newitem.price.finalPrice = (final + ded).toFixed(2);       //  note, finalDeduction is already negative
        }

        //  Confirm Delete first
        $rootScope.prompt({
            header: {
                close: true,
                title: 'Confirm Delete'
            },
            product: newitem,
            message: 'Are you sure you want to delete this item?',
            actions: {
                primary: {
                    cta: {
                      sku: newitem.sku,
                      type: 'removecart'
                    },
                    title: 'Yes',
                    callback: function() {
                        $scope.loading = true;
                        Cart.removeItem(item).then(function(response) {
                            $scope.loading = false;
                            $scope.cart = response;
                            $scope.updateCartSupplementalInfo();
                            updateVisaCheckoutSetting();

                        }, function(error) {
                            $scope.loading = false;
                            var msg = error.message;
                            if (error.message === undefined) {
                                msg = error;
                            }
                            console.log('error removing item.', msg);
                        });
                    }
                },
                secondary: {
                    title: 'No'
                }
            }
        });
    };

    $scope.modifyItem = function($event, item, delta) {
        item.bopisError = null;
        var currentQty = item.wasQty || item.qty;
        var newQty = null;

        // parse input as int
        var inputQty = parseInt(item.qty);

        // if triggered by input qty field
        if (delta === null) {

            // if element is no longer active
            if ($event.target !== document.activeElement) {

                // if input is not #
                if (isNaN(inputQty)) {
                    item.qty = item.wasQty;
                    return;
                }
                else if (inputQty === 0) {      // if input is 0
                    newQty = 0;
                }
                else {
                    newQty = inputQty;  // accept new input qty
                }
            }
        }
        else if (delta === 1) {
            newQty = inputQty + 1;      // inc by one
        } else if (delta === -1) {
            newQty = inputQty - 1;      // dec by one
        } else {
          newQty = 0;                   // remove all
        }

        // if qty of item was changed
        if (newQty !== null && newQty !== currentQty) {

            item.qty = newQty;
            item.loading = true;
            $scope.loading = true;
            var modType = newQty > currentQty ? 'increaseqty' : 'decreaseqty';

            Cart.modifyItem(item).then(function(response) {
                $scope.loading = false;
                $scope.cart = response;
                $scope.updateCartSupplementalInfo();

                Analytics.cartItemCTA(item, modType);
            }, function(error) {
                $scope.loading = false;
                if (error.message === undefined) {
                    item.bopisError = $scope.handleErrorObject(error);
                } else {
                    if ((error.message && error.message.indexOf('out-of-stock') > -1) ||
                        (error.message && error.message.indexOf('out of stock') > -1)) {
                        item.bopisError = (item.bopis === 'true') ? $translate.instant('CART_OOS_BOPISERROR') : $translate.instant('CART_OOS_NONBOPISERROR');
                    } else {
                        item.bopisError = error.message;
                    }
                }
                Analytics.cartItemCTA(item, modType, error);
            })['finally'](function() {
                calcCartErrors();
            });
        }
    };

    $scope.limitQty = function($event, item) {
        var qty = (''+item.qty).replace(/\D/g,'').slice(0,3);
        item.qty = $event.target.value = qty;
    };

    $scope.checkout = function() {
        VisaCheckout.setVisaCheckoutModeOff();
        if (!$scope.shouldShowShipToStore) {
            localStorage.removeItem('shipAllToStore');
        }
        Cart.setThisCart($scope.cart);

        $rootScope.toRoute('checkout', {
            id: $scope.cart.orderID
        });
    };

    $scope.$on('continue.visaCheckout', function() {
        $scope.checkout();
    });

    var isAllBopisOrSts = function() {

        if ($scope.shipAllToStore) {
            return true;
        }
        var anyNormalSku = false;
        var anyBopis = false;

        angular.forEach($scope.cart.productsInCart, function(product) {
            if (!product.esd && (product.tag & shippingBits.bitBopis) && product.shippingInfo && product.shippingInfo.deliveryModeSelected === 'ISP') {
                anyBopis = true;
            } else {
                anyNormalSku = true;
            }
        });

        return anyBopis && !anyNormalSku;
    };

    $scope.clickVisaCheckout = function() {
        if (!visacheckoutInit) {
            visacheckoutInit = true;

            var hideShippingAddress = isAllBopisOrSts();
            VisaCheckout.initVisaCheckout(hideShippingAddress).then(function() {
                document.querySelector('.visa_checkout.v-button').click();
            }, function() {
                $scope.showVisaCheckout = false;
            });
        }
    };

    var updateVisaCheckoutSetting = function() {
        if (!visacheckoutInit || $scope.showAddOnInfo) {
            return;
        }
        var hideShippingAddress = isAllBopisOrSts();
        VisaCheckout.initVisaCheckout('cartPage', hideShippingAddress).then(function() {

        }, function() {
            $scope.showVisaCheckout = false;
        });
    };

    $scope.continueShopping = function() {
        $rootScope.toRoute('home');
    };

    /*  Code to group cart items by
     *  expected delivery dates
     */
    $scope.productDates = [];

    $scope.productsToFilter = function() {
        $scope.productDates = [];
        return $scope.cart.productsInCart;
    };

    $scope.filterByDeliverDate = function(item) {
        var newItem = $scope.productDates.indexOf(item.expectedBusinessDayDelivery) === -1;
        if (newItem) {
            $scope.productDates.unshift(item.expectedBusinessDayDelivery);
            $scope.productDates.sort();
        }
        return newItem;
    };

    $scope.showTerms = function(){
      $scope.expand.terms = true;
    };

    //Analytics signals for loading
    Analytics.addWatch($scope, 'loading');

});

/*  This is a custom filter that will filter the
 *  cart items array based on the passed delivery date
 */
angular.module('stpls').filter('isDeliveryDate', function() {

    return function(items, deliveryDate) {

        return _.filter(items, function(item) {
            return item.expectedBusinessDayDelivery === deliveryDate;
        });

    };
});
