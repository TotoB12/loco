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
  const [currentPage, setCurrentPage] = useState('Map');

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
    setCurrentPage('Map');
  };

  const handleSettingsPress = () => {
    setCurrentPage('Settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <Text style={styles.appName}>Location Tracker</Text>
      </View>
      {currentPage === 'Map' && location && (
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
      )}
      {currentPage === 'Settings' && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Enter your name</Text>
          <TextInput
            style={styles.nameInput}
            value={userName}
            onChangeText={handleNameChange}
            onSubmitEditing={handleNameSubmit}
          />
        </View>
      )}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 'Map' && styles.activeNavButton]}
          onPress={() => setCurrentPage('Map')}
        >
          <Text style={styles.navButtonText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 'Settings' && styles.activeNavButton]}
          onPress={handleSettingsPress}
        >
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nameInput: {
    height: 40,
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  activeNavButtonText: {
    color: '#fff',
  },
});
