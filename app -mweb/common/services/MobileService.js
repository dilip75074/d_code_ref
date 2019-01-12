'use strict';

/**
 * @ngdoc function
 * @name stpls.model:MobileService
 */
angular.module('stpls').factory('MobileService', function($http, $q, $cookies, Config, $rootScope, $angularCacheFactory, Analytics) {

    var initCache = false;

    var sessionIdCache = $angularCacheFactory('stpls.sessionId', {
      capacity: 1,
      maxAge : 864e5, // 24 hours
      deleteOnExpire: 'aggressive',
      storageMode: 'sessionStorage',
      storagePrefix: 'stpls.'
    });

    if (window.mobileServiceCache) {

        initCache = window.mobileServiceCache;
    }

    /*  This request returns a $http promise for the provided Channel API
     */
    var request = function(c) {

        var api = Config.getApi();
        var cacheKey = c.url;
        c.url = api.host + api.channel + c.url;


        if (initCache && initCache[cacheKey] != undefined) {

            var d = $q.defer();

            d.resolve({
                data: initCache[cacheKey]
            });

            delete initCache[cacheKey];

            return d.promise;

        } else {

            // inject params
            if (c.params === undefined) {
                c.params = {};
            }
            c.params.locale = Config.getLocale();

            // inject headers
            if (c.headers === undefined) {
                c.headers = {};
            }
            c.headers.WCToken = $cookies.get('WCToken');
            c.headers.WCTrustedToken = $cookies.get('WCTrustedToken');

            return $http(c);
        }
    };

    /*  This request creates a url for the chapi API
     * POW encryption service
     */
    var powRequest = function(c) {

        var api = Config.getApi();
        c.url = api.host + api.channel + c.url + api.powserver;

        console.log('cache url: ', c.url);

        if (initCache && initCache[c.url] != undefined) {

            var d = $q.defer();

            d.resolve({
                data: JSON.parse(initCache[c.url])
            });

            delete initCache[c.url];

            return d.promise;

        } else {

            // inject params
            if (c.params === undefined) {
                c.params = {};
            }
            c.params.locale = Config.getLocale();

            return $http(c);
        }
    };

    /*  This request accepts a full url
     *  for the request
     */
    var rawRequest = function(c) {

        if (initCache && initCache[c.url] != undefined) {

            var d = $q.defer();

            console.log('Responded with mobile service cache ' + c.url);

            d.resolve({
                data: JSON.parse(initCache[c.url])
            });

            delete initCache[c.url];

            return d.promise;


        } else {
            var api = Config.getApi();

            if (c.params == undefined) {
                c.params = {};
            }

            c.params.locale = Config.getLocale();

            return $http(c);

        }
    };

    var session = false;

    var hasSession = function() {
        //  Make sure all users have sessionId
        getSessionID();
        return ($cookies.get('WCState') && $cookies.get('WCToken'));
    };

    var createSessionID = function() {

        function chr4() {
            return Math.random().toString(16).slice(-4);
        }
        var sessionId = chr4() + chr4() +
            '-' + chr4() +
            '-' + chr4() +
            '-' + chr4() +
            '-' + chr4() + chr4() + chr4();

        sessionIdCache.put('mip_SessionId', sessionId);
    };

    var getSessionID = function() {
        //  Make sure all users have sessionId
        var sessionId;
        var sessionId = sessionIdCache.get('mip_SessionId');
        if (!sessionId) {
            createSessionID();
            return sessionIdCache.get('mip_SessionId');
        } else {
            return sessionId;
        }
    };

    var initGuestSession = function() {

        var d = $q.defer();

        request({
            method: 'POST',
            url: '/guestLogin'
        }).then(function(response) {

            session = {
                userID: response.data.userId,
                personalizationID: response.data.personalizationID,
                WC: {
                    token: response.data.WCToken,
                    trustedToken: response.data.WCTrustedToken
                }
            };

            setSession('guest', session);

            d.resolve(session);

        }, d.reject);


        return d.promise;
    };

    var attemptSessionLogin = function(user, password) {

        var d = $q.defer();
        var headers;

        // if we have a guest session, then send the tokens in order to migrate the session
        if (hasSession()) {
            headers = {
                'WCToken': $cookies.get('WCToken'),
                'WCTrustedToken': $cookies.get('WCTrustedToken')
            };
        } else {
            headers = {
                'Content-Type': 'application/json'
            };
        }

        request({
            method: 'POST',
            headers: headers,
            url: '/eoLogin',
            dataType: 'json',
            cache: false,
            data: {
                'logonId': user,
                'logonPassword': password
            }
        }).then(function(response) {

            session = {
                userID: response.data.userId,
                userName: user,
                personalizationID: response.data.personalizationID,
                WC: {
                    token: response.data.WCToken,
                    trustedToken: response.data.WCTrustedToken
                }
            };

            setSession('registered', session);


            d.resolve(session);

        }, function(error) {

            d.reject(error);

        });

        return d.promise;
    };

    var attemptSessionLogout = function() {

        var d = $q.defer();

        request({
            method: 'DELETE',
            url: '/eoLogout',
            dataType: 'json',
            cache: false,
            headers: {
                'WCToken': $cookies.get('WCToken'),
                'WCTrustedToken': $cookies.get('WCTrustedToken')
            }
        }).then(function(response) {

            removeSession();

            d.resolve(response);

        }, function(error) {

            console.log('error logging out', error);
            d.reject(error);

        });

        return d.promise;
    };

    var setSession = function(state, session) {

        $cookies.put('WCToken', session.WC.token);

        $cookies.put('WCTrustedToken', session.WC.trustedToken);

        $cookies.put('WCState', state);

        $cookies.put('userID', session.userID);

        $cookies.put('userName', session.userName);

        if (state === 'registered') {
            //  once registered, remove guest data in local storage
            localStorage.removeItem('guestData');
            localStorage.removeItem('stpls.guest.cart');
        }

        Analytics.setUserStatus(state);
        Analytics.updateToVisitor({
            dcn: session.userID
        });
    };

    var removeSession = function() {

        var sesCookies = ['WCToken', 'WCTrustedToken', 'WCState', 'userID', 'userName'];
        angular.forEach(sesCookies, function(c) {
            $cookies.remove(c);
        });

        var sesLocal = ['shipAllToStore', 'useShipAsBill', 'addressMode', 'lastUserShipId', 'lastUserBillId', 'lastUserCCId', 'defaultStore', 'guestData'];
        angular.forEach(sesLocal, function(l) {
            localStorage.removeItem(l);
        });

        //  Clear Cart Counter
        $rootScope.setCartCount(0);
    };

    // called if token is expired
    var expireToken = function(error) {

        var sesCookies = ['WCToken', 'WCTrustedToken', 'WCState', 'userID', 'userName'];

        angular.forEach(sesCookies, function(c) {
            $cookies.remove(c);
        });


        $cookies.put('WCState', 'guest');

        console.log('WCToken expired -- setting user session to Guest', error);

        $rootScope.error('Sorry, your session has expired, please sign in again');
    };

    var getSession = function() {

        var d = $q.defer();

        if (!hasSession()) {

            initGuestSession().then(function() {

                d.resolve({
                    WCToken: $cookies.get('WCToken'),
                    WCTrustedToken: $cookies.get('WCTrustedToken'),
                    WCState: $cookies.get('WCState')
                });

            }, d.reject);

        } else {

            d.resolve({
                WCToken: $cookies.get('WCToken'),
                WCTrustedToken: $cookies.get('WCTrustedToken'),
                WCState: $cookies.get('WCState')
            });
        }

        return d.promise;
    };

    var getSessionState = function() {

        return $cookies.get('WCState');
    };

    var getSessionUserID = function() {

        if (!hasSession() || getSessionState() === 'guest') {
            return false;
        } else {
            return $cookies.get('userID');
        }
    };

    var getSessionUserName = function() {

        if (!hasSession() || getSessionState() === 'guest') {
            return false;
        } else {
            return $cookies.get('userName');
        }
    };

    var hasVisitedGuestHome = function() {

      return ($cookies.get('guestHome') === 'visited');
    };

    var createGuestHomeCookie = function() {
      var expireDate = new Date();

      expireDate.setDate(expireDate.getDate() + 60);
      $cookies.put('guestHome', 'visited', {'expires': expireDate});
    };

    /**
     * autoinit analytics visitor DLO
     */
    (function initAnalytics() {
        Analytics.setUserStatus(getSessionState());
        Analytics.updateToVisitor({
            dcn: getSessionUserID() || ''
        });
    })();

    return {

        request: request,
        rawRequest: rawRequest,
        powRequest: powRequest,

        initGuestSession: initGuestSession,

        attemptSessionLogin: attemptSessionLogin,
        attemptSessionLogout: attemptSessionLogout,

        getSession: getSession,
        setSession: setSession,

        expireToken: expireToken,

        getSessionState: getSessionState,

        hasSession: hasSession,

        removeSession: removeSession,

        getSessionUserID: getSessionUserID,
        getSessionUserName: getSessionUserName,
        getSessionID: getSessionID,

        hasVisitedGuestHome: hasVisitedGuestHome,
        guestHomeCookie: createGuestHomeCookie,

    };

});
