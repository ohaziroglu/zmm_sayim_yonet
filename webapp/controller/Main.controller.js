sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/Filter',
	"sap/m/MessageBox"
], function (Controller, Filter, MessageBox) {
	"use strict";

	return Controller.extend("com.isuzi.zmm_sayim_yonet.controller.Main", {
		onInit: function () {

			//Manifest içerisinde tanımlanan mainModel burada kullanılmak üzere çağırılır.
			this._model = this.getOwnerComponent().getModel("mainModel");
			this.getView().setModel(this._model, "mainModel");
			this._model.setSizeLimit(1000);

			//oDataModel
			this._oDataModel = this.getOwnerComponent().getModel();

			this.onGetData(null, "/materialList", "01");

			//İlk değerler
			this._model.setProperty("/sendCountButton", true);
			this._model.setProperty("/approveButton", false);
			this._model.setProperty("/rejectButton", false);

		},

		onGetData: function (materialNumber, property, statu) {
			var that = this;
			var oFilter = [];

			//property undefined değeri ile geliyorsa refresh butonuna basılmış demektir.
			this._model.setProperty((property === undefined) ? "/materialList" : property, []);

			oFilter.push(new Filter("Statu", "EQ", statu));

			if (materialNumber && property) {
				oFilter.push(new Filter("MalzemeNumarasi", "EQ", materialNumber));
			}

			sap.ui.core.BusyIndicator.show(0);
			this._oDataModel.read("/MalzemeListesiSet", {
				filters: oFilter,
				success: function (oData, response) {
					sap.ui.core.BusyIndicator.hide(0);
					that._model.setProperty((property === undefined) ? "/materialList" : property, oData.results);
					//that._model.setProperty("/materialListCount", oData.results.length);

				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide(0);
				}
			});

		},

		onCalledCreateService: function (statu, allItems, selectedItems, oTable) {
			var that = this;
			var oEntry = {
				Statu: statu,
				Malzemeler: []
			};

			for (var i = 0; i < selectedItems.length; i++) {
				this._model.setProperty(selectedItems[i].getBindingContext("mainModel").sPath + "/SayimSecimi", true);
			}

			oEntry.Malzemeler = allItems;

			sap.ui.core.BusyIndicator.show(0);
			this._oDataModel.create("/MalzemeSayimIslemSet", oEntry, {
				success: jQuery.proxy(function (oData, response) {
					sap.ui.core.BusyIndicator.hide(0);
					MessageBox.success(this._onGetMessageText("MSG_SUCCESS"), {
						onClose: function (sAction) {
							oTable.removeSelections();
							that.onGetData(null, "/materialList", "01");
						}
					});

				}, this),
				error: jQuery.proxy(function (oError) {
					sap.ui.core.BusyIndicator.hide(0);
					MessageBox.error(this._onGetMessageText("MSG_ERROR"));
				}, this)
			});
		},

		//Onaylama ve reddetme Fonksiyonu
		onManageApprove: function (oEvent) {
			var that = this;
			var typeId = oEvent.getSource().getId().split("--")[2];
			var statu = (typeId === "id_AcceptButton") ? "04" : "02"; //Accept 04, reject işleminde 02 olacak.
			var allItems = (typeId === "id_AcceptButton") ? this._model.getProperty("/approveMaterialList") : this._model.getProperty(
				"/materialList");
			var oTable = (typeId === "id_AcceptButton") ? this.getView().byId("id_materialListApprove") : this.getView().byId("id_materialList");

			if (oTable.getSelectedItems().length === 0) {
				sap.m.MessageBox.error(this._onGetMessageText("MSG_SELECT_DATA"));
				return;
			}

			var message = (typeId === "id_AcceptButton") ? this._onGetMessageText("MSG_ACCEPT") : this._onGetMessageText("MSG_REJECT");
			var messageTitle = (typeId === "id_AcceptButton") ? this._onGetMessageText("MSG_ACCEPT_TITLE") : this._onGetMessageText(
				"MSG_REJECT_TITLE");
			var messageIcon = (typeId === "id_AcceptButton") ? MessageBox.Icon.SUCCESS : MessageBox.Icon.ERROR;
			var messageAction = (typeId === "id_AcceptButton") ? this._onGetMessageText("MSG_ACTION_ACCEPT") : this._onGetMessageText(
				"MSG_ACTION_REJECT");

			if (typeId === "id_AcceptButton") {
				sap.m.MessageBox.show(message, {
					icon: messageIcon,
					title: messageTitle,
					actions: [messageAction, this._onGetMessageText("MSG_CANCEL")],
					emphasizedAction: "Onayla",
					onClose: function (sButton) {
						if (sButton === messageAction) {
							that.onCalledCreateService(statu, allItems, oTable.getSelectedItems(), oTable);
						} else {
							return;
						}
					}
				});
			} else {
				that.onCalledCreateService(statu, allItems, oTable.getSelectedItems(), oTable);
			}

		},

		onDeleteRow: function (oEvent) {
			//Silme işleminde confifm yaılacak.
			var sPath = oEvent.getSource().getBindingContext("mainModel").getPath();
			var materialList = this._model.getProperty("/materialList");
			var index = sPath.split("/")[2];

			materialList.splice(Number(index), 1);
			this._model.refresh();
		},

		//Malzeme Ekleme Pop-up
		onGetMaterialList: function () {

			if (!this._materialDialog) {
				this._materialDialog = sap.ui.xmlfragment("com.isuzi.zmm_sayim_yonet.fragments.materialList", this);
				this.getView().addDependent(this._materialDialog);
			}

			this._materialDialog.open();

		},

		handleSearchMaterial: function (oEvent) {
			var materialNumber = oEvent.getSource().getValue();
			var oList = sap.ui.getCore().byId("id_materialList");
			var property = "/filterMaterial";

			oList.removeSelections();
			this.onGetData(materialNumber, property, "01");

		},

		onAddMaterialList: function (oEvent) {
			var that = this;
			var oList = sap.ui.getCore().byId("id_materialList");
			var oMaterialInfo = oList.getSelectedItem().getBindingContext("mainModel").getObject();

			oMaterialInfo["isDelete"] = 'X';

			//Boş malzeme eklemeye çalışırsa uyarı	
			this._model.getProperty("/materialList").push(oMaterialInfo);
			this._model.refresh();
			this.onAddMaterialListClose(oList);
		},

		onAddMaterialListClose: function (listObject) {
			//Alanlar boşaltıkdıktan sonra kapatılır.
			if (listObject.sId !== "press") {
				listObject.removeSelections();
			}

			this._model.setProperty("/materialSearchField", "");
			this._model.setProperty("/filterMaterial", []);

			this._materialDialog.close();
		},

		onRefreshData: function (oEvent) {
			var oIconTab = this.getView().byId("id_IconTabBar");
			var currentTab = oIconTab.getSelectedKey();

			switch (currentTab) {
			case "MaterialSelectionScreen":
				this.getView().byId("id_materialList").removeSelections();
				this.onGetData(null, "/materialList", "01");
				break;
			case "ManageApproveScreen":
				this.getView().byId("id_materialListApprove").removeSelections();
				this.onGetData(null, "/approveMaterialList", "03");
				break;
			case "ReportListScreen":
				this.onGetData(null, "/materialListReport", "04");
				break;
			case "MaterialCountScreen":
				this.onGetData(null, "/materialCountList", "02");
				break;
			default:
			}
		},

		handleIconTabBarSelect: function (oEvent) {
			var getSelectedScreen = oEvent.getSource().getSelectedKey();

			switch (getSelectedScreen) {
			case 'MaterialSelectionScreen':
				this._model.setProperty("/materialAddVisible", true);
				this._model.setProperty("/sendCountButton", true);
				this._model.setProperty("/approveButton", false);
				this._model.setProperty("/rejectButton", false);

				break;
			case 'ManageApproveScreen':
				this._model.setProperty("/materialAddVisible", false);
				this._model.setProperty("/sendCountButton", false);
				this._model.setProperty("/approveButton", true);
				this._model.setProperty("/rejectButton", true);
				break;
			case 'ReportListScreen':
				this._model.setProperty("/materialAddVisible", false);
				this._model.setProperty("/sendCountButton", false);
				this._model.setProperty("/approveButton", false);
				this._model.setProperty("/rejectButton", false);
				break;
			case 'MaterialCountScreen':
				this._model.setProperty("/materialAddVisible", false);
				this._model.setProperty("/sendCountButton", false);
				this._model.setProperty("/approveButton", false);
				this._model.setProperty("/rejectButton", false);
				break;
			default:

			}

			this.onRefreshData();

		},

		_onGetMessageText: function (msg) {
			var message = this.getOwnerComponent().getModel("i18n").getProperty(msg);

			return message;

		}

	});
});