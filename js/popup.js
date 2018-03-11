/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../LICENSE for licensing details
*/

var tabs = chrome.tabs || browser.tabs;
var extension = chrome.extension || browser.extension;

function init()
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

window.addEventListener("DOMContentLoaded", init, true);