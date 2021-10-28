/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comisuzu./zmm_sayim_yonet/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
