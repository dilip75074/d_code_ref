'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:StoreLocatorCtrl
 */
angular.module('stpls')
    .controller('StoreLocatorCtrl', function($scope, $rootScope, $state, $timeout, $translate, $interval, $window, $cookies, GoogleMapLoader, Locator, scroll, Device, Config, InsideChat, Seo) {

        $scope.remembered_store = Locator.getRememberedStore();

        var radius = 40;            //  search by highest, we will filter later

        $scope.has_geo_enabled = Locator.hasGeoEnabled();

        var initResults = function(input) {
            $scope.distance_unit = $rootScope.locale == 'en_US' ? 'mi' : 'km';

            $scope.locator_search = {
                input: (input || $state.params.addr || '').replace(/\W+/g, ' '),
                input_error: false,
                radius: radius,
                radius_options: {
                    10: '10 ' + $scope.distance_unit,
                    20: '20 ' + $scope.distance_unit,
                    30: '30 ' + $scope.distance_unit,
                    40: '40 ' + $scope.distance_unit
                },
                limit: 100,
                refine: false,
                refine_legend: false,
                header: null,
                geo: false,
                results: false
            };

            $scope.locator_search.refine_selected = {};
            angular.forEach($scope.storeFeatures, function(feature) {
                $scope.locator_search.refine_selected[feature.name] = false;
            });

            $scope.locator_results = $state.params.results || false;
            $scope.refine_select = false;
            $scope.map = false;
            $scope.store_detail = $state.params.store || false;
            $scope.locator_view = $state.params.map ? 'map' : 'list';
            $scope.loading = false;
        };

        /*  Get the store features */
        $scope.storeFeatures = Config.getProperty('store_features');

        initResults();
        $scope.alerted = false;

        var initGMap = function() {
          // Lazy load Google Maps API library
          $timeout(function() {
              GoogleMapLoader.loadGoogleMap(function() {
                  $scope.map_api_loaded = true;
              });
          });
        };

        /*
         *  Search by user's current Geo-Location
         */
        $scope.searchByGeo = function() {
            $scope.has_geo_enabled = Locator.hasGeoEnabled();

            if ($scope.alerted) {
                $scope.alerted = false;
                return $scope.alerted;
            }

            // Reset view
            initResults();

            // Set loading state & reset input field
            $scope.loading = true;
            $scope.locator_search.geo = true;

            $state.go('locator.results', {
                addr: 'geo'
            });

            var radius = 40;            //  search by highest, we will filter later
            var offset = 0;
            var results = Locator.getStoresByGeo(radius, $scope.locator_search.limit, offset);
            results.then(function(stores) {

                $scope.locator_search.header = 'geo';
                setStoreResults(stores);
                $scope.locator_search.offset = 0;
                $scope.loading = false;

                initGMap();

                if ($rootScope.formFactor != 'mobile') {
                    $scope.reloadMap();
                }
            }, function(reason) {
                $scope.loading = false;
                $scope.locator_search.geo = false;
                $scope.locator_results = undefined;
                alert(reason);
                $scope.alerted = true;
            });
        };

        /*
         *  Search by provided zip or address
         */
        $scope.searchByInput = function() {

            if ($scope.locator_search.input_error) {
                //  prevent multiple entries into this code
                // while there is an error
                return;
            }

            // Hide keyboard
            document.getElementsByName('locatorsearch_input')[0].blur();

            if ($scope.loading) {
                return false;
            }
            if (!$scope.locator_search.input) {
                $scope.locator_search.input_error = true;
                return false;
            } else {

                // Reset view
                initResults($scope.locator_search.input);

                // Set loading state & reset geo button
                $scope.loading = true;
                $scope.locator_search.geo = false;
                var addr = $scope.locator_search.input;

                $state.go('locator.results', {
                  addr: Seo.sanitizer.uri(addr, '-')
                });

                var results = Locator.getStoresByAddr(addr, radius);
                results.then(function(stores) {
                    if (stores && stores.length) {

                        $scope.locator_search.header = 'input';
                        setStoreResults(stores);

                        $scope.locator_search.offset = 0;
                        $scope.loading = false;

                        initGMap();

                    } else {
                        $scope.loading = false;
                        $scope.locator_results = undefined;
                        $scope.locator_search.input_error = true;
                    }

                    if ($rootScope.formFactor != 'mobile') {
                        $scope.reloadMap();
                    }
                }, function(reason) {
                    $scope.loading = false;
                    $scope.locator_results = undefined;
                    $scope.locator_search.input_error = true;
                });
            }
        };

        $scope.findClosest = function() {

            if ($scope.alerted) {
                $scope.alerted = false;
                return false;
            }

            // Reset view
            initResults();

            // Set loading state & reset input field
            $scope.loading = true;

            // if zipcode provided
            if ($cookies.get('zipcode') != undefined) {
                $scope.locator_search.input = $cookies.get('zipcode');
                var result = Locator.getStoresByAddr($cookies.get('zipcode'), radius);
            } else { // if geo enabled

                $scope.locator_search.geo = true;
                var result = Locator.getStoresByGeo(radius, 1, 0);
            }
            result.then(function(store) {
                $scope.locator_closest = store[0];
                if ($scope.locator_search.geo) {
                    $scope.locator_search.header = 'geo';
                }
            }, function(reason) {
                $scope.locator_closest = false;
                if ($scope.locator_search.geo) {
                    $scope.locator_search.geo = false;
                    if (!$scope.alerted) {
                        //alert(reason);
                    }
                }
            })['finally'](function() {
                $scope.loading = false;
                InsideChat.trackerArticle('Store Locator');
            });
        };

        $scope.refreshStoreResults = function() {
            setStoreResults(null);
        };

        var setStoreResults = function(stores) {
            if (stores != null) {
                $scope.locator_result_set = stores;
            }

            var s = [];
            var r = parseInt($scope.locator_search.radius);
            angular.forEach($scope.locator_result_set, function(store) {

                if (store.dis <= r) {
                    s.push(store);
                }
            });

            $scope.locator_results = s;
        };

        $scope.toggleResultView = function() {

            // If on store result
            if ($state.is('stores')) {
                var addr = $state.params.addr;
                var detail = $scope.store_detail;
                if (!addr && detail) {
                  var storeAddress = detail.store_address;
                  if (storeAddress) {
                    addr = [storeAddress.city, storeAddress.state];
                  }
                }
                $scope.$parent.$parent.store_detail = false;
                $scope.store_detail = false;
                $state.go('locator.results', {
                  addr: Seo.sanitizer.uri(addr, '-'),
                  map: true
                });

            } else {
              $scope.refine_select = false;
              $scope.locator_view = $scope.locator_view === 'list' ? 'map' : 'list';

            }
        };

        $scope.$on('locator.toggleRefineLegend', function() {
            $scope.locator_search.refine_legend = !$scope.locator_search.refine_legend;

            $scope.$parent.$watch(function() {
                return $scope.sidebar_toggle;
            }, function(newV, oldV) {

                if (newV) {
                    $scope.locator_search.refine_legend = false;
                }
            });
        });


        $scope.viewStoreDetail = function(store) {

            $scope.locator_search.refine_legend = false;
            $scope.store_detail = store;

            var seo = $state.params.addr;
            var address = store.store_address;
            if (address) {
              seo = [address.address_line1, address.city, address.state, address.zip];
            }

            // MWINHS-2013: decouple from main /locator route, but keep state params
            $state.go('stores', {
              seo: Seo.sanitizer.uri(seo, '-'),
              store: store.store_number,
              addr: $scope.locator_search.input, // preserve query
              results: $scope.locator_results, // keep results
              detail: store // pass store detail
            });

         };

        //  go to last store
        $scope.scrollTo = function(id) {
            $location.hash(id);
            $anchorScroll();
        };

        $scope.toggleResultRefine = function(attr) {

            $scope.locator_search.refine = true;

            $scope.locator_search.refine_selected[attr] = !$scope.locator_search.refine_selected[attr];

            $scope.refine_changed = true;
            $timeout(function() {
                $scope.refine_changed = false;
            }, 1000);
        };

        $scope.toggleStoreAttrFilter = function() {

            $scope.refine_select = !$scope.refine_select;
            if ($scope.refine_select) {

                $timeout(function() {
                    var scrollTo = function(element, to, duration) {

                        if (duration < 0) return;
                        var difference = to - element.scrollTop;
                        var perTick = difference / duration * 10;

                        setTimeout(function() {
                            if (perTick > 0) {
                                element.scrollTop = element.scrollTop + perTick;
                                scrollTo(element, to, duration - 10);
                            }
                        }, 10);
                    };

                    scrollTo(document.body, document.getElementsByClassName('refine_container')[0].getBoundingClientRect().top, 250);

                }, 150);
            }
        };

        $scope.locatorStoreAttrFilter = function(store) {
            if ($scope.locator_search.refine) {
                var meetsFilter = true;
                for (var attr in $scope.locator_search.refine_selected) {
                    //  attr = 0,1,2
                    if ($scope.locator_search.refine_selected[attr]) {
                        var mFilter = false;
                        store.storeFeatures.forEach(function(store_attr) {
                            if (store_attr['code'] == attr) {
                                mFilter = true;
                            }
                        });
                        meetsFilter = mFilter;
                    }
                }
                return meetsFilter;
            } else {
                return true;
            }
        };

        $scope.reloadMap = function() {

            if ($scope.map_api_loaded == true) {
                $scope.map_api_loaded = false;

                $timeout(function() {
                    $scope.map_api_loaded = true;
                }, 2);
            }
        };


        $scope.reload = function() {

            location.reload();
        };

        $rootScope.$on('$stateChangeSuccess', function() {

            if ($state.current.name === 'locator') {
                $scope.findClosest();
            }

            $scope.refine_select = false;
            $scope.locator_search.refine_legend = false;
        });

        $scope.$on('$viewContentLoading', function() {

            if ($state.current.name == 'locator') {
                $scope.findClosest();
            }
        });

        if ($state.current.name == 'locator') {
            $scope.findClosest();
        } else if ($state.is('stores')) {
          if ($scope.locator_results) { // user comes from locator.results
            initGMap();
          }
        }
    });


