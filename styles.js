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
  searchResultsContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    backgroundColor: 'white'
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
  recenterButton: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 12,
  },
trackingButton: {
  backgroundColor: '#00ADB5', // #FF6347
  width: 50,
  height: 50,
  borderRadius: 12,
},
  recenterButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  friendsContainer: {
    flex: 1,
    backgroundColor: '#222831',
    padding: 10,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    // backgroundColor: '#393E46',
  },
  friendsTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  addFriendButton: {
    // backgroundColor: '#00ADB5',
    borderColor: 'gray',
    borderRadius: 5,
  },
  friendRequestsContainer: {
    padding: 10,
  },
  friendsListContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#EEEEEE',
    paddingVertical: 5,
  },
  friendRequestCard: {
    backgroundColor: '#2b3543',
    // marginBottom: 10,
    padding: 20,
    borderRadius: 5,
  },
  friendRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  friendRequestIcon: {
    marginRight: 10,
  },
  friendRequestText: {
    flex: 1,
    color: 'white',
    fontSize: 18,
  },
  friendRequestActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  acceptButton: {
    // backgroundColor: 'green',
    borderColor: 'green',
    borderWidth: 2,
    borderRadius: 5,
  },
  rejectButton: {
    // backgroundColor: 'red',
    borderColor: 'red',
    borderWidth: 2,
    borderRadius: 5,
  },
  userDetailCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  userDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetailDistance: {
    fontSize: 16,
    marginTop: 5,
  },
  userDetailTimestamp: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#00ADB5',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: 200,
  },
  avatar: {
    backgroundColor: '#00ADB5',
  },
  userOptions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 7,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    margin: 15,
    textAlign: 'center',
  },
  dialogButton: {
    backgroundColor: 'white',
    marginVertical: 5,
    width: '100%',
  },
  dialogButtonTitle: {
    color: 'black',
  },
});
