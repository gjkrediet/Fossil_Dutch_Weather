# Fossil_Dutch_Weather
Description only. Apps and sources are coming soon

App for Fossil Hybrid HR with info from Dutch buienradar and KNMI
## Description
This app is designed for the Fossil Hybrid HR smartwatch. It will not work on any other smartwatch.

Dutch buienradar and KNMI are in my view the most reliable sources for weather and precipitation forecast. The watchface relies on Gadgetbridge for the communication with the watch and a 'companion' phone-app that can send information from the internet to gadgetbridge. I used tasker as the companion app.

The Buienradar API provides hyperlocal and per 5 minutes data about the expected precipitation formatted as a flat text-file.
The KNMI API provides local data about the weather including a 3 days forecast.

For more info take a look at https://www.buienradar.nl/overbuienradar/gratis-weerdata and https://weerlive.nl/delen.php.
This app shows these data. Buienradar-data with a resolution of 10 minutes, the current location, temperature and min/max temperatures of today. The app runs in the background so that data is immediately ready when the app is activated. The refresh-rate depends on the settings of the companion-app but the watch can send a request tot Gadetbridge, asking for an immediate update.

A widget is also provided, showing an icon reflecting the data from buienradar (icon + max precipitation).

![weatherApp](https://github.com/gjkrediet/Fossil_Dutch_Weather/assets/20277013/592ba441-fb95-47fd-bc55-4cc2fcae87ed)

## App and companion/tasker-app
The way I implemented it, the app relies on Tasker for retreiving information from the internet (buienradar and KNMI). This doenst have to be nescecarily so. The companion-app should send buienradar-data as a string without any delimiters or line-breaks. The KNMI-data should be sent as is, beeing a JSON string.
The Tasker tasks are included. Import them in Tasker and create a profile for each to run them at a regular interval. KNMI-data needs an API-key which you need to obtain (for free for a limitited update frequency).

The source of the app is included as well as the wapp-file
## Widget
I included a widget but for now it can only be included in the layout-file of a custom watchface. I don't know of a way to include it in the watchface editor of Gadetbridge.

## Credits
Many thanks to https://github.com/arjan-s and https://github.com/dakhnod for their insights and help. This app is initially based on their examples and work and in part made with their tools.

The used icons are downloaded from pictogrammers.com
