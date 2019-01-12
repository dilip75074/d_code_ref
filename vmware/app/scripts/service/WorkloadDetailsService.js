/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('WorkloadDetailsService', function(HttpCommunicationUtil) {
	
	this.fetchWorkloadDetails = function(successCB, errorCB){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchWorkloadDetailsAPI"), successCB, errorCB);
		//HttpCommunicationUtil.doGet('../../json/workloadDetails.json', successCB, errorCB);
	};
});	