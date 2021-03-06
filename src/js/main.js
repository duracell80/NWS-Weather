
function init_config() {
    
	get_state();
	get_county();
	get_scope_form();
	get_warnings();
    get_obs_select();
    
}

function init_config_modal() {

    var obs_state 		= $("#ps-config #wx_state").val(); 
	
	lookup_obs(obs_state);
	lookup_counties_json(obs_state);	
	
	// BUTTON ACTIONS
    $( "#ps-config .set-location" ).click(function() {
		clear_storage("obs_updated");
		
        var wx_state = $("#ps-config #wx_state").val();
        set_state(wx_state);
		
		var wx_county = $("#ps-config #wx_county").val();
		set_county(wx_county);
		get_county();
		
		var wx_obs = $("#ps-config #wx_obs").val();
        set_obs(wx_obs);
		
		var wx_scope = $("#ps-config #wx_scope").val();
        set_scope(wx_scope);
        set_warnings();
		
        alert("Settings saved. Reload the page to see changes.");
        $("#ps-config .btn-close").click();
    });
	
	$( "#ps-config .set-defaults" ).click(function() {
        clear_storage("wx_state");
		clear_storage("wx_county");
		clear_storage("wx_obs");
		clear_storage("wx_scope");
		clear_storage("wx_warnings");
		clear_storage("wx_alerts_checked");
		clear_storage("wx_now_html");
		clear_storage("obs_updated");
		set_scope("state");
		
		// CLEAR FOR ALL STATES AND TRIGGER SCREEN SCRAPE FROM NWS TO OBTAINS STATION ID's
		//clear_states();
		
		init_storage();
        
        alert("Settings Reset. Reload the page to see changes.");
        $("#ps-config .btn-close").click();
//		//init_current("force");
    });
	
	
	
	// ON CHANGE OF STATE GET LIST FROM NOAA OF OBSERVATION STATIONS
	$( "#wx_state" ).change(function() {	
		var obs_state = $(this).val()
		lookup_obs(obs_state);
		lookup_counties_json(obs_state);
	});
}

