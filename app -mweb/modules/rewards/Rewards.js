'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Rewards
 */
angular.module('stpls').factory('Rewards', function($q, MobileService, Account) {

    //  Return's user's rewards summary,
    //  including the redeemable reward coupons
    var getRewardsDashboard = function() {

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/rewards',
            cache: false,
            headers: {
                'cache-control': 'proxy-revalidate'
            },
            params: {
                catalogId: '10051',
                zip: Account.getZipCode()
            }

        }).then(function(response) {
            if (response.data.Member !== undefined) {
                var rewards = response.data.Member[0];
                d.resolve(rewards);
            } else {
                d.resolve(null);
            }
        }, function(error) {
            if (error.status === 404) {
                //  user doesn't have rewards, this is not an error
                d.resolve(null);
            } else {
                console.log('error users rewards dashboard', error);
                if (error && error.data && error.data.originalError && error.data.originalError.data && !error.data.originalError.data.errors) {
                    d.reject(error.data.originalError.data);
                } else if (error && error.data && error.data.originalError && error.data.originalError.data.errors.length > 0) {
                    d.reject('Error accessing rewards. ' + error.data.originalError.data.errors[0].errorMessage);
                } else {
                    d.reject('Error accessing rewards.  Please try again later.');
                }
            }
        });

        return d.promise;
    };

    //  Adds a redeemable reward to the cart
    var addRewardCouponToCart = function(code) {
        var d = $q.defer();

        MobileService.request({
            method: 'POST',
            url: '/coupon',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            params: {
                zip: Account.getZipCode()
            },
            data: {
                'promoName': code
            }
        }).then(function(response) {
            if (response.data.Member !== undefined) {
                var rewards = response.data.Member[0];
                d.resolve(rewards);
            }
        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    //  Enroll a user in the rewards program
    var enrollUserInRewardsProgram = function(enrollObj) {
        var d = $q.defer();

        //  Create Enroll Payload
        var payload = {
            'rewardsDeliveryMethod': enrollObj.deliveryType,
            'rewardsAccountType': enrollObj.acctType,
            'rewardsFirstName': enrollObj.firstName,
            'rewardsLastName': enrollObj.lastName,
            'rewardsAddressLine1': enrollObj.rewardsAddress.addressLine1,
            'rewardsAddressLine2': enrollObj.rewardsAddress.addressLine2,
            'rewardsCityName': enrollObj.rewardsAddress.city,
            'rewardsState': enrollObj.rewardsAddress.state,
            'rewardsZipCode': enrollObj.rewardsAddress.zip,
            'rewardsPhoneNumber': enrollObj.phone,
            'fieldName': 'rewardsNumber',
            'rewardsMemberOption': 'becomeRewardsMember'
        };

        MobileService.request({
            method: 'PUT',
            url: '/profile',
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
            data: payload
        }).then(function(response) {
            d.resolve(response);
        }, function(error) {
            if (error && error.data && error.data.originalError && error.data.originalError.data.errors[0]) {
                d.reject(error.data.originalError.data.errors[0]);
            } else {
                d.reject(error);
            }
        });
        return d.promise;
    };

    return {
        getRewardsDashboard: getRewardsDashboard,
        addRewardCouponToCart: addRewardCouponToCart,
        enrollUserInRewardsProgram: enrollUserInRewardsProgram
    };

});
