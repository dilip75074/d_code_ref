'use strict';

angular.module('seo.quartz', [])
  .factory('Quartz', [function() {
    /* Interim Quartz Url generator MWINHS-1660 */

    //-----------------------------------------------------------------------------
    //GetSanitizedURLForUS
    //-----------------------------------------------------------------------------
    //Converts the keywords for a giving keyname to a valid US URL
    //
    //Parameters:
    //-----------------------------------------------------------------------------
    //keyname     The full keyname (e.g., CL1234, CG3455, SC78847, DP7887, 123435)
    //keywords    The keywords to use for the sanitized URL
    //-----------------------------------------------------------------------------
    var get = function GetSanitizedURLForUS(keyname, keywords) {
      //Trim leading and trailing spaces from keyname and convert it to uppercase:
      keyname = keyname.trim().toLocaleUpperCase();

      //Sanitize the keywords:
      var sanitized = keywords.trim(); //Trim leading and trailing spaces
      sanitized = sanitized.replace(/\+/g, ''); //remove plus signs
      sanitized = sanitized.replace(/<(.|\n)*?>/ig, ''); //remove HTML tags
      sanitized = sanitized.replace(/&#?[a-z0-9]{2,8};/ig, '-'); //replace HTML escape codes with -
      sanitized = sanitized.replace(/[^A-Za-z0-9]+/g, '-'); //replace non-alphanumerics with -

      //Determine if this is a cat or product and return the complete URL:
      if (['SC', 'CG', 'DP', 'CL', 'BI'].indexOf(keyname.substr(0, 2)) > -1) {
        return '/' + sanitized + '/cat_' + keyname;
      } else {
        return '/' + sanitized + '/product_' + keyname;
      }
    };

    var objectify = function(identifier, name) {
      var full = get(identifier, name);
      return {
        id: identifier,
        uri: full.split('/').slice(0, -1).join('/').replace(/^\//, ''),
        url: full
      };
    };

    var uriComponent = function(identifier, name) {
      return objectify(identifier, name).uri;
    };

    var sku = function(product) {
      var kw = (((product.seodata || {}).attributes || {}).url_keywords || {}).value || product.name;
      if (!product.sku) {
        return {};
      }
      return objectify(product.sku, kw);
    };

    return {
      objectify: objectify,
      uri: uriComponent,
      url: get,
      sku: sku
    };
  }]);
