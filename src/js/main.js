const TO_NAME = 1;
const TO_ABBREVIATED = 2;


function init_config() {
    
	get_state();
	get_county();
	get_obs_select();
    
}


function set_warnings() {
    
    if(localStorage.getItem("wx_warnings") == null){
        $.getJSON("config.json", function(data){
            var wx_warnings = data.wx_warnings;
            localStorage.setItem("wx_warnings", wx_warnings);
        });
    } else {
        var wx_warnings = localStorage.getItem("wx_warnings"); 
    }
    
    return wx_warnings;
}


function set_watches() {
    
    if(localStorage.getItem("wx_watches") == null){
        $.getJSON("config.json", function(data){
            var wx_watches = data.wx_watches;
            localStorage.setItem("wx_watches", wx_watches);
        });
    } else {
        var wx_watches = localStorage.getItem("wx_watches"); 
    }
    
    return wx_watches;
}

function init_alerts() {
    
    var feedstate              = get_state().toLowerCase();
    var feedin                 = "https://alerts.weather.gov/cap/"+feedstate+".php?x=0";
	var feedin                 = "http://localhost:3000/alerts.xml";
	var feedout          	   = [];
	var items            	   = [];
    var feedthis               = "";
    var feedout_blank          = '<div class="card"><div class="card-body"><small>No alerts or advisories posted at the moment ...</div></div></small>';
    
	var wx_warnings = set_warnings().split(",");
	
	$.each( wx_warnings, function( key, value ) {
		var wx_type = value.toLowerCase().trim();
		items[wx_type] 		= 0;
		feedout[wx_type] 	= "";
	});
	
	// WRITE THE HTML CONTAINERS FOR THE CONFIGURED WARNING ACCORDIONS
	$.each( wx_warnings, function( key, value ) {
	  	
		var wx_warn_upper = value.toUpperCase().trim();
		var wx_warn_lower = value.toLowerCase().trim();
		console.log( "Warning Set : " + wx_warn_upper);
		
		var wx_warn_html = `<div class="panel panel-`+wx_warn_lower+`" role="tablist"> 
			<button 
				aria-controls="collapsePanel`+wx_warn_lower+`" 
				aria-expanded="false" 
				class="btn btn-unstyled panel-header panel-header-link collapse-icon collapse-icon-middle collapsed" 
				data-target="#collapsePanel`+wx_warn_lower+`" 
				data-toggle="collapse" 
				role="tab" 
			> 
				<span class="panel-title">`+toTitleCase(wx_warn_lower)+` Warnings ( <span class="items_`+wx_warn_lower+`"></span> )</span> 
				
			</button> 
			<div 
				class="panel-collapse collapse" 
				id="collapsePanel`+wx_warn_lower+`" 
				role="tabpanel" 
			> 
				<div class="panel-body"> 
					<div class="feedout_`+wx_warn_lower+`"></div> 
				</div> 
			</div> 
		</div>`;
		
		$("#wx_alerts").append(wx_warn_html);
	});	
	
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
				var alertarea_lower = alertarea.toLowerCase();
                
				
				// https://www.weather.gov/lwx/WarningsDefined
                
                //if(alertevent.indexOf("Warning") !== -1 && alertarea_lower.indexOf(get_county()) !== -1) {
				if(alertevent.indexOf("Warning") !== -1 || alertevent.indexOf("Special Weather Statement") !== -1 || alertevent.indexOf("Advisory") !== -1 ) {
                    if(alerturgency.indexOf("Immediate") !== -1) {
                        alertlevel = "alert-now";
                    } else {
                        alertlevel = "alert-plan";
                    }
                
                    if(alertevent.indexOf("Flood") !== -1) {
                        feedout_icon = "flood";
                        items["flood"]++;
                    } else if(alertevent.indexOf("Wind") !== -1) {
                        feedout_icon = "wind";
                        items["wind"]++;
                    } else if(alertevent.indexOf("Thunderstorm") !== -1) {
                        feedout_icon = "storm";
                        items["storm"]++;
                    } else if(alertevent.indexOf("Tornado") !== -1) {
                        feedout_icon = "tornado";
                        items["tornado"]++;
                    } else if(alertevent.indexOf("Red Flag") !== -1) {
                        feedout_icon = "fire";
                        items["fire"]++;
                    } else if(alertevent.indexOf("Freeze") !== -1) {
                        feedout_icon = "freeze";
                        items["winter"]++;
					} else if(alertevent.indexOf("Ice") !== -1) {
                        feedout_icon = "freeze";
                        items["winter"]++;
					} else if(alertevent.indexOf("Frost") !== -1) {
                        feedout_icon = "freeze";
                        items["winter"]++;
                    } else if(alertevent.indexOf("Winter") !== -1) {
                        feedout_icon = "winter";
                        items["winter"]++;
                    } else if(alertevent.indexOf("Hurricane") !== -1) {
                        feedout_icon = "hurricane";
                        items["hurricane"]++;

                    } else {
                        if(alertsummary.indexOf("thunderstorm") !== -1) {
							feedout_icon = "storm";
							items["storm"]++;
						} else {
							feedout_icon = "other";
							items["other"]++;
						}
                    }
                    
                    
                    feedthis = '<div class="card '+ alertlevel +'"><div class="card-body"><span class="wx-icon wx-'+ feedout_icon +'"></span><h5 class="card-title">' + alertevent + '<br><small>' + alerturgency + '</small></h5><hr><p><strong>' + alerttitle + '</strong></p><p class="card-text">'+ alertarea +'<br><br><small>'+ alertsummary + '</small></p><p><a href="'+ alertlink +'" target="_blank">Read On Weather.gov</a></p></div></div>';
                    
					
					console.log(alertsummary);
					
                    if(alertevent.indexOf("Flood") !== -1) {
                        feedout["flood"] += feedthis;
                    } else if(alertevent.indexOf("Wind") !== -1) {
                        feedout["wind"] += feedthis;
                    } else if(alertevent.indexOf("Thunderstorm") !== -1) {
                        feedout["storm"] += feedthis;
						
						
						
                    } else if(alertevent.indexOf("Tornado") !== -1) {
                        feedout["tornado"] += feedthis;
						
						if(!$(".container-theme").hasClass("wx-danger")) {
						   $(".container-theme").addClass("wx-danger");
						   $(".wx-danger h4").html("TORNADO WARNING");
						   $(".wx-danger p").text(alertarea);

						   $(".wxout_now .wx-icon-now").addClass("wi-tornado");
						}
						
                    } else if(alertevent.indexOf("Red Flag") !== -1) {
                        feedout["fire"] += feedthis;
                    } else if(alertevent.indexOf("Freeze") !== -1) {
                        feedout["winter"] += feedthis;
					} else if(alertevent.indexOf("Ice") !== -1) {
                        feedout["winter"] += feedthis;
					} else if(alertevent.indexOf("Frost") !== -1) {
                        feedout["winter"] += feedthis;
                    } else if(alertevent.indexOf("Winter") !== -1) {
                        feedout["winter"] += feedthis;
                    } else if(alertevent.indexOf("Hurricane") !== -1) {
                        feedout["hurricane"] += feedthis;
                    
					} else {
						if(alertsummary.indexOf("thunderstorm") !== -1) {
                        	feedout["storm"] += feedthis;
							
						} else {
							feedout["other"] += feedthis;
							
						}
                    }
                    
                }    
            });
			
		
			
			$.each( set_warnings().split(","), function( index, value ) {
				var wx_type = value.toLowerCase().trim();
				if(items[wx_type] > 0) {
					
					$(".feedout_"+wx_type).append(feedout[wx_type]);
					$(".items_"+wx_type).text(items[wx_type]);
					$(".panel-"+wx_type).show();
					
					$("#wx_alerts .panel-tornado .panel-header").attr("aria-expanded", true).removeClass("collapsed");
					$("#wx_alerts .panel-tornado .panel-collapse").removeClass("collapse");
				}
			});
			
			
			
			
			

			

			
			
		},
        complete: function() {
            log_time("WX - Alerts last checked: ");
        }
	});
}

