var constants = {
	// Configure language
	"LANGUAGE":"US_EN",
	//"LANGUAGE":"JAPANESE",
	
	//avtivity controller
	"coreActivityAPI" : "core/activity/vrack/",
	"coreActivityNotificationsAPI" : "core/activity/notifications/",
	"coreActivityNotificationsStatsAPI" : "core/activity/notifications/stats",
	"coreActivityTasksCountAPI" : "core/activity/vrack/tasks/count",
	
	"eventActivityAll" : "event/vrack/event",
	"eventActivityNotificationsCountAPI" : "event/vrack/event/count",
	
	"recentEventAPI": "event/vrack/event/recent/severity",
    //"eventActivityNotificationsCountAPI" : "../../json/NCount.json",
	
	//add permission controller
	"fetchUsersAPI" : "security/domain/",
	"usersAPI" : "users",
	"groupsAPI" : "groups",

	//configura system controller
	"progressNewIpAPI" : "core/progress/vrm/newip",
	"ipReallocationAPI" : "core/progress/reip/completion",
	"checkIsServerUpAPI" : "/api/1.0/jsonp/isup?callback=jsonCallback",
	"fetchCountDetailsAPI" : "event/vrack/event/count",
	//"fetchCountDetailsAPI" : "core/activity/notifications/stats",

	//notifications controller
	"notificationsAPI" : "core/activity/notifications/",

	//vrack configuration controller
	"vrackProgressAPI" : "core/progress/boot/completion",

	//add permission service
	"fetchDomainListAPI" : "security/domains",
	"fetchRoleListAPI" : "security/roles",
	"submitUserDetailsAPI" : "security/permissions",

	//change password service
	"changePasswordAPI" : "security/permission/password",

	//dashboard service
	"buildResourcesForDashboardAPI" : "/core/vrack/stats",
	"buildDashboardForRackInfoAPI" : "/core/vrack/summary",

	//iaas config service
	"finishWorkloadConfigurationAPI" : "iaas/finishworkload/",
	"getHostCapacityAPI" : "iaas/min-resource-capacity",
	"workLoadProfileAPI" : "iaas/workload-profile",
	"fetchIaaSWorkloadProgressAPI" : "iaas/resourcepool/",
	"workflows" : "/workflows/",
	"progress" : "/progress",
	"deleteWorkloadProfileAPI" : "iaas/workload-profile/",
    "allocatevCACIP" : "vcac/allocate-ip",
    "deleteCACIP" : "vcac/delete-ip",
    "startvCACWorkflow" : "vcac/start-workflow",


    //ip reallocation service
	"fetchIpReallocationPlanAPI" : "core/ipreallocation",
	"confirmIpReallocationServiceAPI" : "core/ipreallocation",
	"rerunIpReallocationServiceAPI" : "core/ipreallocation",

	//logical resources service
	"getAllvCentersAPI" : "/core/vrack/hypervisormanagers",

	//Management network config service
	"configAPI" : "prm/networks",
	
	//Vrack network connfig (1st tab)
	"vrackConfigAPI" : "core/properties",
	
	//notification service
	"fetchNotificationCountAPI" : "core/activity/notifications/stats",

	//permission service
	"fetchAllPermissionsAPI" : "security/permissions",
	"fetchAllRolesAPI" : "security/roles",
	"deletePermissionAPI" : "security/permission/",
	"updatePermissionsAPI" : "security/permissions",

	//physical network setup service
	"networkSetupsAPI" : "prm/networks",

	//physical resources service
	"getAllRackAPI" : "prm/racks/consolidated-details",
	"getRackHostAPI" : "prm/rack/",
	"consolidatedDetails" : "/consolidated-details",
	"host" : "/host/",
	"hostManagementAPI" : "prm/host/activity/",
	"hostRemoteConsole" : "prm/host/remoteconsole/",
	"remoteConsoleDetails" : "/remoteconsoledetails",
	"remoteConsoleDisplay" : "/remoteconsoledisplay",
	
	//privilege service
	"fetchPrivilegesAPI" : "security/privileges",
	"loggedUserPrivileges" : "security/loggedUserPrivileges",

	//property service
	"fetchPropertiesAPI" : "core/properties",

	//role service
	"rolesAPI" : "security/roles",
	"removeRoleAPI" : "security/role/",

	//setting service
	"fetchThresholdcategoriesAPI" : "settings/threshold/categories",
	"fetchTypesAPI" : "settings/threshold/types",
	"fetchThresholdListAPI" : "settings/threshold/page/",
	"thresholdAPI" : "settings/threshold/",

	//vdi workload config service
	"generalScreenSubmitForWorkloadConfigurationAPI" : "vdi/general/",
	"validateNetworkConfigurationWorkloadConfigurationAPI" : "vdi/possibleoverlap/",
	"networkScreenSubmitForWorkloadConfigurationAPI" : "vdi/network/",
	"securityScreenSubmitForWorkloadConfigurationAPI" : "vdi/security/",
	"systemConfigScreenSubmitForWorkloadConfigurationAPI" : "vdi/systemconfig/",
	"fetchVDIWorkloadConfigurationAPI" : "vdi/workloadconfiguration/",
	"createNewWorkloadConfigurationAPI" : "vdi/create",
	"triggerWorkloadConfigurationAPI" : "vdi/workloadconfiguration/",
	"vdi" : "vdi/",
	"vdiProgress" : "/progress",
	"vdiStatus" : "/status",

	//workflow service
	"rerunWorkflowAPI" : "core/workflow/",
	"workflowRerun" : "/rerun",

    "cancelWorkflowAPI" : "core/workflow/",
    "workflowCancel" : "/cancel",

	//workload details service
	"fetchWorkloadDetailsAPI" : "workload/all",
	
	// Constants Service
	"constantsAPI": "vdi/constants",
	"constantsRevertDefaultAPI": "vdi/constants/default"
	

};

