import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import socketIOClient from 'socket.io-client';

const BACKEND_URL = 'https://936ff5c0-26d7-46ed-a685-37d559d3059c-00-38bx89sq6lor3.kirk.replit.dev';
const socket = socketIOClient(BACKEND_URL);

export default function App() {
  const [location, setLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      const id = uuidv4();
      setUserId(id);

      socket.emit('join', { id, location: currentLocation.coords });

      socket.on('users', (allUsers) => {
        setUsers(allUsers);
      });

      const locationWatcher = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          socket.emit('location', { id, location: newLocation.coords });
        }
      );

      return () => {
        locationWatcher.remove();
        socket.disconnect();
      };
    })();
  }, []);

  const handleNameChange = (text) => {
    setUserName(text);
  };

  const handleNameSubmit = () => {
    socket.emit('updateName', { id: userId, name: userName });
    setShowNameInput(false);
  };

  const handleSettingsPress = () => {
    setShowNameInput(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {location && (
        <>
          <View style={styles.topBar}>
            <Text style={styles.appName}>Location Tracker</Text>
            <TouchableOpacity onPress={handleSettingsPress}>
              <Text style={styles.settingsIcon}>&#9776;</Text>
            </TouchableOpacity>
          </View>
          {showNameInput && (
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your name"
                value={userName}
                onChangeText={handleNameChange}
                onSubmitEditing={handleNameSubmit}
              />
            </View>
          )}
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker coordinate={location} title="You" />
            {users.map((user) => (
              <Marker key={user.id} coordinate={user.location} title={`${user.name}`} />
            ))}
          </MapView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsIcon: {
    fontSize: 24,
  },
  nameInputContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  nameInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
});