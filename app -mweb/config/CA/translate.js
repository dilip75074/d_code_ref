(function(){
'use strict';

// Modularized this code for reuse in pseudoIso
var getStplsTranslate = function(){
  var stplsTranslate;
  try {
    stplsTranslate = angular.module('stplsTranslate');
  } catch (e){
    stplsTranslate = angular.module('stplsTranslate',['pascalprecht.translate']);
  }
  return stplsTranslate;
};

getStplsTranslate().config(['$translateProvider', function ($translateProvider) {


    $translateProvider.translations('en_CA', {

        'SF_CAF1_LABEL': 'Ship to Store',
        'SF_CAF3_LABEL': 'Canada Post Postage',
        'SF_CAF4_LABEL': 'Purolator Service Desk',
        'SF_CAF5_LABEL': 'Furniture Section',
        'SF_CAF6_LABEL': 'Computer Rental Station',
        'SF_CAF7_LABEL': 'Apple Computers',
        'SF_CAF8_LABEL': 'Online Graphic Design',
        'SF_CAF1_TOOLTIP': '',
        'SF_CAF3_TOOLTIP': '',
        'SF_CAF4_TOOLTIP': '',
        'SF_CAF5_TOOLTIP': '',
        'SF_CAF6_TOOLTIP': '',
        'SF_CAF7_TOOLTIP': '',
        'SF_CAF8_TOOLTIP': '',

        'STPLS_COPY': 'Staples, Inc.',
        'STPLS_APP': 'Download the app',

        'SM_STORE': 'Find a Store',
        'SM_AD': 'View Flyers',
        'SM_REWARDS': 'AIR MILES',
        'SM_CAT': 'SHOP BY CATEGORY',
        'SM_NUM': 'ORDER BY ITEM NUMBER',
        //'SM_NEW': 'WHAT\'S NEW',
        'SM_DEAL': 'Hot Deals',
        //'SM_COUPON': 'Coupon Wallet',
        'SM_FAV': 'My Favorites Lists',
        'SM_ORDER': 'Easy Reorder',
        'SM_MY_ORDER': 'My Orders',
        'SM_INK': 'Ink &amp; Toner Finder',
        'SM_ACCT': 'MY ACCOUNT',
        'SM_LOGIN': 'Sign in',
        'SM_LIST': 'Join Mailing List',
        'SM_FOLLOW': 'Follow Us',
        'SM_APP': 'Download App',
        'SM_DESKTOP': 'View Full Site',

        'FT_TERMS': 'Terms',
        'FT_HELP': 'Help Centre',
        'FT_FIND_STORE': 'Find Store',
        'FT_DESKTOP': 'Full Site',

        'LCR_MON': 'Mon',
        'LCR_TUE': 'Tue',
        'LCR_WED': 'Wed',
        'LCR_THU': 'Thu',
        'LCR_FRI': 'Fri',
        'LCR_SAT': 'Sat',
        'LCR_SUN': 'Sun',
        'LCR_MON_FRI':'Mon-Fri',
        'LCR_STORE': 'store #',
        'LCR_ERROR_STR': 'No results found.',
        'LCR_HEADER': 'Store Results',
        'LCR_SEARCH': 'City, Postal Code',
        'LCR_WITHIN': 'results within',
        'LCR_MY_STORE': 'My Store',
        'LCR_NO_REM_HEADER': 'You have not set your store yet.',
        'LCR_NO_REM_TEXT': 'Locate the store you wish to set as your store and select the checkbox to set as your store.',
        'LCR_CLOSEST': 'Closest to me',
        'LCR_MAP': 'Map',
        'LCR_LIST': 'List',
        'LCR_NO_GEO_HEADER': 'Location detection is disabled',
        'LCR_NO_GEO_TEXT': 'Location detection is disabled or your device/browser software does not appear to support geolocation services.Please check your device/browser software settings and retry.',
        'LCR_SET_STORE': 'Set as my store',
        'LCR_BACK': 'Back',
        'LCR_DIR': 'Directions',
        'LCR_STR_HR': 'Store Hours',
        'LCR_PH': 'Store Phone',
        'LCR_STR_SRCH': 'Search this store',
        'LCR_STR_CPN': 'Coupons For This Store',
        'LCR_STR_AD': 'Weekly Flyer For This Store',
        'LCR_STR_EV': 'Store Events',
        'LCR_STR_NO_EV': 'No events at this Store.',
        'LCR_STR_MAIL': 'Feedback For This Store',
        'LCR_REFINE': 'Refine',
        'LCR_RETRY': 'Retry',

        'LCR_SHIP_TO': 'Ship to Store',
        'LCR_CA_POST': 'Canada Post Postage',
        'LCR_PURO': 'Purolator Service Desk',
        'LCR_FURNITURE': 'Furniture Section',
        'LCR_RENTAL': 'Computer Rental Station',
        'LCR_APPLE': 'Apple Computers',
        'LCR_GRAPHIC': 'Online Graphic Design',

        'LCR_SPECIAL': 'View special hours',

        'SRCH_PLACEHOLDER': 'Search Staples',
        'SRCH_SRCH': 'SEARCH',
        'SRCH_CANCEL': 'CANCEL',
        'SRCH_INK_TONER_FINDER': 'INK & TONER FINDER',
        'SRCH_INK_TONER_SearchBy': 'Search by cartridge, model number or brand',
        'SRCH_KEYWORD_MATCHES': 'KEYWORD MATCHES',
        'SRCH_RECENT_SEARCHES': 'YOUR RECENT SEARCHES',
        'SRCH_ONLY_AVAILABLE': 'Only show products available',
        'SRCH_IN_THISSTORE': 'In This Store:',
        'SRCH_IN_MYSTORE': 'In My Store:',
        'SRCH_STPLS_STORE': 'Staples Store ',

		'RWD_TOT_SPEND': 'Total Spending',
		'RWD_TOT_YTD': '(YTD)',
		'RWD_INK_RECYCLE': 'Ink Recycling',
		'RWD_TOT_EARN': 'Total Earnings',
		'RWD_LAST_12': 'Last 12 Months',
		'RWD_EARNED':  'REWARDS EARNED',
		'RWD_EXPIRES': 'Exp. ',
		'RWD_VALUE': 'Value ',
		'RWD_ADDTO_CART': 'Add to Cart',
		'RWD_USEIN_STORE': 'Use In-Store',
		'RWD_LOGGEDIN_MSG': 'You must be logged in to view your Rewards.',
  		'RWD_WAIT_MSG': 'Please wait while we gather your rewards...',
   		'RWD_ASSC_INSTRUCT': 'Associate: Scan rewards code to redeem.',
        'RWD_ENROLL': 'Enroll',
        'RWD_LINKEXISTING': 'Link',
        'RWD_DONE': 'Done',
        'RWD_DASHBOARD_ERROR': 'There was an error retrieving your rewards.  Please try again later.',
        'RWD_WAIT_ENROLL': 'Please wait while we enroll you in the rewards program...'

    });

    $translateProvider.translations('fr_CA', {

        'STPLS_COPY': 'Bureau en Gros Ltée.',
        'STPLS_APP': 'Téléchargez l\'appli',

        'SM_STORE': 'Magasins',
        'SM_AD': 'Circulaires',
        'SM_REWARDS': 'AIR MILES',
        'SM_CAT': 'MAGASINER PAR CATÉGORIE',
        'SM_NUM': 'COMMANDER PAR NUMÉRO D\'ARTICLE',
        //'SM_NEW': 'WHAT\'S NEW',
        'SM_DEAL': 'Aubaines',
        //'SM_COUPON': 'Coupon Wallet',
        'SM_FAV': 'Mes listes d\'articles préférés',
        'SM_ORDER': 'Nouvelle commande facile',
        'SM_MY_ORDER': 'Mes commandes',
        'SM_INK': 'Chercheur d\'encre et de toner',
        'SM_ACCT': 'MON COMPTE',
        'SM_LOGIN': 'Connexion',
        'SM_LIST': 'Ajoutez-vous à la liste d\'envoi',
        'SM_FOLLOW': 'Suivez-nous',
        'SM_APP': 'Télécharger appli',
        'SM_DESKTOP': 'Voir le site complet',


        'FT_TERMS': 'Politiques',
        'FT_HELP': 'Centre d\'aide',
        'FT_DESKTOP': 'Voir le site complet',
        'FT_FIND_STORE': 'Magasins',

        'LCR_MON': 'Lun',
        'LCR_TUE': 'Mar',
        'LCR_WED': 'Mer',
        'LCR_THU': 'Jeu',
        'LCR_FRI': 'Ven',
        'LCR_SAT': 'Sam',
        'LCR_SUN': 'Dim',
        'LCR_MON_FRI':'Lun-Ven',
        'LCR_STORE': 'N° du magasin :',
        'LCR_ERROR_STR': 'Aucun résultat trouvé.',
        'LCR_HEADER': 'Localisateur de magasin',
        'LCR_SEARCH': 'Région ou Code postal',
        'LCR_WITHIN': 'résultats dans',
        'LCR_MY_STORE': 'Mon magasin',
        'LCR_NO_REM_HEADER': 'Vous n\'avez pas encore créé votre magasin.',
        'LCR_NO_REM_TEXT': 'Localisez le magasin que vous souhaitez définir comme votre magasin et sélectionner la case à cocher pour définir comme votre magasin.',
        'LCR_CLOSEST': 'Plus proche de moi',
        'LCR_MAP': 'Carte',
        'LCR_LIST': 'Liste',
        'LCR_NO_GEO_HEADER': 'Le système de localisation est désactivé',
        'LCR_NO_GEO_TEXT': 'Le système de localisation est désactivé ou la fonction de géolocalisation n\'est pas prise en charge par votre appareil/fureteur. Veuillez vérifier les réglages de votre appareil/fureteur et réessayer.',
        'LCR_SET_STORE': 'Définir comme mon magasin',
        'LCR_BACK': 'Retour',
        'LCR_DIR': 'Instructions',
        'LCR_STR_HR': 'Heures d\'ouverture',
        'LCR_PH': 'Téléphone du magasin',
        'LCR_STR_SRCH': 'Rechercher dans ce magasin',
        'LCR_STR_CPN': 'Coupons pour ce magasin',
        'LCR_STR_AD': 'Annonce hebdomadaire pour ce magasin',
        'LCR_STR_EV': 'Aucun événement dans ce magasin',
        'LCR_REFINE': 'Limiter',

        'LCR_RETRY': 'Refaire',
        'LCR_SPECIAL': 'Heures spéciales',

        'LCR_SHIP_TO': 'Expédition au magasin',
        'LCR_CA_POST': 'Timbres de Postes Canada',
        'LCR_PURO': 'Comptoir de services Purolator',
        'LCR_FURNITURE': 'Section Ameublement',
        'LCR_RENTAL': 'Poste de location d\'ordinateur',
        'LCR_APPLE': 'Ordinateurs Apple',
        'LCR_GRAPHIC': 'Conception graphique en ligne',

        'LCR_STR_MAIL': 'Commentaires pour ce magasin',
        'LCR_STR_NO_EV': 'Aucun événement dans ce magasin.',

        'SRCH_PLACEHOLDER': 'Recherche',
        'SRCH_SRCH': 'recherche',
        'SRCH_CANCEL': 'ANNULER',
        'SRCH_INK_TONER_FINDER': 'Cartouches d\'encre et toner',
        'SRCH_INK_TONER_SearchBy': 'Recherche par n° de cartouche, n° de modèle, ou marque',
        'SRCH_KEYWORD_MATCHES': 'RECHERCHE PAR MOT-CLÉ',
        'SRCH_RECENT_SEARCHES': 'VOS RECHERCHES RÉCENTES',
        'SRCH_ONLY_AVAILABLE': 'N\'afficher que les produits disponibles',
        'SRCH_IN_THISSTORE': 'Dans ce magasin:',
        'SRCH_IN_MYSTORE': 'Dans mon magasin:',
        'SRCH_STPLS_STORE': 'Magasin n° ',

		'RWD_TOT_SPEND': 'Total Spending',
		'RWD_TOT_YTD': '(YTD)',
		'RWD_INK_RECYCLE': 'Ink Recycling',
		'RWD_TOT_EARN': 'Total Earnings',
		'RWD_LAST_12': 'Last 12 Months',
		'RWD_EARNED':  'REWARDS EARNED',
		'RWD_EXPIRES': 'Exp. ',
		'RWD_VALUE': 'Value ',
		'RWD_ADDTO_CART': 'Add to Cart',
		'RWD_USEIN_STORE': 'Use In-Store',
		'RWD_LOGGEDIN_MSG': 'You must be logged in to view your Rewards.',
  		'RWD_WAIT_MSG': 'Please wait while we gather your rewards...',
   		'RWD_ASSC_INSTRUCT': 'Associate: Scan rewards code to redeem.',
   		'RWD_ENROLL': 'Enroll',
        'RWD_LINKEXISTING': 'Link',
        'RWD_DONE': 'Done',
        'RWD_DASHBOARD_ERROR': 'There was an error retrieving your rewards.  Please try again later.',
        'RWD_WAIT_ENROLL': 'Please wait while we enroll you in the rewards program...'

    });

    $translateProvider.preferredLanguage('en_CA');

}]);
})();
