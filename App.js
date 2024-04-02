import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import socketIOClient from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const BACKEND_URL = 'https://936ff5c0-26d7-46ed-a685-37d559d3059c-00-38bx89sq6lor3.kirk.replit.dev';
const socket = socketIOClient(BACKEND_URL, {
  transports: ['websocket'],
  jsonp: false
});

export default function App() {
  const [location, setLocation] = useState(null);
  const [users, setUsers] = useState({});
  const [userId, setUserId] = useState(uuidv4());
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState('Map');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLocationTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setLoading(false);

      socket.emit('join', { id: userId, location: currentLocation.coords });

      socket.on('users', (allUsers) => {
        setUsers(allUsers);
      });

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          socket.emit('location', { id: userId, location: newLocation.coords });
        }
      ).then((watcher) => {
        return () => watcher.remove();
      });
    };

    initLocationTracking();

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const handleNameChange = (text) => {
    setUserName(text);
  };

  const handleNameSubmit = () => {
    socket.emit('updateName', { id: userId, name: userName.trim() });
    setCurrentPage('Map');
  };

  const renderMap = () => (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {location && (
        <Marker coordinate={location} title="You">
          <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
        </Marker>
      )}
      {Object.values(users).map((user) => (
        <Marker key={user.id} coordinate={user.location} title={user.name || 'Anonymous'}>
          <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
        </Marker>
      ))}
    </MapView>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Enter your name</Text>
      <TextInput
        style={styles.nameInput}
        value={userName}
        onChangeText={(text) => setUserName(text)}
        onSubmitEditing={handleNameSubmit}
      />
      <TouchableOpacity onPress={handleNameSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <Text style={styles.appName}>Location Tracker</Text>
      </View>
      {currentPage === 'Map' ? renderMap() : renderSettings()}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 'Map' && styles.activeNavButton]}
          onPress={() => setCurrentPage('Map')}
        >
          <Text style={styles.navButtonText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 'Settings' && styles.activeNavButton]}
          onPress={() => setCurrentPage('Settings')}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
});