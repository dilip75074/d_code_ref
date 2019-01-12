/**
 * @ngdoc function
 * @name stpls.controller:PageCtrl
 */
angular.module('stpls')
    .controller('PageCtrl', function($scope, $rootScope, $state, $timeout, $window, $element, $location, scroll, Device, Locator, Cart, Profile, Browse, MobileService, GoogleMapLoader, Config, Analytics, InsideChat, FBMessenger, ClassSearch) {


        var initPage = function() {

            $scope.search_toggle = false;

            $scope.header_state = 'condense';

            $scope.show_about = false;

            $scope.search_store = false;

            $scope.sidebar_toggle = false;

            $scope.overlay_loading = false;

            $scope.state = $state;

            $scope.cart_count = 0;

            $scope.cart_indicate = false;

            $scope.session_user = MobileService.getSessionUserName();

            //perform global initializations
            $timeout(function() {

                var cN = $state.current.name;
                // Get cart count for header on page load (except for cart/checkout)
                if (cN !== 'cart' && cN !== 'checkout') {

                    Cart.init().then(function(resp) {
                        if (resp && resp.itemCount) {
                            var c = parseInt(resp.itemCount);
                            if (isNaN(c)) {
                                c = 0;
                            }
                            $rootScope.setCartCount(c);
                        }
                    });
                }

                //init user profile for Analytics
                if ($scope.session_user && ['profile', 'rewards', 'checkout'].indexOf(cN) === -1) {
                    Profile.init(true);
                }

                if ($scope.session_user) {
                    //  Establish Inside Chat for registered user
                    InsideChat.loadInsideChat(MobileService.getSessionUserID(), MobileService.getSessionUserName());
                } else {
                    //  Establish Inside Chat for guest user
                    InsideChat.loadInsideChat('', '');
                }
                FBMessenger.load();
                $scope.FBMessengerEnabled = FBMessenger.enabled();
                $scope.FBMessengerUrl = FBMessenger.getMsgUrl();

                //init locator for Analytics
                Locator.getGeo().then(function(loc) {
                    Analytics.updateLocation({
                        lat: loc.lat || '',
                        lng: loc.lon || ''
                    });
                });

                //  Load google maps, only if needed
                GoogleMapLoader.loadGoogleMap();

                $scope.headerState();

            }, 100);

        };

        initPage();

        // Reset page on state change
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
            // do something
            $scope.search_toggle = false;
            $scope.overlay_loading = false;
            $scope.sidebar_toggle = false;
            $rootScope.hide_footer = false;

            scroll.to('page-container', 0);

            //some overall page states
            $scope.isOverlayView = false;
            $scope.hasInputFocus = false;
            $scope.pageSearch = false;

            $scope.headerState(event, toState, toParams, fromState, fromParams);

        });

        $scope.setOverlayView = function() {
            $scope.isOverlayView = true;
        };

        $scope.setInputFocus = function(yn) {
            $scope.hasInputFocus = !!yn;
        };

        $scope.$on('search.pageInit', function() {
            $scope.pageSearch = true;
        });

        $scope.welcomeOverlayClose = function() {
            $scope.welcome_overlay = false;
            // initUsability();
        };

        // Store locator search call
        // TODO: this is terrible & doesn't even work.
        /** Commenting out because it just throws an error
         $scope.storeSearchListener = function(store) {

      $timeout(function() {

        var input = document.getElementsByClassName('search_input')[0];

        var searchStore = document.getElementsByClassName('search_store')[1];

        searchStore.addEventListener('click', function() {

            angular.element(document.getElementsByClassName('search_input')[0]).scope().setStore(store);

            $scope.$apply(function() {

              $scope.searchToggle();

            });

            input.focus();

        });


      }, 500);

    };*/

        $scope.searchToggle = function() {
            $scope.search_toggle = !$scope.search_toggle;
        };

        $scope.sidebarToggle = function() {

            $scope.sidebar_toggle = !$scope.sidebar_toggle;
            $scope.sidebar_animate = true;

            // opened
            if ($scope.sidebar_toggle) {
                $scope.session_user = MobileService.getSessionUserName();
            }

            var animated = document.getElementsByClassName('row-offcanvas')[0];
            var wait = ((animated && $window.getComputedStyle(animated)['transition-duration']) || '0.25s');
            wait = parseFloat(wait) * ((/ms$/).test(wait) ? 1 : 1e3) || 0;
            $timeout(function(){
                $scope.sidebar_animate = false;
            }, wait);

        };

        $scope.headerState = function() {
            var state = arguments.length == 0 ? $rootScope.$state.current.name : arguments[1].name;

            $scope.header_state = state == 'home' || state == 'guestHome' ? 'full' : 'condense';
        };

        // Footer
        $scope.showLocale = function() {
            return (/ca$/i).test($rootScope.locale || 'en_US');
        };
        $scope.toggleLocale = function() {
            var locale = ($rootScope.locale === 'en_CA' ? 'fr_CA' : 'en_CA');
            $rootScope.locale = Config.setLocale(locale);

            document.body.scrollTop = 0;

            document.location.reload();
        };

        $scope.feedbackPopup = function() {
            OOo.oo_mobile_feedback.show();
        };

        $scope.year = new Date().getFullYear();

        $scope.search = function(e) {
            var val = e.target[0].value;
            var t = ClassSearch.kosherTerm(val);

            setTimeout(function() {
              //document.getElementById('searchTextfield').blur();
            }, 250);

            $rootScope.toRoute('search', {
                seo: t,
                term: t,
                sort: 'best_match',
                filter: '',
                fids: ''
            }, {
                inherit: false
            });
        }

        $scope.show_about = false;
        $scope.showAbout = function() {
            $scope.show_about = !$scope.show_about;
            if ($scope.show_about) {
                $location.hash('ft-about');
                $anchorScroll();
            } else {
                $location.hash('page-footer');
            }
        };

        //Analytics signals for loading state
        Analytics.addWatch($scope, 'overlay_loading');

    })
    // capture routes that utilize .overlay_view to add parent class
    .directive('overlayView', function() {
        'use strict';
        return {
            restrict: 'C',
            link: function($scope) {
                ($scope.setOverlayView || angular.noop)();
            }
        };
    })
    .directive('stplsMain', function() {
        'use strict';
        return {
            restrict: 'C',
            link: function($scope, $elem) {

            }
        };
    });
