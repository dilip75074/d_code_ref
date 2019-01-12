'use strict';
var stpls;

(function(window, angular) {

  // MWINHS-1711 - mem storage fallback for private browsing
  ['sessionStorage', 'localStorage'].forEach(function(engine) {
    try {
  		window[engine].setItem('_x', 0);
  		window[engine].removeItem('_x');
  	} catch (e) {
  		var mem = {
  			_pre: 'mem.',
  			set: function(k, v) {
  				this[this._pre + k] = v;
  			},
  			get: function(k) {
  				return (k && this[this._pre + k]) || null;
  			},
  			remove: function(k) {
  				delete this[this._pre + k];
  			}
  		};
      if (!window[engine]) {
        window[engine] = window[engine] || {};
      }
  		window[engine].setItem = mem.set.bind(mem);
  		window[engine].getItem = mem.get.bind(mem);
  		window[engine].removeItem = mem.remove.bind(mem);
  	}
  });

// define dependencies to inject
var submodules = [
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'angularSpinner',
    'ngCookies',
    'oc.lazyLoad',
    'stplsSeo',
    'stplsRouter', // Modularized this code for reuse in pseudoIso
    'stplsFilters', // Modularized this code for reuse in pseudoIso
    'stplsTemplates', // Modularized this code for reuse in pseudoIso
    'stplsTranslate', // Modularized this code for reuse in pseudoIso
    'stplsDeals', // Modularized this code for reuse in pseudoIso
    'stplsNavigation', // Modularized this code for reuse in pseudoIso
    // conveyor
    'stplsConfig',
    'stplsConveyor',
    // end conveyor
    // sprocket
    'stplsSprocket',
    'sprkt.creative',
    // end sprocket
    'stplsFooter', // WeeklyAd Footer
    // switches-board
    'stplsSwitchBoard',
    // end switches-board
    'ui.bootstrap',
    'angular-carousel',
    'angular-cache',
    'ui.tree',
    'ngMessages',
    'ui.mask',
    'barcodeGenerator',
    'toggle-switch',
    'ngMap',
    'angularPayments'
];

// create placeholder module for templateCache
angular.module('stplsTemplates', []);

// create main application
stpls = angular.module('stpls', submodules);

stpls.run(function ($rootScope, stplsRouter, Device, Analytics, MobileService, Config, Routes, scroll, $cookies, $state, $modalStack, $window, $location, $timeout, $modal, SeoMeta, SWITCHBOARD) {

    // Init SEO
    SeoMeta.init();

    /* Global Var for toggle Searching */
    $rootScope.show_search = false;

    $rootScope.$on('$stateChangeStart', function() {
      /*  When changing state, make sure
       *  we don't leave any modal dialogs
       *  hanging around
       */
        var top = $modalStack.getTop();
        if (top) {
          $modalStack.dismiss(top.key);
        }

    });

    /**
     * Direct to internal or external page
     * @param to {string} state name
     * @param params {object} params to pass
     */
    $rootScope.toRoute = function (to, params, options) {

        // Get routes config
        var toR = Routes.getRoute(to);

        if (toR) {

            // internal page active
            if (Routes.isRouteActive(to)) {

                if (to === $state.current.name) {
                    // if going to the same state (user clicks same link twice for example), then reload
                    $state.go(toR.state, params, {reload: true});
                } else {
                    $state.go(toR.state, params, options);
                }

            }
            // external page
            else {

                $window.location = Routes.getExternalLinkForRoute(to, params);

            }

        }
        // route not found
        else {

            // alert before routing if not prod
            if ($window.stpls_env !== 'prod') {

                alert('No state found.');

            }


        }


    };

    /**
     * Direct to external link, (eventually handling load analytics)
     * @param to {string} link name
     */
    $rootScope.toExternalLink = function (to) {

        // if config file has URL for route

        var externalLink = Config.getProperty('externalLinks')[to];

        if (externalLink) {

            $window.location = externalLink;

        }
        // link not found
        else {

            // alert before routing if not prod
            if ($window.stpls_env !== 'prod') {
                alert('No link found.');
            }


        }


    };


    /**
     * Error
     * @param message {string}
     * @param action {object}
     */
    $rootScope.error = function (message, action) {

        action = action || {
            title: 'Reload', callback: function () {
                $window.location.reload();
            }
        };

        $rootScope.prompt({
            header: {
                close: true,
                title: 'Error'
            },
            message: message,
            actions: {
                secondary: action
            }
        });

    };

    var rootModal, openModal = function(m) {
        Analytics.signalModification();
        //prevent multiple modals
        ((rootModal || {}).close || angular.noop)();
        rootModal = $modal.open(m);
    };


    /**
     * UI overlay prompt
     * @param p {object}
     */
    $rootScope.prompt = function (p) {
        openModal({
            windowClass: 'user_prompt',
            templateUrl: 'theme/' + $rootScope.appTheme + '/user_prompt.html',
            controller: 'UserPromptCtrl',
            size: 'sm',
            resolve: {
                prompt: function () {
                    Analytics.endModification();
                    return p;
                }
            }
        });
    };

    /**
     * UI overlay simple message prompt
     * @param p {object}
     */
    $rootScope.simplePrompt = function (p) {
        openModal({
            windowClass: 'simple_prompt',
            backdrop: true,
            templateUrl: 'theme/' + $rootScope.appTheme + '/simple_prompt.html',
            controller: 'UserPromptCtrl',
            size: 'sm',
            resolve: {
                prompt: function () {
                    Analytics.endModification();
                    return p;
                }
            }
        });
    };

    $rootScope.removeSession = function () {

        MobileService.removeSession();

    };

    $rootScope.reload = function () {

        $window.location.reload();
    };

    $rootScope.back = function () {
        history.back();
    };

    $rootScope.showDesktop = function () {

        $cookies.put('desktopView', true);

        $rootScope.toExternalLink('desktop');

    };


    $rootScope.showHelpCenter = function () {

        $cookies.put('desktopView', true);

        $rootScope.toExternalLink('helpCenter');

    };

    $rootScope.showTerms = function () {

        $cookies.put('desktopView', true);

        $rootScope.toExternalLink('terms');

    };


    $rootScope.showFooterOptin = function () {
      return ['optin','cart','checkout','confirmorder'].indexOf($state.current.name) === -1;
    };

    $rootScope.displayType = Device.getDisplayType();

    Config.init().then(function (c) {

        $rootScope.locale = c.locale;
        $rootScope.environment = c.environment;

        $rootScope.appTheme = c.appTheme;

        $rootScope.app_loaded = true;

    });

    $rootScope.hide_footer = false;

    $rootScope.setCartCount = function (count) {

        $rootScope.cart_count = count;

        // Show cart button (indicator) if not at top of page
        if (document.body.scrollTop > 45 && $state.current.name != 'cart') {
            $rootScope.cart_indicate = true;

            $timeout(function () {

                $rootScope.cart_indicate = false;

            }, 1500);
        }

    };

    $rootScope.switchBoard = SWITCHBOARD;
});

// disable debug info in prod/qa for 'significant' performance boost
stpls.config(function ($compileProvider) {
    var env = window.stpls_env;
    if (env !== 'dev' && env !== 'dev-local') {
        $compileProvider.debugInfoEnabled(false);
    }
});

stpls.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        //debug: true,
        modules: [
            {
                name: 'google-maps',
                files: ['assets/vendor_custom/scripts/angular-google-maps.js']
            }
        ]
    });


}]);

