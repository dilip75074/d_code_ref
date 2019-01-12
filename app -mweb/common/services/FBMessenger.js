'use strict';

/**
 * @ngdoc function
 * @name stpls.model:FBMessenger
 */
angular.module('stpls').factory('FBMessenger', function($http, $window, Config) {


    var FBAppId;
    var FBMsgUrl;
    var currentType = 'homepage';
    var currentName = 'Home Page';
    var currentCategory = '';
    var cartTotal = 0.00;
    var config;

    var load = function() {

        var isEnabled;
        //  Get constants from Config file
        if (!FBAppId) {
            isEnabled = enabled();
            FBAppId = getAppId();
            FBMsgUrl = getMsgUrl();
        }

        if (isEnabled) {
           $window.fbAsyncInit = function() {
                FB.init({
                    appId: FBAppId,
                    xfbml: true,
                    version: 'v2.5'
                });
            };
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = '//connect.facebook.net/en_US/sdk.js';
                fjs.parentNode.insertBefore(js, fjs);
             } (document, 'script', 'facebook-jssdk'));
        }
    };

    var enabled = function() {
        if (!config) {
            var fbConfig = Config.getProperty('facebook');
            var env = Config.getEnvironment();
            config = fbConfig[env] || fbConfig['default'];
        }
        return config.msgEnabled;
    };

    var getAppId = function() {
        if (!config) {
            var fbConfig = Config.getProperty('facebook');
            var env = Config.getEnvironment();
            config = fbConfig[env] || fbConfig['default'];
        }
        return config.messenger_app_id;
    };

    var getMsgUrl = function() {
        if (!config) {
            var fbConfig = Config.getProperty('facebook');
            var env = Config.getEnvironment();
            config = fbConfig[env] || fbConfig['default'];
        }
        return config.messenger_url;
    };

    return {
        load: load,
        enabled: enabled,
        getMsgUrl: getMsgUrl
    };

});
