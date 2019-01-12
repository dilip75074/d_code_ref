/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('LogicalResourcesService', function(HttpCommunicationUtil) {

    this.getAllvCenters = function(successCallback, errorCallback) {
        console.log("in getAllvCenters");

        //HttpCommunicationUtil.doGet('../json/logicalVcenterList.json', successCallback, errorCallback);
        HttpCommunicationUtil.doGet(vrmUi.getValue("getAllvCentersAPI"), successCallback, errorCallback);
    };
});