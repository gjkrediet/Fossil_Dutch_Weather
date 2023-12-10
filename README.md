# Fossil_Dutch_Weather
App for Fossil Hybrid HR with info from Dutch buienradar and KNMI. One some firmwares the app may crash, possibly when low on memory.

## Description
This app is designed for the Fossil Hybrid HR smartwatch. It will not work on any other smartwatch.

Dutch buienradar and KNMI are in my view the most reliable sources for weather and precipitation forecast. The watchface relies on Gadgetbridge for the communication with the watch and a 'companion' phone-app that can send information from the internet to gadgetbridge. I used tasker as the companion app.

The Buienradar API provides hyperlocal and per 5 minutes data about the expected precipitation in a text-file.
The KNMI API provides local data about the weather including a 3 days forecast in JSON-format.

For more info take a look at https://www.buienradar.nl/overbuienradar/gratis-weerdata and https://weerlive.nl/delen.php.
This app shows these data. Buienradar-data (with a resolution of 10 minutes on a timescale of 2 hours), the current location, temperature and min/max temperatures and rainchance of today and 2 days ahead. Upon start of the app the data is requested from Tasker and - when received - shown in the app. 
The app is rightie/leftie-proof

![20231111_191428](https://github.com/gjkrediet/Fossil_Dutch_Weather/assets/20277013/84026132-1ff0-40bb-9c3c-da1b29f1c778)

The app exits after 30 seconds unless you press the top buton. It is then locked. When locked, the hands show the actual time and the app retrieves information from the phone every minute. By pressing the top-button again you send a request tot Gadetbridge, asking for an immediate update of data from internet.

### Installation
Upload weatherApp.wapp to your watch or compile the app yourself. Instructions for preprocessing/compiling the app are similar to those for Gadgetbridge's opensourceWatchface which can be found here: https://codeberg.org/Freeyourgadget/fossil-hr-watchface

Three Tasker tasks are included for retreivving and storing weather information. The main part of each task is a java scriptlet. One task is for downloading and storing buienradar-data, one for downloading and storing KNMI-data and one for retreiving the current location and city. Import the tasks in Tasker, change them to your needs and create a profile for each to run them at a regular interval. KNMI-data needs an API-key which you can obtain at weerlive.nl (for free for a limited update frequency) and insert into the http-request in tasker.

A fourth taks contains the dispatcher for catching and processing requests from the watch. Create a profile in Tasker with the event "Intent Received" with the following content: Action: nodomain.freeyourgadget.gadgetbridge.Q_COMMUTE_MENU. Make this profile start the included 'dispatcher'-task. You may want to catch other requests from other apps, which you should then also include in this dispatcher (see https://codeberg.org/Freeyourgadget/Gadgetbridge/wiki/Fossil-Hybrid-HR#commute-app ).

## Changes since the previous version
To enable the use of a variety of weather -providers, the information in the intents is changed and intents for current weather-info and for the forecast are splitted. This has minimal effect on the funtionality and appearance. Time of the forecast is not shown anymore.
A crude check on the validity of the raindata is now done. When data is more than a quarter out of range, questionmarks are shown in the graph. Data from buienradar does not incorporate a timestamp, therefore a watertight check is impossible.

## Credits
Many thanks to https://codeberg.org/arjan5 and https://github.com/dakhnod for their insights and help. This app is initially based on their examples and work and in part made with their tools.

The used icons are downloaded from pictogrammers.com