angular.module('stpls')
    .controller('StoreLocatorResultsCtrl', function($scope, $rootScope, $state, $timeout, $interval, $window) {

        var findAndSelectStore = function(lastStore) {
            if ($scope.locator_results) {
                var idx = $scope.locator_results.indexOf (lastStore);
                var test;
            }
        };

        var checkResults = function() {
            var addr = $state.params.addr;
            if ($state.is('locator.results') && addr) {
                if ($scope.$parent && !$scope.$parent.loading && !$scope.$parent.locator_results) {
                    if (addr === 'geo') {
                        $scope.$parent.searchByGeo();
                        if ($state.params.lastStore) {
                            findAndSelectStore($state.params.lastStore);
                        }
                    } else if (addr.length > 0) {
                        $scope.$parent.locator_search.input = addr;
                        $scope.$parent.searchByInput();
                        if ($state.params.lastStore) {
                            findAndSelectStore($state.params.lastStore);
                        }
                    } else {
                        $state.go('locator');
                    }
                }
            }

        };

        $rootScope.$on('$stateChangeSuccess', function() {

            if ($state.is('locator.results')) {

                // Hide store detail on back button
                try {
                    $scope.$parent.store_detail = null;
                } catch (e) {}

                checkResults();
            }
        });

        $scope.$on('$viewContentLoading', function() {
            checkResults();
        });

        checkResults();
    });