function init_current() {
    
    var wx_state        = get_state().toUpperCase();
	var wx_obs          = get_obs_select().toUpperCase();
    var wxin            = "https://w1.weather.gov/xml/current_obs/"+wx_obs+".rss";
    //var wxin            = "http://localhost:3000/current.xml";
	var wxthis          = "";
    var wxtheme         = "";
    
    $('.wx-state').text(wx_state);
    //localStorage.setItem("wx_state", wx_state);
	
    const hours         = new Date().getHours();
    const isDayTime     = hours > 6 && hours < 20;
    
	if (localStorage.getItem("obs_updated") === null) {
		// WHEN LAST OBS DATE NOT IN STORAGE DEFAULT TO OVER AN HOUR AGO
		var obs_updated 	= parseInt(Date.now()-4500000 );
	} else {
		var obs_updated 	= localStorage.getItem("obs_updated");
	}
	var obs_ttl 		= localStorage.getItem("obs_ttl");
	var sys_time		= Math.round(new Date().getTime());
	var obs_difference	= Math.round(((sys_time - obs_updated) / 1000) / 60);
	
	console.log("Observation taken " + obs_difference + " minutes ago");
	
	// BACK OFF FROM CALLING ON OBS STATION UNTIL TTL HAS ELAPSED USUALLY 60min + 10
	if(obs_difference > obs_ttl) {
		console.log("Dialing Up NWS Observation Server " + wx_obs + "  ...");
		
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
					var chttl         		= ch.find("ttl").text();
					var chupdated         	= ch.find("lastBuildDate").text();
					var wxlink              = wx.find("link").text();
					var wxtitle             = wx.find("title").text();
					var wxcondition         = wx.find("title").text();
					var wxdescription       = wx.find("description").text().replace(/(<([^>]+)>)/ig,"");
					var wxtemp              = parseInt(wxtitle.match(/\d+/));
					var wxtemp_c            = Math.round(((wxtemp - 32) * (5/9)));
					var wxtemp_c            = wxtemp_c + "°C";
					var wxtemp_f            = wxtemp + "°F";

					localStorage.setItem("obs_ttl", parseInt(chttl)+10);
					localStorage.setItem("obs_updated", Date.parse(chupdated));

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

					wxthis = '<a href="' + wxlink + '" target="_blank"><p>' + wxtitle + ' Observed: <span class="obs-diff">' + obs_difference + '</span> minutes ago</p></a><span class="wx-now"><span class="wx-icon-now '+wxicon+'" title="'+ wxdescription +' - Station: ' + wx_obs + '"></span><span class="wx-temp" title="'+wxtemp_c+'">'+wxtemp_f+'</span></span>';

					/*wxtemps_time = log_time();
					wxtemps = '<div class="carousel-item">' + wxtemp_f + ' ('+ wxtemp_c +') - <small>updated: '+ wxtemps_time +'</small></div>';*/
				});

			// UPDATE CURRENT WX DISPLAY
			$(".wx-feeds .container-theme").addClass(wxtheme);
			localStorage.setItem("wx_theme", wxtheme);
				
			$(".wxout_now").empty();
			$(".wxout_now").append(wxthis);
			$(".wxout_now .obs-diff").text(obs_difference);
				
			localStorage.setItem("wx_now", wxthis);
			
			/*var wxout_temps_count = $(".wxout_temps").children().length;	

			if (wxout_temps_count > 4) {
				$('.wxout_temps div').each(function() {
					//if(!$(this).hasClass("active")) {
						$(this).remove();
					//}
				});
			}	

			$(".wxout_temps").prepend(wxtemps);

			$('.wxout_temps div').each(function() {
				if($(this).hasClass("active")) {
					$(this).removeClass("active");
				}
			});

			$('.wxout_temps div:first').addClass('active');*/



			},
			complete: function() {
				var wxdescription       = $(".wx-icon-now").attr("title");
				log_time("WX - Conditions last checked: ");
				console.log(wxdescription);
				
				
			}	
		});
	} else {
		// UPDATE CURRENT OBS BASED ON STORED DATA NOT NWS LOOKUP
		$(".wx-feeds .container-theme").addClass(localStorage.getItem("wx_theme"));
		

		$(".wxout_now").empty();
		$(".wxout_now").append(localStorage.getItem("wx_now"));
		$(".wxout_now .obs-diff").text(obs_difference);
		
	}
}


