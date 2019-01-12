'use strict';

angular.module('stpls')
    .directive('creditcard', function($rootScope, $timeout) {
        return {
            restrict: 'E',
            scope: {
                cards: '=cards',
                cardCount: '=cardCount',
                 id: '=id', //  a lookup creditcard id (when inline is used)
                display: '=display', //  display mode: form or inline
                editable: '=editable', //  does list show edit, delete, add buttons
                selectable: '=selectable', //  does list show a radio selection button
                showCounter: '=showCounter', //  does list show a counter label
                checkoutCcId: '=checkoutCcId' // if any, the currently selected creditcard id in checkout
            },
            templateUrl: 'modules/creditcard/views/CreditCard.html',
            controller: function($scope, $modal, $translate, CreditCards, MobileService) {

                // backup copy in case we cancel edits
                $scope.master = {};
                // editing a card (form visible)
                $scope.editMode = false;
                // adding a card (form visible)
                $scope.addMode = false;
                //  loading message;
                $scope.isLoading = false;
                // the current card/card being edited
                $scope.card = {};
                // no errors yet
                $scope.errorMsg = false;
                // hide the footer
                $rootScope.hide_footer = true;
                // the creditcard vendor type
                $scope.ccType;
                // the staples card type (temporary)
                $scope.stplsCCType;

                $scope.sessionUser = (MobileService.getSessionState() === 'registered');

                if ($scope.display === 'inline') {
                    $scope.editMode = false;
                    $scope.addMode = false;
                }

                $scope.refresh = function() {
                    CreditCards.getCreditCards().then(function(response) {
                        if (response) {
                            $scope.cards = response;
                        } else {
                            $scope.cards = null;
                        }
                        $scope.cardCount = $scope.cards.length;
                        // backup copy in case cancel is pressed
                        $scope.master = angular.copy($scope.cards);

                        $scope.editMode = false;
                        $scope.addMode = false;

                    }, function(error) {
                        $scope.cards = null;

                    })['finally'](function() {
                       // tell ProfileCtrl to update its counters
                       $rootScope.$broadcast('countersChanged', {
                       });
                       $scope.isLoading = false;
                    });
                };

                //  Get the CreditCards
                $scope.refresh();

                //  When Add button is selected
                $scope.create = function() {
                    $scope.addMode = true;
                    $scope.editMode = false;
                    // create new empty card
                    $scope.card = {};
                    // backup copy in case cancel is pressed
                    $scope.master = angular.copy($scope.cards);

                    $scope.prompt({
                        header: {
                            close: true
                        },
                        cardIn: $scope.card,
                        editMode: $scope.editMode,
                        addMode: $scope.addMode,
                        dir: this,
                        ccType: '',
                        stplsCCType: '',
                        animation: true,
                    }, 'CreditCard_AddEdit', 'modules/creditcard/views/CreditCard_AddEdit.html', 'CreditCardPromptCtrl');
                };

                //  When Edit button is selected
                $scope.edit = function(card) {
                    $scope.editMode = true;
                    $scope.addMode = false;

                    // set card to the one we're editing
                    $scope.card = card;
                    $scope.card.expiry = card.expMonth + '/' + card.expYr;

                    //  Show hidden number
                    if (card.type === 'AMEX') {
                        $scope.card.number = '***********' + card.number;
                    } else {
                        $scope.card.number = '************' + card.number;
                    }

                    // backup copy in case cancel is pressed
                    $scope.master = angular.copy($scope.cards);

                    $scope.prompt({
                        header: {
                            close: true
                        },
                        cardIn: $scope.card,
                        editMode: $scope.editMode,
                        addMode: $scope.addMode,
                        dir: this,
                        ccType: $scope.card.type,
                        stplsCCType: $scope.card.type,
                        animation: true,
                    }, 'CreditCard_AddEdit', 'modules/creditcard/views/CreditCard_AddEdit.html', 'CreditCardPromptCtrl');
                };

                $scope.setIsLoading = function() {
                    $scope.isLoading = true;
                };

                //  Hide the form and show the list of cards again
                $scope.cancelEdit = function(form) {
                    // copy the original back since we didn't save
                    $scope.cards = angular.copy($scope.master);
                    form.$setPristine();
                    form.$setUntouched();
                    $scope.addMode = false;
                };

                //  Delete the card
                $scope.delete = function(cardId) {
                    $scope.isLoading = true;
                    $scope.errorMsg = undefined;
                    var card = getCreditCardById(cardId);

                    if (cardId === $scope.checkoutCcId) {
                        //  can't delete the currently selected id
                        $scope.errorMsg = $translate.instant('CC_DELETE_CURRENT');
                        if (card) {
                            card.showOverlay = true;
                        }
                        countDownOverlay(card);
                        return;
                    }
                    CreditCards.deleteCreditCard(cardId).then(function(response) {
                        if (card) {
                            card.showOverlay = true;
                            //  no countdown necessary, row is being deleted...
                        }
                        $timeout(function() {
                            //  Give the overlay time to show
                            $scope.cards = _.reject($scope.cards, function(el) {
                                return el.id === cardId;
                            });
                            $scope.cardCount -= 1;

                            // update the profile copy - since we have now saved
                            $scope.master = angular.copy($scope.cards);
                            $scope.editMode = false;
                            $scope.addMode = false;

                            $scope.refresh();
                        }, 2000);


                    }, function(error) {
                        //  ignore delete errors
                        $scope.errorMsg = $translate.instant('CC_DELETE_ERROR');
                        $scope.isLoading = false;
                        if (card) {
                            card.showOverlay = true;
                            countDownOverlay();
                        }
                     });
                };

                /*  CreditCard selected, broadcast to listeners */
                $scope.creditCardSelected = function(card) {
                    CreditCards.setCurrentCard(card);

                    $rootScope.$broadcast('creditCardSelectionChanged', {
                        selCreditCard: card
                    });
                    $rootScope.back();
                };

                /*  CreditCard selected, broadcast to listeners */
                $scope.creditCardSelectedInline = function(card) {
                    CreditCards.setCurrentCard(card);

                    $rootScope.$broadcast('creditCardSelectionChanged', {
                        selCreditCard: card
                    });
                };

                $scope.prompt = function(p, wclass, template, controller) {
                    var p = $modal.open({
                        windowClass: wclass,
                        templateUrl: template,
                        controller: controller,
                        animation: true,
                        size: 'sm',
                        resolve: {
                            prompt: function() {
                                return p;
                            }
                        }
                    });
                };

                var countDownOverlay = function (item) {
                    //  2 seconds
                    $timeout(function() {
                        item.showOverlay = false;
                    }, 2000);
                };

                var getCreditCardById = function (ccId) {
                    var foundCreditCard = null;
                    angular.forEach($scope.cards, function(card) {
                        if (card.id === ccId) {
                            foundCreditCard = card;
                        }
                    });

                    return foundCreditCard;
                };


            }
        };
    });
