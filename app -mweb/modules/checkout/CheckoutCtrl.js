'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:CheckoutCtrl
 */
angular.module ('stpls').controller ('CheckoutCtrl', function ($scope, $stateParams, $rootScope, $translate, $timeout, scroll, MobileService, Cart, Checkout, VisaCheckout, Profile, CreditCards, Analytics, InsideChat, NuData) {

    if ($stateParams.id === undefined) {
        $rootScope.reload ();
        console.log ('this should not happen.  cart route was called from checkout.');
        return false;
    }

    $scope.hasShipData = false;
    $scope.hasBillData = false;

    $scope.okToSubmitOrder = false;
    $scope.shippingDataEntryComplete = false;
    $scope.billingDataEntryComplete = false;
    $scope.paymentDataEntryComplete = false;
    $scope.paymentLoaded = false;
    $scope.preCheckoutCalled = false;
    $scope.inPreCheckoutCall = false;

    $scope.shipAddressUpdated = false;
    $scope.billAddressUpdated = false;
    $scope.taxCalculated = false;
    $scope.shortShipping = 'shipping';
    $scope.usingGoogleAddressForShip = false;
    $scope.usingGoogleAddressForBill = false;
    $scope.existingCC = false;
    $scope.profile = undefined;
    $scope.submittingOrder = false;
    $scope.shipError = undefined;
    $scope.shipWarning = undefined;
    $scope.changedAddress = undefined;
    $scope.changedCreditCard = undefined;
    $scope.manualAddressCreated = false;
    $scope.bopisStoresLabel = $translate.instant ('CHK_BOPIS_STORE_LABEL');
    $scope.bopisStoreNums;
    $scope.bopisStoreAddresses;
    $scope.isLoading = false;
    $scope.canCheckout = true;
    $scope.initializing = true;

    //  Checkout Modes
    $scope.visaCheckoutMode = VisaCheckout.isVisaCheckoutModeEnabled ();
    $scope.normalCheckoutMode = !$scope.visaCheckoutMode;

    //  Cart Attributes
    $scope.bopisOnlyAttr = false;
    $scope.bopisAnyAttr = false;
    $scope.ESDOnlyAttr = false;
    $scope.ESDAnyAttr = false;
    $scope.AppleProdAttr = false;
    $scope.shipToStoreAttr = false;
    $scope.pickupStores;    //  Array for the dropdown in-place list
    $scope.addresses;       //  Array for the dropdown in-place list
    $scope.creditcards;     //  Array for the dropdown in-place list

    $scope.expand = {
        pickupStores : false,
        shipAddress : false,
        billAddress : false,
        creditCard : false
    };

    $scope.guestUserData = {
        useShipAsBill : true,
        shippingName : '',
        shippingPhone : '',
        eMailAddr : '',
        shipping : {
            addressLine1 : '',
            addressLine2 : '',
            city : '',
            state : '',
            zip : ''
        },
        billing : {
            name : '',
            addressLine1 : '',
            addressLine2 : '',
            city : '',
            state : '',
            zip : '',
            phone : ''
        },
        pickupName : '',
        pickupPhone : ''
    };

    $scope.checkoutData = {
        cart : undefined,
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

    $scope.oldData;

    //  Used to prevent unneccessary updates
    $scope.priorData = {
        shippingData : '',
        eMailAddr : '',
        ccCardNum : '',
        ccCardExp : '',
        ccCardCCV : '',
        ccCardID : '',
        toggle : '',
        billingData : '',
        pickupName : '',
        pickupPhone : ''
    };

    $scope.addtlPickupData = null;

    var paymentInfo;
    var initVisaCheckout = true;
    var disableUpdatesForVisa = false;

    $scope.checkoutData.sessionUser = MobileService.getSessionUserName ();

    $scope.focused = false;

    $scope.pageContainer = document.getElementsByClassName('page-container')[0];
    $scope.scrollPos = $scope.pageContainer.scrollTop;

    $scope.inputFocused = function(e) {
      $scope.scrollPos = $scope.pageContainer.scrollTop;
      $scope.focused = true;
      e.target.parentElement.scrollIntoView();
    };

    $scope.inputBlurred = function($event) {
      $scope.pageContainer.scrollTop = $scope.scrollPos;
      $scope.focused = false;
    };

    /*  Triggered when address is selected in the dropdown address list  */
    $rootScope.$on ('addressSelectionChanged', function (event, data) {
        var address = data.selAddress;
        $scope.checkoutData.addressMode = localStorage.getItem ('addressMode');

        if ($scope.checkoutData.addressMode === '1') {
            //  Update the ship address
            $scope.checkoutData.shipping.address = address.addressLine1 + ', ' + address.city + ", " + address.state + ' ' + address.zip;
            $scope.checkoutData.shipping.id = address.addressId;
            $scope.checkoutData.shipping.addressLine1 = address.addressLine1;
            $scope.checkoutData.shipping.addressLine2 = address.addressLine2;
            $scope.checkoutData.shipping.city = address.city;
            $scope.checkoutData.shipping.state = address.state;
            $scope.checkoutData.shipping.zip = address.zip;
            $scope.checkoutData.shippingName = address.first + ' ' + address.last;
            $scope.checkoutData.shippingPhone = address.phone;

            //  Save it as the last selected ship address
            localStorage.setItem ('lastUserShipId', $scope.checkoutData.shipping.id);

            if ($scope.checkoutData.useShipAsBill) {

                //  Billing is same as shipping
                $scope.checkoutData.billing.address = address.addressLine1 + ', ' + address.city + ", " + address.state + ' ' + address.zip;
                $scope.checkoutData.billing.id = address.addressId;
                $scope.checkoutData.billing.addressLine1 = address.addressLine1;
                $scope.checkoutData.billing.addressLine2 = address.addressLine2;
                $scope.checkoutData.billing.city = address.city;
                $scope.checkoutData.billing.state = address.state;
                $scope.checkoutData.billing.zip = address.zip;
                $scope.checkoutData.billing.name = address.first + ' ' + address.last;
                $scope.checkoutData.billing.phone = address.phone;

                //  Save it as the last selected bill address
                localStorage.setItem ('lastUserBillId', $scope.checkoutData.shipping.id);
                $scope.setUseShippingLabel (address);
            }

            $scope.expand.shipAddress = false;

        } else {
            //  Update the bill address
            $scope.checkoutData.billing.address = address.addressLine1 + ', ' + address.city + ", " + address.state + ' ' + address.zip;
            $scope.checkoutData.billing.id = address.addressId;
            $scope.checkoutData.billing.addressLine1 = address.addressLine1;
            $scope.checkoutData.billing.addressLine2 = address.addressLine2;
            $scope.checkoutData.billing.city = address.city;
            $scope.checkoutData.billing.state = address.state;
            $scope.checkoutData.billing.zip = address.zip;
            $scope.checkoutData.billing.name = address.first + ' ' + address.last;
            $scope.checkoutData.billing.phone = address.phone;

            //  Save it as the last selected bill address
            localStorage.setItem ('lastUserBillId', $scope.checkoutData.billing.id);
            $scope.setUseShippingLabel (address);

            $scope.expand.billAddress = false;
        }

        $scope.dataChanged ();
    });

    /*  Triggered when creditcard is selected in the dropdown creditcard list  */
    $rootScope.$on ('creditCardSelectionChanged', function (event, data) {
        var creditcard = data.selCreditCard;
        $scope.checkoutData.card.number = '*' + creditcard.number;
        $scope.checkoutData.card.expiry = creditcard.expMonth + '/' + creditcard.expYr;
        $scope.checkoutData.card.cvc = '';
        $scope.checkoutData.card.type = creditcard.type.toLowerCase ();
        $scope.checkoutData.card.notes = creditcard.notes;
        $scope.checkoutData.card.id = creditcard.id;
        $scope.checkoutData.ccType = creditcard.type.toLowerCase ();

        $scope.existingCC = true;
        $scope.expand.creditCard = false;

        //  Save it as the last selected creditcard
        localStorage.setItem ('lastUserCCId', $scope.checkoutData.card.id);
        $scope.dataChanged ();
    });

    $scope.$on ('$viewContentLoaded', function () {
        if ($scope.checkoutForm) {
            if ($scope.visaCheckoutMode) {
                init ();
            } else if ($scope.checkoutData.sessionUser) {
                if ($scope.normalCheckoutMode) {
                    $scope.checkoutData.useShipAsBill = (!$scope.shipToStoreAttr && !$scope.bopisOnlyAttr);
                }
                var useShipAsBillVal = localStorage.getItem ('useShipAsBill');
                if (useShipAsBillVal) {
                    $scope.checkoutData.useShipAsBill = (useShipAsBillVal === 'true');
                }
                //  Initialize Registered User Data
                if (!$scope.profile) {
                    $scope.isLoading = true;
                    $scope.processingMessage = $translate.instant ('CHK_UPD_ORDER_MSG');
                    Profile.profileAgg ().then (function (response) {
                        $scope.isLoading = false;
                        $scope.profile = response;
                        if (!$scope.profile) {
                            $scope.submittingOrder = false;
                            $scope.shipError = 'We\'re sorry that we were unable to obtain your profile data.  Please enter your information to checkout.';
                            return;
                        }
                        $scope.initRegisteredUser ($scope.profile);
                    }, function (error) {
                        $scope.isLoading = false;
                        console.log ('error getting profile', error);
                        return;
                    });
                } else {
                    $scope.initRegisteredUser ($scope.profile);
                }
            } else {
                //  Restore guest session data, if any
                getGuestData ();

                init ();
                $scope.dataChanged ();
            }
        }
    });

    $scope.$watch ('shippingData.deliveryLocation', function (location) {
        var cart = $scope.checkoutData.cart;
        var data = $scope.shippingData;
        if (data && location && cart) {
            angular.forEach (cart.productsInCart, function (item) {
                var that = angular.extend ({}, item);
                that.shippinginfo = normalizeAddressFields (data);
                Analytics.cartItemCTA (that, 'shippingmethodchange');
            });
        }
    });

    //  Compare the checkout data to previous copy
    var isEquivalent = function () {

        if (!$scope.oldData || $scope.oldData === null) {
            return false;
        }
        if ($scope.checkoutData.eMailAddr !== $scope.oldData.eMailAddr) {
            return false;
        }
        if ($scope.checkoutData.shippingName !== $scope.oldData.shippingName) {
            return false;
        }
        if ($scope.checkoutData.shippingPhone !== $scope.oldData.shippingPhone) {
            return false;
        }
        if (!angular.equals ($scope.checkoutData.shipping, $scope.oldData.shipping)) {
            return false;
        }
        if (!angular.equals ($scope.checkoutData.billing, $scope.oldData.billing)) {
            return false;
        }
        if (!angular.equals ($scope.checkoutData.card, $scope.oldData.card)) {
            return false;
        }
        if ($scope.checkoutData.useShipAsBill !== $scope.oldData.useShipAsBill) {
            return false;
        }
        if ($scope.checkoutData.pickupName !== $scope.oldData.pickupName) {
            return false;
        }
        if ($scope.checkoutData.pickupPhone !== $scope.oldData.pickupPhone) {
            return false;
        }
        return true;
    };

    var normalizeAddressFields = function (address) {
        var sfxMap = {
            method : 'deliveryLocation',
            address1 : 'Address1',
            address2 : 'Address2',
            city : 'City',
            state : 'State',
            zip : 'ZipCode',
            phone : 'Phone',
            storeId : 'StoreNumber',
        };

        var result = {};
        angular.forEach (Object.keys (sfxMap), function (key) {
            var pattern = new RegExp (sfxMap[key] + '$');
            angular.forEach (Object.keys (address), function (field) {
                if (pattern.test (address[field])) {
                    result[key] = address[field];
                }
            });
        });
        return result;
    };

    var init = function () {

        if ($scope.normalCheckoutMode) {
            $scope.checkoutData.useShipAsBill = (!$scope.shipToStoreAttr && !$scope.bopisOnlyAttr);
        }
        var useShipAsBillVal = localStorage.getItem ('useShipAsBill');
        if (useShipAsBillVal) {
            $scope.checkoutData.useShipAsBill = (useShipAsBillVal === 'true');
        }

        $scope.checkoutData.cart = Cart.getThisCart ();
        //  Get the current instance
        if (!$scope.checkoutData.cart) {

            $scope.processingMessage = $translate.instant ('CHK_UPD_ORDER_MSG');
            $scope.isLoading = true;

            //  If not available, call the api to get the cart
            Cart.getCartFromBackend ().then (function (response) {
                $scope.isLoading = false;
                if (response) {
                    try {
                        sessionStorage.cartErrorTrys = '0';
                    } catch (e) {
                        console.log ('error setting sessionStorage for cartErrorTrys' + e);
                    }
                    $scope.checkoutData.cart = response;
                    if ($scope.checkoutData.cart) {
                        Cart.setThisCart ($scope.checkoutData.cart);
                        initializeFromCart ();
                    }
                }
            }, function (error) {
                $scope.isLoading = false;
                var trys = 0;
                try {
                    trys = sessionStorage.cartErrorTrys;
                    if (trys === undefined) {
                        trys = 0;
                    }
                } catch (e) {
                    console.log ('error getting sessionStorage for cartErrorTrys' + e);
                    trys = 0;
                }
                var numTrys = parseInt (trys);
                if (numTrys <= 0) {
                    $rootScope.error ('Sorry, there was an error retrieving the cart for checkout.  You can retry once.', retryAction);
                    numTrys++;
                    try {
                        sessionStorage.cartErrorTrys = numTrys.toString ();
                    } catch (e) {
                        console.log ('error setting sessionStorage for cartErrorTrys' + e);
                    }
                } else {
                    $rootScope.error ('Sorry, there was an error retrieving the cart for checkout.  Please contact Staples support.', retryNoAction);
                    try {
                        sessionStorage.cartErrorTrys = '0';
                    } catch (e) {
                        console.log ('error setting sessionStorage for cartErrorTrys' + e);
                    }
                }
                return;
            });
        } else {
            initializeFromCart ();
        }

        if (VisaCheckout.continueVisaCheckout ()) {
            processVisaCheckoutPayment ();
        }
    };

    var retryAction = {
        title : 'Reload',
        callback : function () {
            window.setTimeout (function () {
                document.location.reload ();
            }, 200);
        }
    };

    var retryNoAction = {
        title : 'OK',
        callback : function () {
            $rootScope.toRoute ('cart');
        }
    };

    var initializeFromCart = function () {

        $scope.shipToStoreAttr = (localStorage.getItem ('shipAllToStore') === 'true');
        if ($scope.shipToStoreAttr) {
            //  do this early as it affects logic
            $scope.checkoutData.useShipAsBill = false;
        }

        if (!$scope.shipToStoreAttr && !Cart.isAddOnProductReady ()) {
            $rootScope.toRoute ('cart');
            return;
        }
        var savedFormData = getSavedFormData ();
        if (savedFormData) {
            $scope.checkoutData = savedFormData;
            $scope.billingDataEntryComplete = $scope.paymentDataEntryComplete = true;
        }

        if (($scope.checkoutData.shipping.addressLine1.trim () !== '') &&
            ($scope.checkoutData.shipping.city.trim () !== '') &&
            ($scope.checkoutData.shipping.state.trim () !== '') &&
            ($scope.checkoutData.shipping.zip.trim () !== '')) {
            $scope.hasShipData = true;
        } else {
            $scope.hasShipData = false;
        }
        if (($scope.checkoutData.billing.addressLine1.trim () !== '') &&
            ($scope.checkoutData.billing.city.trim () !== '') &&
            ($scope.checkoutData.billing.state.trim () !== '') &&
            ($scope.checkoutData.billing.zip.trim () !== '')) {
            $scope.hasBillData = true;
        } else {
            $scope.hasBillData = false;
        }

        if ($scope.shipToStoreAttr) {
            $scope.getShippingData ();
        }

        //  Set Cart (including bopis) Attributes
        $scope.cartCountSpecialSkus ();

        //  Check cases where Guest User cannot checkout
        var hasAppleProd = false;
        var esdItemCount = 0;
        if (($scope.AppleProdAttr || $scope.ESDAnyAttr) && (!$scope.checkoutData.sessionUser)) {
            //  Guest User cannot checkout under these conditions
            $scope.canCheckout = false;
            return;
        }
        $scope.checkoutData.orderTotal = parseFloat ($scope.checkoutData.cart.preTaxTotal);
        $scope.preTaxTotal = $scope.checkoutData.cart.preTaxTotal;

        if ($scope.shipToStoreAttr || $scope.checkoutData.cart.freeDelivery) {
            $scope.checkoutData.shippingFee = parseFloat (0.00);
        } else if ($scope.checkoutData.cart.delivery === 'Free') {
            $scope.checkoutData.shippingFee = parseFloat (0.00);
        } else {
            $scope.checkoutData.shippingFee = parseFloat ($scope.checkoutData.cart.delivery);
        }

        $scope.checkoutData.subtotal = parseFloat ($scope.checkoutData.cart.subTotal);
        for (var i in $scope.checkoutData.cart.Coupon) {
            $scope.checkoutData.couponRewardsTotal += parseFloat ($scope.checkoutData.cart.Coupon[i].adjustedAmount);
        }

        if ($scope.shipToStoreAttr) {
            $scope.checkoutData.orderTotal = $scope.checkoutData.subtotal + $scope.checkoutData.couponRewardsTotal;
        } else {
            $scope.checkoutData.handling = $scope.checkoutData.cart.totalHandlingCost;
        }

        if ($scope.shipToStoreAttr) {
            //  set the Store Address
            $scope.setStoreAddress ();  //  too early to set fields
        }

        $scope.initializing = false;

        if ($scope.profile && $scope.profile.storedAddressCount === 0) {
            if ($scope.shipToStoreAttr || $scope.bopisOnlyAttr) {
                $scope.expand.billAddress = true;
                $scope.checkoutData.addressMode = '2';
            } else {
                $scope.expand.shipAddress = true;
                $scope.checkoutData.addressMode = '1';
            }
            localStorage.setItem ('addressMode', $scope.checkoutData.addressMode);
        }

        var shipping = $scope.checkoutData.shippingFee || 0.00;
        var handling = $scope.checkoutData.handling || 0.00;
        InsideChat.trackerCheckout ($scope.checkoutData.cart, $scope.checkoutData.orderTotal, $scope.checkoutData.tax || 0.00, parseFloat (shipping) + parseFloat (handling));

        $scope.dataChanged();
    };

    $scope.cartCountSpecialSkus = function () {
        var ISPCount = 0;
        var STACount = 0;
        var ESDCount = 0;
        var AppleCount = 0;
        $scope.bopisStoreNums = new Array ();
        $scope.bopisStoreAddresses = new Array ();
        $scope.pickupStores = new Array ();

        var storesArray = new Array ();
        if ($scope.checkoutData.cart) {
            var items = {};
            items = $scope.checkoutData.cart.productsInCart;
            angular.forEach (items, function (i) {
                if (i.isAppleProduct === true) {
                    AppleCount++;
                } else if (i.esd === true) {
                    ESDCount++;
                } else if (i.bopis === 'true' && i.shippingInfo && i.shippingInfo.deliveryModeSelected === 'ISP') {
                    var storeNum = i.shippingInfo.deliveryAddressSelected.storeNumber;
                    if ($scope.bopisStoreNums.indexOf (storeNum) === -1) {
                        //  only keep unique stores
                        $scope.bopisStoreNums.push (storeNum);
                        $scope.bopisStoreAddresses.push (i.shippingInfo.deliveryAddressSelected.city + ', ' + i.shippingInfo.deliveryAddressSelected.state);
                        $scope.pickupStores.push (i.shippingInfo.deliveryAddressSelected);
                    }
                    ISPCount++;
                } else {
                    STACount = 0;
                }
            });
            $scope.bopisOnlyAttr = (ISPCount === items.length);
            $scope.bopisAnyAttr = (ISPCount > 0);
            $scope.ESDOnlyAttr = (ESDCount === items.length);
            $scope.ESDAnyAttr = (ESDCount > 0);
            $scope.AppleProdAttr = (AppleCount > 0);

            if ($scope.bopisStoreNums.length === 1) {
                $scope.bopisStoresLabel = 'Pickup at ' + $scope.bopisStoreAddresses[0];
            } else {
                $scope.bopisStoresLabel = 'Store Pickup (' + $scope.bopisStoreNums.length + ') locations';
            }
        }
    };

    $scope.initRegisteredUser = function (profile) {
        $scope.existingCC = false;
        $scope.checkoutData.addressMode = localStorage.getItem ('addressMode');

        var shipIdx = -1;
        var billIdx = 0;
        var ccIdx = -1;
        if (profile) {
            if (profile.storedAddressCount > 0 && $scope.checkoutData.shipping.address === '') {
                $scope.addresses = profile.addresses;

                //  See if there is a saved ID from previous instance
                var shipId = localStorage.getItem ('lastUserShipId');
                if (shipId) {
                    // find shipid in array
                    var newIdx = -1;
                    for (var i = 0; i < profile.addresses.length; i++) {
                        if (profile.addresses[i].addressId === shipId) {
                            newIdx = i;
                            break;
                        }
                    }
                    if (newIdx > 0) {
                        shipIdx = newIdx;
                    }
                }
                if (shipIdx < 0) {
                    shipIdx = 0;
                    //  When there are addresses, choose the 1st one
                }
                var preferedAddress = (profile.addresses || [{}])[shipIdx];
                if (preferedAddress) {
                    $scope.checkoutData.shippingName = preferedAddress.first + ' ' + preferedAddress.last;
                    $scope.checkoutData.shipping.address = $scope.formatAddress (preferedAddress);
                    //  Save the detail too
                    $scope.checkoutData.shipping.addressLine1 = preferedAddress.addressLine1;
                    $scope.checkoutData.shipping.addressLine2 = preferedAddress.addressLine2;
                    $scope.checkoutData.shipping.city = preferedAddress.city;
                    $scope.checkoutData.shipping.state = preferedAddress.state;
                    $scope.checkoutData.shipping.zip = preferedAddress.zip;
                    $scope.checkoutData.shippingPhone = preferedAddress.phone;
                    $scope.checkoutData.shipping.id = preferedAddress.addressId;

                    if (($scope.checkoutData.useShipAsBill || $scope.bopisOnlyAttr) && $scope.normalCheckoutMode) {
                        $scope.checkoutData.billing.name = preferedAddress.first + ' ' + preferedAddress.last;
                        $scope.checkoutData.billing.address = $scope.formatAddress (preferedAddress);
                        //  Save the detail too
                        $scope.checkoutData.billing.addressLine1 = preferedAddress.addressLine1;
                        $scope.checkoutData.billing.addressLine2 = preferedAddress.addressLine2;
                        $scope.checkoutData.billing.city = preferedAddress.city;
                        $scope.checkoutData.billing.state = preferedAddress.state;
                        $scope.checkoutData.billing.zip = preferedAddress.zip;
                        $scope.checkoutData.billing.phone = preferedAddress.phone;
                        $scope.checkoutData.billing.id = preferedAddress.addressId;
                    }
                }

                if ($scope.checkoutData.shipping.address) {
                    localStorage.setItem ('lastUserShipId', $scope.checkoutData.shipping.id);
                    if ($scope.checkoutData.useShipAsBill && $scope.normalCheckoutMode) {
                        localStorage.setItem ('lastUserBillId', $scope.checkoutData.shipping.id);
                    }
                    $scope.checkoutData.eMailAddr = profile.emailAddress;
                    $scope.checkoutForm.email.$valid = $scope.validate.email.test ($scope.checkoutData.eMailAddr);
                    $scope.checkoutForm.name.$valid = $scope.validate.name.test ($scope.checkoutData.shippingName);
                }

                if ($scope.normalCheckoutMode) {
                    //  See if there is a saved ID from previous instance
                    var billId = localStorage.getItem ('lastUserBillId');
                    if (billId && (profile.storedAddressCount > 0)) {
                        var newIdx = -1;
                        for (var i = 0; i < profile.addresses.length; i++) {
                            if (profile.addresses[i].addressId === billId) {
                                newIdx = i;
                                break;
                            }
                        }
                        billIdx = (newIdx > 0) ? newIdx : 0;
                    }
                    if (billIdx >= 0 && profile.storedAddressCount > 0 && profile.addresses) {
                        var preferedBillingAddress = (profile.addresses || [{}])[billIdx];
                        if (!$scope.checkoutData.useShipAsBill && $scope.normalCheckoutMode && preferedBillingAddress) {
                            $scope.checkoutData.billing.name = preferedBillingAddress.first + ' ' + preferedBillingAddress.last;
                            $scope.checkoutData.billing.address = $scope.formatAddress (preferedBillingAddress);
                            //  Save the detail too
                            $scope.checkoutData.billing.addressLine1 = preferedBillingAddress.addressLine1;
                            $scope.checkoutData.billing.addressLine2 = preferedBillingAddress.addressLine2;
                            $scope.checkoutData.billing.city = preferedBillingAddress.city;
                            $scope.checkoutData.billing.state = preferedBillingAddress.state;
                            $scope.checkoutData.billing.zip = preferedBillingAddress.zip;
                            $scope.checkoutData.billing.phone = preferedBillingAddress.phone;
                            $scope.checkoutData.billing.id = preferedBillingAddress.addressId;
                        }
                    }
                }

                if ($scope.checkoutData.billing) {
                    $scope.checkoutForm.billing_name.$valid = $scope.validate.name.test ($scope.checkoutData.billing.name);
                    if ($scope.checkoutData.billing.id && $scope.checkoutData.billing.id !== '') {
                        localStorage.setItem ('lastUserBillId', $scope.checkoutData.billing.id);
                    }
                }

                if ($scope.checkoutData.shipping.address) {
                    $scope.setUseShippingLabel ($scope.checkoutData.shipping);
                } else {
                    $scope.shortShipping = 'shipping';
                }
            }

            if (profile.creditCardCount > 0) {
                $scope.existingCC = true;
                $scope.creditcards = profile.creditCards;

                //  See if there is a saved ID from previous instance
                var ccId = localStorage.getItem ('lastUserCCId');
                if (ccId) {
                    var newIdx = -1;
                    for (var i = 0; i < profile.creditCards.length; i++) {
                        if (profile.creditCards[i].id === ccId) {
                            newIdx = i;
                            break;
                        }
                    }
                    if (newIdx >= 0) {
                        ccIdx = newIdx;
                    }
                }
                if (ccIdx < 0) {//  When there are creditcards, choose the 1st one
                    ccIdx = 0;
                }

                $scope.checkoutData.ccType = profile.creditCards[ccIdx].type.toLowerCase ();
                var icon = document.getElementById ('cctype_id_exist');
                if (icon) {
                    icon.className += ' ' + $scope.checkoutData.ccType;
                }
                $scope.checkoutData.card.number = '*' + profile.creditCards[ccIdx].number;
                $scope.checkoutForm.cardNum.$valid = true;
                $scope.checkoutData.card.expiry = profile.creditCards[ccIdx].expMonth + '/' + profile.creditCards[ccIdx].expYr;
                $scope.checkoutForm.expiry.$valid = true;
                $scope.checkoutForm.cvc.$valid = true;
                $scope.checkoutData.card.id = profile.creditCards[ccIdx].id;
                $scope.checkoutData.card.type = profile.creditCards[ccIdx].type;
                localStorage.setItem ('lastUserCCId', $scope.checkoutData.card.id);

                //  following for non-staples card
                var type = profile.creditCards[ccIdx].type.toLowerCase ();

                $scope.paymentData = {
                    expMonth : profile.creditCards[ccIdx].expMonth,
                    expYr : profile.creditCards[ccIdx].expYr,
                    id : profile.creditCards[ccIdx].id,
                    cvv : ''
                };
                $scope.paymentDataEntryComplete = false;        //  We will require the entry of cvv now.

            } else {
               $scope.paymentData = undefined;
            }
        }

        init ();
    };

    /*  Called from page when data is changed.
     *  See if we can update the shipping address, et al    */
    $scope.toggleChanged = function () {
        if (!$scope.checkoutData.sessionUser && !$scope.checkoutData.useShipAsBill) {
            //  Guest user who unchecks "use ship as bill" should clear the bill address
            $scope.checkoutData.billing.name = '';
            $scope.checkoutData.billing.address = '';
            $scope.checkoutData.billing.addressLine1 = '';
            $scope.checkoutData.billing.addressLine2 = '';
            $scope.checkoutData.billing.city = '';
            $scope.checkoutData.billing.state = '';
            $scope.checkoutData.billing.zip = '';

            $scope.billingData = {
                billingFirstName : '',
                billingLastName : '',
                billingCompanyName : '',
                billingPhone : '',
                billingPhoneExtension : '',
                billingAddress1 : '',
                billingAddress2 : '',
                billingCity : '',
                billingState : '',
                billingZipCode : '',
            };
        } else if ($scope.checkoutData.useShipAsBill) {
            $scope.checkoutData.billing = angular.merge ($scope.checkoutData.billing, $scope.checkoutData.shipping);
        }

        $scope.dataChanged ();

        localStorage.setItem ('useShipAsBill', $scope.checkoutData.useShipAsBill);
    };

    /*  Construct the address line from the address parts
     */
    $scope.formatAddress = function (addressObject) {
        var addressLine2 = '';
        if (addressObject.addressLine2 !== null && addressObject.addressLine2 !== undefined && addressObject.addressLine2.trim () !== '') {
            addressLine2 = ' ' + addressObject.addressLine2;
        }
        var fullAddress = addressObject.addressLine1 + addressLine2 + ' ' + addressObject.city + ' ' + addressObject.state + ' ' + addressObject.zip;
        return fullAddress.trim ();
    };

    /*  Called from page when data is changed.
     *  See if we can update the shipping address, et al
     */
    $scope.dataChanged = function ($event) {
        $scope.inputBlurred();

        if (!$scope.checkoutData.cart || $scope.initializing) {
            return;
        }

        if (isEquivalent ()) {
            return;     //  nothing in the model changed
        }
        $scope.oldData = angular.copy ($scope.checkoutData);

        localStorage.setItem ('useShipAsBill', $scope.checkoutData.useShipAsBill);
        $scope.getShippingData ();

        if ($scope.normalCheckoutMode) {
            //  Update billing data if you can
            $scope.getBillingData ();

            //  Is the payment data complete?
            $scope.paymentDataEntryComplete = $scope.existingCC && ($scope.checkoutData.card.cvc !== undefined && $scope.checkoutData.card.cvc !== '');
            if (!$scope.existingCC) {
                if ($scope.checkoutData.ccType && $scope.checkoutData.card.expiry && $scope.checkoutData.card.cvc) {
                    $scope.paymentDataEntryComplete = true;
                }
            }
            if (!$scope.paymentDataEntryComplete) {
                $scope.okToSubmitOrder = false;
            }
        }

        //  Any time data changes, save it in the session
        saveGuestData ();

        //  Can we update?
        if ($scope.shippingData && ($scope.visaCheckoutMode || ($scope.billingData && ($scope.paymentData || $scope.checkoutForm.cardNum.$valid && $scope.checkoutForm.expiry.$valid && $scope.checkoutForm.cvc.$valid)))) {
            $scope.performUpdates ();
        }
    };

    $scope.setUseShippingLabel = function (address) {
        if (address.addressLine1 !== null && address.addressLine1 !== undefined && address.addressLine1.trim () !== '') {
            $scope.shortShipping = address.addressLine1 + ' ' + address.city + ', ' + address.state + ' ' + address.zip;
            if ($scope.shortShipping.length > 28) {
                $scope.shortShipping = $scope.shortShipping.substring (0, 28) + ' ...';
            }
        }
    };

    $scope.getShippingData = function () {

        if ($scope.checkoutData.useShipAsBill && $scope.shipToStoreAttr) {
            $scope.checkoutData.useShipAsBill = false;

        } else if ($scope.checkoutData.useShipAsBill && $scope.bopisOnlyAttr) {
            $scope.checkoutData.useShipAsBill = false;
        }

        //  Validate email address
        if ($scope.checkoutForm) {
            $scope.checkoutForm.email.$valid = $scope.validate.email.test ($scope.checkoutData.eMailAddr);
        }

        //  Get Ship-To-Store settings
        var shipToStore = null;
        if ($scope.shipToStoreAttr) {
            shipToStore = JSON.parse (localStorage.getItem ('shipToStoreAddress'));
        }
        if (shipToStore) {
            if (!shipToStore.zipCode) {
                shipToStore.zipCode = '';
            }
            $scope.checkoutData.shipping.address = shipToStore.address + ', ' + shipToStore.city + ', ' + shipToStore.state + ' ' + shipToStore.zipCode + ' (' + shipToStore.storeNumber + ')';

            //  Save the detail too
            $scope.checkoutData.shipping.addressLine1 = shipToStore.address;
            $scope.checkoutData.shipping.addressLine2 = '';
            $scope.checkoutData.shipping.city = shipToStore.city;
            $scope.checkoutData.shipping.state = shipToStore.state;
            $scope.checkoutData.shipping.zip = shipToStore.zipCode;

            //if (shipToStore.address && $scope.checkoutForm) {
            //    $scope.checkoutForm.address.$valid = true;
            //}

            //  No regular shipping should be collected
            $scope.checkAndUpdateStoreShippingAddress (shipToStore);

        } else if ($scope.bopisOnlyAttr) {
            //  This is an ALL BOPIS Cart,
            //  No shipping should be collected
            $scope.checkAndUpdateBOPISPickup ();

        } else if ($scope.bopisAnyAttr) {
            //  This is an Mixed Bopis Cart,
            //  We need shipping and Pickup
            $scope.checkAndUpdateBOPISPickup ();
            //  Save the shipping data off to a separate field
            //  because we also have to get actual shipping data
            $scope.addtlPickupData = $scope.shippingData;
            //  Now get the actual shipping data
            $scope.checkAndUpdateShippingAddress ();

        } else {
            //  Cart has only ship-to-address items
            $scope.checkAndUpdateShippingAddress ();
        }
    };

    $scope.setStoreAddress = function () {

        if ($scope.checkoutData.useShipAsBill && $scope.shipToStoreAttr) {
            $scope.checkoutData.useShipAsBill = false;
        }

        //  Get Ship-To-Store settings
        var shipToStore = null;
        if ($scope.shipToStoreAttr) {
            shipToStore = JSON.parse (localStorage.getItem ('shipToStoreAddress'));
        }
        if (shipToStore) {
            if (!shipToStore.zipCode) {
                shipToStore.zipCode = '';
            }
            $scope.checkoutData.shipping.address = shipToStore.address + ', ' + shipToStore.city + ', ' + shipToStore.state + ' ' + shipToStore.zipCode + ' (' + shipToStore.storeNumber + ')';

            //  Save the detail too
            $scope.checkoutData.shipping.addressLine1 = shipToStore.address;
            $scope.checkoutData.shipping.addressLine2 = '';
            $scope.checkoutData.shipping.city = shipToStore.city;
            $scope.checkoutData.shipping.state = shipToStore.state;
            $scope.checkoutData.shipping.zip = shipToStore.zipCode;
        }
    };

    var getAddressForId = function (addressId) {
        var address;
        if ($scope.profile && $scope.profile.storedAddressCount > 0) {
            for (var i = 0; i < $scope.profile.addresses.length; i++) {
                if ($scope.profile.addresses[i].addressId === addressId) {
                    address = $scope.profile.addresses[i];
                    break;
                }
            }
            return address;
        }
    };

    /*  Creates the Billing Address api Request
     *  Body Json as needed from various places
     */
    $scope.getBillingData = function () {
        $scope.shipError = '';
        $scope.billingData = null;

        if ($scope.checkoutData.useShipAsBill && $scope.bopisOnlyAttr) {
            $scope.checkoutData.useShipAsBill = false;
        }

        //  force validation in the form
        if ($scope.checkoutForm) {
            $scope.checkoutForm.billing_name.$valid = $scope.validate.name.test ($scope.checkoutData.billing.name);
        }

        if ($scope.checkoutData.useShipAsBill) {
            //  Setup billPlace in case user
            //  changes to switch use Diff Bill Addr
            $scope.checkoutData.billing = angular.merge ($scope.checkoutData.billing, $scope.checkoutData.shipping);

            $scope.billingDataEntryComplete = $scope.shippingDataEntryComplete;
            $scope.hasBillData = $scope.hasShipData;

            //  Split name up
            var first = '';
            var last = $scope.checkoutData.shippingName;
            if ($scope.checkoutData.shippingName > '') {
                var idx = $scope.checkoutData.shippingName.indexOf (' ');
                if (idx > 0) {
                    //  this will take care of names like 'van damme'
                    first = $scope.checkoutData.shippingName.substring (0, idx).trim ();
                    last = $scope.checkoutData.shippingName.substring (idx).trim ();
                }
            }
            $scope.billingData = {
                billingFirstName : first,
                billingLastName : last,
                billingCompanyName : '',
                billingPhone : $scope.checkoutData.shippingPhone,
                billingPhoneExtension : '',
                billingAddress1 : $scope.checkoutData.shipping.addressLine1,
                billingAddress2 : $scope.checkoutData.shipping.addressLine2,
                billingCity : $scope.checkoutData.shipping.city,
                billingState : $scope.checkoutData.shipping.state,
                billingZipCode : $scope.checkoutData.shipping.zip
            };

            //  We can only set the id if the name or phone didn't change,
            //  otherwise, we need to create a new address
            if ($scope.checkoutData.shipping.id && $scope.checkoutData.shipping.id !== '') {
                //  get data for shipping address
                var address = getAddressForId ($scope.checkoutData.shipping.id);
                if (address) {
                    if (address.first === first && address.last === last && address.phone === $scope.checkoutData.shippingPhone) {
                        //  no change, ok to set id
                        $scope.billingData.billingAddressId = $scope.checkoutData.shipping.id;
                    }
                }
            }

        } else {
            if ($scope.checkoutData) {

                //  Get the address input field
                var dirInput = document.getElementById ('guestBillId');
                var inputFld;
                if (dirInput) {
                    inputFld = angular.element (dirInput).find ('input');
                }
                //  check full address against the parts of the address.
                //  Address Line 1 should start the address string
                if ($scope.checkoutData.billing.addressLine1 > '' && $scope.checkoutData.billing.address.indexOf ($scope.checkoutData.billing.addressLine1) === 0) {
                    if (inputFld) {
                        angular.element (inputFld[0]).removeClass ('ng-invalid');
                    }
                } else {
                    if (inputFld) {
                        angular.element (inputFld[0]).addClass ('ng-invalid');
                        $scope.hasBillData = false;
                        return;
                    }
                }

                if (($scope.checkoutData.billing.addressLine1.trim () !== '') && ($scope.checkoutData.billing.city.trim () !== '') && ($scope.checkoutData.billing.state.trim () !== '') && ($scope.checkoutData.billing.zip.trim () !== '') && ($scope.checkoutData.billing.name && $scope.checkoutData.billing.name.trim () !== '') && ($scope.checkoutData.billing.phone && $scope.checkoutData.billing.phone.trim () !== '')) {
                    $scope.hasBillData = true;
                    $scope.billingDataEntryComplete = true;
                } else {
                    $scope.hasBillData = false;
                    $scope.billingDataEntryComplete = false;
                    $scope.okToSubmitOrder = false;
                    return;
                }
            }

            //  Split name up
            var first = '';
            var last = $scope.checkoutData.billing.name;
            if ($scope.checkoutData.billing.name > '') {
                var idx = $scope.checkoutData.billing.name.indexOf (' ');
                if (idx > 0) {
                    //  this will take care of names like 'van damme'
                    first = $scope.checkoutData.billing.name.substring (0, idx).trim ();
                    last = $scope.checkoutData.billing.name.substring (idx).trim ();
                }
            }
            $scope.billingData = {
                billingFirstName : first,
                billingLastName : last,
                billingCompanyName : '',
                billingPhone : $scope.checkoutData.billing.phone,
                billingPhoneExtension : '',
                billingAddress1 : $scope.checkoutData.billing.addressLine1,
                billingAddress2 : $scope.checkoutData.billing.addressLine2,
                billingCity : $scope.checkoutData.billing.city,
                billingState : $scope.checkoutData.billing.state,
                billingZipCode : $scope.checkoutData.billing.zip
            };
            //  We can only set the id if the name or phone didn't change,
            //  otherwise, we need to create a new address
            if ($scope.checkoutData.billing.id && $scope.checkoutData.billing.id !== '') {
                //  get data for billing address
                var address = getAddressForId ($scope.checkoutData.billing.id);
                if (address) {
                    if (address.first === first && address.last === last && address.phone === $scope.checkoutData.billing.phone) {
                        //  no change, ok to set id
                        $scope.billingData.billingAddressId = $scope.checkoutData.billing.id;
                    }
                }
            }
        }

        if ($scope.billingData) {
            var addressLine2 = '';
            if ($scope.billingData.billingAddress2 !== null && $scope.billingData.billingAddress2 !== undefined && $scope.billingData.billingAddress2.trim () !== '') {
                addressLine2 = ' ' + $scope.billingData.billingAddress2;
            }
            $scope.checkoutData.billing.address = $scope.billingData.billingAddress1 + addressLine2 + " " + $scope.billingData.billingCity + " " + $scope.billingData.billingState + ' ' + $scope.billingData.billingZipCode;
            $scope.checkoutData.billing.address = $scope.checkoutData.billing.address.trim ();

            //  Save the detail too
            $scope.checkoutData.billing.addressLine1 = $scope.billingData.billingAddress1;
            $scope.checkoutData.billing.addressLine2 = addressLine2.trim ();
            $scope.checkoutData.billing.city = $scope.billingData.billingCity;
            $scope.checkoutData.billing.state = $scope.billingData.billingState;
            $scope.checkoutData.billing.zip = $scope.billingData.billingZipCode;
            $scope.checkoutData.billing.phone = $scope.billingData.billingPhone;
            $scope.checkoutData.billing.name = $scope.billingData.billingFirstName + ' ' + $scope.billingData.billingLastName;
        }

        if (($scope.checkoutData.billing.addressLine1.trim () !== '') && ($scope.checkoutData.billing.city.trim () !== '') && ($scope.checkoutData.billing.state.trim () !== '') && ($scope.checkoutData.billing.zip.trim () !== '')) {
            $scope.hasBillData = true;
        } else {
            $scope.hasBillData = false;
        }
    };

    /*  Creates the Shipping Address api Request
     *  Body Json as needed when BOPIS-ONLY cart
     *  and needed to update pickup person name
     */
    $scope.checkAndUpdateBOPISPickup = function () {

        if ($scope.checkoutForm && ($scope.checkoutForm.billing_name.$valid || $scope.checkoutForm.pickupname.$valid) && $scope.checkoutForm.email.$valid && $scope.checkoutForm.pickupname.$valid) {
            $scope.shippingDataEntryComplete = true;
        } else {
            $scope.shippingDataEntryComplete = false;
            $scope.okToSubmitOrder = false;
            return;
        }

        //  get the name to use for pickup
        var name = $scope.checkoutData.pickupName;
        if (name) {
            name = String (name).trim ();
        }
        if (!name || (String (name) === '')) {//  No shipping name
            name = $scope.checkoutData.shippingName;
        }
        if (!name || (String (name) === '')) {//  No shipping name, check the form value
            name = $scope.checkoutForm.name.$modelValue;
        }
        if (!name || (String (name) === '')) {
            return; // Not enough data;
        }

        var first = '';
        var last = name;
        if (name > '') {
            var idx = name.indexOf (' ');
            if (idx > 0) {
                //  this will take care of names like 'van damme'
                first = name.substring (0, idx).trim ();
                last = name.substring (idx).trim ();
            }
        }

        //  Get phone
        var phone = $scope.checkoutData.pickupPhone;
        if (phone) {
            phone = String (phone).trim ();
        }
        if (!phone || (String (phone) === '')) {
            phone = $scope.checkoutData.shippingPhone;
        }
        if (!phone || (String (phone) === '')) {//  No shipping phone, check the form value
            phone = $scope.checkoutForm.phone.$modelValue;
        }
        if (!phone || (String (phone) === '')) {
            return;     // Not enough data;
        }
        $scope.shippingData = {
            deliveryLocation : 'pickUpInStore', //  constant
            emailAddress : $scope.checkoutData.eMailAddr,
            reenterEmailAddress : $scope.checkoutData.eMailAddr,
            pickupContactFirstName : first,
            pickupContactLastName : last,
            pickupContactPhoneNumber : phone
        };

    };

    /*  Creates the Shipping Address api Request
     *  Body Json as needed when Ship-To-Store is
     *  selected for Checkout.
     *  Note:  Do not call when cart is all BOPIS and/or ESD.
     */
    $scope.checkAndUpdateStoreShippingAddress = function (shipToStore) {

        if ($scope.checkoutForm && $scope.checkoutForm.name.$valid &&
        //$scope.checkoutForm.phone.$valid &&
        $scope.checkoutForm.email.$valid) {
            $scope.shippingDataEntryComplete = true;
        } else {
            $scope.shippingDataEntryComplete = false;
            $scope.okToSubmitOrder = false;
            return;
        }

        var first = '';
        var last = $scope.checkoutData.shippingName;
        if ($scope.checkoutData.shippingName > '') {
            var idx = $scope.checkoutData.shippingName.indexOf (' ');
            if (idx > 0) {
                //  this will take care of names like 'van damme'
                first = $scope.checkoutData.shippingName.substring (0, idx).trim ();
                last = $scope.checkoutData.shippingName.substring (idx).trim ();
            }
        }

        //  Create shipping data
        $scope.shippingData = {
            deliveryLocation : 'shiptostore',
            shipToStoreFirstName : first,
            shipToStoreLastName : last,
            shipToStorePhone : $scope.checkoutData.shippingPhone,
            shipToStoreAddress1 : shipToStore.address,
            shipToStoreCity : shipToStore.city,
            shipToStoreState : shipToStore.state,
            shipToStoreZipCode : shipToStore.zipCode,
            shipToStoreNumber : shipToStore.storeNumber
        };

        if (MobileService.getSessionState () !== 'registered') {
            //  Guest
            $scope.shippingData.emailAddress = $scope.checkoutData.eMailAddr;
            $scope.shippingData.reenterEmailAddress = $scope.checkoutData.eMailAddr;
        }

        //  Save data for confirmation page
        $scope.checkoutData.shipName = $scope.shippingData.shipToStoreFirstName + ' ' + $scope.shippingData.shipToStoreLastName;
        $scope.checkoutData.shipAddr = $scope.shippingData.shipToStoreAddress1 + ', ' + $scope.shippingData.shipToStoreCity + ', ' + $scope.shippingData.shipToStoreState + ' ' + $scope.shippingData.shipToStoreZipCode;

        //  Create billing data
        $scope.checkoutData.useShipAsBill = false;
    };

    /*  Creates the Shipping Address api Request
     *  Body Json as needed for Checkout.
     *  Note:  Do not call when cart is all BOPIS and/or ESD.
     */
    $scope.checkAndUpdateShippingAddress = function () {

        $scope.shipError = '';

        //  Get the address input field
        var dirInput = document.getElementById ('guestShipId');
        var inputFld;
        if (dirInput) {
            inputFld = angular.element (dirInput).find ('input');
        }
        //  check full address against the parts of the address.
        //  Address Line 1 should start the address string
        if ($scope.checkoutData.shipping.addressLine1 > '' && $scope.checkoutData.shipping.address.indexOf ($scope.checkoutData.shipping.addressLine1) === 0) {
            if (inputFld) {
                angular.element (inputFld[0]).removeClass ('ng-invalid');
            }
        } else {
            if (inputFld) {
                angular.element (inputFld[0]).addClass ('ng-invalid');
                $scope.hasShipData = false;
                return;
            }
        }

        if (($scope.checkoutData.shipping.addressLine1.trim () !== '') && ($scope.checkoutData.shipping.city.trim () !== '') && ($scope.checkoutData.shipping.state.trim () !== '') && ($scope.checkoutData.shipping.zip.trim () !== '')) {
            $scope.hasShipData = true;
        } else {
            $scope.hasShipData = false;
        }

        if ($scope.checkoutForm && $scope.checkoutForm.name.$valid &&
        //$scope.checkoutForm.phone.$valid &&
        $scope.checkoutForm.email.$valid && $scope.hasShipData) {
            $scope.shippingDataEntryComplete = true;
        } else {
            $scope.shippingDataEntryComplete = false;
            $scope.okToSubmitOrder = false;
            return;
        }

        if (!$scope.checkoutForm.name.$valid) {
            return;
        } else if (!$scope.checkoutForm.email.$valid) {
            return;
            // } else if (!$scope.checkoutForm.phone.$valid) {
            //    return;
        }

        var first = '';
        var last = $scope.checkoutData.shippingName;
        if ($scope.checkoutData.shippingName > '') {
            var idx = $scope.checkoutData.shippingName.indexOf (' ');
            if (idx > 0) {
                //  this will take care of names like 'van damme'
                first = $scope.checkoutData.shippingName.substring (0, idx).trim ();
                last = $scope.checkoutData.shippingName.substring (idx).trim ();
            }
        }
        if (!first || !last) {
            return;
        }

        $scope.shippingData = {
            deliveryLocation : 'shiptohome',
            deliveryFirstName : first,
            deliveryLastName : last,
            deliveryCompanyName : '',
            deliveryPhone : $scope.checkoutData.shippingPhone,
            deliveryPhoneExtension : '',
            deliveryAddress1 : $scope.checkoutData.shipping.addressLine1,
            deliveryAddress2 : $scope.checkoutData.shipping.addressLine2,
            deliveryCity : $scope.checkoutData.shipping.city,
            deliveryState : $scope.checkoutData.shipping.state,
            deliveryZipCode : $scope.checkoutData.shipping.zip
        };
        //  We can only set the id if the name or phone didn't change,
        //  otherwise, we need to create a new address
        if ($scope.checkoutData.shipping.id && $scope.checkoutData.shipping.id !== '') {
            //  get data for shipping address
            var address = getAddressForId ($scope.checkoutData.shipping.id);
            if (address) {
                if (address.first === first && address.last === last && address.phone === $scope.checkoutData.shippingPhone) {
                    //  no change, ok to set id
                    $scope.shippingData.shippingAddressId = $scope.checkoutData.shipping.id;
                }
            }
        }

        //  Save data for confirmation page
        if (!$scope.shippingData.deliveryAddress2) {
            $scope.shippingData.deliveryAddress2 = '';
        }
        $scope.checkoutData.shipName = $scope.shippingData.deliveryFirstName + ' ' + $scope.shippingData.deliveryLastName;

        if (MobileService.getSessionState () !== 'registered') {
            //  Guest
            $scope.shippingData.emailAddress = $scope.checkoutData.eMailAddr;
            $scope.shippingData.reenterEmailAddress = $scope.checkoutData.eMailAddr;
        }

        if ($scope.shippingData) {
            var addressLine2 = '';
            if ($scope.shippingData.deliveryAddress2 !== null && $scope.shippingData.deliveryAddress2 !== undefined && $scope.shippingData.deliveryAddress2.trim () !== '') {
                addressLine2 = ' ' + $scope.shippingData.deliveryAddress2;
            }
            $scope.checkoutData.shipping.address = $scope.shippingData.deliveryAddress1 + addressLine2 + " " + $scope.shippingData.deliveryCity + " " + $scope.shippingData.deliveryState + ' ' + $scope.shippingData.deliveryZipCode;
            $scope.checkoutData.shipping.address = $scope.checkoutData.shipping.address.trim ();

            //  Save the detail too
            $scope.checkoutData.shipping.addressLine1 = $scope.shippingData.deliveryAddress1;
            $scope.checkoutData.shipping.addressLine2 = addressLine2.trim ();
            $scope.checkoutData.shipping.city = $scope.shippingData.deliveryCity;
            $scope.checkoutData.shipping.state = $scope.shippingData.deliveryState;
            $scope.checkoutData.shipping.zip = $scope.shippingData.deliveryZipCode;

            $scope.checkoutData.shipAddr = $scope.checkoutData.shipping.address;
        }

        $scope.setUseShippingLabel ($scope.checkoutData.shipping.address);
    };

    $scope.clearLocalStorage = function () {
        localStorage.removeItem ('shipAllToStore');
        localStorage.removeItem ('useShipAsBill');
        localStorage.removeItem ('addressMode');
        localStorage.removeItem ('lastUserShipId');
        localStorage.removeItem ('lastUserBillId');
        localStorage.removeItem ('lastUserCCId');
    };

    $scope.submitOrder = function () {

        $scope.processingMessage = $translate.instant ('CHK_SUB_ORDER_MSG');
        $scope.isLoading = true;
        $scope.submittingOrder = true;
        var order;
        if ($scope.visaCheckoutMode) {
            order = {
                callId : VisaCheckout.getCallId (),
                paymentType : '1',
                authorized : 'Y',
                cardVerificationCode : ''
            };
            $scope.checkoutData.ccType = 'visacheckout';

        } else if ($scope.paymentData.cvv) {
            order = {
                cardVerificationCode : $scope.paymentData.cvv
            };
        }

        Checkout.submitOrder (order).then (function (response) {
            $scope.isLoading = false;
            $scope.checkoutData.staplesOrderNum = response.data.staplesOrderNumber;
            $scope.checkoutData.orderId = response.data.orderId;
            Checkout.setInfo ($scope.checkoutData);
            $rootScope.setCartCount (0);
            $scope.clearLocalStorage ();
            $rootScope.toRoute ('confirmorder');
        }, function (error) {
            $scope.isLoading = false;
            $scope.submittingOrder = false;
            $scope.shipError = $scope.handleErrorObject (error);
        });
    };

    var reSendShippingAddress = false;

    /* Perform all the api calls required to submit an order
     */
    $scope.performUpdates = function () {

        if (disableUpdatesForVisa)
            return;

        if (!$scope.shippingDataEntryComplete || !$scope.billingDataEntryComplete || !$scope.paymentDataEntryComplete) {
            //  Don't try to update if data entry not complete
            $scope.okToSubmitOrder = false;
            return;
        }

        try {
            if (NuData.enabled && typeof nds !== "undefined") {
                nds.send();
            }
        } catch(ex) {
            console.log ('error accessing NuData nds.send(), exception was ' + ex);
        }

        $scope.isLoading = true;

        $scope.preCheckoutCalled = false;
        $scope.inPreCheckoutCall = false;
        $scope.paymentLoaded = false;
        $scope.shipAddressUpdated = false;
        $scope.billAddressUpdated = false;
        $scope.taxCalculated = false;
        $scope.okToSubmitOrder = false;

        //  Chain the api calls for synchronous calls
        ///////////////////////////////////
        //  SHIPPING ADDRESS UPDATE
        ///////////////////////////////////
        var shippingData = $scope.shippingData;
        if (!reSendShippingAddress && JSON.stringify ($scope.priorData.shippingData) === JSON.stringify ($scope.shippingData) && $scope.priorData.eMailAddr === $scope.checkoutData.eMailAddr) {
            //  no change in shipping address
            shippingData = null;
        } else {
            $scope.processingMessage = $translate.instant ('CHK_UPD_SHIP_MSG');
        }

        Checkout.updateShippingAddress (shippingData).then (function (response) {
            $scope.priorData.shippingData = $scope.shippingData;
            $scope.priorData.eMailAddr = $scope.checkoutData.eMailAddr;

            if ($scope.bopisAnyAttr) {
                //  This is an Mixed Bopis Cart
                return Checkout.updateShippingAddress ($scope.addtlPickupData);
            } else {
                return '';
            }
        }).then (function (response) {

            if ($scope.visaCheckoutMode) {
                $scope.shipAddressUpdated = true;
                return;
            }

            if ($scope.shippingData !== null || $scope.addtlPickupData !== null) {
                $scope.shipAddressUpdated = true;
            }

            var billingData = $scope.billingData;
            if (JSON.stringify ($scope.priorData.billingData) === JSON.stringify ($scope.billingData)) {
                //  No change in billing address, skip update
                billingData = null;
            }

            $scope.processingMessage = $translate.instant ('CHK_UPD_BILL_MSG');

            ///////////////////////////////////
            //  BILLING ADDRESS UPDATE
            ///////////////////////////////////
            return Checkout.updateBillingAddress (billingData);

        }).then (function (response) {

            $scope.priorData.billingData = $scope.billingData;

            if ($scope.visaCheckoutMode) {
                $scope.billAddressUpdated = true;
                return;
            }

            if ($scope.billingData !== null) {
                $scope.billAddressUpdated = true;
            }

            ///////////////////////////////////////////
            //  UPDATE CREDIT CARD ENCRYPTION
            ///////////////////////////////////////////
            if ($scope.changedCreditCard) {
                $scope.existingCC = true;
            }
            if (!$scope.existingCC && $scope.checkoutData.card.number) {
                //  new card
                $scope.processingMessage = $translate.instant ('CHK_UPD_PAYMENT_MSG');
                return CreditCards.encryptCreditCard ($scope.checkoutData.card.number, $scope.checkoutData.ccType);
            } else {
                return '';
            }
        }).then (function (response) {

            if ($scope.visaCheckoutMode) {
                return;
            }

            if (response === '' && !$scope.existingCC) {
                $scope.processingMessage = '';
                $scope.isLoading = false;
                return;

                //  nothing happened.  If we get this far, then
                //  we don't have enough info for update,
                //  so get out
            }
            var encryptedResponse = response;
            if ($scope.existingCC) {
                if ($scope.paymentData && ($scope.priorData.ccCardId === $scope.paymentData.id)) {
                    //  Maybe CVC Changed, reset it
                    $scope.paymentData.cvv = $scope.checkoutData.card.cvc;
                    return '';
                } else {
                    if (!$scope.paymentData) {
                        var type = $scope.checkoutData.card.type.toLowerCase ();

                        if (!$scope.checkoutData.card.expiry) {
                            $scope.paymentData = null;
                            $scope.shipError = $translate.instant ('CHK_ERROR_EXPIRY');
                            return '';
                        }
                        var mm, yyyy;
                        mm = $scope.checkoutData.card.expiry.split('/')[0];
                        yyyy = $scope.checkoutData.card.expiry.split('/')[1];
                        if (yyyy.length === 2) {
                            yyyy = '20' + yyyy;
                        }
                        $scope.paymentData = {
                            method : 'creditCard',
                            expMonth : mm,
                            expYr : yyyy,
                            id : $scope.checkoutData.card.id,
                            cvv : $scope.checkoutData.card.cvv
                        };
                    }
                }
            } else {
                if (($scope.priorData.ccCardNum === $scope.checkoutData.card.number) && ($scope.priorData.ccCardExp === $scope.checkoutData.card.expiry) && ($scope.priorData.ccCardCCV === $scope.checkoutData.card.cvc)) {
                    //  no data change, so get out
                    return '';
                }
                var newccType;
                if ($scope.stplsCCType == 'staples') {
                    newccType = 'Staples';
                } else {
                    switch ($scope.checkoutData.ccType) {
                        case 'visa':
                            newccType = 'Visa';
                            break;
                        case 'mastercard':
                            newccType = 'Mastercard';
                            break;
                        case 'discover':
                            newccType = 'Discover';
                            break;
                        case 'amex':
                            newccType = 'AMEX';
                            break;
                    }
                }
                $scope.paymentData = null;
                if ($scope.checkoutData.card.number && $scope.checkoutData.card.number.trim () !== '') {
                    //  Check the payment data
                    if ($scope.checkoutForm.cardNum.$valid && $scope.checkoutForm.expiry.$valid && $scope.checkoutForm.cvc.$valid) {

                        var mm, yyyy;
                        mm = $scope.checkoutData.card.expiry.split('/')[0];
                        yyyy = $scope.checkoutData.card.expiry.split('/')[1];
                        if (yyyy.length === 2) {
                            yyyy = '20' + yyyy;
                        }
                        $scope.paymentData = {
                            expMonth : mm,
                            expYr : yyyy,
                            number : encryptedResponse,
                            type : newccType,
                            cvv : $scope.checkoutData.card.cvc, //  don't ask why the param name is cvv instead of cvc
                            method : 'creditCard'
                        };
                    } else {
                        //  Bad payment data
                        $scope.paymentData = null;
                        $scope.isLoading = false;
                    }
                }
            }
            //////////////////////////////
            //  UPDATE PAYMENT METHOD
            //////////////////////////////
            if ($scope.paymentData) {
                $scope.paymentData.cvv = $scope.checkoutData.card.cvc;
                $scope.processingMessage = $translate.instant ('CHK_UPD_PAYMENT_MSG');
                return Checkout.updatePayment ($scope.paymentData);
            } else {
                return '';
            }
        }).then (function (response) {

            if ($scope.visaCheckoutMode) {
                $scope.paymentLoaded = true;
            } else {
                $scope.paymentLoaded = ($scope.paymentData != null);
                $scope.priorData.ccCardNum = $scope.checkoutData.card.number;
                $scope.priorData.ccCardExp = $scope.checkoutData.card.expiry;
                $scope.priorData.ccCardCCV = $scope.checkoutData.card.cvc;
            }
        }).then (function (response) {

            //  Is data complete?
            if ($scope.paymentLoaded && $scope.shipAddressUpdated && ($scope.billAddressUpdated || $scope.visaCheckoutMode)) {
                //  call pre-checkout
                $scope.processingMessage = $translate.instant ('CHK_VER_ORDER_MSG');

                ///////////////////////////////////
                //  PRE-CHECKOUT
                ///////////////////////////////////
                $scope.inPreCheckoutCall = true;
                return Checkout.cartPreCheckout ();
            } else {
                return '';
            }
        }).then (function (response) {
            $scope.inPreCheckoutCall = false;
            $scope.preCheckoutCalled = true;
            if (response && response.data) {
                if (response.data.InventoryCheckAlert) {
                    $scope.shipWarning = response.data.InventoryCheckAlert;
                } else {
                    $scope.shipWarning = undefined;
                }
                // If response.data.InventoryCheckAlert is returned, the api does not calculate the pretaxTotal, subtotal and handling fee
                if (response.data.pretaxTotal) {
                    $scope.preTaxTotal = response.data.pretaxTotal;
                }
                // Update subtotal in case of a Visa Checkout copon applied to the cart
                if (response.data.subtotal) {
                    $scope.checkoutData.subtotal = parseFloat (response.data.subtotal);
                }
                if (response.data.handling) {
                    $scope.checkoutData.handling = response.data.handling;
                }
            }

            if ($scope.paymentLoaded && $scope.shipAddressUpdated && $scope.billAddressUpdated) {
                $scope.processingMessage = $translate.instant ('CHK_CALC_TAX_MSG');
                ///////////////////////////////////
                //  TAX CALCULATION
                ///////////////////////////////////
                return Checkout.cartTaxCalc ();
            } else {
                return '';
            }

        }).then (function (response) {
            if ($scope.paymentLoaded && $scope.shipAddressUpdated && $scope.billAddressUpdated) {
                $scope.taxCalculated = true;
                $scope.checkoutData.orderId = response.data.orderIdentifier;
                $scope.checkoutData.tax = parseFloat (response.data.taxTotal);
                $scope.checkoutData.orderTotal = parseFloat ($scope.preTaxTotal) + parseFloat (response.data.taxTotal);
                $scope.isLoading = false;
            }
        }).then (function (response) {
            if ($scope.shippingData.deliveryLocation === 'shiptostore') {
                return Checkout.getShippingAddress ();
            } else {
                return '';
            }
        }).then (function (response) {
            if (response != '' && $scope.shippingData.deliveryLocation === 'shiptostore') {
                // Check if the address of shipping to store is correct.
                var store = (response.data || {}).company;
                if (store.indexOf ($scope.shippingData.shipToStoreNumber) < 0) {
                    reSendingShippingAddress ();
                    return;
                }
            }

            // Everything looks good, re-set reSendShippingAddress
            reSendShippingAddress = false;

            if ($scope.taxCalculated && $scope.preCheckoutCalled) {
                $scope.okToSubmitOrder = true;
            }

        }).catch (function (error) {

            //  if error, you cannot submit order unless error
            //  came from pre-checkout, in which case, we ignore it.
            $scope.okToSubmitOrder = $scope.inPreCheckoutCall;

            // It seems like there is timing issue on cart service which removes the address of shipping to store
            if (missingShippingAddress (error) && $scope.shippingData.deliveryLocation === 'shiptostore') {
                reSendingShippingAddress ();
            } else if (!$scope.okToSubmitOrder) {//  We should report the error
                $scope.shipError = $scope.handleErrorObject (error);
            }
            $scope.isLoading = false;
        });
    };

    function missingShippingAddress (error) {
        var missing = false;
        var config = error.config || {};
        if (config.method === 'GET' && /shippingAddress$/i.test (config.url)) {
            var msg = (error.data || {}).errorMessage;
            missing = 'Shipping Address not Available.' === msg;
            console.log (msg);
        }
        return missing;
    }

    function reSendingShippingAddress () {
        if (!reSendShippingAddress) {
            reSendShippingAddress = true;
            // force to resend the shipping address

            // Start chain of API call
            $timeout (function () {
                $scope.performUpdates ();
            }, 500);
        }
    }

    $scope.login = function () {
        // Persist VISA checkout form for round trip
        saveFormData ();
        $rootScope.toRoute ('login', {
            returnRte : 'checkout'
        });
    };

    $scope.showAddresses = function (inmode) {
        //   the address edit is the same
        //   for shipping and billing, so
        //   we have to keep track of which one
        //   we are invoking.
        if (!$scope.checkoutData.sessionUser) {
            return;
        }

        $scope.checkoutData.addressMode = String (inmode);
        $scope.expand.pickupStores = false;
        $scope.expand.creditCard = false;

        if ($scope.checkoutData.addressMode === '1') {
            $scope.shipAddressUpdated = false;
            $scope.expand.billAddress = false;
        } else {
            $scope.billAddressUpdated = false;
            $scope.expand.shipAddress = false;
        }

        localStorage.setItem ('addressMode', $scope.checkoutData.addressMode);
    };

    $scope.showCreditCards = function () {
        if (!$scope.checkoutData.sessionUser || $scope.profile.creditCardCount <= 0) {
            return;
        }
        $scope.paymentLoaded = false;
        $scope.expand.pickupStores = false;
        $scope.expand.shipAddress = false;
        $scope.expand.billAddress = false;
    };

    $scope.showPickupStores = function () {
        $scope.expand.shipAddress = false;
        $scope.expand.billAddress = false;
        $scope.expand.creditCard = false;
    };

    $scope.viewDirections = function (store) {

        if (device.ios ()) {
            var directionsURL = 'http://maps.apple.com/';
        } else if (device.android ()) {
            var directionsURL = 'http://maps.google.com/';
        } else {
            var directionsURL = 'http://maps.google.com/';
        }

        directionsURL += '?daddr=' + store.address + ',' + store.city + ',' + store.state;
        window.location = directionsURL;
    };

    $scope.validate = {
        namenewold : /^([a-zA-Z]+[\s'.]?)+\S$/,
        nameold2 : /^[-a-zA-Z][-'a-zA-Z]+,?[\s'.][-'a-zA-Z]{0,19}$/,
        name : /^[a-zA-Z]+\s[0-9a-zA-Z .,'-]*$/,
        email : /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
    };

    function getAddress (formAddress, addressObj) {
        formAddress.addressLine1 = addressObj.line1;
        formAddress.addressLine2 = addressObj.line2;
        formAddress.city = addressObj.city;
        formAddress.state = addressObj.stateProvinceCode;
        formAddress.zip = addressObj.postalCode;
    }

    function filloutVisaCheckoutShippingData (paymentInfo) {

        var shippingAddress;
        if (paymentInfo.shippingAddress && paymentInfo.shippingAddress.length > 0) {
            shippingAddress = paymentInfo.shippingAddress[0];
        } else {
            shippingAddress = paymentInfo.billingAddress[0];
        }

        $scope.checkoutData.shippingName = shippingAddress.personName;
        $scope.checkoutData.shippingPhone = shippingAddress.phone;

        $scope.checkoutForm.name.$valid = true;
        $scope.checkoutForm.phone.$valid = true;

        if ($scope.shipToStoreAttr || $scope.bopisOnlyAttr) {
            $scope.getShippingData ();
        } else {
            if ($scope.bopisAnyAttr) {
                $scope.checkAndUpdateBOPISPickup ();
                $scope.addtlPickupData = $scope.shippingData;
            }

            getAddress ($scope.checkoutData.shipping, shippingAddress);
            $scope.checkoutForm.name.$valid = true;

            // Set shipping address input filed valid for the next call
            $scope.checkoutData.shipping.address = shippingAddress.line1;

            // Create shippingData for ship to home
            $scope.checkAndUpdateShippingAddress ();
        }
    }

    function filloutVisaCheckoutBillingData (paymentInfo) {

        var billingAddress = paymentInfo.billingAddress[0];

        $scope.checkoutData.billing.name = billingAddress.personName;
        $scope.checkoutData.billing.phone = billingAddress.phone;

        getAddress ($scope.checkoutData.billing, billingAddress);
        $scope.checkoutData.billing.address = billingAddress.line1 + billingAddress.line2 + " " + billingAddress.city + " " + billingAddress.stateProvinceCode + ' ' + billingAddress.postalCode;
        $scope.checkoutData.billing.address = $scope.checkoutData.billing.address.trim ();

        if ((billingAddress.line1.trim () !== '') && (billingAddress.city.trim () !== '') && (billingAddress.stateProvinceCode.trim () !== '') && (billingAddress.postalCode.trim () !== '')) {
            $scope.hasBillData = true;
        } else {
            $scope.hasBillData = false;
        }

        $scope.checkoutData.card.number = '*' + paymentInfo.lastFourDigits;
        $scope.checkoutData.card.expiry = paymentInfo.expirationDate[0].month + '/' + paymentInfo.expirationDate[0].year;
        $scope.checkoutData.card.cardArt = 'url("' + paymentInfo.cardArt[0].baseImageFileName + '")';

        $scope.paymentLoaded = true;

        $scope.billingDataEntryComplete = $scope.paymentDataEntryComplete = true;
    }

    function processVisaCheckoutPayment () {
        // ESD and Apple products require sign in
        if (!$scope.canCheckout) {
            return;
        }
        $scope.isLoading = true;
        $scope.checkoutData.useShipAsBill = false;

        $scope.processingMessage = $translate.instant ('CHK_UPD_PAYMENT_MSG');

        VisaCheckout.processPayment ().then (function (response) {
            try {
                disableUpdatesForVisa = true;

                paymentInfo = response.data.Cart[0].Payment[0];

                //  Save data for confirmation page
                if (paymentInfo.userData && paymentInfo.userData.length > 0) {
                    $scope.priorData.eMailAddr = $scope.checkoutData.eMailAddr = paymentInfo.userData[0].userEmail;
                    $scope.checkoutForm.email.$valid = true;
                } else {
                    $scope.checkoutData.eMailAddr = '';
                }

                filloutVisaCheckoutBillingData (paymentInfo);

                filloutVisaCheckoutShippingData (paymentInfo);

                $scope.isLoading = false;

                $scope.checkoutForm.name.$valid = $scope.hasShipData = $scope.checkoutForm.email.$valid = true;
                $scope.checkoutForm.billing_name.$valid = $scope.hasBillData = true;

                if (paymentInfo.couponMessage) {// MWINHS-1598
                    VisaCheckout.saveCoupon (paymentInfo);
                    saveFormData ();
                } else {
                    // Remove unexpected coupon from previous session
                    VisaCheckout.removeCoupon ();
                }

            } catch (e) {
            }

            disableUpdatesForVisa = false;
            $scope.performUpdates ();

            //  Any time data changes, save it in the session
            saveGuestData ();

        }, function () {
            $scope.isLoading = false;
            disableUpdatesForVisa = false;
            VisaCheckout.showError ();
        });
    };

    $scope.clickVisaCheckout = function () {
        if (initVisaCheckout) {
            initVisaCheckout = false;

            VisaCheckout.initVisaCheckout ().then (function () {
                document.querySelector ('.v-button').click ();
            });
        }
    };

    $scope.$on ('continue.visaCheckout', function () {
        processVisaCheckoutPayment ();
    });

    $scope.handleErrorObject = function (error) {
        var msg = '';
        var key;
        if (error.status === 404) {
            key = handle404Error (error);
        }
        if (error.status === 500) {
            msg = "An internal server error has occured.  Please contact Staples Technical Support.";
            return msg;
        }
        if (key) {
            msg = $translate.instant (key);
        } else if (error.data) {
            if (error.data.originalError) {
                var originalError = error.data.originalError;
                if (originalError && originalError.data) {
                    var data = originalError.data;
                    if (data.errors && data.errors[0]) {
                        var errors = data.errors[0];
                        if (errors.errorKey) {
                            msg = errors.errorKey;
                        } else if (errors.errorMessage) {
                            msg = errors.errorMessage;
                            if (msg.indexOf ('Please verify that the billing address you entered matches your credit card information') >= 0) {
                                msg = 'Please verify that the billing address you entered matches your credit card information.';
                                return msg;
                            } else if (msg.indexOf ('Invalid value entered for the deliveryState') >= 0) {
                                msg = $translate.instant ('CHK_SHIP_STATE_ERROR');
                                return msg;
                            } else if (msg.indexOf ('cardVerificationCode') >= 0) {
                                msg = $translate.instant ('CHK_ERROR_CVC');
                                return msg;
                            } else if (msg.indexOf ('cardExpirationYear') >= 0) {
                                msg = $translate.instant ('CHK_ERROR_EXPIRY');
                                return msg;
                            }
                        }
                    }
                }

                if (error.data.errorMessage) {
                    msg = error.data.errorMessage;
                    var knownErrors = (/CORBA TRANSACTION/i.test (msg) || /unknown/i.test (msg) || /parameter/i.test (msg));
                    if (knownErrors) {
                        msg = $translate.instant ('CHK_ERROR_TRANSACTION');
                    }
                } else {
                    msg = $translate.instant ('CHK_ERROR_TRANSACTION');
                }
            }
        } else if ( typeof error === 'string') {
            msg = $translate.instant ('CHK_ERROR_TRANSACTION');
        }

        return msg;
    };

    var handle404Error = function (error) {

        var urlTest = error.config.url.toString ().toLowerCase ();
        var transKey = 'CHK_ERROR_UPDATE';
        if (urlTest.indexOf ('/cart/shippingaddress') >= 0) {
            transKey = 'CHK_ERROR_SHIPPING';

        } else if (urlTest.indexOf ('/cart/billingaddress') >= 0) {
            transKey = 'CHK_ERROR_BILLING';

        } else if (urlTest.indexOf ('/cart/precheckout') >= 0) {
            transKey = 'CHK_ERROR_PRECHK';

        } else if (urlTest.indexOf ('/cart/tax') >= 0) {
            transKey = 'CHK_ERROR_TAX';

        } else if (urlTest.indexOf ('/cart/payment') >= 0) {
            transKey = 'CHK_ERROR_PAYMENT';

        } else if (urlTest.indexOf ('/cart/confirm') >= 0) {
            transKey = 'CHK_ERROR_ORDER';

        } else if (urlTest.indexOf ('/creditcard/encrypt') >= 0) {
            transKey = 'CHK_ERROR_ENCRYPT';

        } else if (urlTest.indexOf ('creditcard') >= 0) {
            transKey = 'CHK_ERROR_CCADD';
        }

        return transKey;
    };

    function saveFormData () {
        if ($scope.visaCheckoutMode) {
            Checkout.setInfo ($scope.checkoutData);
        }
    }

    function saveGuestData () {
        if ($scope.checkoutData.sessionUser) {
            return;
        }

        if (!$scope.guestUserData) {
            $scope.guestUserData = {
                useShipAsBill : true,
                eMailAddr : '',
                shippingName : '',
                shippingPhone : '',
                shipping : {
                    addressLine1 : '',
                    addressLine2 : '',
                    city : '',
                    state : '',
                    zip : ''
                },
                billing : {
                    name : '',
                    addressLine1 : '',
                    addressLine2 : '',
                    city : '',
                    state : '',
                    zip : '',
                    phone : ''
                }
            };
        }
        $scope.guestUserData.useShipAsBill = $scope.checkoutData.useShipAsBill;
        $scope.guestUserData.eMailAddr = $scope.checkoutData.eMailAddr;

        //  If ship to store, don't save ship address
        $scope.guestUserData.shippingName = $scope.checkoutData.shippingName;
        $scope.guestUserData.shippingPhone = $scope.checkoutData.shippingPhone;

        $scope.guestUserData.shipping = {
            addressLine1 : $scope.shipToStoreAttr ? '' : $scope.checkoutData.shipping.addressLine1,
            addressLine2 : $scope.shipToStoreAttr ? '' : $scope.checkoutData.shipping.addressLine2,
            city : $scope.shipToStoreAttr ? '' : $scope.checkoutData.shipping.city,
            state : $scope.shipToStoreAttr ? '' : $scope.checkoutData.shipping.state,
            zip : $scope.shipToStoreAttr ? '' : $scope.checkoutData.shipping.zip
        };

        $scope.guestUserData.billing = {
            name : $scope.checkoutData.billing.name,
            addressLine1 : $scope.checkoutData.billing.addressLine1,
            addressLine2 : $scope.checkoutData.billing.addressLine2,
            city : $scope.checkoutData.billing.city,
            state : $scope.checkoutData.billing.state,
            zip : $scope.checkoutData.billing.zip,
            phone : $scope.checkoutData.billing.phone
        };

        $scope.guestUserData.pickupName = $scope.checkoutData.pickupName;
        $scope.guestUserData.pickupPhone = $scope.checkoutData.pickupPhone;

        localStorage.setItem ('guestData', JSON.stringify ($scope.guestUserData));
    };

    function getGuestData () {

        if ($scope.checkoutData) {
            $scope.guestUserData = JSON.parse (localStorage.getItem ('guestData'));
            if ($scope.guestUserData) {
                $scope.checkoutData.useShipAsBill = $scope.guestUserData.useShipAsBill;
                $scope.checkoutData.eMailAddr = $scope.guestUserData.eMailAddr;

                $scope.checkoutData.shippingName = $scope.guestUserData.shippingName;
                $scope.checkoutData.shippingPhone = $scope.guestUserData.shippingPhone;

                $scope.checkoutData.shipping.addressLine1 = $scope.guestUserData.shipping.addressLine1;
                $scope.checkoutData.shipping.addressLine2 = $scope.guestUserData.shipping.addressLine2;
                $scope.checkoutData.shipping.city = $scope.guestUserData.shipping.city;
                $scope.checkoutData.shipping.state = $scope.guestUserData.shipping.state;
                $scope.checkoutData.shipping.zip = $scope.guestUserData.shipping.zip;

                $scope.checkoutData.shipping.address = $scope.checkoutData.shipping.addressLine1 + ' ' + $scope.checkoutData.shipping.addressLine2 + ' ' + $scope.checkoutData.shipping.city + ' ' + $scope.checkoutData.shipping.state + ' ' + $scope.checkoutData.shipping.zip;

                $scope.checkoutData.billing.name = $scope.guestUserData.billing.name;
                $scope.checkoutData.billing.addressLine1 = $scope.guestUserData.billing.addressLine1;
                $scope.checkoutData.billing.addressLine2 = $scope.guestUserData.billing.addressLine2;
                $scope.checkoutData.billing.city = $scope.guestUserData.billing.city;
                $scope.checkoutData.billing.state = $scope.guestUserData.billing.state;
                $scope.checkoutData.billing.zip = $scope.guestUserData.billing.zip;
                $scope.checkoutData.billing.phone = $scope.guestUserData.billing.phone;
                $scope.checkoutData.billing.address = $scope.checkoutData.billing.addressLine1 + ' ' + $scope.checkoutData.billing.addressLine2 + ' ' + $scope.checkoutData.billing.city + ' ' + $scope.checkoutData.billing.state + ' ' + $scope.checkoutData.billing.zip;
                if ($scope.checkoutData.shipping.address) {
                    $scope.setUseShippingLabel ($scope.checkoutData.shipping);
                } else {
                    $scope.shortShipping = 'shipping';
                }

                $scope.checkoutData.pickupName = $scope.guestUserData.pickupName;
                $scope.checkoutData.pickupPhone = $scope.guestUserData.pickupPhone;
            }
        } else {
            $scope.guestUserData = null;
        }
    };

    function getSavedFormData () {

        var info = null;
        // If user click Visa checkout button in cart page, the previous saved checkout data should be ignored.
        if ($scope.visaCheckoutMode && !VisaCheckout.continueVisaCheckout ()) {
            info = Checkout.getInfo ();
            if (info) {
                // update with the current session state
                info.sessionUser = $scope.checkoutData.sessionUser;
                info.cart = $scope.checkoutData.cart;
            }
        }
        return info;
    }

});
