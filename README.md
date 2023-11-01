# Fossil_Dutch_Weather
App for Fossil Hybrid HR with info from Dutch buienradar and KNMI. One some firmwares the app may crash, possibly when low on memory.

## Description
This app is designed for the Fossil Hybrid HR smartwatch. It will not work on any other smartwatch.

Dutch buienradar and KNMI are in my view the most reliable sources for weather and precipitation forecast. The watchface relies on Gadgetbridge for the communication with the watch and a 'companion' phone-app that can send information from the internet to gadgetbridge. I used tasker as the companion app.

The Buienradar API provides hyperlocal and per 5 minutes data about the expected precipitation formatted as a flat text-file.
The KNMI API provides local data about the weather including a 3 days forecast.

For more info take a look at https://www.buienradar.nl/overbuienradar/gratis-weerdata and https://weerlive.nl/delen.php.
This app shows these data. Buienradar-data with a resolution of 10 minutes, the current location, temperature and min/max temperatures of today and 2 days ahead. The app runs in the background so that data is immediately ready when the app is activated. The refresh-rate depends on the settings of the companion-app but by pressing the bottom-button you can send a request tot Gadetbridge, asking for an immediate update (you need to catch this request in Tasker).

![20231030_210910](https://github.com/gjkrediet/Fossil_Dutch_Weather/assets/20277013/0a551bd6-476c-4f9a-9e88-a997acc0b83b)

## App and companion/tasker-app
The way I implemented it, the app relies on Tasker for retreiving information from the internet (buienradar and KNMI). The companion-app should send buienradar-data as a string without any delimiters or line-breaks. The KNMI-data is sent in JSON format.
Two Tasker tasks are included. One for buienradar which also provides for the widget. The other one for KNMI-data. Import them in Tasker, cahnge them to your needs and create a profile for each to run them at a regular interval. KNMI-data needs an API-key which you need to obtain at weerlive.nl (for free for a limited update frequency).

The source of the app is included as well as the wapp-file

## Credits
Many thanks to https://codeberg.org/arjan5 and https://github.com/dakhnod for their insights and help. This app is initially based on their examples and work and in part made with their tools.

The used icons are downloaded from pictogrammers.com
