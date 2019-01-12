'use strict';

/**
 * @ngdoc function
 * @name stpls.model:EZReorder
 */
angular.module ('stpls').factory ('EZReorder', function ($q, MobileService, ClassSearch) {

    var getResultsFromRemote = function (params, limit, page, sortBy, filters) {
        var d = $q.defer ();

        MobileService.request ({
            method: 'GET',
            url: '/order/history/frequency',
            cache: false,
            params: {
                offset: page,
                limit: limit,
                sortOrder: sortBy
            }
        }).then (function (response) {
            var reorders = response.data;
            formatResults(reorders, d, limit);
        }, function (error) {
            noResults(d);
        });
        return d.promise;
    };

    var getResults = function(params, limit, page, sortBy, filters) {
        var d = $q.defer ();
        var r = getResultsFromRemote(params, limit, page, sortBy, filters);

        r.then(function(remoteResult) {
            d.resolve(remoteResult);
        }, function(error) {
            d.reject('Error retrieving results.');
        });

        return d.promise;

    };

    var formatResults = function(r, d, limit) {
        if (r && r.Order) {
            var total = r.recordSetTotal;

            var results = {
                results: r.Order[0].product,
                result_count: total,
                page_count: Math.ceil(total / (limit || 1)),
                term_suggest: false
            };

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
        getResultsFromRemote: getResultsFromRemote,
        getResults : getResults
    };

});

