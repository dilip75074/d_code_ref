(function(window, angular, undefined) {
  'use strict';
  // var Conveyor = function(ctx){
  //   this.ctx = ctx;
  // };
  //
  // Conveyor.prototype.getTopHat

  angular.module('stplsConveyor', ['stplsConfig', 'stplsRouter'])
    .factory('Conveyor', ['$q', '$compile', '$window', '$http', '$rootScope', 'Config', function($q, $compile, $window, $http, $rootScope, Config) {

      // access point for isomorphic
      var local;

      var set = function(c) {
        $window.conveyorData = (c || $window.conveyorData);
        local = angular.copy($window.conveyorData);
        $rootScope.cvyr = getCtx();
      };

      var reset = function() {
        set(null);
      };

      var get = function() {
        return local || {};
      };

      var getCtx = function() {
        return (get().ctx || {}).data || {};
      };

      var getPageCtx = function(forPage) {
        return (getCtx().pages || {})[forPage];
      };

      var setTophat = function(tophat) {
        (getCtx().widgets || {}).tophat = tophat;
      };

      var getTemplate = function(slug) {
        var d = $q.defer();
        if (slug) {
          slug = slug.replace(/\.[\w]+$/i, '');
          if (local && local[slug]) {
            d.resolve(local[slug]);
          } else {
            $http.get('/conveyor/template/' + slug).then(function(response) {
              var template = response.data;
              if (template && template.layout) {
                d.resolve(template);
                // keep it around
                ($window.conveyorData || {})[slug] = template;
              } else {
                d.reject(response);
              }
            }, function(err) {
              d.reject(err);
            });
          }
        } else {
          d.reject();
        }
        return d.promise;
      };

      var getRouteContent = function(identifier) {
        var widget = (getCtx().widgets || {}).routeContent;
        var slug = null;
        if (widget && identifier) {
          var content = (widget.config && widget.config.content);
          if (content) {
            angular.forEach(content, function(assoc) {
              if (!slug && assoc.identifier === identifier) {
                slug = assoc.template;
              }
            });
          }
        }
        return getTemplate(slug);
      };

      $rootScope.$on('$stateChangeStart', reset);

      set();

      return {
        set: set,
        getCtx: getCtx,
        getPageCtx: getPageCtx,
        setTophat: setTophat,
        getTemplate: getTemplate,
        getRouteContent: getRouteContent
      };
    }]);

})(window, window.angular);
