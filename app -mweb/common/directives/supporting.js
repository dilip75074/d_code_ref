'use strict';

angular.module('stpls').filter('tel', function ($rootScope) {
    return function (tel) {

        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
});

angular.module('stpls').filter('telCA', function ($rootScope) {
    return function (tel) {

        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '.' + number.slice(3);

        return (country + " " + city + "." + number).trim();
    };
});

angular.module('stpls').service('scroll', function($window){

	return {

		to: function(className){

		  var document = $window.document;

	      if(!className){ //move to top if idOrName is not provided
	        $window.scrollTo(0, 0);
		  }
	      //check if an element can be found with id attribute
	      var el = document.getElementsByClassName(className)[0];
	      if(!el) {//check if an element can be found with name attribute if there is no such id
	        el = document.getElementsByName(className)[0];

	        if(el && el.length)
	          el = el[0];
	        else
	          el = null;
	      }

	      if(el) { //if an element is found, scroll to the element
          el.scrollIntoView({
            behavior: 'smooth'
          });
	      }


		}

	};

});

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
