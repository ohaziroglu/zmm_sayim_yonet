/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/isuzi/zmm_sayim_yonet/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});