'use strict';

angular.module('stplsSprocket', ['angular-cache', 'stplsRouter', 'stplsConfig'])
  .factory('Sprocket', function($window, $location, $rootScope, $http, $q, $sce, $state, stplsRouter, $angularCacheFactory, SprocketHub, Config) {

    //simple memory cache object for sprocket data
    var sprktCache = $angularCacheFactory('stpls.sprkt', {
      capacity: 10,
      maxAge: 3e5, // 5 min
      storageMode: 'localStorage',
      storagePrefix: 'sprkt.'
    });

    var sprocketUrl = function(uri) {
      //fallback to self if no URI
      return decodeURIComponent(uri || $location.path());
    };

    //calls current location with the expected ?sprocket=true param for JSON
    var getPage = function(uri) {
      var d = $q.defer();
      var url = sprocketUrl(uri);
      var alias = $state.current.name;
      var preload = getContent(alias);
      if (preload) {
        delete $window.sprocketData[alias]; //not for reuse
      }
      var data = sprktCache.get(url) || preload;
      if (data) {
        sprktCache.put(url, data);
        d.resolve(data);
      } else {
        $http.get(url, {
          params: {
            sprocket: true,
          }
        }).then(function(response) {
          var data = response.data;
          if (data && data.body) {
            sprktCache.put(url, data);
            d.resolve(data);
          } else {
            d.reject();
          }
        }, function(err) {
          d.reject(err);
        });
      }

      return d.promise;
    };

    var getContent = function(key) {
      return $window.sprocketData && $window.sprocketData[key];
    };

    var trust = function($html) {
      return $sce.trustAsHtml($html);
    };

    // sequential script processor
    var addScripts = function(scripts, $element) {
      var attrs = scripts.shift();
      if (attrs) {
        var script = angular.element('<script />');
        var text = attrs.text;
        if (text) {
          script.text(text);
          delete attrs.text;
        }
        script.attr(attrs);
        var s = script[0];

        s.onload = s.onerror = (function() {
          var m = text ? 'call' : 'bind';
          return addScripts[m](this, scripts, $element);
        })();

        $element[0].appendChild(s);
      }
    };

    // check route exceptions for content injection
    $rootScope.$on('$stateChangeStart', function($event, to, params) {
      // check exclusion before ajax
      if (to.sprocket && !$window._isomorphic) {
        var routeConf = Config.getProperty('routes')[to.name] || {};
        var excludes = (routeConf.sprocket || {}).exclusions;
        excludes = (Array.isArray(excludes) && excludes) || (excludes && [excludes]) || [];
        var url = stplsRouter.href(to, params);
        try {
          for (var i=0; i<excludes.length; i++) {
            var exclude = new RegExp(excludes[i]).test(url);
            if (exclude) {
              var fqUrl = 'http://' + $location.host() + url;
              $window.open(fqUrl);
              $event.preventDefault();
              return false;
            }
          }
        } catch (e) { }
      }
    });

    return {
      getPage: getPage,
      getUrl: sprocketUrl,
      getContent: getContent,
      addScripts: addScripts,
      trust: trust,
      //access hub service
      hub: SprocketHub
    };

  })

//expose factory for submodules
.factory('SprocketHub', function() {
  //TODO: support $ocLazyLoadProvider
  var prefix = function(action) {
    return 'sprkt.' + action;
  };

  return {
    events: {
      link: 'link',
      coupon: 'coupon'
    },
    listen: function($scope, action, cb) {
      $scope.$on(prefix(action), cb);
      return this;
    },
    dispatch: function($scope, action, data) {
      $scope.$emit(prefix(action), data);
      return this;
    }
  };
});
