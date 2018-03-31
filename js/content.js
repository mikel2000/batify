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
   conf_video_wait: 500,
   conf_max_video_wait: 500 * 40,

   logLevel: 1,
   url: null,
   channel: null,
   status: null,
   lastAction: null,
   start: null,
   elapsed: null,
   videoStatus: null,
   videoWait: null,
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
      else if(request.action == "getChannel")
      {
         window.setTimeout(function(){sendResponse(content.getChannel());}, 5000);
         return true;
      }
   },

   handleActivate: function()
   {
      content.log("handleActivate: url: " + window.location.href, content.log_level_debug);
      content.status = content.status_activated;
      content.url = window.location.href;
      content.channel = null;

      if(content.isTopFrame())
      {
         content.lastAction = Date.now();
         content.start = Date.now();
         content.elapsed = 0;
         content.isVideo = false;

         if(content.hasVideo())
         {
            content.videoWait = 0;

            content.getVideo().then(function(video)
            {
               content.isVideo = true;
               content.addVideoListeners(video);
               window.removeEventListener("scroll", content.throttle(content.handleActivity, 1000));
            }).catch(function(e)
            {
               content.log("handleActivate: no video found", content.log_level_debug);
               window.addEventListener("scroll", content.throttle(content.handleActivity, 1000));
               window.setTimeout(content.checkIdle, content.conf_idle_check_interval);
            });
         }
         else
         {
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
      }

      var channel = content.getChannel();

      if(sendMessage == true)
      {
         runtime.sendMessage({action: "setData", elapsed: content.elapsed/1000, channel: channel});
      }
      else
      {
         return {elapsed: content.elapsed/1000, channel: channel};
      }
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
      if(content.channel)
      {
         content.log("getChannel: channel in cache found", content.log_level_debug);
         return content.channel;
      }

      /* video on youtube.com */
      if(content.url.match(/youtube.com\/watch/))
      {
         content.log("getChannel: youtube: video on youtube.com", content.log_level_debug);
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
         content.log("getChannel: youtube: embedded video", content.log_level_debug);
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
      // live video on twitch.tv main page
      else if(content.url.match(/www.twitch.tv\/$/))
      {
         content.log("getChannel: twitch: live video on main page", content.log_level_debug);
         var a = document.querySelector("a[data-a-target='carousel-profile-image']");
         var name = document.querySelector("p[data-a-target='carousel-broadcaster-displayname']");

         if(a && name)
         {
            var matches = a.href.match(/twitch.tv\/(.*)/);

            if(matches && matches[1])
            {
               var channel = {id: matches[1], name: name.textContent};
            }
         }
      }
      // recorded video on twitch.tv
      else if(content.url.match(/www.twitch.tv\/videos\/[0-9]+$/))
      {
         content.log("getChannel: twitch: recorded video", content.log_level_debug);
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
      // live video on channel on twitch.tv
      else if(content.url.match(/www.twitch.tv\/[a-z0-9_]+$/i))
      {
         content.log("getChannel: twitch: live video on channel", content.log_level_debug);
         var name = document.querySelector("div.channel-header__user h5");

         if(name)
         {
            var matches = content.url.match(/twitch.tv\/(.*)/);

            if(matches && matches[1])
            {
               var channel = {id: matches[1], name: name.textContent};
            }
         }
      }

      content.channel = channel;
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

   hasVideo: function()
   {
      if(content.url.match(/https:\/\/www\.youtube\.com\/(watch|embed)/) ||
         content.url.match(/https:\/\/www\.twitch\.tv\/$/) ||
         content.url.match(/https:\/\/www\.twitch\.tv\/videos\/[0-9]+$/) ||
         content.url.match(/https:\/\/www\.twitch\.tv\/[a-z0-9]+$/i))
      {
         content.log("hasVideo: true: url: " + content.url, content.log_level_debug);
         return true;
      }
      else
      {
         content.log("hasVideo: false: url: " + content.url, content.log_level_debug);
         return false;
      }
   },

   getVideo: async function()
   {
      function getVideo()
      {
         return new Promise(function(resolve, reject)
         {
            if(window.location.href.match(/twitch/))
            {
               var videoSearch = document.querySelector("div.player-video video");

               if(videoSearch)
               {
                  content.log("getVideo: title: " + videoSearch.title, content.log_level_debug);

                  if(videoSearch.title == "")
                  {
                     var video = videoSearch;
                  }
               }
            }
            else
            {
               var video = document.getElementsByTagName("video")[0];
            }

            window.setTimeout(function(){resolve(video);}, content.conf_video_wait);
         });
      }

      while(content.videoWait <= content.conf_max_video_wait)
      {
         content.videoWait += content.conf_video_wait;
         var video = await getVideo();
         content.log("getVideo: video: " + video, content.log_level_debug);

         if(video)
         {
            break;
         }
      }

      if(!video)
      {
         content.log("getVideo: no video found", content.log_level_debug);
         throw new Error();
      }
      else
      {
         return(video);
      }
   },

   addVideoListeners: function(video)
   {
      content.log("addVideoListeners", content.log_level_debug);
      video.addEventListener("playing", function(){content.handleVideoStatus(content.status_video_playing);});
      video.addEventListener("pause", function(){content.handleVideoStatus(content.status_video_paused);});
      video.addEventListener("ended", function(){content.handleVideoStatus(content.status_video_ended);});

      // if video was already playing when listeners were registered -> set status playing
      if(video.paused == false)
      {
         content.log("addVideoListeners: not paused -> set status playing", content.log_level_debug);
         content.handleVideoStatus(content.status_video_playing);
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