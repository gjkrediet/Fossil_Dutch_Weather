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
		buienradar: undefined
	},
    timeout_timetelling: 10 * 1000,
    timeout_retrieve: 60 * 1000,
	lock: false,
	working: false,
	current_temp: -99,
    handler: function (event, response) {
        this.wrap_event(event)
        this.wrap_response(response)
        this.state_machine.handle_event(event, response)
    },
    log: function (object) {
        req_data(this.node_name, '"type": "log", "data":' + JSON.stringify(object), 999999, true)
    },
	weather_retrieve: function() {
		stop_timer(this.node_name, 'retrieve_timer')
        req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"RetrieveWeather","action":"start"}', 999999, true)
 		start_timer(this.node_name, 'retrieve_timer', this.timeout_retrieve)
	},
	weather_refresh: function() {
        req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"UpdateWeather","action":"start"}', 999999, true)
	},
    draw_info: function (response) {
		
		response.draw = {}
		var layout_info = {
			json_file: 'weather_layout'
		}
		
		if (this.config.buienradar != undefined && this.config.buienradar.data.length == 72) {
			var brdata=this.config.buienradar.data	
			layout_info['brtijd'] = this.config.buienradar.time
			var brhour=this.config.buienradar.time
			brhour=parseInt(brhour.slice(0,2))
			var brminutes=this.config.buienradar.time
			brminutes=parseInt(brminutes.slice(3))
			var intensity
			for (var i=0;i<12;++i) {
				intensity = Math.max(brdata.substring(i*6,i*6+3),brdata.substring(i*6+3,i*6+6))
				if (intensity>77) {
					intensity = 3 + (intensity - 77) * 0.57
				} else if (intensity>0) {
					intensity=2
				} else {
					intensity=1
				}
				intensity=Math.round(intensity)
				layout_info['h_' + i] = intensity
				layout_info['y_' + i] = 80 - intensity
				layout_info['x_' + i] = 41 + i * 13
			}
			layout_info['w'] = 12
			brhour+=1;
			brhour%=24;
			layout_info['marker1_pos'] = 21 + 6*13-((brminutes/5)*7)
			layout_info['marker1'] = '|\n' + brhour + ':00'
			brhour+=1;
			brhour%=24;
			layout_info['marker2_pos'] = 21 + 12*13-((brminutes/5)*7)
			layout_info['marker2'] = '|\n' + brhour + ':00'
		}
		
		if (this.config.knmi != undefined) {
			this.current_temp = this.config.knmi.temp
			layout_info['temp_cur'] = this.current_temp + '°C'
			layout_info['plaats_tijd'] = this.config.knmi.plaats + ' - ' + this.config.knmi.time.substring(11,16)
			layout_info['d0'] = 'max: ' + this.config.knmi.d0tmax + '\n' + 'min:  ' + this.config.knmi.d0tmin + '\n' + 'rgn:   ' + this.config.knmi.d0neerslag
			layout_info['d1'] = this.config.knmi.d1tmax + '\n' + this.config.knmi.d1tmin + '\n' + this.config.knmi.d1neerslag
			layout_info['d2'] = this.config.knmi.d2tmax + '°C\n' + this.config.knmi.d2tmin + '°C\n' + this.config.knmi.d2neerslag + '%'
		}
		layout_info['background'] = (get_common().U('WATCH_MODE')=='LEFTIE'?'weatherBGleftie':'weatherBG')
		layout_info['button_middle'] = 'icHome'
		layout_info['button_top'] = this.lock ? (this.working ? '' : 'icRefresh') : 'icLock'
		layout_info['button_top_bot_x'] = 198
		layout_info['button_middle_x'] = 210
		response.draw[this.node_name] = {
			'layout_function': 'layout_parser_json',
			'layout_info': layout_info,
		}
//		response.emulate_double_tap()
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
        if (event.type === 'system_state_update' && event.concerns_this_app === true) {
            if (event.new_state === 'visible') {
                self.state_machine.set_current_state('weather_info');
            } else {
                self.state_machine.set_current_state('background');
            }
        } else if(event.type == 'node_config_update' && event.node_name == self.node_name) {
            if (self.state_machine.get_current_state() == 'weather_info') {
				self.working=false
				self.draw_info(response) // Arjan5: Makes only sense if visible
			}
        } else if (event.type === 'middle_hold') {
            response.go_home(true)
        } else if (event.type == 'timer_expired' && is_this_timer_expired(event, self.node_name, 'timetelling_timer')) {
			if (self.lock) {
				var hands = enable_time_telling();
				response.move_hands(hands.hour_pos, hands.minute_pos, false)
				self.time_telling_enabled = true;
			} else {
				response.go_home(true)
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
							response.move_hands(270, 270, false)
							start_timer(self.node_name, 'timetelling_timer', self.timeout_timetelling)
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
