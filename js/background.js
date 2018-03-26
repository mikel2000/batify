/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../LICENSE for licensing details
*/

const runtime = chrome.runtime || browser.runtime;
const extension = chrome.extension || browser.extension;
const tabs = chrome.tabs || browser.tabs;
const webNavigation = chrome.webNavigation || browser.webNavigation;
const notifications = chrome.notifications || browser.notifications;
const storage = chrome.storage || browser.storage;
const i18n = chrome.i18n || browser.i18n;
const browserAction = chrome.browserAction || browser.browserAction;

var bkg =
{
   config: null,

   init: function()
   {
      utils.getStorageData({config:
      {
         paymentStatus: false,
         budget: ledger.default_budget,
         autoInclude: true,
         showIncludedOnly: true,
         showActiveOnly: true,
         minViewDuration: ledger.default_min_view_duration,
         minViews: ledger.default_min_views,
         budgetCurrency: ledger.default_budget_currency,
         logLevel: utils.log_level_debug
      }}).then(function(config)
      {
         bkg.config = config.config;
         return ledger.init();
      }).then(function()
      {
         return db.init();
      }).then(function()
      {
         return votingCommitter.init(ledger.conf_voting_committer_interval);
      }).then(function()
      {
         return siteUpdater.init(ledger.conf_site_updater_interval);
      }).then(function()
      {
         return viewStorer.init(ledger.conf_view_storer_interval);
      }).then(function()
      {
         return contributor.init(ledger.conf_contributor_interval);
      }).then(function()
      {
         return tabHandler.init();
      }).then(function()
      {
         runtime.onMessage.addListener(bkg.handleMessage);
         return bkg.handleInstall();
      }).then(function()
      {
         utils.log("bkg.init finished", utils.log_level_debug);
      }).catch(function(e)
      {
         console.log("Batify: ERROR: init failed: " + e);
      });
   },

   handleInstall: function()
   {
      return new Promise(function(resolve, reject)
      {
         var manifest = runtime.getManifest();

         utils.getStorageData({version: "0"}).then(function(data)
         {
            // new installation
            if(data.version == "0")
            {
               utils.setStorageData({version: manifest.version}).then(function()
               {
                  return tabs.create({url: extension.getURL("index.html"), "active": true});
               }).then(function()
               {
                  resolve();
               }).catch(function(e)
               {
                  utils.log("bkg.handleInstall: ERROR: failed: " + e, utils.log_level_error);
                  resolve();
               });
            }
            // update
            else if(data.version != manifest.version)
            {
               utils.setStorageData({version: manifest.version}).then(function()
               {
                  resolve();
               }).catch(function(e)
               {
                  utils.log("bkg.handleInstall: ERROR: failed: " + e, utils.log_level_error);
                  resolve();
               });
            }
            else
            {
               resolve();
            }
         });
      });
   },

   handleMessage: function(request, sender, sendResponse)
   {
      utils.log("bkg.handleMessage: " + JSON.stringify(request), utils.log_level_debug);

      if(request.action == "getConfig")
      {
         sendResponse(bkg.config);
         return true;
      }
      else if(request.action == "getAddress")
      {
         if(ledger.credentials.addresses[request.currency])
         {
            sendResponse({address: ledger.credentials.addresses[request.currency], success: true});
         }
         else
         {
            sendResponse({success: false});
         }

         return true;
      }
      else if(request.action == "getViews")
      {
         db.getViews(bkg.config.showIncludedOnly, bkg.config.showActiveOnly).then(function(views)
         {
            sendResponse(views);
         });

         return true;
      }
      else if(request.action == "setPaymentStatus")
      {
         ledger.setPaymentStatus(request.status).then(function()
         {
            sendResponse(
            {
               paymentStatus: request.status,
               walletStatus: ledger.getWalletStatus(),
               nextContribution: bkg.config.nextContribution,
               success: true
            });
         }).catch(function(e)
         {
            sendResponse({paymentStatus: !request.status, success: false});
         });

         return true;
      }
      else if(request.action == "setAutoInclude")
      {
         ledger.setAutoInclude(request.status).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setIncludedOnly")
      {
         ledger.setIncludedOnly(request.status).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setActiveOnly")
      {
         ledger.setActiveOnly(request.status).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setBudget")
      {
         ledger.setBudget(request.budget).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setIncluded")
      {
         ledger.setSiteIncluded(request.siteId, request.status).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "deleteSite")
      {
         ledger.deleteSite(request.siteId).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "restoreSite")
      {
         ledger.restoreSite(request.siteId).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setPinStatus")
      {
         ledger.setSitePinStatus(request.siteId, request.status, request.share).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setPinShare")
      {
         ledger.setSitePinShare(request.siteId, request.share).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "getWalletStatus")
      {
         sendResponse(ledger.getWalletStatus());
         return true;
      }
      else if(request.action == "getWalletBalance")
      {
         ledger.getWalletBalance(request.forceRateRefresh).then(function(balance)
         {
            balance.success = true;
            sendResponse(balance);
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "getLastContribution")
      {
         db.getLastContribution().then(function(contribution)
         {
            if(contribution)
            {
               contribution.success = true;
               sendResponse(contribution);
            }
            else
            {
               sendResponse({success: false});
            }
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "getWalletPassphrase")
      {
         ledger.getWalletPassphrase().then(function(passphrase)
         {
            sendResponse({passphrase: passphrase, success: true});
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "recoverWallet")
      {
         ledger.recoverWallet(request.passphrase).then(function()
         {
            sendResponse({success: true});
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "setMinViewDuration")
      {
         ledger.setMinViewDuration(request.duration).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setMinViews")
      {
         ledger.setMinViews(request.views).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "setBudgetCurrency")
      {
         ledger.setBudgetCurrency(request.currency).then(function()
         {
            sendResponse(true);
         }).catch(function(e)
         {
            sendResponse(false);
         });

         return true;
      }
      else if(request.action == "getHistory")
      {
         ledger.getContributionHistory().then(function(contributions)
         {
            var result = {contributions: contributions, success: true};
            sendResponse(result);
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "getHistoryDetails")
      {
         ledger.getContributionHistoryDetails(request.id).then(function(contribution)
         {
            contribution.success = true;
            sendResponse(contribution);
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "setLogLevel")
      {
         ledger.setLogLevel(request.level).then(function()
         {
            sendResponse({success: true, level: bkg.config.logLevel});
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
      else if(request.action == "storeView")
      {
         tabHandler.storeView(request.view, true).then(function()
         {
            sendResponse({success: true});
         }).catch(function(e)
         {
            sendResponse({success: false});
         });

         return true;
      }
   },

   sendMessage: function(action)
   {
      runtime.sendMessage({action: action}, function(response)
      {
         if(runtime.lastError)
         {
         }
      });
   }
}

var tabHandler =
{
   domain_internal: "internal",

   cache: [],
   active: null,

   init: function()
   {
      utils.log("tabHandler.init: start initializing...", utils.log_level_debug);
      tabs.onActivated.addListener(tabHandler.activated);
      webNavigation.onBeforeNavigate.addListener(tabHandler.resetVerified);
      webNavigation.onCompleted.addListener(tabHandler.updated);
      webNavigation.onHistoryStateUpdated.addListener(tabHandler.historyUpdated);
      tabs.onRemoved.addListener(tabHandler.removed);
      runtime.onMessage.addListener(tabHandler.handleMessage);
      utils.log("tabHandler.init: initialized -> next", utils.log_level_debug);
   },

   handleMessage: function(request, sender, sendResponse)
   {
      utils.log("tabHandler.handleMessage: id: " + sender.tab.id + ", " + JSON.stringify(request), utils.log_level_debug);

      if(request.action == "setData")
      {
         tabHandler.cache[sender.tab.id].elapsed += request.elapsed;
         utils.log("tabHandler.handleMessage: id: " + sender.tab.id + ", setData: total: " + tabHandler.cache[sender.tab.id].elapsed + ", elapsed: " + request.elapsed, utils.log_level_debug);
         tabHandler.cache[sender.tab.id].channel = request.channel;
      }
      else if(request.action == "storeView")
      {
         tabHandler.storeView(request.view);
      }
   },

   activated: function(tab)
   {
      utils.log("tabHandler.activated: " + tab.tabId, utils.log_level_debug);

      tabs.get(tab.tabId, function(tab)
      {
         /* store view for tab which is deactivated */
         if(tabHandler.active)
         {
            utils.log("tabHandler.activated: tab " + tabHandler.active + " is deactivated", utils.log_level_debug);
            tabHandler.resetVerified();
            var tabDeactive = tabHandler.cache[tabHandler.active];

            tabHandler.sendMessage(tabDeactive.id, {action: "deactivate"}).then(function(response)
            {
               if(tabDeactive.domain != tabHandler.domain_internal)
               {
                  tabDeactive.elapsed += response.elapsed;
                  utils.log("tabHandler.activated: deactivated tab: " + tabDeactive.url + ", response: " + JSON.stringify(response) + ", total: " + tabDeactive.elapsed, utils.log_level_debug);
                  tabDeactive.channel = response.channel;
                  return tabHandler.storeView(tabDeactive, true);
               }
            }).catch(function(e)
            {
            });
         }

         /* tab not in cache -> add it */
         if(!tabHandler.cache[tab.id])
         {
            utils.log("tabHandler.activated: tab id: " + tab.id + ", url: " + tab.url + ". not in cache -> add it", utils.log_level_debug);

            tabHandler.cache[tab.id] =
            {
               id: tab.id,
               url: tab.url,
               domain: tabHandler.getDomain(tab.url, true),
               name: tabHandler.getDomain(tab.url, true),
               elapsed: null
            };

            tabHandler.active = tab.id;
         }
         /* tab reactivated */
         else
         {
            utils.log("tabHandler.activated: tab " + tab.id + " was reactivated: " + JSON.stringify(tabHandler.cache[tab.id]), utils.log_level_debug);
            tabHandler.cache[tab.id].elapsed = null;
            tabHandler.active = tab.id;
         }

         tabs.sendMessage(tab.id, {action: "activate", id: tab.id, logLevel: bkg.config.logLevel});
         tabHandler.displayVerified(tab.id);
      });
   },

   updated: function(details)
   {
      function setTabData(id, url, resetElapsed)
      {
         var storeTab = tabHandler.cache[id];
         storeTab.id = id;
         storeTab.url = url;
         storeTab.domain = tabHandler.getDomain(url, true);
         storeTab.name = tabHandler.getDomain(url, true);

         if(resetElapsed == true)
         {
            storeTab.elapsed = null;
         }

         tabHandler.cache[id] = storeTab;
      }

      function isNewDomain(id, url)
      {
         if(tabHandler.getDomain(url, true) != tabHandler.cache[id].domain ||
            (url.match(/https:\/\/www\.youtube\.com\/watch/) && url != tabHandler.cache[id].url) ||
            (url.match(/https:\/\/www\.twitch\.tv\/videos/) && url != tabHandler.cache[id].url))
         {
            return true;
         }
         else
         {
            return false;
         }
      }

      if(details.frameId == 0)
      {
         utils.log("tabHandler.updated: " + details.tabId + ", details: " + JSON.stringify(details) + ", old: " + tabHandler.cache[details.tabId].url + ", new: " + details.url, utils.log_level_debug);

         /* domain or channel changed */
         if(isNewDomain(details.tabId, details.url))
         {
            utils.log("tabHandler.updated: domain/channel changed. old: " + tabHandler.cache[details.tabId].domain + ", new: " + tabHandler.getDomain(details.url, true), utils.log_level_debug);

            /* old domain is external domain -> store view */
            if(tabHandler.cache[details.tabId].domain != tabHandler.domain_internal)
            {
               utils.log("tabHandler.updated: old domain is external (" + tabHandler.cache[details.tabId].url + ") -> store view", utils.log_level_debug);
               var storeTab = tabHandler.cache[details.tabId];

               tabHandler.storeView(storeTab, true).then(function()
               {
                  setTabData(details.tabId, details.url, true);
                  tabHandler.displayVerified(details.tabId);
               }).catch(function(e)
               {
                  setTabData(details.tabId, details.url, true);
                  tabHandler.displayVerified(details.tabId);
               });
            }
            /* old domain is internal domain -> don't store view */
            else
            {
               utils.log("tabHandler.updated: old domain is internal (" + tabHandler.cache[details.tabId].url + ") -> view not stored", utils.log_level_debug);
               setTabData(details.tabId, details.url, true);
               tabHandler.displayVerified(details.tabId);
            }
         }
         /* domain/channel not changed -> don't store view, cumulate elapsed */
         else
         {
            utils.log("tabHandler.updated: domain/channel not changed -> view not stored, elapsed cumulated", utils.log_level_debug);
            // don't reset elapsed -> pass "false"
            setTabData(details.tabId, details.url, false);
            tabHandler.displayVerified(details.tabId);
         }
      }
   },

   historyUpdated: function(details)
   {
      function setTabData(id, url)
      {
         var storeTab = tabHandler.cache[id];
         storeTab.id = id;
         storeTab.url = url;
         storeTab.domain = tabHandler.getDomain(url, true);
         storeTab.name = tabHandler.getDomain(url, true);
         storeTab.elapsed = null;

         tabHandler.cache[id] = storeTab;
      }

      utils.log("tabHandler.historyUpdated: " + JSON.stringify(details) + ", previous domain: " + tabHandler.getDomain(tabHandler.cache[details.tabId].url, false) + ", previous url: " + tabHandler.cache[details.tabId].url, utils.log_level_debug);

      // top-frame, same domains without path, different urls
      if(details.frameId == 0 &&
         tabHandler.getDomain(details.url, false) == tabHandler.getDomain(tabHandler.cache[details.tabId].url, false) &&
         details.url != tabHandler.cache[details.tabId].url)
      {
         utils.log("tabHandler.historyUpdated: conditions matched (top-frame, same domain, different url) -> send deactivate", utils.log_level_debug);
         utils.log("reset: historyUpdated", utils.log_level_debug);
         tabHandler.resetVerified();
         var storeTab = tabHandler.cache[details.tabId];

         tabHandler.sendMessage(details.tabId, {action: "deactivate"}).then(function(response)
         {
            utils.log("tabHandler.historyUpdated: response: " + JSON.stringify(response), utils.log_level_debug);
            storeTab.elapsed = response.elapsed;
            storeTab.channel = response.channel;
            return tabHandler.storeView(storeTab, true);
         }).then(function()
         {
            setTabData(details.tabId, details.url);
            tabs.sendMessage(details.tabId, {action: "activate", id: details.tabId, logLevel: bkg.config.logLevel});
            tabHandler.displayVerified(details.tabId);
         }).catch(function(e)
         {
            setTabData(details.tabId, details.url);
            tabs.sendMessage(details.tabId, {action: "activate", id: details.tabId, logLevel: bkg.config.logLevel});
            tabHandler.displayVerified(details.tabId);
         });
      }
      else
      {
         utils.log("tabHandler.historyUpdated: conditions not matched (top-frame, same domain, different url) -> nothing to do", utils.log_level_debug);
      }
   },

   removed: function(tab)
   {
      utils.log("tabHandler.removed: " + tab, utils.log_level_debug);
      var storeTab = tabHandler.cache[tab];

      /* external domain -> store view */
      if(storeTab.domain != tabHandler.domain_internal)
      {
         tabHandler.storeView(storeTab, true);
      }
      /* internal domain -> don't store view */
      else
      {
         utils.log("tabHandler.removed: internal domain (" + storeTab.url + ") -> view not stored", utils.log_level_debug);
      }

      tabHandler.active = null;
      tabHandler.cache[tab] = null;
      tabHandler.resetVerified();
   },

   getDomain: function(url, includePath)
   {
      if(url.match(/(http|https):\/\/[^0-9.]+/))
      {
         var a = document.createElement("a");
         a.href = url;

         if(includePath == true &&
            (url.match(/https:\/\/www\.youtube\.com\/watch/) ||
             url.match(/https:\/\/www.twitch\.tv\/videos/)))
         {
            var domain = a.hostname + a.pathname;

            if(a.query)
            {
               domain = domain + a.query;
            }

            return domain;
         }
         else
         {
            return a.hostname;
         }
      }
      else
      {
         return tabHandler.domain_internal;
      }
   },

   storeView: function(view, addUnstored)
   {
      return new Promise(function(resolve, reject)
      {
         utils.log("tabHandler.storeView: begin storing: " + JSON.stringify(view), utils.log_level_debug);

         // clone view to avoid changes in the original object
         var storeView = JSON.parse(JSON.stringify(view));

         if(storeView.elapsed == null)
         {
            utils.log("tabHandler.storeView: ERROR: elapsed is null: " + JSON.stringify(storeView), utils.log_level_error);
            resolve();
            return;
         }
         else if(storeView.elapsed == 0)
         {
            utils.log("tabHandler.storeView: elapsed is 0 -> view not stored", utils.log_level_error);
            resolve();
            return;
         }

         if(storeView.domain.match(/www\.youtube\.com\/(watch|embed)/) ||
            storeView.domain.match(/www\.twitch\.tv\/videos/))
         {
            if(storeView.channel)
            {
               var site = tabHandler.getSiteData(storeView.domain, storeView.channel);
               storeView.domain = site.domain;
               storeView.name = site.name;
            }
            else
            {
               utils.log("tabHandler.storeView: ERROR: view couldn't be stored: channel is not set: " + JSON.stringify(storeView), utils.log_level_error);
               reject();
               return;
            }
         }

         ledger.checkSite(storeView.domain, false).then(function(site)
         {
            utils.log("tabHandler.storeView: checked: " + JSON.stringify(site), utils.log_level_debug);

            storeView.domain = site.domain;
            storeView.included = site.included;
            storeView.verified = site.verified;

            if(!storeView.name)
            {
               storeView.name = site.domain;
            }

            return db.storeView(storeView);
         }).then(function()
         {
            utils.log("tabHandler.storeView: view successfully stored: " + JSON.stringify(storeView), utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("tabHandler.storeView: ERROR: view couldn't be stored: " + JSON.stringify(storeView) + ", error: " + e, utils.log_level_error);

            if(addUnstored == true)
            {
               utils.log("tabHandler.storeView: try to store as unstored view", utils.log_level_debug);

               db.addUnstoredView(storeView).then(function()
               {
                  resolve();
               }).catch(function(e)
               {
                  reject();
               });
            }
            else
            {
               reject();
            }
         });
      });
   },

   displayVerified: function(tabId)
   {
      function getChannel(domain)
      {
         return new Promise(function(resolve, reject)
         {
            if(domain.match(/www\.youtube\.com\/(watch|embed)/) ||
               domain.match(/www\.twitch\.tv\/videos/))
            {
               tabHandler.sendMessage(tabHandler.active, {action: "getChannel"}).then(function(channel)
               {
                  if(channel)
                  {
                     resolve(channel);
                  }
                  else
                  {
                     utils.log("tabHandler.displayVerified: no channel got although one exists -> exit", utils.log_level_debug);
                     reject();
                  }
               }).catch(function(e)
               {
                  utils.log("tabHandler.displayVerified: getting channel failed: " + e, utils.log_level_debug);
                  reject();
               });
            }
            else
            {
               resolve(null);
            }
         });
      }

      var domain = tabHandler.getDomain(tabHandler.cache[tabHandler.active].url, true);

      getChannel(domain).then(function(channel)
      {
         utils.log("tabHandler.displayVerified: domain: " + domain + ", channel: " + JSON.stringify(channel), utils.log_level_debug);

         if(domain != tabHandler.domain_internal)
         {
            var site = tabHandler.getSiteData(domain, channel);

            ledger.checkSite(site.domain, false).then(function(data)
            {
               site.domain = data.domain;
               site.included = data.included;
               site.verified = data.verified;

               if(!site.name)
               {
                  site.name = data.domain;
               }

               return db.addSite(site);
            }).then(function(data)
            {
               if(tabId == tabHandler.active)
               {
                  if(data.verified)
                  {
                     browserAction.setBadgeText({text: "✓"});
                     browserAction.setBadgeBackgroundColor({color: "#72BF44"});
                  }
                  else
                  {
                     tabHandler.resetVerified();
                  }
               }
            }).catch(function(e)
            {
               tabHandler.resetVerified();
            });
         }
         else
         {
            tabHandler.resetVerified();
         }
      }).catch(function(e)
      {
         tabHandler.resetVerified();
      });
   },

   resetVerified: function(details)
   {
      if(!details || (details && details.frameId == 0))
      {
         browserAction.setBadgeText({text: ""});
      }
   },

   getSiteData: function(domain, channel)
   {
      var site = {};

      if(channel)
      {
         if(domain.match(/youtube/))
         {
            var providerName = "youtube";
            var providerDesc = "YouTube";
         }
         else if(domain.match(/twitch/))
         {
            var providerName = "twitch";
            var providerDesc = "Twitch";
         }

         site.domain = providerName + "#channel:" + channel.id;
         site.name = channel.name + " on " + providerDesc;
      }
      else
      {
         site.domain = domain;
      }

      return site;
   },

   sendMessage: function(id, message)
   {
      return new Promise(function(resolve, reject)
      {
         tabs.sendMessage(id, message, function(response)
         {
            if(runtime.lastError)
            {
               utils.log("tabHandler.sendMessage: ERROR: sendMessage failed: id: " + id + ", message: " + JSON.stringify(message) + ", error: " + JSON.stringify(runtime.lastError), utils.log_level_error);
               reject();
            }
            else
            {
               resolve(response);
            }
         });
      });
   }
}

var db =
{
   init: function()
   {
      utils.log("db.init: start initializing database...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         storageDb.init("batify", utils.log_level_error).then(function()
         {
            var tables = [];
            tables.push({name: "site", fields: ["hostname", "name", "included", "verified", "pinned", "pinnedShare", "status"]});
            tables.push({name: "domain", fields: ["name", "publisher"]});
            tables.push({name: "view", fields: ["id_site", "duration", "timestamp"]});
            tables.push({name: "view_unstored", fields: ["data"]});
            tables.push({name: "contribution", fields: ["data", "errorCount", "status", "timestamp"]});

            return storageDb.createTables(tables);
         }).then(function()
         {
            utils.log("db.init: database initialized -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("db.init: ERROR: database initialization failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   storeView: function(view)
   {
      return new Promise(function(resolve, reject)
      {
         if(bkg.config.paymentStatus == true)
         {
            utils.log("db.storeView: begin storing: " + JSON.stringify(view), utils.log_level_debug, utils.log_level_debug);

            db.addSite(view).then(function(site)
            {
               utils.log("db.storeView: site: " + JSON.stringify(site), utils.log_level_debug);

               return storageDb.insert
               (
                  "view",
                  {id_site: site.id, duration: view.elapsed, timestamp: Date.now()}
               );
            }).then(function()
            {
               utils.log("db.storeView: view successfully stored: " + JSON.stringify(view), utils.log_level_debug);
               bkg.sendMessage("refreshViews");
               resolve();
            }).catch(function(e)
            {
               utils.log("db.storeView: ERROR: storing view failed: " + JSON.stringify(view) + ", message: " + JSON.stringify(e), utils.log_level_error);
               reject();
            });
         }
         else
         {
            return Promise.resolve();
         }
      });
   },

   addSite: function(site)
   {
      return new Promise(function(resolve, reject)
      {
         db.getSites({hostname: site.domain}).then(function(sites)
         {
            if(sites.length == 0)
            {
               storageDb.insert
               (
                  "site",
                  {
                     hostname: site.domain,
                     name: site.name,
                     included: site.included,
                     verified: site.verified,
                     pinned: false,
                     pinnedShare: 0,
                     status: ledger.site_status_active
                  }
               ).then(function(result)
               {
                  utils.log("db.addSite: new site added: " + JSON.stringify(result), utils.log_level_debug);
                  resolve(result);
               }).catch(function(e)
               {
                  utils.log("db.addSite: ERROR: addSite failed: site: " + JSON.stringify(site) + ", error: " + e, utils.log_level_error);
                  reject();
               });
            }
            else
            {
               utils.log("db.addSite: site already exists -> not added: " + JSON.stringify(sites[0]), utils.log_level_debug);
               resolve(sites[0]);
            }
         }).catch(function(e)
         {
            utils.log("db.addSite: ERROR: addSite failed: site: " + JSON.stringify(site) + ", error: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   storeSite: function(site)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.update("site", site.updates, {id: site.siteId}).then(function()
         {
            utils.log("db.storeSite: site successfully changed", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("db.storeSite: ERROR: storeSite failed: " + JSON.stringify(e), utils.log_level_error);
            reject();
         });
      });
   },

   getSites: function(where)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.select("site", where).then(function(result)
         {
            resolve(result);
         }).catch(function(e)
         {
            utils.log("db.getSites: ERROR: sites couldn't be selected: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   addDomain: function(domain)
   {
      return new Promise(function(resolve, reject)
      {
         db.getDomain(domain.name).then(function(result)
         {
            if(!result)
            {
               storageDb.insert("domain", domain).then(function(result)
               {
                  utils.log("db.addDomain: new domain added: " + JSON.stringify(result), utils.log_level_debug);
                  resolve(result);
               }).catch(function(e)
               {
                  utils.log("db.addDomain: ERROR: addDomain failed: domain: " + JSON.stringify(domain) + ", error: " + e, utils.log_level_error);
                  reject();
               });
            }
            else
            {
               utils.log("db.addDomain: domain already exists -> not added: " + JSON.stringify(result), utils.log_level_debug);
               resolve(result);
            }
         }).catch(function(e)
         {
            utils.log("db.addDomain: ERROR: addDomain failed: domain: " + JSON.stringify(domain) + ", error: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getDomain: function(domain)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.select("domain", {name: domain}).then(function(result)
         {
            resolve(result[0]);
         }).catch(function(e)
         {
            utils.log("db.getPublisher: ERROR: publisher couldn't be selected: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getViews: function(includedOnly, activeOnly)
   {
      function compare(a, b)
      {
         var result = 0;

         if(a.status == ledger.site_status_deleted)
         {
            result = 1;
         }
         else if(b.status == ledger.site_status_deleted)
         {
            result = -1;
         }
         else if(a.pinned == true && b.pinned == true)
         {
            if(a.share > b.share)
            {
               result = -1;
            }
            else if(a.share < b.share)
            {
               result = 1;
            }
         }
         else if(a.pinned == true)
         {
            result = -1;
         }
         else if(b.pinned == true)
         {
            result = 1;
         }
         else if(a.included == true && b.included == true)
         {
            if(a.duration < b.duration)
            {
               result = 1;
            }
            else if(a.duration > b.duration)
            {
               result = -1;
            }
         }
         else if(a.included == true)
         {
            result = -1;
         }
         else if(b.included == true)
         {
            result = 1;
         }
         else
         {
            if(a.duration < b.duration)
            {
               result = 1;
            }
            else if(a.duration > b.duration)
            {
               result = -1;
            }
         }

         return result;
      }

      return new Promise(function(resolve, reject)
      {
         var pinnedSites;
         var viewSites = [];
         var viewsOut = [];

         db.getSites({status: ledger.site_status_active, pinned: true}).then(function(sites)
         {
            pinnedSites = sites;
            var whereSite = {status: ledger.site_status_active};

            if(includedOnly == true)
            {
               whereSite.included = true;
            }

            return db.getSites(whereSite);
         }).then(function(sites)
         {
            var ids = [];

            for(var i = 0; i < sites.length; i++)
            {
               ids.push(sites[i].id);
               viewSites[sites[i].id] = sites[i];
            }

            return storageDb.select("view", {id_site: ids, duration: {">=": bkg.config.minViewDuration}});
         }).then(function(views)
         {
            var viewsBuffer = [];
            var viewsBufferFinal = [];

            /* aggregate views */
            for(var i = 0; i < views.length; i++)
            {
               var view = views[i];

               if(!viewsBuffer[view.id_site])
               {
                  viewsBuffer[view.id_site] =
                  {
                     siteId: view.id_site,
                     hostname: viewSites[view.id_site].hostname,
                     name: viewSites[view.id_site].name,
                     included: viewSites[view.id_site].included,
                     verified: viewSites[view.id_site].verified,
                     pinned: viewSites[view.id_site].pinned,
                     pinnedShare: viewSites[view.id_site].pinnedShare,
                     status: viewSites[view.id_site].status,
                     views: 0,
                     duration: 0
                  };
               }

               viewsBuffer[view.id_site].views++;
               viewsBuffer[view.id_site].duration += view.duration;
            }

            /* add pinned sites without views */
            for(var i = 0; i < pinnedSites.length; i++)
            {
               var pinned = pinnedSites[i];
               var found = false;

               for(id_site in viewsBuffer)
               {
                  if(id_site == pinned.id)
                  {
                     found = true;
                     break;
                  }
               }

               if(found == false)
               {
                  viewsBuffer[pinned.id] =
                  {
                     siteId: pinned.id,
                     hostname: pinned.hostname,
                     name: pinned.name,
                     included: true,
                     pinned: pinned.pinned,
                     pinnedShare: pinned.pinnedShare,
                     status: ledger.site_status_active,
                     views: 0,
                     duration: 0
                  };
               }
            }

            /* remove views with view count < minViews which are not pinned and calculate sums */
            var sharePinnedSum = 0;
            var durationSum = 0;

            for(var id_site in viewsBuffer)
            {
               if(viewsBuffer[id_site].pinned == true)
               {
                  viewsBufferFinal[id_site] = viewsBuffer[id_site];
                  viewsBufferFinal[id_site].share = viewsBufferFinal[id_site].pinnedShare;
                  sharePinnedSum += viewsBufferFinal[id_site].share;
               }
               else if(viewsBuffer[id_site].views >= bkg.config.minViews)
               {
                  viewsBufferFinal[id_site] = viewsBuffer[id_site];

                  if(viewsBuffer[id_site].included == true && viewsBuffer[id_site].pinned == false)
                  {
                     durationSum += viewsBufferFinal[id_site].duration;
                  }
               }
            }

            /* calculate shares */
            var shareSum = sharePinnedSum;

            for(var id_site in viewsBufferFinal)
            {
               if(viewsBufferFinal[id_site].included == true &&
                  viewsBufferFinal[id_site].pinned == false)
               {
                  var share = viewsBufferFinal[id_site].duration/durationSum * 100;
                  share = Math.round(share - (sharePinnedSum * share)/100);
                  viewsBufferFinal[id_site].share = share;
                  shareSum += share;
               }
               else if(viewsBufferFinal[id_site].included == false)
               {
                  viewsBufferFinal[id_site].share = 0;
               }

               viewsOut.push(viewsBufferFinal[id_site]);
            }

            /* add deleted sites */
            if(activeOnly == false)
            {
               return db.getSites({status: ledger.site_status_deleted});
            }
            else
            {
               return Promise.resolve([]);
            }
         }).then(function(sites)
         {
            for(var i = 0; i < sites.length; i++)
            {
               var site = sites[i];

               viewsOut.push(
               {
                  siteId: site.id,
                  hostname: site.hostname,
                  name: site.name,
                  included: false,
                  pinned: false,
                  pinnedShare: 0,
                  status: site.status,
                  views: 0,
                  duration: 0,
                  share: 0
               });
            }

            viewsOut = viewsOut.sort(compare);
            resolve(viewsOut);
         }).catch(function(e)
         {
            utils.log("db.getViews: ERROR: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   clearViews: function(frequency)
   {
      var frequency = frequency * utils.msecs.day;
      var compare = Date.now() - frequency;

      return new Promise(function(resolve, reject)
      {
         storageDb.delete("view", {timestamp: {"<": compare}}).then(function(rows)
         {
            utils.log("db.clearViews: " + rows + " rows deleted", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("db.clearViews: ERROR: clearViews failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   deleteViews: function(where)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.delete("view", where).then(function(rows)
         {
            utils.log("db.deleteViews: " + rows + " rows deleted", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("db.deleteViews: ERROR: deleteViews failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   addUnstoredView: function(view)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.insert("view_unstored", {data: view}).then(function(view)
         {
            utils.log("db.addUnstoredView: new unstored view added", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("db.addUnstoredView: ERROR: addUnstoredView failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getUnstoredViews: function()
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.select("view_unstored", {}).then(function(result)
         {
            resolve(result);
         }).catch(function(e)
         {
            utils.log("db.getUnstoredView: ERROR: getUnstoredViews failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   deleteUnstoredView: function(id)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.delete("view_unstored", {id: id}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            utils.log("db.deleteUnstoredView: ERROR: deleteUnstoredView failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   addContribution: function()
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.insert
         (
            "contribution",
            {data: {}, errorCount: 0, status: ledger.contrib_status_created, timestamp: Date.now()}
         ).then(function(contribution)
         {
            utils.log("db.addContribution: new contribution added. contribution id: " + contribution.id, utils.log_level_debug);
            resolve(contribution);
         }).catch(function(e)
         {
            utils.log("db.addContribution: ERROR: contribution couldn't be added: " + JSON.stringify(e), utils.log_level_error);
            reject();
         });
      });
   },

   storeContribution: function(contribution)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.update
         (
            "contribution",
            {data: contribution.data, status: contribution.status},
            {id: contribution.id}
         ).then(function()
         {
            utils.log("db.storeContribution: contribution successfully updated", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   deleteContribution: function(id)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.delete("contribution", {id: id}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            utils.log("db.deleteContribution: ERROR: contribution couldn't be deleted: " + e, utils.log_level_error);
            reject(e);
         });
      });
   },

   getContribution: function(id)
   {
      return new Promise(function(resolve, reject)
      {
         storageDb.select("contribution", {id: id}).then(function(result)
         {
            resolve(result[0]);
         }).catch(function(e)
         {
            utils.log("db.getContribution: ERROR: contribution " + id + " couldn't be selected: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getContributions: function(where)
   {
      function compare(a, b)
      {
         if(a.timestamp > b.timestamp)
         {
            return -1;
         }
         else if(a.timestamp < b.timestamp)
         {
            return 1;
         }
         else
         {
            return 0;
         }
      }

      return new Promise(function(resolve, reject)
      {
         storageDb.select("contribution", where).then(function(contributions)
         {
            contributions = contributions.sort(compare);
            resolve(contributions);
         }).catch(function(e)
         {
            utils.log("db.getContributions: ERROR: uncommitted contributions couldn't be selected: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getLastContribution: function()
   {
      return new Promise(function(resolve, reject)
      {
         db.getContributions({status: {">=": ledger.contrib_status_voted}}).then(function(contributions)
         {
            resolve(contributions[0]);
         }).catch(function(e)
         {
            utils.log("db.getLastContribution: ERROR: last contribution couldn't be selected: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   setLogLevel: function(level)
   {
      storageDb.setLogLevel(utils.log_level_error);
   }
}

var ledger =
{
   servers:
   {
      ledger:
      {
         staging:
         {
            v1: "https://ledger-staging.mercury.basicattentiontoken.org",
            v2: "https://ledger-staging.mercury.basicattentiontoken.org",
            v3: "https://ledger-staging.mercury.basicattentiontoken.org"
         },
         production:
         {
            v1: "https://ledger.mercury.basicattentiontoken.org",
            v2: "https://ledger.mercury.basicattentiontoken.org",
            v3: "https://ledger.mercury.basicattentiontoken.org"
         }
      },
      balance:
      {
         staging: {v2: "https://balance-staging.mercury.basicattentiontoken.org"},
         production: {v2: "https://balance.mercury.basicattentiontoken.org"}
      }
   },

   conf_env: "production",
   conf_contribute_frequency: 14, // days
   conf_vote_commit_delay_max: 60 * 10, // seconds
   conf_contributor_interval: 1000 * 60 * 10,
   conf_voting_committer_interval: 1000 * 60,
   conf_site_updater_interval: 1000 * 60 * 60 * 12,
   conf_view_storer_interval: 1000 * 60 * 10,
   conf_max_contribution_errors: 10,
   conf_exchange_rate_max_age: 1000 * 60 * 10,

   default_budget: 2,
   default_min_view_duration: 8,
   default_min_views: 1,
   default_budget_currency: "USD",

   site_status_active: 1,
   site_status_deleted: 2,

   contrib_status_created: 1,
   contrib_status_payed: 2,
   contrib_status_captured: 3,
   contrib_status_viewing_registered: 4,
   contrib_status_voting_prepared: 5,
   contrib_status_voted: 6,
   contrib_status_voting_committed: 7,

   credentials: null,
   exchangeRate: null,
   exchangeRateLastChecked: null,

   init: function()
   {
      utils.log("ledger.init: start initializing ledger...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         utils.getStorageData("credentials").then(function(data)
         {
            if(data)
            {
               ledger.credentials = data.credentials;
            }

            utils.log("ledger.init: ledger initialized -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("ledger.init: ERROR: ledger init failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   setPaymentStatus: function(status)
   {
      utils.log("ledger.setPaymentStatus: " + status, utils.log_level_debug);

      function storePaymentStatus(status)
      {
         return new Promise(function(resolve, reject)
         {
            bkg.config.paymentStatus = status;

            if(status == false)
            {
               delete bkg.config.nextContribution;
            }
            else
            {
               bkg.config.nextContribution = Date.now() + ledger.conf_contribute_frequency * utils.msecs.day;
               //bkg.config.nextContribution = Date.now() + utils.msecs.minute * 5;
               utils.showNotification("notificationBackupWallet");
            }

            utils.setStorageData({config: bkg.config}).then(function()
            {
               resolve();
            }).catch(function(e)
            {
               reject();
            });
         });
      }

      return new Promise(function(resolve, reject)
      {
         if(status == true)
         {
            if(ledger.getWalletStatus() == false)
            {
               ledger.registerPersona().then(function()
               {
                  return storePaymentStatus(status);
               }).then(function()
               {
                  ledger.paymentStatus = status;
                  resolve();
               }).catch(function(e)
               {
                  reject();
               });
            }
            else
            {
               storePaymentStatus(status).then(function()
               {
                  ledger.paymentStatus = status;
                  resolve();
               }).catch(function(e)
               {
                  reject();
               });
            }
         }
         else
         {
            storePaymentStatus(status).then(function()
            {
               ledger.paymentStatus = status;
               resolve();
            }).catch(function(e)
            {
               reject();
            });
         }
      });
   },

   setAutoInclude: function(status)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.autoInclude = status;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setIncludedOnly: function(status)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.showIncludedOnly = status;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setActiveOnly: function(status)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.showActiveOnly = status;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setBudget: function(budget)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.budget = budget;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setMinViewDuration: function(duration)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.minViewDuration = duration;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setMinViews: function(views)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.minViews = views;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setBudgetCurrency: function(currency)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.budgetCurrency = currency;

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setLogLevel: function(level)
   {
      return new Promise(function(resolve, reject)
      {
         bkg.config.logLevel = level;
         db.setLogLevel(level);

         utils.setStorageData({config: bkg.config}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setSiteIncluded: function(siteId, status)
   {
      return new Promise(function(resolve, reject)
      {
         db.storeSite({siteId: siteId, updates: {included: status}}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   checkSite: function(site, forceServerCheck)
   {
      function getPublisher(site, forceServerCheck)
      {
         return new Promise(function(resolve, reject)
         {
            if(forceServerCheck == false)
            {
               db.getDomain(site).then(function(domain)
               {
                  if(domain)
                  {
                     db.getSites({hostname: domain.publisher}).then(function(sites)
                     {
                        if(sites.length > 0)
                        {
                           var result = {};
                           result.domain = domain.publisher;
                           result.included = sites[0].included;
                           result.verified = sites[0].verified;
                           resolve(result);
                        }
                        else
                        {
                           resolve(null);
                        }
                     }).catch(function(e)
                     {
                        resolve(null);
                     });
                  }
                  else
                  {
                     resolve(null);
                  }
               }).catch(function(e)
               {
                  resolve(null);
               });
            }
            else
            {
               resolve(null);
            }
         });
      }

      return new Promise(function(resolve, reject)
      {
         var result = {};

         getPublisher(site, forceServerCheck).then(function(publisher)
         {
            if(publisher)
            {
               utils.log("ledger.checkSite: site: " + site + ", publisher in cache found: " + JSON.stringify(publisher), utils.log_level_debug);
               resolve(publisher);
            }
            else
            {
               utils.log("ledger.checkSite: site: " + site + ", publisher not in cache found (forced: " + forceServerCheck + ") -> get information from server", utils.log_level_debug);
               url = ledger.servers.ledger["production"].v3 + "/v3/publisher/identity?publisher=" + encodeURIComponent(site);

               utils.httpGet(url).then(function(response)
               {
                  utils.log("ledger.checkSite: publisherInfo: " + JSON.stringify(response), utils.log_level_debug);

                  result.domain = response.publisher;
                  result.included = bkg.config.autoInclude;
                  result.verified = false;

                  if(response.properties.exclude && response.properties.exclude == true)
                  {
                     result.included = false;
                  }

                  if(response.properties.verified && response.properties.verified == true)
                  {
                     result.verified = true;
                  }

                  db.addDomain({name: site, publisher: response.publisher}).then(function()
                  {
                     resolve(result);
                  }).catch(function(e)
                  {
                     utils.log("ledger.checkSite: ERROR: check site failed: " + JSON.stringify(site) + ", error: " + e, utils.log_level_error);
                     reject();
                  });
               }).catch(function(e)
               {
                  utils.log("ledger.checkSite: ERROR: check site failed: " + JSON.stringify(site) + ", error: " + e, utils.log_level_error);
                  reject();
               });
            }
         });
      });
   },

   deleteSite: function(siteId)
   {
      return new Promise(function(resolve, reject)
      {
         db.storeSite({siteId: siteId, updates: {status: ledger.site_status_deleted}}).then(function()
         {
            return db.deleteViews({id_site: siteId});
         }).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   restoreSite: function(siteId)
   {
      return new Promise(function(resolve, reject)
      {
         db.storeSite({siteId: siteId, updates: {status: ledger.site_status_active}}).then(function()
         {
            utils.showNotification("notificationSiteRestored");
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setSitePinStatus: function(siteId, status, share)
   {
      return new Promise(function(resolve, reject)
      {
         db.storeSite({siteId: siteId, updates: {pinned: status, included: true}}).then(function()
         {
            if(share)
            {
               return db.storeSite({siteId: siteId, updates: {pinnedShare: share}});
            }
            else
            {
               return Promise.resolve();
            }
         }).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   setSitePinShare: function(siteId, share)
   {
      return new Promise(function(resolve, reject)
      {
         db.storeSite({siteId: siteId, updates: {pinnedShare: share}}).then(function()
         {
            resolve();
         }).catch(function(e)
         {
            reject();
         });
      });
   },

   recoverWallet: function(passphrase)
   {
      return new Promise(function(resolve, reject)
      {
         var url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/wallet";
         var seed = null;
         var keyPair = null;
         var paymentId = null;

         passphrase = passphrase.split(" ");

         if(passphrase.length != cryptoUtils.passphrase_length)
         {
            utils.log("ledger.recoverWallet: ERROR: recover wallet failed: passphrase is invalid", utils.log_level_error);
            reject("Passphrase is invalid.");
         }

         cryptoUtils.passphraseToBytes(passphrase).then(function(data)
         {
            seed = data;

            if(seed.length != cryptoUtils.seed_length)
            {
               utils.log("ledger.recoverWallet: ERROR: recover wallet failed: generated key is invalid", utils.log_level_error);
               return Promise.reject("Generated key is invalid.");
            }

            return cryptoUtils.generateKeyPair(seed);
         }).then(function(keys)
         {
            keyPair = keys;
            var suffix = "?publicKey=" + utils.uint8ToHex(keyPair.publicKey);
            return utils.httpGet(url + suffix);
         }).then(function(response)
         {
            utils.log("ledger.recoverWallet: response: " + JSON.stringify(response), utils.log_level_debug);
            paymentId = response.paymentId;
            var suffix = "/" + paymentId;
            return utils.httpGet(url + suffix);
         }).then(function(response)
         {
            utils.log("ledger.recoverWallet: response: " + JSON.stringify(response), utils.log_level_debug);
            ledger.credentials.seed = utils.uint8ToHex(seed);
            ledger.credentials.privateKey = utils.uint8ToHex(keyPair.secretKey);
            ledger.credentials.publicKey = utils.uint8ToHex(keyPair.publicKey);
            ledger.credentials.paymentId = paymentId;
            ledger.credentials.addresses = response.addresses;
            return utils.setStorageData({credentials: ledger.credentials});
         }).then(function()
         {
            utils.log("ledger.recoverWallet: wallet successfully recovered", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("ledger.recoverWallet: wallet couldn't be recovered: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getWalletStatus: function()
   {
      if(!ledger.credentials)
      {
         var status = false;
      }
      else
      {
         var status = true;
      }

      return status;
   },

   getWalletBalance: function(forceRateRefresh)
   {
      return new Promise(function(resolve, reject)
      {
         var url = ledger.servers.balance[ledger.conf_env].v2 + "/v2/wallet/" + ledger.credentials.paymentId + "/balance";
         var balance = null;
         var altCurrency = null;

         utils.httpGet(url).then(function(response)
         {
            balance = parseFloat(response.balance);
            altCurrency = response.altcurrency;
            return ledger.getExchangeRate(bkg.config.budgetCurrency, forceRateRefresh);
         }).then(function(rate)
         {
            var result =
            {
               balance: balance,
               balanceCurrency: altCurrency,
               budgetCurrency: bkg.config.budgetCurrency,
               exchangeRate: rate
            };

            resolve(result);
         }).catch(function(e)
         {
            utils.log("ledger.getWalletBalance: ERROR: balance couldn't be got: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getExchangeRate: function(currency, forceRateRefresh)
   {
      return new Promise(function(resolve, reject)
      {
         var batUsd = null;

         if(!ledger.exchangeRate ||
            Date.now() - ledger.exchangeRateLastChecked > ledger.conf_exchange_rate_max_age ||
            forceRateRefresh == true)
         {
            utils.log("ledger.getExchangeRate: get rate from server", utils.log_level_debug);

            utils.httpGet("https://api.coinmarketcap.com/v1/ticker/basic-attention-token/").then(function(data)
            {
               batUsd = parseFloat(data[0].price_usd);
               return utils.httpGet("https://api.fixer.io/latest?base=USD&symbols=" + currency);
            }).then(function(data)
            {
               if(data.rates[currency])
               {
                  var rate = data.rates[currency];
               }
               else
               {
                  var rate = 1;
               }

               var exchangeRate = batUsd * rate;
               ledger.exchangeRate = exchangeRate;
               ledger.exchangeRateLastChecked = Date.now();

               resolve(exchangeRate);
            }).catch(function(e)
            {
               utils.log("ledger.getExchangeRate: ERROR: currency couldn't be converted to bat: " + e, utils.log_level_error);
               reject();
            });
         }
         else
         {
            utils.log("ledger.getExchangeRate: get rate from cache", utils.log_level_debug);
            resolve(ledger.exchangeRate);
         }
      });
   },

   getWalletPassphrase: function()
   {
      return new Promise(function(resolve, reject)
      {
         cryptoUtils.bytesToPassphrase(ledger.credentials.seed).then(function(passphrase)
         {
            resolve(passphrase.join(" "));
         }).catch(function(e)
         {
            utils.log("ledger.getWalletPassphrase: ERROR: passphrase couldn't be got: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getContributionHistory: function()
   {
      return new Promise(function(resolve, reject)
      {
         db.getContributions({status: {">=": ledger.contrib_status_voted}}).then(function(contributions)
         {
            var contributionsOut = [];

            for(var i = 0; i < contributions.length; i++)
            {
               var contribution =
               {
                  id: contributions[i].id,
                  date: contributions[i].data.payment.paymentStamp,
                  amount: contributions[i].data.payment.probi/1000000000000000000 + " " + contributions[i].data.payment.altcurrency
               };

               contributionsOut.push(contribution);
            }

            resolve(contributionsOut);
         }).catch(function(e)
         {
            utils.log("ledger.getContributionHistory: ERROR: contribution history couldn't be got: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   getContributionHistoryDetails: function(id)
   {
      var sitesOut = [];

      function compare(a, b)
      {
         if(a.share > b.share)
         {
            return -1;
         }
         else if(a.share < b.share)
         {
            return 1;
         }
         else
         {
            return 0;
         }
      }

      function workOnSite(site)
      {
         return new Promise(function(resolve, reject)
         {
            db.getSites({hostname: site.hostname}).then(function(data)
            {
               site.name = data[0].name;
               sitesOut.push(site);
               resolve();
            }).catch(function(e)
            {
               reject();
            });
         });
      }

      return new Promise(function(resolve, reject)
      {
         var contribution = null;

         db.getContribution(id).then(function(contrib)
         {
            contribution = contrib;
            var sites = [];

            for(var i = 0; i < contribution.data.surveyorIds.length; i++)
            {
               var site = contribution.data.surveyorIds[i].publisher;

               if(!sites[site])
               {
                  sites[site] = 0;
               }

               sites[site] += 1;
            }

            var sitesData = [];

            for(site in sites)
            {
               var count = sites[site];
               var share = count/contribution.data.surveyorIds.length;
               var amount = share * contribution.data.payment.probi/1000000000000000000;
               var currency = contribution.data.payment.altcurrency;

               var data =
               {
                  hostname: site,
                  share: parseFloat((share * 100).toFixed(2)),
                  amount: amount.toFixed(2) + " " + currency
               };

               sitesData.push(data);
            }

            return utils.sequentialize(sitesData, workOnSite);
         }).then(function()
         {
            sitesOut = sitesOut.sort(compare);

            var data =
            {
               date: contribution.data.payment.paymentStamp,
               amount: contribution.data.payment.probi/1000000000000000000 + " " + contribution.data.payment.altcurrency,
               sites: sitesOut
            }

            resolve(data);
         }).catch(function(e)
         {
            utils.log("ledger.getContributionHistoryDetails: ERROR: contribution history details couldn't be got: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   contribute: function(contribution)
   {
      utils.log("ledger.contribute: start contributing...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var contributionId = null;

         ledger.pay(contribution).then(function(id)
         {
            contributionId = id;
            return ledger.captureViews(contributionId);
         }).then(function()
         {
            return ledger.registerViewing(contributionId);
         }).then(function()
         {
            return ledger.prepareVoting(contributionId);
         }).then(function()
         {
            return ledger.vote(contributionId);
         }).then(function()
         {
            utils.log("ledger.contribute: contributing successfully finished", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("ledger.contribute: ERROR: contributing failed: " + e, utils.log_level_error);

            if(contributionId)
            {
               db.getContribution(contributionId).then(function(contribution)
               {
                  contribution.errorCount += 1;

                  if(contribution.errorCount >= ledger.conf_max_contribution_errors)
                  {
                     utils.showNotification("notificationContributionFailed", [contribution.errorCount]);
                  }

                  return db.storeContribution(contribution);
               }).then(function()
               {
                  utils.log("ledger.contribute: contribution error count successfully increased", utils.log_level_debug);
               }).catch(function(e)
               {
                  utils.log("ledger.contribute: ERROR: contribution error count couldn't be increased: " + e, utils.log_level_error);
               });
            }

            reject();
         });
      });
   },

   pay: function(contribution)
   {
      utils.log("ledger.pay: start paying...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/surveyor/contribution/current/" + ledger.credentials.personaId;
         var viewingId = utils.getUuidV4(utils.uuid4_type_viewing);
         var surveyorId = null;
         var balance = null;
         var octets = null;

         // already payed -> skip
         if(contribution && contribution.status >= ledger.contrib_status_payed)
         {
            utils.log("ledger.pay: already payed -> skip", utils.log_level_debug);
            resolve(contribution.id);
         }
         else
         {
            db.addContribution().then(function(contrib)
            {
               contribution = contrib;
               return utils.httpGet(url);
            }).then(function(response)
            {
               surveyorId = response.surveyorId;
               return ledger.getExchangeRate(bkg.config.budgetCurrency);
            }).then(function(exchangeRate)
            {
               var budget = (bkg.config.budget/exchangeRate).toFixed(2);
               var suffix = "?refresh=true&amount=" + budget + "&altcurrency=BAT";
               url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/wallet/" + ledger.credentials.paymentId;
               return utils.httpGet(url + suffix);
            }).then(function(response)
            {
               balance = response;

               if(parseFloat(balance.balance) < parseFloat(balance.unsignedTx.denomination.amount))
               {
                  utils.log("ledger.pay: ERROR: pay failed: wallet balance unsufficient: balance: " + balance.balance + ", contribute: " + balance.unsignedTx.denomination.amount, utils.log_level_error);
                  return Promise.reject()
               }

               utils.log("ledger.pay: balance checked: available: " + balance.balance + ", needed: " + balance.unsignedTx.denomination.amount, utils.log_level_debug);

               octets = JSON.stringify(balance.unsignedTx);
               return cryptoUtils.sha256(octets);
            }).then(function(hash)
            {
               var headers =
               {
                  digest: "SHA-256=" + utils.uint8ToBase64(hash)
               }

               headers["signature"] = cryptoUtils.sign(
               {
                  headers: headers,
                  keyId: "primary",
                  secretKey: utils.hexToUint8(ledger.credentials.privateKey)
               },
               {algorithm: "ed25519"});

               var payload =
               {
                  surveyorId: surveyorId,
                  viewingId: viewingId,
                  requestType: "httpSignature",
                  signedTx:
                  {
                     headers: headers,
                     body: balance.unsignedTx,
                     octets: octets
                  }
               }

               return utils.httpRequest("PUT", url, payload);
            }).then(function(response)
            {
               utils.log("ledger.pay: result: " + JSON.stringify(response), utils.log_level_debug);
               contribution.data.viewingId = viewingId;
               contribution.data.payment = response;
               contribution.status = ledger.contrib_status_payed;
               return db.storeContribution(contribution);
            }).then(function()
            {
               bkg.config.nextContribution = Date.now() + ledger.conf_contribute_frequency * utils.msecs.day;
               return utils.setStorageData({config: bkg.config});
            }).then(function()
            {
               utils.log("ledger.pay: payment successfully finished -> next", utils.log_level_debug);
               utils.showNotification("notificationContributionSucceeded");
               setTimeout(function(){bkg.sendMessage("refreshContributed");}, utils.msecs.second * 30);
               resolve(contribution.id);
            }).catch(function(e)
            {
               utils.log("ledger.pay: ERROR: pay failed: " + e, utils.log_level_error);

               db.deleteContribution(contribution.id).then(function()
               {
                  reject();
               }).catch(function(e)
               {
                  /* temp begin. find the reason why some contributions are not deleted. */
                  /* attention: when deleting temp block, uncomment "reject" below. */
                  contribution.data.errorMessage = e;
                  db.storeContribution(contribution).then(function()
                  {
                     reject();
                  }).catch(function()
                  {
                     reject();
                  });
                  /* temp end */

                  //reject();
               });
            });
         }
      });
   },

   captureViews: function(contributionId)
   {
      utils.log("ledger.captureViews: start capturing views...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var contribution = null;
         var views = null;

         db.getContribution(contributionId).then(function(contrib)
         {
            contribution = contrib;

            // already captured -> skip
            if(contribution.status >= ledger.contrib_status_captured)
            {
               utils.log("ledger.captureViews: already captured -> skip", utils.log_level_debug);
               return Promise.reject({code: -1});
            }
            else
            {
               return db.getViews(true, true);
            }
         }).then(function(results)
         {
            views = results;

            if(views.length == 0)
            {
               utils.log("ledger.captureViews: ERROR: captureViews failed, no views available", utils.log_level_error);
               return Promise.reject();
            }
            else
            {
               contribution.data.views = views;
               contribution.status = ledger.contrib_status_captured;
               return db.storeContribution(contribution);
            }
         }).then(function()
         {
            return db.clearViews(ledger.conf_contribute_frequency);
         }).then(function()
         {
            utils.log("ledger.captureViews: views successfully captured -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            // skipped
            if(e && e.code && e.code == -1)
            {
               resolve();
            }
            else
            {
               utils.log("ledger.captureViews: ERROR: captureViews failed: " + e, utils.log_level_error);
               reject();
            }
         });
      });
   },

   prepareVoting: function(contributionId)
   {
      var prepared = [];
      var viewingId = null;

      function prepare(surveyorId)
      {
         return new Promise(function(resolve, reject)
         {
            var version = "v2";
            var url = ledger.servers.ledger[ledger.conf_env][version] + "/v2/surveyor/voting/" + encodeURIComponent(surveyorId) + "/" + viewingId;

            utils.httpGet(url).then(function(response)
            {
               response.server = utils.parseUrl(ledger.servers.ledger[ledger.conf_env][version]);
               prepared[surveyorId] = response;
               utils.log("ledger.prepareVoting: " + surveyorId, utils.log_level_debug);
               setTimeout(resolve, utils.msecs.second);
            }).catch(function(e)
            {
               utils.log("ledger.prepareVoting: ERROR: prepareVoting failed: viewingId " + viewingId + ", surveyorId: " + surveyorId + ", error: " + e, utils.log_level_error);
               reject();
            });
         });
      }

      utils.log("ledger.prepareVoting: start prepare voting...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var contribution = null;

         db.getContribution(contributionId).then(function(contrib)
         {
            contribution = contrib;

            // voting already prepared -> skip
            if(contribution.status >= ledger.contrib_status_voting_prepared)
            {
               utils.log("ledger.prepareVoting: voting already prepared -> skip", utils.log_level_debug);
               return Promise.reject({code: -1});
            }
            else
            {
               viewingId = utils.stripUuidV4(contribution.data.viewingId);
               surveyorIds = contribution.data.surveyorIds;
               return utils.sequentialize(surveyorIds, prepare);
            }
         }).then(function()
         {
            for(surveyorId in prepared)
            {
               var response = prepared[surveyorId];

               for(var i = 0; i < surveyorIds.length; i++)
               {
                  if(surveyorIds[i] == surveyorId)
                  {
                     var delayed = Date.now() + utils.getRandom(utils.msecs.second, ledger.conf_vote_commit_delay_max * utils.msecs.second);

                     var data =
                     {
                        surveyorId: surveyorId,
                        prepared: response,
                        delayed: delayed
                     };

                     surveyorIds[i] = data;
                  }
               }
            }

            contribution.data.surveyorIds = surveyorIds;
            contribution.status = ledger.contrib_status_voting_prepared;
            return db.storeContribution(contribution);
         }).then(function()
         {
            utils.log("ledger.prepareVoting: voting successfully prepared -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            // skipped
            if(e && e.code && e.code == -1)
            {
               resolve();
            }
            else
            {
               utils.log("ledger.prepareVoting: ERROR: prepareVoting failed: " + e, utils.log_level_error);
               reject();
            }
         });
      });
   },

   vote: function(contributionId)
   {
      utils.log("ledger.voting: start voting...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         db.getContribution(contributionId).then(function(contribution)
         {
            // already voted -> skip
            if(contribution.status >= ledger.contrib_status_voted)
            {
               utils.log("ledger.voting: already voted -> skip", utils.log_level_debug);
               return Promise.reject({code: -1});
            }
            else
            {
               var views = contribution.data.views;
               var bowl = [];

               for(var i = 0; i < views.length; i++)
               {
                  var view = views[i];

                  for(var j = 0; j < view.share; j++)
                  {
                     bowl.push(view.hostname);
                  }
               }

               var surveyorIds = contribution.data.surveyorIds;

               for(var i = 0; i < surveyorIds.length; i++)
               {
                  var random = utils.getRandom(0, bowl.length - 1);
                  surveyorIds[i].publisher = bowl[random];
                  utils.log("ledger.voting: vote for " + bowl[random], utils.log_level_debug);
               }

               contribution.data.surveyorIds = surveyorIds;
               contribution.status = ledger.contrib_status_voted;
               return db.storeContribution(contribution);
            }
         }).then(function()
         {
            utils.log("ledger.voting: voting successfully finished -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            // skipped
            if(e && e.code && e.code == -1)
            {
               resolve();
            }
            else
            {
               utils.log("ledger.voting: ERROR: voting failed: " + e, utils.log_level_error);
               reject();
            }
         });
      });
   },

   commitVoting: function(surveyorId, prepared, credential, publisher)
   {
      return new Promise(function(resolve, reject)
      {
         var suffix = encodeURIComponent(surveyorId);
         var url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/surveyor/voting/" + suffix;
         var execCredential = new Credential(credential);
         var surveyor = new Surveyor(prepared);

         cryptoUtils.submitCredential(execCredential, surveyor, {publisher: publisher}).then(function(payload)
         {
            return utils.httpRequest("PUT", url, payload);
         }).then(function(response)
         {
            utils.log("ledger.commitVoting: vote successfully submitted: domain: " + publisher + ", submissionId: " + response.submissionId, utils.log_level_debug);
            resolve(response.submissionId);
         }).catch(function(e)
         {
            utils.log("ledger.commitVoting: ERROR: executeVoting failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   registerPersona: function()
   {
      return new Promise(function(resolve, reject)
      {
         var url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/registrar/persona";
         var personaId = utils.getUuidV4(utils.uuid4_type_persona);
         var credential = null;
         var proof = null;
         var seed = null;
         var keyPair = null;
         var body = null;
         var octets = null;
         var paymentId = null;
         var addresses = null;

         utils.httpGet(url).then(function(response)
         {
            credential = new Credential(personaId, response.registrarVK);
            return cryptoUtils.requestCredential(credential);
         }).then(function(credentialProof)
         {
            proof = credentialProof;
            seed = cryptoUtils.getSeed();
            return cryptoUtils.generateKeyPair(seed);
         }).then(function(keys)
         {
            keyPair = keys;

            body =
            {
               label: personaId,
               currency: "BAT",
               publicKey: utils.uint8ToHex(keyPair.publicKey)
            }

            octets = JSON.stringify(body);
            return cryptoUtils.sha256(octets);
         }).then(function(hash)
         {
            var headers =
            {
               digest: "SHA-256=" + utils.uint8ToBase64(hash)
            };

            headers["signature"] = cryptoUtils.sign(
            {
               headers: headers,
               keyId: "primary",
               secretKey: keyPair.secretKey
            },
            {algorithm: "ed25519"});

            var payload =
            {
               requestType: "httpSignature",
               request:
               {
                  headers: headers,
                  body: body,
                  octets: octets
               },
               proof: proof
            }

            url = url + "/" + personaId;
            return utils.httpRequest("POST", url, payload);
         }).then(function(response)
         {
            utils.log("ledger.registerPersona: response: " + JSON.stringify(response), utils.log_level_debug);
            paymentId = response.wallet.paymentId;
            addresses = response.wallet.addresses;
            return cryptoUtils.finalizeCredential(credential, response.verification);
         }).then(function(credential)
         {
            ledger.credentials =
            {
               personaId: personaId,
               seed: utils.uint8ToHex(seed),
               privateKey: utils.uint8ToHex(keyPair.secretKey),
               publicKey: utils.uint8ToHex(keyPair.publicKey),
               paymentId: paymentId,
               addresses: addresses
            };

            return utils.setStorageData({credentials: ledger.credentials});
         }).then(function()
         {
            utils.log("ledger.registerPersona: persona registered: created credentials: " + JSON.stringify(ledger.credentials), utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            utils.log("ledger.registerPersona: ERROR: registerPersona failed: " + e, utils.log_level_error);
            reject();
         });
      });
   },

   registerViewing: function(contributionId)
   {
      utils.log("ledger.registerViewing: start registering viewing...", utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var url = ledger.servers.ledger[ledger.conf_env].v2 + "/v2/registrar/viewing";
         var contribution = null;
         var viewingId = null;
         var credential = null;
         var surveyorIds = null;

         db.getContribution(contributionId).then(function(contrib)
         {
            contribution = contrib;

            // viewing already registered -> skip
            if(contribution.status >= ledger.contrib_status_viewing_registered)
            {
               utils.log("ledger.registerViewing: viewing already registered -> skip", utils.log_level_debug);
               return Promise.reject({code: -1});
            }
            else
            {
               return utils.httpGet(url);
            }
         }).then(function(response)
         {
            viewingId = utils.stripUuidV4(contribution.data.viewingId);
            credential = new Credential(viewingId, response.registrarVK);
            return cryptoUtils.requestCredential(credential);
         }).then(function(proof)
         {
            url = url + "/" + viewingId;
            return utils.httpRequest("POST", url, {proof: proof});
         }).then(function(response)
         {
            surveyorIds = response.surveyorIds;
            return cryptoUtils.finalizeCredential(credential, response.verification);
         }).then(function(credential)
         {
            utils.log("ledger.registerViewing: viewing successfully registered: " + surveyorIds.length + " surveyorId(s)", utils.log_level_debug);
            contribution.data.surveyorIds = surveyorIds;
            contribution.data.credential = credential;
            contribution.status = ledger.contrib_status_viewing_registered;
            return db.storeContribution(contribution);
         }).then(function()
         {
            utils.log("ledger.registerViewing: viewing successfully registered -> next", utils.log_level_debug);
            resolve();
         }).catch(function(e)
         {
            // skip
            if(e && e.code && e.code == -1)
            {
               resolve();
            }
            else
            {
               utils.log("ledger.registerViewing: ERROR: registerViewing failed: " + e, utils.log_level_error);
               reject();
            }
         });
      });
   }
}

var contributor =
{
   interval: null,
   balanceAdvanceChecked: false,
   balanceNoticeShown: false,

   init: function(interval)
   {
      contributor.interval = interval;
      utils.log("contributor.init: contributor initialized: " + interval, utils.log_level_debug);
      setTimeout(contributor.doit, 1000);
   },

   resumeContributions: function()
   {
      return new Promise(function(resolve, reject)
      {
         var count = 0;

         // get all contributions for which is already payed but did not finish
         db.getContributions({status: {">": ledger.contrib_status_payed, "<": ledger.contrib_status_voted}}).then(function(contributions)
         {
            utils.log("contributor.resumeContributions: " + contributions.length + " contributions found which need to be resumed: " + JSON.stringify(contributions), utils.log_level_debug);
            count = contributions.length;
            return utils.sequentialize(contributions, ledger.contribute);
         }).then(function()
         {
            if(count > 0)
            {
               utils.log("contributor.resumeContributions: " + count + " contributions successfully resumed", utils.log_level_debug);
            }

            resolve();
         }).catch(function(e)
         {
            utils.log("contributor.resumeContributions: ERROR: resuming contributions failed: " + e, utils.log_level_error);
            resolve();
         });
      });
   },

   doit: function()
   {
      utils.log("contributor.doit: start contributing...", utils.log_level_debug);

      contributor.resumeContributions().then(function()
      {
         if(bkg.config.paymentStatus == true)
         {
            // next contribution date reached
            if(Date.now() >= bkg.config.nextContribution)
            {
               db.getViews(true, true).then(function(views)
               {
                  if(views.length == 0)
                  {
                     utils.log("contributor.doit: no views found -> do nothing", utils.log_level_debug);
                     return Promise.reject({code: -1, message: "no views found."});
                  }
                  else
                  {
                     return ledger.getWalletBalance(false);
                  }
               }).then(function(balance)
               {
                  if(balance.balance < bkg.config.budget/balance.exchangeRate)
                  {
                     utils.log("contributor.doit: balance too low -> ask user to increase if not already done", utils.log_level_debug);

                     if(contributor.balanceNoticeShown == false)
                     {
                        contributor.balanceNoticeShown = true;
                        utils.showNotification("notificationFundsNotSufficient");
                     }

                     return Promise.reject({code: -2, message: "balance not sufficient."});
                  }
                  else
                  {
                     utils.log("contributor.doit: everything okay -> start contribution", utils.log_level_debug);
                     return ledger.contribute();
                  }
               }).then(function()
               {
                  utils.log("contributor.doit: contribution successfully finished", utils.log_level_debug);
                  contributor.balanceAdvanceChecked = false;
                  contributor.balanceNoticeShown = false;
                  setTimeout(contributor.doit, contributor.interval);
               }).catch(function(e)
               {
                  if(!e || !e.code)
                  {
                     utils.log("contributor.doit: ERROR: doit failed: " + e, utils.log_level_error);
                  }

                  setTimeout(contributor.doit, contributor.interval);
               });
            }
            // 2 days before next contribution date -> check if balance will be sufficent
            else if((Date.now() + utils.msecs.day * 2) >= bkg.config.nextContribution)
            {
               if(contributor.balanceAdvanceChecked == false)
               {
                  db.getViews(true, true).then(function(views)
                  {
                     if(views.length == 0)
                     {
                        utils.log("contributor.doit: no views found -> do nothing", utils.log_level_debug);
                        return Promise.reject({code: -1, message: "no views found."});
                     }
                     else
                     {
                        contributor.balanceAdvanceChecked = true;
                        return ledger.getWalletBalance(false);
                     }
                  }).then(function(balance)
                  {
                     if(balance.balance < bkg.config.budget/balance.exchangeRate)
                     {
                        utils.log("contributor.doit: balance will not be sufficent for next contribution -> ask user to increase", utils.log_level_debug);
                        utils.showNotification("notificationFundsWillNotSufficient");
                        return Promise.reject({code: -2, message: "balance not sufficient."});
                     }
                     else
                     {
                        utils.log("contributor.doit: balance will be sufficent for next contribution", utils.log_level_debug);
                        utils.showNotification("notificationContributionAdvance");
                        setTimeout(contributor.doit, contributor.interval);
                     }
                  }).catch(function(e)
                  {
                     if(!e || !e.code)
                     {
                        utils.log("contributor.doit: ERROR: doit failed: " + e, utils.log_level_error);
                     }

                     setTimeout(contributor.doit, contributor.interval);
                  });
               }
               // already checked -> nothing to do
               else
               {
                  utils.log("contributor.doit: already 2 days in advance checked -> nothing to do", utils.log_level_debug);
                  setTimeout(contributor.doit, contributor.interval);
               }
            }
            // next contribution date more than 2 days in the future
            else
            {
               utils.log("contributor.doit: nextContribution more than 2 days in the future -> nothing to do", utils.log_level_debug);
               setTimeout(contributor.doit, contributor.interval);
            }
         }
         // payment status disabled -> nothing to do
         else
         {
            utils.log("contributor.doit: payment disabled -> nothing to do", utils.log_level_debug);
            setTimeout(contributor.doit, contributor.interval);
         }
      });
   }
}

var votingCommitter =
{
   interval: null,

   init: function(interval)
   {
      votingCommitter.interval = interval;
      utils.log("votingCommitter.init: initialized: " + interval, utils.log_level_debug);
      setTimeout(votingCommitter.doit, 2 * 1000);
   },

   doit: function()
   {
      var credential = null;
      var submitted = [];

      function workOnSurveyorId(surveyorId)
      {
         return new Promise(function(resolve, reject)
         {
            var now = Date.now();
            utils.log("votingCommitter.doit: start workOnSurveyorId: id: " + surveyorId.surveyorId + ", submissionId: " + surveyorId.submissionId + ", now: " + now + ", delayed: " + surveyorId.delayed + "...", utils.log_level_debug);

            if(!surveyorId.submissionId && now >= surveyorId.delayed)
            {
               utils.log("votingCommitter.doit: no submissionId and current time >= delayed -> commit voting", utils.log_level_debug);

               ledger.commitVoting(surveyorId.surveyorId, surveyorId.prepared, credential, surveyorId.publisher).then(function(submissionId)
               {
                  surveyorId.submissionId = submissionId;
                  submitted.push(surveyorId);
                  utils.log("votingCommitter.doit: workOnSurveyorId successfully finished", utils.log_level_debug);
                  resolve();
               }).catch(function(e)
               {
                  utils.log("votingCommitter.doit: ERROR: workOnSurveyorId failed: " + JSON.stringify(surveyorId) + ", " + e, utils.log_level_error);
                  reject();
               });
            }
            else
            {
               utils.log("votingCommitter.doit: nothing to do, workOnSurveyorId finished", utils.log_level_debug);
               resolve();
            }
         });
      }

      function workOnContribution(contribution)
      {
         return new Promise(function(resolve, reject)
         {
            utils.log("votingCommitter.doit: start workOnContribution " + contribution.id + "...", utils.log_level_debug);

            credential = contribution.data.credential;
            submitted = [];

            var surveyorIds = contribution.data.surveyorIds;

            utils.sequentialize(surveyorIds, workOnSurveyorId).then(function()
            {
               for(var i = 0; i < submitted.length; i++)
               {
                  var surveyorId = submitted[i].surveyorId;

                  for(var j = 0; j < surveyorIds.length; j++)
                  {
                     if(surveyorIds[j].surveyorId == surveyorId)
                     {
                        surveyorIds[j].submissionId = submitted[i].submissionId;
                     }
                  }
               }

               contribution.data.surveyorIds = surveyorIds;
               var allSubmitted = true;

               for(var i = 0; i < surveyorIds.length; i++)
               {
                  if(!surveyorIds[i].submissionId)
                  {
                     allSubmitted = false;
                     break;
                  }
               }

               if(allSubmitted == true)
               {
                  contribution.status = ledger.contrib_status_voting_committed;
               }

               return db.storeContribution(contribution);
            }).then(function()
            {
               utils.log("votingCommitter.doit: working on contribution " + contribution.id + " finished", utils.log_level_debug);
               resolve();
            }).catch(function(e)
            {
               utils.log("votingCommitter.doit: ERROR: workOnContribution failed: " + e, utils.log_level_error);
               reject();
            });
         });
      }

      utils.log("votingCommitter.doit: start committing votings...", utils.log_level_debug);
      var count = 0;

      db.getContributions({status: ledger.contrib_status_voted}).then(function(contributions)
      {
         utils.log("votingCommitted.doit: " + contributions.length + " uncommitted contribution(s) found", utils.log_level_debug);
         count = contributions.length;
         return utils.sequentialize(contributions, workOnContribution);
      }).then(function()
      {
         if(count > 0)
         {
            utils.log("votingCommitter.doit: " + count + " votings successfully committed", utils.log_level_debug);
         }

         setTimeout(votingCommitter.doit, votingCommitter.interval);
      }).catch(function(e)
      {
         utils.log("votingCommitter.doit: ERROR: doit failed: " + e, utils.log_level_error);
         setTimeout(votingCommitter.doit, votingCommitter.interval);
      });
   }
}

var siteUpdater =
{
   interval: null,
   count: null,

   conf_min_wait: 1000 * 60,
   conf_max_wait: 1000 * 60 * 2,

   init: function(interval)
   {
      siteUpdater.interval = interval;
      utils.log("siteUpdater.init: initialized: " + interval, utils.log_level_debug);
      setTimeout(siteUpdater.doit, 3 * 1000);
   },

   doit: function()
   {
      function workOnSite(site)
      {
         return new Promise(function(resolve, reject)
         {
            utils.log("siteUpdater.doit: start workOnSite " + site.hostname + "...", utils.log_level_debug);

            ledger.checkSite(site.hostname, true).then(function(data)
            {
               if(site.verified != data.verified)
               {
                  siteUpdater.count++;
                  return db.storeSite({siteId: site.id, updates: {verified: data.verified}});
               }
               else
               {
                  return Promise.resolve();
               }
            }).then(function()
            {
               utils.log("siteUpdater.doit: workOnSite finished", utils.log_level_debug);
               setTimeout(function(){resolve();}, utils.getRandom(siteUpdater.conf_min_wait, siteUpdater.conf_max_wait));
            }).catch(function(e)
            {
               utils.log("siteUpdater.doit: ERROR: workOnSite failed: " + e, utils.log_level_error);
               reject();
            });
         });
      }

      utils.log("siteUpdater.doit: start updating sites...", utils.log_level_debug);

      db.getSites({status: ledger.site_status_active, included: true}).then(function(sites)
      {
         siteUpdater.count = 0;
         return utils.sequentialize(sites, workOnSite);
      }).then(function()
      {
         if(siteUpdater.count > 0)
         {
            bkg.sendMessage("refreshViews");
         }

         utils.log("siteUpdater.doit: " + siteUpdater.count + " sites successfully updated", utils.log_level_debug);
         setTimeout(siteUpdater.doit, siteUpdater.interval);
      }).catch(function(e)
      {
         utils.log("siteUpdater.doit: ERROR: siteUpdater failed: " + e, utils.log_level_error);
         setTimeout(siteUpdater.doit, siteUpdater.interval);
      });
   }
}

var viewStorer =
{
   interval: null,
   count: null,

   init: function(interval)
   {
      viewStorer.interval = interval;
      utils.log("viewStorer.init: initialized: " + interval, utils.log_level_debug);
      setTimeout(viewStorer.doit, 4 * 1000);
   },

   doit: function()
   {
      function workOnView(view)
      {
         return new Promise(function(resolve, reject)
         {
            utils.log("viewStorer.doit: start workOnView " + view.data.domain + "...", utils.log_level_debug);

            tabHandler.storeView(view.data, false).then(function()
            {
               return db.deleteUnstoredView(view.id);
            }).then(function()
            {
               utils.log("viewStorer.doit: workOnView finished", utils.log_level_debug);
               viewStorer.count++;
               setTimeout(resolve, 1000);
            }).catch(function(e)
            {
               utils.log("viewStorer.doit: ERROR: workOnView failed: " + e, utils.log_level_error);
               reject();
            });
         });
      }

      utils.log("viewStorer.doit: start storing views...", utils.log_level_debug);

      db.getUnstoredViews().then(function(views)
      {
         viewStorer.count = 0;
         return utils.sequentialize(views, workOnView);
      }).then(function()
      {
         utils.log("viewStorer.doit: " + viewStorer.count + " views successfully stored", utils.log_level_debug);
         setTimeout(viewStorer.doit, viewStorer.interval);
      }).catch(function(e)
      {
         utils.log("viewStorer.doit: ERROR: viewStorer failed: " + e, utils.log_level_error);
         setTimeout(viewStorer.doit, viewStorer.interval);
      });
   }
}

var cryptoUtils =
{
   hkdf_salt: new Uint8Array([126, 244, 99, 158, 51, 68, 253, 80, 133, 183, 51, 180, 77, 62, 74, 252, 62, 106, 96, 125, 241, 110, 134, 87, 190, 208, 158, 84, 125, 69, 246, 207, 162, 247, 107, 172, 37, 34, 53, 246, 105, 20, 215, 5, 248, 154, 179, 191, 46, 17, 6, 72, 210, 91, 10, 169, 145, 248, 22, 147, 117, 24, 105, 12 ]),
   seed_length: nacl.sign.seedLength,
   passphrase_length: 16,

   getSeed: function()
   {
      return nacl.randomBytes(cryptoUtils.seed_length);
   },

   generateKeyPair(seed)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var output = getHKDF(seed, new Uint8Array([0]), cryptoUtils.seed_length, cryptoUtils.hkdf_salt);
            var keys = nacl.sign.keyPair.fromSeed(output);
            resolve(keys);
         }
         catch(e)
         {
            utils.log("cryptoUtils.generateKeyPair: ERROR: key pair couldn't be generated: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   bytesToPassphrase: function(key)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var phrase = niceware.bytesToPassphrase(utils.hexToUint8(key));
            resolve(phrase);
         }
         catch(e)
         {
            utils.log("cryptoUtils.bytesToPassphrase: ERROR: failed: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   passphraseToBytes: function(passphrase)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var key = niceware.passphraseToBytes(passphrase);
            resolve(key);
         }
         catch(e)
         {
            utils.log("cryptoUtils.passphraseToBytes: ERROR: failed: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   requestCredential: function(credential)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var proof = credential.request();
            resolve(proof);
         }
         catch(e)
         {
            utils.log("cryptoUtils.requestCredential: ERROR: failed: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   finalizeCredential: function(credential, verification)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            credential.finalize(verification);
            resolve(JSON.stringify(credential));
         }
         catch(e)
         {
            utils.log("cryptoUtils.finalizeCredential: ERROR: finalizing credential failed: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   submitCredential: function(credential, surveyor, data)
   {
      return new Promise(function(resolve, reject)
      {
         try
         {
            var payload = {proof: credential.submit(surveyor, data)};
            resolve(payload);
         }
         catch(e)
         {
            utils.log("cryptoUtils.submitCredential: ERROR: commiting credential failed: " + e, utils.log_level_error);
            reject();
         }
      });
   },

   /* based on https://github.com/uphold/http-request-signature/blob/master/src/sign.js, 0.0.2 */
   sign: function({headers: requestHeaders, keyId, secretKey} = {}, {algorithm} = {})
   {
      const headers = Object.keys(requestHeaders).join(' ');
      const message = Object.entries(requestHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

      // Generate signature using the ed25519 algorithm.
      var signature = utils.uint8ToBase64(new Uint8Array(nacl.sign.detached
      (
         new TextEncoder().encode(message),
         secretKey
      )));

      // Return a signature in the format described by `draft-cavage-http-signatures-07` internet draft.
      return `keyId="${keyId}",algorithm="${algorithm}",headers="${headers}",signature="${signature}"`;
   },

   sha256: function(data)
   {
      return new Promise(function(resolve, reject)
      {
         var buffer = new TextEncoder().encode(data);

         crypto.subtle.digest("SHA-256", buffer).then(function(hash)
         {
            var u8 = new Uint8Array(hash);
            resolve(u8);
         }).catch(function(e)
         {
            utils.log("cryptoUtils.sha256: ERROR: sha256 failed: " + e, utils.log_level_error);
            reject();
         });
      });
   }
}

var utils =
{
   uuid4_type_persona: 1,
   uuid4_type_viewing: 2,

   log_level_debug: 1,
   log_level_error: 2,

   msecs:
   {
      day: 24 * 60 * 60 * 1000,
      hour: 60 * 60 * 1000,
      minute: 60 * 1000,
      second: 1000
   },

   sequentialize: function(items, action)
   {
      var p = Promise.resolve();

      items.forEach(function(item)
      {
         p = p.then(function(list)
         {
            return action(item);
         });
      });

      return p;
   },

   httpGet: function(url)
   {
      return new Promise(function(resolve, reject)
      {
         utils.log("utils.httpGet: " + url, utils.log_level_debug);
         var xmlHttp = new XMLHttpRequest();

         xmlHttp.onreadystatechange = function()
         {
            if(xmlHttp.readyState == XMLHttpRequest.DONE)
            {
               if(xmlHttp.status == 200)
               {
                  resolve(JSON.parse(xmlHttp.responseText));
               }
               else
               {
                  utils.log("utils.httpGet: ERROR: httpGet failed: status: " + xmlHttp.status + ", text: " + xmlHttp.responseText + ", url: " + url, utils.log_level_error);
                  reject(xmlHttp.status);
               }
            }
         }

         xmlHttp.ontimeout = function()
         {
            utils.log("utils.httpGet: ERROR: httpGet timeout out: url: " + url, utils.log_level_error);
            reject("timed out");
         }

         xmlHttp.open("GET", url, true);
         xmlHttp.timeout = utils.msecs.second * 15;
         xmlHttp.send(null);
      });
   },

   httpRequest: function(type, url, data)
   {
      data = JSON.stringify(data);
      utils.log("utils.httpRequest: type: " + type + ", url: " + url + ", data: " + data, utils.log_level_debug);

      return new Promise(function(resolve, reject)
      {
         var xmlHttp = new XMLHttpRequest();

         xmlHttp.onreadystatechange = function()
         {
            if(xmlHttp.readyState == XMLHttpRequest.DONE)
            {
               if(xmlHttp.status == 200)
               {
                  resolve(JSON.parse(xmlHttp.responseText));
               }
               else
               {
                  utils.log("utils.httpRequest: ERROR: httpRequest failed: status: " + xmlHttp.status + ", text: " + xmlHttp.responseText + ", url: " + url, utils.log_level_error);
                  reject(xmlHttp.status);
               }
            }
         }

         xmlHttp.ontimeout = function()
         {
            utils.log("utils.httpRequest: ERROR: httpRequest timeout out: url: " + url, utils.log_level_error);
            reject("timed out");
         }

         xmlHttp.open(type, url, true);
         xmlHttp.timeout = utils.msecs.second * 15;
         xmlHttp.setRequestHeader("Content-type", "application/json;charset=utf-8");
         xmlHttp.send(data);
      });
   },

   getUuidV4: function(type)
   {
      if(type == utils.uuid4_type_persona)
      {
         var pattern = "xxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx";
      }
      else if(type == utils.uuid4_type_viewing)
      {
         var pattern = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
      }

      return pattern.replace(/[xy]/g, function(c)
      {
         var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
         return v.toString(16).toLowerCase();
      });
   },

   stripUuidV4: function(uuid)
   {
      var matches = uuid.match(/^([0-9a-f]{8})-([0-9a-f]{4})-4([0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})$/);
      return matches[1] + matches[2] + matches[3] + matches[4] + matches[5];
   },

   uint8ToHex: function(arr)
   {
      return Array.prototype.map.call(arr, x => ('00' + x.toString(16)).slice(-2)).join('');
   },

   hexToUint8: function(hex)
   {
      for(var bytes = [], c = 0; c < hex.length; c += 2)
      {
         bytes.push(parseInt(hex.substr(c, 2), 16));
      }

      return new Uint8Array(bytes);
   },

   uint8ToBase64: function(arr)
   {
      return btoa(String.fromCharCode.apply(null, arr));
   },

   getRandom: function(min, max)
   {
      return Math.floor(Math.random() * (max-min + 1) + min);
   },

   parseUrl: function(url)
   {
      var a = document.createElement("a");
      a.href = url;

      var parts =
      {
         protocol: a.protocol.substr(0, a.protocol.length - 1),
         hostname: a.hostname,
         url: a.href,
         port: a.port
      }

      if(parts.protocol == "http")
      {
         parts.port = 80;
      }
      else if(parts.protocol == "https")
      {
         parts.port = 443;
      }

      return parts;
   },

   getStorageData: function(name)
   {
      return new Promise(function(resolve, reject)
      {
         storage.local.get(name, function(items)
         {
            if(runtime.lastError)
            {
               utils.log("ERROR: value couldn't be got: name: " + name + ", msg: " + runtime.lastError, utils.log_level_error);
               reject();
            }
            else
            {
               if(Object.keys(items).length === 0 && items.constructor === Object)
               {
                  items = null;
               }

               resolve(items);
            }
         });
      });
   },

   setStorageData: function(data)
   {
      return new Promise(function(resolve, reject)
      {
         storage.local.set(data, function()
         {
            if(runtime.lastError)
            {
               utils.log("ERROR: value couldn't be set: " + JSON.stringify(data) + ", msg: " + runtime.lastError, utils.log_level_error);
               reject();
            }
            else
            {
               resolve();
            }
         });
      });
   },

   showNotification: function(name, substitutions)
   {
      var message = utils.getMessage(name, substitutions);

      var options =
      {
         type: "basic",
         title: "BATify Notice",
         message: message,
         iconUrl: extension.getURL("skin/batify_48.png")
      }

      if(utils.isChrome())
      {
         options.requireInteraction = true;
      }

      notifications.create(options);
   },

   getMessage: function(name, substitutions)
   {
      var message = i18n.getMessage(name, substitutions);
      return message;
   },

   isChrome: function()
   {
      var browser = navigator.userAgent;

      if(browser.match(/Chrome/))
      {
         return true;
      }
      else
      {
         return false;
      }
   },

   log: function(message, level)
   {
      if(level >= bkg.config.logLevel)
      {
         console.log("BATify: " + message);
      }
   }
}

bkg.init();