function init_alerts(atype) {
    var wx_alerts_checked	   = localStorage.getItem("wx_alerts_checked");
	
	var now = new Date();
	var secondsSinceCheck 	= ((Math.round(now.getTime() / 1000)) - (wx_alerts_checked));
	var secondsToWait 		= 600; // 10mins - be kind to the National Weather Service
	
	// BACKOFF ALERTS FOR PERIOD OF TIME
	if((secondsSinceCheck > secondsToWait) || atype == "force")  {
	
		var wx_scope 			   = get_scope();
    	var feedstate              = get_state().toLowerCase();
    
		if (wx_scope == "county" || wx_scope == "state") {
			var feedin                 = "https://alerts.weather.gov/cap/"+feedstate+".php?x=0";
		} else if (wx_scope == "nation") {
			var feedin                 = "https://alerts.weather.gov/cap/us.php?x=0";
		} else {
			var feedin                 = "http://localhost:3000/alerts.xml";
		}
		// DEBUG ALERTS WITH LOCAL
		//var feedin                 = "http://localhost:3000/alerts.xml";
		var feedout          	   = [];
		var items            	   = [];
		var feedthis               = "";
		var feedout_blank          = '<div class="card"><div class="card-body"><small>No alerts or advisories posted at the moment ...</div></div></small>';

		var wx_warnings = get_warnings().split(",");
		
		console.log('Tornado Warnings Cleared');
		localStorage.setItem("wx_tornado", "no");
		
		$.each( wx_warnings, function( key, value ) {
			var wx_type = value.toLowerCase().trim();
			items[wx_type] 		= 0;
			feedout[wx_type] 	= "";
		});

		// WRITE THE HTML CONTAINERS FOR THE CONFIGURED WARNING ACCORDIONS
		// EMPTY THE HTML FIRST
		$("#wx_alerts").empty();

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
					<span class="panel-title">`+toTitleCase(wx_warn_lower)+` ( <span class="items_`+wx_warn_lower+`"></span> )</span> 

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

			// REBULD WARNINGS WITH NEW DATA
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
					 
					
					
					function alertwrite() {
						// https://www.weather.gov/lwx/WarningsDefined

						var wx_scope 		= get_scope();
						
						
						if(alerturgency.indexOf("Immediate") !== -1) {
							alertlevel = "alert-now";
						} else {
							alertlevel = "alert-plan";
						}

						if(alertevent.indexOf("Flood") !== -1) {
							feedout_icon = "flood";
							items["flood"]++;
						} else if(alertevent.indexOf("Tropical") !== -1) {
							feedout_icon = "hurricane";
							items["storm"]++;
						} else if(alertevent.indexOf("Storm Surge") !== -1) {
							feedout_icon = "flood";
							items["storm_surge"]++;
						} else if(alertevent.indexOf("Surf") !== -1) {
							feedout_icon = "surf";
							items["wind"]++;
						} else if(alertevent.indexOf("Wind") !== -1) {
							feedout_icon = "wind";
							items["wind"]++;
						} else if(alertevent.indexOf("Thunderstorm") !== -1) {
							feedout_icon = "storm";
							items["storm"]++;
						} else if(alertevent.indexOf("Tornado") !== -1) {
							feedout_icon = "tornado";
							items["tornado"]++;
						} else if(alertevent.indexOf("Heat") !== -1) {
							feedout_icon = "heat";
							items["heat"]++;
						} else if(alertevent.indexOf("Red Flag") !== -1) {
							feedout_icon = "fire";
							items["fire"]++;
						} else if(alertevent.indexOf("Fire Weather") !== -1) {
							feedout_icon = "fire";
							items["fire"]++;
						} else if(alertevent.indexOf("Smoke") !== -1) {
							feedout_icon = "smoke";
							items["air_quality"]++;
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
							} else if(alertsummary.indexOf("heat index") !== -1) {
								feedout_icon = "heat";
								items["heat"]++;
							} else if(alertsummary.indexOf("heat") !== -1) {
								feedout_icon = "heat";
								items["heat"]++;
							} else if(alertsummary.indexOf("air quality") !== -1) {
								feedout_icon = "smoke";
								items["air_quality"]++;	
							} else if(alertsummary.indexOf("smoke") !== -1) {
								feedout_icon = "smoke";
								items["air_quality"]++;
							} else if(alertsummary.indexOf("surf") !== -1) {
								feedout_icon = "surf";
								items["wind"]++;
							} else if(alertsummary.indexOf("gusty winds") !== -1) {
								feedout_icon = "wind";
								items["wind"]++;
							} else {
								feedout_icon = "other";
								items["other"]++;
							}
						}

						if(wx_scope == "nation") {


							if(1 == 1){
								if(alertsummary.indexOf('Alabama') !== -1) {
									alerturgency = "State: Alabama";
								} else if(alertsummary.indexOf('Alaska') !== -1) {
									alerturgency = "State: Alaska";
								} else if(alertsummary.indexOf('Arizona') !== -1) {
									alerturgency = "State: Arizona";
								} else if(alertsummary.indexOf('Arkansas') !== -1) {
									alerturgency = "State: Arkansas";
								} else if(alertsummary.indexOf('California') !== -1) {
									alerturgency = "State: California";
								} else if(alertsummary.indexOf('Colorado') !== -1) {
									alerturgency = "State: Colorado";
								} else if(alertsummary.indexOf('Connecticut') !== -1) {
									alerturgency = "State: Connecticut";
								} else if(alertsummary.indexOf('Delaware') !== -1) {
									alerturgency = "State: Delaware";
								} else if(alertsummary.indexOf('District Of Columbia') !== -1) {
									alerturgency = "State: District Of Columbia";
								} else if(alertsummary.indexOf('Florida') !== -1) {
									alerturgency = "State: Florida";
								} else if(alertsummary.indexOf('Georgia') !== -1) {
									alerturgency = "State: Georgia";
								} else if(alertsummary.indexOf('Hawaii') !== -1) {
									alerturgency = "State: Hawaii";
								} else if(alertsummary.indexOf('Idaho') !== -1) {
									alerturgency = "State: Idaho";
								} else if(alertsummary.indexOf('Illinois') !== -1) {
									alerturgency = "State: Illinois";
								} else if(alertsummary.indexOf('Indiana') !== -1) {
									alerturgency = "State: Indiana";
								} else if(alertsummary.indexOf('Iowa') !== -1) {
									alerturgency = "State: Iowa";
								} else if(alertsummary.indexOf('Kansas') !== -1) {
									alerturgency = "State: Kansas";
								} else if(alertsummary.indexOf('Kentucky') !== -1) {
									alerturgency = "State: Kentucky";
								} else if(alertsummary.indexOf('Louisiana') !== -1) {
									alerturgency = "State: Louisiana";
								} else if(alertsummary.indexOf('Maine') !== -1) {
									alerturgency = "State: Maine";
								} else if(alertsummary.indexOf('Maryland') !== -1) {
									alerturgency = "State: Maryland";
								} else if(alertsummary.indexOf('Massachusetts') !== -1) {
									alerturgency = "State: Massachusetts";
								} else if(alertsummary.indexOf('Michigan') !== -1) {
									alerturgency = "State: Michigan";
								} else if(alertsummary.indexOf('Minnesota') !== -1) {
									alerturgency = "State: Minnesota";
								} else if(alertsummary.indexOf('Mississippi') !== -1) {
									alerturgency = "State: Mississippi";
								} else if(alertsummary.indexOf('Missouri') !== -1) {
									alerturgency = "State: Missouri";
								} else if(alertsummary.indexOf('Montana') !== -1) {
									alerturgency = "State: Montana";
								} else if(alertsummary.indexOf('Nebraska') !== -1) {
									alerturgency = "State: Nebraska";
								} else if(alertsummary.indexOf('Nevada') !== -1) {
									alerturgency = "State: Nevada";
								} else if(alertsummary.indexOf('New Hampshire') !== -1) {
									alerturgency = "State: New Hampshire";
								} else if(alertsummary.indexOf('New Jersey') !== -1) {
									alerturgency = "State: New Jersey";
								} else if(alertsummary.indexOf('New Mexico') !== -1) {
									alerturgency = "State: New Mexico";
								} else if(alertsummary.indexOf('New York') !== -1) {
									alerturgency = "State: New York";
								} else if(alertsummary.indexOf('North Carolina') !== -1) {
									alerturgency = "State: North Carolina";
								} else if(alertsummary.indexOf('North Dakota') !== -1) {
									alerturgency = "State: North Dakota";
								} else if(alertsummary.indexOf('Ohio') !== -1) {
									alerturgency = "State: Ohio";
								} else if(alertsummary.indexOf('Oklahoma') !== -1) {
									alerturgency = "State: Oklahoma";
								} else if(alertsummary.indexOf('Oregon') !== -1) {
									alerturgency = "State: Oregon";
								} else if(alertsummary.indexOf('Pennsylvania') !== -1) {
									alerturgency = "State: Pennsylvania";
								} else if(alertsummary.indexOf('Rhode Island') !== -1) {
									alerturgency = "State: Rhode Island";
								} else if(alertsummary.indexOf('South Carolina') !== -1) {
									alerturgency = "State: South Carolina";
								} else if(alertsummary.indexOf('South Dakota') !== -1) {
									alerturgency = "State: South Dakota";
								} else if(alertsummary.indexOf('Tennessee') !== -1) {
									alerturgency = "State: Tennessee";
								} else if(alertsummary.indexOf('Texas') !== -1) {
									alerturgency = "State: Texas";
								} else if(alertsummary.indexOf('Utah') !== -1) {
									alerturgency = "State: Utah";
								} else if(alertsummary.indexOf('Vermont') !== -1) {
									alerturgency = "State: Vermont";
								} else if(alertsummary.indexOf('Virginia') !== -1) {
									alerturgency = "State: Virginia";
								} else if(alertsummary.indexOf('Washington') !== -1) {
									alerturgency = "State: Washington";
								} else if(alertsummary.indexOf('West Virginia') !== -1) {
									alerturgency = "State: West Virginia";
								} else if(alertsummary.indexOf('Wisconsin') !== -1) {
									alerturgency = "State: Wisconsin";
								} else if(alertsummary.indexOf('Wyoming') !== -1) {
									alerturgency = "State: Wyoming";
								} else {
									alerturgency = "Scope: All State";
								}

							} else {
								alerturgency = "Scope: National";
							}
						}

						feedthis = '<div class="card '+ alertlevel +'"><div class="card-body"><span class="wx-icon wx-'+ feedout_icon +'"></span><h5 class="card-title">' + alertevent + '<br><small>' + alerturgency + '</small></h5><hr><p><strong>' + alerttitle + '</strong></p><p class="card-text">'+ alertarea +'<br><br><small>'+ alertsummary + '</small></p><p><a href="'+ alertlink +'" target="_blank">Read On Weather.gov</a></p></div></div>';


						console.log(alertsummary);

						if(alertevent.indexOf("Flood") !== -1) {
							feedout["flood"] += feedthis;
						} else if(alertevent.indexOf("Tropical") !== -1) {
							feedout["storm"] += feedthis;
						} else if(alertevent.indexOf("Storm Surge") !== -1) {
							feedout["storm_surge"] += feedthis;
						} else if(alertevent.indexOf("Surf") !== -1) {
							feedout["wind"] += feedthis;
						} else if(alertevent.indexOf("Wind") !== -1) {
							feedout["wind"] += feedthis;
						} else if(alertevent.indexOf("Thunderstorm") !== -1) {
							feedout["storm"] += feedthis;

						} else if(alertevent.indexOf("Tornado") !== -1) {
							
							if(alertevent.indexOf("Tornado Warning") !== -1) {
							
								feedout["tornado"] += feedthis;
								localStorage.setItem("wx_tornado", "yes");

								if(!$(".container-theme").hasClass("wx-danger")) {
                                   
								   var wxtimefind = alertsummary.toLowerCase().indexOf('until');
								   var wxtime = alertsummary.substring(wxtimefind, wxtimefind + 16);
								   $(".container-theme").addClass("wx-danger");
								   $(".btn-theme").addClass("wx-danger");
								   $(".wx-danger h4").html("TORNADO'S POSSIBLE");
								   //$(".wx-danger p").text(alertarea + ' - ' + alerttitle);
								   $(".wx-danger p").text(alertarea + ' - ' + wxtime);
								   $(".wxout_now .wx-icon-now").removeClassStartingWith('wi');
								   $(".wxout_now .wx-icon-now").addClass("wi-tornado");
								   $(".wxout_now a").attr('href', alertlink);

								   $(".wxout_now .wx-icon-now").attr('data-content', alertsummary);
								   //$(".wxout_now .wx-temp").attr('title', 'Seek Shelter');	
								} else {
									$(".btn-theme").removeClass("wx-danger");

								}
							} else if(alertevent.indexOf("Tornado Watch") !== -1) {
								feedout["tornado"] += feedthis;
							} else {
								
							}

						} else if(alertevent.indexOf("Heat") !== -1) {
							feedout["heat"] += feedthis;
						} else if(alertevent.indexOf("Red Flag") !== -1) {
							feedout["fire"] += feedthis;
						} else if(alertevent.indexOf("Fire Weather") !== -1) {
							feedout["fire"] += feedthis;
						} else if(alertevent.indexOf("Smoke") !== -1) {
							feedout["air_quality"] += feedthis;
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
							} else if(alertsummary.indexOf("heat index") !== -1) {
								feedout["heat"] += feedthis;
							} else if(alertsummary.indexOf("heat") !== -1) {
								feedout["heat"] += feedthis;
							} else if(alertsummary.indexOf("air quality") !== -1) {
								feedout["air_quality"] += feedthis;
							} else if(alertsummary.indexOf("surf") !== -1) {
								feedout["wind"] += feedthis;
							} else if(alertsummary.indexOf("gusty winds") !== -1) {
								feedout["wind"] += feedthis;
							} else {
								feedout["other"] += feedthis;

							}
						}
						
						
					}

					if (wx_scope == "nation") {
						var alerttype = "broadest";

						if(alertevent.indexOf("Watch") !== -1 || alertevent.indexOf("Warning") !== -1 || alertevent.indexOf("Special Weather Statement") !== -1 || alertevent.indexOf("Advisory") !== -1 ) {
							alertwrite();
						}

					} else if (wx_scope == "state") {
						var alerttype = "broad";

						if(alertevent.indexOf("Warning") !== -1 || alertevent.indexOf("Special Weather Statement") !== -1 || alertevent.indexOf("Advisory") !== -1) {
							alertwrite();
						}	

					} else if (wx_scope == "county") {
						var alerttype = "narrow";

						if((alertevent.indexOf("Warning") !== -1 || alertevent.indexOf("Special Weather Statement") !== -1 || alertevent.indexOf("Advisory") !== -1) && alertarea_lower.indexOf(get_county()) !== -1 ) {
							alertwrite();
						}

					} else {
						var alerttype = "cached";

						if((alertevent.indexOf("Watch") !== -1 || alertevent.indexOf("Warning") !== -1 || alertevent.indexOf("Special Weather Statement") !== -1 || alertevent.indexOf("Advisory") !== -1)) {
							alertwrite();
						}

					}



					





				});



				$.each( get_warnings().split(","), function( index, value ) {
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
				localStorage.setItem("wx_alerts", $('#wx_alerts').html());
				localStorage.setItem("wx_now_html", $('.container-theme').html());
			}
		});
	} else {
		var secondsRemaining = secondsToWait - secondsSinceCheck;
		var minutesRemaining = 5;
		$('#wx_alerts').html(localStorage.getItem("wx_alerts"));
		
		if(get_scope() != "off"){
			
			if (secondsRemaining > 540) {
				minutesRemaining = "10";
			} else if (secondsRemaining > 480) {
				minutesRemaining = "9";
			} else if (secondsRemaining > 420) {
				minutesRemaining = "8";
			} else if (secondsRemaining > 360) {
				minutesRemaining = "7";
			} else if (secondsRemaining > 300) {
				minutesRemaining = "6";
            } else if (secondsRemaining > 240) {
				minutesRemaining = "5";
			} else if (secondsRemaining > 180) {
				minutesRemaining = "4";
			} else if (secondsRemaining > 120) {
				minutesRemaining = "3";
			} else if (secondsRemaining > 60) {
				minutesRemaining = "2";
			} else {
				minutesRemaining = "1";
			}
			
			var alertbackoff = "Alert backoff active, wait another " + secondsRemaining + " seconds";
			if (minutesRemaining > 1) {
                $('.btn-theme .btn-reload').attr('title', 'Click to force an alert reload, auto reload in ' + minutesRemaining + ' minutes');
            } else {
                $('.btn-theme .btn-reload').attr('title', 'Click to force an alert reload, auto reload in ' + minutesRemaining + ' minute');
            }
			$('.btn-theme .btn-reload').html('<strong><i class="bi bi-arrow-clockwise"></i> Alerts (' + minutesRemaining +'m)</strong>');
			console.log(alertbackoff);
		}
	}
}

