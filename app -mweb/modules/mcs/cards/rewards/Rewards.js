'use strict';

angular.module('stpls')
    .directive('mcsRewards', function($translate, MobileService, Rewards, $rootScope, Profile) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                rewards: '='
            },
            templateUrl: 'modules/mcs/cards/rewards/Rewards.html',
            link: function($scope, element, attrs) {
                var sessionUser = MobileService.getSessionUserName();
                $scope.link = $translate.instant('RWD_LINKEXISTING');               //  link account
                $scope.action = 'Enroll';
                if (sessionUser) {
                  Profile.getProfile().then(function(response) {
                      $scope.profile = response;
                      Rewards.getRewardsDashboard().then(function(data) {
                        var rewards = data || {};
                         if (rewards.rewardsNumber) {
                             $scope.hasRewardsNum = true;
                             $scope.link = $translate.instant('RWD_VIEW');
                             $scope.action = 'Redeem';
                             $scope.rewardsNumber = rewards.rewardsNumber;
                             $scope.amountRewards = 0.00;

                             //  Tally up all the regular rewards totals
                             var rewardDetails = rewards.rewardDetails[0].reward;
                             if (rewardDetails) {
                                 angular.forEach(rewardDetails, function(reward) {
                                    if (reward.isApplied === 'false') {
                                      var fAmt = parseFloat (reward.amount.replace('$', ''));
                                      if (!isNaN(fAmt)) {
                                         $scope.amountRewards += fAmt;
                                      } else {
                                          console.log ('Unable to parse reward value of ' + reward.amount);
                                      }
                                    }
                                 });
                             }

                             //  Tally up all the ink rewards totals
                             var inkDetails = rewards.inkRecyclingDetails[0].reward;
                             if (inkDetails) {
                                 angular.forEach(inkDetails, function(reward) {
                                    if (reward.isApplied === 'false') {
                                      var fAmt = parseFloat (reward.amount.replace('$', ''));
                                      if (!isNaN(fAmt)) {
                                         $scope.amountRewards += fAmt;
                                      } else {
                                          console.log ('Unable to parse ink reward value of ' + reward.amount);
                                      }
                                    }
                                 });
                             }
                             $scope.redeemable = rewards.redeem;
                             $scope.name = $scope.profile.emailAddress || '';
                             $scope.memberType = rewards.rewardsAccountType;
                         }
                       });
                    });
                }

                $scope.gotoRewards = function() {
                    if ($scope.link === $translate.instant('RWD_LINKEXISTING')) {
                        $rootScope.toRoute('profilelinkrewards', {
                            id: true
                        });
                    } else if ($scope.link === $translate.instant('RWD_VIEW')) {
                        $rootScope.toRoute('rewards');
                    }
                };

                $scope.gotoEnroll = function() {
                    $rootScope.toRoute('rewardsEnroll');
                };
            }
        };
    });