/*function getValue(key) {
	return constants[key];
};*/

var dashboardConstants = {
	"DISPLAY_STYLE_NONE" : "display:none;",
	"SUCCESS" : "Success",
	"VRACK_TYPE_SDN" : "SDN",
	"DISPLAY_STYLE_BLOCK" : "display:block;",
	"WHITE_COLOR" : "#FFFFFF",
	"CPU_COLOR" : "#6AA742",
	"GREY_COLOR" : "#C5C5C5",
	"LIGHT_GREY_COLOR" : "#E5E4E2",
	"MEMORY_COLOR" : "#C2CD23",
	"STORAGE_COLOR" : "#168383",
	"LOGICAL_RESOURCES_URL" : "app/views/logical-resources.html",
	"PHYSICAL_RESOURCES_URL" : "app/views/physical-resources.html",
	"SELECT_CONFIG_URL": "app/views/select-configuration.html",
	"WORKLOAD_DETAILS_URL" : "app/views/workload-details.html",
	"BACKDROP_STYLE_STATIC" : "static",
	"KEY_STORAGE" : "storage",
	"KEY_CODE" : "code",
	"TIMER_STOP" : "timer-stop"
};

var activityConstants = {
	"FILTER_TYPE" : "ALL",
	"ACTIVITY_TYPE_NOTIFICATIONS" : "notifications",
	"ACTIVITY_TYPE_TASKS" : "tasks",
	"ACTIVITY_TYPE_AUDITS" : "audits",
	"SUCCESS" : "Success",
	"NOTIFICATION_URL" : "app/views/notification.html",
	"TASK_URL" : "app/views/task.html",
	"BACKDROP_STYLE_STATIC" : "static",
	"ALARM_TYPE" : "CRITICAL"
};

var changePasswordConstants = {
	"DATA_NEW_PASSWORD_MODEL" : "data.newPassword",
	"DATA_CONFIRM_PASSWORD_MODEL" : "data.confirmPassword",
	"SUCCESS" : "Success",
	"NETWORK_CONFIG_URL" : "network-config",
	"KEY_CODE" : "code"
};

