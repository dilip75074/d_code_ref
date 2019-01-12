'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Coupons
 */
angular.module('stpls').factory('Coupons', function($q, $cookies, MobileService, Account, Analytics) {

    //  Get the users Coupons Applied in Cart
    var getCouponsInCart = function() {
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/coupon',
            cache: false,
            params: {
                limit: 100,
                offset: 0
            }
        }).then(function(response) {
            if (response.data.Coupon[0] !== undefined) {
                var coupons = response.data.Coupon[0].Coupon;
                d.resolve(coupons);
            }
        }, function(error) {
            //  If error, then return
            //  empty array
            console.log ('error returned from getCouponsInCart, error:' + error);
            var coupons = {};
            d.resolve(coupons);
        });

        return d.promise;
    };

    //  Adds a coupon to the cart
    var addCouponToCart = function(code) {
      var d = $q.defer();
      MobileService.getSession()['finally'](function(){
        MobileService.request({
            method: 'POST',
            url: '/coupon',
            dataType: 'json',
            cache: false,
            params: {
                zip: Account.getZipCode()
            },
            data: {
                'promoName': String(code)
            },
        }).then(function(response) {
            d.resolve(response);
            Analytics.couponCTA(code);
        }, function(error) {
            if (error && error.data && error.data.errorMessage) {
                d.reject(error.data.errorMessage);
                Analytics.couponCTA(code, error.data.errorMessage);
            } else {
                d.reject(error);
                Analytics.couponCTA(code, error);
            }
        });
      });

        return d.promise;
    };

    //  Deletes a coupon in the cart
    var deleteCouponInCart = function(code) {
        var d = $q.defer();

        MobileService.request({
            method: 'DELETE',
            url: '/coupon/' + String(code),
            headers: {
                'content-type': 'application/json'
            },
            dataType: 'json',
            cache: false,
        }).then(function(response) {
            d.resolve(response);

        }, function(error) {
            console.log ('error returned from delete coupon.  we will ignore these errors: ' + error);
            d.resolve('ok');
        });

        return d.promise;
    };

    return {
        getCouponsInCart: getCouponsInCart,
        addCouponToCart: addCouponToCart,
        deleteCouponInCart: deleteCouponInCart
    };

});
