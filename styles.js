import { StyleSheet } from 'react-native';

// https://maps.googleapis.com/maps/api/staticmap?key=YOUR_API_KEY&center=47.63562994735659,-122.42192478329498&zoom=12&format=png&maptype=roadmap&style=element:geometry%7Ccolor:0x242f3e&style=element:labels.icon%7Cvisibility:off&style=element:labels.text.fill%7Ccolor:0x746855&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=feature:administrative.locality%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi.park%7Celement:geometry%7Ccolor:0x263c3f&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x6b9a76&style=feature:road%7Celement:geometry%7Ccolor:0x38414e&style=feature:road%7Celement:geometry.stroke%7Ccolor:0x212a37&style=feature:road%7Celement:labels.text.fill%7Ccolor:0x9ca5b3&style=feature:road.highway%7Celement:geometry%7Ccolor:0x746855&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0x1f2835&style=feature:road.highway%7Celement:labels.text.fill%7Ccolor:0xf3d19c&style=feature:transit%7Celement:geometry%7Ccolor:0x2f3948&style=feature:transit.station%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:water%7Celement:geometry%7Ccolor:0x17263c&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x515c6d&style=feature:water%7Celement:labels.text.stroke%7Ccolor:0x17263c&size=480x360

export const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#263c3f"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b9a76"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#212a37"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9ca5b3"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#1f2835"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#f3d19c"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2f3948"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#515c6d"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  }
];

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222831',
  },
  map: {
    flex: 1,
    // height: '110%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#393E46',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222831',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#EEEEEE',
  },
  nameInput: {
    height: 40,
    width: '80%',
    borderWidth: 1,
    borderColor: '#00ADB5',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
    color: '#EEEEEE',
    backgroundColor: '#393E46',
  },
  // bottomNavBar: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  //   alignItems: 'center',
  //   paddingVertical: 8,
  //   backgroundColor: '#393E46',
  // },
  bottomNavBar: {
    backgroundColor: '#393E46',
    height: 85,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#222831',
  },
  activeNavButton: {
    backgroundColor: '#00ADB5',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222831',
  },
  saveButton: {
    backgroundColor: '#00ADB5',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  filterContainer: {
    // flexDirection: 'row',
    position: 'absolute',
    zIndex: 9999,
    top: 10,
    width: '100%',
  },
  searchContainerStyle: {
    marginTop: 50,
    left: 10,
    right: 10,
    height: 50,
    // width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    borderRadius: 17,
    position: 'absolute',

  },
  searchInputContainerStyle: {
    // position: 'absolute',
    // top: -10,
    // width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    // borderRadius: 50,
  },
  searchInputStyle: {
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    // justifyContent: 'center',
    left: 10,
    marginTop: 110,
    // marginBottom: 10,
  },
  chipContainerStyle: {
    marginHorizontal: 5,
    // backgroundColor: '#FFFFFF',
  },
  chipStyle: {
    height: 36,
    backgroundColor: '#FFFFFF',
    // color: '#222831',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffc93c'
  },
  title: {
    fontSize: 22,
    color: 'white',
    marginBottom: 20
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 5
  },
  buttonText: {
    fontSize: 18,
    color: '#07689f'
  },
  uuidText: {
    fontSize: 16,
    color: '#EEEEEE',
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#D9534F',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  headerContainer: {
    backgroundColor: '#222831',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
