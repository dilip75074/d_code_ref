/**
 * @ngdoc function
 * @name stplsSwitchBoard
 * @desc Define app level switches
 */ 
angular.module('stplsSwitchBoard', [])
  .constant('SWITCHBOARD', {
    "GPT_SEARCH_MAIN_SWITCH": true,
    "ENABLE_GPT_SEARCH_ADSLOT_BELOW_SEARCH_BAR": true,
    "ENABLE_GPT_SEARCH_ADSLOT_BELOW_PRODUCT_BAR": false,
    "GPT_CATEGORY_MAIN_SWITCH": true,
    "ENABLE_GPT_CATEGORY_ADSLOT_BELOW_SEARCH_BAR": true,
    "ENABLE_GPT_CATEGORY_ADSLOT_BELOW_PRODUCT_BAR": false,
    "GPT_SKU_MAIN_SWITCH": true,
    "ENABLE_GPT_SKU_ADSLOT_BELOW_PRODUCT_BAR": true,
    "ENABLE_GPT_SKU_ADSLOT_PRODUCT_CAROUSEL": false
  });