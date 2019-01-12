'use strict';

/**
 * @ngdoc function
 * @name stpls.model:InsideChat
 */
angular.module('stpls').factory('InsideChat', function($http, $window, Config) {

    var currentUserId = '';         //   don't allow this to be null or undefined
    var currentUserName = '';       //   don't allow this to be null or undefined
    var currentUserData = {
        zipcode: undefined
    };
    var accountKey;
    var insideServer;
    var currentType = 'homepage';
    var currentName = 'Home Page';
    var currentCategory = '';
    var cartTotal = 0.00;
    var insideIsEnabled;

    var loadInsideChat = function(userId, userName) {

        //  Get Inside constants from Config file
        if (!accountKey) {
            var config = Config.getProperty('inside');
            var env = Config.getEnvironment();
            var useConfig = config[env] || config['default'];
            insideIsEnabled = useConfig.chatEnabled;
            accountKey = useConfig.accountKey;
            insideServer = useConfig.server;
        }

        if (insideIsEnabled) {

            currentUserId = userId;
            currentUserName = userName;
            currentCategory = '';

            if (!accountKey) {
                accountKey = 'IN-1000461';
                console.log ('****!!!! Unable to locate PowerFront Inside Account Key in Config file, using default account which may not be correct.');
            }
            if (!insideServer) {
                insideServer = '//us-sandbox-track.inside-graph.com';
                console.log ('****!!!! Unable to locate PowerFront Inside Server Url in Config file, using default url which may not be correct.');
            }

            $window._inside = $window._inside || [];
            $window._inside.push({ 'action':'getTracker', 'account':accountKey});
            $window._inside.push({ 'action':'bind', 'name':'onload', 'callback':
                function(tracker) {
                    tracker.visitorId = currentUserId;
                    tracker.visitorName = currentUserName;
                    tracker.visitorData = currentUserData;

                       if (currentType === 'homepage') {
                         if (cartTotal > 0) {
                            tracker.trackView({
                                'type': currentType,
                                'name': currentName,
                                'category': currentCategory,
                                'orderId': 'auto',
                                'orderTotal': cartTotal,
                                'tags': 'zip:' + (currentUserData.zipcode || '')
                            });
                        } else {
                            tracker.trackView({
                                'type': currentType,
                                'name': currentName,
                                'category': currentCategory,
                                'tags': 'zip:' + (currentUserData.zipcode || '')
                            });
                        }
                        }

                }
            });
            prepareInsideJS();
       }
    };

    var trackerHome = function() {
        currentType = 'homepage';
        currentName = 'Home Page';
        currentCategory = '';
        tracker();
    };

    var trackerLogoutUser = function() {
        currentUserId = '';
        currentUserName = '';
        currentUserData =  {
            zipcode: undefined
        };
        currentType = 'homepage';
        currentName = 'Home Page';
        currentCategory = '';
        tracker();
    };

    var trackerSearch = function(searchTerm, resultsFound) {

        if (insideIsEnabled) {

            currentType = 'search';
            currentName = searchTerm;
            currentCategory = '';

            var tagValue = '';
            if (!resultsFound) {
                tagValue = 'NoResults,' + 'zip:' + (currentUserData.zipcode || '');
            } else {
                tagValue = 'zip:' + (currentUserData.zipcode || '');
            }
            prepareForTracker();

            if (cartTotal > 0) {
                $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'tags': tagValue,
                    'orderId': 'auto',
                    'orderTotal': cartTotal
                });
            } else {
                $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'tags': tagValue,
                });
            }

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    var trackerArticle = function(name) {
        currentType = 'article';
        currentName = name;
        currentCategory = '';
        tracker ();
    };

    var trackerLogin = function() {
        currentType = 'login';
        currentName = 'Login';
        currentCategory = '';
        tracker ();
    };

    var trackerCartSTS = function(cart, shipToStore) {

        if (insideIsEnabled) {
            currentType = 'checkout';
            currentName = 'Cart';
            currentCategory = '';

            var STSValue = '';
            if (shipToStore) {
                STSValue = 'shiptostore,' + 'zip:' + (currentUserData.zipcode || '');
            } else {
                STSValue = 'zip:' + (currentUserData.zipcode || '');
            }

            prepareForTracker();

            if (cart && cart.productsInCart) {
                $window._inside.push({
                   'action': 'trackView',
                   'type': currentType,
                   'name': currentName,
                   'orderId': 'auto',
                   'orderTotal': cartTotal,
                   'tags': STSValue,

                });
            } else {
                $window._inside.push({
                   'action': 'trackView',
                   'type': currentType,
                   'name': currentName,
                   'tags': STSValue,
                });
            }

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    var trackerUpdateCart = function(cart, noProcess, trackCartPage) {

        if (insideIsEnabled) {

            if (cart && cart.preTaxTotal) {
                cartTotal = cart.preTaxTotal;
            } else {
                cartTotal = 0;
            }

            //  if noProcess is set, we are just using the
            //  add to cart code from another process
            if (!noProcess) {
                prepareForTracker();
            }

            //  Get STS setting
            var STS = (localStorage.getItem('shipAllToStore') === 'true');

            var STSValue = '';
            if (STS) {
                STSValue = 'shiptostore,' + 'zip:' + (currentUserData.zipcode || '');
            } else {
                STSValue = 'zip:' + (currentUserData.zipcode || '');
            }

            //  Re-add all the cart items essentially refreshing the cart in Inside
            if (cart && cart.productsInCart) {
                for (var idx = 0; idx < cart.productsInCart.length; idx++) {
                    var item = cart.productsInCart[idx];
                    if (item.pricing) {
                        item.price = item.pricing[0];
                    }
                    var image = '';
                    if (item.images && item.images.length > 0) {
                        image = item.images[0];
                    }
                    $window._inside.push({
                        'action': 'addItem',
                        'orderId': 'auto',
                        'sku': item.sku,
                        'name': htmlDecode(item.name),
                        'img': image,
                        'price': item.price.finalPrice,
                        'qty': item.qty,
                    });
                }
            }

            //  If trackCartPage, then we want to set the floor location of the avatar
            if (trackCartPage) {            //  Only when we are actually on the cart page
                currentType = 'checkout';
                currentName = 'Cart';
                currentCategory = '';
            }

            if (!noProcess) {

                // Track the order - different for products vs. no products
                if (cart && cart.productsInCart) {

                    if (trackCartPage) {
                         $window._inside.push({
                            'action': 'trackView',
                            'type': currentType,
                            'name': currentName,
                            'orderId': 'auto',
                            'orderTotal': cartTotal,
                            'tags': STSValue
                        });
                    }
                    $window._inside.push({
                        'action': 'trackOrder',
                        'orderId': 'auto',
                        'orderTotal': cart.preTaxTotal,
                        'complete': false,
                        'update': false,
                        'data': {
                            'taxTotal': 0.00,
                            'shippingTotal': 0.00
                        }
                    });

                } else {

                    if (trackCartPage) {
                        $window._inside.push({
                            'action': 'trackView',
                            'type': currentType,
                            'name': currentName,
                            'tags': STSValue
                        });
                     }
                     $window._inside.push({
                        'action': 'trackOrder',
                        'complete': false,
                        'update': false,
                    });
                }

                setTimeout(function() {
                    _insideGraph.processQueue();
                }, 500);
            }
        }
    };

    /* Track the page view when user browses category */
    var trackerCategory = function(category, parent, img, analytics) {

        if (insideIsEnabled) {

            prepareForTracker();

            currentType = 'productcategory';
            currentName = category;
            currentCategory = parent;

            var tempdata = {};
            if (analytics) {
                tempdata.L1 = analytics.scName || parent || 'null';
                tempdata.L2 = analytics.cgName || category || 'null';
                tempdata.L3 = analytics.dpName || 'null';
                tempdata.L4 = analytics.clName || 'null';
            } else {
                tempdata.L1 = parent || 'null';
                tempdata.L2 = category || 'null';
                tempdata.L3 = 'null';
                tempdata.L4 = 'null';
            }
            var tagString = 'Supercategory:' + tempdata.L1 + ',Category:' +
                tempdata.L2 + ',Department:' + tempdata.L3 + ',Class:' + tempdata.L4 + ',zip:' + (currentUserData.zipcode || '');

            if (parent && img) {
                if (cartTotal > 0) {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'category': currentCategory,
                        'img': img,
                        'data': tempdata,
                        'tags': tagString,
                        'orderId': 'auto',
                        'orderTotal': cartTotal
                    });
                } else {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'category': currentCategory,
                        'img': img,
                        'data': tempdata,
                        'tags': tagString,
                    });
                }
            } else if (parent) {
                if (cartTotal > 0) {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'category': currentCategory,
                        'data': tempdata,
                        'tags': tagString,
                        'orderId': 'auto',
                        'orderTotal': cartTotal
                    });
                } else {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'category': currentCategory,
                        'data': tempdata,
                        'tags': tagString
                    });
                }
            } else {
                if (cartTotal > 0) {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'data': tempdata,
                        'tags': tagString,
                        'orderId': 'auto',
                        'orderTotal': cartTotal
                   });
                } else {
                    $window._inside.push({
                        'action': 'trackView',
                        'type': currentType,
                        'name': currentName,
                        'data': tempdata,
                        'tags': tagString
                    });
                }
            }

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    /* Track the page view when user goes to the SKU page */
    var trackerProduct = function(categoryPath, product, zip) {

        if (insideIsEnabled) {

            prepareForTracker();

            currentType = 'product';
            currentName = htmlDecode(product.name);
            currentCategory = categoryPath;

            var image = '';
            if (product.images.length > 0) {
                image = product.images[0];
            }

            var tempdata = {};
            if (product.analytics) {
                tempdata.L1 = product.analytics.scName || 'null';
                tempdata.L2 = product.analytics.cgName || 'null';
                tempdata.L3 = product.analytics.dpName || 'null';
                tempdata.L4 = product.analytics.clName || 'null';
            } else {
                tempdata.L1 = 'null';
                tempdata.L2 = 'null';
                tempdata.L3 = 'null';
                tempdata.L4 = 'null';
            }
            var tagString = 'Supercategory:' + tempdata.L1 + ',Category:' +
                tempdata.L2 + ',Department:' + tempdata.L3 + ',Class:' + tempdata.L4 + ',zip:' + zip;

            if (cartTotal > 0) {
               $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'img': image,
                    'data': tempdata,
                    'tags': tagString,
                    'category': currentCategory,
                    'sku': product.sku,
                    'price': product.price.finalPrice || '',
                    'orderId': 'auto',
                    'orderTotal': cartTotal
                });

            } else {
                $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'img': image,
                    'data': tempdata,
                    'tags': tagString,
                    'category': currentCategory,
                    'sku': product.sku,
                    'price': product.price.finalPrice || ''
                });
            }

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    /* Track the page view when user moves to checkout */
    var trackerCheckout = function(cart, orderTotal, taxTotal, shippingTotal) {

        if (insideIsEnabled) {

            prepareForTracker();

            currentType = 'checkout';
            currentName = 'Checkout';
            currentCategory = '';
            var STS = (localStorage.getItem('shipAllToStore') === 'true');

            var STSValue = '';
            if (STS) {
                STSValue = 'shiptostore,' + 'zip:' + (currentUserData.zipcode || '');
            } else {
                STSValue = 'zip:' + (currentUserData.zipcode || '');
            }

            $window._inside.push({
                'action': 'trackView',
                'type': 'checkout',
                'name': 'Checkout',
                'orderId': 'auto',
                'orderTotal': orderTotal,
                'data': {
                    'taxTotal': taxTotal,
                    'shippingTotal': shippingTotal
                },
                'tags': STSValue
            });

            trackerUpdateCart(cart, true, false);

            $window._inside.push({
                'action': 'trackOrder',
                'orderId': 'auto',
                'orderTotal': orderTotal,
                'data': {
                    'taxTotal': taxTotal,
                    'shippingTotal': shippingTotal
                },
                'complete': false
            });

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    /* Track the page view when user submits the order */
    var trackerOrderConfirmed = function(newOrderNum, orderTotal, taxTotal, shippingTotal) {

        if (insideIsEnabled) {

            prepareForTracker();

            _insideGraph.current.trackOrder({
               'orderId': 'auto',
               'newOrderId': newOrderNum,
               'orderTotal': orderTotal,
               'data': {
                    'taxTotal': taxTotal,
                    'shippingTotal': shippingTotal
               },
               'update': true,
               'complete': true
            });

            currentType = 'orderconfirmed';
            currentName = 'Order Confirmed';
            currentCategory = '';
            _insideGraph.current.trackView({
               'action': 'trackView',
               'type': currentType,
               'name': currentName,
               'tags': 'zip:' + (currentUserData.zipcode || '')
            });

            cartTotal = 0.00;
        }
    };

    /* Update visitor Information */
    var updateVisitorInfo = function(profile, zip) {

        if (insideIsEnabled) {
            prepareForTracker();

            var name = '';
            var phone = '';
            if (profile.addresses && profile.addresses.length > 0) {
                var address = profile.addresses[0];
                name = address.first + ' ' + address.last;
                phone = address.phone;

            }
            var emailAddress = profile.emailAddress || '';
            var rewardTier = profile.customerTier || '';
            var rewardsNum = profile.rewardsNumber || '';
            var oldId = ((_insideGraph || {}).current || {}).visitorId || '';

            var tempdata = {};
            tempdata.id = oldId;
            tempdata.zipcode = zip;
            tempdata.tier = rewardTier;
            tempdata.rewards = rewardsNum;
            tempdata.name = name;
            tempdata.email = emailAddress;
            tempdata.phone = phone;

            currentUserId = emailAddress;
            currentUserName = name;
            currentUserData = tempdata;

            setTimeout(function() {
                if (_insideGraph) {
                    if (_insideGraph.current) {
                        _insideGraph.current.visitorId = currentUserId;
                        _insideGraph.current.visitorName = currentUserName;
                        _insideGraph.current.visitorData = currentUserData;
                    }
                }
            }, 500);
        }
    };

    /* Common tracker call */
    var tracker = function() {

        if (insideIsEnabled) {

            prepareForTracker();

            if (cartTotal > 0) {
                $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'orderId': 'auto',
                    'orderTotal': cartTotal,
                    'tags': 'zip:' + (currentUserData.zipcode || '')
                });
            } else {
                $window._inside.push({
                    'action': 'trackView',
                    'type': currentType,
                    'name': currentName,
                    'tags': 'zip:' + (currentUserData.zipcode || '')
                });
            }

            setTimeout(function() {
                _insideGraph.processQueue();
            }, 500);
        }
    };

    var prepareInsideJS = function() {

        if (insideIsEnabled) {
            var a = document.createElement('script');
            var m = document.getElementsByTagName('script')[0];
            a.async = 1;
            a.src = insideServer + '/ig.js';
            m.parentNode.insertBefore(a, m);
        }
    }

    var prepareForTracker = function() {

        if (insideIsEnabled) {

            $window._inside = $window._inside || [];

            setTimeout(function() {
                if (_insideGraph === undefined || !_insideGraph)  {
                    $window._inside.push({
                        'action': 'getTracker',
                        'account': accountKey,
                        'visitorId': currentUserId,
                        'visitorName': currentUserName,
                        'visitorData': currentUserData
                    });
                }
                if (_insideGraph && _insideGraph.current) {
                    _insideGraph.current.url = window.location.url || window.location.href;
                }
            }, 500);
        }
    };

    function htmlDecode(input) {
        var allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
        var commentsAndPhpTags = /<!--[\s\S]*?-->|&reg;|<\?(?:php)?[\s\S]*?\?>/gi

        return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
        });
    }

    return {
        loadInsideChat: loadInsideChat,
        trackerArticle: trackerArticle,
        trackerHome: trackerHome,
        trackerLogin: trackerLogin,
        trackerLogoutUser: trackerLogoutUser,
        trackerUpdateCart: trackerUpdateCart,
        trackerCartSTS: trackerCartSTS,
        trackerSearch: trackerSearch,
        trackerCategory: trackerCategory,
        trackerProduct: trackerProduct,
        trackerCheckout: trackerCheckout,
        trackerOrderConfirmed: trackerOrderConfirmed,
        updateVisitorInfo: updateVisitorInfo
    };

});