stpls.config(['$cookiesProvider',function($cookiesProvider){
  var base = document.getElementsByTagName('base');
  if(base.length){
    var baseDefault = '/';
    var baseHref = base[0].getAttribute('href') || baseDefault;
    if(baseHref !== baseDefault && document.location.href.indexOf(baseHref) === -1) {
      $cookiesProvider.defaults.path = baseDefault;
    }
  }
}]);

stpls.config(['usSpinnerConfigProvider',function(usSpinnerConfigProvider) {
  usSpinnerConfigProvider.setDefaults({color: '#5e5e5e', top: 100, hwaccel: true});
  usSpinnerConfigProvider.setTheme('atc', {scale: 0.75, position: 'relative'});
  usSpinnerConfigProvider.setTheme('tiny', {scale: 0.40, radius: 5, length: 5, width: 3});
}]);


var httpService = function (c) {


    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');

    return $http(c);


};

// stpls init

// bootstrap ng stpls app
var initStpls = function () {
    var boot;
    var checker = setInterval(function() {
      console.log('initiating stpls...');
      var i = submodules.length;
      while (i--) {
        try {
          angular.module(submodules[i]);
        } catch (e) {
          break;
        }
      }
      if (i <= 0) {
        clearInterval(checker);
        if (!boot) {
          boot = angular.bootstrap(document, ['stpls']);
        }
      }
    }, 50);
};


var initLocaleConfig = function (callback) {

    if (window.stpls_locale === false || window.stpls_locale === undefined) {

        console.log('loading locale config...');

        var region = (/\.ca$/).test(window.location.hostname) ? 'CA' : 'US';

        httpService({
            'method': 'GET',
            'url': 'config/'+region+'/config.json'
        }).then(function (r) {

            window.stpls_locale = r.data;

            callback();

        });


    }
    else {
        callback();
    }


};

var initGlobalConfig = function (callback) {
    //  Clear the MCS Cache
    sessionStorage.removeItem('mcs');
    
    if (window.stpls_global === false || window.stpls_global === undefined) {




        console.log('loading global config...');

        httpService({
            'method': 'GET',
            'url': 'config/global.json'
        }).then(function (r) {

            window.stpls_global = r.data;

            callback();

        });

    }
    else {
        callback();
    }

};


// init
// prevent auto-bootstrap in isomorphic js
if (!(/(about|file)/).test(window.location.protocol)) {

  initGlobalConfig(function() {

    var dispatch = function(name, config) {
      setTimeout(function() {
        document.dispatchEvent(new CustomEvent(name, config));
      });
    };

    //trigger event for listeners
    dispatch('stplsGlobal', {
      detail: window.stpls_global,
      bubbles: true,
      cancelable: true
    });

    initLocaleConfig(function() {

      //trigger event for listeners
      dispatch('stplsLocale', {
        detail: window.stpls_locale,
        bubbles: true,
        cancelable: true
      });

      initStpls();

    });

  });
}

})(window, window.angular);
