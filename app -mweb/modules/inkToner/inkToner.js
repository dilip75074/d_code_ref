'use strict';

/**
 * @ngdoc function
 * @name stpls.model:inkToner
 */
angular.module('stpls')
.constant('inkTonerIdentifier', 'SC43')
.factory('inkToner', function($http, $q, MobileService, Account, inkTonerIdentifier) {

    var getBrowseCat = function() {
        return MobileService.request({
            method: 'GET',
            url: '/category/' + inkTonerIdentifier,
            cache: true,
            params: {
                catalogId: '10051',
                zipCode: Account.getZipCode(),
                formatResponse: 'true',
                limit: 100,
                parent: '-939117180'
            }

        }).then(function(response) {
            var results = response.data.results[0].subCategories;
            angular.forEach(results, function(cat) {
                if (cat.desc[0].name.indexOf ('/') >= 0) {
                    cat.desc[0].name = cat.desc[0].name.replace ('/', '-');
                }
            });

            return results;
        });
    };

    var getBrowseDetails = function(id){

        var d = $q.defer();

        MobileService.request({
            method : 'GET',
            url : '/category/' + id,
            cache: true,
            params : {
                zipCode: Account.getZipCode(),
                catalogId: '10051',
                limit: 100
            }
        }).then(function(response) {

            var cat = { sub: [] };
            cat.sub = getSubs(findSubsForID(id, response.data.results[0]));
            d.resolve(cat.sub);

        }, function(error){
            d.reject(error);
        });

        return d.promise;
    };

    var getSubs = function(subs) {
        if (subs === undefined) {
            $rootScope.error('An error occurred while processing your request. Please try again.');
            return [];
        }

        var catSubs = [], name = '';
        subs.forEach(function(sub) {

            if (sub.desc[0].text !== undefined) {
                name = sub.desc[0].text;
            } else {
                name = sub.desc[0].name;
            }
            //  Slash in name causes issues in html
            name = name.replace ('/', '-');
            catSubs.push({
                title: name,
                identifier: sub.identifier,
                calloutUrl: sub.calloutUrl || null,
                isTop: (sub.childCount !== '0' && sub.childCount !== undefined),
                collapsed: true,
                isFirst: _.includes(['-329288291','1443853438','314138924','-939117180'], sub.identifier) // these are subject to change
            });
        });

        return catSubs;
    };

    var findSubsForID = function(identifier, s) {
        if (s.identifier === identifier){
            return s.subCategories;

        } else {
            var sub = false;
            if (s.subCategories.length === 1) {
                sub = s.subCategories[0].subCategories;
            } else {
                s.subCategories.each(function(subS) {
                    sub = findSubsForID(identifier, subS);
                });
            }
            return sub;
        }
    };

    return {
        getBrowseCat: getBrowseCat,
        getBrowseDetails: getBrowseDetails
    };

});
