function set_state(wx_state) {
    localStorage.setItem("ps_wx_state", wx_state);
}

function get_state() {
    
    var rx_state = localStorage.getItem("ps_wx_state");
    $('#ps-config #ps_wx_state option').each(function() {
        if($(this).val() == rx_state) {
            $(this).prop('selected', true);
        }
    });
    
    return rx_state;
}



function init_config() {
    
    get_state();
    
}


function init_alerts() {
    
    var feedstate              = get_state().toLowerCase();
    var feedin                 = "https://alerts.weather.gov/cap/"+feedstate+".php?x=0";
	var feedout_flood          = "";
    var feedout_wind           = "";
    var feedout_storm          = "";
    var feedout_tornado        = "";
    var feedout_fire           = "";
    var feedout_winter         = "";
    var feedout_hurricane      = "";
    var feedout_other          = "";
    var feedthis               = "";
    var feedout_blank          = "<small>No warnings posted, refresh page to reload.</small>";
    var items_flood            = 0;
    var items_wind             = 0;
    var items_storm            = 0;
    var items_tornado          = 0;
    var items_fire             = 0;
    var items_winter           = 0;
    var items_hurricane        = 0;
    var items_other            = 0;
    
    
	$.ajax(feedin, {
		accepts:{
			xml:"application/rss+xml"
		},
		dataType:"xml",
		success:function(data) {
			$(data).find("entry").each(function () {
				var el = $(this);
                var alerttitle      = el.find("title").text();
                var alertlink       = el.find("link").attr("href");
                var alertsummary    = el.find("summary").text();
                
                var alertevent      = el.find("cap\\:event").text();
                var alertstart      = el.find("cap\\:effective").text();
                var alertend        = el.find("cap\\:expires").text();
                var alerturgency    = el.find("cap\\:urgency").text();
                var alertarea       = el.find("cap\\:areaDesc").text();
                
                
                if(alertevent.indexOf("Warning") !== -1) {
                    if(alerturgency.indexOf("Immediate") !== -1) {
                        alertlevel = "alert-now";
                    } else {
                        alertlevel = "alert-plan";
                    }
                
                    if(alertevent.indexOf("Flood") !== -1) {
                        feedout_icon = "flood";
                        items_flood = items_flood + 1;
                    } else if(alertevent.indexOf("Wind") !== -1) {
                        feedout_icon = "wind";
                        items_wind = items_wind + 1;
                    } else if(alertevent.indexOf("Thunderstorm") !== -1) {
                        feedout_icon = "storm";
                        items_storm = items_storm + 1;
                    } else if(alertevent.indexOf("Tornado") !== -1) {
                        feedout_icon = "tornado";
                        items_tornado = items_tornado + 1;
                    } else if(alertevent.indexOf("Red Flag") !== -1) {
                        feedout_icon = "fire";
                        items_fire = items_fire + 1;
                    } else if(alertevent.indexOf("Freeze") !== -1) {
                        feedout_icon = "freeze";
                        items_winter = items_winter + 1;
                    } else if(alertevent.indexOf("Winter") !== -1) {
                        feedout_icon = "winter";
                        items_winter = items_winter + 1;
                    } else if(alertevent.indexOf("Hurricane") !== -1) {
                        feedout_icon = "hurricane";
                        items_hurricane = items_hurricane + 1;
                    } else {
                        feedout_icon = "other";
                        items_other = items_other + 1;
                    }
                    
                    
                    feedthis = '<div class="card '+ alertlevel +'"><div class="card-body"><span class="wx-icon wx-'+ feedout_icon +'"></span><h5 class="card-title">' + alertevent + '<br><small>' + alerturgency + '</small></h5><hr><p><strong>' + alerttitle + '</strong></p><p class="card-text">'+ alertarea +'<br><br><small>'+ alertsummary + '</small></p><p><a href="'+ alertlink +'" target="_blank">Read On Weather.gov</a></p></div></div>';
                    
                    if(alertevent.indexOf("Flood") !== -1) {
                        feedout_flood = feedout_flood + feedthis;
                    } else if(alertevent.indexOf("Wind") !== -1) {
                        feedout_wind = feedout_wind + feedthis;
                    } else if(alertevent.indexOf("Thunderstorm") !== -1) {
                        feedout_storm = feedout_storm + feedthis;
                    } else if(alertevent.indexOf("Tornado") !== -1) {
                        feedout_tornado = feedout_tornado + feedthis;
                    } else if(alertevent.indexOf("Red Flag") !== -1) {
                        feedout_fire = feedout_fire + feedthis;
                    } else if(alertevent.indexOf("Freeze") !== -1) {
                        feedout_winter = feedout_winter + feedthis;
                    } else if(alertevent.indexOf("Winter") !== -1) {
                        feedout_winter = feedout_winter + feedthis;
                    } else if(alertevent.indexOf("Hurricane") !== -1) {
                        feedout_hurricane = feedout_hurricane + feedthis;
                    } else {
                        feedout_other = feedout_other + feedthis;
                    }
                    
                    
                }
                
                
                
                
			});
            
            
            //if(feedout_tornado.length < 1) {        feedout_tornado     = feedout_blank;}
            //if(feedout_storm.length < 1) {          feedout_storm       = feedout_blank;}
            if(feedout_wind.length < 1) {           feedout_wind        = feedout_blank;}
            if(feedout_flood.length < 1) {          feedout_flood       = feedout_blank;}
            if(feedout_fire.length < 1) {           feedout_fire        = feedout_blank;}
            if(feedout_winter.length < 1) {         feedout_winter      = feedout_blank;}
            if(feedout_hurricane.length < 1) {      feedout_hurricane   = feedout_blank;}
            if(feedout_other.length < 1) {          feedout_other       = feedout_blank;}

            $(".feedout_tornado").append(feedout_tornado);
            $(".feedout_storm").append(feedout_storm);
            $(".feedout_wind").append(feedout_wind);
            $(".feedout_flood").append(feedout_flood);
            $(".feedout_fire").append(feedout_fire);
            $(".feedout_winter").append(feedout_winter);
            $(".feedout_hurricane").append(feedout_hurricane);
            $(".feedout_other").append(feedout_other);
            
            $(".items_tornado").text(items_tornado);
            $(".items_storm").text(items_storm);
            $(".items_wind").text(items_wind);
            $(".items_flood").text(items_flood);
            $(".items_fire").text(items_fire);
            $(".items_winter").text(items_winter);
            $(".items_hurricane").text(items_hurricane);
            $(".items_other").text(items_other);
            
            if(items_tornado < 1) {     $(".panel-tornado").hide();}
            if(items_storm < 1) {       $(".panel-storm").hide();}
            if(items_wind < 1) {        $(".panel-wind").hide();}
            if(items_flood < 1) {       $(".panel-flood").hide();}
            if(items_fire < 1) {        $(".panel-fire").hide();}
            if(items_winter < 1) {      $(".panel-winter").hide();}
            if(items_hurricane < 1) {   $(".panel-hurricane").hide();}
            

		}	
	});
}