var addPermissionConstants = {
	"SUCCESS": "Success",   
	"USER_TYPE" : "USER",
	"GROUP_TYPE" : "GROUP",
	"DISPLAY_USER" : "user",
	"DISPLAY_GROUP" : "group",
	"ADD_ACTION" : "add",
	"REMOVE_ACTION" : "remove"

};

var configureSystemConstants = {
	"SUCCESS" : "Success",
	"CONFIGURE_SYSTEM" : "configure-system",
	"CODE" : "code"
};

var iaasConfigurationConstants = {
	"GENERAL" : "general",
	"DASHBOARD_URL" : "/dashboard",
	"PROGRESS" : "progress",
	"SUCCESS" : "Success",
	"CODE" : "code",
	"MESSAGE" : "message",
	"GENERAL_FORM" : "formIaaSGeneralConfiguration",
	"WORKLOAD_FORM" : "formIaaSWorkload",
	"SYSTEM_CONFIG_FORM" : "formIaaSSystemConfig",
	"WORKLOAD" : "workload",
	"SYSTEM" : "system",
	"WORKFLOW_COMPLETED" : "IaaS Workflow Completed",
	"MSG_SUCCESS" : "SUCCESS",
	"MSG_DONE" : "DONE",
	"SIZE": "sm",
    "BACKDROP": "static",
    "IAAS_TRIGGER_PROCESS": "app/views/iaas-trigger-process.html"
};

var ipReallocationConstants = {
	"SUCCESS" : "Success",
	"NAME" : "name",
	"VALUE" : "value",
	"CODE" : "code",
	"CONFIGURE_SYSTEM" : "configure-system",
	"NETWORK_CONFIG" : "network-config"
};

var logicalResourcesConstants = {
	"CODE" : "code",
	"DIV2" : "div2",
	"DIV1" : "div1",
	"DIV3" : "div3",
	"LISTVIEW" : "listview",
	"MAPVIEW" : "mapview",
	"FAILED" : "Failed"
};

var mainControllerConstants = {
	"FUNCTION" : "function",
	"FETCH_ACTIVITY_SERVER_ERROR" : " Internal error occured in fetching activities. Please contact the system administrator with the code: "
};

var networkConfigurationConstants = {
	"VRACK_CONFIG" : "vrackConfigdata",
	"NETWORK_CONFIG" : "networkConfigdata",
	"SUCCESS" : "Success",
	"IP_REALLOCATION" : "ip-reallocation",
	"CODE" : "code"
};

var workloadConfigurationConstants = {
		"SUCCESS": "Success",
		"VDI_PROGRESS": "app/views/vdi_progress.html",
        "VCAC_PROGRESS": "app/views/vcac-progress.html",
		"SIZE": "sm",
		"BACKDROP": "static",
		"VDI_TRIGGER_PROGRESS": "app/views/vdi-trigger-process.html",
		"ISO": "iso",
		"OVA": "ova",
		"LINKED" : "linked",
		"NETWORK" : "network",
		"SECURITY" : "security",
		"SYSTEM_CONFIG" : "system-config",
		"SELECTED_ISO_FILE" : "selectedIsoFile",
		"SELECTED_OVA_FILE" : "selectedOvaFile",
		"CLICK" : "click",
		"GENERAL" : "general",
		"REVIEW" : "review",
		"VDI_CANCEL_URL" : "app/views/vdi-cancel-warning.html",
        "VCAC_CONFIRMATION_URL" : "app/views/vcac-confirmation.html",
		"DASHBOARD_URL" : "/dashboard",
		"MSG_SUCCESS" : "success",
		"RUNNING" : "running",
		"CANCEL_ISO_UPLOAD" : "cancleISOUpload",
		"CANCEL_OVA_UPLOAD" : "cancleOVAUpload",
		"SYSTEM_CONFIG_NXT" : "systemConfigNxt"

};

