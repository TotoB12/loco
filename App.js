import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { initializeApp } from 'firebase/app';
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC_TXnoiNb8Q0fCN5PiRiXMxryP-4nBkbk",
  authDomain: "loco-totob12.firebaseapp.com",
  databaseURL: "https://loco-totob12-default-rtdb.firebaseio.com",
  projectId: "loco-totob12",
  storageBucket: "loco-totob12.appspot.com",
  messagingSenderId: "252756761693",
  appId: "1:252756761693:web:c58400b90a4365c97101b4",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// const appCheck = initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider('6LdQk9MpAAAAAL7idKIh7UBxmLGozie2zvKwrdrq'),
//   isTokenAutoRefreshEnabled: true
// });

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [users, setUsers] = useState({});
  const [userId, setUserId] = useState(generateUuid());
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

      const userRef = ref(database, `users/${userId}`);
      set(userRef, {
        name: userName,
        location: currentLocation.coords,
      });

      const usersRef = ref(database, 'users');
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val() || {};
        setUsers(data);
      });

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          update(userRef, { location: newLocation.coords });
        }
      ).then((watcher) => {
        return () => watcher.remove();
      });
    };

    initLocationTracking();
    return () => {
      const userRef = ref(database, `users/${userId}`);
      set(userRef, null);
    };
  }, [userId, userName]);

  const handleNameChange = (text) => {
    setUserName(text);
  };

  const handleNameSubmit = () => {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { name: userName.trim() });
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
        <Marker key={userId} coordinate={location} title="You">
          <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
        </Marker>
      )}
      {Object.entries(users).filter(([id]) => id !== userId).map(([id, user]) => (
        <Marker key={id} coordinate={user.location} title={user.name || 'Anonymous'}>
          <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
        </Marker>
      ))}
    </MapView>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00ADB5" />
      </View>
    );
  }

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Enter your name</Text>
      <TextInput
        style={styles.nameInput}
        value={userName}
        onChangeText={handleNameChange}
        onSubmitEditing={handleNameSubmit}
      />
      <TouchableOpacity onPress={handleNameSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222831" />
      <View style={styles.topBar}>
        <Text style={styles.appName}>Loco</Text>
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
    backgroundColor: '#222831',
  },
  map: {
    flex: 1,
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
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#393E46',
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
});
