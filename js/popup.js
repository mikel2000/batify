/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../LICENSE for licensing details
*/

var tabs = chrome.tabs || browser.tabs;
var extension = chrome.extension || browser.extension;
var i18n = chrome.i18n || browser.i18n;

function init()
{
   tabs.query({active: true, currentWindow: true}, function(response)
   {
      if(response[0].incognito == true)
      {
         var message = i18n.getMessage("incognito");
         document.getElementById("incognito").textContent = message;
      }
      else
      {
         tabs.query({url: extension.getURL("index.html")}, function(response)
         {
            if(response.length == 0)
            {
               tabs.create({url: extension.getURL("index.html"), "active": true});
               window.close();
            }
            else
            {
               tabs.update(response[0].id, {active: true});
               window.close();
            }
         });
      }
   });
}

window.addEventListener("DOMContentLoaded", init, true);