function init_current() {
    
    var wx_state         = get_state();
    var wxin            = "https://w1.weather.gov/xml/current_obs/KJWN.rss";
    var wxthis          = "";
    var wxtheme         = "";
    
    $('.wx-state').text(wx_state);
    
    const hours         = new Date().getHours();
    const isDayTime     = hours > 6 && hours < 20;
    
    
    $.ajax(wxin, {
		accepts:{
			xml:"application/rss+xml",
            headers: {"Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":"content-type"}
		},
		dataType:"xml",
		success:function(data) {
			$(data).find("item").each(function () {
				var wx                  = $(this);
                var ch                  = $(this).parent();
                var chlink              = ch.find("link").text();
                var wxlink              = wx.find("link").text();
                var wxtitle             = wx.find("title").text();
                var wxcondition         = wx.find("title").text();
                var wxdescription       = wx.find("description").text().replace(/(<([^>]+)>)/ig,"");
                var wxtemp              = parseInt(wxtitle.match(/\d+/));
                var wxtemp_c            = Math.round(((wxtemp - 32) * (5/9)));
                var wxtemp_c            = wxtemp_c + "°C";
                var wxtemp_f            = wxtemp + "°F";
                

                if(wxtitle.indexOf('Overcast') !== -1) {
                  wxicon    = "wi-cloud";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Fair and Windy') !== -1) {
                  if(isDayTime) {
                    wxicon    = "wi-day-windy";
                    wxtheme   = "bright";
                  } else {
                    wxicon    = "wi-cloudy-windy";
                    wxtheme   = "dark";
                  }
                  
                } else if (wxtitle.indexOf('Fair') !== -1) {
                  if(isDayTime) {
                    wxicon    = "wi-day-sunny";
                    wxtheme   = "bright";
                  } else {
                    wxicon    = "wi-stars";
                    wxtheme   = "dark";
                  }
                  
                } else if (wxtitle.indexOf('Mostly Cloudy') !== -1) {
                  wxicon    = "wi-cloudy";
                  wxtheme   = "dark";
                } else if (wxtitle.indexOf('Partly Cloudy') !== -1) {
                  wxicon    = "wi-day-cloudy";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Cloudy') !== -1) {
                  wxicon    = "wi-cloudy";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('A Few Clouds') !== -1) {
                  wxicon    = "wi-day-cloudy";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Clouds') !== -1) {
                  wxicon    = "wi-day-cloudy";
                  wxtheme   = "dark";
                } else if (wxtitle.indexOf('Mostly Sunny') !== -1) {
                  if(isDayTime) {
                    wxicon    = "wi-day-cloudy";
                    wxtheme   = "bright";
                  } else {
                    wxicon    = "wi-night-cloudy";
                    wxtheme   = "dark";
                  }
                } else if (wxtitle.indexOf('Sunny') !== -1) {
                  if(isDayTime) {
                    wxicon    = "wi-day-sunny";
                    wxtheme   = "bright";
                  } else {
                    wxicon    = "wi-stars";
                    wxtheme   = "dark";
                  }
                  
                } else if (wxtitle.indexOf('Hail') !== -1) {
                  wxicon    = "wi-hail";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Smoke') !== -1) {
                  wxicon    = "wi-smog";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Light Thunderstorm') !== -1) {
                  wxicon    = "wi-storm-showers";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Heavy Thunderstorm') !== -1) {
                  wxicon    = "wi-thunderstorm";
                  wxtheme   = "darkest";
                } else if (wxtitle.indexOf('Thunderstorm') !== -1) {
                  wxicon    = "wi-lightning";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Light Rain Fog/Mist') !== -1) {
                  wxicon    = "wi-sprinkle";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Fog') !== -1) {
                  wxicon    = "wi-fog";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Light Rain') !== -1) {
                  wxicon    = "wi-day-showers";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Heavy Rain') !== -1) {
                  wxicon    = "wi-rain";
                  wxtheme   = "dark";
                } else if (wxtitle.indexOf('Freezing Rain') !== -1) {
                  wxicon    = "wi-day-sprinkle";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Rain') !== -1) {
                  wxicon    = "wi-day-rain";
                  wxtheme   = "neutral";
                } else if (wxtitle.indexOf('Snow Showers') !== -1) {
                  wxicon    = "wi-day-snow";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Snow') !== -1) {
                  wxicon    = "wi-snow";
                  wxtheme   = "light";
                } else if (wxtitle.indexOf('Sleet') !== -1) {
                  wxicon    = "wi-sleet";
                  wxtheme   = "light";
                } else {
                  wxicon    = "wi-thermometer";
                  wxtheme   = "dark";
                }
                
                wxtheme = "wx-" + wxtheme;
                
                wxthis = '<a href="' + wxlink + '" target="_blank"><p>' + wxtitle + '</p></a><span class="wx-now"><span class="wx-icon-now '+wxicon+'" title="'+ wxdescription +'"></span><span class="wx-temp" title="'+wxtemp_c+'">'+wxtemp_f+'</span></span>';
            });
        
        $(".wxout_now").append(wxthis);
        $(".wx-feeds .container-theme").addClass(wxtheme);
        
        }	
    });
    
}