function init_current() {
    
	
	// DO THE MOON
	var moon_icon 	= "wi-moon-new";
	var moon_phase 	= "New Moon";
	
	
	let nowdate = new Date(Date.now());
	var year = nowdate.getYear(),
		month = nowdate.getMonth(),
		day = nowdate.getDay();

	if (month < 3) {
		year--;
		month += 12;
	}

	++month;

	jd = 365.25 * year + 30.6 * month + day - 694039.09; // jd is total days elapsed
	jd /= 29.53; // divide by the moon cycle (29.53 days)
	phase = parseInt(jd, 10); // int(jd) -> phase, take integer part of jd
	jd -= phase; // subtract integer part to leave fractional part of original jd
	phase = Math.ceil(jd * 8); // scale fraction from 0-8 and round by adding 0.5
	phase = phase & 7; // 0 and 8 are the same so turn 8 into 0
	
	console.log(phase);
	
	
	switch (phase) {
		case 0: moonpc = 0; "New Moon"; phase = "New Moon"; 		moon_icon 	= "wi-moon-new"; break;
		case 1: moonpc = 12.5; phase = "Waxing Crescent Moon"; 		moon_icon 	= "wi-moon-waxing-crescent"; break;
		case 2: moonpc = 25; phase = "Quarter Moon"; 				moon_icon 	= "wi-moon-first-quarter"; break;
		case 3: moonpc = 37.5; phase = "Waxing Gibbous Moon"; 		moon_icon 	= "wi-moon-waxing-gibbous"; break;
		case 4: moonpc = 50; phase = "Full Moon"; 					moon_icon 	= "wi-moon-full"; phase = "Full Moon"; break;
		case 5: moonpc = 62.5; phase = "Waning Gibbous Moon"; 		moon_icon 	= "wi-moon-waning-gibbous"; break;
		case 6: moonpc = 75; phase = "Last Quarter Moon";			moon_icon 	= "wi-moon-last-quarter"; break;
		case 7: moonpc = 87.5; phase = "Waning Crescent Moon"; 		moon_icon 	= "wi-moon-waning-crescent"; break;
	}
	
	console.log("Moon Phase: " + phase);
	
	localStorage.setItem("wx_moon_icon", moon_icon);
	localStorage.setItem("wx_moon_phase", phase);

	$('.moon_now .moon-icon-now').removeClassStartingWith('wi');
	$('.moon_now .moon-icon-now').addClass(moon_icon);
	$('.moon_now .moon-phase').text(phase);
	// END MOON
	
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
    
    if(localStorage.getItem("obs_updated") === "null") {
        var obs_updated     = 0
    }
    
	var obs_ttl 		= parseInt(localStorage.getItem("obs_ttl"));

	var sys_time		= Math.round(new Date().getTime());
	var obs_difference	= Math.round(((sys_time - obs_updated) / 1000) / 60);
	var obs_wait		= obs_ttl - obs_difference;
	
	if(get_scope() == "off"){
		if (obs_wait < 2){
            $('.btn-theme .btn-reload').attr('title', 'Next observation soon');
        } else {
            $('.btn-theme .btn-reload').attr('title', 'Next observation in ' + obs_wait + 'm ... give the Weather Service a break');
        }
        $('.btn-theme .btn-reload').html('<strong><i class="bi bi-arrow-clockwise"></i> Age (' + obs_difference + 'm)</strong>');
	}
	//console.log("Observation taken " + obs_difference + " minutes ago");
	
	// BACK OFF FROM CALLING ON OBS STATION UNTIL TTL HAS ELAPSED USUALLY 60min + 10
    if(isNaN(obs_ttl)) {
        obs_ttl = 0;
        localStorage.setItem("obs_updated", 180);
    }
   
	console.log(obs_difference + ' - ' + obs_ttl);
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
					var wxtemp_c            = wxtemp_c + "??C";
					var wxtemp_f            = wxtemp + "??F";

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
					  
						if(isDayTime) {
							wxicon    = "wi-cloudy";
					  		wxtheme   = "dark";
						} else {
							wxicon    = "wi-night-alt-cloudy";
							wxtheme   = "night";
						}	
						
					} else if (wxtitle.indexOf('Partly Cloudy') !== -1) {
						if(isDayTime) {
							wxicon    = "wi-day-cloudy";
							wxtheme   = "light";
						} else {
							wxicon    = "wi-night-alt-cloudy";
							wxtheme   = "night";
						}
						
					} else if (wxtitle.indexOf('Cloudy') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-cloudy";
							wxtheme   = "neutral";
						} else {
							wxicon    = "wi-cloudy";
							wxtheme   = "night";
						}	
						
					} else if (wxtitle.indexOf('A Few Clouds') !== -1) {
					 
						if(isDayTime) {
 							wxicon    = "wi-day-cloudy";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-stars";
							wxtheme   = "night";
						}
					} else if (wxtitle.indexOf('Clouds') !== -1) {
					  
						if(isDayTime) {
 							wxicon    = "wi-day-cloudy";
					  		wxtheme   = "dark";
						} else {
							wxicon    = "wi-cloudy";
							wxtheme   = "night";
						}
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
					  
						if(isDayTime) {
							wxicon    = "wi-hail";
					  		wxtheme   = "neutral";
						} else {
							wxicon    = "wi-night-alt-hail";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Smoke') !== -1) {
					  
						
						if(isDayTime) {
							wxicon    = "wi-day-fog";
					  		wxtheme   = "neutral";
						} else {
							wxicon    = "wi-smog";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Light Thunderstorm') !== -1) {
						if(isDayTime) {
							wxicon    = "wi-storm-showers";
					  		wxtheme   = "darkest";
						} else {
							wxicon    = "wi-night-alt-lightning";
							wxtheme   = "dark";
						}	
						
					} else if (wxtitle.indexOf('Heavy Thunderstorm') !== -1) {
					  
						if(isDayTime) {
							wxicon    = "wi-storm-showers";
					  		wxtheme   = "darkest";
						} else {
							wxicon    = "wi-night-alt-lightning";
							wxtheme   = "dark";
						}
					} else if (wxtitle.indexOf('Thunderstorm') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-lightning";
							wxtheme   = "neutral";
						} else {
							wxicon    = "wi-night-alt-lightning";
							wxtheme   = "dark";
						}
					} else if (wxtitle.indexOf('Light Rain Fog/Mist') !== -1) {
					  
						if(isDayTime) {
							wxicon    = "wi-day-sprinkle";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-sprinkle";
							wxtheme   = "dark";
						}
					} else if (wxtitle.indexOf('Fog') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-fog";
							wxtheme   = "neutral";
						} else {
							wxicon    = "wi-night-fog";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Light Rain') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-day-showers";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-night-alt-showers";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Heavy Rain') !== -1) {
					 
						if(isDayTime) {
							wxicon    = "wi-rain";
					  		wxtheme   = "dark";
						} else {
							wxicon    = "wi-night-alt-rain";
							wxtheme   = "dark";
						}
					} else if (wxtitle.indexOf('Freezing Rain') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-day-sprinkle";
					  		wxtheme   = "neutral";
						} else {
							wxicon    = "wi-night-alt-sprinkle";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Rain') !== -1) {
					  
						if(isDayTime) {
							wxicon    = "wi-day-rain";
					  		wxtheme   = "neutral";
						} else {
							wxicon    = "wi-night-alt-showers";
							wxtheme   = "dark";
						}
						
					} else if (wxtitle.indexOf('Snow Showers') !== -1) {
					  	
						if(isDayTime) {
							wxicon    = "wi-snow";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-night-alt-snow";
							wxtheme   = "dark";
						}	
					} else if (wxtitle.indexOf('Snow') !== -1) {
					  
						if(isDayTime) {
							wxicon    = "wi-snow";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-night-alt-snow";
							wxtheme   = "dark";
						}	
						
					} else if (wxtitle.indexOf('Sleet') !== -1) {

						if(isDayTime) {
							wxicon    = "wi-sleet";
					  		wxtheme   = "light";
						} else {
							wxicon    = "wi-night-alt-sleet";
							wxtheme   = "dark";
						}
					} else {
					  wxicon    = "wi-thermometer";
					  wxtheme   = "dark";
					}
					
					if(!isDayTime) {
						wxtheme   = "night";
					}

					wxtheme = "wx-" + wxtheme;

					wxthis = '<a href="' + wxlink + '" target="_blank"><p>' + wxtitle + ' </p></a><button class="wx-now" data-toggle="popover" data-placement="right"  data-trigger="focus" title="Observation" data-content="'+ wxdescription.trim() +' - Station: ' + wx_obs + '"><span class="wx-icon-now '+wxicon+'"></span><span class="wx-temp">'+wxtemp_f+'</span></button>';

				});

			// UPDATE CURRENT WX DISPLAY
			$(".wx-feeds .container-theme").removeClassStartingWith('wx');
			$(".wx-feeds .container-theme").addClass(wxtheme);
			$(".wx-feeds .btn-theme").removeClassStartingWith('wx');
			$(".wx-feeds .btn-theme").addClass(wxtheme);
			localStorage.setItem("wx_theme", wxtheme);
				
			$(".wxout_now").empty();
			$(".wxout_now").append(wxthis);
			$(".wxout_now .obs-diff").text(obs_difference);
				
			localStorage.setItem("wx_now", wxthis);
			


			},
			complete: function() {
				var wxdescription       = $(".wx-now").attr("data-content");
				log_time("WX - Conditions last checked: ");
				console.log(wxdescription);
				
				
			}	
		});
	} else {
		// UPDATE CURRENT OBS BASED ON STORED DATA NOT NWS LOOKUP
		$(".wx-feeds .container-theme").removeClassStartingWith('wx');
		$(".wx-feeds .container-theme").addClass(localStorage.getItem("wx_theme"));
		$(".wx-feeds .btn-theme").removeClassStartingWith('wx');
		$(".wx-feeds .btn-theme").addClass(localStorage.getItem("wx_theme"));
		
		
		$(".wxout_now").empty();
		$(".wxout_now").append(localStorage.getItem("wx_now"));
		$(".wxout_now .obs-diff").text(obs_difference);
	}
	
	// RESTORE ALERT WARNING TO NOW IF ANY
	if(localStorage.getItem("wx_tornado") == "yes"){
		//alert('Tornado Active');
		var wx_now_html = localStorage.getItem("wx_now_html");
		if(wx_now_html.indexOf("WARNING") !== -1){
			$('.container-theme').html(wx_now_html);
			$('.container-theme').addClass("wx-danger");
			$(".btn-theme").addClass("wx-danger");
		}
	} else {
		//console.log("Tornado Alert Canceled");
		//localStorage.setItem("wx_now_html", "");
		$(".btn-theme").removeClass("wx-danger");
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
	
	localStorage.setItem("wx_alerts_checked", Math.round(currentDate.getTime() / 1000));
	
	return time;
}







