'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Profile
 */
angular.module('stpls').factory('Profile', function($q, $cookies, $translate, Account, MobileService, Analytics, $angularCacheFactory, InsideChat) {

    var profile,
        visitor, // keep in-memory reference of visitor
        storage; // declare storage object

    // return aggregated profile data including credit cards and addresses
    var profileAgg = function(cache) {
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/profileAgg',
            cache: !!cache
        }).then(function(response) {

            profile = response.data.EasyOpenProfile.profile;

            if (response.data.EasyOpenProfileAddress) {
                profile.addresses = response.data.EasyOpenProfileAddress.addresses;
            } else {
                profile.addresses = [];
            }
            if (response.data.EasyOpencreditCard) {
                profile.creditCards = response.data.EasyOpencreditCard.creditCards;
            } else {
                profile.creditCards = [];
            }

            d.resolve(profile);
            var address = (profile.addresses || [{}])[0] || {};
            var emailAddress = profile.emailAddress || '';
            if (emailAddress) {
                setEmailAddress(emailAddress);
            }

            var name = '';      //  customer name
            if (profile.addresses.length > 0) {
                var address = profile.addresses[0];
                name = address.first + ' ' + address.last;
            }
            InsideChat.updateVisitorInfo(profile, Account.getZipCode());

            visitor = {
                email: emailAddress,
                phone: address.phone || '',
                rewards: profile.rewardsNumber || '',
                rewardstier: profile.customerTier || ''
            };


            //update Analytics DLO
            Analytics.updateToVisitor(visitor);

        }, function(error) {
            console.log('error getting profile', error);
            d.reject(error);
        });
        return d.promise;
    };

    var getSavedProfile = function() {
        return profile;
    };

    // for getting user's email address (for use elsewhere in the app)
    var getProfile = function() {
        var d = $q.defer();
        MobileService.request({
            method: 'GET',
            url: '/profile',
            cache: false
        }).then(function(response) {
            var profile = response.data.profile;
            d.resolve(profile);
        }, function(error) {
            console.log('error getting profile', error);
            d.reject(error);
        });
        return d.promise;
    };


    // for saving individual profile fields such as welcomeMessage, emailAddress
    var saveProfile = function(data) {
        var d = $q.defer();
        MobileService.request({
            method: 'PUT',
            url: '/profile',
            cache: false,
            data: data
        }).then(function(response) {
            if (response.data && response.data.profile) {
                var profile = response.data.profile;
                var name = '';      //  customer name
                if (profile.addresses && profile.addresses.length > 0) {
                    var address = profile.addresses[0];
                    name = address.first + ' ' + address.last;
                }
                InsideChat.updateVisitorInfo(profile, Account.getZipCode());
            }
           d.resolve(response);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    // change users password (old password is automatically checked to be correct)
    var changePassword = function(oldPwd, newPwd, newPwdVerify) {

        var d = $q.defer();

        var payload = {
            logonPasswordOld: oldPwd,
            logonPassword: newPwd,
            logonPasswordVerify: newPwdVerify
        };

        MobileService.request({
            url: '/resetPassword',
            method: 'PUT',
            cache: false,
            data: payload
        }).then(function(response) {
            d.resolve(response);
        }, function(error) {
            console.log('Error saving password', error);
            var errorMsg = error.data.originalError.data.errors[0].errorMessage;
            if (errorMsg.indexOf('"logonPasswordOld" was incorrect.') >= 0) {
                errorMsg = 'Your original password is incorrect';
            } else if (errorMsg.indexOf('logonPassword') >= 0) {
                errorMsg = $translate.instant('ACT_PASSWORD_ERROR');
            }
            d.reject(errorMsg);
        });
        return d.promise;
    };

    // User forgot password, wants to get reset password link by email
    var resetPasswordByEmail = function(email) {

        var d = $q.defer();

        if (MobileService.hasSession()) {
            recoverPasswordByEmail(email).then(function(response) {
                d.resolve('');
            }, function(error) {
                console.log('Error resetting password by email', error);
                d.reject(error);
            });

        } else {
            MobileService.initGuestSession().then(function(response) {
                recoverPasswordByEmail(email).then(function(response) {
                    d.resolve('');
                }, function(error) {
                    console.log('Error resetting password by email', error);
                    d.reject(error);
                });
            });
        }
        return d.promise;
    };

    var recoverPasswordByEmail = function(email) {

        var d = $q.defer();

        MobileService.request({
            url: '/recoverPasswordByEmail',
            method: 'PUT',
            cache: false,
            data: {
                email1: email
            }
        }).then(function(response) {
            d.resolve(response);
        }, function(error) {
            console.log('Error resetting password by email', error);
            d.reject(error);
        });

        return d.promise;
    };

    // link User's existing rewards # to their profile
    var linkRewards = function(rewardsNum, phoneNum) {

        var d = $q.defer();

        var payload = {
            rewardsMemberOption: 'alreadyRewardsMember',
            fieldName: 'rewardsNumber',
            rewardsNumber: rewardsNum,
            rewardsPhoneNumber: phoneNum
        };

        MobileService.request({
            url: '/profile',
            method: 'PUT',
            cache: false,
            data: payload
        }).then(function(response) {
            console.log('linked rewards', response);
            d.resolve(response);
        }, function(error) {
            console.log('Error linking rewards', error);
            var errorMsg = error.data.errorMessage;
            d.reject(errorMsg);
        });
        return d.promise;
    };

    var getStorage = function() {
        storage = storage || $angularCacheFactory('stpls.profile', {
            capacity: 10,
            storageMode: 'localStorage',
            storagePrefix: 'stpls.'
        });
        return storage;
    };

    var getVisitor = function() {
        return visitor || {};
    };

    var getOptIns = function() {
        return getStorage().get('optins') || {};
    };

    var setOptIns = function(optins) {
        getStorage().put('optins', angular.copy(optins));
    };

    var getEmailAddress = function() {
        return getStorage().get('emailAddress') || {};
    };

    var setEmailAddress = function(emailAddress) {
        getStorage().put('emailAddress', emailAddress);
    };

    var init = profileAgg;

    return {
        init: init,
        changePassword: changePassword,
        profileAgg: profileAgg,
        saveProfile: saveProfile,
        getProfile: getProfile,
        linkRewards: linkRewards,
        resetPasswordByEmail: resetPasswordByEmail,
        recoverPasswordByEmail: recoverPasswordByEmail,
        getSavedProfile: getSavedProfile,
        getVisitor: getVisitor,
        getOptIns: getOptIns,
        setOptIns: setOptIns,
        getEmailAddress: getEmailAddress

    };

});