function log_time(logmsg) {
    let currentDate = new Date();
	var	cmin		= String(currentDate.getMinutes()).padStart(2, "0");
	var	chrs		= String(currentDate.getHours()).padStart(2, "0");
    let time        = chrs + ":" + cmin;
    if(logmsg){
		console.log(logmsg + time);
	}
	return time;
}




// DEAL WITH DATA GETTING AND STORAGE



function convertRegion(input, to) {
    var states = [
        ['Alabama', 'AL'],
        ['Alaska', 'AK'],
        ['American Samoa', 'AS'],
        ['Arizona', 'AZ'],
        ['Arkansas', 'AR'],
        ['Armed Forces Americas', 'AA'],
        ['Armed Forces Europe', 'AE'],
        ['Armed Forces Pacific', 'AP'],
        ['California', 'CA'],
        ['Colorado', 'CO'],
        ['Connecticut', 'CT'],
        ['Delaware', 'DE'],
        ['District Of Columbia', 'DC'],
        ['Florida', 'FL'],
        ['Georgia', 'GA'],
        ['Guam', 'GU'],
        ['Hawaii', 'HI'],
        ['Idaho', 'ID'],
        ['Illinois', 'IL'],
        ['Indiana', 'IN'],
        ['Iowa', 'IA'],
        ['Kansas', 'KS'],
        ['Kentucky', 'KY'],
        ['Louisiana', 'LA'],
        ['Maine', 'ME'],
        ['Marshall Islands', 'MH'],
        ['Maryland', 'MD'],
        ['Massachusetts', 'MA'],
        ['Michigan', 'MI'],
        ['Minnesota', 'MN'],
        ['Mississippi', 'MS'],
        ['Missouri', 'MO'],
        ['Montana', 'MT'],
        ['Nebraska', 'NE'],
        ['Nevada', 'NV'],
        ['New Hampshire', 'NH'],
        ['New Jersey', 'NJ'],
        ['New Mexico', 'NM'],
        ['New York', 'NY'],
        ['North Carolina', 'NC'],
        ['North Dakota', 'ND'],
        ['Northern Mariana Islands', 'NP'],
        ['Ohio', 'OH'],
        ['Oklahoma', 'OK'],
        ['Oregon', 'OR'],
        ['Pennsylvania', 'PA'],
        ['Puerto Rico', 'PR'],
        ['Rhode Island', 'RI'],
        ['South Carolina', 'SC'],
        ['South Dakota', 'SD'],
        ['Tennessee', 'TN'],
        ['Texas', 'TX'],
        ['US Virgin Islands', 'VI'],
        ['Utah', 'UT'],
        ['Vermont', 'VT'],
        ['Virginia', 'VA'],
        ['Washington', 'WA'],
        ['West Virginia', 'WV'],
        ['Wisconsin', 'WI'],
        ['Wyoming', 'WY'],
    ];
	
	var provinces = [
        ['Alberta', 'AB'],
        ['British Columbia', 'BC'],
        ['Manitoba', 'MB'],
        ['New Brunswick', 'NB'],
        ['Newfoundland', 'NF'],
        ['Northwest Territory', 'NT'],
        ['Nova Scotia', 'NS'],
        ['Nunavut', 'NU'],
        ['Ontario', 'ON'],
        ['Prince Edward Island', 'PE'],
        ['Quebec', 'QC'],
        ['Saskatchewan', 'SK'],
        ['Yukon', 'YT'],
    ];
	
    var regions = states.concat(provinces);
	
	
    var i;
    if (to == TO_ABBREVIATED) {
        input = input.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        for (i = 0; i < regions.length; i++) {
            if (regions[i][0] == input) {
                return (regions[i][1]);
            }
        }
    } else if (to == TO_NAME) {
        input = input.toUpperCase();
        for (i = 0; i < regions.length; i++) {
            if (regions[i][1] == input) {
                return (regions[i][0]);
            }
        }
    }
}


