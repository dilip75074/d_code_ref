'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ConfirmCtrl
 */
angular.module('stpls').controller('ConfirmCtrl', function($scope, $stateParams, $rootScope, $translate, MobileService, Account, Checkout, Cart, Profile, Analytics, VisaCheckout, InsideChat, hookLogic) {

    $scope.bopisStoreNums;
    $scope.bopisStoreAddresses;
    $scope.bopisAny;
    $scope.nonBopisAny;
    $scope.isGuest = (MobileService.getSessionState() === 'guest');
    $scope.isLoading = false;
    $scope.processingMessage = $translate.instant('ORD_ACCT_PROCESS_MSG');
    $scope.errorMsg = undefined;
    $scope.successMsg = undefined;
    $scope.confirmData = false;
    $scope.kountSuccess = false;
    $scope.confirmDataIn = {
        notifyByEmail: true,
        password: '',
        emailToUse: ''
    };
    var showOptins;

    var init = function() {

        //process optins independently of subsequent $digests.
        var optins = Profile.getOptIns();
        showOptins = !(optins.email && optins.sms);

        $scope.confirmData = Checkout.getInfo();

        if (!$scope.confirmData) {
            //  If we've lost the confirmation data, try and get the temp
            //  data saved in sessionStorage
            try {
                $scope.confirmData = JSON.parse(sessionStorage.getItem('tempConfirmData'));
            } catch (e) {
               $scope.confirmData = null;      //  fail silently
            }
        }

        if ($scope.confirmData) {

            InsideChat.trackerOrderConfirmed ($scope.confirmData.staplesOrderNum, $scope.confirmData.orderTotal, $scope.confirmData.tax, parseFloat($scope.confirmData.shippingFee) + parseFloat($scope.confirmData.handling));

            var ISPCount = 0;
            var otherCount = 0;
            $scope.bopisStoreNums = new Array();
            $scope.bopisStoreAddresses = new Array();

            if ($scope.confirmData.cart) {
                var items = {};
                items = $scope.confirmData.cart.productsInCart;
                angular.forEach(items, function(i) {
                    if (i.bopis === 'true' && i.shippingInfo && i.shippingInfo.deliveryModeSelected === 'ISP') {
                        var storeNum = i.shippingInfo.deliveryAddressSelected.storeNumber;
                        if ($scope.bopisStoreNums.indexOf(storeNum) === -1) {
                            //  only keep unique stores
                            $scope.bopisStoreNums.push(storeNum);
                            $scope.bopisStoreAddresses.push(i.shippingInfo.deliveryAddressSelected.city + ', ' + i.shippingInfo.deliveryAddressSelected.state);
                        }
                        ISPCount++;
                    } else {
                        otherCount++;
                    }
                });
                $scope.bopisAny = (ISPCount > 0);
                $scope.nonBopisAny = (otherCount > 0);
            }
            $scope.confirmDataIn.emailToUse = $scope.confirmData.eMailAddr;

            /*   Kount Fraud Detection  */
            var results = Checkout.kountCollect($scope.confirmData.staplesOrderNum);
            results.then(function(data) {
                if (data) {
                    $scope.kountSuccess = true;
                }
            }, function(error) {
                console.log ('**** kountCollect failed.  Please contact Staples Dev Team.');
            });

            try {
                sessionStorage.setItem('tempConfirmData', JSON.stringify($scope.confirmData));
            } catch (e) {
                console.log ('error setting tempConfirmData sessionStorage item.');
            }

            var c = angular.copy($scope.confirmData);
            Analytics.captureDLO(Analytics.DLO.confirm, c);

            
            Checkout.clear();
            Cart.clear();
            VisaCheckout.clear();
            $rootScope.setCartCount(0);
        }
    };

    init();

    $scope.continueShopping = function() {
        sessionStorage.removeItem('tempConfirmData');
        $rootScope.toRoute('home');
    };

    $scope.changeNotifyByEmail = function changeNotifyByEmail() {
        $scope.confirmDataIn.notifyByEmail = !$scope.confirmDataIn.notifyByEmail;
    };

    $scope.createAccount = function() {
        $scope.isLoading = true;

        var phone = $scope.confirmData.billing.phone ? $scope.confirmData.billing.phone : $scope.confirmData.shippingPhone;
        var last = $scope.confirmData.billing.name ? $scope.confirmData.billing.name : $scope.confirmData.shippingName;

        //  Split up billing name into first, last
        var first = '';
        var names = last.replace(/\s+/g, ' ').split(' ');
        if (names.length > 1) {
            first = names.shift();
            last = names.join(' ');
        }

        // set up data values, default new account to rewards member
        var data = {
            logonId: $scope.confirmDataIn.emailToUse,
            logonPassword: $scope.confirmDataIn.password,
            logonPasswordVerify: $scope.confirmDataIn.password,
            emailPreference: $scope.confirmDataIn.notifyByEmail,
            email1: $scope.confirmDataIn.emailToUse,
            newReEnterEmailAddr: $scope.confirmDataIn.emailToUse,
            autoLoginPreference: true,
            rewardsMemberOption: 'becomeRewardsMember',
            rewardsPhoneNumber: phone,
            rewardsAccountType: 'Personal',
            rewardsFirstName: first,
            rewardsLastName: last,
            rewardsDeliveryMethod: 'E',
            rewardsAddressLine1: $scope.confirmData.billing.addressLine1,
            rewardsAddressLine2: $scope.confirmData.billing.addressLine2,
            rewardsCityName: $scope.confirmData.billing.city,
            rewardsState: $scope.confirmData.billing.state,
            rewardsZipCode: $scope.confirmData.billing.zip
        };

        Account.registerUser(data, null).then(function() {
            $scope.errorMsg = undefined;
            $rootScope.simplePrompt({
                message: $translate.instant('ORD_ACCT_SUCCESS'),
                actions: {
                    secondary: {
                        title: $translate.instant('CHK_CONTINUE_BTN'),
                        callback: function() {
                        }
                    }
                }
            });
            $scope.isLoading = false;

        }, function(error) {
            console.log('error registering new account', error);
            $scope.errorMsg = error;
            $scope.successMsg = undefined;
            $scope.isLoading = false;
        });
    };

    $scope.showOptins = function() {
      return showOptins;
    };

     /*
        Function to initialize the Hook Logic param required for the HL API
    */
    $scope.setHookLogicAdCarouselParams = function() {
        var productId = [];
        var quantity = [];
        var price= [];
        angular.forEach($scope.confirmData.cart.productsInCart, function(value, key) {
            productId.push(value.sku);
            quantity.push(value.qty);
            price.push(value.price.totalOrderItemPrice); 
        });
        productId = productId.join('|');
        quantity = quantity.join('|');
        price = price.join('|');
        var hookLogicParams = {
            total: $scope.confirmData.orderTotal,
            productId: productId,
            quantity: quantity,
            price: price,
            orderId: $scope.confirmData.staplesOrderNum,
            hlpt: 'C'
         };
         return hookLogicParams;
    };
});

/*  This is a custom filter
 *  that returns BOPIS-Selected items for a given store
 */
angular.module('stpls').filter('bopisItems', function() {

    return function(items, currentStore) {

        return _.filter(items, function(item) {
            return ((item.shippingInfo.deliveryModeSelected === 'ISP') &&
                    (item.shippingInfo.deliveryAddressSelected.storeNumber === currentStore));
         });

    };

});

/*  This is a custom filter
 *  that returns Ship-to-Address items
 */
angular.module('stpls').filter('nonBopisItems', function() {

    return function(items, currentStore) {

        return _.filter(items, function(item) {
            return (item.shippingInfo.deliveryModeSelected !== 'ISP');
         });

    };

});
