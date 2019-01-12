'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:HeaderSearchCtrl
 */
angular.module('stplsTemplates').controller('HeaderSearchCtrl', function($scope, $element, $rootScope, $filter, $timeout, $state, $injector) {
  var store_override = false;
  var store = null;
  var recent = null;
  var pageParams = angular.copy($state.params);
  var search;
  var getKeywordMatchInProgress = false;
  var term = '';
  var Locator, ClassSearch;

  var initResults = function() {

    Locator = $injector.get('Locator');
    ClassSearch = $injector.get('ClassSearch');

    term = (pageParams || {}).term || '';
    store = Locator.getRememberedStore();
    recent = ClassSearch.getRecentKeywords().reverse();
    search = $scope.keyword_search = {
      input: term,
      results: false,
      recent: recent,
      currentStore: null, //(store_override ? store_override : store),
      searchStoreEnabled: true,
      isMyStore: (store && store_override)
    };

    if (store_override) {
      store_override = false;
    }
    if (term) {
      getKeywordMatches(term.substring(0,3));
    }
  };

  var getKeywordMatches = function(input) {
    if (getKeywordMatchInProgress) {
      return false;
    }
    getKeywordMatchInProgress = true;
    if (!input.length) {
      search.results = $scope.recent_searches;
    } else if (input.length < 4) {
      var keywords = ClassSearch.getKeywordsForTerm(input);

      keywords.then(function(results) {
        search.results = results;
        tagging();
      }, function() {
        search.results = [];
        search.tagResult = [];
      });
    } else if (search.results) {
      //  After 3 characters, just do a filter of the keyword data
      search.results = $filter('filter')(search.results, input);
      tagging();
    }
    getKeywordMatchInProgress = false;
  };
  var tagging = function() {
    var tagResult = [];
    var reg = new RegExp(search.input, 'i');
    var replaceby = '<b>'+ search.input + '</b>';

    angular.forEach(search.results, function(keyword) {
      var t = keyword.replace(reg, replaceby);

      tagResult.push([t, keyword]);
    });

    search.tagResult = tagResult;
  };

  $scope.inputKeyPress = function(event) {
    var key = event.keyCode;

    getKeywordMatches(search.input);
  };

  $scope.searchSubmit = function($event) {
    $event.preventDefault();

    return false;
  };

  $scope.directToClassWithTerm = function(t) {
    var t = typeof t == 'undefined' ? search.input : t;

    if (t && t.length > 0) {
      t = ClassSearch.kosherTerm(t);
      $rootScope.toRoute('search', {
        seo: t,
        term: t,
        sort: 'best_match',
        filter: '',
        fids: ''
      }, {
        inherit: false
      });
    }
  };

  $scope.showRecent = function() {

    return search && search.recent && !$scope.showAutocomplete();
  };

  $scope.showAutocomplete = function() {
    return search && search.input && (search.results && search.results.length);
  };

  $timeout(initResults);
});
