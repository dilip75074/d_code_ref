'use strict';

angular.module('stplsFilters', [])
  // scene7 image filters
  .filter('s7Image', function() {
    var preferredDomain = '//www.staples-3p.com/s7';
    var s7Path = '/is/image/Staples/';
    return function(img, preset) {
      if (img && img.indexOf(s7Path) > -1) {
        img = preferredDomain + s7Path + img.split(s7Path).pop();
        if (preset) {
          var p = '$' + preset + '$';
          img = img.replace(/\?$/, '').replace(/\$[\w\s-]+\$/, p);
          if (img.indexOf(p) < 0) {
            img += (~img.indexOf('?') ? '&' : '?') + p;
          }
        }
      }
      return img;
    };
  })
  .filter('skuListImage', function($filter) {
    return function(img, preset) {
      preset = preset || 'tile';
      return $filter('s7Image')(img, preset);
    };
  })
  .filter('skuSmall', function($filter) {
    return function(img) {
      return $filter('skuListImage')(img, 'small');
    };
  })
  .filter('bannerImage', function($filter) {
    return function(img) {
      return $filter('s7Image')(img);
    };
  })

  //number filters
  .filter('ratingValue', function() {
    return function(val, max) {
      val = (val && parseFloat(val)) || 0;
      max = (max && parseInt(max)) || 5;
      //rebase the value from factor of ten if formatted such as 30,35,etc
      while (val > max) {
          val /= 10;
      }
      if (val <= 0) {
        val = 0;
      } else {
        val = val.toFixed(1);
      }
      return val;
    };
  })

  //personalization cards filter for phone number
  .filter('formatPhoneNumber', function(){
    return function(phoneNumber) {
        if(phoneNumber){
            return '(' + phoneNumber.slice(0,3) + ') ' + phoneNumber.slice(3,6) + '-' + phoneNumber.slice(6,10);
        }
        else {
            return '';
        }

    }
  });
