#NJ Programming MeetUp

## About
This single-page application displays a map of coding events in NJ where Meetups are hosted involving coding.  It uses the Meetup API to pull a list of open events involving coding, extracts the location data, and plots them on a map using the Google Maps API.  On the side bar is the list of programming events, or clicking on the markers on the map, an information window shows the venue name, address, and the title and dates of upcoming meetups.  Clicking on each meetup title will take you to the respective Meetup event information page, where you can sign up.

##Running the Application:

- Just open the `index.html` for running the application
- For customization purposes google API key can be changed from `index.html` file

## Resources
- Knockout.js documentation
- Google Maps API documentation
- Meetup API documentation and developer console
- StackOverflow(http://stackoverflow.com/questions/6588549/make-google-maps-plugin-black-white-or-with-sepia-filter)

##Important Files
- application.js contains the actual logic of parsing the JSON file taken from MeetUp API
- index.html contains the web rendering part of this map
- application.css contains the styling part