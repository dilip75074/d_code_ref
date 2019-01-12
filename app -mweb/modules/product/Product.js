'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Product
 */
angular.module ('stpls').factory ('Product', function ($http, $q, MobileService, Account, Config, ShippingConfig, $angularCacheFactory, Seo, stplsRouter) {

    var productCache = $angularCacheFactory ('stpls.product', {
        capacity : 10,
        maxAge : 180000, // 5 min
        storageMode : 'localStorage',
        storagePrefix : 'stpls.'
    });

    /*   Pass true for asgard parameter to obtain
     *   product data from asgard.  When false, product
     *   data comes from Ez-Open.
     */
    var getBySKU = function (sku, asgard) {

        var d = $q.defer ();

        var url = '/product/' + sku + '/details';
        if (asgard) {
            url = '/asgard' + url;
        }
        MobileService.request ({
            method : 'GET',
            url : url,
            cache : true,
            params : {
                zip : Account.getZipCode ()
            }
        }).then (function (response) {

            var product;

            if (asgard) {
                product = response.data.activeSku;
                if (response.data.skuset && response.data.skuset.length > 0) {
                    product.products =  response.data.skuset;
                }
            } else {
                product = response.data.results[0];
            }

            if (product) {
                enhanceProductObject (product);
                d.resolve (product);
            } else {
                d.reject ('Error obtaining product.');
            }

        }, function () {
            d.reject ('No product found.');
        });

        return d.promise;
    };

    var enhanceProductObject = function(product) {

       // set special pricing
        getPricing (product);

        //  set special pricing for skuset items
        if (product.products) {
            product.products.forEach (function (prod) {
                getPricing (prod);
            });
        }

        // calculate the rebates into
        // simple fields for the sku page
        calcRebate (product);

        // Set shipping Tags
        setSkuTags(product);

        if (!product.retailOnly) {      //  make sure we have a setting
            product.retailOnly = 'false';
        }

        // Multiple part #s
        product.hasParts = (product.products != undefined && product.products.length > 0);

        //  Cache it
        productCache.put (product.sku, angular.copy (product));
    };


    var isPrepopulatedSKU = function (sku) {
        if (productCache.get (sku) != undefined) {
            return productCache.get (sku);
        } else {
            return false;
        }
    };

   var getReviews = function (sku, sortParam, sortDirection, pageIn, countIn) {
        var d = $q.defer ();

        MobileService.request ({
            method : 'GET',
            url : '/product/' + sku + '/reviews',
            cache : false,
            params : {
                sort : sortParam,
                direction: sortDirection,
                page : pageIn,
                count : countIn
            },
        }).then (function (response) {
            d.resolve (response.data);

        }, function (error) {
            d.reject (error);
        });

        return d.promise;
    };

    var getImages = function (sku) {

        if (productCache.get (sku) != undefined) {
            var product = productCache.get (sku);
        } else {
            return false;
        }

        var images = [];
        product.images.forEach (function (img) {
            images.push ({
                url : img.split('Staples/')[1]
            });
        });

        return images;
    };

    var setSkuTags = function(product) {
        var pricing;
        var shippingBits = ShippingConfig.getShippingBitFlags();
        var bitFreeShipping = shippingBits.bitFreeShipping;
        var bitBopis = shippingBits.bitBopis;
        var bitAddOn = shippingBits.bitAddOn;
        var bitHeavyWeight = shippingBits.bitHeavyWeight;
        var bitRetailOnly = shippingBits.bitRetailOnly;

        if (product.price) {
            pricing = product.price;
        } else {
            pricing = product.pricing;
            if (pricing && pricing.length > 0) {
                pricing = pricing[0];
            }
        }

        var tag;

        if (product.bopis === 'true') {
            tag = bitBopis;
        }

        if (product.retailOnly === 'true') {
            if (tag) {
               tag |= bitRetailOnly;
            } else {
               tag = bitRetailOnly;
            }
            product.tag = tag;
            return;
        }

        if (product.freeShipping === 'true') {
            tag |= bitFreeShipping;
        }

        if (pricing) {
            if (pricing.addOnItem || product.isAddOnSKU) {
                tag |= bitAddOn;
            }
            if (pricing.overSizeItem || product.isHeavyWeightSKU) {
                tag |= bitHeavyWeight;
            }
        }

        if (tag) {
            product.tag = tag;
        }
    };

    var showRegPrice = function (product) {
        var pricing = getPricing(product);
        var flag;
        if (typeof pricing != 'undefined' && pricing.showDiscountedPrice) {      //pB flag
            flag = pricing.showDiscountedPrice;
        };
        if (typeof flag === 'undefined') {
            flag = parseFloat(pricing.listPrice || pricing.price) > parseFloat(pricing.finalPrice || pricing.price);
        }
        return flag;
    };

    var getDiscountPercent = function (product) {
        var pricing = getPricing(product);
        var value = Math.floor((1 - (pricing.finalPrice / pricing.listPrice)) * 100);
        var min_percent = 20;
        var discount = value >= min_percent ? 'Save ' + value  + '%' : null;

        return discount;
    };

    var getStarted = function (product) {
       var reDirectUrl;
        if (product.getStartedUrl) {
            reDirectUrl = product.getStartedUrl;
        } else {
            var meta = Config.getSeo();
            var dotcom = '';
            if (meta && meta.canonicalDomain) {
                dotcom = meta.canonicalDomain;
            }
            reDirectUrl = dotcom + Seo.quartz.sku(product).url;
        }
        if (reDirectUrl) {
            stplsRouter.toHref(reDirectUrl);
            return true;
        } else {
            return false;
        }
    };

    var getPricing = function (product) {
        //  resolve the differences between EZOpen and Asgard, pricing[0] vs price
        if (product.price) {
            return product.price;
        } else if (product.pricing && product.pricing[0]) {
             product.price = product.pricing[0];
             return product.price;
        } else {
            return (product.pricing || []).slice ().shift ();
        }
    };

    var calcRebate = function (product) {

       var rebate = 0.00;

       //  Old stuff for EZ-Open
       if (product.price && product.price.discounts) {
            angular.forEach (product.price.discounts, function (discount) {
                if (discount.name.toUpperCase () === 'REBATE') {//   case insensitive
                    if (discount.deductFromListPrice === 'true') {
                        //  This is a price after rebate case
                        rebate += parseFloat (discount.amount);
                    }
                }
            });
        }

        //  For Asgard
        if (product.price && product.price.rebate) {
            angular.forEach (product.price.rebate, function (rebateitem) {
                rebate += parseFloat (rebateitem.amount);
            });
        }

        product.rebate = rebate;
    };

    return {
        getBySKU : getBySKU,
        getReviews : getReviews,
        getImages : getImages,
        isPrepopulatedSKU : isPrepopulatedSKU,
        getPricing : getPricing,
        setSkuTags : setSkuTags,
        showRegPrice : showRegPrice,
        getDiscountPercent: getDiscountPercent,
        getStarted : getStarted
    };

});
