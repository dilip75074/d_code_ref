'use strict';
/**
 * @ngdoc function
 * @name stpls.directive:
 * @example <div id="hl_1" data-pageType="Home" hook-logic-ad-carousel></div>
 */
angular.module('stpls')
  .directive('hookLogicAdCarousel', function($rootScope, $filter, hookLogic, Config, MobileService, Product, $cookies) {

    return {
      restrict: 'A',
      scope: {
        hookLogicAdCarousel: '&',
        hookLogicProducts: '=',
        callbackFn: '&'
      },
      //templateUrl : 'common/directives/hookLogic/HLAdCarousel.html',
      link: function(scope, element, attr) {
        // Set the required target values to ad carousel in home, SKU, Search and Class page
        var hookLogicParams = {};
        scope.pageType = null;
        var setHookLogicAdParams = function() {
          var hlConfig = Config.getProperty('hookLogicParams');
            if(attr.pageType === "confirmOrder"){
                hookLogicParams = {
                apiKey: hlConfig.apiKey,
                puserid: MobileService.getSessionUserID(),
                platform: hlConfig.platform
              };
            }else{
                hookLogicParams = {
                apiKey: hlConfig.apiKey,
                puserid: MobileService.getSessionUserID(),
                MinAds: hlConfig.minads,
                MaxAds: hlConfig.maxads,
                platform: hlConfig.platform
              };
          }
          if(attr.pageType === "home"){
            hookLogicParams.creative = hlConfig.creative;
            hookLogicParams.hlpt = hlConfig.hlpt;
          }
          var scopeParams = (scope.hookLogicAdCarousel || angular.noop)() || {};
          angular.extend(hookLogicParams, scopeParams);
          scope.pageType = (hookLogicParams.pageType === 'category') ? hookLogicParams.pageType : attr.pageType;
          return hookLogicParams;
        };

        hookLogic.callHookLogicAPI(setHookLogicAdParams(), scope.pageType, function(err, data) {
          if (!err) {
            var results = scope.hookLogicProducts = angular.isArray(data) && data || data.products;
            // Drop page beacon.
            hookLogic.dropPageBeacon(data.pageBeacon, 'pageBeacon');
            if (attr.pageType === 'search' || scope.pageType === 'category') {
              scope.callbackFn({
                hlProducts: results,
                url: null
              });
            }
          }
        });
        scope.priceElements = function(price) {
          var currency = $filter('currency')(price);
          return {
            symbol: (currency.match(/^\D/) || []).pop(),
            major: (currency.replace(/^\D/, '').split(/\D/).slice(0,-1).join('')),
            minor: (currency.replace(/^\D/, '').split(/\D/).pop())
          };
        };
        scope.dropBannerPageBeacon = function(p, $event) {
          //Drop product click Beacons of every HL product shown
          hookLogic.dropPageBeacon(p.beacon.click, 'click');
        };
        scope.showRegPrice = Product.showRegPrice;

        // For search page dont need template as will change search results array with HL products
        switch(scope.pageType) {
          case 'search':
          case 'category':
          case 'confirmOrder':
            scope.template = '';
            break;
          default:
            scope.template = 'common/directives/hookLogic/HLAdCarousel.html';
            break;
        }
        // Call service Hook logic API when values for HL API params available or when apply filters on search and class page
        scope.$on('dataChanged', function() {
          hookLogic.callHookLogicAPI(setHookLogicAdParams(), scope.pageType, function(err, data) {
            if (!err) {
                var results = scope.hookLogicProducts = angular.isArray(data) && data || data.products;
              // Drop page beacon.
              hookLogic.dropPageBeacon(data.pageBeacon, 'pageBeacon');
              if (scope.pageType === 'search' || scope.pageType === 'category') {
                scope.callbackFn({
                  hlProducts: results,
                  url: null
                });
              }
            }
          });
        });


      },
      template: '<div ng-include = "template"></div>'
    };
  });

/*
Service responsible to call HookLogic for the ad carousel
*/
angular.module('stpls')
  .service('hookLogic', function($rootScope, $q, MobileService, Product) {

    return {
      callHLAPI: function(option, url) {
        var d = $q.defer();
        MobileService.request({
          method: 'GET',
          url: url,
          params: option
        }).then(function(response) {
          var products = response.data;
          d.resolve(products);

        }, function() {
          d.reject('No product found.');
        });
        return d.promise;
      },
      callHookLogicAPI: function(obj, pageType, cb) {
        var isAllParamSet = false;
        // Check the required param for HL API set
        if (obj.apiKey && obj.creative && obj.MinAds && obj.MaxAds) {
          if ((pageType === 'home' && obj.taxonomy) || (pageType === 'sku' && obj.sku) ||
            (pageType === 'search' && obj.keyword) || (pageType === 'category' && obj.taxonomy)) {
            isAllParamSet = true;
          }
        }
        if(pageType === 'confirmOrder' && obj.apiKey && obj.productId && obj.price && obj.orderId && obj.quantity){
          isAllParamSet = true;
        }
        var url = null;
        if (pageType === 'search' || pageType === 'sku') {
          url = '/hl/' + pageType;
        } else if(pageType === 'confirmOrder'){
          url = '/hl/confirmation';
        }else{
          url = '/hl/taxonomy';
        }
        if (isAllParamSet) {
          // Code to call CHAPI point and return JSON response got from HL API call          
          var p = this.callHLAPI(obj, url);
          p.then(function(data) {
            if (data) {
              return cb(null, data);
            }
          }, function() {
            console.log('HookLogic ads are not found,');
            return cb('Error', null);
          });
        } else {
          return null;
        }

      },
      // Method to drop beacons (impression, Click, pageBeacon)
      dropPageBeacon: function(beaconUrl, beaconType) {
        if (!beaconUrl || !beaconUrl.length) {
          return;
        }
        var p = window.location.protocol;
        var e = document.createElement('img');
        if (beaconUrl.slice(0, 4) !== 'http') {
          beaconUrl = p + beaconUrl;
        }
        if (beaconType === 'pageBeacon') {
          beaconUrl = beaconUrl + '&adsDisplayed=all';
        } else if (beaconType === 'click') {
          beaconUrl = beaconUrl + '&rank=2';
        }
        e.src = beaconUrl;
      }
    };

  });