function get_state() {
    
    if(localStorage.getItem("wx_state") == null){
        $.getJSON("config.json", function(data){
            var wx_state = data.wx_state;
            localStorage.setItem("wx_state", wx_state);
        });
    } else {
        var wx_state = localStorage.getItem("wx_state");
        $('#ps-config #wx_state option').each(function() {
            if($(this).val() == wx_state) {
                $(this).prop('selected', true);
            }
        }); 
    }
    
    return wx_state;
}

function set_state(wx_state) {
    localStorage.setItem("wx_state", wx_state);
}



function lookup_counties(obs_state) {
	
	$("#obs_counties").load('counties.html .jquery-tablesorter', function(responseTxt, statusTxt, jqXHR){
			if(statusTxt == "success"){
				
				$('#wx_county')
						.find('option')
						.remove()
						.end()
				;
				
				var obs_state_upper = obs_state.toUpperCase();
				var obs_state_name  = convertRegion(obs_state_upper, TO_NAME);
				
				$('tr').each(function() {
					var t_row = $(this).find("a").attr("title");
					
					
					if(t_row.indexOf(obs_state_name) !== -1){
						var t_split 		= t_row.split(",");
						var county_name 	= t_split[0].replace("County", "").trim();
						var state_name 		= t_split[1];

						console.log(county_name);
						
						if(county_name.toLowerCase().trim() == localStorage.getItem("wx_county").toLowerCase().trim()){
							var county_select	= '<option value="'+ county_name.toLowerCase() +'" selected>'+ county_name +'</option>';
						} else {
							var county_select	= '<option value="'+ county_name.toLowerCase() +'">'+ county_name +'</option>';
						}
						// BUILD DROP DOWN
						$('#wx_county').append(county_select);
					}
				});

			}
			if(statusTxt == "error"){
				alert("Wikipedia Scrape Error (check for changed HTML): " + jqXHR.status + " " + jqXHR.statusText);
			}
		});
	
	
	
}