var vrackConfigurationControllerConstants = {
		"SUCCESS": "Success",  
	    "TYPE": "powering-on-vrack"
};

var selectConfigurationControllerConstants = {
		"WORKLOAD_CONFIGURATION": "app/views/workload-configuration.html",
		"IAAS_CONFIGURATION": "app/views/iaas-configuration.html",
		"BACKDROP": "static"
};

var roleControllerConstants = {
		"FAILED": "Failed",
		"ADD_ROLE": "app/views/add-role.html",           
	    "SIZE": "sm",
	    "BACKDROP": "static",
	    "ADMIN": "Admin"
};

var physicalResourceControllerConstants = {
		"SUCCESS": "Success",
		"FAILED": "Failed",
		"ACTION_TYPE_CYCLEHOST": "cycleHost",
		"ACTION_TYPE_ON": "on",
		"ACTION_TYPE_OFF": "off",
		"CONFIRM_POWER_CYCLE": "app/views/confirm-power-cycle.html",
		"SIZE": "sm",
		"STATIC" : 'static',
		"EXTERNAL_CONNECTION" : "EXTERNAL_CONNECTION"
};

var physicalNetworkSetupControllerConstants = {
		"SUCCESS": "Success",
		"IP_REALLOCATION" : "ip-reallocation",
		"NETWORK_CONFIG" : "network-config"
};

var permissionControllerConstants = {
		"ADD_PERMISSION_POPUP": "app/views/add-permission.html",
		"BACKDROP": "static",
		"SUCCESS": "Success",
		"EMAIL": "administrator@vsphere.local"
};

var notificationControllerConstants = {
		"FILTER_TYPE": "ALL", 
		"SUCCESS": "Success",
		"notification.controller.FAILED": "Failed"	
};

var settingsControllerConstants = {
	"DEGREE_F" : "DegreesF",
	"FLOAT" : "float",
	"INTEGER" : "integer",
	"BOOLEAN" : "boolean",
	"SUCCESS" : "success"
};

/**
 * Edited by Yuvraj
 * Date :: 12-09-2014
 */

var vrmUi = {
	getValue : function (key) {
		return constants[key];
	},
	getDashboardValue : function (key) {
		return dashboardConstants[key];
	},
	getActivityValue : function (key) {
		return activityConstants[key];
	},
	getChangePasswordValue : function (key) {
		return changePasswordConstants[key];
	},
	getAddPermissionValue : function (key) {
		return addPermissionConstants[key];
	},
	getConfigureSystemValue : function (key) {
		return configureSystemConstants[key];
	},
	getIaasConfigurationValue : function (key) {
		return iaasConfigurationConstants[key];
	},
	getIpReallocationValue : function (key) {
		return ipReallocationConstants[key];
	},
	getLogicalResourcesValue : function (key) {
		return logicalResourcesConstants[key];
	},
	getMainControllerValue : function (key) {
		return mainControllerConstants[key];
	},
	getNetworkConfigurationValue : function (key) {
		return networkConfigurationConstants[key];
	},
	getWorkloadConfigurationValue : function (key){
		return workloadConfigurationConstants[key];
	},
	getVrackConfigurationControllerValue : function (key){
		return vrackConfigurationControllerConstants[key];
	},
	getSelectConfigurationControllerValue : function (key){
		return selectConfigurationControllerConstants[key];
	},
	roleControllerValue : function (key){
		return roleControllerConstants[key];
	},
	physicalResourceControllerValue : function (key){
		return physicalResourceControllerConstants[key];
	},
	physicalNetworkSetupControllerVaue : function (key){
		return physicalNetworkSetupControllerConstants[key]; 
	},
	permissionControllerValue : function (key){
		return permissionControllerConstants[key];
	},
	notificationControllerValue : function (key){
		return notificationControllerConstants[key];
	},
	settingsControllerValue : function (key) {
		return settingsControllerConstants[key];
	}
};