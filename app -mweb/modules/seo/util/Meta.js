'use strict';

angular.module('seo.meta', ['stplsRouter', 'stplsConfig'])
  .run(['$rootScope', '$window', function($rootScope, $window) {
    // Set initial seo meta for bootstrap
    $rootScope.seo = angular.copy(($window.seoPreload || {
      name: false
    }));
    delete $window.seoPreload;

  }])
  .factory('SeoMeta', ['$rootScope', '$window', '$location', '$state', 'Config', function($rootScope, $window, $location, $state, Config) {

    return {
      init: function() {
        // handle SPA navigation updates
        $rootScope.$on('$stateChangeStart', function($event, toState, toParams, fromState) {
          if (fromState && !fromState.abstract && fromState.url !== '^') {
            if ($rootScope.seo.name) {
              $rootScope.seo = {};
            }
          }
        });

        // watch for changes in title, for seo processing
        // TODO: move to standalone stplsSeo service
        $rootScope.$watch('seo.name', function(name) {
          var meta = Config.getSeo();
          var props = $rootScope.seo || {};

          var statename = $state.current.name;
          var descPrefix = 'description_';

          var desc = props.description || meta[descPrefix + statename] || meta[descPrefix + statename.split('.').shift()] || meta.description;
          var canonical = (props.canonical ? ((/^http/).test(props.canonical) ? props.canonical : meta.canonicalDomain + props.canonical) : '');
          var route = $window.stpls_global.routes[$state.current.name] || {};
          var title;
          if (props.pagetitle) {
            title = props.pagetitle;
          } else if (name === null) {
            title = '';
          } else {
            var newName = (name || meta.title).split('|').shift().trim();
            title = [newName, meta.staples].join(' | ');
          }

          $rootScope.seo = {
            name: name, //prevents recursive watch trigger
            title: title,
            description: desc.replace('{{name}}', name),
            robots: props.robots || route.robots || 'noindex, nofollow',
            canonical: canonical,
            prev: props.prev,
            next: props.next,
            og: {
              siteName: meta.siteName,
              type: props.ogType || 'website',
              title: title.replace(/<(.|\n)*?>/g, '').replace(/['"]/g, ''),
              fbAppId: meta.fbAppId,
              // url: 'http://' + $location.host() +
              //   (props.canonical || props.ogUrl || $location.path()).replace(/^https?\:\/\/[\w\.-]+/, '') +
              //   (meta.ogTracking || ''),
              image: (props.image || meta.ogImage || '').replace(/^\/\//, 'http://')
            }
          };
        });
      }
    };
  }]);
