'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ClassCtrl
 */

angular.module('stpls').controller('ClassCtrl', function($scope, $rootScope, $state, $sce, $timeout, stplsRouter, ClassSearch, DealsService, Product, $location, Config, Cart, Analytics, hookLogic, Personalization, ShippingConfig, MobileService, EZReorder, Seo, DoubleClick, DefaultStore) {
  var resultCached = false;
  var shippingBits = ShippingConfig.getShippingBitFlags();
  var heroSku, heroCat;
  var firstPage;

  var hookLogicProducts;
  var HLfilters = {};
  var DLOLoc = false;
  var isinkToner = false;
  $scope.hookLogicParams = {};
  $scope.gridView = false;
  $scope.oneHourOnly = false;
  $scope.topPage = true;

  var pageParams = angular.copy($state.params);
  var analytics;
  var triadConstants = $scope.triad = Config.getProperty('triadConstants');

  $scope.onInclude = function(s) {
    $scope.$watchCollection(function(){
      return s;
    }, function(stuff) {
      var s = angular.copy(stuff);
      if(s && s.identifier) {
        //handle env-based identifier in conveyor
        if (angular.isObject(s.identifier)) {
          s.identifier = s.identifier[window.stpls_env] ||
            s.identifier.default ||
            s.identifier.preview;
        }
      }
      angular.extend(pageParams, s);
      initResults();
    });

  };

  $scope.toggleView = function() {
    $scope.gridView = !$scope.gridView ? true : false;
  };

   $scope.toggleOneHourOnly = function() {
    $scope.oneHourOnly = !$scope.oneHourOnly ? true : false;

    var activeFilters = [];
    angular.forEach($scope.search_filters, function(filter_group) {
      if(filter_group.name == 'In Store Availability')
      {
        angular.forEach(filter_group.details, function(filter) {

          if(filter.name == "Pick up in store") {
              filter.active = true;
              filter.facet = !filter.facet;

              if(filter.facet){
                  activeFilters.push(filter.id);
              }
          }
        });
      }
    });

    if (activeFilters.length > 0) {
        $scope.search_filters_enabled.push(activeFilters);
    }
    $scope.filter_enabled = ($scope.search_filters_enabled.length > 0 );

    performSearch();

    updateSearchResultsWithAdSpots()
  };

  var getPageType = function() {
    return ['search', 'category', 'deals', 'reorders'].filter(function(v) {
      return $state.includes(v) || v === pageParams.format || v === pageParams.type;
    }).shift();
  };

  var getIdentifier = function() {
  	var c = Config.getProperty('deals') || {};
    var key = [ window.stpls_env, 'Identifier' ].join('');
    var identifier = pageParams.identifier || pageParams[key] || c[window.stpls_env] || c.default;
    return identifier;
  };

  var isDD = function() {
    return getPageType() === 'deals';
  };

  var initResults = function() {

    $scope.search = {
      limit: parseInt(pageParams.limit) || 10,
      term: null,
      identifier: null,
      term_suggest: false,
      sort_by: 'best_match', // Default
      page: parseInt(pageParams.page) || 1,
      page_count: null,
      result_count: null
    };

    $scope.loading_next = false;
    $scope.displayTerm = pageParams.header || '';
    $scope.search_results = [];

    $scope.search_filters = [];
    $scope.search_filters_enabled = [];
    $scope.search_facets_enabled = [];
    $scope.search_filter_count = 0;

    $scope.filter_overlay = false;
    $scope.filter_enabled = false;

    $scope.sort_overlay = false;

    $scope.bannerurl = decodeURIComponent(pageParams.bannerurl || '');

    // Process sort by
    if (pageParams.sort) {
      $scope.search.sort_by = pageParams.sort;
    }

    $scope.pageType = getPageType();
    //check if the page is embedded or is the route.
    $scope.embedded = !$state.includes($scope.pageType);
    switch($scope.pageType) {
    case 'search':
      var term = pageParams.term.replace(/\++/g, ' ');
      $scope.search.term = term;
      $scope.displayTerm = term;
      break;
    case 'category':
    case 'deals':
      $scope.search.identifier = getIdentifier();
      break;
    case 'reorders':
      $scope.ezReorder = {error: false};
      // TODO: this doesn't work if user session expires
      if (MobileService.getSessionState() !== 'registered') {
        $rootScope.toRoute('login', { returnRte: 'reorders'});
      }
      $scope.search.sort_by = 'ASC';
      break;
    default:
      //break execution for unknown $scope.pageType
      return;
    }

    $scope.dailydeals = isDD();

    //handle compatability with desktop url scheme
    if (isDD()) {
      var scats = $location.hash().match(/supercategory\=([\d,]+)/);
      if (scats) {
        scats = scats[1].replace(/,/g, '|');
        $state.go('.', { filter: scats}, {notify: false, location: 'replace'});
        pageParams.filter = scats;
      }
    } else {
      firstPage = $state.firstPage;
    }


    // Process filters
    if (pageParams.filter || pageParams.fids) {

      $scope.filter_enabled = true;

      $scope.search_filters_enabled = (pageParams.filter || pageParams.fids || '').split('|');

    }

    if (pageParams.facet) {
      $scope.filter_enabled = true;
      $scope.search_facets_enabled = pageParams.facet.match(/(.{1,5})/g);
    }

    performSearch();

  };



  var buildQuery = function() {

    if ($scope.search.term) {

      return {
        term: $scope.search.term
      };

    } else if ($scope.ezReorder) {
      return { };
    } else {
      return {
        deals: isDD(),
        identifier: getIdentifier()
      };
    }


  };

  var captureHero = function(hero) {
    hero.isHero = true;
    heroSku = hero;
    heroCat = (hero.superCategories || []).slice().shift();
  };

  var performSearch = function() {

    if($scope.$parent) {
      $scope.$parent.overlay_loading = true;
    }

    var params = buildQuery();
    var page = $scope.search.page;
    var filters = $scope.search_filters_enabled;
    $scope.search_filter_count = filters.length +  $scope.search_facets_enabled.length;
    var results = ($scope.ezReorder ? EZReorder : (params.deals ? DealsService : ClassSearch)).getResults(params, $scope.search.limit, page, $scope.search.sort_by, filters, $scope.search_facets_enabled);

    $scope.loaded = false;
    results.then(function(data) {
      $scope.loaded = true;
      $scope.$parent.overlay_loading = false;

      // seo for deals/category
      if (data.name && !$scope.embedded) {
        $scope.displayTerm = data.name;
        $rootScope.seo.name = data.name;
        if ($state.includes('category')) {
          var canonical;
          var seoContent = data.seoContent;
          if (seoContent) {
            var seo = $rootScope.seo;
            canonical = seoContent.canonical;
            seo.description = seoContent.description;
            seo.pagetitle = seoContent.pagetitle;
            seo.robots = seoContent.robots;
            $scope.displayTerm = seoContent.h1 || data.name;
          }
          $rootScope.seo.canonical = canonical || Seo.quartz.url($scope.search.identifier, data.name);
        } else {
          $rootScope.seo.canonical = data.seoURL;
          if(data.flags && data.flags.noIndex) {
            $rootScope.seo.robots = 'noindex, nofollow';
          }
        }
      } else if (data.name && !$scope.displayTerm) {
        $scope.displayTerm = data.name;
      }

      if (data.info) {
        //replace fully-qualified hrefs matching skynet routes.
        data.info = data.info.replace(/(?:href='|")([\w\/:=\?\&\%\.-]+)(?:'|")/ig, function(match, href) {
          var rootRel = href.replace(/^https?\:\/\/[\w\.-]+/, '');
          if (stplsRouter.match(rootRel)) {
            return rootRel;
          }
          return match;
        });
        $scope.info = $sce.trustAsHtml(data.info);
      }

      var sc = (data.analytics || {}).sc;
      if (sc) {
        isinkToner = !!~['SC43', 'SC5123'].indexOf(sc);
      }

      // Category page image
      $scope.subCategories = data.subCategories;

      // bundle flags (DD)
      $scope.flags = data.flags || {};

      if (data.results) {
        var sku = $scope.search.term;
        if (
          //  if search term is a sku, then go to the sku
            !firstPage && sku && data.results && data.results.length > 0 && data.results[0].sku === sku) {
          directToProduct(data.results[0], true);
          return;
        }

        //handle hero case
        if (data.hero) {
          captureHero(data.hero);
        }
        //filter matches hero
        else if(page === 1 && heroSku && heroCat && filters.indexOf(heroCat.id) > -1) {
          data.results.unshift(heroSku);
        }

        if (isDD()) {
          setActiveFilter();
          paddingTile(data.results, 0);
        }

        $scope.search.result_count = data.result_count;
        $scope.search.page_count = data.page_count;
        $scope.search_results = data.results;
        updateSearchResultsWithHLProducts();
        updateSearchResultsWithAdSpots();


        if (!data.hero && data.results.length > $scope.search.limit) {
          $scope.search_results = data.results.splice(0, $scope.search.limit);
          resultCached = data.results;
        } else {
          $scope.search_results = data.results;
        }

        if (!$scope.search_filters.length) {
          $scope.search_filters = data.filters;
          //handle case where a filter is applied to initial DD call (results in no filters or hero)
          if(params.deals && !data.filters.length) {
            DealsService.getInitial(params).then(function(r) {
              $scope.search_filters = r.filters;
              setActiveFilter();
              if (r.hero) {
                captureHero(r.hero);
                if(heroCat && $scope.search_filters_enabled.indexOf(heroCat.id) > -1) {
                  $scope.search_results.unshift(r.hero);
                  paddingTile($scope.search_results, 0);
                }
              }
            });
          }
        }
        $scope.search.term_suggest = data.term_suggest;

        // Set active filters
        if (!params.deals) {
          angular.forEach($scope.search_filters, function(filter_group) {
            angular.forEach(filter_group.details, function(filter) {
              if ($scope.search_filters_enabled.indexOf(filter.id) > -1 || $scope.search_facets_enabled.indexOf(filter.id) > -1) {
                filter.active = true;
              }
            });
          });
        }

      } else {
        $scope.search.result_count = 0;
        if (!firstPage && !$scope.embedded && !$scope.subCategories && ['category', 'deals'].indexOf(getPageType()) > -1) {
          $state.go('notfound', {}, {
            location: 'replace'
          });
      }
      }

      analytics = data.analytics || {}; // Assigning analytics object.

    });
  };

  $scope.loadNextResultsPage = function() {
    if ($scope.loading_next || $scope.search.page_count <= $scope.search.page) {
      return false;

    } else {

      if (resultCached && resultCached.length > 0) {
        $scope.search_results = $scope.search_results.concat(resultCached.splice(0, $scope.search.limit));
        return;
      }

      $scope.search.page++;

      // // update state with page number
      // $state.go('.', {page: $scope.search.page}, {
      //   notify: false, //no controller reload
      //   location: 'replace' //replaces history
      // });

      var max = pageParams.maxPage || 0;
      if(max > 0 && $scope.search.page > max) {
        return;
      }

      var params = buildQuery();
      var results = ($scope.ezReorder ? EZReorder : (params.deals ? DealsService : ClassSearch)).getResultsFromRemote(params, $scope.search.limit, $scope.search.page, $scope.search.sort_by, $scope.search_filters_enabled, $scope.search_facets_enabled);

      $scope.loading_next = true;
      results.then(function(data) {
        if (data.results !== false) {
          $scope.search.result_count = data.result_count;
          $scope.search.page_count = data.page_count;
          $scope.search_results = $scope.search_results.concat(data.results);
          paddingTile($scope.search_results, (data.results || []).length);
          if(pageParams.format!='deals'){
            $rootScope.$broadcast('dataChanged');
          }
        }
      })['finally'](function(){
        // postpone loading state change to later $digest once results paint
        $timeout(function(){
          $scope.loading_next = false;
        }, 200);
      });


    }

  };

  var directToProduct = function(p, replace) {
    // Product.prepopulateSKU(p);
    $rootScope.toRoute('product', {
      sku: p.sku,
      seo: Seo.quartz.sku(p).uri
    }, {
      location: (replace ? 'replace' : true)
    });
  };

  $scope.clickProduct = function(p) {
    //Drop product click Beacons of every HL product shown
    if(p.skuType && p.skuType === 'hookLogic'){
      hookLogic.dropPageBeacon(p.beacon.click,'click');
    }
  };

  $scope.addToCart = function(item) {

    item.cart = 'loading';
    //  Test for Get Started Skus
    if (item.businessService) {
      var validStartedSku;
      if (!Product.getStarted (item)) {
        // V2 search API does not have get started URL, try to get it from Asgard SKU
        Product.getBySKU(item.sku, true).then(function(product) {
          if (Product.getStarted(product)) {
            validStartedSku = true;
          }
        }, function(error){
        })['finally'] (function () {
          if (!validStartedSku) {
            Cart.addToCart (item, false).then (function (response) {
                item.cart = '';
                item.cartMask = true;
                hideAddedToCartOverlay(item);
            }, function(error){
            })['finally'] (function () {
                item.cart = '';
                item.cartMask = true;
                hideAddedToCartOverlay(item);
            });
          }
        });
      }
      return;
    }

    Cart.addToCart (item, false).then (function (response) {
        item.cart = '';
        item.cartMask = true;
        hideAddedToCartOverlay(item);
    }, function(error){
    })['finally'] (function () {
        item.cart = '';
        item.cartMask = true;
        hideAddedToCartOverlay(item);
    });
  };


  var hideAddedToCartOverlay = function(item) {
    setTimeout(function() {
      $scope.$apply(function () {
        item.cartMask = 0;
      });
    }, 2000);
  };

 //SEO considerations
  $scope.$watchCollection(function(){
    return {
      page: $scope.search.page,
      pages: $scope.search.page_count,
      embedded: $scope.embedded,
    };
  },function(p){
    if (!p.embedded) {
      if(p.page > 1) {
        // override robots
        $rootScope.seo.robots = 'noindex, follow';
      }
      $rootScope.seo.prev = p.page > 1 ? $state.href('.', {page: p.page - 1}) : '';
      $rootScope.seo.next = p.page < p.pages ? $state.href('.', {page: p.page + 1}) : '';
    }
  });


  var toggleFilterOverlay = function() {
    $scope.filter_overlay = !$scope.filter_overlay;
  };

  $scope.toggleSortOverlay = function() {
    $scope.sort_overlay = !$scope.sort_overlay;
  };

  $scope.showFilterOverlay = function() {
    angular.forEach($scope.search_filters, function(filter) {
      if (isDD()) {
        filter.activeSav = filter.active;
      } else {
        angular.forEach(filter.details, function(detail) {
          detail.activeSav = detail.active;
        });
      }
    });

    toggleFilterOverlay();

  };

  $scope.cancelFilterOverlay = function() {

    angular.forEach($scope.search_filters, function(filter) {
      angular.forEach(filter.details, function(detail) {
        detail.active = detail.activeSav;
      });
    });

    toggleFilterOverlay();

  };

  $scope.unCheckItem = function(item) {
    item.active = false;
  };

  $scope.toggleFilterOverlayItem = function(num) {


    for (var i = 0; i < $scope.search_filters.length; i++) {

      if (i == num) {
        $scope.search_filters[i].expand = !$scope.search_filters[i].expand;
      } else {
        $scope.search_filters[i].expand = false;
      }

    };

  };


  $scope.applyFilters = function($event) {

    toggleFilterOverlay();

    if ($scope.dailydeals) {
      return $scope.applyDealFilter($event);
    }

    var activeFilters = [];
    var activeFacets = [];

    angular.forEach($scope.search_filters, function(cat) {
      angular.forEach(cat.details, function(item) {
        if (item.active) {
          (item.facet ? activeFacets : activeFilters).push(item.id);
        }
      });
    });

    $scope.search_filters_enabled = activeFilters;
    $scope.search_facets_enabled = activeFacets;
    $scope.filter_enabled = (activeFilters.length > 0 || activeFacets.length > 0);

      applyfilterForHLProducts();
      var q = buildQuery();
      if (q.term) {
        q.term = ClassSearch.kosherTerm(q.term);
      }

      q.filter = q.fids = activeFilters.join('|');

      q.sort = $scope.search.sort_by;

      if (getPageType() === 'category') {
        if (activeFacets.length > 0 ) {
          q.facet = activeFacets.join('');
          $state.go('category.facet', q);
        } else {
          $state.go('category', q);
        }
      } else {
        $state.go('.', q);
      }

  };

  function applyfilterForHLProducts(obj){
    for (var cat in $scope.search_filters) {
      for (var item in $scope.search_filters[cat].details) {
        if ($scope.search_filters[cat].details[item].active) {
          if(HLfilters[$scope.search_filters[cat].name]){
            HLfilters[$scope.search_filters[cat].name] = HLfilters[$scope.search_filters[cat].name] + '|'+ $scope.search_filters[cat].details[item].name;
          }else{
            HLfilters[$scope.search_filters[cat].name] = $scope.search_filters[cat].details[item].name;
          }
        }
      }
    }
    $rootScope.HLfilters = HLfilters
  }

  $scope.backToTop = function() {
    var containerElement = document.getElementsByClassName('page-container')[0];

    $scope.topPage = true;
    containerElement.scrollTop = 0;
  };

  $scope.applyDealFilter = function($event) {
    //don't propagate to ui-sref
    $event.preventDefault();
    $event.stopPropagation();
    var activeFilters = [];
    var filters = $scope.search_filters;
    for (var i in filters) {
      if (filters[i].active) {
        activeFilters.push(filters[i].scatId);
      }
    }

    if(activeFilters.length > 0) {
      $scope.search_filters_enabled = activeFilters;
      $scope.search.page = 1;
    } else if ($scope.search_filters_enabled) {
      angular.forEach($scope.search_filters, function(filter) {
        filter.active = null;
      });
      $scope.search_filters_enabled = false;
    }
    $state.go('.', {page: 1, filter: activeFilters.join('|')}, {notify: false});
    performSearch();
  };

  // Filter
  $scope.isDealFilterEnabled = function (item) {
    return item.active ? item : null;
  };

  // Overlay filter
  $scope.validFilter = function (item) {
    return item.scatId ? item : null;
  };

  var setActiveFilter = function () {
    angular.forEach($scope.search_filters, function(filter) {
      angular.forEach($scope.search_filters_enabled, function(scatId) {
        if (scatId != 0 && filter.scatId == scatId) {
          filter.active = true;
        }
      });
    });
  };

  var lastPaddingTile = function(isHero, len) {
    if ((isHero && !(len & 1)) || (!isHero && (len & 1))) {
        len--;
    }
    return len;
  };

  // MWINHS-1767
  var paddingTile = function(skus, newLen) {
    if (isDD() && skus && skus.length > 1) {
      var len = skus.length;
      var i;
      var isHero = skus[0].isHero;
      if (newLen) {
        i = lastPaddingTile(isHero, len - newLen);
      } else {
        i = isHero ? 1 : 0;
      }

      var maxi = lastPaddingTile(isHero, len)-2;
      var j;
      while (i <= maxi) {
        j = i+1;
        if (skus[i].tag != skus[j].tag) {
          if (skus[i].tag) {
            skus[j].pad = true;
          } else
            skus[i].pad = true;
        } else {
          if (skus[i].pad) {
            skus[i].pad = false;
          }
          if (skus[j].pad) {
            skus[j].pad = false;
          }
        }
        j++;
        i = j;
      }
    }
  };

  $scope.isFiltered = function () {
    var filterApplied = false;
    if (isDD() && $scope.search_filters_enabled && $scope.search_filters_enabled.length > 0) {
      if ($scope.search_filters_enabled.length == 1 && $scope.search_filters_enabled[0] === '0')
        filterApplied =  false;
      else {
        filterApplied = true;
      }
    }

    return filterApplied;
  };

  $scope.removeDealFilter = function (f, $event) {
    f.active = false;
    $scope.applyDealFilter($event);
  };

  $scope.showRegPrice = function(product) {
    return Product.showRegPrice(product);
  };

  $scope.getDiscountPercent = function(product) {
    return Product.getDiscountPercent(product);
  };

  $scope.getStarted = function(product) {
    Product.getStarted(product);
  };

  $scope.getRebate = function(product) {
    var pricing = Product.getPricing(product);
    var rebateAmt = '0';
    angular.forEach(pricing.discounts, function(discount) {
        if (discount.name === 'rebate') {
            rebateAmt = discount.amount;
         };
    });

    return rebateAmt;
  };

  $scope.timerFinish = function(product) {
    product.expired = true;
  };

  //Analytics signals for infiniscroll
  Analytics.addWatch($scope, 'loading_next');

  function ensureDLOLoc() {
    var loc = {
      search : 'search:gallery',
      category : 'class:gallery',
      itf : 'itf:gallery:brandresult',
      deals : 'dd:secondarydeal',
      dealsHero : 'dd:herodeal',
      homeDeals: 'home:secondarydeal',
      homeDealsHero: 'home:herodeal',
      reorders : 'easyreorder'
    };
    var type = getPageType();
    var typeHero;

    if (type === 'deals') {
      if ($scope.embedded) {
        type = 'homeDeals';
      }

      typeHero = type + 'Hero';
    } else if (isinkToner) {
        type = 'itf';
    }

    DLOLoc = {
      hero: loc[typeHero] || type,
      sku: loc[type] || type
    };
  }

  $scope.DLOLoc = function(p){
    if (!DLOLoc) {
      // cache it in local
      ensureDLOLoc();
    }

    return ((p || {}).isHero) ? DLOLoc.hero : DLOLoc.sku;
  };

  $scope.intelligence = function(product) {
    return product.skuType === 'hookLogic' ?  'HookLogic' : null;
  };

  initResults();

  /*
    Function to initialize the Hook Logic param required for ad carousels
  */
  $scope.setHookLogicAdCarouselParams = function() {
    var pageType = getPageType();
    var hookLogicParams = {};
    var hookLogicParams = { pgn: $scope.search.page };
    switch(pageType) {
    case 'search':
      hookLogicParams.taxonomy = 'search';
      hookLogicParams.keyword = $scope.search.term;
      hookLogicParams.hlpt = 'S';
      hookLogicParams.creative =  '134x336_B-C-IG_TI-1_1-10_3rd-Row';
      break;
    case 'category':
      if (!ClassSearch.isCategory($scope.search.identifier)) {
        hookLogicParams.taxonomy = $scope.search.identifier;
        hookLogicParams.pageType = pageType;
      }
      hookLogicParams.hlpt = 'B';
      hookLogicParams.creative = '134x336_B-C-IG_TI-1_1-10_3rd-Row';
      break;
    }
    if($rootScope.HLfilters){
      for (var obj in $rootScope.HLfilters) {
        if(obj === 'Price'){
          var priceArray = $rootScope.HLfilters[obj].split('|');
          hookLogicParams.minPrice = priceArray[0].split('-')[0];
          hookLogicParams.maxPrice = priceArray[priceArray.length-1].split('-')[1];
        }else{
          hookLogicParams[obj] = $rootScope.HLfilters[obj];
        }
      }
    }
    return hookLogicParams;
  }
  //method to update the search result on success of HL API call
  $scope.updateSearchResult = function(hLProducts, url){
    hookLogicProducts = hLProducts;
    updateSearchResultsWithHLProducts();
  };

  var updateSearchResultsWithAdSpots = function() {
    var adPosition = $scope.search_results.indexOf(true);
    if(adPosition > -1) {
      $scope.search_results.splice(adPosition, 1);
    }
    var len = $scope.search_results.length;
    if (len > 0) {
      if(!$scope.oneHourOnly) {
        var pos = len >= 4 ? 4 : len - 1;
        $scope.search_results.splice(pos, 0, true);
      } else {
        var bopisEnabledBeforeAd = 0;
        for(var i=0; i<len; i++) {
          if($scope.search_results[i].bopis == "true") {
            bopisEnabledBeforeAd++;
            if(bopisEnabledBeforeAd > 4) {
              $scope.search_results.splice(i, 0, true);
              break;
            }
          }
        }
        if(bopisEnabledBeforeAd <= 4) {
          $scope.search_results.splice(len, 0, true);
        }
      }
    }
  }

  var updateSearchResultsWithHLProducts = function() {
    var pos = ($scope.search.page * 10 + 2) - 10;
    var pageNumber = $scope.search.page - 1;

    if (hookLogicProducts && hookLogicProducts.length > 0) {
      var index = 2;
      var i = 0;

      for (i = 0; i < pageNumber; i++) {
        if ($scope.search_results[index].sku === hookLogicProducts[0].sku) {
          hookLogicProducts.shift();
        }

        index = index + 10;
      }

      if (hookLogicProducts[0]) {
        hookLogicProducts[0].skuType = 'hookLogic';
        hookLogicProducts[0].pricing = [hookLogicProducts[0].price];
        $scope.search_results.splice(pos, 0 ,hookLogicProducts[0]);
        //Drop impression beacon for the products shown in search result.
        hookLogic.dropPageBeacon(hookLogicProducts[0].beacon.impression, 'impression');
      }
    }
  };

  /*
    Function to set the ad slot and page level targeting to show the AdSense
   */
  $scope.setDfpParams = function() {

    var targetValues = {};
    var isUserLoggedIn = MobileService.getSessionState() === 'registered';
    var regex = /[^A-Z0-9]/ig;

    //page specific target values
    switch($scope.pageType) {
      case 'search':
        if(triadConstants) {
          targetValues.levels = '/' + triadConstants.dfpNetworkId + '/' + triadConstants.siteName + '/' + $scope.pageType;
        }
        targetValues.pageTarget = {
          ptype: [$scope.pageType],
          loggedin: [isUserLoggedIn],
          kw: [$scope.search.term || null],
          sc: [null],
          cg: [null],
          dp: [null],
          cl: [null],
          rating: [null],
          prodprice: [null],
          deal: [null],
          brand: [null],
          prodid: [null]
        };
        break;

      case 'category':
        var categoryLevel;
        var categoryAnalyticsArray = [];
        if(triadConstants) {
          categoryLevel = '/' + triadConstants.dfpNetworkId + '/' + triadConstants.siteName + '/';
        }

        analytics.scName ? categoryAnalyticsArray.push(analytics.scName.replace(regex, "")) : '';
        analytics.cgName ? categoryAnalyticsArray.push(analytics.cgName.replace(regex, "")) : '';
        analytics.dpName ? categoryAnalyticsArray.push(analytics.dpName.replace(regex, "")) : '';
        analytics.clName ? categoryAnalyticsArray.push(analytics.clName.replace(regex, "")) : '';

        categoryLevel += categoryAnalyticsArray.join("/");

        targetValues.levels = categoryLevel;
        targetValues.pageTarget = {
          ptype: ["catlisting"],
          loggedin: [isUserLoggedIn],
          sc: [analytics.scName || null],
          cg: [analytics.cgName || null],
          dp: [analytics.dpName || null],
          cl: [analytics.clName || null],
          rating: [null],
          prodprice: [null],
          deal: [null],
          brand: [null],
          prodid: [null],
          kw: [null]
        };
        break;
    }

    return targetValues;
  };

  $scope.$on('$destroy', function onDestroyClassCtrl() {
      // clear the data associated with current page triad slots.
      DoubleClick.clearSlot();
  });
});
