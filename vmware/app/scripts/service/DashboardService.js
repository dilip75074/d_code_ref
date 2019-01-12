/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('DashboardService', function(HttpCommunicationUtil) {
	
    /**
     * Method to build the resources for dashboard (4 graphs information)
     * 
     */
    this.buildResourcesForDashboard = function(successCB, errorCB, forbiddenCallbackFunction) {
        console.log("In DashboardService for resources");

        // 4 graphs call (Resources)
        //HttpCommunicationUtil.doGet('../../json/dashboardConsolidatedDetails.json', successCB, errorCB);
        HttpCommunicationUtil.doGet(vrmUi.getValue("buildResourcesForDashboardAPI"), successCB, errorCB, null, forbiddenCallbackFunction);
    };

    /**
     * Method to fetch the basic information for rack
     * 
     */
    this.buildDashboardForRackInfo = function(successDashboard, errorDashboard, forbiddenCallbackFunction) {
        console.log("In DashboardService for basic rack info");

        // Call for rack information
        //HttpCommunicationUtil.doGet('../../json/dashboardConsolidatedDetails.json', successDashboard, errorDashboard);
        HttpCommunicationUtil.doGet(vrmUi.getValue("buildDashboardForRackInfoAPI"), successDashboard, errorDashboard, null, forbiddenCallbackFunction);
    };

});