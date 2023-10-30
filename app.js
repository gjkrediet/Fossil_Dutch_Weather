return {
    node_name: '',
    manifest: {
        timers: ['inactivity_timer']
    },
    persist: {},
    config: {
		knmi: undefined,
		buienradar: undefined
	},
    timeout: 30 * 1000,

    handler: function (event, response) {
        this.wrap_event(event)
        this.wrap_response(response)
        this.state_machine.handle_event(event, response)
    },
    log: function (object) {
        req_data(this.node_name, '"type": "log", "data":' + JSON.stringify(object), 999999, true)
    },
	weather_update: function() {
        req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"UpdateWeather","action":"start"}', 999999, true)
	},
    draw_info: function (response) {
		
		response.draw = {}
		var layout_info = {
			json_file: 'weather_layout'
		}
		
		if (this.config.buienradar != undefined && this.config.buienradar.rawtxt.length == 168) {
			var rawtxt=this.config.buienradar.rawtxt	
			layout_info['brtijd'] = rawtxt.substring(3,5) + ':' + rawtxt.substring(5,7)
			var intensity = 0
			var israin = true;
			for (var i=0;i<12;++i) {
				intensity = Math.max(rawtxt.substring(i*14,i*14+3),rawtxt.substring(i*14+7,i*14+10))
				israin=(intensity>0)
				intensity=Math.pow(10, (intensity-109)/32) //echte intensiteit in mm
				intensity=6*Math.sqrt(Math.min(intensity*2,60)) //toonbaar maken
				layout_info['h_' + i] = (israin?intensity+3:1)
				layout_info['y_' + i] = (80 - (israin?intensity+2:1))
				layout_info['x_' + i] = 35 + i * 14
			}
			layout_info['w'] = 15
		}
		
		if (this.config.knmi != undefined) {
			layout_info['temp_cur'] = this.config.knmi.temp + '°C'
			layout_info['plaats_tijd'] = this.config.knmi.plaats + ' - ' + this.config.knmi.time.substring(11,16)
			layout_info['d0'] = 'max: ' + this.config.knmi.d0tmax + '\n' + 'min:  ' + this.config.knmi.d0tmin + '\n' + 'rgn:   ' + this.config.knmi.d0neerslag
			layout_info['d1'] = this.config.knmi.d1tmax + '\n' + this.config.knmi.d1tmin + '\n' + this.config.knmi.d1neerslag
			layout_info['d2'] = this.config.knmi.d2tmax + '°C\n' + this.config.knmi.d2tmin + '°C\n' + this.config.knmi.d2neerslag + '%'
		}
		response.draw[this.node_name] = {
			'layout_function': 'layout_parser_json',
			'layout_info': layout_info,
		}
		stop_timer(this.node_name, 'inactivity_timer')
		start_timer(this.node_name, 'inactivity_timer', this.timeout)
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
        response.go_back = function (kill_app) {
            response.action = {
                type: 'go_back',
                Se: kill_app
            }
        }
        response.go_home = function (kill_app) {
            response.action = {
                type: 'go_home',
                Se: kill_app
            }
        }
        response.draw_screen = function (node_name, full_update, layout_info) {
            response.draw = {
                update_type: full_update ? 'gc4' : 'du4'
            }
            response.draw[node_name] = {
                layout_function: 'layout_parser_json',
                layout_info: layout_info
            }
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
            self.draw_info(response)
        } else if (event.type === 'middle_hold') {
            response.go_back(true)
        } else if (event.type == 'timer_expired' && is_this_timer_expired(event, self.node_name, 'inactivity_timer')) {
            response.go_back(false)
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
                        response.move_hands(90, 90, false)
						self.draw_info(response)
//						self.weather_update()
                   }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
						if (event.type === 'middle_short_press_release') {
							response.go_home(false)
						}
						if (event.type === 'top_short_press_release') {
							self.weather_update()
						}
                    }
                }
                if (state_phase == 'exit') {
                    return function (self, response) {
						stop_timer(self.node_name, 'inactivity_timer')
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
