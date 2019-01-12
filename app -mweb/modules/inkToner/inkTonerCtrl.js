'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:inkTonerCtrl
 */
angular.module('stpls')
    .controller('inkTonerCtrl', function($scope, $stateParams, $rootScope, $state, $timeout, $interval, $window, inkToner, scroll, ClassSearch, Config, InsideChat) {

        $scope.cats = false;
        $scope.details = false;
        $scope.detailName;
        $scope.searchResults;
        $scope.searched = false;
        $scope.style = 'main';

        var inkTonerFilterValue;

        //  The Ink & Toner Department Filter is different in
        //  QA vs Prod environments
        var MSEnv = Config.getProperty('mobileServiceEnvironment');
        inkTonerFilterValue = Config.getProperty('inktoner_dept_filter')[MSEnv];

        if ($state.current.name === 'inkToner.details') {

            $scope.detailName = $stateParams.name;
            InsideChat.trackerCategory ($scope.detailName, 'Ink & Toner', undefined);

            var q = inkToner.getBrowseDetails($stateParams.id);
            q.then(function(data) {
                $scope.details = data;
                $scope.searchResults = false;
            });
        } else {
            $scope.style =  $stateParams.style;
            //  Get high-level categories
            var p = inkToner.getBrowseCat();
            p.then(function(data) {
                $scope.cats = data;
            });
            InsideChat.trackerArticle('Ink & Toner Search');
        }

        //  Go to the Detail Page
        $scope.goToDetails = function(id, name) {
            //  Details can be more Printer Categories ... or ... a Class.
             if (id.indexOf('CL') === 0) {
                //  this is a class, call the class page
                $rootScope.toRoute('category', {
                    identifier: id,
                    filter: '',
                    termdisplay: name
                });
            } else {
                $rootScope.toRoute('inkToner.details', {id: id, name: name});
             }
        };

        //  Ask for the all the Top-Level
        //  Ink & Toner Categories
        $scope.seeAll = function() {
            $scope.allBrands = !$scope.allBrands;
            $scope.mainPage = !$scope.allBrands;
            $scope.searchResults = false;
            $rootScope.toRoute('inkToner', {style: 'all'});
        };

        //  This is the search when user enters a search value
        $scope.searchByValue = function(searchParam) {
            $scope.searched = false;
            var search = {
                term: searchParam
            };

            //  We are only interested in Ink & Toner "stuff",
            //  so we set the filter to the Ink & Toner
            //  Department filter to limit the search results.
            var filters = [];
            filters.push(inkTonerFilterValue);

            InsideChat.trackerSearch (searchParam);

            var results = ClassSearch.getResults(
                search,
                10, //  Since this is not a pure search, let's limit results to only 10
                1,
                'best_match',
                filters);

            results.then(function(data) {
                $scope.searched = true;
                if (data.results) {
                    $scope.searchResults = data.results;
                    if (data.results.length === 0) {
                        $scope.searchResults = undefined;
                    }
                } else {
                    $scope.searchResults = undefined;
                }
            }, function(error) {
                $scope.searched = true;
                $scope.searchResults = undefined;
            });
        };

        //  When user selects an item from the search results
        //  dropdown, then we take them to the search results
        //  based on that item choice.
        $scope.toSearchByCartridge = function(searchParam) {
            $rootScope.toRoute('search', {
                term: searchParam
            });
        };

    });
