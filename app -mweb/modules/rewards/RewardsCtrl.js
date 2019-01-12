'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:RewardsCtrl
 */

angular.module('stpls').controller('RewardsCtrl', function($scope, $stateParams, $modal, $rootScope, $state, $timeout, $interval, $window, $translate, MobileService, Rewards, Profile, scroll) {

    var init = function() {
        $scope.open = false;
        $scope.formattedRewardsNumber = null;
        $scope.emailAddress = Profile.emailAddress;
        $scope.rewardsDashboard = null;
        $scope.rewards = null;
        $scope.inkRewards = null;
        $scope.profile = null;
        $scope.isLoading = false;
        $scope.isLogged = false;
        $scope.hasRewardsNum = true;
        $scope.enrollObj = null;
        $scope.noDashboardError = null;
        $scope.customerTier = '';    //  will cause generic page to show

        //  Check if User Logged In
        $scope.noDashboardError = null;
        if (MobileService.getSessionState() === 'registered') {
            $scope.isLogged = true;
            Profile.profileAgg().then(function(response) {
                $scope.profile = response;
                $scope.customerTier = $scope.profile.customerTier;
                if ($scope.profile.storedAddressCount > 0) {
                    //  If user has an address, save it for
                    //  pre-populating enrollment
                    $scope.enrollObj = {
                        firstName: $scope.profile.addresses[0].first,
                        lastName: $scope.profile.addresses[0].last,
                        addrLine1: $scope.profile.addresses[0].addressLine1,
                        addrLine2: $scope.profile.addresses[0].addressLine2,
                        city: $scope.profile.addresses[0].city,
                        state: $scope.profile.addresses[0].state,
                        zip: $scope.profile.addresses[0].zip,
                        phone: $scope.profile.addresses[0].phone,
                        phoneExt: $scope.profile.addresses[0].phoneExt
                    };
                }
                $scope.hasRewardsNum = ($scope.profile.rewardsNumber);
                if ($scope.profile.rewardsNumber) {
                    $scope.hasRewardsNum = true;
                    $scope.isLoading = true;
                    var results = Rewards.getRewardsDashboard();
                    results.then(function(data) {
                        if (data) {
                            $scope.isLoading = false;
                            $scope.rewardsDashboard = data;
                            //  Format the Rewards #
                            var str = $scope.rewardsDashboard.rewardsNumber;
                            $scope.formattedRewardsNumber = str.substr(0, 3) + ' ' + str.substr(3, 4) + ' ' + str.substr(7, 3);
                            $scope.rewards = $scope.rewardsDashboard.rewardDetails[0].reward;
                            $scope.inkRewards = $scope.rewardsDashboard.inkRecyclingDetails[0].reward;

                            /* //  ADD TEST DATA
                             var one = { amount : "$127.10", code : 1385320000207493, expiryDate : "12/31/2015", isApplied : true, issuedDate : "2/1/2015" };
                             var two = { amount : "$6.00", code : 1385320000207494, expiryDate : "11/30/2015", isApplied : false, issuedDate : "1/1/2015" };
                             var three = { amount : "$10.75", code : 1385320000207495, expiryDate : "9/10/2015", isApplied : false, issuedDate : "11/15/2015" };
                             $scope.rewards = new Array(one, two, three);

                             one = { amount : "$2.33", code : 1385320000207496, expiryDate : "12/31/2015", isApplied : false, issuedDate : "2/1/2015" };
                             two = { amount : "$1.00", code : 1385320000207497, expiryDate : "11/30/2015", isApplied : true, issuedDate : "1/1/2015" };
                             $scope.inkRewards = new Array(one, two); */

                        } else {
                            $scope.noDashboardError = $translate.instant ('RWD_DASHBOARD_ERROR');
                        }
                    }, function(error) {
                        $scope.showDashBoardError();

                    })['finally'](function(){
                        $scope.isLoading = false;
                    });
                }
            }, function(error) {
                console.log('error getting profile', error);
            });
        } else {
            $rootScope.toRoute('login', { returnRte: 'rewards'});
        }
    };

    //  Initialize rewards
    init();

    $scope.showDashBoardError = function() {
        $scope.prompt({
            header: {
                close: true,
                title: $translate.instant ('RWD_ERROR_TITLE')
            },
            animation: true,
            actions: {
                primary: {
                    title: $translate.instant ('GEN_CONTINUE_BTN'),
                    route: 'account'
                },
            }
        }, 'dashboard_error_prompt', 'modules/rewards/dashboard_error_prompt.html', 'RewardsCheckCtrl');
    };

    $scope.showRewardsCoupon = function(rewardObj) {

        //  Clear previous message, if any
        var idx = $scope.rewards.indexOf(rewardObj);
        if (idx >= 0) {
            $scope.rewards[idx].error = '';
            $scope.rewards[idx].hasError = 'false';
        } else {
            idx = $scope.inkRewards.indexOf(rewardObj);
            if (idx >= 0) {
                $scope.inkRewards[idx].error = '';
                $scope.inkRewards[idx].hasError = 'false';
            }
        }

        var str = String(rewardObj.code);
        var formattedRewardNum = str.substr(0, 4) + '-' + str.substr(4, 4) + '-' + str.substr(8, 4) + '-' + str.substr(12, 4);

        $scope.prompt({
            header: {
                close: true,
                title: $translate.instant('RWD_REDEEM_TITLE')
            },
            code: formattedRewardNum,
            rawCode: rewardObj.code,
            expires: rewardObj.expiryDate,
            amount: rewardObj.amount,
            animation: true,
            actions: {
                primary: {
                    title: $translate.instant('GEN_CANCEL_BTN'),
                    route: 'rewards'
                },
                secondary: {
                    title: $translate.instant('GEN_DONE_BTN'),
                    route: 'rewards'
                }
            }
        }, 'instore_prompt', 'modules/rewards/instore_prompt.html', 'RewardsCheckCtrl');

        $scope.init();
    };

    $scope.addCouponToCart = function(rewardObj) {
        //  Clear previous message, if any
        var displayName = $translate.instant('RWD_EARNED_REWARD');
        var idx = $scope.rewards.indexOf(rewardObj);
        if (idx >= 0) {
            $scope.rewards[idx].error = '';
            $scope.rewards[idx].hasError = 'false';
        } else {
            idx = $scope.inkRewards.indexOf(rewardObj);
            if (idx >= 0) {
                displayName = $translate.instant('RWD_EARNED_INK_REWARD');
                $scope.inkRewards[idx].error = '';
                $scope.inkRewards[idx].hasError = 'false';
            }
        }

        var rewardDisplayObj = {
            name: displayName,
            expdate: rewardObj.expiryDate,
            savings: rewardObj.amount + ' in savings!'
        };

        var result = Rewards.addRewardCouponToCart(rewardObj.code);
        if (result) {
            result.then(function(result) {
                console.log('added reward code to cart', result);

                $scope.prompt({
                    header: {
                        close: true,
                        title: $translate.instant('RWD_ATC_TITLE')
                    },
                    reward: rewardDisplayObj,
                    actions: {
                        primary: {
                            title: $translate.instant('RWD_VIEWCART'),
                            route: 'cart'
                        },
                        secondary: {
                            title: $translate.instant('RWD_CHKOUT'),
                            route: 'checkout'
                        }
                    }
                }, 'atc_prompt', 'modules/rewards/atcPrompt.html', 'RewardsCheckCtrl');
            }, function(error) {
                var message;
                if (error.data && error.data.errorMessage) {
                    message = error.data.errorMessage;
                    var idx = $scope.rewards.indexOf(rewardObj);
                    if (idx >= 0) {
                        $scope.rewards[idx].error = message;
                        $scope.rewards[idx].hasError = 'true';
                    } else {
                        idx = $scope.inkRewards.indexOf(rewardObj);
                        if (idx >= 0) {
                            $scope.inkRewards[idx].error = message;
                            $scope.inkRewards[idx].hasError = 'true';
                        }
                    }
                }
                console.log('error adding reward code to cart:', message);
            });
        } else {
          idx = $scope.inkRewards.indexOf(rewardObj);
          if (idx >= 0) {
            $scope.inkRewards[idx].error = 'Error adding reward code to cart.';
            $scope.inkRewards[idx].hasError = 'true';
          }
          console.log('error adding reward code to cart');
        }
    };


    $scope.enrollRewards = function() {

        $rootScope.toRoute('rewardsEnroll');
    };

    $scope.linkRewards = function() {

        $rootScope.toRoute('profilelinkrewards', {
            id: true
        });

    };

    $scope.cancelEnrollment = function() {

        $rootScope.toRoute('account');
    };


    $scope.performEnrollment = function() {
        $scope.isLoading = true;
        var result = Rewards.enrollUserInRewardsProgram($scope.enrollObj);
        if (result) {
            result.then(function(result) {
                console.log('enrolled user in rewards', result);
                $scope.isLoading = false;
                //  Best re-initialize for the dashboard
                //  after successful enrollment
                init();
                $rootScope.toRoute('rewards');

            }, function(error) {
                console.log('error enrolling user in rewards', error);
                $scope.isLoading = false;

            });
        } else {
            console.log('error enrolling user in rewards');
            $scope.isLoading = false;

        }
    };

    $scope.prompt = function(p, wclass, template, controller) {

        var p = $modal.open({
            windowClass: wclass,
            templateUrl: template,
            controller: controller,
            animation: true,
            size: 'sm',
            resolve: {
                prompt: function() {
                    return p;
                }
            }
        });
    };

    $scope.toggleAnimation = function() {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

    $scope.scroll = function(to) {
        $timeout(function() {
            scroll.to(to, 0);
        }, 450);

    };

    $scope.hideFooter = function() {
      $rootScope.hide_footer = true;
    };

});
