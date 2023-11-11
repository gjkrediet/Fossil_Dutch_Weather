# Fossil_Dutch_Weather
App for Fossil Hybrid HR with info from Dutch buienradar and KNMI. One some firmwares the app may crash, possibly when low on memory.

## Description
This app is designed for the Fossil Hybrid HR smartwatch. It will not work on any other smartwatch.

Dutch buienradar and KNMI are in my view the most reliable sources for weather and precipitation forecast. The watchface relies on Gadgetbridge for the communication with the watch and a 'companion' phone-app that can send information from the internet to gadgetbridge. I used tasker as the companion app.

The Buienradar API provides hyperlocal and per 5 minutes data about the expected precipitation formatted as a flat text-file.
The KNMI API provides local data about the weather including a 3 days forecast in JSON-format.

For more info take a look at https://www.buienradar.nl/overbuienradar/gratis-weerdata and https://weerlive.nl/delen.php.
This app shows these data. Buienradar-data (with a resolution of 10 minutes on a timescale of 2 hours), the current location, temperature and min/max temperatures and rainchance of today and 2 days ahead. Upon start of the app the data is requested from Tasker and - when received - shown in the app. 
The app is rightie/leftie-proof

![20231111_191428](https://github.com/gjkrediet/Fossil_Dutch_Weather/assets/20277013/84026132-1ff0-40bb-9c3c-da1b29f1c778)

The app exits after 10 seconds unless you hit the top buton. It is then locked and it retrieves information from the phone every minute. By pressing the top-button again you send a request tot Gadetbridge, asking for an immediate update.

## App and Tasker
The way I implemented it, the app relies on Tasker for retreiving information from the internet (buienradar and KNMI). The companion-app should send buienradar-data as a string without any delimiters or line-breaks. The various KNMI-data is sent in JSON format.

### Dispatcher
For the app to work you need to catch the 'RetrieveWeather' and 'RefreshWeather' in Tasker.
For that create a profile in Tasker with the event "Intent Received" with the following content:

Action: nodomain.freeyourgadget.gadgetbridge.Q_COMMUTE_MENU.

Make this profile start a 'dispatcher'-task with the following content:

If: %extra_action EQ RefreshWeather

	..... (send back intents to Gadgetbridge with data. See below)
 
Else if %extra_action EQ RetreiveWeather

	..... (perform the task to download data from the internet. See below)
 
Endif

You may woant to catch other requests for other apps, witch you should also include in this dispatcher (see https://codeberg.org/Freeyourgadget/Gadgetbridge/wiki/Fossil-Hybrid-HR#commute-app).

Intents sent to Gadgetbridge are one with knmi-data and one with buienradar-data. 

### knmi-data:

Action: nodomain.freeyourgadget.gadgetbridge.Q_PUSH_CONFIG<br>

Extra: EXTRA_CONFIG_JSON:{"push":{"set":{"weatherApp._.config.knmi": %Knmidata}}}

The (global) variable %Knmidata should contain a JSON-string like this: {"temp":"8.3","time":"03-11-2023 08:53","plaats":"Amsterdam","d0tmin":"7","d0tmax":"11","d0neerslag":"13","d1tmin":"7","d1tmax":"11","d1neerslag":"90","d2tmin":"9","d2tmax":"12","d2neerslag":"90"}

### buienradar-data:

Action: nodomain.freeyourgadget.gadgetbridge.Q_PUSH_CONFIG

Extra: EXTRA_CONFIG_JSON:{"push":{"set":{"weatherApp._.config.buienradar": %Brdata}}}
	
The (global) variable %Brdata should contain a string containing the data from buienradar with no delimiters or linebreaks. Thus it contains 7 characters (3 for precipitation, 4 for the time in hhmm) for each 5 minutes of data. It looks like this: 000151000015150401520040152500015300001535000154000015450001550120155515016000901605080161000016150001620000162500016300001635000164000016450001650000165500017000901705

### Examples
Three Tasker tasks are included as an example how to acheive the above. One for downloading buienradar-data and storing it in %Brdata, one for downloading KNMI-data and storing it in %Knmidata. Import them in Tasker, change them to your needs and create a profile for each to run them at a regular interval. KNMI-data needs an API-key which you need to obtain at weerlive.nl (for free for a limited update frequency) and insert into the http-request in tasker. The 'dispatcher' task is also included. 

The source of the app is included as well as the wapp-file

## Widget
The source for a buienradar complication/widget is also included. It shows an icon (raindrop indicating rain within next 15 minutes or an umbrealla indicating rain witin the next two hours) and the maximum precipation. 
![20231103_095239](https://github.com/gjkrediet/Fossil_Dutch_Weather/assets/20277013/48a5caf3-940a-4c5f-a4a4-0ec001263711)
You can preprocess/compile/pack it together with a watchface. In de layout-file for the watchface (..\build\files\config\customWatchface) you should include a section like this:
{
"type": "comp",
 "name": "widgetBr",
 "goal_ring": false,
 "color": "white",
 "data": {
 "update_timeout": 60,
 "timeout_hide_text": false,
 "timeout_show_circle": true
 },
 "size": {
 "w": 76,
 "h": 76
 },
 "pos": {
 "x": 120,
 "y": 180
 }
}

To update de widget you should send data from Tasker to Gadgetbridge:
Action: nodomain.freeyourgadget.gadgetbridge.Q_PUSH_CONFIG
Extra: EXTRA_CONFIG_JSON:{"push":{"set":{"widgetBr._.config.brdata":"%Brdata"}}}

## Credits
Many thanks to https://codeberg.org/arjan5 and https://github.com/dakhnod for their insights and help. This app is initially based on their examples and work and in part made with their tools.

The used icons are downloaded from pictogrammers.com
