'use strict';

angular.module('stpls')
  .controller('AtcCtrl', function($scope, $rootScope, $state, $translate, $location, stplsRouter, Cart, Coupons) {

    var query = $location.search();
    var atcItems = [];
    var coupon = query.promoName || query.z_coupon || query.coupon || query.Couponcode;
    ($scope.$parent || {}).overlay_loading = true;

    var jump = function(err, message) {
      ($scope.$parent || {}).overlay_loading = false;

      // determine jumpTo route
      var jumpTo = $state.params.URL || query.URL || (err ? '/' : '/cart');
      jumpTo = decodeURIComponent(jumpTo);
      // ensure route is matched
      var match = stplsRouter.match(jumpTo);
      if(!(match && match.route)) {
        jumpTo = (err ? '/' : '/cart');
      }

      // console.log(atcItems, coupon, jumpTo); return;
      stplsRouter.toHref(jumpTo, {}, {location: 'replace'});

      $rootScope.simplePrompt({
        error: err,
        message: $translate.instant((err && err.message) || err || message),
        icon: (err ? 'ban-circle' : 'ok'),
        autoclose: 5e3
      });
    };

    var addCoupon = function (code, message) {
      if (code) {
        Coupons.addCouponToCart(code)
          .then(jump.bind(null, null, message), jump.bind(null));
      } else {
        jump(null, message);
      }
    };

    // get sku, qty from state params (within MIP)
    if ($state.params.sku) {
      atcItems.push({
        sku: $state.params.sku,
        qty: $state.params.qty || 1,
      });
    }

    // get skus and qty from partNumber_X, quantity_X (legacy)
    angular.forEach(query, function(val, k) {
      if (val && k.indexOf('partNumber') === 0) {
        var idx = (k.match(/(_?\d+)$/) || ['']).pop();
        atcItems.push({
          sku: val,
          qty: query['quantity' + idx] || 1
        });
      }
    });

    // process and jump
    if (!atcItems.length && !coupon) { // nothing
      return jump(new Error('ATC_ERR_NOITEMS'));
    } else if (atcItems.length) { // sku first
      Cart.addItems(atcItems)['finally'](addCoupon.bind(null, coupon, 'ATC_ITEMS_ADDED'));
    } else { //coupon only
      addCoupon(coupon, 'ATC_COUPON_ADDED');
    }


  });
