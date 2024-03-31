import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import socketIOClient from 'socket.io-client';

const BACKEND_URL = 'https://936ff5c0-26d7-46ed-a685-37d559d3059c-00-38bx89sq6lor3.kirk.replit.dev'; // Replace with your backend URL
const socket = socketIOClient(BACKEND_URL);

export default function App() {
  const [location, setLocation] = useState(null);
  const [otherLocations, setOtherLocations] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      socket.emit('location', currentLocation.coords);

      socket.on('locations', (locations) => {
        setOtherLocations(locations.filter((loc) => loc.latitude !== currentLocation.coords.latitude && loc.longitude !== currentLocation.coords.longitude));
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={location} title="You are here" />
          {otherLocations.map((loc, index) => (
            <Marker key={index} coordinate={loc} title="Other user" />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});