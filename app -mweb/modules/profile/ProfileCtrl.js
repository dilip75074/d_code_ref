'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ProfileCtrl
 */
angular.module('stpls').controller('ProfileCtrl', function ($scope, $rootScope, $stateParams, $timeout, Profile, MobileService, scroll) {

    $scope.errorMsg = undefined;

    /*  Event triggered when  */
    $rootScope.$on('countersChanged', function(event, data) {
         Profile.profileAgg().then(function(response) {
            $scope.profile = response;
            // set some default values that we don't get from the server (but which may need to be sent)
            $scope.profile.rewardsPhoneNumber = '';
            $scope.profile.optOutReason = '';
            // backup the initial profile state
            $scope.master = angular.copy($scope.profile);
        }, function(error) {
            console.log('error getting profile', error);
        });

    });

    var init = function() {
        $scope.profile = {};
        $scope.master = {};

        // dont show unsubscribe prompt until user takes action
        $scope.profile.showUnsubscribePrompt = false;

        // set accordion open states to false
        $scope.openStatus = {
            welcomeMessage: false,
            userName: false,
            emailAddress: false,
            isUserSubscribed: false,
            password: false,
            creditCards: false,
            addresses: false,
            rewardsNumber: false,
            checkoutAddresses: true,
            checkoutCreditCards: true
        };

        //  Determine if Rewards Accordion should be opened
        //  since we came from a Link Rewards command
        $scope.openStatus.rewardsNumber = $stateParams.id;

 /*      Profile.profileAgg().then(function(response) {
            $scope.profile = response;
            // set some default values that we don't get from the server (but which may need to be sent)
            $scope.profile.rewardsPhoneNumber = '';
            $scope.profile.optOutReason = '';
            // backup the initial profile state
            $scope.master = angular.copy($scope.profile);
        }, function(error) {
            console.log('error getting profile', error);
        });*/
    };

    $scope.changeSubscribeStatus = function changeSubscribeStatus() {
        $scope.profile.isUserSubscribed = !$scope.profile.isUserSubscribed;
        $scope.subscribeStateChanged();
    };

    // watch the subscribe checkbox to see if the user is unsubscribing (so we can ask them why)
    $scope.subscribeStateChanged = function subscribeStateChanged() {
        if ($scope.master.isUserSubscribed && !$scope.profile.isUserSubscribed) {
            $scope.profile.showUnsubscribePrompt = true;
        } else {
            $scope.profile.showUnsubscribePrompt = false;
            $scope.profile.optOutReason = '';
        }
    };

	$scope.linkRewards = function(form, rewardNum, rewardPhone) {

	    if (!form.rewardsNumber.$valid ||
	        !form.rewardsPhoneNumber.$valid) {
	            return;
	    }

        Profile.linkRewards($scope.profile.rewardsNumber, $scope.profile.rewardsPhoneNumber).then(function(response) {
            console.log('linked reward', response);
            $scope.master = angular.copy($scope.profile);
            form.$setPristine();
            form.$setUntouched();
            $scope.openStatus.rewardsNumber = false;
        }, function(error) {
            console.log('error', error);
            $scope.errorMsg = error;
        });
	};

    $scope.clearError = function() {
        $scope.errorMsg = undefined;
    };

    $scope.save = function save(form, property, extraProps) {
        if (form.$valid) {
            var props = [property];
            // extraprops are additional fields associated with property that must be sent with a PUT
            props = props.concat(extraProps || []);

            var dataToSend = _.pick($scope.profile, props);

            Profile.saveProfile(dataToSend).then(function() {
                // update the profile copy
                $scope.master = angular.copy($scope.profile);
                $scope.resetForm(form, property);
                if (property === 'isUserSubscribed') {
                    // make sure we update the subscribe box (to close the un-subscribe prompt it has)
                    $scope.subscribeStateChanged();
                }
            }, function(error) {
                console.log('error', error);
            });
        }

    };

    $scope.resetForm = function resetForm(form, property) {
        $scope.openStatus[property] = false;
        if (form) {
            form.$setPristine();
            form.$setUntouched();
        }
    };

    $scope.cancel = function cancel(form, property) {
        // roll back changes
        $scope.profile = angular.copy($scope.master);
        // reset form
        $scope.resetForm(form, property);
     };

    $scope.scroll = function(to, isOpen) {
        if (!isOpen) {
            // only scroll if we're opening a panel, not closing one
            $timeout(function(){
                scroll.to(to, 0);
            }, 450);
        }
    };

    // If not logged in
    if(MobileService.getSessionState() !== 'registered'){
        $rootScope.toRoute('login', { returnRte: 'profile'});

    } else {
        init();
    }

});
