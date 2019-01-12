/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('WorkflowService', function(HttpCommunicationUtil) {
	
	this.rerunWorkflow = function(workflowId, successCB, errorCB){
		HttpCommunicationUtil.doPut(vrmUi.getValue("rerunWorkflowAPI")+workflowId+vrmUi.getValue("workflowRerun"), null, successCB, errorCB);
	};

    this.cancelWorkflow = function(workflowId, successCB, errorCB){
        HttpCommunicationUtil.doPut(vrmUi.getValue("cancelWorkflowAPI")+workflowId+vrmUi.getValue("workflowCancel"), null, successCB, errorCB);
    };
	
});