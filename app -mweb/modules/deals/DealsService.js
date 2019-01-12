'use strict';

angular.module('stpls').factory('DealsService', function($q, $angularCacheFactory, MobileService, Account, ClassSearch, Product) {

    var RANK_HERO = -1,
        RANK_SECONDARY = 1;

    var dealsCache = $angularCacheFactory('stpls.deals', {
        capacity: 10,
        maxAge: 180000, // 5 min
        storageMode: 'localStorage',
        storagePrefix: 'stpls.'
    });

    var getResults = function(params, limit, page, sortBy, filters) {
        var d = $q.defer();

        // Check if result is cached
        var cacheID = [params.identifier].join('|');
        var cached = dealsCache.get(cacheID);
        var cacheable = page === 1 && !filters;

        // If no offset or filters & cache is found
        if (cacheable && cached) {
            d.resolve(cached);
        } else {
            getResultsFromRemote(params, limit, page, sortBy, filters).then(function(remoteResult) {

                setSkuTags(remoteResult);
                d.resolve(remoteResult);

                if (cacheable) {
                    dealsCache.put(cacheID, remoteResult);
                }
            }, function() {
                d.reject('Error retrieving results.');
            });
        }
        return d.promise;
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

    var getResultsFromRemote = function(params, limit, page, sortBy, filters) {
        return makeRequest(params, limit, page, filters);
    };

    var getInitial = function(params) {
        return makeRequest(params, 1, 1);
    };

    var makeRequest = function(params, limit, page, filters) {
        var d = $q.defer();
        var scat = (filters || []).join(',') || 0;
        MobileService.request({
            method: 'GET',
            url: ['', 'deals', params.identifier].join('/'),
            cache: true,
            params: {
                offset: (limit * (page - 1)),
                limit: limit,
                zipcode: Account.getZipCode(),
                supercategory: scat,
                rank: scat ? RANK_SECONDARY : ''
            }
        }).then(function(response) {
            var r = response.data;
            formatResults(r, d, limit);

        }, function() {
            noResults(d);
        });
        return d.promise;
    };

    var formatResults = function(r, d, limit) {
        if (r && r.categories) {
            // extract data - flatten categories
            var total = 0;
            var hero, filters;
            var products = _.reduce(r.categories, function(result, category) {
                var rank = category.rank;
                total += category.total;

                if (rank === RANK_SECONDARY) {
                    Array.prototype.push.apply(result, category.products);
                    filters = category.superCategoryList || [];
                } else if (rank === RANK_HERO) {
                    hero = (category.products || []).slice().shift();
                }
                return result;
            }, []);

            var results = {
                name: r.promoHeader,
                seoURL: r.seoURL,
                hero: hero,
                results: products,
                result_count: total,
                page_count: Math.ceil(total / (limit || 1)),
                term_suggest: false,
                flags: r.bundleFlags,
                filters: filters
            };
            if (hero) {
              hero.isHero = true;
              results.results.unshift(hero);
            }
            ClassSearch.setSkuTags(results);
            d.resolve(results);
        } else {
            noResults(d);
        }

    };

    var noResults = function(d) {
        d.resolve({
            results: false,
            result_count: 0,
            page_count: 0
        });
    };

    return {
        getResults: getResults,
        getResultsFromRemote: getResultsFromRemote,
        getInitial: getInitial
    };

});
