/** deprecated but kept for reference
'use strict';

angular.module('stpls').directive('categoryListTree', function(Browse, Config, $q, $window, $translate) {
    return {
        restrict: 'E',
        scope: {
            topLevelSrc: '=',
            identifier: '=',
            hidden: '='
        },
        templateUrl: 'modules/browse/directives/categoryList.html',
        controller: function($rootScope, $scope, Config, Browse) {

            var context;
            var shopByCategory = {
              id: 'top',
              title: 'SM_CAT',
              identifier: '',
              collapsed: true,
              isTop: true,
              isFirst: true,
              isSuper: true,
              sub: []
            };

            function init() {
                if ($scope.topLevelSrc === 'config') {
                    initSidebar();
                } else {
                    initBrowsePage();
                }
            }

            function initSidebar() {
                $scope.map = angular.copy(Config.getProperty('browse'));
                $scope.map.unshift(shopByCategory);
                context = 'sidebar';
            }

            function initBrowsePage() {
                context = 'browse';
                // we're in the category browse page - so grab top categories from server
                Browse.getCategory('', '', true).then(function(result) {
                    // add the top top level category
                    shopByCategory.collapsed = false;
                    $scope.map = angular.copy(Array.prototype.concat(shopByCategory, result.sub));

                    if ($scope.identifier) {
                        // if we are passed an identifier in the url, then expand that specific category
                        var openCat = _.findWhere($scope.map, {
                            identifier: $scope.identifier
                        });
                        openCat.collapsed = false;
                        // I delete this hidden property later in toggleCat() -- only used to hide sibling categories at first load
                        _.each($scope.map, function(cat) {
                            if (cat !== openCat && cat.isSuper !== true) {
                                cat.hidden = true;
                            }
                        });
                        if (!openCat.sub) {
                            fetchSubs(openCat, null);
                        }
                    }
                });
            }


            init();

            $scope.getLabel = function (node) {
              return $translate.instant(node.title);
            };

            $scope.toggleCat = function(c) {

                var m = c.$modelValue;

                if ((/^(CL|BI)/).test(m.identifier)) {
                    // edge node, so route them to category page (aka "class" page)
                    $rootScope.toRoute('category', {
                        identifier: m.identifier
                    });
                } else if (m.isSuper && m.collapsed === false && context === 'browse') {
                    // this is the top level root category so reset everything back to default
                    $rootScope.toRoute('browse', {
                        identifier: null
                    });
                    init();
                } else if (m.openCategoryPage) {
                    // expand this category in the dedicated category browse page instead of on the sidemenu
                    $rootScope.toRoute('browse', {
                        identifier: m.identifier
                    });
                } else if (m.calloutUrl) {
                    // special category - send to external url
                    // some urls have full http:// some appear to be relative, so send to staples.com
                    if (m.calloutUrl.indexOf('http') == 0) {
                        $window.open(m.calloutUrl);
                    } else {
                        $window.open('http://www.staples.com' + m.calloutUrl);
                    }
                } else {
                    // Load subs
                    if (_.isEmpty(m.sub)) {
                        fetchSubs(m, c).then(function() {
                                toggleSubs(c)
                            },
                            function() {
                                $rootScope.prompt({
                                    header: {
                                        title: 'Error'
                                    },
                                    message: 'An error occurred while processing your request. Please try again.',
                                    actions: {
                                        primary: {
                                            title: 'OK',
                                            callback: function() {}
                                        }
                                    }
                                });
                            })
                    } else {
                        toggleSubs(c);
                    }
                }

            };

            function toggleSubs(c) {

                if (c.collapsed) {
                    hideSiblings(c);
                } else {
                    showSiblings(c);
                    collapseChild(c);
                }
                c.toggle();

            }

            function hideSiblings(c) {
                // hide all other siblings, except for "super" categories
                _.each(c.siblings(), function(sibling) {
                    if (sibling !== c && sibling.$modelValue.isSuper !== true) {
                        sibling.hidden = true;
                    }
                });
            }

            function showSiblings(c) {
                // show them again when collapsing
                _.each(c.siblings(), function(sibling) {
                    sibling.hidden = false;
                });
            }

            function fetchSubs(m, c) {

                var d = $q.defer();
                var child, parent;

                // if first level then we're fetching the second level
                if (m.isFirst === true) {
                    child = '';
                    parent = m.identifier;
                } else if (m.isTop) { // * third level
                    child = m.identifier;
                    parent = c.$parentNodeScope.$modelValue.identifier;
                } else { // level 3+
                    child = m.identifier;
                    parent = '';
                }

                Browse.getCategory(child, parent, m.isTop).then(function(data) {
                    m.sub = data.sub;
                    d.resolve();
                }, function() {
                    d.reject();
                });
                return d.promise;

            }
            var collapseOrExpand = function(scope, collapsed) {
                var nodes = scope.childNodes();
                _.each(nodes, function(n) {
                    collapsed ? n.collapse() : n.expand();
                    n.hidden = false;
                    var subScope = n.$childNodesScope;
                    if (subScope) {
                        collapseOrExpand(subScope, collapsed);
                    }
                });
            };

            function collapseChild(c) {
                collapseOrExpand(c, true);
            }
        }
    };
});
*/