function lookup_obs(obs_state) {
	
	
	
	
	if (localStorage.getItem('wx_obs_'+ obs_state) === null) {
	// LOAD NWS SEARCH FROM TABLE CONTAINING STATIONS (SCREEN SCRAPE)
		$("#obs_collect").load('https://w1.weather.gov/xml/current_obs/seek.php?state='+ obs_state +'&Find=Find table[cellpadding="3"]', function(responseTxt, statusTxt, jqXHR){
			if(statusTxt == "success"){

				console.log("NWS Scrape OK: " + jqXHR.status + " " + jqXHR.statusText);

				let store_obs_name = [];
				let store_obs_wxid = [];

				$('#wx_obs')
						.find('option')
						.remove()
						.end()
				;

				// SNIFF DOM FOR TABLE OF SEARCH RESULTS
				$('#obs_collect table tbody tr td[headers="Station Name"]').each(function(index) {
					var station_wxid 	= $(this).find("a").attr("href").split("=");
					var station_name 	= $(this).find("a").text();
					var station_select	= '<option value="'+ station_wxid[1].toLowerCase() +'">'+ station_name +'</option>';

					// BUILD ARRAYS
					store_obs_name.push(station_name);
					store_obs_wxid.push(station_wxid[1]);

					// BUILD DROP DOWN
					$('#wx_obs').append(station_select);

				});

				// SELECT THE CURRENT SELECTED STATION IF ANY
				var obs_selected 	= get_obs();
				$('#ps-config #wx_obs option').each(function() {
					if($(this).val() == obs_selected) {
						$(this).attr('selected', 'selected');
					}
				});

				// BUILD AN OBJECT OF FOUND OBS STATIONS TO STORE IN LOCAL STORAGE
				var store_obs_json = "{";
				$.each(store_obs_wxid, function(index, value){
					store_obs_json += '"'+value.toLowerCase()+'" : { "name" : "'+store_obs_name[index]+'"},';
				}); store_obs_json = store_obs_json.slice(0, -1) + "}";

				// STORE STATION DATA IN BROWSER, NEXT TIME LOAD FROM LOCAL STORAGE WITHOUT SCRAPE
				localStorage.setItem('wx_obs_'+ obs_state, store_obs_json);

			}
			if(statusTxt == "error"){
				alert("NWS Scrape Error (check for changed HTML): " + jqXHR.status + " " + jqXHR.statusText);
			}
		});
	} else {
		// IF STATE OBSERVATION STATIONS ALREADY IN LOCAL STORAGE ...
		var obs_fetch 		= JSON.parse(localStorage.getItem('wx_obs_'+ obs_state));
		var obs_selected 	= get_obs();
		
		console.log("Cached Stations For "+obs_state.toUpperCase()+":\n\n");
		console.log(obs_fetch);
		
		// CLEAR DROP DOWN
		$('#wx_obs')
				.find('option')
				.remove()
				.end()
		;
		
		// BUILD DROP DOWN
		$.each(obs_fetch, function(index, value){
			var station_wxid 	= index;
			var station_name 	= value["name"];
			if(station_wxid == obs_selected){
				var station_select	= '<option value="'+ station_wxid.toLowerCase() +'" selected>'+ station_name +'</option>';
			} else {
				var station_select	= '<option value="'+ station_wxid.toLowerCase() +'">'+ station_name +'</option>';
			}
			$('#wx_obs').append(station_select);
		});
		
	}
}



