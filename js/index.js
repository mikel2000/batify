/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../LICENSE for licensing details
*/

const runtime = chrome.runtime || browser.runtime;
const i18n = chrome.i18n || browser.i18n;

var handler =
{
   log_level_debug: 1,
   log_level_error: 2,

   site_status_active: 1,
   site_status_deleted: 2,

   conf_balance_check_interval: 1000 * 60,

   balance: null,
   exchangeRate: null,
   viewsFilter: null,
   logLevel: null,

   init: function()
   {
      /* i18n */
      document.getElementById("payment_status_off_label").textContent = handler.getMessage("status");
      document.getElementById("teaser_1").textContent = handler.getMessage("teaser1", [handler.getBrowser()]);
      document.getElementById("tos").textContent = handler.getMessage("tos");
      document.getElementById("desc_1").textContent = handler.getMessage("desc1");
      document.getElementById("desc_2").textContent = handler.getMessage("desc2");
      document.getElementById("desc_3").innerHTML = DOMPurify.sanitize(handler.getMessage("desc3", ["<a href='https://community.batify.net' target='_blank'>" + handler.getMessage("feedback") + "</a>"]));
      document.getElementById("desc_4").innerHTML = DOMPurify.sanitize(handler.getMessage("desc4", ["<a href='https://www.batify.net' target='_blank'>Batify.net</a>"]));

      document.getElementById("payment_status_on_label").textContent = handler.getMessage("status");
      document.getElementById("autoinclude_label").textContent = handler.getMessage("autoinclude");
      document.getElementById("help").title = handler.getMessage("help");
      document.getElementById("history").title = handler.getMessage("history");
      document.getElementById("settings").title = handler.getMessage("settings");
      document.getElementById("budget_label").textContent = handler.getMessage("budget");
      document.getElementById("balance_label").textContent = handler.getMessage("balance");
      document.getElementById("budget_label").textContent = handler.getMessage("budget");
      document.getElementById("funds").textContent = handler.getMessage("addFunds");
      document.getElementById("contribution_last_label").textContent = handler.getMessage("lastContribution");
      document.getElementById("contribution_next_label").textContent = handler.getMessage("nextContribution");
      document.getElementById("calculated").textContent = handler.getMessage("calculated");
      document.getElementById("views_filter").placeholder = handler.getMessage("filter");
      document.getElementById("hide_deleted_label").textContent = handler.getMessage("hideDeleted");
      document.getElementById("hide_excluded_label").textContent = handler.getMessage("hideExcluded");
      document.getElementById("header_site").textContent = handler.getMessage("headerSite");
      document.getElementById("header_include").textContent = handler.getMessage("headerInclude");
      document.getElementById("header_visits").textContent = handler.getMessage("headerVisits");
      document.getElementById("header_time_spent").textContent = handler.getMessage("headerTimeSpent");
      document.getElementById("header_actions").textContent = handler.getMessage("headerActions");

      document.getElementById("settings_title").textContent = handler.getMessage("settingsTitle");
      document.getElementById("settings_min_view_duration_label").textContent = handler.getMessage("settingsMinViewDuration");
      document.getElementById("settings_min_views_label").textContent = handler.getMessage("settingsMinViews");
      document.getElementById("settings_currency_label").textContent = handler.getMessage("settingsCurrency");
      document.getElementById("settings_log_level_label").textContent = handler.getMessage("settingsLogLevel");
      document.getElementById("settings_backup").textContent = handler.getMessage("settingsBackup");
      document.getElementById("settings_recovery").textContent = handler.getMessage("settingsRecovery");
      document.getElementById("settings_done").textContent = handler.getMessage("close");

      document.getElementById("history_title").textContent = handler.getMessage("historyTitle");
      document.getElementById("history_not_contributed").textContent = handler.getMessage("historyNotContributed");
      document.getElementById("history_header_date").textContent = handler.getMessage("historyHeaderDate");
      document.getElementById("history_header_total").textContent = handler.getMessage("historyHeaderTotal");
      document.getElementById("history_header_details").textContent = handler.getMessage("historyDetails");
      document.getElementById("history_done").textContent = handler.getMessage("close");

      document.getElementById("history_details_title").textContent = handler.getMessage("historyDetailsTitle");
      document.getElementById("history_details_date_label").textContent = handler.getMessage("historyDetailsDate");
      document.getElementById("history_details_amount_label").textContent = handler.getMessage("historyDetailsAmount");
      document.getElementById("history_details_header_rank").textContent = handler.getMessage("historyDetailsHeaderRank");
      document.getElementById("history_details_header_site").textContent = handler.getMessage("historyDetailsHeaderSite");
      document.getElementById("history_details_header_amount").textContent = handler.getMessage("historyDetailsAmount");
      document.getElementById("history_details_done").textContent = handler.getMessage("close");

      document.getElementById("backup_title").textContent = handler.getMessage("backupTitle");
      document.getElementById("backup_desc_1").textContent = handler.getMessage("backupDesc1");
      document.getElementById("backup_desc_2").textContent = handler.getMessage("backupDesc2");
      document.getElementById("backup_passphrase_label").textContent = handler.getMessage("backupPassphrase");
      document.getElementById("backup_passphrase_copy").textContent = handler.getMessage("backupCopy");
      document.getElementById("backup_passphrase_save").textContent = handler.getMessage("backupSave");
      document.getElementById("backup_done").textContent = handler.getMessage("close");

      document.getElementById("recovery_title").textContent = handler.getMessage("recoveryTitle");
      document.getElementById("recovery_desc_1").textContent = handler.getMessage("recoveryDesc1");
      document.getElementById("recovery_desc_2").textContent = handler.getMessage("recoveryDesc2");
      document.getElementById("recovery_passphrase_label").textContent = handler.getMessage("recoveryPassphrase");
      document.getElementById("recovery_recover").textContent = handler.getMessage("recoveryRecover");
      document.getElementById("recovery_done").textContent = handler.getMessage("close");

      document.getElementById("funds_title").textContent = handler.getMessage("fundsTitle");
      document.getElementById("funds_desc_1").textContent = handler.getMessage("fundsDesc1");
      document.getElementById("funds_desc_2").textContent = handler.getMessage("fundsDesc2");
      document.getElementById("funds_hint_1").innerHTML = DOMPurify.sanitize(handler.getMessage("fundsHint1", ["<a href='https://www.batify.net' target='_blank'>Batify.net</a>"]));
      document.getElementById("funds_hint_2").innerHTML = DOMPurify.sanitize(handler.getMessage("fundsUphold", ["<a href='https://uphold.com/' target='_blank'>Uphold</a>", "<a href='https://uphold.com/en/brave' target='_blank'>" + handler.getMessage("fundsLearnMore") + "</a>"]));
      document.getElementById("funds_done").textContent = handler.getMessage("close");

      document.getElementById("funds_currency_title").textContent = handler.getMessage("fundsCurrencyTitle");
      document.getElementById("funds_currency_hint_2").innerHTML = DOMPurify.sanitize(handler.getMessage("fundsUphold", ["<a href='https://uphold.com/' target='_blank'>Uphold</a>", "<a href='https://uphold.com/en/brave' target='_blank'>" + handler.getMessage("fundsLearnMore") + "</a>"]));
      document.getElementById("funds_currency_done").textContent = handler.getMessage("close");

      document.getElementById("message_title").textContent = handler.getMessage("messageTitle");
      document.getElementById("message_done").textContent = handler.getMessage("close");

      /* events */
      document.getElementById("payment_status_off").onchange = function(){handler.paymentStatusChanged(this.checked)};
      document.getElementById("payment_status_on").onchange = function(){handler.paymentStatusChanged(this.checked)};
      document.getElementById("auto_include").onchange = function(){handler.autoIncludeChanged(this.checked)};
      document.getElementById("views_filter").oninput = function(){handler.viewsFilterChanged(this.value)};
      document.getElementById("hide_excluded").onchange = function(){handler.hideExcludedChanged(this.checked)};
      document.getElementById("hide_deleted").onchange = function(){handler.hideDeletedChanged(this.checked)};
      document.getElementById("budget").onchange = handler.budgetChanged;

      document.getElementById("settings").onclick = handler.openSettingsDialog;
      document.getElementById("settings_close").onclick = function(){document.getElementById("settings_dialog").style.display = "none";};
      document.getElementById("settings_done").onclick = function(){document.getElementById("settings_dialog").style.display = "none";};
      document.getElementById("settings_min_view_duration").onchange = handler.minViewDurationChanged;
      document.getElementById("settings_min_views").onchange = handler.minViewsChanged;
      document.getElementById("settings_currency").onchange = handler.budgetCurrencyChanged;
      document.getElementById("settings_log_level").onchange = handler.logLevelChanged;
      document.getElementById("settings_backup").onclick = handler.openBackupDialog;
      document.getElementById("settings_recovery").onclick = function(){document.getElementById("recovery_dialog").style.display = "block";};

      document.getElementById("backup_passphrase_copy").onclick = handler.copyPassphrase;
      document.getElementById("backup_passphrase_save").onclick = handler.saveRecoveryFile;
      document.getElementById("backup_close").onclick = function(){document.getElementById("backup_dialog").style.display = "none";};
      document.getElementById("backup_done").onclick = function(){document.getElementById("backup_dialog").style.display = "none";};

      document.getElementById("recovery_recover").onclick = handler.recoverWallet;
      document.getElementById("recovery_close").onclick = function()
      {
         document.getElementById("recovery_passphrase").value = "";
         document.getElementById("recovery_dialog").style.display = "none";
      };
      document.getElementById("recovery_done").onclick = function()
      {
         document.getElementById("recovery_passphrase").value = "";
         document.getElementById("recovery_dialog").style.display = "none";
      };

      document.getElementById("funds").onclick = function(){document.getElementById("funds_dialog").style.display = "block";};
      document.getElementById("funds_close").onclick = function(){document.getElementById("funds_dialog").style.display = "none";};
      document.getElementById("funds_done").onclick = function(){document.getElementById("funds_dialog").style.display = "none";};
      document.getElementById("funds_btc").onclick = function(){handler.openFundsCurrencyDialog("BTC")};
      document.getElementById("funds_eth").onclick = function(){handler.openFundsCurrencyDialog("ETH")};
      document.getElementById("funds_bat").onclick = function(){handler.openFundsCurrencyDialog("BAT")};
      document.getElementById("funds_ltc").onclick = function(){handler.openFundsCurrencyDialog("LTC")};

      document.getElementById("copy_address").onclick = handler.copyAddress;
      document.getElementById("funds_currency_close").onclick = function(){document.getElementById("funds_currency_dialog").style.display = "none";};
      document.getElementById("funds_currency_done").onclick = function(){document.getElementById("funds_currency_dialog").style.display = "none";};

      document.getElementById("history").onclick = handler.openHistoryDialog;
      document.getElementById("history_close").onclick = function(){document.getElementById("history_dialog").style.display = "none";};
      document.getElementById("history_done").onclick = function(){document.getElementById("history_dialog").style.display = "none";};

      document.getElementById("history_details_close").onclick = function(){document.getElementById("history_details_dialog").style.display = "none";};
      document.getElementById("history_details_done").onclick = function(){document.getElementById("history_details_dialog").style.display = "none";};

      document.getElementById("message_close").onclick = function(){document.getElementById("message_dialog").style.display = "none";};
      document.getElementById("message_done").onclick = function(){document.getElementById("message_dialog").style.display = "none";};

      /* misc */
      runtime.onMessage.addListener(handler.handleMessage);
      window.setInterval(function(){runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: false}, handler.showWalletBalance);}, handler.conf_balance_check_interval);
      runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
   },

   handleMessage: function(request, sender, sendResponse)
   {
      if(request.action == "refreshViews")
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else if(request.action == "refreshContributed")
      {
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
         runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: false}, handler.showWalletBalance);
         runtime.sendMessage({action: "getLastContribution"}, handler.showLastContribution);
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
   },

   handleConfig: function(config)
   {
      if(config.paymentStatus == true)
      {
         var nextContribution = new Date(config.nextContribution);

         document.getElementById("payment_status_on").checked = true;
         document.getElementById("payment_off").style.display = "none";
         document.getElementById("payment_on").style.display = "block";
         document.getElementById("auto_include").checked = config.autoInclude;
         document.getElementById("hide_excluded").checked = config.showIncludedOnly;
         document.getElementById("hide_deleted").checked = config.showActiveOnly;
         document.getElementById("budget").value = config.budget;
         document.getElementById("contribution_next").textContent = nextContribution.toLocaleDateString();
         document.getElementById("settings_min_view_duration").value = config.minViewDuration;
         document.getElementById("settings_min_views").value = config.minViews;
         document.getElementById("settings_currency").value = config.budgetCurrency;
         document.getElementById("settings_log_level").value = config.logLevel;
      }
      else
      {
         document.getElementById("payment_status_off").checked = false;
         document.getElementById("payment_on").style.display = "none";
         document.getElementById("payment_off").style.display = "block";
      }

      handler.logLevel = config.logLevel;

      runtime.sendMessage({action: "getWalletStatus"}, handler.showWalletStatus);
      runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: false}, handler.showWalletBalance);
      runtime.sendMessage({action: "getLastContribution"}, handler.showLastContribution);
      runtime.sendMessage({action: "getViews"}, handler.showViews);
   },

   paymentStatusChanged: function(status)
   {
      handler.setPaymentStatus(status);
      runtime.sendMessage({action: "setPaymentStatus", status: status}, handler.handlePaymentStatusChanged);
   },

   setPaymentStatus(status)
   {
      if(status == true)
      {
         document.getElementById("payment_status_on").checked = true;
         document.getElementById("payment_off").style.display = "none";
         document.getElementById("payment_on").style.display = "block";
         document.getElementById("wallet_status").textContent = handler.getMessage("walletSettingUp");
         document.getElementById("wallet_balance").value = "-";
      }
      else
      {
         document.getElementById("payment_status_off").checked = false;
         document.getElementById("payment_on").style.display = "none";
         document.getElementById("payment_off").style.display = "block";
      }
   },

   handlePaymentStatusChanged: function(result)
   {
      if(result.success == true)
      {
         if(result.paymentStatus == true)
         {
            handler.showWalletStatus(result.walletStatus);

            var nextContribution = new Date(result.nextContribution);
            document.getElementById("contribution_next").textContent = nextContribution.toLocaleDateString();

            runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
            runtime.sendMessage({action: "getWalletStatus"}, handler.showWalletStatus);
            runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: false}, handler.showWalletBalance);
            runtime.sendMessage({action: "getLastContribution"}, handler.showLastContribution);
            runtime.sendMessage({action: "getViews"}, handler.showViews);
         }
      }
      else
      {
         handler.showMessage(handler.getMessage("paymentStatusNotChanged"));
         handler.setPaymentStatus(result.paymentStatus);
      }
   },

   autoIncludeChanged: function(status)
   {
      runtime.sendMessage({action: "setAutoInclude", status: status}, handler.handleAutoIncludeChanged);
   },

   handleAutoIncludeChanged: function(result)
   {
      if(result == false)
      {
         handler.showMessage(handler.getMessage("autoincludeNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   viewsFilterChanged: function(filter)
   {
      if(filter.length > 0)
      {
         handler.viewsFilter = filter;
      }
      else
      {
         handler.viewsFilter = null;
      }

      runtime.sendMessage({action: "getViews"}, handler.showViews);
   },

   hideExcludedChanged: function(status)
   {
      runtime.sendMessage({action: "setIncludedOnly", status: status}, handler.handleHideExcludedChanged);
   },

   handleHideExcludedChanged: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("hideExcludedNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   hideDeletedChanged: function(status)
   {
      runtime.sendMessage({action: "setActiveOnly", status: status}, handler.handleHideDeletedChanged);
   },

   handleHideDeletedChanged: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("hideDeletedNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   budgetChanged: function()
   {
      var budget = document.getElementById("budget").value;
      runtime.sendMessage({action: "setBudget", budget: budget}, handler.handleBudgetChanged);
   },

   handleBudgetChanged: function(result)
   {
      if(result == true)
      {
         handler.showAddFunds(handler.balance, handler.exchangeRate);
      }
      if(result == false)
      {
         handler.showMessage(handler.getMessage("budgetNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   includedChanged: function(siteId, status)
   {
      runtime.sendMessage({action: "setIncluded", siteId: siteId, status: status}, handler.handleIncludedChanged);
   },

   handleIncludedChanged: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("includedNotChanged"));
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
   },

   siteDeleted: function(siteId)
   {
      runtime.sendMessage({action: "deleteSite", siteId: siteId}, handler.handleSiteDeleted);
   },

   handleSiteDeleted: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("siteNotDeleted"));
      }
   },

   siteRestored: function(siteId)
   {
      runtime.sendMessage({action: "restoreSite", siteId: siteId}, handler.handleSiteRestored);
   },

   handleSiteRestored: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("siteNotRestored"));
      }
   },

   pinStatusChanged: function(siteId, status, share)
   {
      runtime.sendMessage({action: "setPinStatus", siteId: siteId, status: status, share: share}, handler.handlePinStatusChanged);
   },

   handlePinStatusChanged: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("pinStatusNotChanged"));
      }
   },

   pinShareChanged: function(siteId, share)
   {
      if(parseInt(share) != share || share < 0 || share > 100)
      {
         alert(handler.getMessage("pinShareInvalidNumber"));
         return false;
      }
      else
      {
         var pinnedShareSum = 0;
         var inputs = document.getElementsByTagName("input");

         for(var i = 0; i < inputs.length; i++)
         {
            if(inputs[i].id.match(/share_pinned/))
            {
               pinnedShareSum += parseInt(inputs[i].value);
            }
         }

         if(pinnedShareSum > 100)
         {
            alert(handler.getMessage("pinShareSumTooLarge"));
            return false;
         }
      }

      runtime.sendMessage({action: "setPinShare", siteId: siteId, share: parseInt(share)}, handler.handlePinShareChanged);
   },

   handlePinShareChanged: function(result)
   {
      if(result == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         handler.showMessage(handler.getMessage("pinShareNotChanged"));
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
   },

   showWalletStatus: function(status)
   {
      if(status == true)
      {
         var desc = handler.getMessage("walletReady");
      }
      else
      {
         var desc = handler.getMessage("walletNotCreated");
      }

      document.getElementById("wallet_status").textContent = desc;
   },

   showWalletBalance: function(data)
   {
      if(data.success == true)
      {
         handler.balance = data.balance.toFixed(2);
         handler.exchangeRate = data.exchangeRate;

         var currencyValue = (data.balance * data.exchangeRate).toFixed(2);
         var display = currencyValue + " " + data.budgetCurrency + "* (" + handler.balance + " " + data.balanceCurrency + ")";
         handler.showAddFunds(handler.balance, handler.exchangeRate);
         handler.updateBudgetList(data.budgetCurrency, data.exchangeRate);
      }
      else
      {
         var display = "-";
      }

      document.getElementById("wallet_balance").value = display;
   },

   updateBudgetList: function(currency, rate)
   {
      var budget = document.getElementById("budget");
      var options = budget.getElementsByTagName("option");

      for(var i = 0; i < options.length; i++)
      {
         var option = options[i];
         var bat = (option.value * 1/rate).toFixed(2);
         var display = option.value + " " + currency + " (" + bat + " BAT*)";
         option.textContent = display;
      }
   },

   showLastContribution: function(data)
   {
      if(data.success == true)
      {
         var lastContribution = new Date(data.timestamp);
         var display = lastContribution.toLocaleDateString();
      }
      else
      {
         var display = handler.getMessage("lastContributionNever");
      }

      document.getElementById("contribution_last").textContent = display;
   },

   showAddFunds(balance, exchangeRate)
   {
      var budget = document.getElementById("budget").value;

      if(balance * exchangeRate < budget)
      {
         var msg = handler.getMessage("balanceTooLow");
      }
      else
      {
         var msg = "";
      }

      document.getElementById("wallet_status").textContent = msg;
   },

   showViews: function(views)
   {
      function formatHostname(hostname)
      {
         var parts = hostname.split(".");
         return parts[parts.length - 2] + "." + parts[parts.length - 1];
      }

      function formatDuration(duration)
      {
         var date = new Date(null);
         date.setSeconds(duration);
         return date.toISOString().substr(11, 8);
      }

      function addTextCell(content, adjust)
      {
         var cell = document.createElement("td");

         if(view.status == handler.site_status_active)
         {
            cell.style.textAlign = adjust;
            cell.textContent = content;

            if(adjust == "left")
            {
               cell.style.paddingLeft = "10px";
            }
         }

         row.appendChild(cell);
      }

      function addVerifiedCell(view)
      {
         var cell = document.createElement("td");

         if(view.verified == true && view.status == handler.site_status_active)
         {
            cell.style.textAlign = "center";
            var verified = document.createElement("span");
            verified.className = "verified";
            verified.title = handler.getMessage("verified");
            cell.appendChild(verified);
         }

         row.appendChild(cell);
      }

      function addSiteCell(view)
      {
         var cell = document.createElement("td");

         var container = document.createElement("div");
         container.className = "ellipsis";
         container.style.width = "335px";

         var a = document.createElement("a");
         a.target = "_blank";
         a.textContent = view.name;

         if(view.status == handler.site_status_deleted)
         {
            var className = "site deleted";
         }
         else
         {
            var className = "site";
         }

         a.className = className;

         if(view.hostname.match(/youtube#channel/))
         {
            var matches = view.hostname.match(/youtube#channel:(.*)/);
            var channel = matches[1];
            var hostname = "youtube.com/channel/" + channel;
         }
         else if(view.hostname.match(/twitch#channel/))
         {
            var matches = view.hostname.match(/twitch#channel:(.*)/);
            var channel = matches[1];
            var hostname = "twitch.tv/" + channel;
         }
         else
         {
            var hostname = view.hostname;
         }

         a.href = "https://" + hostname;
         container.appendChild(a);
         cell.appendChild(container);

         cell.style.textAlign = "left";
         cell.style.paddingLeft = "10px";

         row.appendChild(cell);
      }

      function addIncludedCell(view)
      {
         var cell = document.createElement("td");

         if(view.status == handler.site_status_active)
         {
            cell.style.textAlign = "center";
            var label = document.createElement("label");
            label.className = "el-switch el-switch-yellow el-switch-sm";

            var span = document.createElement("span");
            span.className = "el-switch-style";

            var input = document.createElement("input");
            input.type = "checkbox";
            input.checked = view.included;
            input.onchange = function(){handler.includedChanged(view.siteId, this.checked);};

            if(view.pinned == true)
            {
               input.disabled = true;
            }

            label.appendChild(input);
            label.appendChild(span);

            cell.appendChild(label);
         }

         row.appendChild(cell);
      }

      function addShareCell(view)
      {
         var cell = document.createElement("td");

         if(view.status == handler.site_status_active)
         {
            var percentageInput = document.createElement("input");
            percentageInput.style.fontSize = "100%";
            percentageInput.style.width = "30px";
            percentageInput.style.textAlign = "right";
            percentageInput.onblur = function(){handler.pinShareChanged(view.siteId, this.value);};
            percentageInput.onkeyup = function(e){if(e.which == 13){this.blur();}};

            if(view.pinned == true)
            {
               percentageInput.value = view.share;
               percentageInput.id = "share_pinned_" + view.siteId;
               percentageInput.style.display = "block";
            }
            else
            {
               cell.textContent = view.share;
               cell.id = "share_" + view.siteId;
               percentageInput.style.display = "none";
            }

            cell.appendChild(percentageInput);
            cell.style.textAlign = "right";
         }

         row.appendChild(cell);
      }

      function addActionCell(view)
      {
         var cell = document.createElement("td");
         cell.style.whiteSpace = "nowrap";

         if(view.status == handler.site_status_active)
         {
            var pin = document.createElement("a");

            if(view.pinned == false)
            {
               var className = "pin pin_inactive";
               var message = "pin";
            }
            else
            {
               var className = "pin pin_active";
               var message = "unpin";
            }

            pin.className = className;
            pin.href = "#";
            pin.title = handler.getMessage(message);

            pin.onclick = function()
            {
               if(document.getElementById("share_" + view.siteId))
               {
                  var share = parseInt(document.getElementById("share_" + view.siteId).textContent);
               }

               handler.pinStatusChanged(view.siteId, !view.pinned, share);
            };

            cell.appendChild(pin);

            var trash = document.createElement("a");
            trash.className = "trash";
            trash.href = "#";
            trash.title = handler.getMessage("delete");
            trash.onclick = function(){handler.siteDeleted(view.siteId);};
            cell.appendChild(trash);
         }
         else
         {
            var restore = document.createElement("a");
            restore.className = "restore";
            restore.href = "#";
            restore.title = handler.getMessage("restore");
            restore.onclick = function(){handler.siteRestored(view.siteId);};

            cell.style.textAlign = "right";
            cell.appendChild(restore);
         }

         row.appendChild(cell);
      }

      var table = document.getElementById("views");
      var rows = table.getElementsByTagName("tr");

      for(var i = rows.length - 1; i >= 0; i--)
      {
         if(rows[i].className.match(/data/))
         {
            table.deleteRow(i);
         }
      }

      for(var i = 0; i < views.length; i++)
      {
         var view = views[i];

         if(handler.viewsFilter)
         {
            var regExp = new RegExp(".*" + handler.viewsFilter + ".*", "i");
         }

         if(!handler.viewsFilter || (handler.viewsFilter && view.name.match(regExp)))
         {
            var row = document.createElement("tr");
            row.className = "data";

            if(i % 2 != 0)
            {
               row.className += " second";
            }

            addVerifiedCell(view);
            addSiteCell(view);
            addIncludedCell(view);
            addTextCell(view.views, "right");
            addTextCell(formatDuration(Math.round(view.duration)), "center");
            addShareCell(view);
            addActionCell(view);
            table.appendChild(row);
         }
      }
   },

   openSettingsDialog: function()
   {
      var minViewDuration = document.getElementById("settings_min_view_duration");
      var unit = handler.getMessage("settingsSeconds");

      for(var i = 0; i < minViewDuration.options.length; i++)
      {
         var text = minViewDuration.options[i].value + " " + unit;
         minViewDuration.options[i].text = text;
      }

      var minViews = document.getElementById("settings_min_views");
      var unit = handler.getMessage("settingsVisit");
      var units = handler.getMessage("settingsVisits");

      for(var i = 0; i < minViews.options.length; i++)
      {
         if(minViews.options[i].value > 1)
         {
            var unitDesc = units;
         }
         else
         {
            var unitDesc = unit;
         }

         var text = minViews.options[i].value + " " + unitDesc;
         minViews.options[i].text = text;
      }

      document.getElementById("settings_dialog").style.display = "block";
   },

   minViewDurationChanged: function()
   {
      var duration = parseInt(document.getElementById("settings_min_view_duration").value);
      runtime.sendMessage({action: "setMinViewDuration", duration: duration}, handler.handleMinViewDurationChanged);
   },

   handleMinViewDurationChanged: function(response)
   {
      if(response == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
         handler.showMessage(handler.getMessage("minViewDurationNotChanged"));
      }
   },

   minViewsChanged: function()
   {
      var views = parseInt(document.getElementById("settings_min_views").value);
      runtime.sendMessage({action: "setMinViews", views: views}, handler.handleMinViewsChanged);
   },

   handleMinViewsChanged: function(response)
   {
      if(response == true)
      {
         runtime.sendMessage({action: "getViews"}, handler.showViews);
      }
      else
      {
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
         handler.showMessage(handler.getMessage("minViewsNotChanged"));
      }
   },

   openBackupDialog: function()
   {
      runtime.sendMessage({action: "getWalletPassphrase"}, handler.showWalletPassphrase);
      document.getElementById("backup_dialog").style.display = "block";
   },

   showWalletPassphrase: function(response)
   {
      if(response.success == true)
      {
         document.getElementById("backup_passphrase").textContent = response.passphrase;
      }
      else
      {
         handler.showMessage(handler.getMessage("passphraseNotDisplayed"));
      }
   },

   copyPassphrase: function()
   {
      var passphrase = document.getElementById("backup_passphrase").select();
      var result = document.execCommand("Copy");

      if(result == false)
      {
         handler.showMessage(handler.getMessage("passphraseNotCopied"));
      }
   },

   saveRecoveryFile: function()
   {
      var downloads = chrome.downloads || browser.downloads;
      var passphrase = document.getElementById("backup_passphrase").value;
      var text = handler.getMessage("recoveryFileTitle") + "\n\n" + handler.getMessage("recoveryFilePassphrase") + ":\n" + passphrase + "\n\n" + handler.getMessage("recoveryFileNote");
      var textBlob = new Blob([text]);

      downloads.download({url: URL.createObjectURL(textBlob), filename: "BATify_recovery.txt", saveAs: true});
   },

   recoverWallet: function()
   {
      var passphrase = document.getElementById("recovery_passphrase").value;
      document.getElementById("recovery_recover").style.cursor = "wait";
      runtime.sendMessage({action: "recoverWallet", passphrase: passphrase}, handler.handleWalletRecovered);
   },

   handleWalletRecovered: function(result)
   {
      handler.log("handleWalletRecovered: " + JSON.stringify(result), handler.log_level_debug);

      if(result.success == true)
      {
         handler.showMessage(handler.getMessage("walletRecovered"));
         document.getElementById("recovery_dialog").style.display = "none";
         document.getElementById("settings_dialog").style.display = "none";
         document.getElementById("recovery_passphrase").value = "";
         runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: false}, handler.showWalletBalance);
      }
      else
      {
         handler.showMessage(handler.getMessage("walletNotRecovered"));
      }

      document.getElementById("recovery_recover").style.cursor = "pointer";
   },

   budgetCurrencyChanged: function()
   {
      var currency = document.getElementById("settings_currency").value;
      runtime.sendMessage({action: "setBudgetCurrency", currency: currency}, handler.handleBudgetCurrencyChanged);
   },

   handleBudgetCurrencyChanged: function(response)
   {
      if(response == true)
      {
         runtime.sendMessage({action: "getWalletBalance", forceRateRefresh: true}, handler.showWalletBalance);
      }
      else
      {
         handler.showMessage(handler.getMessage("currencyNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   logLevelChanged: function()
   {
      var logLevel = parseInt(document.getElementById("settings_log_level").value);
      runtime.sendMessage({action: "setLogLevel", level: logLevel}, handler.handleLogLevelChanged);
   },

   handleLogLevelChanged: function(response)
   {
      if(response.success == true)
      {
         handler.logLevel = response.level;
      }
      else
      {
         handler.showMessage(handler.getMessage("logLevelNotChanged"));
         runtime.sendMessage({action: "getConfig"}, handler.handleConfig);
      }
   },

   openFundsCurrencyDialog: function(currency)
   {
      if(currency == "BTC")
      {
         currencyName = "Bitcoin";
         currencySymbol = currency;
      }
      else if(currency == "ETH")
      {
         currencyName = "Ethereum";
         currencySymbol = currency;
      }
      else if(currency == "BAT")
      {
         currencyName = "Basic Attention Token";
         currencySymbol = currency;
      }
      else if(currency == "LTC")
      {
         currencyName = "Litecoin";
         currencySymbol = currency;
      }

      var currency = document.getElementById("settings_currency").value;
      var budget = document.getElementById("budget").value + " " + currency;

      var text = handler.getMessage("fundsCurrencyDesc1", [currencyName, currencySymbol]);
      document.getElementById("funds_currency_desc_1").textContent = text;

      var text = handler.getMessage("fundsCurrencyHint1", [currencySymbol, budget]);
      document.getElementById("funds_currency_hint_1").textContent = text;

      document.getElementById("funds_currency_dialog").style.display = "block";
      runtime.sendMessage({action: "getAddress", currency: currencySymbol}, handler.handleAddress);
   },

   handleAddress: function(response)
   {
      if(response.success == true)
      {
         document.getElementById("currency_address").value = response.address;
      }
      else
      {
         handler.showMessage(handler.getMessage("addressNotDisplayed"));
      }
   },

   copyAddress: function()
   {
      var address = document.getElementById("currency_address").select();
      var result = document.execCommand("Copy");

      if(result == false)
      {
         handler.showMessage(handler.getMessage("addressNotCopied"));
      }
   },

   openHistoryDialog: function()
   {
      document.getElementById("history_dialog").style.display = "block";
      runtime.sendMessage({action: "getHistory"}, handler.showHistory);
   },

   showHistory: function(response)
   {
      function addTextCell(row, content, adjust)
      {
         var cell = document.createElement("td");
         cell.textContent = content;
         cell.style.textAlign = adjust;

         if(adjust == "left")
         {
            cell.style.paddingLeft = "10px";
         }

         row.appendChild(cell);
      }

      function addDetailsCell(row, id)
      {
         var cell = document.createElement("td");
         cell.style.textAlign = "center";

         var details = document.createElement("a");
         details.href = "#";
         details.className = "magnifier";
         details.title = handler.getMessage("historyDetails");
         details.onclick = function(){handler.openHistoryDetailsDialog(id);};

         cell.appendChild(details);
         row.appendChild(cell);
      }

      if(response.success == true)
      {
         if(response.contributions.length > 0)
         {
            var table = document.getElementById("history_contributions");
            var rows = table.getElementsByTagName("tr");

            for(var i = rows.length - 1; i >= 0; i--)
            {
               if(rows[i].className.match(/data/))
               {
                  table.deleteRow(i);
               }
            }

            for(var i = 0; i < response.contributions.length; i++)
            {
               var contribution = response.contributions[i];
               var row = document.createElement("tr");
               row.className = "data";

               if(i % 2 != 0)
               {
                  row.className += " second";
               }

               var date = new Date(contribution.date);
               addTextCell(row, date.toLocaleDateString(), "left");
               addTextCell(row, contribution.amount, "right");
               addDetailsCell(row, contribution.id);
               table.appendChild(row);
            }

            document.getElementById("history_not_contributed").style.display = "none";
            document.getElementById("history_contributed").style.display = "block";
         }
         else
         {
            document.getElementById("history_contributed").style.display = "none";
            document.getElementById("history_not_contributed").style.display = "block";
         }
      }
      else
      {
         handler.showMessage(handler.getMessage("historyNotDisplayed"));
      }
   },

   openHistoryDetailsDialog: function(id)
   {
      document.getElementById("history_details_dialog").style.display = "block";
      runtime.sendMessage({action: "getHistoryDetails", id: id}, handler.showHistoryDetails);
   },

   showHistoryDetails: function(response)
   {
      function addTextCell(row, content, adjust)
      {
         var cell = document.createElement("td");
         cell.textContent = content;
         cell.style.textAlign = adjust;

         if(adjust == "left")
         {
            cell.style.paddingLeft = "10px";
         }

         row.appendChild(cell);
      }

      function addSiteCell(row, site)
      {
         var cell = document.createElement("td");

         var a = document.createElement("a");
         a.target = "_blank";
         a.textContent = site.name;
         a.className = "site";

         if(site.hostname.match(/youtube#channel/))
         {
            var matches = site.hostname.match(/youtube#channel:(.*)/);
            var channel = matches[1];
            var hostname = "youtube.com/channel/" + channel;
         }
         else if(site.hostname.match(/twitch#channel/))
         {
            var matches = site.hostname.match(/twitch#channel:(.*)/);
            var channel = matches[1];
            var hostname = "twitch.tv/" + channel;
         }
         else
         {
            var hostname = site.hostname;
         }

         a.href = "https://" + hostname;
         cell.appendChild(a);

         cell.style.textAlign = "left";
         cell.style.paddingLeft = "10px";

         row.appendChild(cell);
      }

      if(response.success == true)
      {
         var date = new Date(response.date);
         document.getElementById("history_details_date").textContent = date.toLocaleDateString() + " " + date.toLocaleTimeString();
         document.getElementById("history_details_amount").textContent = response.amount;

         var table = document.getElementById("history_details_contribution_details");
         var rows = table.getElementsByTagName("tr");

         for(var i = rows.length - 1; i >= 0; i--)
         {
            if(rows[i].className.match(/data/))
            {
               table.deleteRow(i);
            }
         }

         for(var i = 0; i < response.sites.length; i++)
         {
            var site = response.sites[i];
            var row = document.createElement("tr");
            row.className = "data";

            if(i % 2 != 0)
            {
               row.className += " second";
            }

            addTextCell(row, i + 1, "right");
            addSiteCell(row, site);
            addTextCell(row, site.share, "right");
            addTextCell(row, site.amount, "right");
            table.appendChild(row);
         }
      }
      else
      {
         handler.showMessage(handler.getMessage("historyDetailsNotDisplayed"));
      }
   },

   showMessage: function(message)
   {
      document.getElementById("message").textContent = message;
      document.getElementById("message_dialog").style.display = "block";
   },

   getMessage: function(name, substitutions)
   {
      var message = i18n.getMessage(name, substitutions);
      return message;
   },

   getBrowser: function()
   {
      var agent = navigator.userAgent;

      if(agent.match(/OPR/))
      {
         var browser = "Opera";
      }
      else if(agent.match(/Chrome/))
      {
         var browser = "Chrome";
      }
      else if(agent.match(/Firefox/))
      {
         var browser = "Firefox";
      }

      return browser;
   },

   escapeHtml: function(text)
   {
      if(text)
      {
         text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
         text = text.replace(/&lt;p&gt;/g, "<p>").replace(/&lt;\/p&gt;/g, "</p>").replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>").replace(/&lt;br\s*\/&gt;/g, "<br/>");
      }

      return text;
   },

   log: function(message, level)
   {
      if(level >= handler.logLevel)
      {
         console.log("BATify: frontend: handler." + message);
      }
   }
}

window.addEventListener("DOMContentLoaded", handler.init, true);