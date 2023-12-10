return {
    node_name: '',
    manifest: {
        timers: ['timetelling_timer','retrieve_timer']
    },
    persist: {
        version: 1,
        data: []
    },
    config: {
		knmi: undefined,
		openmeteo: undefined
	},
    timeout_timetelling: 30 * 1000,
    timeout_retrieve: 60 * 1000,
	lock: false,
	working: false,
	current_temp: -99,
	full_refresh_needed: true,
    handler: function (event, response) {
        this.wrap_event(event)
        this.wrap_response(response)
        this.state_machine.handle_event(event, response)
    },
    log: function (object) {
		object.logentry_from = this.node_name;
        req_data(this.node_name, '"type": "log", "data":' + JSON.stringify(object), 999999, true)
    },
	weather_retrieve: function() {
		stop_timer(this.node_name, 'retrieve_timer')
        req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"RetrieveWeather","action":"start"}', 999999, true)
 		start_timer(this.node_name, 'retrieve_timer', this.timeout_retrieve)
	},
	weather_refresh: function() {
		req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"UpdateWeather","action":"start"}', 999999, true);
	},
    draw_info: function (response) {		
        response.draw = {
            node_name: this.node_name,
            package_name: this.package_name,
            layout_function: 'layout_parser_json',
            background: get_common().U('INVERTED')?'BGIweather.raw':'BGweather.raw',
            array: [],
            update_type: this.full_refresh_needed ? 'gc4' : 'du4',
            skip_invert: true,
        };
		var layout_info = {
			json_file: 'weather_layout',
		}
		
		if (this.config.weather_rain != undefined) {
			var raindata=this.config.weather_rain.raindata	
			var intensity;
			var resolution = this.config.weather_rain.resolution; //number of datapoints
			var span = this.config.weather_rain.span; //total minutes of the series
			var step_x = Math.floor(156/resolution); //number of pixels per datapoint
			

			for (var i=0;i<resolution;++i) {
				intensity = raindata.substring(i*3,i*3+3);
				if (intensity<10) {
					intensity*=2;
				} else if (intensity <100) {
					intensity=(intensity-10)/3+20;
				} else {
					intensity=(intensity-100)/60 + 60
				}
				intensity+=1;
				intensity = Math.round(intensity);
				layout_info['h_' + i] = intensity;
				layout_info['y_' + i] = 80 - intensity;
				layout_info['x_' + i] = 44 + i * step_x;
			}
			layout_info['w'] = step_x - 1;
			var now_minutes = 60 * get_common().hour + get_common().minute - get_common().minute%5;
			var start_minutes = this.config.weather_rain.start;
			//check the difference between start of the series and current time. First check times around midnight
			if (now_minutes > 1425 && start_minutes < 15) {
				if ((1440 - now_minutes + start_minutes) > 15) start_minutes = -1;
			}
			else if (start_minutes > 1425 && now_minutes < 15) {
				if ((1440 - start_minutes + now_minutes) > 15) start_minutes = -1;
			}
			else if ((start_minutes > now_minutes + 15) || (start_minutes < now_minutes - 15)) start_minutes = -1;
			if (start_minutes < 0) {
				layout_info['marker1_xpos'] = 70;
				layout_info['marker2_xpos'] = 100;
				layout_info['marker_ypos'] = 53;
				layout_info['marker1'] = '? ?'
				layout_info['marker2'] = '? ?'
			} else {
				var rainhour=Math.floor(this.config.weather_rain.start/60);
				var rainminute=this.config.weather_rain.start%60;
				layout_info['marker_ypos'] = 74;
				var hour;
				rainhour=(++rainhour)%24;
				// create leading zero
				hour ='0' + rainhour;
				hour = hour.substring(hour.length-2,hour.length);
				layout_info['marker1_xpos'] = 23 + ((60-rainminute)/60)*step_x*60*resolution/span;
				layout_info['marker1'] = '|\n' + hour + ':00';
				rainhour=(++rainhour)%24;
				hour ='0' + rainhour;
				hour = hour.substring(hour.length-2,hour.length);
				layout_info['marker2_xpos'] =  23 + ((120-rainminute)/60)*step_x*60*resolution/span;
				layout_info['marker2'] = '|\n' + hour + ':00';
			}
		}
		if (this.config.weather_current != undefined) {
			layout_info['plaats'] = this.config.weather_current.provider 
				+ ' | ' + this.config.weather_current.city
				+ ' | ' + this.config.weather_current.current_temp + '°C';
		}		
		if (this.config.weather_forecast != undefined) {
			layout_info['d0'] = 'max: ' + Math.round(this.config.weather_forecast.d0tmax) + '\n' + 'min:  ' + Math.round(this.config.weather_forecast.d0tmin) + '\n' + 'rgn:   ' + Math.ceil(this.config.weather_forecast.d0rain);
			layout_info['d1'] = Math.round(this.config.weather_forecast.d1tmax) + '\n' + Math.round(this.config.weather_forecast.d1tmin) + '\n' + Math.ceil(this.config.weather_forecast.d1rain);
			layout_info['d2'] = Math.round(this.config.weather_forecast.d2tmax) + '°C\n' + Math.round(this.config.weather_forecast.d2tmin) + '°C\n' + Math.ceil(this.config.weather_forecast.d2rain) + this.config.weather_forecast.unit_rain;
		}
		layout_info['button_middle'] = 'icHome';
		layout_info['button_top'] = this.lock ? (this.working ? '' : 'icRefresh') : 'icLock';
		layout_info['button_top_bot_x'] = get_common().U('WATCH_MODE')=='LEFTIE'? 22 : 198;
		layout_info['button_middle_x'] = get_common().U('WATCH_MODE')=='LEFTIE'? 10 : 210;
		layout_info['invert'] = get_common().U('INVERTED');
		response.draw[this.node_name] = {
			'layout_function': 'layout_parser_json',
			'layout_info': layout_info,
		}
		this.full_refresh_needed=false;
	},
    wrap_state_machine: function(state_machine) {
        state_machine.set_current_state = state_machine.d
        state_machine.handle_event = state_machine._
        state_machine.get_current_state = function(){
            return state_machine.n
        }
        return state_machine
    },
    wrap_event: function (system_state_update_event) {
        if (system_state_update_event.type === 'system_state_update') {
            system_state_update_event.concerns_this_app = system_state_update_event.de
            system_state_update_event.old_state = system_state_update_event.ze
            system_state_update_event.new_state = system_state_update_event.le
        }
        return system_state_update_event
    },
    wrap_response: function (response) {
        response.move_hands = function (degrees_hour, degrees_minute, relative) {
            response.move = {
                h: degrees_hour,
                m: degrees_minute,
                is_relative: relative
            }
        }
        response.go_home = function (kill_app) {
            response.action = {
                type: 'go_home',
                Se: kill_app
            }
        }
        response.send_user_class_event = function (event_type) {
            response.send_generic_event({
                type: event_type,
                class: 'user'
            })
        }
        response.emulate_double_tap = function(){
            this.send_user_class_event('double_tap')
        }
        response.send_generic_event = function (event_object) {
            if (response.i == undefined) response.i = []
            response.i.push(event_object)
        }
        return response
    },
    handle_global_event: function (self, state_machine, event, response) {
        self.log(event)
        if (event.type === 'system_state_update' && event.concerns_this_app === true) {
            if (event.new_state === 'visible') {
                self.state_machine.set_current_state('weather_info');
            } else {
                self.state_machine.set_current_state('background');
            }
        } else if(event.type == 'node_config_update' && event.node_name == self.node_name) {
            if (self.state_machine.get_current_state() == 'weather_info') {
				self.working=false
				self.draw_info(response)
			}
        } else if (event.type === 'middle_hold') {
            response.go_home(true)
        } else if (event.type == 'timer_expired' && is_this_timer_expired(event, self.node_name, 'timetelling_timer')) {
			if (self.lock) {
				var hands = enable_time_telling();
				response.move_hands(hands.hour_pos, hands.minute_pos, false);
				self.time_telling_enabled = true;
			} else {
				response.go_home(true);
			}
        }
    },
    handle_state_specific_event: function (state, state_phase) {
        switch (state) {
            case 'background': {
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                    }
                }
                break;
            }
            case 'weather_info': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        response.move_hands(270,270,false)
						self.draw_info(response)
						self.weather_retrieve()
						start_timer(self.node_name, 'timetelling_timer', self.timeout_timetelling)
                  }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
						if (event.type === 'top_short_press_release') {
							if (self.lock) {
								self.working=true
								self.draw_info(response)
								self.weather_refresh()
							} else {
								self.lock = true
								self.draw_info(response)
							}
						} else if (event.type === 'middle_short_press_release') {
							response.go_home(true)
                        } else if ((event.type == 'time_telling_update') && ((!self.powersave_hands) || (!get_common().device_offwrist))) {
                            // Called every 20 seconds, i.e. every time the hands need to move
                            var hands = enable_time_telling()
                            response.move_hands(hands.hour_pos, hands.minute_pos, false)
						} else if (event.type == 'timer_expired' && is_this_timer_expired(event, self.node_name, 'retrieve_timer')) {
							self.weather_retrieve();
						} else if (event.type == 'flick_away') {
							stop_timer(self.node_name, 'timetelling_timer')
							disable_time_telling();
							self.weather_retrieve();
							response.move_hands(270, 270, false);
							start_timer(self.node_name, 'timetelling_timer', self.timeout_timetelling);
						}
					}
                }
                if (state_phase == 'exit') {
//					return function (arg, arg2) {
                    return function (self, response) {
						stop_timer(self.node_name, 'timetelling_timer')
						stop_timer(self.node_name, 'retrieve_timer')
					};
                }
                break;
            }
        }
        return
    },
    init: function () {
        this.state_machine = new state_machine(
            this,
            this.handle_global_event,
            this.handle_state_specific_event,
            undefined,
            'background'
        );
        this.wrap_state_machine(this.state_machine);
    },
}
