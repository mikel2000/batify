/*
 BATify: https://www.batify.net/
 https://github.com/mikel2000/batify
 Copyright (C) 2018 Michael Volz (batifyext at gmail dot com)
 Licensed under the Mozilla Public License 2.0
 Please check ../LICENSE for licensing details
*/

var runtime = chrome.runtime || browser.runtime;

var content =
{
   log_level_debug: 1,
   log_level_error: 2,

   status_activated: 1,
   status_idle: 2,
   status_deactived: 3,

   status_video_playing: 1,
   status_video_paused: 2,
   status_video_ended: 3,

   conf_max_idle: 1000 * 60 * 5,
   conf_idle_check_interval: 1000 * 10,

   logLevel: 1,
   url: null,
   status: null,
   lastAction: null,
   start: null,
   elapsed: null,
   videoStatus: null,
   isVideo: false,

   init: function()
   {
      content.log("init: " + document.title + ", " + window.location.href + ", topFrame: " + content.isTopFrame(), content.log_level_debug);
      runtime.onMessage.addListener(content.handleMessage);

      if(content.isTopFrame())
      {
         window.addEventListener("beforeunload", function(){content.handleDeactivate(true);});
      }
      else if(window.location.href.match(/youtube.com\/embed/))
      {
         window.addEventListener("beforeunload", content.handleEmbedded);
         content.addVideoListeners();
      }

      content.handleActivate();
   },

   handleMessage: function(request, sender, sendResponse)
   {
      content.log("handleMessage: " + content.url + ", topFrame: " + content.isTopFrame() + ", " + JSON.stringify(request), content.log_level_debug);

      if(request.action == "activate")
      {
         content.handleActivate();
      }
      else if(request.action == "deactivate")
      {
         if(content.url.match(/youtube.com\/embed/))
         {
            content.handleEmbedded();
         }
         else
         {
            sendResponse(content.handleDeactivate(false));
            return true;
         }
      }
      else if(request.action == "update")
      {
          content.handleUpdate();
      }
   },

   handleActivate: function()
   {
      content.log("handleActivate: url: " + window.location.href, content.log_level_debug);
      content.status = content.status_activated;
      content.url = window.location.href;

      if(content.isTopFrame())
      {
         content.lastAction = Date.now();
         content.start = Date.now();
         content.elapsed = 0;

         if(content.url.match(/youtube.com\/watch/) ||
            content.url.match(/twitch.tv\/videos/))
         {
            content.isVideo = true;
            content.addVideoListeners();
            window.removeEventListener("scroll", content.throttle(content.handleActivity, 1000));
         }
         else
         {
            content.isVideo = false;
            content.removeVideoListeners();
            window.addEventListener("scroll", content.throttle(content.handleActivity, 1000));
            window.setTimeout(content.checkIdle, content.conf_idle_check_interval);
         }
      }
      else if(content.url.match(/youtube.com\/embed/))
      {
         if(content.videoStatus == content.status_video_playing)
         {
            content.start = Date.now();
         }
      }

      runtime.sendMessage({action: "updateExtensionIcon", channel: content.getChannel()});
   },

   handleDeactivate: function(sendMessage)
   {
      content.log("handleDeactivate: sendMessage: " + sendMessage + ", isVideo: " + content.isVideo + ", url: " + content.url, content.log_level_debug);
      content.status = content.status_deactivated;

      if(content.isVideo == false)
      {
         content.elapsed = Date.now() - content.start;
      }
      else
      {
         if(content.videoStatus == content.status_video_playing)
         {
            content.elapsed += Date.now() - content.start;
         }

         var channel = content.getChannel();
      }

      if(sendMessage == true)
      {
         runtime.sendMessage({action: "setData", elapsed: content.elapsed/1000, channel: channel});
      }
      else
      {
         return {elapsed: content.elapsed/1000, channel: channel};
      }
   },

   handleUpdate: function() 
   {
       content.log("handleUpdate: url: " + window.location.href, content.log_level_debug);

       runtime.sendMessage({action: "updateExtensionIcon", channel: content.getChannel()});
   },

   handleActivity: function(e)
   {
      content.lastAction = Date.now();

      if(content.status == content.status_idle)
      {
         content.log("handleActivity: some action on the tab (" + document.title + ") -> start timer again", content.log_level_debug);
         content.start = Date.now();
         content.status = content.status_activated;
         window.setTimeout(content.checkIdle, content.conf_idle_check_interval);
      }
   },

   checkIdle: function()
   {
      if(Date.now() - content.lastAction > content.conf_max_idle)
      {
         content.log("checkIdle: tab (" + document.title + ") too long idle -> stop timer", content.log_level_debug);
         content.elapsed += Date.now() - content.start;
         content.status = content.status_idle;
      }
      else
      {
         window.setTimeout(content.checkIdle, content.conf_idle_check_interval);
      }
   },

   getChannel: function()
   {
      /* video on youtube.com */
      if(content.url.match(/youtube.com\/watch/))
      {
         var a = document.querySelector("#owner-name a");

         if(a)
         {
            var matches = a.href.match(/.*\/channel\/(.*)/);

            if(matches && matches[1])
            {
               var channel = {id: matches[1], name: a.textContent};
            }
         }
      }
      /* embedded youtube video */
      else if(content.url.match(/youtube.com\/embed/))
      {
         var scripts = document.getElementsByTagName("script");

         for(var i = 0; i < scripts.length; i++)
         {
            var matches = scripts[i].textContent.match(/yt.setConfig\(({'PLAYER_CONFIG':) (.*)\);.*\);/);

            if(matches && matches[1] && matches[2])
            {
               try
               {
                  var data = JSON.parse((matches[1] + matches[2]).replace(/'/g, "\""));

                  if(data.PLAYER_CONFIG.args.ucid && data.PLAYER_CONFIG.args.author)
                  {
                     var channel = {id: data.PLAYER_CONFIG.args.ucid, name: data.PLAYER_CONFIG.args.author};
                  }
               }
               catch(e)
               {
                  content.log("getChannel: ERROR: getChannel failed: JSON couldn't be parsed", content.log_level_error);
               }
            }

            break;
         }
      }
      // video on twitch.tv
      else if(content.url.match(/twitch.tv\/videos/))
      {
         var a = document.querySelector("a.channel-header__user");
         var name = document.querySelector("a.channel-header__user h5");

         if(a && name)
         {
            var matches = a.href.match(/twitch.tv\/(.*)/);

            if(matches && matches[1])
            {
               var channel = {id: matches[1], name: name.textContent};
            }
         }
      }

      return channel;
   },

   handleVideoStatus: function(status)
   {
      content.log("handleVideoStatus: " + status, content.log_level_debug);

      if(status == content.status_video_playing)
      {
         content.start = Date.now();
      }
      else if(status == content.status_video_paused || status == content.status_video_ended)
      {
         if(content.videoStatus == content.status_video_playing)
         {
            var elapsed = Date.now() - content.start;
            content.elapsed += elapsed;
            content.log("handleVideoStatus: elapsed: " + elapsed + ", total: " + content.elapsed, content.log_level_debug);
         }
      }

      content.videoStatus = status;
   },

   handleEmbedded: function()
   {
      if(content.videoStatus == content.status_video_playing)
      {
         content.elapsed += Date.now() - content.start;
      }

      content.storeEmbeddedView();
   },

   storeEmbeddedView: function()
   {
      content.log("storeEmbeddedView: elapsed: " + content.elapsed/1000, content.log_level_debug);

      if(content.elapsed > 0)
      {
         var channel = content.getChannel();

         var a = document.createElement("a");
         a.href = content.url;
         var domain = a.hostname + a.pathname;

         runtime.sendMessage({action: "storeView", view: {domain: domain, elapsed: content.elapsed/1000, channel: channel}});
         content.elapsed = 0;
      }
   },

   addVideoListeners: function()
   {
      var video = document.getElementsByTagName("video")[0];
      content.log("addVideoListeners: " + video, content.log_level_debug);

      if(video)
      {
         video.addEventListener("playing", function(){content.handleVideoStatus(content.status_video_playing);});
         video.addEventListener("pause", function(){content.handleVideoStatus(content.status_video_paused);});
         video.addEventListener("ended", function(){content.handleVideoStatus(content.status_video_ended);});

         // if video was already playing when listeners were registered
         if(video.paused == false)
         {
            content.handleVideoStatus(content.status_video_playing);
         }
      }
      else
      {
         window.setTimeout(content.addVideoListeners, 500);
      }
   },

   removeVideoListeners: function()
   {
      var video = document.getElementsByTagName("video")[0];

      if(video)
      {
         video.removeEventListener("playing", function(){content.handleVideoStatus(content.status_video_playing);});
         video.removeEventListener("pause", function(){content.handleVideoStatus(content.status_video_paused);});
         video.removeEventListener("ended", function(){content.handleVideoStatus(content.status_video_ended);});
      }
   },

   throttle: function(fn, wait)
   {
      var time = Date.now();

      return function(e)
      {
         if((time + wait - Date.now()) < 0)
         {
            fn(e);
            time = Date.now();
         }
      }
   },

   isTopFrame: function()
   {
      if(window.parent === window)
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
      if(level >= content.logLevel)
      {
         console.log("BATify: content." + message);
      }
   }
}

content.init();