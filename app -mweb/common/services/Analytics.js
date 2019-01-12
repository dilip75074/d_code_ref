'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Analytics
 */
angular.module('stpls').factory('Analytics', ['$rootScope', '$window', '$state', '$timeout',
  function($rootScope, $window, $state, $timeout) {

    return (function(Analytics) {
      var self = {};
      var viewInitializing = false,
        states = {
          loading: 'contentloading',
          loaded: 'contentloaded',
          modifying: 'dommodifying',
          modified: 'dommodified'
        };

      var init = function() {

        Analytics.startDocument = new Date();
        Analytics.version = {
          spec: '1.0.2',
          dlospec: '1.0.2'
        };

        initGlobal();
        initTracking();
        initVisitType();
        initTrafficTracking();
        initCTA();

      };

      var initGlobal = function() {
        var g;
        g = Analytics.global = {
          testing: {
            runa: {
              perfectoffer: 'blank',
              perfectshipping: 'blank'
            },
            segments: '',
            experiences: ''
          },
          cart: {}
        };
      };

      var initTracking = function() {
        var t;
        t = Analytics.tracking = Analytics.tracking || {};
        //reset global items DLO on state change
        $rootScope.$on('$stateChangeStart', function() {
          t = Analytics.tracking = {};
          t.items = {};
        });
      };

      var initVisitType = function() {
        Analytics.global.visit = {
          server: 'skynet',
          domain: 'm.staples.com',
          appserver: '1',
          appserverid: '1',
          appversion: ($window.stpls_global || {}).appVersion,
          jsessionid: '',
          zipcode: '',
          lat: '',
          lng: '',
          interfaceType: 'mobilehybrid',
          loggedin: false,
          device: 'mobile'
        };

      };

      var initTrafficTracking = function() {
        Analytics.traffic = {
          pagename: ''
        };

        //set initial state on change
        $rootScope.$on('$stateChangeStart', function($event, to) {
          var pagename = to.name;
          switch (pagename) {
            case 'category':
              pagename = 'browse';
              break;
            case 'browse':
              pagename = 'browsetree';
              break;
          }
          Analytics.traffic.pagename = pagename;
          self.contentState = states.loading;
          log();
        });

        var onload = function($event) {
          $timeout(function() {
            // console.log('-- CHANGE signal view', $event.name, viewInitializing);
            if (!viewInitializing) {
              self.contentState = states.loaded;
              log();
            }
          });
        };

        var onerror = function($event) {
          viewInitializing = false;
          onload();
          $timeout(function() {
            Analytics.traffic.pagename = $state.current.name;
          });
        };

        //bind view state events (basically route changes)
        // $rootScope.$on('$stateChangeSuccess', onload);
        $rootScope.$on('$viewContentLoaded', onload);
        $rootScope.$on('$stateChangeError', onerror);
        $rootScope.$on('$stateNotFound', onerror);

      };

      var initCTA = function() {
        $window.scResponse = {};
      };

      /**
       * watch a boolean scope property indicating loading status
       */
      var addWatch = function($scope, loader) {
        $scope.$watch(loader, function(loading, prev) {
          // console.log('-- WATCHER', loader, loading, 'init', viewInitializing);
          if (loading && self.contentState === states.loading) {
            viewInitializing = true;
          }
          if (loading !== prev) {
            $timeout((selfService[(loading ? 'signalModification' : 'endModification')] || angular.noop));
          }
        });
      };

      var signalModification = function() {
        $timeout(function() {
          // console.log('-- START mod signal', viewInitializing);
          if (!viewInitializing) {
            self.contentState = states.modifying;
            log();
          }
        });
      };

      var endModification = function() {
        $timeout(function() {
          // console.log('-- END mod signal', viewInitializing);
          self.contentState = (self.contentState === states.loaded || viewInitializing) ? states.loaded : states.modified;
          viewInitializing = false;
          log();
        });
      };

      var signal = function(s) {
        if (s) {
          var d = document.createElement('div');
          d.className = s;
          document.documentElement.appendChild(d);
        }
      };

      var log = function() {
        var s = self.contentState;
        if (s !== self.lastState) {
          if (($window.stpls_env || '').match(/(dev|qa)/)) {
            console.log(s.toUpperCase(), Analytics.traffic.pagename);
          }
          signal(s);
        }
        self.lastState = s;
      };


      /**
       * handler for appending Items DLO
       * @param mixed items. Array or Object
       * @param string format. Key for alternate object parsing
       */
      var addItems = function(items, format) {
        var list = Analytics.tracking.items = Analytics.tracking.items || {};
        // console.log('Analytics add items');
        if (items && !angular.isArray(items)) {
          items = [items];
        }
        angular.forEach(items, function(row) {
          try {
            var item = mapItemToDLO(row, format),
              key = [item.loc, item.s].join('_');
            list[key] = item;
          } catch (e) {
            console.log('Error DLO item', e.message);
          }
        });
      };

      var mapItemToDLO = function(item, format) {
        var line = {
          version: '1.0.3',
          //parse those from directive
          loc: (item.DLO || {}).loc || $rootScope.$state.current.name,
          sl: (item.DLO || {}).sl || null,
          p: (item.DLO || {}).p || null,
          dec: (item.DLO || {}).dec || [],
          s: item.sku
        };
        //add properties based on format (so far it's search response)
        //basic metadata
        angular.extend(line, {
          name: item.name,
          mfritem: (item.mfr || {}).pn || '',
          manufacturer: (item.mfr || {}).name,
          customeritem: (item.mfr || {}).pn || '',
          producturl: $state.href($window.stpls_global.routes.product.state, {
            sku: item.sku
          }, {
            absolute: true
          }),
          imageurl: (item.images || []).shift(),
          rat: (item.custReview || {}).rating,
          rev: (item.custReview || {}).count
        });

        // Rebase review rating for hero SKU
        if (line.loc === 'pdhero' && line.rat > 5) {
          line.rat = line.rat / 10;
        }

        //detect model
        if (line.mfritem && line.name.replace(/\W/g, '').toUpperCase().indexOf(line.mfritem.replace(/\W/g, '')) > -1) {
          line.model = line.mfritem;
        }

        //Pricing
        var pricing = item.price || angular.copy((item.pricing || [])).shift();
        if (pricing) {
          angular.extend(line, {
            u: pricing.uom,
            pp: pricing.finalPrice,
            dp: pricing.finalPrice,
            lp: pricing.listPrice || pricing.price
          });

          // Promos
          var promos = [];
          var promoTypeMap = {
            buyMoreSaveMore: 'bmsm', // Buy more save more
            priceInCart: 'seepriceincart', //see price in cart
            couponFreeGift: 'freegift', // free gift
            perfectOffer: 'po', // perfect offer
            perfectShipping: 'ps', // perfect shipping
            instantSavings: 'is', // instance saving
            actNowQty: 'anqty', // Act Now(Limited Qty)
            actNowTime: 'antime', // Act Now(Limited Time)
            actNowSold: 'ansold', // Act Now(Units Sold)
            airmiles: 'amiles', // air miles
            rebate: 'rebate'
          };

          if (item.seePriceInCart || item.priceInCartOnly === 'true') {
            promos.push({
              type: promoTypeMap.priceInCart
            });
          } else if (pricing.discounts) {
            angular.forEach(pricing.discounts, function(discount) {
              if (discount.deductFromListPrice === 'true') {
                promos.push({
                  type: discount.name === "coupon" ? promoTypeMap.instantSavings : promoTypeMap.rebate,
                  tot: Number(discount.amount).toFixed(2)
                });
              }
            });
          }

          if (pricing.BuyMoreSaveMoreDetail) {
            angular.forEach(pricing.BuyMoreSaveMoreDetail, function(saving) {
              if (saving.deductFromListPrice === 'true') {
                promos.push({
                  type: promoTypeMap.buyMoreSaveMore,
                  tot: Number(saving.price).toFixed(2)
                });
              }
            });
          }

          if (pricing.coupon) {
            promos.push({
              code: '',
              type: 'instant savings'
            });
          }

          if (pricing.promotion) {
            angular.forEach(item.promotion, function(promotion) {
              promos.push({
                code: promotion.name,
                type: promotion.type_name
              });
            });
          }
          line.promos = promos;
        }

        //TODO: delivery
        if (item.leadTime) {
          var edmd = new Date();
          edmd.setDate(edmd.getDate() + (parseInt((item.leadTime.desc || '1').match(/\d+/g).pop()) || 1));
          angular.extend(line, {
            delivery: {
              cd: new Date(),
              offers: [{
                type: 'standard',
                weekend: 'false',
                edm: item.leadTime.desc,
                edmd: edmd
              }]
            }
          });
        }

        // Product Hierarchy
        var rawAnalytics = item.analytics;
        if (rawAnalytics) {
          var hierarchy = {};
          if (rawAnalytics.sc && rawAnalytics.scName) {
            hierarchy.sc = {
              id: rawAnalytics.sc,
              name: rawAnalytics.scName
            };
          }
          if (rawAnalytics.cg && rawAnalytics.cgName) {
            hierarchy.cg = {
              id: rawAnalytics.cg,
              name: rawAnalytics.cgName
            };
          }
          if (rawAnalytics.dp && rawAnalytics.dpName) {
            hierarchy.dp = {
              id: rawAnalytics.dp,
              name: rawAnalytics.dpName
            };
          }
          if (rawAnalytics.cl && rawAnalytics.clName) {
            hierarchy.cl = {
              id: rawAnalytics.cl,
              name: rawAnalytics.clName
            };
          }
          line.producthierarchy = hierarchy;
        }

        //other information otherwise unknown
        angular.extend(line, {
          avail: item.preOrder === 'true' ? 'preorder' : 'available',
          mp: 'false', //marketplace
          is: (item.DLO || {}).is || 'others' //intelligence source
        });

        return line;
      };

      /**
       * handler on cart change
       */
      var updateToCart = function(c) {
        var items = [],
          promos = [];

        angular.forEach(c.productsInCart, function(line) {
          var row = mapCartItemToDLO(line);

          items.push(row);
          if (row.promos) {
            promos = promos.concat(row.promos);
          }

          //append promos to tracking item
          var trackItem = ((Analytics.tracking || {}).items || {})['cart_' + row.sku];
          if (trackItem) {
            trackItem.promos = angular.copy(row.promos);
          }

        });

        Analytics.global.cart = {
          subtotal: parseFloat(c.subTotal) || c.subTotal,
          promos: promos,
          lines: items
        };

      };

      var mapCartItemToDLO = function(line) {
        var pricing = line.pricing[0],
          bopis = line.bopisSelected || false,
          shipping = line.shippingInfo || {},
          visitorZip = Analytics.global.visit.zipcode;

        var row = {
          sku: line.sku,
          shippingMethod: shipMethod(shipping.deliveryModeSelected),
          zipcode: (shipping.deliveryAddressSelected || {}).zipCode || visitorZip,
          storeId: (shipping.deliveryAddressSelected || {}).storeNumber || '',
          qty: parseInt(line.qty),
          total: pricing.totalOrderItemPrice,
          promos: parsePromos(line.coupon)
        };
        return row;
      };

      var shipMethod = function(shipMethod) {
        var shipMethodMap = {
          STA: 'shiptohome',
          STS: 'shiptostore',
          ISP: 'bopis',
          BOPIS: 'bopis',
          ROPIS: 'bopis'
        };

        return (shipMethodMap[(shipMethod || '').toUpperCase()] || 'unknown');
      };

      var parsePromos = function(list) {
        var promoTypeMap = {
          //TODO: consider other types
          PERCENTOFFSTACKITEM: 'is'
        };
        return (list || []).reduce(function(arr, promo) {
          if (promo.code && promo.adjustedAmount) {
            arr.push({
              promo: {
                code: promo.code,
                total: Math.abs(parseFloat(promo.adjustedAmount)),
                type: (promoTypeMap[(promo.type || '').toUpperCase()] || '')
              }
            });
            return arr;
          }
        }, []);
      };


      var updateToVisitor = function(v) {
        var visitor = Analytics.global.visitor = Analytics.global.visitor || {
          language: '',
          vis_status: 'guest',
          email: '',
          phone: '',
          dcn: '',
          rewards: '',
          rewardstier: ''
        };
        angular.extend(visitor, v);
      };

      var setLocale = function(l) {
        return updateToVisitor({
          language: (l || '').replace('_', '-')
        });
      };

      var setUserStatus = function(s) {
        var visit = (Analytics.global || {}).visit || {};
        visit.loggedin = s === 'registered';

        return updateToVisitor({
          vis_status: s || 'guest'
        });
      };

      var updateLocation = function(location) {
        angular.extend(Analytics.global.visit, location);
      };

      var DLOMap = {
        browse: 'b',
        search: 's',
        filter: 'f',
        product: 'p',
        cart: 'c',
        confirm: 'o'
      };

      var captureDLO = function(type) {
        var method = angular.noop;
        switch (type) {
          case DLOMap.browse:
            method = captureBrowseDLO;
            break;
          case DLOMap.search:
            method = captureSearchDLO;
            break;
          case DLOMap.filter:
            method = captureFilterDLO;
            break;
          case DLOMap.product:
            method = captureProductDLO;
            break;
          case DLOMap.cart:
            method = captureCartDLO;
            break;
          case DLOMap.confirm:
            method = captureOrderConfirmDLO;
            break;
        }
        //call method with additional arguments (after type)
        method.apply(self, Array.prototype.slice.call(arguments, 1));
      };

      var captureCartDLO = function(detail) {
        Analytics.tracking = Analytics.tracking || {};
        Analytics.tracking.cart = {
          version: '1.0.3',
          subt: detail.subtotal,
          shipping: detail.shipping
        };
      };

      // browse DLO
      var captureBrowseDLO = function(identifier, obj) {
        var browse = Analytics.tracking.browse = {
          version: '1.0',
          tier: (identifier || '').substring(0, 2).toLowerCase(),
          producthierarchy: {
            sc: 'superCategory',
            cg: 'category',
            dp: 'department',
            cl: 'class'
          }
        };
        obj = obj || {};
        var ph = browse.producthierarchy;
        angular.forEach(Object.keys(ph), function(key) {
          var prefix = ph[key];
          var code = obj[prefix + 'Code'] || obj[key];
          var text = obj[prefix + 'Name'] || obj[key + 'Name'];

          ph[key] = (code && text) ? {
            id: code,
            value: text
          } : null;
        });
      };

      var captureSearchDLO = function(meta) {
        var track = Analytics.tracking;
        track.version = '1.0';
        angular.extend(track, meta);
      };

      var captureFilterDLO = function(available, appliedFrom, facetsFrom) {
        var track = Analytics.tracking;
        var appliedFilters = [];
        var applied = angular.copy(appliedFrom) || [];
        var appliedFacts = angular.copy(facetsFrom) || [];
        angular.extend(track, {
          categories: (available || []).reduce(function(result, filter) {
            result.push({
              id: filter.id,
              value: filter.name
            });

            function captureFilter(appliedFilter) {
              if (appliedFilter.length) {
                var ff = {
                  category: {
                    id: filter.id,
                    val: filter.name //should be same but isn't
                  },
                  values: []
                };
                  (filter.details || []).forEach(function(f) {
                  var idx = appliedFilter.indexOf(f.id);
                  if (~idx) {
                    ff.values.push(f.id);
                    appliedFilter.splice(idx, 1);
                  }
                });
                //capture applied filter DLO
                if (ff.values.length) {
                  appliedFilters.push(ff);
                }
              }
            }

            //match applied filters within this filter category
            if (applied.length) {
              captureFilter(applied);
            }

            if (appliedFacts.length) {
              captureFilter(appliedFacts);
            }

            return result;
          }, []),
          filters: appliedFilters

        });

        track.search = track.search || {};
        track.search.srules = '';

      };

      var propValues = {
        decorations: {
          instockOnline: 'iso', //shows instock online
          defaultStoreAvailability: 'dsa', //sku shows default store availability
          rewardsBack: 'rb', //sku will give user rewards back
          freeshipping: 'fs', //message free shipping
          financeAvailable: 'fa', //message financing is available
          onlineOnly: 'ao', //only available online
          instantSavings: 'is', //has instant savings
          freeshippingToStore: 'fsts', //free ship to store message present
          minorityBusiness: 'mbe', //from a minority business enterprise
          womanBusiness: 'wbe', //from a woman business enterprise
          recycled: 'rec', //product is recycled
          green: 'gr', //product is green
          priceInCart: 'seepriceincart', //see price in cart
          ecoProduct: 'eco' //eco product used for canada
        }
      };

      var setCTAResponse = function(response) {
        $window.scResponse = {
          version: '1.0.1',
          response: response
        };
      };

      var getCTAResponse = function(withError) {
        var response = $window.scResponse = $window.scResponse || {};
        response.response = response.response || {
          version: '1.0.2',
          action: []
        };
        if (!response.response.action) {
          response.response.action = [];
        }
        if (!response.response.error && withError) {
          response.response.error = [];
        }
        return response.response;
      };

      var addToCart = function(items, atc) {
        var result = {
          type: 'addtocart',
          storeid: (items[0] || {}).storeNumber || '',
          items: []
        };
        atc.then(function(cart) {
          result.message = 'success';
          // console.log('added', response);

          angular.forEach(items, function(item) {
            angular.forEach(cart.productsInCart, function(line) {
              if (line.sku === item.sku) {
                // console.log(line);
                var dlo = angular.extend(mapItemToDLO(line), mapCartItemToDLO(line));
                // console.log(dlo);
                var newQty = item.qty;
                var newTotal = (dlo.total / dlo.qty) * newQty;
                result.items.push({
                  sku: dlo.sku,
                  qty: newQty,
                  total: newTotal,
                  name: dlo.name,
                  model: dlo.model,
                  desc: (line.bullets || []).slice(0, 3).join('|'),
                  sc: '',
                  cg: '',
                  dp: '',
                  cl: '',
                  producturl: dlo.producturl,
                  manufacturer: dlo.manufacturer,
                  imageurl: dlo.imageurl,
                  reviewscore: dlo.rat,
                  // reviewtext: '',
                  // reviewurl: '',
                  totalcartvalue: Number(cart.subTotal)
                });
              }
            });
          });
        }, function(error) {
          result.message = (error || 'error').toString();
        })['finally'](function() {
          setCTAResponse(result);
        });
      };

      var cartItemCTA = function(item, type, error) {
        var line = mapCartItemToDLO(item);
        var action = {
          type: type,
          message: error ? 'error' : 'success',
          sku: line.sku,
          qty: item.wasQty || line.qty,
          total: line.total
        };

        var ship = item.shippinginfo;
        if (ship) {
          action.shippinginfo = {
            method: ship.method,
            scity: ship.city,
            sstate: ship.state,
            szip: ship.zip,
            storeid: ship.storeId || null
          };
        }

        getCTAResponse().action.push(action);

        if (error) {
          pushCTAError('cart', error);
        }
      };

      var couponCTA = function(code, error) {
        getCTAResponse().action.push({
          type: 'coupon',
          message: error ? 'error' : 'success',
          code: code
        });
      };

      var pushCTAError = function(type, msg) {
        getCTAResponse(true).error.push({
          code: 'Validation Error',
          type: type,
          desc: msg
        });
      };

      // Prouduct page
      var captureProductDLO = function(product) {
        Analytics.tracking = Analytics.tracking || {};
        Analytics.tracking.version = '1.0.3';
        Analytics.tracking.product = {
          sku: product.sku
        };
        Analytics.tracking.productstock = {
          OOS: !product.inStock
        };

        // TODO: there is no data for product.protectplan
      };

      // Order Confirm DLO
      var orderConfirmItemsDLO = function(confirm) {
        var items = [];
        var cart = confirm.cart;

        if (cart.productsInCart) {
          angular.forEach(cart.productsInCart, function(line) {
            var dlo = angular.extend(mapItemToDLO(line), mapCartItemToDLO(line));

            items.push({
              sku: dlo.sku,
              qty: dlo.qty,
              u: dlo.u,
              total: dlo.total,
              avail: dlo.avail,
              pp: dlo.pp,
              dp: dlo.dp,
              lp: dlo.lp,
              mp: dlo.mp,
              name: dlo.name,
              model: dlo.model || '',
              mfritem: dlo.mfritem,
              customeritem: dlo.customeritem,
              manufacturer: dlo.manufacturer,
              promotions: dlo.promos,
              shippingInfo: [getShippingInfo(confirm, line)]
            });
          });
        }

        return items;

      };

      var captureOrderConfirmDLO = function(confirm) {
        Analytics.tracking.orderconfirm = {
          version: '1.0.2',
          purchaseid: confirm.staplesOrderNum,
          cartid: confirm.cart.orderId,
          transactionid: confirm.staplesOrderNum,
          visitorstatus: confirm.sessionUser ? 'registered' : 'guest',
          paymenttype: [{
            type: paymentType(confirm.ccType),
            amount: confirm.orderTotal
          }],
          tax: confirm.tax,
          shipping: confirm.shippingFee,
          orderrevenue: confirm.subtotal,
          orderdate: new Date(),
          sbs: sameShippingAndBilling(confirm.shipping, confirm.billing),
          bcity: confirm.billing.city,
          bstate: confirm.billing.state,
          bzip: confirm.billing.zip
        };

        if (!confirm.sessionUser && confirm.eMailAddr) {
          var visitor = ((Analytics.global || {}).visitor || {});
          visitor.email = confirm.eMailAddr;
        }

        var orderRewards = [];
        var orderPromos = [];

        // Cart level coupons
        var coupons = (confirm.cart || {}).Coupon;
        if (coupons) {
          angular.forEach(coupons, function(coupon) {
            if (coupon.code && coupon.code.length >= 16) {
              orderRewards.push({
                code: coupon.code,
                amount: coupon.adjustedAmount
              });
            } else {
              orderPromos.push({
                code: coupon.code,
                type: coupon.type,
                desc: coupon.description[0].shortDescription,
                amount: coupon.adjustedAmount
              });
            }
          });
        }

        if (orderRewards.length > 0) {
          Analytics.tracking.orderconfirm.orderrewards = orderRewards;
        }
        if (orderPromos.length > 0) {
          Analytics.tracking.orderconfirm.promos = orderPromos;
        }
        Analytics.tracking.orderconfirm.items = orderConfirmItemsDLO(confirm);
      };

      var paymentType = function(cc) {
        var ccTypeMap = {
          visa: 'Visa',
          mastercard: 'Mastercard',
          discover: 'Discover',
          amex: 'AMEX',
          staples: 'Staples',
          applepay: 'ApplePay',
          visacheckout: 'Visa Checkout'
        };
        var c = ccTypeMap[(cc || '').toLowerCase()];
        return c ? 'Credit Card payment(' + c + ')' : 'unknown';
      };

      var sameShippingAndBilling = function(shipping, billing) {
        return shipping.address == billing.address &&
          shipping.address1 == billing.address1 &&
          shipping.address2 == billing.address2 &&
          shipping.city == billing.city &&
          shipping.state == billing.state &&
          shipping.zip == billing.zip;
      };

      var getShippingInfo = function(confirm, item) {
        var shipping;
        var address;
        if (item.bopis === 'true' && item.shippingInfo && item.shippingInfo.deliveryModeSelected === 'ISP') {
          address = item.shippingInfo.deliveryAddressSelected;
        } else {
          address = confirm.shipping;
        }
        shipping = {
          scity: address.city,
          sstate: address.state,
          szip: address.zipCode || address.zip,
          method: shipMethod(item.shippingInfo.deliveryModeSelected),
        };

        if (address.storeNumber) {
          shipping.storeid = address.storeNumber;
        }

        return shipping;
      };

      //return API for mutation
      var selfService = {
        addWatch: addWatch,
        signalModification: signalModification,
        endModification: endModification,
        //object property access
        propValues: propValues,
        //data accessors
        setLocale: setLocale,
        setUserStatus: setUserStatus,
        updateLocation: updateLocation,
        updateToCart: updateToCart,
        updateToVisitor: updateToVisitor,
        addItems: addItems,
        //search/class/cat
        DLO: DLOMap,
        captureDLO: captureDLO,
        //CTA scResponse methods
        addToCart: addToCart,
        cartItemCTA: cartItemCTA,
        couponCTA: couponCTA
      };

      init();

      return selfService;

    })($window.Analytics = $window.Analytics || {});
  }
]);
