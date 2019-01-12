'use strict';

var googletag = googletag || {};
googletag.cmd = googletag.cmd || [];


stpls.factory('DoubleClick', ['$q', '$window', '$interval', 'Config', function($q, $window, $interval, Config) {
  /**
     Holds slot configurations.
     */
  var slots = {};

  /**
   Defined Slots, so we can refresh the ads
   */
  var definedSlots = {};

  /**
   Holds size mapping configuration
   */
  var sizeMapping = {};

  /** 
   If configured, all ads will be refreshed at the same interval
   */
  var refreshInterval = null;

  /**
   If false the google ads library won't be loaded and no promises will be fulfilled.
   */
  var enabled = true;

  /**
   Defined Page targeting key->values
   */
  var pageTargeting = {};

  /**
   This initializes the dfp script in the document. Loosely based on angular-re-captcha's
   method of loading the script with promises.

   @link https://github.com/mllrsohn/angular-re-captcha/blob/master/angular-re-captcha.js
   */

  var _createTag = function() {
    if (!enabled) {
      return;
    }

    var ngDfpUrl = Config.getProperty('triadConstants').ngDfpUrl;

    var gads = document.createElement('script'),
      useSSL = 'https:' === document.location.protocol,
      node = document.getElementsByTagName('script')[0];

    gads.async = true;
    gads.type = 'text/javascript';
    gads.src = (useSSL ? 'https:' : 'http:') + ngDfpUrl;

    // Insert before any JS include.
    node.parentNode.insertBefore(gads, node);
    
  };

  /**
   Initializes and configures the slots that were added with defineSlot.
   */
  var _initialize = function() {
    // when the GPT JavaScript is loaded, it looks through the array and executes all the functions in order
    googletag.cmd.push(function() {
      angular.forEach(slots, function(slot, id) {
        definedSlots[id] = googletag.defineSlot.apply(null, slot).addService(googletag.pubads());
        if (sizeMapping[id]) {
          definedSlots[id].defineSizeMapping(sizeMapping[id]);
        }

        /*
         * If sent, set the slot specific targeting
         */
        var slotTargeting = slot.getSlotTargeting();
        if (slotTargeting) {
          angular.forEach(slotTargeting, function(value, key) {
            definedSlots[id].setTargeting(value.id, value.value);
          });
        }
      });

      /**
       * Set the page targeting key->values
       */
      angular.forEach(pageTargeting, function(value, key) {
        googletag.pubads().setTargeting(key, value);
      });

      googletag.pubads().setCentering(true);
      googletag.pubads().collapseEmptyDivs();
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();

      googletag.pubads().addEventListener('slotRenderEnded', _slotRenderEnded);
    });
  };

  var _slotRenderEnded = function(event) {
    var callback = slots[event.slot.getSlotId().getDomId()].renderCallback;

    if (typeof callback === 'function') {
      callback();
    }
  };

  /**
   * Returns the global refresh interval
   */
  var _refreshInterval = function() {
    return refreshInterval;
  };

  /**
   * Allows defining the global refresh interval
   */
  var setRefreshInterval = function(interval) {
    refreshInterval = interval;

    // Chaining
    return this;
  };

  /**
   * Stores a slot definition.
   */
  var defineSlot = function() {
    var slot = arguments;

    slot.getSize = function() {
      return this[1];
    };

    /**
     To be able to get the array of slot targeting key/value
     Example of the json format of the arguments: [{"id":"age","value":"20-30"}]
     For multiple targeting key,values example: [{"id":"age","value":"20-30"},{"id":"gender","value":"male"}]
     */
    slot.getSlotTargeting = function() {
      /**
       The third parameter is optional
       */
      if (this[3]) {
        return this[3];
      } else {
        return false;
      }
    };

    slot.setRenderCallback = function(callback) {
      this.renderCallback = callback;
    };

    slots[arguments[2]] = slot;

    // Chaining.
    return this;
  };

  /**
   * Stores a slot size mapping.
   */
  var defineSizeMapping = function() {
    var id = arguments[0];

    if (!sizeMapping[id]) {
      sizeMapping[id] = [];
    }

    // Add a new size mapping ( [browser size], [slot size])
    this.addSize = function() {
      sizeMapping[id].push([arguments[0], arguments[1]]);
      return this;
    }

    // Chaining.
    return this;
  };

  /**
   Enables/Disables the entire library. Basically doesn't load the google ads library.
   Useful to disable ads entirely given a certain condition is met.
   */
  var setEnabled = function(setting) {
    enabled = setting;
  };

  /**
   Stores page targeting key->values
   */
  var setPageTargeting = function(key, value) {
    pageTargeting[key] = value;
  };

  // Neat trick from github.com/mllrsohn/angular-re-captcha

  var initializeDFP = function() {
    _initialize();

    if (_refreshInterval() !== null) {
      $interval(function() {
        googletag.cmd.push(function() {
          $window.googletag.pubads().refresh();
        });
      }, _refreshInterval());
    }
  };

  _createTag();
  /**
     More than just getting the ad size, this 
     allows us to wait for the JS file to finish downloading and 
     configuring ads

     @deprecated Use getSlot().getSize() instead.
     */
  var getAdSize = function(id) {
    return deferred.promise.then(function() {
      // Return the size of the ad. The directive should construct
      // the tag by itself.
      var slot = slots[id];

      if (angular.isUndefined(slot)) {
        throw 'Slot ' + id + ' has not been defined. Define it using DoubleClick.defineSlot().';
      }

      return slots[id][1];
    });
  };

  var getSlot = function(id) {

    // Return the size of the ad. The directive should construct
    // the tag by itself.
    var slot = slots[id];
    if (angular.isUndefined(slot)) {
      throw 'Slot ' + id + ' has not been defined. Define it using DoubleClick.defineSlot().';
    }

    return slots[id];
  };

  var getSlots = function() {
    return slots;
  }

  var destroySlots = function() {
    var destoyFunction = $window.googletag.destroySlots;
    if (typeof destoyFunction === 'function') {
      $window.googletag.destroySlots();
    }
  }

  /*
   * Function to clear the data associated with previous slots.
   */
  var clearSlot = function() {
    slots = {};
    definedSlots = {};
    pageTargeting = {};
    sizeMapping = {};
  }

  var runAd = function(id) {
    googletag.cmd.push(function() {
      $window.googletag.display(id);
    });
  };

  /**
   Refreshes an ad by its id or ids.

   Example:

       refreshAds('div-123123123-2')
       refreshAds('div-123123123-2', 'div-123123123-3')
   */
  var refreshAds = function() {
    var slots = [];

    angular.forEach(arguments, function(id) {
      slots.push(definedSlots[id]);
    });

    googletag.cmd.push(function() {
      if(slots.length) {
        $window.googletag.pubads().refresh(slots); // This call to refresh, fetches a new ad for slots[] only.
      } else {
        $window.googletag.pubads().refresh(); // This call to refresh, fetches a new ad for each slot.
      }      
    });
  };

  return {
    setRefreshInterval: setRefreshInterval,
    defineSlot: defineSlot,
    defineSizeMapping: defineSizeMapping,
    setEnabled: setEnabled,
    setPageTargeting: setPageTargeting,
    initializeDFP: initializeDFP,
    getSlot: getSlot,
    getSlots: getSlots,
    destroySlots: destroySlots,
    runAd: runAd,
    refreshAds: refreshAds,
    clearSlot: clearSlot
  };
}])

