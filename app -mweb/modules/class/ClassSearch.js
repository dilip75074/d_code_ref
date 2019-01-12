'use strict';

/**
 * @ngdoc function
 * @name stpls.model:ClassSearch
 */
angular.module('stpls').factory('ClassSearch', function($http, $q, $resource, $angularCacheFactory, MobileService, Analytics, Account, Config, ShippingConfig, Product, InsideChat) {


    var searchCache = $angularCacheFactory('stpls.search', {
        capacity: 10,
        maxAge: 180000, // 5 min
        storageMode: 'localStorage',
        storagePrefix: 'stpls.'
    });

    var requestLimit = 100;

    var getResults = function(search, limit, page, sortBy, filters, facets) {

        var d = $q.defer();


        var cacheID = [(search.term != undefined ? search.term : search.identifier), sortBy].join('|');

        // Check if result is cached
        var cached = searchCache.get(cacheID);

        // If no offset or filters & cache is found
        if (page === 1 && !filters && !facets && cached) {

            d.resolve(cached);

        } else {

            var r = getResultsFromRemote(search, limit, page, sortBy, filters, facets);

            r.then(function(remoteResult) {
                d.resolve(remoteResult);

                // If no offset or filters
                if (page === 1 && !filters) {
                    searchCache.put(cacheID, remoteResult);
                }


            }, function() {

                d.reject('Error retrieving results.');

            });

        }

        return d.promise;


    };


    var getResultsFromRemote = function(search, limit, page, sortBy, filters, facets) {

        console.log('Remote limit:' + limit + ' page:' + page);
        var nothingFound = {
            results: false,
            result_count: 0,
            page_count: 0
        };

        var d = $q.defer();

        if (search.term != undefined) {

            //  Some filter ids are now alpha-numeric and contain &quot which we need to convert to double-quote.
            var filterstring = filters.join('|').replace(/&quot;/g,'"');

            MobileService.request({
                method: 'GET',
                url: '/search',
                cache: true,
                params: {
                    term: search.term,
                    page: page,
                    limit: limit,
                    zipCode: Account.getZipCode(),
                    catalogId: Config.getProperty('catalogId') || '10051',
                    sort: getSortByKey(sortBy),
                    filterId: filterstring
                }
            }).then(function(response) {

                var r = response.data.results[0];

                // If found results
                if (r != undefined) {

                    var result = {
                        results: r.products,
                        result_count: parseInt(r.totalItems),
                        page_count: parseInt(r.totalPages),
                        term_suggest: (r.autoSuggest == undefined ? false : r.autoSuggest),
                        filters: r.filters
                    };

                    setSkuTags(result);

                    InsideChat.trackerSearch (search.term, r.products.length > 0);
                    d.resolve(result);

                    Analytics.captureDLO(Analytics.DLO.search, {
                      term: search.term,
                      numResults: r.totalItems,
                      sortBy: sortBy,
                      pagination: page,
                      display: 'list',
                      recperpage: limit,
                      autocorrect: r.autoSuggest,
                      searchinterface: 'partialmatch',
                      //dyam: '',
                      //bizrules: '',
                    });
                    Analytics.captureDLO(Analytics.DLO.filter, r.filters, filters, facets);

                } else {
                    InsideChat.trackerSearch (search.term, false);

                    d.resolve(nothingFound);
                }

            }, function () {
                InsideChat.trackerSearch (search.term, false);

                d.resolve(nothingFound);
            });


            addRecentKeyword(search.term);




        } else if (search.identifier != undefined) {

            console.log('category page', page);
            var url = (isCategory(search.identifier) ? '/categoryPromo/' : '/category/') +  search.identifier;

            MobileService.request({
                method: 'GET',
                url: url,
                cache: true,
                params: {
                    offset: page,
                    limit: limit,
                    catalogId: Config.getProperty('catalogId') || '10051',
                    zipCode: Account.getZipCode(),
                    sort: getSortByKey(sortBy),
                    facetHashList: facets.join(''),
                    filterList: filters.join('|'),
                    pumiceEnabled: filters.length > 0 ? false : true,
                    tName: 'products'
                }
            }).then(function(response) {

                var result = response.data;
                var r = result.results[0];

                var products;

                // If found results
                if (r != undefined) {

                   if (r.promoCategories) {
                        // category is a bundle 'BIxxxxx'
                        // extract products - flatten promo categories
                        products = _.reduce(r.promoCategories, function(result, n) {
                            Array.prototype.push.apply(result, n.products);
                             return result;
                        }, []);
                        result.totalCount = products.length.toString();

                    } else {
                        // normal category
                        products = r.products;
                    }

                    var name = (function() {
                      var obj = (r.desc || []).filter(function(item) {
                        return !item.name || // SC|CG|CL|DP
                          (/headliner/i).test(item.name); // BI (name: "Promo Headliner")
                      }).slice().shift();
                      return (obj || {}).text;
                    })();

                    var info = (function() {
                      if (r.info && r.info.length) {// SC|CG|CL|DP
                        return (r.info.slice().shift() || {}).text;
                      } else { //BI
                        var obj = (r.desc || []).filter(function(item) {
                          return (/message/i).test(item.name); // BI (name: "Promo Message")
                        }).slice().shift();
                        return (obj || {}).text;
                      }
                    })();

                    var results = {
                        name: name,
                        info: info,
                        results: products,
                        result_count: parseInt(result.totalCount),
                        page_count: Math.ceil(result.totalCount / limit),
                        term_suggest: false,
                        seoContent: r.seoContent,
                        filters: r.filters,
                        analytics: r.analytics || {}
                    };

                    setSkuTags(results);

                    // Category page image
                    if (r.resource && r.resource.category) {
                        results.subCategories = getSubCategories(r.resource.category);
                        results.categoryTitle = r.resource.title;
                    }

                    var parentCat = '';
                    var cat = '';
                    if (r.analytics) {
                        parentCat = r.analytics.scName;
                        cat = r.analytics.clName || r.analytics.cgName || r.analytics.dpName || r.identifier;
                    } else {
                        cat = r.identifier;
                    }
                    InsideChat.trackerCategory (cat, parentCat, '', r.analytics || undefined);

                    d.resolve(results);


                    Analytics.captureDLO(Analytics.DLO.search, {
                        numResults: result.totalCount,
                        pagination: page,
                        recperpage: limit
                    });

                    Analytics.captureDLO(Analytics.DLO.browse, r.identifier, (r.analytic || []).slice().shift() || r.analytics);
                    Analytics.captureDLO(Analytics.DLO.filter, r.filters, filters, facets);
                } else {
                    InsideChat.trackerCategory (cat, parentCat, '', undefined);

                    d.resolve(nothingFound);
                }
            }, function() {
                InsideChat.trackerCategory (search.identifier, '', '', undefined);

                d.resolve(nothingFound);
            });

        }

        return d.promise;


    };


    var getEnabledFilters = function(filters) {

        var enabled = [];

        if (filters != null) {

            angular.forEach(filters, function(filter_group) {

                angular.forEach(filter_group.details, function(filter) {

                    if (filter.active) {

                        enabled.push(filter.id);

                    }

                });


            });

            return enabled.join('|');


        } else {
            return null;
        }

    };


    var getSortByKey = function(sortBy) {

        var key = 0;

        switch (sortBy) {

            case 'best_match':
                key = 0;
                break;
            case 'price_l':
                key = 1;
                break;
            case 'price_h':
                key = 2;
                break;
            case 'name_a':
                key = 3;
                break;
            case 'name_d':
                key = 4;
                break;
            case 'top_rated':
                key = 5;
                break;

        }
        return key;
    };


    var addRecentKeyword = function(keyword) {

        try {

            var k = localStorage.getItem('stpls.recent_keywords');

            if (k != null) {
                var keywords = JSON.parse(k);
            } else {
                var keywords = [];
            }


            if (keywords.indexOf(keyword) == -1) {

                if (keywords != null && keywords.length > 10) {

                    keywords = keywords.splice(keywords.length - 9, keywords.length);

                }

                keywords.push(keyword);


            }





            localStorage.setItem('stpls.recent_keywords', JSON.stringify(keywords));


        } catch (e) {

            return false;

        }



    };

    var getRecentKeywords = function() {

        try {

            var keywords = localStorage.getItem('stpls.recent_keywords');

            if (keywords != null) {
                return JSON.parse(keywords);
            } else {
                return [];
            }

        } catch (e) {

            return [];

        }

    };

    var getKeywordsForTerm = function(input) {

        return MobileService.request({
            method: 'GET',
            url: '/sbd/' + input,
            cache: true
        }).then(function(response) {

            return response.data;

        });


    };

    var setSkuTags = function(result) {

  		angular.forEach(result.results, function(product) {
            //skuset types
            if((/^SS/).test(product.sku || '')){
                product.skuSetType = true;
            }
            Product.setSkuTags(product);
  		});
  	};

    var isCategory = function(id) {
        return /^(CG|DP|SC)/i.test(id);
    };

    var isSubCategory = function(id) {
        return /^(CG|DP|SC|CL)/i.test(id);
    };

    var getSubCategories = function (categrories) {
        var subCategories = [];
        angular.forEach(categrories, function(subCategrory) {
            var valid = isSubCategory(subCategrory.id);

            subCategories.push({
                id: subCategrory.id,
                image: subCategrory.image,
                desc: subCategrory.desc,
                valid: valid
            });
        });

        return subCategories;
    };

    var kosherTerm = function(term) {
      return term && term.trim().replace(/\s+/g,'+');
    };

    return {
        kosherTerm: kosherTerm,
        getResults: getResults,
        setSkuTags: setSkuTags,

        isCategory: isCategory,

        getResultsFromRemote: getResultsFromRemote,

        addRecentKeyword: addRecentKeyword,
        getRecentKeywords: getRecentKeywords,

        getKeywordsForTerm: getKeywordsForTerm
    };

});
