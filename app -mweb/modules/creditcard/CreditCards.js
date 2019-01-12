'use strict';

/**
 * @ngdoc function
 * @name stpls.model:CreditCards
 */
angular.module('stpls').factory('CreditCards', function($q, $cookies, MobileService) {

    var currentCreditCard;

    var getCurrentCard = function() {
        return currentCreditCard;
    };

    var setCurrentCard = function(creditCard) {
        currentCreditCard = creditCard;
    };

    var getCreditCards = function() {

        var creditCards = null;

        if (MobileService.getSessionState() !== 'registered') {
            return;
        }

        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/creditCard',
            cache: false
        }).then(function(response) {
            if (response.data) {
                creditCards = response.data.creditCards;
            } else {
                creditCards = null;

            }
            d.resolve(creditCards);

        }, function(error) {
            console.log('error getting creditcards', error);
            d.reject(error);
        });

        return d.promise;
    };

    /*
     * Save or Add credit card to user's profile
     */
    var saveCreditCard = function(card) {
        var d = $q.defer();

        var request = {
            url: '/creditCard',
            cache: false,
            data: card
        };

        if (card.id) {
            // card Id means we're editing an existing card
            request.method = 'PUT';
        } else {
            // else we're creating a new one so use POST
            request.method = 'POST';
        }

        MobileService.request(request).then(function(response) {
            d.resolve(response);
        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*
     * Delete credit card from user's profile
     */
    var deleteCreditCard = function(cardId) {
        var d = $q.defer();

        MobileService.request({
            method: 'DELETE',
            url: '/creditCard/' + cardId,
            cache: false
        }).then(function(response) {
            console.log('card deleted: ', response);
            d.resolve(response);

        }, function(error) {
            console.log('error deleting card', error);
            d.reject(error);
        });

        return d.promise;
    };

    /*
     * Encrypt the credit card number for security
     */
    var encryptCreditCard = function(ccn, ccType) {
        var d = $q.defer();

        MobileService.powRequest({
            url: '/creditCard/encrypt',
            method: 'POST',
            cache: false,
            data: [{
                ccn: ccn,
                ccType: ccType
            }]
        }).then(function(response) {
            // console.log('encrypt response', response);
            if (response.data[0] && response.data[0].status == 0) {
                d.resolve(response.data[0].packet);
            } else if (response.data[0].status == 2) {
                console.log('invalid response from encryption API');
                d.reject('invalid credit card type and number combination');
            } else {
                d.reject('invalid card number or other error');
            }
        }, function(error) {
            console.log('error encrypting card number', error);
            d.reject(error);
        });

        return d.promise;
    };

    return {
        deleteCreditCard: deleteCreditCard,
        saveCreditCard: saveCreditCard,
        encryptCreditCard: encryptCreditCard,
        getCreditCards: getCreditCards,
        getCurrentCard: getCurrentCard,
        setCurrentCard: setCurrentCard
    };
});