// DEAL WITH DATA GETTING AND STORAGE
function get_state() {
    
	var wx_state = "tn";
	
    if(localStorage.getItem("wx_state") == null){
        $.getJSON("http://localhost:3000/config.json", function(data){
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

function set_scope(wx_scope) {
    localStorage.setItem("wx_scope", wx_scope);
}

function get_scope() {
	
	var wx_scope = "local";
	
	if(localStorage.getItem("wx_scope") == null){
        $.getJSON("http://localhost:3000/config.json", function(data){
            var wx_state = data.wx_scope;
            localStorage.setItem("wx_scope", wx_scope);
        });
    } else {
        var wx_scope = localStorage.getItem("wx_scope");
        //$('#ps-config #wx_scope option').each(function() {
            //if($(this).val() == wx_scope) {
                //$(this).prop('selected', true);
            //}
        //}); 
    }
    
	return wx_scope;
}

function get_scope_form() {

	var wx_scope = localStorage.getItem("wx_scope");
	$('#ps-config #wx_scope option').each(function() {
		if($(this).val() == wx_scope) {
			$(this).prop('selected', true);
		}
	}); 
  
    
	return wx_scope;
}



function lookup_counties_json(obs_state) {
	
	$('#wx_county')
			.find('option')
			.remove()
			.end()
	;
	
	$.getJSON("counties.json", function(data){
        //https://parseapi.back4app.com/classes/Area?limit=8000&order=countyName&keys=countyName,stateAbbreviation
			
        

		function coTitleCase(str) {
		  return str.replace(
			/\w\S*/g,
			function(txt) {
			  return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			}
		  );
		}

		$.each(data.results, function(index, element) {
			var coNameLower = element.countyName.toLowerCase().replace("county", "").replace("city", "").replace("town", "").replace("unorganized", "").replace("purchase", "").replace("plantation", "").replace("academy grant", "").replace("bluff", "").replace("islands", "").replace("ponds", "").replace("parish", "").replace("reservation", "").replace("borough", "").replace("census area", "").replace("'", "").trim();

			var coNameTitle = coTitleCase(coNameLower);
			if(element.stateAbbreviation.toLowerCase() == obs_state.toLowerCase()){
				
				if(coNameLower == localStorage.getItem("wx_county").toLowerCase().trim()){
					var county_select	= '<option value="'+ coNameLower +'" selected>'+ coNameTitle +'</option>';
				} else {
					var county_select	= '<option value="'+ coNameLower +'">'+ coNameTitle +'</option>';
				}
				// BUILD DROP DOWN
				$('#wx_county').append(county_select);
			}
		});

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
    
    var wx_obs = "KBNA";
    
    if(localStorage.getItem("wx_obs") == null){
        $.getJSON("http://localhost:3000/config.json", function(data){
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
        $.getJSON("http://localhost:3000/config.json", function(data){
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
		$.getJSON("http://localhost:3000/config.json", function(data){
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

function get_warnings() {
    
	var wx_warnings = "tornado, storm, wind, flood, winter, other";
	
    if(localStorage.getItem("wx_warnings") == null){
        $.getJSON("http://localhost:3000/config.json", function(data){
            var wx_warnings = data.wx_warnings;
            localStorage.setItem("wx_warnings", wx_warnings);
            get_warnings();
        });
    } else {
        var wx_warnings = localStorage.getItem("wx_warnings");
        var wx_warning  = wx_warnings.split(",");
        
        $.each( wx_warning, function( key, value ) {
            
            var wx_type = value.toLowerCase().trim();
            $('#ps-config #wx_warnings input[type="checkbox"]').each(function() {
                if($(this).val() == wx_type) {
                    $(this).prop('checked', true);
                }
            });
        });
    }
    
    return wx_warnings;
}

function set_warnings() {
    
    var wx_warnings = "";
    $('#ps-config #wx_warnings input[type="checkbox"]').each(function() {
        if($(this).prop('checked')) {
            wx_warnings += $(this).val() + ",";
        }
    });
    
    wx_warnings = wx_warnings.slice(0,-1);
    localStorage.setItem("wx_warnings", wx_warnings);
    
    return wx_warnings;
}







function clear_storage(item) {
	localStorage.removeItem(item);
}

function init_storage() {
	
	$.getJSON("http://localhost:3000/config.json", function(data){
		if(localStorage.getItem("wx_state") == null){
			localStorage.setItem("wx_state", data.wx_state);
		}
		
		if(localStorage.getItem("wx_obs") == null){
			localStorage.setItem("wx_obs", data.wx_obs);
		}
	
	
	}).fail(function(){
		console.log("Cannot read http://localhost:3000/config.json");
	});
	
}



function toTitleCase(str) {
	var lcStr = str.toLowerCase().replace('_', ' ');
	return lcStr.replace(/(?:^|\s)\w/g, function(match) {
		return match.toUpperCase();
	});
}





$(document).ready(function() {
	
	
	$.fn.removeClassStartingWith = function (filter) {
		$(this).removeClass(function (index, className) {
			return (className.match(new RegExp("\\S*" + filter + "\\S*", 'g')) || []).join(' ')
		});
		return this;
	};
	
	
});