angular.module('stpls')
    .controller('StoreLocatorDetailCtrl', function($scope, $rootScope, $state, $timeout, $interval, GoogleMapLoader, Locator, scroll, Device, Seo) {

        var detail = $scope.store_detail = $scope.store_detail || $state.params.detail;
        var storeId = $scope.storeId = $state.params.store;

        // if direct request (results not populated)
        if (storeId && !detail) {

            var store = Locator.getStoreByNumber(storeId);
            store.then(function(store) {
                    // $scope.$parent.$parent.store_detail = store;
                    detail = $scope.store_detail = store;
                    $scope.remembered_store = Locator.isRememberedStore(store);
                    // $scope.$parent.storeSearchListener(store);

                    // invoke SEO update
                    var address = store.store_address || {};
                    $rootScope.seo.description = null;
                    $rootScope.seo.name = 'Staples Store at ' + [address.address_line1, address.city, address.state, address.zip].filter(function(v) {
                      return !!v;
                    }).join(', ');
                }) ['finally'](function(){
                  $scope.loaded = true;
                });

        } else {
            $scope.remembered_store = Locator.isRememberedStore($scope.store_detail);
            $scope.loaded = true;
            // $scope.$parent.storeSearchListener($scope.store_detail);
        }

        $scope.fromResults = !!$state.params.addr;

        $scope.backToResults = function() {

            // passed from previous state
            var addr = $state.params.addr;
            if (!addr && detail) {
              var storeAddress = detail.store_address;
              if (storeAddress) {
                addr = [storeAddress.city, storeAddress.state];
              }
            }

            $state.go('locator.results', {
              addr: Seo.sanitizer.uri(addr, '-')
            }, {
                location: 'replace',
                relative: false
            });

        };

        $scope.toogleRememberedStore = function() {
            if (Locator.isRememberedStore($scope.store_detail)) {

                Locator.setRememberedStore(false);
                $rootScope.$broadcast('nearestStoreChanged', {
                    selStore: $scope.locator_closest
                });
                $scope.$parent.$parent.remembered_store = false;
                $scope.remembered_store = false;
              } else {

                Locator.setRememberedStore($scope.store_detail);

                $rootScope.$broadcast('preferredStoreChanged', {
                    selStore: $scope.store_detail
                });
                $scope.$parent.$parent.remembered_store = $scope.store_detail;
                $scope.remembered_store = true;
             }
        };

        $scope.featureImageForCode = function(code) {
            return Locator.featureImageForCode(code);
        };

        $scope.viewDirections = function(store) {
            var addr = store.store_address;
            var directionsURL = ['http://maps', (Device.is.ios() ? 'apple' : 'google'), 'com/'].join('.');
            directionsURL += '?daddr=' + [addr.address_line1, addr.city, addr.state].join(',');

            if ($state.params.addr) {
              directionsURL += '&saddr=' + $state.params.addr;
            }

            window.location = directionsURL;
        };

        $scope.directToWeeklyAd = function(store) {
            var params = {
                storeid: store.store_number,
                city: store.store_address.city,
                state: store.store_address.state,
                zipcode: store.store_address.zip
            };
            $rootScope.toRoute('weeklyAd', {storeInfo: encodeURIComponent(JSON.stringify(params))});
        };

        $scope.searchStore = function(store) {

            if (Device.isNative()) {
                window.location = openAppPages(APP_SEARCH_PAGE);
            } else {
                angular.element(document.getElementsByClassName('searchOverlay')[0]).scope().current_store(store, true);
            }
        };


        $scope.show_store_events = false;

        $scope.toggleStoreEvents = function(store) {

            if (!$scope.show_store_events) {
                $scope.show_store_events = true;
                $scope.store_events_loading = true;

                $timeout(function() {
                    $scope.store_events_loading = false;
                    $scope.store_events = false;
                }, 1000);

            } else {
                $scope.show_store_events = false;
                $scope.store_events_loading = false;
                $scope.store_events = false;
            }
        };

    });


