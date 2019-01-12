/*

Staples mWeb routing

- App routes are injected into DOM on server side from config/routes.json (except dev-local is loaded from index.html)

 */
(function(window, angular, undefined) {
  'use strict';

  angular.module('stpls')
    .factory('baseHttpInterceptor', ['$browser', '$templateCache', function($browser, $templateCache) {
      return {
        request: function(request) {
          var base = $browser.baseHref();
          if (base && !(/^https?:\/\//i).test(request.url) && (/^(common|config|modules|theme)/).test(request.url) && request.url.indexOf(base) !== 0) {
            //finally check the template cache as to not interfere with prepopulated entries
            if (!$templateCache.get(request.url)) {
              request.url = base + request.url;
            }
          }
          return request;
        }
      };
    }])
    .factory('errorHttpInterceptor', ['$rootScope', '$q', function($rootScope, $q) {
      return {
        requestError: function requestError(rejection) {
          $rootScope.error('Sorry, there was an error.');
          return $q.reject(rejection);
        },
        responseError: function responseError(rejection) {
          var errorCode = null;
          var loginAction = {
            title: 'Login',
            callback: function() {
              $rootScope.toRoute('login', {
                returnRte: 'home'
              });
            }
          };

          // handle authentication errors
          if (rejection.status === 401) {

            if (rejection.data) {
              try {
                errorCode = rejection.data.originalError.data.errors[0].errorCode;
                errorCode = errorCode.toString();
              } catch (ex) {
                if (ex instanceof TypeError) {
                  try {
                    // some responses may have multiple errors -- for example profileAggregation
                    errorCode = rejection.data.errors[0].body.originalError.data.errors[0].errorCode;
                  } catch (ex) {
                    console.error('could not retrieve errorCode');
                    return $q.reject(rejection);
                  }
                } else {
                  return $q.reject(rejection);
                }
              }
            }

            // username/password incorrect
            if (_.contains(['2010', '2030', '2120'], errorCode)) {
              return $q.reject(rejection);
            }

            // loginid in use by another user
            if (errorCode === 'CMN1039E') {
              $rootScope.removeSession(); // it appears we can't re-use the users wctoken in this scenario, so just delete it
              $rootScope.error('An invalid cookie was received for the user, your logonId may be in use by another user. Please sign in again.', loginAction);
            }

            // WCToken expired
            if (errorCode === '1012') {
              $rootScope.removeSession();
              $rootScope.error('Your session has expired. Please sign in again.', loginAction);
            }

          } else if ([-1, 404, 500, 502, 503, 401, 400, 302, 301].indexOf(rejection.status) < 0) {
            $rootScope.error('Sorry, there was an error.');
          }

          return $q.reject(rejection);
        }
      };
    }])
    .config(['$httpProvider', function($httpProvider) {

      // Intercept HTTP request errors
      $httpProvider.interceptors.push('errorHttpInterceptor');

      // Intercept HTTP requests to adjust baseHref
      $httpProvider.interceptors.push('baseHttpInterceptor');

    }]);

  // create stplsRouter with provider for ui.router
  // enables us to set routes in isomorphic prerender
  angular.module('stplsRouter', ['ui.router'])
    .provider('stplsRouter', ['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

      var registry = {
        routes: [],
        rewrites: {}
      };

      var addRoutes = function(routes, rewrites) {
        for (var r in routes) {
          $stateProvider.state(r, routes[r]);
          registry.routes.push(routes[r]);
        }
        addRewrites(rewrites);
      };

      var addRewrites = function(rewrites) {
        angular.extend(registry.rewrites, rewrites || {});
      };

      var checkRewrites = function(path) {
        for (var p in registry.rewrites) {
          try {
            var exp = new RegExp(p);
            if (exp.test(path)) {
              return path.replace(exp, registry.rewrites[p]);
            }
          } catch (e) {}
        }
      };

      $urlRouterProvider.rule(function($injector, $location) {
        var path = $location.url();
        return checkRewrites(path);
      });

      // stplsRouterProvider API
      this.addRoutes = addRoutes;
      this.addRewrites = addRewrites;

      //returns stplsRouter for use interchangeably with $state
      this.$get = ['$state', '$stateParams', '$rootScope', '$window', '$location', '$urlMatcherFactory', function($state, $stateParams, $rootScope, $window, $location, $urlMatcherFactory) {
        var router = {};

        var parseQuery = function(url) {
          url = url.indexOf('?') < 0 ? '?' + url : url;
          var query = {};
          var a = url.split('?').slice(1).join('?').split(/[&\?]/);
          for (var i = 0; i < a.length; i++) {
            var b = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
          }
          return query;
        };

        var matcher = function(href, params) {
          var _href = href; //original
          href = href.replace(/^https?\:\/\/www\.[\w\.-]+/, ''); // remove FQDN (desktop)
          href = checkRewrites(href) || href;

          var match, route, tree = {};
          for (var i=0; i<registry.routes.length; i++) {
            var r = registry.routes[i];
            if (!match) {
              var prefix = '';
              if (r.state && r.state.indexOf('.')) {
                var pstate = r.state.split('.').slice(0, -1).join('.');
                if (tree[pstate]) {
                  prefix = tree[pstate].split('?').shift();
                }
              }
              var urlMatcher = r.url && $urlMatcherFactory.compile(prefix + r.url);
              if (urlMatcher) {
                match = urlMatcher.exec(href, params || {}) ||
                  urlMatcher.exec(href.split('?').shift(), params || {});
                route = r;
                if (match) {
                  var q;
                  for (var k in match) {
                    var parts = (match[k] || '').split('?');
                    match[k] = parts.shift();
                    if (!q && parts.length) {
                      q = parts.pop();
                    }
                  }
                  if (q) {
                    angular.extend(match, parseQuery(q));
                  }
                  break;
                } else {
                  tree[r.state] = r.url;
                }
              }
            }
          }

          if (match && route) {
            // console.log(match, route);
            return {
              route: route.state,
              params: match
            };
          } else {
            return _href;
          }
        };

        //map methods from $state
        angular.forEach(Object.keys($state), function(m) {
          var mm = $state[m];
          if (typeof mm === 'function') {
            router[m] = mm;
          }
        });

        var slashEncoding = /%(25)?2F/g,
          colonEncoding = /%(25)?3A/g;

        router.href = function() {
          var href = $state.href.apply(router, arguments);
          return href.replace(slashEncoding, '/')
            .replace(colonEncoding, ':');
        };

        angular.extend(router, {
          addRoutes: addRoutes,
          addRewrites: addRewrites,
          match: matcher,
          kosherize: function() {
            var uri = $location.path();
            var kosher = uri.replace(slashEncoding, '/')
              .replace(colonEncoding, ':');
            if (uri !== kosher) {
              $location.path(kosher);
              // $location.replace();
            }
          },
          toHref: function(href, params, options) {
            var match = matcher(href, params);
            if (angular.isString(match)) {
              $window.location = href;
            } else if (match && match.route) {
              $state.go(match.route, match.params, options);
            }
          }
        });

        var firstPage = true;
        $rootScope.$state = $state;

        $rootScope.$on('$stateChangeSuccess', router.kosherize);
        $rootScope.$on('$stateChangeStart', function($e, to, params) {
          var forceSSL = to.secure && // route has secure property
            $location.protocol() !== 'https' && // not https
            $window.stpls_env === 'prod' && // prod env
            !$window._isomorphic; // not backend rendering
          if (forceSSL) {
            $e.preventDefault();
            $window.location = 'https://' + $location.host() + $state.href(to, params);
          }

          $state.firstPage = firstPage;
          firstPage = false;
        });

        return router;

      }];
    }])
    // accessory directives
    .directive('stpHref', ['stplsRouter', function(stplsRouter) {
      return {
        restrict: 'A',
        scope: {
          stpHref: '@',
          stpClick: '@'
        },
        link: function($scope, $elem) {
          var href;
          var bind = $scope.stpClick !== 'false';
          if (bind) {
            $elem.on('click', function(e) {
              e.preventDefault();
              if (href) {
                stplsRouter.toHref($scope.stpHref);
              }
              return false;
            });
          }
          $scope.$watch('stpHref', function(l) {
            var match;
            if (l) {
              match = stplsRouter.match(l);
              href = (match && match.route && stplsRouter.href(match.route, match.params, {
                inherit: false
              })) || match;
            } else {
              href = null;
            }

            if (href) {
              $elem.attr('href', href)
                .attr('route', (match && match.route));
            } else {
              $elem.removeAttr('href');
            }
          });
        }
      };
    }])
    .config(['stplsRouterProvider', '$urlRouterProvider', '$locationProvider', function(stplsRouterProvider, $urlRouterProvider, $locationProvider) {

      /**
             * deprecate Asgard routing for now
            var addStates = function(c) {
                for (var r in c.routes) {
                    var cR = window.stpls_locale.routes[r];
                    if (cR !== undefined && cR.internalActive === true) {

                        // load state if internal active / disabled asgard for locale
                        if (cR && cR.internalActive === true && (cR.asgardActive === false || cR.asgardActive === undefined)) {
                            $stateProvider.state(r, {
                                url: c.routes[r].url,
                                views: c.routes[r].views,
                                params: c.routes[r].params
                            });
                        }
                        // load state if internal active / asgard for locale
                        else if (cR.asgardActive !== undefined && cR.asgardActive === true) {

                            console.log('asgard route active ', cR);

                            $stateProvider.state(r, {
                                url: c.routes[r].url,
                                views: {
                                    'content@': {
                                        'controller': 'AsgardContainerCtrl',
                                        'templateUrl': 'modules/asgardContainer/views/container.html'
                                    }
                                }
                            });
                        }
                }
            };
          }*/

      if (window.stpls_global !== undefined) {
        stplsRouterProvider.addRoutes(window.stpls_global.routes);
        stplsRouterProvider.addRewrites(window.stpls_global.rewrites);
      }

      if (window.stpls_locale !== undefined) {
        $urlRouterProvider.otherwise(window.stpls_locale.defaultRoute);
      }

      // set HTML5 mode
      $locationProvider.html5Mode(true);

    }]);
})(window, window.angular);
