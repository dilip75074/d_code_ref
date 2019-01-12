'use strict';

angular.module('sprkt.creative', ['stplsSprocket'])
  .factory('ZCreative', function(ZCreativeParse, ZCreativeNotification) {

    var bindCoupon = function($elem, coupon) {
      console.log(coupon);
    };

    // expose api methods
    return {
      bindCoupon: bindCoupon,
      notify: ZCreativeNotification,
      parse: ZCreativeParse,
      props: {
        redeem: 'zredeem',
        shop: 'zshop',
      }
    };
  })
  .factory('ZCreativeParse', function() {
    return {
      query: function(url) {
        var query = {};
        var a = url.split('?').slice(1).join('?').split(/[&\?]/);
        for (var i = 0; i < a.length; i++) {
          var b = a[i].split('=');
          query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        }
        return query;
      },
      ctaUrl: function(url){
        var p = this.query(url);
        p.coupon = p.coupon || p.promoName;
        return p;
      }
    };
  })
  .factory('ZCreativeNotification', function(SprocketHub) {

    var kCTA_PREFIX = 'ZCta.';

    var passThrough = function(args) {
      return Array.prototype.slice.call(args, 1);
    };

    return {
      //bind click to event dispatch
      click: function($scope, $elem, action) {
        var that = this;
        var flag = ['zCta', action].join('.');
        if (!$elem.data(flag)) {
          $elem.data(flag, 1).on('click', function(e) {
            that.cta($scope, action, e, $elem);
          });
        }
      },
      //called when action is performed
      cta: function($scope) { //[scope, action, element, e]
        var pt = passThrough(arguments); // [action, element, e]
        pt[0] = kCTA_PREFIX + pt[0];
        $scope.$emit(pt[0], pt.slice(1));
      },
      //register cta listener
      onCta: function($scope) { // [scope, action, cb]
        var pt = passThrough(arguments); // [action, cb]
        var name = kCTA_PREFIX + pt[0];
        var cb = (pt[1] || angular.noop);
        $scope.$on(name, function($e, args) {
          cb($e, args[0], args[1]);
        });
      },

      //method to emit up to SprocketCtrl
      hub: SprocketHub.dispatch,
      listeners: SprocketHub.events,

    };
  })

//KNOWN CTAs
//redeem (.z_redeem)
.directive('zRedeem', function(ZCreative) {
    return {
      restrict: 'C',
      link: function($scope, $elem) {
        ZCreative.notify.click($scope, $elem, ZCreative.props.redeem);
      }
    };
  })
  //shop now buttons (.z_shop_now)
  .directive('zShopNow', function(ZCreative) {
    return {
      restrict: 'C',
      link: function($scope, $elem) {
        ZCreative.notify.click($scope, $elem, ZCreative.props.shop);
      }
    };
  })
  //other CTAs ('.z_cta')
  .directive('zCta', function(ZCreative) {
    return {
      restrict: 'C',
      scope: {
        id: '@'
      },
      link: function($scope, $elem) {
        var zCoupon = 'z_coupon_btn_1';
        var href = $elem.attr('href');
        if ($scope.id === zCoupon || $elem[0].querySelector('#' + zCoupon)) {
          ZCreative.notify.click($scope, $elem, ZCreative.props.redeem);
        } else if(href) { // general href
          ZCreative.notify.click($scope, $elem, ZCreative.props.shop);
        }
      }
    };
  })

//common page wrapper
.directive('c00', function(ZCreative) {
  return {
    restrict: 'C',
    link: function($scope) {
      ZCreative.notify.onCta($scope, ZCreative.props.redeem, function($e, e, $btn) {
        // console.log('c00 Redeem', $btn);
        var url = $btn.attr('href');
        var params = ZCreative.parse.ctaUrl(url);
        // dispatch to Sprocket
        ZCreative.notify.hub($scope, ZCreative.notify.listeners.coupon, params);
      });
    }
  };
})

// coupon block directive (.z_coupon_block) (found in /coupons)
.directive('zCouponBlock', function($window, $compile, ZCreative) {
  var kATC_URL_PREFIX = 'z_couponAtcUrl_';

  return {
    restrict: 'C',
    scope: {
      id: '@'
    },
    compile: function(tElement, tAttrs, transclude) {
      return {
        pre: function preLink($scope, $elem) {
          //compile as children to this scope (to receive cta notifications)
          $compile($elem.contents())($scope);
        },
        post: function postLink($scope) {

          // redeem cta
          ZCreative.notify.onCta($scope, ZCreative.props.redeem, function($e, e, $btn) {
            $e.preventDefault();
            $e.stopPropagation();
            var idx = $scope.id && $scope.id.match(/_(\d+)$/);
            if (idx) {
              idx = idx[1];
              var couponUrl = $window[kATC_URL_PREFIX + idx];
              if (couponUrl) {
                var params = ZCreative.parse.ctaUrl(couponUrl);
                // console.log('zBLOCK Redeem');
                // dispatch to Sprocket
                ZCreative.notify.hub($scope, ZCreative.notify.listeners.coupon, params);
              }
            }
          });

          //shop cta (or simple zCta call)
          ZCreative.notify.onCta($scope, ZCreative.props.shop, function($e, e, $btn) {
            e.preventDefault();
            // console.log('zBLOCK Shop');
            // dispatch to Sprocket
            var href = $btn.attr('href');
            if(href && !(/\#[\w-]*$/).test(href)) {
              ZCreative.notify.hub($scope, ZCreative.notify.listeners.link, {
                path: href.split('?').shift(),
                query: ZCreative.parse.query(href.split('?').pop())
              });
            }
          });

        }
      };
    }
  };
});