.directive('ngDfpAdContainer', function() {
  return {
    restrict: 'A',
    controller: ['$element', function($element) {
      function hide(mode) {
        if (mode === 'visibility') {
          $element.css('visibility', 'hidden');
        } else {
          $element.hide();
        }
      }

      function show(mode) {
        if (mode === 'visibility') {
          $element.css('visibility', 'visible');
        } else {
          $element.show();
        }
      }

      this.$$setVisible = function(visible, mode) {
        if (visible) {
          show(mode);
        } else {
          hide(mode);
        }
      };
    }]
  };
})

.directive('ngDfpAd', ['$timeout', '$parse', '$interval', 'DoubleClick', '$rootScope', '$window', function($timeout, $parse, $interval, DoubleClick, $rootScope, $window) {
  return {
    restrict: 'A',
    template: '<div id="{{adId}}"></div>',
    require: '?^ngDfpAdContainer',
    scope: {
      adId: '@ngDfpAd',
      refresh: '@ngDfpAdRefresh',
      interval: '@ngDfpAdRefreshInterval',
      timeout: '@ngDfpAdRefreshTimeout',
      ngDfpParams: '&',
    },
    replace: true,
    link: function(scope, element, attrs, ngDfpAdContainer) {
      scope.$watch('adId', function(id) {
        // Get rid of the previous ad.
        element.html('');
        var targetValues = scope.ngDfpParams();
        var slotTargets = null;
        var intervalPromise = null;

        /*
         * @desc Functions to define the adSlot on page.
         */
        var defineAdSlot = function(slotCount) {
          DoubleClick.defineSlot(targetValues.levels, [], id, slotTargets);

          var definedSlotsLength = Object.keys(DoubleClick.getSlots()).length;

          if (((attrs.pageType === 'search' || attrs.pageType === 'category') && definedSlotsLength >= slotCount) || (attrs.pageType === 'sku' && definedSlotsLength >= slotCount)) {
            for (var key in targetValues.pageTarget) {
              DoubleClick.setPageTargeting(key, targetValues.pageTarget[key]);
            }
            DoubleClick.initializeDFP(); // Initialize and configure the adSlots that were added with defineSlot.
            var slotsDefined = DoubleClick.getSlots();
            angular.forEach(slotsDefined, function(value, key) {
              var slot = DoubleClick.getSlot(key);
              if (slot) {
                DoubleClick.runAd(key);
              }

              // Only if we have a container we hide this thing
              if (ngDfpAdContainer) {
                slot.setRenderCallback(function() {
                  if (angular.isDefined(attrs.ngDfpAdHideWhenEmpty)) {
                    if (element.find('iframe:not([id*=hidden])')
                      .map(function() {
                        return this.contentWindow.document;
                      })
                      .find("body")
                      .children().length === 0) {
                      // Hide it
                      ngDfpAdContainer.$$setVisible(false, attrs.ngDfpAdHideWhenEmpty);
                    } else {
                      ngDfpAdContainer.$$setVisible(true, attrs.ngDfpAdHideWhenEmpty);
                    }
                  }
                });
              }
            });
          }
        };

        switch (attrs.pageType) {
          case 'search':
            var slotCount = 0;
            //Check for the switches which are on to increment the value of slotCount by 1. 
            if ($rootScope.switchBoard.GPT_SEARCH_MAIN_SWITCH) {
              $rootScope.switchBoard.ENABLE_GPT_SEARCH_ADSLOT_BELOW_SEARCH_BAR ? slotCount++ : slotCount;
              $rootScope.switchBoard.ENABLE_GPT_SEARCH_ADSLOT_BELOW_PRODUCT_BAR ? slotCount++ : slotCount;
            }
            if (attrs.adSlot === '1') {
              slotTargets = [{
                "id": "pos",
                "value": ["belowsearchbar"]
              }, {
                "id": "atf",
                "value": ["y"]
              }];
              DoubleClick.defineSizeMapping(id).
              addSize([773, 435], [[773, 121]]).
              addSize([736, 414], [[736, 115]]).
              addSize([480, 320], [[480, 75]]).
              addSize([435, 773], [[435, 68]]).
              addSize([414, 736], [[414, 65]]).
              addSize([320, 480], [[320, 50]]).
              addSize([0, 0], [[320, 50]]); // Fits browsers of any size smaller than 320, 480.
            }
            if (attrs.adSlot === '2') {
              slotTargets = [{
                "id": "pos",
                "value": ["belowproductbar"]
              }, {
                "id": "atf",
                "value": ["n"]
              }];
            }
            defineAdSlot(slotCount); //Define AdSlot.
            break;
          case 'category':
            var slotCount = 0;
            //Check for the switches which are on to increment the value of slotCount by 1. 
            if ($rootScope.switchBoard.GPT_CATEGORY_MAIN_SWITCH) {
              $rootScope.switchBoard.ENABLE_GPT_CATEGORY_ADSLOT_BELOW_SEARCH_BAR ? slotCount++ : slotCount;
              $rootScope.switchBoard.ENABLE_GPT_CATEGORY_ADSLOT_BELOW_PRODUCT_BAR ? slotCount++ : slotCount;
            }
            if (attrs.adSlot === '1') {
              slotTargets = [{
                "id": "pos",
                "value": ["belowsearchbar"]
              }, {
                "id": "atf",
                "value": ["y"]
              }];
              // map the ad sizes to browser sizes for this ad slot.
              DoubleClick.defineSizeMapping(id).
              addSize([773, 435], [[773, 121]]).
              addSize([736, 414], [[736, 115]]).
              addSize([480, 320], [[480, 75]]).
              addSize([435, 773], [[435, 68]]).
              addSize([414, 736], [[414, 65]]).
              addSize([320, 480], [[320, 50]]).
              addSize([0, 0], [[320, 50]]); // Fits browsers of any size smaller than 320, 480.
            }
            if (attrs.adSlot === '2') {
              slotTargets = [{
                "id": "pos",
                "value": ["belowproductbar"]
              }, {
                "id": "atf",
                "value": ["n"]
              }];
            }
            if (targetValues) {
              defineAdSlot(slotCount); //Define AdSlot.
            }
            break;
          case 'sku':
            var slotCount = 0;
            //Check for the switches which are on to increment the value of slotCount by 1. 
            if ($rootScope.switchBoard.GPT_SKU_MAIN_SWITCH) {
              $rootScope.switchBoard.ENABLE_GPT_SKU_ADSLOT_BELOW_PRODUCT_BAR ? slotCount++ : slotCount;
              $rootScope.switchBoard.ENABLE_GPT_SKU_ADSLOT_PRODUCT_CAROUSEL ? slotCount++ : slotCount;
            }
            if (attrs.adSlot === '1') {
              slotTargets = [{
                "id": "pos",
                "value": ["belowproductbar"]
              }, {
                "id": "atf",
                "value": ["n"]
              }];
              DoubleClick.defineSizeMapping(id).
              addSize([773, 435], [[773, 121]]).
              addSize([736, 414], [[736, 115]]).
              addSize([480, 320], [[480, 75]]).
              addSize([435, 773], [[435, 68]]).
              addSize([414, 736], [[414, 65]]).
              addSize([320, 480], [[320, 50]]).
              addSize([0, 0], [[320, 50]]); // Fits browsers of any size smaller than 320, 480.
            }
            if (targetValues) {
              defineAdSlot(slotCount); //Define AdSlot.
            }
            break;
        }

        // Forces Refresh
        scope.$watch('refresh', function(refresh) {
          if (angular.isUndefined(refresh)) {
            return;
          }
          DoubleClick.refreshAds(id);
        });

        // Refresh intervals
        scope.$watch('interval', function(interval) {
          if (angular.isUndefined(interval)) {
            return;
          }

          // Cancel previous interval
          $interval.cancel(intervalPromise);

          intervalPromise = $interval(function() {
            DoubleClick.refreshAds(id);
          }, scope.interval);
        });

        // Refresh after timeout
        scope.$watch('timeout', function(timeout) {
          if (angular.isUndefined(timeout)) {
            return;
          }

          $timeout(function() {
            DoubleClick.refreshAds(id);
          }, scope.timeout);
        });

       // Refresh ad if viewport orientation changes.
        angular.element($window).bind('orientationchange', function(){          
          DoubleClick.refreshAds();
        });
      });
    }
  };
}]);