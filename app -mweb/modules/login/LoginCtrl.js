'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:LoginCtrl
 */
angular.module('stpls')
    .controller('LoginCtrl', function($scope, $stateParams, $rootScope, $state, $translate, $timeout, $interval, $window, Cart, MobileService, Profile, ShippingConfig, InsideChat, NuData) {

    $scope.resetError;
    $scope.show_submit = true;
	$scope.FORCEFTP = false;

	if ($stateParams.returnRte) {
    	$scope.returnRoute = $stateParams.returnRte;
    } else {
    	$scope.returnRoute = localStorage.getItem('returnRouteFromPwdReset');
    	if (!$scope.returnRoute) {
    		$scope.returnRoute = 'home';
    	}
    }

    $scope.forgotRtnMessage;

    var init = function() {

    	InsideChat.trackerLogin();

        $scope.login = {
            userID: '',
            password: '',
            remember: true
        };
        $scope.errorMsg = null;
        $scope.login_state = 'input';
    };

    // if state is logout
    if ($state.current.name == 'logout') {
        $scope.$parent.overlay_loading = true;

        MobileService.attemptSessionLogout().then(function() {
            $scope.$parent.overlay_loading = false;
            init();


           	//  Logout Inside Chat for registered user
            InsideChat.trackerLogoutUser();

            ShippingConfig.init();

            Cart.init().then(function() {
                $rootScope.toRoute('home');
            });
        });

    } else {
        init();
    }

	$scope.forgotMyPassword = function() {
		$rootScope.toRoute('forgotpassword', {
			returnRte: $scope.returnRoute
		});
	};

    $scope.forgotPwdSubmit = function(form) {
        if (form.$valid) {
            var a = Profile.resetPasswordByEmail(form.email1.$viewValue);
            a.then(function(data) {
                if ((String(data) === '')) {
                    $scope.forgotRtnMessage = $translate.instant('LGN_PWD_RESET_OK');
                    //  Save the current return route as necessary
					localStorage.setItem('returnRouteFromPwdReset', $scope.returnRoute);

                    $scope.show_submit = false;
                } else {
                    $scope.forgotRtnMessage = $translate.instant('LGN_PWD_RESET_ERR');
                 }
            }, function(error) {
                $scope.forgotRtnMessage = $translate.instant('LGN_PWD_RESET_ERR');
            });
        }
    };

    $scope.forceResetPassword = function() {
		//  Save the current return route as necessary
		localStorage.setItem('returnRouteFromPwdReset', $scope.returnRoute);
		$scope.FORCEFTP = false;

        //  show alert
        $rootScope.simplePrompt({
        	message: $translate.instant('LGN_RESET_SUCCESS_MSG'),
        	actions: {
                primary: {
                    title: $translate.instant('LGN_RESET_SUCCESS_BTN'),
                    callback: function() {
                    }
                }
        	}
    	});
    };

    $scope.continueShopping = function() {
        $rootScope.toRoute('home');
    };

    $scope.attemptLogin = function(form) {

        if (form.$valid) {

            try {
                if (NuData.enabled && typeof nds !== "undefined") {
                    nds.send();
                }
            } catch(ex) {
                console.log ('error accessing NuData nds.send(), exception was ' + ex);
            }

            $scope.login_state = 'processing';
            var a = MobileService.attemptSessionLogin($scope.login.userID, $scope.login.password);
            a.then(function(data) {

                $scope.FORCEFTP = false;
				localStorage.setItem('returnRouteFromPwdReset', '');

				ShippingConfig.init();

				Profile.init(true);
				//  Establish Inside Chat for registered user
				InsideChat.loadInsideChat(MobileService.getSessionUserID(), MobileService.getSessionUserName());

                Cart.init().then(function() {
                    var cart = Cart.getInfo();
                    if (cart) {
                        // Update cart count if login succeeded
                        $rootScope.setCartCount(cart.itemCount);
                    }
                    $scope.login_state = 'success';
                    $rootScope.toRoute($scope.returnRoute, null, {
                        location: "replace"
                    });
                });
            }, function(error) {

                $scope.login_state = 'error';
                init();
                form.$setPristine();
                form.$setUntouched();

                if (error.status === 401) {
                    $scope.errorMsg = $translate.instant('LGN_ERROR_USERNAME');
                } else if (error.data && error.data.originalError && error.data.originalError.data.errors && error.data.originalError.data.errors.length > 0) {
                	if (error.data.originalError.data.errors[0].errorCode && error.data.originalError.data.errors[0].errorCode === '2011') {

                		//  FORCEFTP:  User must reset their password now
                		$scope.FORCEFTP = true;
                		return;
                	}
                }
                if (error.data && error.data.errorMessage) {
                    $scope.errorMsg = error.data.errorMessage;
                }
            });
        }
    };

 });
