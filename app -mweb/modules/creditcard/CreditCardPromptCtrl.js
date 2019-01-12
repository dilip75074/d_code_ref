'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:CreditCardPromptCtrl
 */
angular.module('stpls')
    .controller('CreditCardPromptCtrl', function($scope, $rootScope, $timeout, $translate, $modalInstance, prompt, CreditCards) {

        $scope.errorMsg = '';
        $scope.p = prompt;
        if ($scope.p.actions == undefined) {
            $scope.p.actions = {};
        }

        $scope.path = function(btn) {
            $scope.close();

            if (btn.reload) {
                $rootScope.reload();
            } else if (btn.callback) {
                btn.callback();
            } else if (btn.route) {
                setTimeout(function() {
                    $rootScope.toRoute(btn.route);
                }, 500);
            }
        };

        $scope.ok = function() {
            $modalInstance.close($scope.selected.item);
        };

        $scope.close = function() {
            $modalInstance.dismiss('cancel');
        };

        $scope.save = function(card) {
            var testNum = card.number;
            if (card.number) {
                //  remove the asterisks
                testNum = card.number.replace (/\*/g, '');
            }

            $scope.errorMsg = '';
            if (!card.number || card.number === '') {   //  bad number
                $scope.errorMsg = $translate.instant ('CC_NUM_ERROR');
                $scope.cardEditForm.cardNum.$setValidity('card', false);
            } else if (testNum.length < 13) {  //  bad number
                $scope.errorMsg = $translate.instant ('CC_NUM_REENTER');
                $scope.cardEditForm.cardNum.$setValidity('card', false);
            } else if ($scope.p.ccType === null && $scope.p.stplsCCType === null) { //  bad vendor
                $scope.errorMsg = $translate.instant ('CC_VEND_ERROR');
                $scope.cardEditForm.cardNum.$setValidity('card', false);
            } else if (!card.expiry || card.expiry === '' || String (card.expiry).startsWith ('NaN') || String (card.expiry).startsWith ('Invalid')) {  //  bad expiration date
                $scope.errorMsg = $translate.instant ('CC_DATE_ERROR');
                $scope.cardEditForm.expiry.$setValidity('expiry', false);
           } else if (!card.cvc || card.cvc === '') {  //  bad cvc
                $scope.errorMsg = $translate.instant ('CC_CVV_ERROR');
                $scope.cardEditForm.cvc.$setValidity('cvc', false);
            } else if (card.notes && card.notes.length > 32) {    //  bad notes max length - html limits to 32 - extra precaution if save called from elsewhere
                $scope.errorMsg = $translate.instant ('CC_NOTES_ERROR');
                $scope.cardEditForm.notes.$setValidity('maxlength', false);
            }

            if (!$scope.p.ccType) {
                $scope.p.ccType = $scope.p.stplsCCType;
            }

            if ($scope.p.ccType === 'amex') {
                if (card.cvc.length !== 4) {    //  bad cvc
                    $scope.errorMsg = $translate.instant ('CC_CVV_ERROR');
                    document.cardEditForm.elements.cvc.setAttribute ('validity', ValidityState.badInput);
                }
            } else if (!$scope.p.ccType === 'staples') {
               if (card.cvc.length !== 3) {    //  bad cvc
                    $scope.errorMsg = $translate.instant ('CC_CVV_ERROR');
                    document.cardEditForm.elements.cvc.setAttribute ('validity', ValidityState.badInput);
               }
            }

            if ($scope.errorMsg !== '') {
                // find the first invalid element
                var firstInvalid = document.cardEditForm.querySelector('.ng-invalid');
                // if we find one, set focus
                if (firstInvalid) {
                    firstInvalid.focus();
                }
                return;
            }

            $scope.p.dir.setIsLoading();

            CreditCards.encryptCreditCard (card.number, $scope.p.ccType).then (function (encryptResponse) {
                // temp copy to store the encrypted number
                var payload = angular.copy (card);
                payload.number = encryptResponse;

                //  API wants the vendor field in different format
                var newccType;
                if ($scope.p.stplsCCType == 'staples') {
                    newccType = $translate.instant ('CC_CARDTYPE_STAPLES');
                } else {
                    switch ($scope.p.ccType) {
                        case 'visa':
                            newccType = $translate.instant ('CC_CARDTYPE_VISA');
                            break;
                        case 'mastercard':
                            newccType = $translate.instant ('CC_CARDTYPE_MC');
                            break;
                        case 'discover':
                            newccType = $translate.instant ('CC_CARDTYPE_DISC');
                            break;
                        case 'amex':
                            newccType = $translate.instant ('CC_CARDTYPE_AMEX');
                            break;
                    }
                }
                payload.expMonth = payload.expiry.split('/')[0];
                payload.expYr = payload.expiry.split('/')[1];
                if (payload.expYr.length <= 2) {
                    payload.expYr = '20' + payload.expYr;
                }
                payload.type = newccType;

                CreditCards.saveCreditCard (payload).then (function (response) {

                    // set card number back to last 4 digits
                    card.number = card.number.slice (-4);
                    if ($scope.p.stplsCCType == 'staples') {
                        card.type = $scope.p.stplsCCType;
                    } else {
                        card.type = $scope.p.ccType;
                    }
                    $scope.errorMsg = '';
                    $scope.p.dir.refresh();
                    $scope.close ();

                }, function (error) {
                    $scope.errorMsg = $translate.instant ('CC_PROCESS_ERROR');
                    console.log ('error saving card', error);
                });

            }, function (error) {
                // encryption error
                $scope.errorMsg = $translate.instant ('CC_PROCESS_ERROR');
            });
        };

        $scope.cancel = function(form) {
            $scope.p.dir.cancelEdit(form);
            $scope.close();
        };

    });