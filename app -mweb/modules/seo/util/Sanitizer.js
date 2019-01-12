'use strict';

angular.module('seo.sanitizer', [])
  .factory('Sanitizer', [function() {
    
    var uri = function(parts, separator) {
      if (!angular.isArray(parts)) {
        parts = [parts];
      }

      return parts.filter(function(v) {
        return !!v;
      }).map(function(v) {
        return v.trim().toLowerCase()
          .replace(/\+/g, '') //remove plus signs
          .replace(/<(.|\n)*?>/ig, '') //remove HTML tags
          .replace(/&#?[a-z0-9]{2,8};/ig, '-') //replace HTML escape codes with -
          .replace(/\W+/g, '-') //replace non-alphanumerics with -
          .replace(/^\W+|\W+$/g, ''); //trim leading/trailing -
      }).join(separator || '-');
    };

    return {
      uri: uri
    };

  }]);
