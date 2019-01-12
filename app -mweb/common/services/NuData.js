'use strict';

/**
 * @ngdoc function
 * @name stpls.model:NuData
 */
angular.module('stpls').factory('NuData', function($cookies, $http, $window, Config) {

    var config;
    var nuData_ClientId, nuData_WebSiteId, nuData_serverUrl;

    var init = function(sessionId) {

        Config.init().then(function (c) {
            var nuDataConfig = c.nudata;
            var env = c.environment;
            config = nuDataConfig[env] || nuDataConfig['default'];
            if (config) {
                load (sessionId);
            }
        });
    };

    var load = function(sessionId) {

        var isEnabled, baseUrl;

        //  Get constants from Config file
        if (!nuData_ClientId) {
            nuData_ClientId = clientId();
            nuData_WebSiteId = websiteId();
            nuData_serverUrl = serverUrl();
            isEnabled = enabled();
        }

        if (isEnabled) {
            (function() {
                // NuData will provide a customer website ID
                var baseUrl = nuData_serverUrl + nuData_WebSiteId + "/sync/js/";
                (function(win, doc, scr, url, q, js, fjs, nds)
                {
                    nds = win.ndsapi || (win.ndsapi={});
                    nds.config = {q:[],ready:function(cb) { this.q.push(cb); }};
                    js = doc.createElement(scr);
                    fjs = doc.getElementsByTagName(scr)[0];
                    js.src = url;
                    fjs.parentNode.insertBefore(js, fjs);
                    js.onload = function() {
                        nds.load(url);
                    };
                } (window, document, "script", baseUrl));

                // Custom placement configuration
                var nds = window.ndsapi;

                nds.config.ready(function() {
                    // Set the session Id from NodeJS
                    nds.setSessionId(sessionId);
                    // Auto-bind to forms
                    nds.sendOnSubmit();
                });
            } ());
        }
    };

    var enabled = function() {
         return config.enabled;
    };

    var clientId = function() {
        return config.client_id;
    };

    var serverUrl = function() {
        return config.nudata_server;
    };

    var websiteId = function() {

        return config.website_id;
    };

    return {
        load: load,
        enabled: enabled,
        init: init
    };

})
.run(['$cookies', 'NuData', 'MobileService', function($cookies, NuData, MobileService) {
    NuData.init(MobileService.getSessionID());
}]);
