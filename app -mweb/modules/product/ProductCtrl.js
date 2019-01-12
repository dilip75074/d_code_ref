'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ProductCtrl
 */
angular.module('stpls')
  .controller('ProductCtrl', function($scope, $stateParams, $rootScope, $state, $timeout, $interval, $translate, $window, $location, $filter, Product, scroll, Cart, StoreInventory, Personalization, Account, Analytics, ShippingConfig, Config, $cookies, hookLogic, MobileService, Seo, DefaultStore, InsideChat, DoubleClick) {
    var s7basiczoom;

    $scope.loading = false;

    $scope.expand = {
      reviews: false,
      skuset: true,
      details: true,
      detailsSpec: false
    };

    var triadConstants = $scope.triad = Config.getProperty('triadConstants');

    var init = function() {
        $scope.itemAddedToCart = false;
        $scope.product_data = false;
        $scope.reviews = false;
        $scope.reviewsPos = false;
        $scope.reviewsNeg = false;
        $scope.reviewsData = false;
        $scope.reviewMax = 0;
        $scope.yotpoRating = 0;
        $scope.reviewCountStart = 0;
        $scope.reviewCountEnd = 0;
        $scope.totalReviews = 0;
        $scope.selected_img = 0;
        $scope.CustBought_Products = null;
        $scope.FBT_Products = null;
        $scope.FBT_Products_TotalPrice = null;
        $scope.FBT_Products_SeePriceInCart = false;
        $scope.saveState = $state.current.state;
        $scope.NoItemsAddedToCart = 0;
        $scope.ATCErrorMsg = null;
        $scope.adData = null;

        // Get cached sku or call API for Sku Info
        if ($stateParams.sku) {
            // specify identifier for conveyor content-topper (just in case)
            $stateParams.identifier = $stateParams.sku;
            $scope.sku = $stateParams.sku;

            // check if SKU info is prepopulated
            var pre = Product.isPrepopulatedSKU($scope.sku);
            if (pre) {
                $scope.product_data = pre;

                finishHandlingProduct($state);
            } else {
                // get all SKU info (try for Asgard first)
                //  TODO:  This is temporary.  It will get moved to CHAPI
                $scope.loading = true;
                Product.getBySKU($scope.sku, true).then(function(response) {
                    if (response) {
                        $scope.product_data = response;
                    }
                }, function(error) {
                    // get all SKU info (now try EZ Open)
                    Product.getBySKU($scope.sku, false).then(function(response) {
                        if (response) {
                            $scope.product_data = response;
                         }
                    }, function(error) {
                        $scope.product_data = null;
                        $state.go('notfound', {
                          error: error && error.status,
                          msg: error && error.statusText
                        }, {
                          location: 'replace'
                        });
                        // console.log ('product not found.');
                    })['finally'](function() {
                       finishHandlingProduct($state);
                       $scope.loading = false;
                    });

                })['finally'](function() {
                    finishHandlingProduct($state);
                    $scope.loading = false;
                });
            }
        }
    };

    var countDownATCOverlay = function () {
        $scope.product_data.cartMask = true;
        //  2 seconds
        $timeout(function() {
            $scope.product_data.cartMask = false;
        }, 2000);
    };

    var finishHandlingProduct = function(state) {
        //  To help with debugging, printout the product structure to the log
        //  console.log ('======>>> Product SKU: ' + $scope.product_data.sku + ' JSON data:\n' + JSON.stringify($scope.product_data));
        if (state.current.name === 'product') {

            initImage();
            getBOPISInventory(function() {
               handleTestingFlags();
               $scope.loading = false;
            });
        }

        if ($scope.state.current.name === 'productReviews' && !$scope.reviews) {
            $scope.getReviewData(0);
        }

        // Disable Bopis flag
        if ($scope.product_data && $scope.product_data.tag) {
            var shippingBits = ShippingConfig.getShippingBitFlags();
            var bitBopis = shippingBits.bitBopis;
            $scope.product_data.tag &= ~bitBopis;
        }

        var categoryPath = $scope.product_data.analytics.clName || $scope.product_data.analytics.scName || $scope.product_data.analytics.ssName || $scope.product_data.analytics.cgName || $scope.product_data.analytics.dpName;
        InsideChat.trackerProduct(categoryPath, $scope.product_data, Account.getZipCode());

        Analytics.captureDLO(Analytics.DLO.product, $scope.product_data);
        $rootScope.$broadcast('dataChanged');
    };

    var handleTestingFlags = function() {
      var params = $location.search();

      // don't do anything if we're pointed to a production
      // environment
      if($window.stpls_env === 'prod') {
        return;
      }

      var defaultStore = {
        address: '659 Worcester Rd.',
        city: 'Framingham',
        state: 'MA',
        phoneNumber: '',
        zip: '01701',
        distance: '',
        stockLevel: '',
        invQty: 0,
        storeNumber: '0349'
      };

      if(params.testFlags) {
        var str = params.testFlags;
        var tokens = str.split(',');
        var flags = {};
        for(var i in tokens) {
          var token = tokens[i];
          var pieces = token.split(':');
          flags[pieces[0]] = pieces[1] == '1' ? true : false;
        }


      }
    };

    var isTrue = function(val) {
      return !!~['true', true].indexOf(val);
    };

    var isFalse = function(val) {
      return !!~['false', false].indexOf(val);
    };

    var setBOPISSelected = function() {
        //  Force Bopis Flag to "ON" when Out-of-Stock online
        //  and there is in-store quantity available
        if (isFalse($scope.product_data.inStock) &&
            isTrue($scope.product_data.bopis) &&
            Number($scope.defaultStore.invQty) > 0) {
            $scope.product_data.bopisSelected = true;
        }
        //  Should bopis be on by default?   NO:  DO NOT SELECT BOPIS BY DEFAULT, PER PROD. MGMT (JIRA: MWINHS-2305)
        //if (isTrue($scope.product_data.bopis) &&
        //    Number($scope.defaultStore.invQty) > 0) {
        //    $scope.product_data.bopisSelected = true;
        //}
        if (isTrue($scope.product_data.bopis) &&
            isTrue($scope.product_data.retailOnly)) {
            $scope.product_data.bopisSelected = true;
        }
    };

    var getBOPISInventory = function(callback) {

        $scope.defaultStore = DefaultStore.getStore();
        if ($scope.defaultStore && $scope.defaultStore.invQty && $scope.defaultStore.sku === $stateParams.sku) {
            $scope.invMsg = $translate.instant('PROD_BOPIS_STOCK', {
                value: Number($scope.defaultStore.invQty)
            });

            if(callback) {
                callback();
            }
            setBOPISSelected();
            return;
        }

        if (!isTrue($scope.product_data.bopis) && isTrue($scope.product_data.inStock) && !isTrue($scope.product_data.retailOnly)) {
            //  available online only, so we don't care about store inventory
            $scope.loading = false;
        } else {

            var defaultstore = DefaultStore.getStore();
            if (!defaultstore) {
                defaultstore = DefaultStore.getFraminghamStore();
            }
            defaultstore.invQty = 0;        //  Clear out qty from another sku
            $scope.defaultStore = defaultstore;

            DefaultStore.getInventoryInStore(defaultstore, $scope.product_data).then(function(response) {
                if (response) {
                    $scope.defaultStore = response;
                    $scope.invMsg = $translate.instant('PROD_BOPIS_STOCK', {
                        value: Number($scope.defaultStore.invQty)
                    });

                    if (!$scope.product_data.shippingInfo) {
                        $scope.product_data.shippingInfo = {};
                    }
                    $scope.product_data.shippingInfo.deliveryAddressSelected = {
                        address: $scope.defaultStore.address,
                        city: $scope.defaultStore.city,
                        state: $scope.defaultStore.state,
                        zipCode: $scope.defaultStore.zip,
                        storeNumber: $scope.defaultStore.storeNumber
                    };
                } else {
                    $scope.invMsg = $translate.instant('PROD_BOPIS_STOCK', {
                        value: 0
                    });
                }
           }).catch(function(error) {
                $scope.invMsg = $translate.instant('PROD_BOPIS_STOCK', {
                    value: 0
                });
           })['finally'] (function () {
                $scope.loading = false;
                setBOPISSelected();
           });
        }

        if(callback) {
            callback();
        }
    };

    $scope.$watch('expand.reviews', function(r){
        if (r && !$scope.reviewsData) {
            $scope.getReviewData(0);
        }
    });

    var getFreqBoughtTogether = function() {
        var option = {
            context: $scope.product_data.sku,
            type: 'freqBoughtTogether'
        };
        $scope.FBT_Products_SeePriceInCart = false;
        var p = Personalization.callMarvinAPI(option);
        p.then(function(data) {
            if (data) {
                $scope.FBT_Products = data;
                $scope.FBT_Products_TotalPrice = 0;
                //  Get the total price for all the products
                angular.forEach(data, function(product) {
                    if (isTrue(product.priceInCartOnly)) {
                        $scope.FBT_Products_SeePriceInCart = true;
                    }
                    $scope.FBT_Products_TotalPrice += product.price.finalPrice;
                });
            }
        }, function() {
            $scope.FBT_Products = null;
            console.log('Freq. Bought Together not found,');
        });
    };

    var getCustUltimatelyBought = function() {
        var option = {
            context: $scope.product_data.sku,
            type: 'custUltimatelyBought'
        };
        var p = Personalization.callMarvinAPI(option);
        p.then(function(data) {
            if (data) {
                angular.forEach(data, function(product) {
                    if (product.price.totalSavingsPercentage && product.price.totalSavingsPercentage > 0) {
                        product.price.showWasPrice = 'true';
                        product.price.wasPrice = product.price.listPrice;
                    }
                });
                $scope.CustBought_Products = data;
            }
        }, function() {
            $scope.CustBought_Products = null;
            console.log('Customers Ultimatelty Bought Products not found,');
        });
    };

    var getAdData = function() {
        //  Implement Ad (Hook-Logic) data here.
        //  If $scope.adData is not null, then the Ad section will appear.
        $scope.adData = null;
    };

    $scope.getStarted = function() {
        Product.getStarted($scope.product_data);
    };

    $scope.getReviewData = function(pageAdjust) {
        var page;
        var totalReviews;
        if (!$scope.reviewsData) {
            page = 1;
        } else {
            page = $scope.reviewsData.response.pagination.page + pageAdjust;
        }
        $scope.loading = true;
        var r = Product.getReviews($scope.sku, null, "desc", page, 10);
        r.then(function(data) {
            $scope.reviewsData = data;
            $scope.totalReviews = $scope.reviewsData.response.pagination.total;
            $scope.yotpoRating = $scope.reviewsData.response.bottomline.average_score;
            $scope.reviews = $scope.reviewsData.response.reviews;
            $scope.reviewMax = $scope.reviews.length - 1;
            $scope.reviewCountStart = ($scope.reviewsData.response.pagination.page - 1) * $scope.reviewsData.response.pagination.per_page + 1;
            $scope.reviewCountEnd = ($scope.reviewsData.response.pagination.page) * $scope.reviewsData.response.pagination.per_page;
            if ($scope.reviewCountEnd > $scope.totalReviews) {
                $scope.reviewCountEnd = $scope.totalReviews;
            }
            if ($scope.totalReviews === 0) {
                $scope.reviewCountStart = 0;
            }

            //
            //  Get Most-Liked Positive Review, sort by votes_up descending and take the first result
            //
            var s = Product.getReviews($scope.sku, "votes_up", "desc", 1, 1);
            s.then(function(dataS) {
                $scope.reviewsPos = dataS.response.reviews;

                //
                //  Get Most-Liked Negative Review, sort by votes_down descending and take the first result
                //
                var t = Product.getReviews($scope.sku, "votes_down", "desc", 1, 1);

                t.then(function(dataT) {
                    $scope.reviewsNeg = dataT.response.reviews;
                }, function(error) {
                    console.log ('Error getting most liked negative review from Yotpo.');
                });

            }, function(error) {
                console.log ('Error getting most liked positive review from Yotpo.');
            });

        }, function(error) {
            console.log ('Error getting reviews from Yotpo.');
        })['finally'](function() {
            $scope.loading = false;
        });
    };

    $scope.backFromReviews = function() {
        $rootScope.back();
    };

    $scope.showRegPrice = function() {
        return Product.showRegPrice($scope.product_data);
    };

    $scope.getDiscountPercent = function() {
      return Product.getDiscountPercent($scope.product_data);
    }

    var initImage = function() {

        $scope.s7assets = [];

        $scope.product_data.images.forEach(function(img) {
            $scope.s7assets.push(img.match(/(Staples\/.*)$/).pop());
        });

        if ($scope.s7assets.length === 0) {
            return;
        }
        var size = Math.min.apply(null, [document.documentElement.clientWidth, document.documentElement.clientHeight, 400]);
        size -= 100;

        s7basiczoom = new s7viewers.BasicZoomViewer({
          containerId: 'scene7_zoom_viewer',
          params: {
            config: 'Scene7SharedAssets/Universal_HTML5_Zoom_light',
            serverurl: '//s7d1.scene7.com/is/image/',
            contenturl: '//s7d1.scene7.com/skins/',
            stagesize: [size, size].join(','),
            asset: $scope.s7assets[0],
          },
          handlers: {
            initComplete: function() {
                $scope.$apply(function() {
                    $scope.s7ready = true;
                });
            }
          }
        });
        s7basiczoom.init();
    };

    $scope.swipeImage = function(c) {
        var toIdx = $scope.selected_img + c;
        if (toIdx < 0) {
            return;
        }
        var pos = s7basiczoom.zoomView.component.view.getViewPort();
        if (Math.floor(pos.x * 10) === 0 &&
            Math.floor(pos.y * 10) === 0 &&
            toIdx < $scope.s7assets.length) {
            $scope.switchImage(toIdx);
        }
    };

    $scope.switchImage = function(idx) {
      if(idx !== $scope.selected_img) {
        $scope.selected_img = idx;
        s7basiczoom.setAsset($scope.s7assets[idx]);
      }
    };

    $scope.scroll = function(to) {
        $timeout(function() {
            scroll.to(to, 0);
        }, 450);
    };

    /*  User switched Bopis flag */
    $scope.bopisClicked = function() {

        if ($scope.product_data.bopisSelected) {
            //  check if a store has inventory
            if ($scope.defaultStore.invQty === 0) {
                $scope.product_data.bopisSelected = false;
                $rootScope.prompt({
                    header: {
                        close: true,
                        title: 'Choose another store'
                    },
                    product: $scope.product_data,
                    message: 'This store has insufficient inventory for store pick up.',
                    actions: {
                        primary: {
                            title: 'OK',
                        }
                    }
                });
            }
        }
    };

    $scope.checkBopisStores = function() {

        var storeNum = $scope.defaultStore.storeNumber;
        var zipCode = $scope.defaultStore.zip;

        $rootScope.toRoute('bopisStores', {
            sku: $scope.product_data.sku,
            storeNo: storeNum,
            zip: zipCode,
            product:$scope.product_data,
            returnRte: $scope.saveState
         });
    };

    $scope.addFBTItemsToCart = function() {
        $scope.adding_to_cart = true;
        var cartItems = [];

        angular.forEach($scope.FBT_Products, function(product) {
            product.qty = 1;

            var rc = Cart.canAddToCart(product, false);
            if (rc === true) {
                cartItems.push(product);
            } else {
                $scope.product_data.atcError = rc;
                countDownATCOverlay();
                return;
            }
        });

        if (cartItems.length > 0) {
            $scope.product_data.noItems = 0;
            $scope.product_data.cartMask = false;
            $scope.product_data.atcError = '';

            Cart.addItems(cartItems).then(function() {
                var shipToStoreAttr = (localStorage.getItem('shipAllToStore') === 'true');
                $scope.itemAddedToCart = true;
                $scope.product_data.noItems = cartItems.length;
            }, function(error) {
                $scope.product_data.atcError = error;
            })['finally'](function() {
                $scope.adding_to_cart = false;
                countDownATCOverlay();
            });
        }
    };

    $scope.addToCart = function(product) {

        $scope.adding_to_cart = true;
        if (!$scope.qty) {
            $scope.qty = 1;
        }

        if (!product.shippingInfo) {
            product.shippingInfo = {
                 deliveryModeSelected: 'STA',
                 deliveryAddressSelected: {
                     storeNumber: ''
                 }
            };
        }
        product.shippingInfo.deliveryModeSelected = product.bopisSelected ? 'ISP' : 'STA';
        if (product.shippingInfo.deliveryModeSelected === 'ISP') {
            product.shippingInfo.deliveryAddressSelected.storeNumber = $scope.defaultStore.storeNumber;
        }
        $scope.product_data.noItems = 0;
        $scope.product_data.cartMask = false;
        $scope.product_data.cartMaskPending = true;
        Cart.addToCart($scope.product_data, false, true)
        ['finally'](function() {
           if ($scope.product_data.atcError) {
                if (($scope.product_data.atcError === $translate.instant('CART_OOS') && isTrue($scope.product_data.bopis))) {
                    $scope.product_data.atcError = $translate.instant('SKU_OOSONLINE_BUTPU');
                }
                $scope.product_data.noItems = 0;
           } else {
                $scope.product_data.noItems = 1;
                $scope.product_data.atcError = undefined;
           }
           $scope.adding_to_cart = false;
           $scope.product_data.cartMask = true;
            $scope.product_data.cartMaskPending = false;
           $scope.product_data.cart = '';
           countDownATCOverlay();
        });
    };

    function runPersonalization() {
        if (Personalization.getMarvinReady() && ($scope.product_data || {}).name) {
            getFreqBoughtTogether();
            getCustUltimatelyBought();
        }
    }

    $scope.$on('callMarvin', function() {
        runPersonalization();
    });

    $timeout(function() {
      $scope.$watch('loading',function(l) {
        $scope.$parent.overlay_loading = l;
      });
    });

    // watch for triggering dynamic SEO markup
    $scope.$watch('product_data.name', function(name) {
        if (name) {
            var seodata = $scope.product_data.seodata;
            $rootScope.seo.name = null;
            var quartz = Seo.quartz.sku($scope.product_data);
            var attributes = (seodata || {}).attributes;
            if (attributes) {
                ['robots', 'canonical', 'description'].forEach(function(k) {
                  $rootScope.seo[k] = ((attributes[k] || attributes['meta_' + k] || {}).value || '');
                });
                $rootScope.seo.name =  (attributes.title || {}).value || (attributes.seoname || {}).value || null;
                $rootScope.seo.canonical = $rootScope.seo.canonical || quartz.url;
            }
            $rootScope.seo.image = ($scope.product_data.images || []).slice().shift();
            $rootScope.seo.ogUrl = quartz.url;
            $rootScope.seo.ogType = 'product';

            runPersonalization();

        }
    });

    $scope.skuSetFilter = function(element) {
        return element.sku.match(/^SS/) ? false : true;
    };

    /*
        Function to initialize the Hook Logic param required for ad carousels
    */
    $scope.setHookLogicAdCarouselParams = function() {
        var hookLogicParams = {
            taxonomy: $scope.product_data.classId,
            sku : $scope.product_data.sku,
            broadmatchtype : '4',
            pgn : '1',
            hlpt : 'P',
            creative: '233x375_B-C-IG_TI-1_1-10_3rd-Row'

         };
         return hookLogicParams;
    };

    /*
     *  Function to set the ad slot and page level targeting to show the AdSense
     */
    $scope.setDfpParams = function() {

        var isUserLoggedIn = MobileService.getSessionState() === 'registered';
        var regex = /[^A-Z0-9]/ig;
        var skuLevel;

        if(triadConstants) {
            skuLevel = '/' + triadConstants.dfpNetworkId + '/' + triadConstants.siteName + '/';
        }

        if($scope.product_data) {
            var analytics = angular.copy($scope.product_data.analytics);
            var skuAnalyticsArray = [];

            analytics.scName ? skuAnalyticsArray.push(analytics.scName.replace(regex, "")) : '';
            analytics.cgName ? skuAnalyticsArray.push(analytics.cgName.replace(regex, "")) : '';
            analytics.dpName ? skuAnalyticsArray.push(analytics.dpName.replace(regex, "")) : '';
            analytics.clName ? skuAnalyticsArray.push(analytics.clName.replace(regex, "")) : '';

            skuLevel += skuAnalyticsArray.join("/");

            var targetValues = {
                levels: skuLevel,
                pageTarget: {
                    ptype: ['sku'],
                    loggedin: [isUserLoggedIn],
                    brand: [$scope.product_data.mfr.name || null],
                    prodid: [$scope.product_data.sku || null],
                    sc: [analytics.scName || null],
                    cg: [analytics.cgName || null],
                    dp: [analytics.dpName || null],
                    cl: [analytics.clName || null],
                    rating: [$filter('ratingValue')($scope.product_data.custReview.rating, 5) || null],
                    prodprice: [($scope.product_data.price || {}).finalPrice || null],
                    deal: [null],
                    kw: [null]
                }
            };

            return targetValues;
        }
    };

    init();

    $scope.$on('$destroy', function onDestroyProductCtrl() {
      // clear the data associated with current page triad slots.
      DoubleClick.clearSlot();
    });

});
