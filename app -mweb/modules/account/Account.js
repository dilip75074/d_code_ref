'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Account
 */

angular.module('stpls').factory('Account', ['$http', '$q', '$cookies', '$translate', 'MobileService', 'Analytics', 'Config', 'InsideChat',
    function($http, $q, $cookies, $translate, MobileService, Analytics, Config, InsideChat) {

        var zipCode;

        // Staged for now until zipcode source is determined
        var getZipCode = function() {
            return zipCode;
        };

        var setZipCode = function() {
            zipCode = $cookies.get('zipcode');
            if (!zipCode) {
                zipCode = Config.getProperty('defaultZip') || '01702';
            }
            Analytics.updateLocation({zipcode: zipCode});
        };
        setZipCode();

        var registerUser = function(data, rewardsAddressData) {
            var d = $q.defer();

            if (rewardsAddressData) {
                data.rewardsAddressLine1 = rewardsAddressData.addressLine1;
                data.rewardsAddressLine2 = rewardsAddressData.addressLine2;
                data.rewardsCityName = rewardsAddressData.city;
                data.rewardsState = rewardsAddressData.state;
                data.rewardsZipCode = rewardsAddressData.zip;
            }

            var request = {
                url: '/register',
                cache: false,
                method: 'POST',
                data: data
            };

            MobileService.request(request).then(function(response) {
                // if successful then log the user in by setting session state
                var session = {
                    userID: response.data.userId,
                    userName: data.logonId,
                    personalizationID: response.data.personalizationID,
                    WC: {
                        token: response.data.WCToken,
                        trustedToken: response.data.WCTrustedToken
                    }
                };

                MobileService.setSession('registered', session);
                //  Establish Inside Chat for registered user
                InsideChat.loadInsideChat(MobileService.getSessionUserID(), MobileService.getSessionUserName());

                d.resolve(session);
            }, function(error) {
                var errorMsg;
                if (error && error.data && error.data.errorMessage) {
                    errorMsg = error.data.errorMessage;
                    if (errorMsg.indexOf('Please sign off before continuing.') >= 0) {
                        errorMsg = 'You are already logged in.  Please sign off before continuing.';
                    }
                    else if (errorMsg.indexOf('name you selected already exists') >= 0) {
                        errorMsg = 'This username is already in use';
                    } else if (errorMsg.indexOf('logonPassword') >= 0) {
                        errorMsg = $translate.instant('ACT_PASSWORD_ERROR');
                    }
                } else {
                    errorMsg = 'error registering user';
                }
                d.reject(errorMsg);
            });
            return d.promise;
        };

        return {
            setZipCode: setZipCode,
            getZipCode: getZipCode,
            registerUser: registerUser
        };
}]);
