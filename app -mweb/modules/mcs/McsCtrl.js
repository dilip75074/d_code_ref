angular.module('stpls').controller('McsCtrl', function($scope, $q, $timeout, $rootScope, Config, Account, MobileService, Locator, Profile, DefaultStore) {

    // marking 1
    $scope.adWidget = {
        widget: 'adplacement',
            config: {
        engine: 'hooklogic',
            locator: 'home',
            taxonomy: 'home',
            MaxAds: 1,
            pgn: 1,
            hlpt: 'H',
            creative: '150x375_M-C-OG_TI-1_1-1_AboveGrid1'
        }
    };

    var userProfile;
    var store;

    var sessionUser = MobileService.getSessionUserName();

    function getUserProfile() {
        return userProfile;
    };

    function initStore() {
        var defaultStore = {
            storeHours: [
                {
                    dayName: "Sunday",
                    hours: "10:00AM - 7:00PM"
                },
                {
                    dayName: "Monday",
                    hours: "8:00AM - 9:00PM"
                },
                {
                    dayName: "Tuesday",
                    hours: "8:00AM - 9:00PM"
                },
                {
                    dayName: "Wednesday",
                    hours: "8:00AM - 9:00PM"
                },
                {
                    dayName: "Thursday",
                    hours: "8:00AM - 9:00PM"
                },
                {
                    dayName: "Friday",
                    hours: "8:00AM - 9:00PM"
                },
                {
                    dayName: "Saturday",
                    hours: "9:00AM - 9:00PM"
                }
            ],
            store_address: {
                address_line1: '659 Worcester Rd.',
                city: 'Framingham',
                state: 'MA',
                zip: '01701',
                phoneNumber: '5088203020'
            },
            store_number: '0349'
        };

         //  Look for the "My Store" first
        store = Locator.getRememberedStore();
        if (store) {
            captureStore(store);
        } else {
            //  find nearest store
            $timeout(function() { // - defer to free thread
              var result = Locator.getStoresByAddr(Account.getZipCode(), 40);
              result.then(function(stores) {
                store = stores[0];
                captureStore(store);
              }, function(error) {
                store = defaultStore;
                captureStore(store);
              });
            }, 100);
        }
    }

    $scope.$on('nearestStoreChanged', function(event, data) {
        if (data && data.selStore && data.selStore.store_number !== store.store_number) {
            store = data.selStore;
            Locator.setRememberedStore(store);
            DefaultStore.saveGenericStore(store);
            $rootScope.$broadcast('cardtStoreChanged', data);
        }
    });

    function init() {
      initStore();
    }

    function url() {
        var config = Config.getProperty('mcs');
        var env = config[Config.getEnvironment()] || config.default;

        return '/mcs/tag/mobileWeb/' + env + '/1.0';
    }

    var captureStore = function(store) {
        DefaultStore.saveGenericStore(store);
        $scope.store = store;
        getlayout();
    };

    function getlayoutMock() {
        $scope.cards = {
            carouselCategories : {
                title: "Carousel",
                titleThumbnail:"",
                position: "19",
                categoryType: "carousel",
                contentType: "carousel_sss",
                cellType: "quarter",
                "carouselBanners":[
                    {
                        "title": "Up to $200 off select laptops, desktops and 2 in 1",
                        "showTitle":false,
                        "contentType":"bundle",
                        "contentSourceUrl":"category/identifier/BI1142421?sort=ratingAsc&limit=100&offset=1",
                        "contentImageUrl":"http://images.staples-3p.com/s7/is/image/Staples/53745_ios_960x840_inknlp?wid=960&hei=840",
                        "cellType":"quarter"
                    },
                    {
                        "title":"Save up to 50% on Chairs",
                        "showTitle":false,
                        "contentType":"noURL",
                        "contentSourceUrl":"category/identifier/BI1296508?sort=ratingAsc&limit=100&offset=1",
                        "contentImageUrl":"http://s7d5.scene7.com/is/image/Staples/52538_ios_960x420_chairs?$iOS%20and%20new%20mWeb$",
                        "cellType":"quarter"
                    },
                    {
                        "title":"Save up to 50% on Chairs",
                        "showTitle":false,
                        "contentType":"externalURL",
                        "contentSourceUrl":"https://play.google.com/store?hl=en",
                        "contentImageUrl":"http://s7d5.scene7.com/is/image/Staples/52538_ios_960x420_chairs?$iOS%20and%20new%20mWeb$",
                        "cellType":"quarter"
                    },
                    {
                        "title":"Clearance",
                        "showTitle":false,
                        "contentType":"class",
                        "contentSourceUrl":"category/identifier/CL211635?sort=ratingAsc&limit=100&offset=1",
                        "contentImageUrl":"http://media.staples.com/iosapp/2015_5_31_46827_ios_960x420.jpg",
                        "cellType":"quarter"
                    }]},
            "weeklyAd":{
                "title":"Weekly Ad",
                "titleThumbnail":"",
                "position":"2",
                "categoryType":"weeklyAd",
                "contentType":"weeklyad",
                "contentImageUrl":"http://media.staples.com/iosapp/weeklyad_2.jpg",
                "isSneakPeek":"true",
                "cellType":"quarter"
            },
            "dailyDeals":{
                "title":"Daily Deals",
                "titleThumbnail":"",
                "position":"3",
                "categoryType":"dailyDeals",
                "contentType":"bundle",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "showTitle":false,
                "cellType":"quarter",
                "products":[
                    {
                        "productImage":"s0990189",
                        "productName":"select regular-priced Microsoft® Office 365 and 2016 titles when you buy a PC or tablet.",
                        "productPrice":"$50.99",
                        "offerPrice":"Save $20",
                        "ratings":"4"
                    }]},
            "myStore":{
                "stores":[
                    {
                        "storeCity":"Foster City, CA",
                        "storeAddress":"2230 Bridgepoint Pkwy San Mateo, CA 94404",
                        "storeTiming":"Open until 9PM",
                        "storeDistance":"2.1 miles away"}],
                "title":"My Store",
                "titleThumbnail":"",
                "position":"4",
                "categoryType":"myStore",
                "contentType":"myStore",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "showTitle":false,
                "cellType":"quarter"},
            "trendingNow":{
                "title":"Trending Now",
                "titleThumbnail":"",
                "position":"5",
                "categoryType":"trendingNow",
                "contentType":"trendingNow",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "showTitle":false,
                "cellType":"quarter",
                "products":[
                    {
                        "productImage":"s1021452",
                        "productName":"school supplies when you buy a backpack.",
                        "productPrice":"25% off"
                    },
                    {
                        "productImage":"s0996570",
                        "productName":"Hammermill® 8.5\" x 11\" Copy Plus® copy paper, ream, after easy rebate and with coupon.",
                        "productPrice":"1¢"
                    }]},
            "inkAndToner":{
                "title":"Ink & Toner",
                "titleThumbnail":"",
                "position":"6",
                "categoryType":"inkAndToner",
                "contentType":"inkAndToner",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "showTitle":false,
                "cellType":"quarter",
                "products":[
                    {
                        "productImage":"s0945733",
                        "productName":"Your $30 order of regular-priced Avery® labels.",
                        "productPrice":"$14.99",
                        "offerPrice":"Save $10",
                        "ratings":"4"
                    }]},
            "marketing1":{
                "title":"",
                "position":"7",
                "categoryType":"marketing1",
                "contentType":"marketing1",
                "showTitle":false,
                "cellType":"quarter",
                "bannerImageUrl":""},
            "rewards":{
                "title":"Rewards",
                "titleThumbnail":"",
                "position":"8",
                "categoryType":"rewards",
                "contentType":"rewards",
                "desc1":"Staples Rewards",
                "desc2":"It pays to get with the program",
                "desc3":"Sign up for free now and start earning rewards on tons of products, from office supplies and snacks to technology and furniture",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "showTitle":false,
                "cellType":"quarter"},
            "marketing2":{
                "title":"",
                "position":"9",
                "categoryType":"marketing2",
                "contentType":"marketing2",
                "showTitle":false,
                "cellType":"quarter",
                "bannerImageUrl":""},
            "coupons":{
                "title":"Coupons",
                "titleThumbnail":"",
                "position":"10",
                "categoryType":"coupons",
                "contentType":"coupons",
                "cellType":"quarter",
                "couponData":[
                    {
                        "image":"s0937314",
                        "offer":"10% off",
                        "itemName":"all regular-priced 2' x 3' boards.",
                        "couponType":"Omni",
                        "contentSourceUrl":"category/identifier/CL166382",
                        "fids":"4225031130",
                        "expiryDate":"1/23/16",
                        "couponCode":"78538",
                        "disclaimer":"Valid online at staples.com®, by phone at 1-800-333-3330 or in Staples® U.S. stores. Discount applies to regular-priced items only. Cannot be combined with any other discount or coupon. Excludes Daily Deals, Auto Restock orders and clearance items. While supplies last. Limit one coupon per customer, nontransferable. Each item purchased can only be discounted by one coupon, applied by cashier in the order received and prior to tax. Coupon not valid if purchased or sold and must be surrendered. No cash/credit back. Not valid on prior purchases or purchases made with Staples® Procurement or Convenience Cards. Coupon value does not include tax. Expires 1/23/16."
                    },
                    {
                        "image":"s0990821",
                        "offer":"Free",
                        "itemName":"$25 Visa® gift card with your purchase of a select Wacom Intuos tablet regularly $99.95 or more.",
                        "couponType":"Omni",
                        "expiryDate":"1/30/16",
                        "contentSourceUrl":"category/identifier/BI1238781",
                        "onlineCouponCode":"60008",
                        "inStoreCouponCode":"74339",
                        "disclaimer":"Valid online at staples.com®, by phone at 1-800-333-3330 or in Staples® U.S. stores. Excludes Daily Deals and Auto Restock orders. While supplies last. Limit one coupon per customer, nontransferable. Minimum purchase requirement must be met with purchases to which no other coupon or instant savings offer applies. Tax and shipping not included in calculating the minimum purchase. Subject to availability. See gift card for details, terms, conditions and (if applicable) fees. Offer is subject to change or cancellation at any time. All trademarks are property of their respective owners. The Visa® gift card is issued by MetaBank®, member FDIC pursuant to a license from Visa U.S.A. Inc. Each item purchased can only be discounted by one coupon, applied by cashier in the order received and prior to tax. Coupon not valid if purchased or sold and must be surrendered. No cash/credit back. Not valid on prior purchases or purchases made with Staples® Procurement or Convenience Cards. Plus tax where applicable. Expires 1/30/16."
                    }
                ]
            },
            "staplesApp": {
                "title":"The Staples® App",
                "titleThumbnail":"",
                "position":"11",
                "categoryType":"staplesApp",
                "contentType":"staplesApp",
                "contentImageUrl":"http://media.staples.com/iosapp/2014_3_9_dailydeals.jpg",
                "contentSourceUrl":"http://api.staples.com/asgard/v1/nad/staplesus/deals/BI1142421?rank=0&zipcode=01702&client_id=lRJfjUdK2OmdWDDFYGdAZLDIKh1WAePm",
                "cellType":"quarter"
            }
        };
    }

    var processData = function(response) {
      var data = response.data;

      var sequence = sessionUser ? data.loggedInUserSequence :  data.guestUserSequence;
      sequence["staplesApp"]="11";
      sequence["tophat"]="0";
      var sequenceSorted = Object.keys(sequence).sort(function(a, b) {
          var keya = Number(sequence[a]);
          var keyb = Number(sequence[b]);
          return keya - keyb;
      });

      var layout = {};
      angular.forEach(data.layout, function(i){
          if (typeof i === "object" && i.categoryType) {
              layout[i.categoryType] = i;
          }
      });
      var cards = [];
      angular.forEach(sequenceSorted, function(i) {
          if (layout[i]) {
              cards.push(layout[i]);
          } else
              cards.push({categoryType: i});
      });

      $scope.cards = cards;
    };

    function getlayout() {
        var d = $q.defer();
        var data = null;

        if (window.sessionStorage) {
          data = window.sessionStorage.getItem('mcs');
        }

        if (data) {
          processData(JSON.parse(data));
        }
        else {
          MobileService.request({
              method: 'GET',
              url: url()
          }).then(function(response) {
              if (window.sessionStorage) {
                window.sessionStorage.setItem('mcs', JSON.stringify(response));
              }
              processData(response);
          }, function() {
              getlayoutMock();
          });
        }
    }

    init();
});
