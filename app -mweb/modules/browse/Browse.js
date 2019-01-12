'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Browse
 */
angular.module('stpls').factory('Browse', function($rootScope, $q, $angularCacheFactory, MobileService, Account, Config) {

	var categoryCache = $angularCacheFactory('stpls.category', {
		capacity: 50,
		maxAge: 1800000, // 30 min
		storageMode: 'localStorage',
		deleteOnExpire: 'aggressive',
		storagePrefix: 'stpls.'
	});

	var getTopCategoryFromRemote = function(identifier, parentID) {

		var d = $q.defer();

		MobileService.request({
			method : 'GET',
			url : '/category/top/',
			cache: true,
			params : {
				zip: Account.getZipCode(),
				limit: 100,
				parent: parentID,
				child: identifier
			}
		}).then(function(response) {
		            var cat = {
                sub: []
            };

            if (parentID) {

                if (! identifier) {
                    // parent but no child
                    cat.sub = getSubs(findSubsForID(parentID, response.data.results[0]));
                } else {
                    // parent and child
                    cat.sub = getSubs(findSubsForID(identifier, response.data.results[0]));
                }

            } else {
                // no parentId nor childid (top level)
                cat.sub = getSubs(response.data.results);
            }

            d.resolve(cat);

		}, function(error) {

			d.reject(error);

		});

		return d.promise;

	};


	var getChildCategoryFromRemote = function(identifier){

		var d = $q.defer();

		MobileService.request({
			method : 'GET',
			url : '/category/' + identifier,
			cache: true,
			params : {
				zipCode: Account.getZipCode(),
				catalogId: Config.getProperty('catalogId') || '10051',
				limit: 100
			}
		}).then(function(response){

            var cat = {
                sub: []
            };

            cat.sub = getSubs(findSubsForID(identifier, response.data.results[0]));

            d.resolve(cat);

		}, function(error){

			d.reject(error);

		});

		return d.promise;

	};

    function getSubs(subs) {

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

    }

    function findSubsForID(identifier, s){

        if(s.identifier === identifier){
            return s.subCategories;
        } else {

            var sub = false;

            if(s.subCategories.length === 1){

                sub = s.subCategories[0].subCategories;

            } else {
                s.subCategories.each(function(subS){
                    sub = findSubsForID(identifier, subS);
                });
            }
            return sub;
        }
    }


	var getCategoryFromRemote = function(identifier, parentID, isTop){

		if (identifier === 'DP100') {
			isTop = false;
		}

		if (isTop) {

			return getTopCategoryFromRemote(identifier, parentID);

		} else {

			return getChildCategoryFromRemote(identifier, parentID);

		}

	};


	var getCategory = function(ID, parentID, isTop) {

		var d = $q.defer();

		var cacheKey = ID.toString() + '|' + parentID.toString();

		if (categoryCache.get(cacheKey) !== undefined) {

			d.resolve(categoryCache.get(cacheKey));

		} else {

			getCategoryFromRemote(ID, parentID, isTop).then(function(data) {
			    // disabled caching for now as it seems to cause some bugs - Evan
                //categoryCache.put(cacheKey, data);
				d.resolve(data);
			}, function() {
				d.reject();
			});

		}

		return d.promise;

	};


	return {
		getCategory: getCategory
	};

});