angular.module('stpls')
    .controller('StoreLocatorMapCtrl', function($scope, $rootScope, $timeout, $interval, $window, $q, $compile, GoogleMapLoader, Locator, scroll, Device) {

        $scope.$parent.$watch(function() {
            return $scope.locator_results;

        }, function(oldV, newV) {

            if ($scope.map_results && $scope.map_results.length) {
                $scope.map_results = [];
                $scope.dropPins();
            }
        });

        $scope.loaded = false;
        $scope.show = false;
        $scope.coords = false;
        var userMarker = false;

        $scope.coords = {
            lon: $scope.locator_results[0].loc[0],
            lat: $scope.locator_results[0].loc[1]
        };

        // User coords & init center coords
        var coords = Locator.getExistingLatLong();
        coords.then(function(coords) {
            userMarker = coords;
            $scope.loadMap();
        }, function() {
            $scope.loadMap();
        });

        $scope.initMap = function() {

            if (true) {
                var icons = {
                    store: 'assets/images/store_pin@2x.png',
                    my_store: 'assets/images/my_store_pin@2x.png',
                    location: 'assets/images/geo_pin@2x.png'
                };
            } else {

                var icons = {
                    store: 'assets/images/store_pin.png',
                    my_store: 'assets/images/my_store_pin.png',
                    location: 'assets/images/geo_pin.png'
                };
            }

            $scope.map = {

                // center: {
                // latitude: $scope.coords.lat,
                // longitude: $scope.coords.lon
                // },
                //
                // user: {
                // latitude: $scope.coords.lat,
                // longitude: $scope.coords.lon
                // },

                store_icon: icons.store,
                my_store_icon: icons.my_store,
                location_icon: icons.location,
                zoom: 10,

                events: {
                    click: function(store) {
                        if (store.index == 'REM') {
                            $scope.viewMapStoreDetail($scope.$parent.remembered_store);

                        } else {
                            $scope.viewMapStoreDetail($scope.$parent.locator_results[store.index]);
                        }
                    }
                },

                idle: {
                    idle: function() {
                        $scope.mapIdle();
                    }
                },

                control: {}
            };

            if (userMarker) {

                $scope.map.center = {
                    latitude: $scope.coords.lat,
                    longitude: $scope.coords.lon
                };
                $scope.map.user = [userMarker.lon, userMarker.lat];

            } else {
                $scope.map.center = {
                    latitude: $scope.coords.lat,
                    longitude: $scope.coords.lon
                };

                $scope.map.user = false;
            }

            $scope.map_results = [];

            $scope.loaded = true;
        };

        var mapResized = false;
        var pinsDropped = false;

        $scope.mapIdle = function() {

            console.log('Google Maps idle');

            if (!mapResized) {
                $scope.resizeMap();
                mapResized = true;
                console.log('Map resized');
            } else if (!pinsDropped) {

                $scope.dropPins();
                pinsDropped = true;
            }
        };

        $scope.dropPins = function() {

            $scope.show = true;
            var first = true;

            var drop = function(store) {
                $scope.$apply(function() {
                    $scope.map_results = $scope.map_results.concat(store);
                });
            };

            $timeout(function() {
                var t = 0;
                var i = 10;

                // Check for my store
                if (first && $scope.remembered_store != false) {

                    angular.forEach($scope.$parent.locator_results, function(store, count) {

                        if (($scope.remembered_store != false ? store.store_number == $scope.remembered_store.store_number : false)) {

                            $scope.$apply(function() {
                                $scope.map.my_store = {
                                    loc: store.loc
                                };
                            });
                            t = 500;

                            first = false;
                            return false;
                        }
                    });
                }

                // To animate (one after the other) dropping of location markers
                angular.forEach($scope.$parent.locator_results, function(store, count) {

                    // If current isn't rem store
                    if (($scope.remembered_store != false ? store.store_number != $scope.remembered_store.store_number : true)) {

                        $timeout(function() {
                            drop({
                                loc: store.loc
                            });
                        }, t + i);

                        if (i >= 2000) {
                            //i += 0;
                        } else {
                            i += 150;
                        }
                    }
                });
            }, 500);
        };

        $scope.resizeMap = function() {

            // Calc & set starting map height
            var map_height = window.innerHeight - 100;
            document.getElementsByClassName('angular-google-map-container')[0].style.height = map_height + 'px';

            var map = $scope.map.control.getGMap();
            $scope.$apply(function() {
                $scope.map_height = map_height;
                $scope.mapLoaded = true;
            });

            $timeout(function() {
              google.maps.event.trigger(map, 'resize');

                map.setCenter(new google.maps.LatLng($scope.coords.lat, $scope.coords.lon));
                map.setOptions({
                    draggable: true
                });

            }, 500);
        };

        $scope.loadMap = function() {

            GoogleMapLoader.loadGoogleMap(function() {
                $scope.initMap();
            });
        };

        $scope.viewMapStoreDetail = function(store) {

            var first = (!$scope.map.store_detail);

            $scope.$apply(function() {
                $scope.map.store_detail = store;
            });

            if (first) {
                var map_height = window.innerHeight - 100;
                var store_detail_height = document.getElementsByClassName('map_store_detail')[0].offsetHeight;
                document.getElementsByClassName('angular-google-map-container')[0].style.height = (map_height - store_detail_height) + "px";
            }
        };
    });


stpls.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function(val) {
                return '' + val;
            });
        }
    };
});