function get_obs_select() {
    
    if(localStorage.getItem("wx_obs") == null){
        $.getJSON("config.json", function(data){
            var wx_obs = data.wx_obs;
            localStorage.setItem("wx_obs", wx_obs);
        });
    } else {
        var wx_obs = localStorage.getItem("wx_obs");
        var station_select	= '<option value="'+ wx_obs +'">'+ wx_obs +'</option';
					
		$('#wx_obs').append(station_select);
		$('#ps-config #wx_obs option').each(function() {
            if($(this).val() == wx_obs) {
                $(this).prop('selected', true);
            }
        }); 
    }
    
    return wx_obs;
}


function get_obs() {
    
    if(localStorage.getItem("wx_obs") == null){
        $.getJSON("config.json", function(data){
            var wx_obs = data.wx_obs;
            localStorage.setItem("wx_obs", wx_obs);
        });
    } else {
        var wx_obs = localStorage.getItem("wx_obs");
        $('#ps-config #wx_obs').val(wx_obs); 
    }
    
    return wx_obs;
}

function set_obs(wx_obs) {
    localStorage.setItem("wx_obs", wx_obs);
}

function set_county(wx_county) {
    localStorage.setItem("wx_county", wx_county);
}

function get_county() {
    
    if(localStorage.getItem("wx_county") == null){
		$.getJSON("config.json", function(data){
            var wx_county = data.wx_county;
            localStorage.setItem("wx_county", wx_county);
        });
    } else {
        var wx_county = localStorage.getItem("wx_county");
        $('#ps-config #wx_county option').each(function() {
            
			if($(this).val().toLowerCase() == wx_county.toLowerCase()) {
                $(this).prop('selected');
            }
        }); 
    }
    
    return wx_county;
}





function clear_storage(item) {
	localStorage.removeItem(item);
}

function init_storage() {
	
	$.getJSON("config.json", function(data){
		if(localStorage.getItem("wx_state") == null){
			localStorage.setItem("wx_state", data.wx_state);
		}
		
		if(localStorage.getItem("wx_obs") == null){
			localStorage.setItem("wx_obs", data.wx_obs);
		}
	
	
	}).fail(function(){
		console.log("Cannot read config.json");
	});
	
}



function toTitleCase(str) {
	var lcStr = str.toLowerCase();
	return lcStr.replace(/(?:^|\s)\w/g, function(match) {
		return match.toUpperCase();
	});
}