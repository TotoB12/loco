import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, Image, Platform } from 'react-native';
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ViewPager from '@react-native-community/viewpager';
import { generateUsername } from './generateUsername';
import { customMapStyle, styles } from './styles';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function generateUuidAndSave() {
  const existingUuid = await AsyncStorage.getItem('userId');
  if (!existingUuid) {
    const uuid = generateUuid();
    await AsyncStorage.setItem('userId', uuid);
    return uuid;
  }
  return existingUuid;
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const Tab = createBottomTabNavigator();

function OnboardingScreen({ onFinish }) {
  const pagerRef = useRef(null);
  const [username, setUsername] = useState(generateUsername("-", 3));

  return (
    <ViewPager style={{ flex: 1 }} ref={pagerRef}>
      <View key="1" style={styles.page}>
        <Text style={styles.title}>Welcome to Loco</Text>
        <FontAwesome6 name="earth-americas" size={100} color="white" />
        <TouchableOpacity onPress={() => pagerRef.current.setPage(1)} style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View key="2" style={[styles.page, { backgroundColor: '#07689f' }]}>
        <Text style={styles.title}>Choose Your Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setUsername}
          value={username}
          placeholder="Enter your username"
        />
        <TouchableOpacity onPress={() => pagerRef.current.setPage(2)} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <View key="3" style={[styles.page, { backgroundColor: '#eb8f8f' }]}>
        <Text style={styles.title}>smt idk anymore</Text>
        <FontAwesome6 name="globe" size={100} color="white" />
        <TouchableOpacity onPress={async () => {
          const userId = await generateUuidAndSave();
          await AsyncStorage.setItem('userName', username);
          onFinish(username, userId);
        }} style={styles.button}>
          <Text style={styles.buttonText}>Finish Setup</Text>
        </TouchableOpacity>
      </View>
    </ViewPager>
  );
}

function MapScreen() {
  const [location, setLocation] = useState(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [users, setUsers] = useState({});
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  // const [currentPage, setCurrentPage] = useState('Map');
  const userMarkers = useRef(new Map()).current;

  useEffect(() => {
    const initLocationTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setInitialRegionSet(true);

      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserName = await AsyncStorage.getItem('userName');

      if (storedUserId && storedUserName) {
        setUserId(storedUserId);
        setUserName(storedUserName);

        const userRef = ref(database, `users/${storedUserId}`);
        set(userRef, {
          name: storedUserName,
          location: currentLocation.coords,
          timestamp: Date.now(),
        });

        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val() || {};
          Object.entries(data).forEach(([id, user]) => {
            if (id !== userId) {
              const newRegion = new AnimatedRegion({
                latitude: user.location.latitude,
                longitude: user.location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
              if (userMarkers.has(id)) {
                const region = userMarkers.get(id);
                region.timing(newRegion).start();
              } else {
                userMarkers.set(id, newRegion);
              }
            }
          });
          setUsers(data);
        });

        Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        }, (newLocation) => {
          setLocation(newLocation.coords);
          update(userRef, { location: newLocation.coords, timestamp: Date.now() });
        }).then((watcher) => {
          return () => watcher.remove();
        });
      }
    };

    initLocationTracking();
    return () => {
      if (userId) {
        const userRef = ref(database, `users/${userId}`);
        set(userRef, null);
      }
    };
  }, []);

  if (!initialRegionSet) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00ADB5" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        // provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={customMapStyle}
      >
        <TextInput
          placeholder="Search for a place..."
          style={styles.searchBar}
        />
        {location && (
          <Marker.Animated
            key={userId}
            coordinate={new AnimatedRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            })}
            title="You"
          >
            <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
          </Marker.Animated>
        )}
        {Object.entries(users).filter(([id]) => id !== userId).map(([id, user]) => (
          <Marker.Animated
            key={id}
            coordinate={userMarkers.get(id)}
            title={user.name || 'Anonymous'}
          >
            <Image source={{ uri: "https://i.imgur.com/iT8KFY5.jpg" }} style={styles.userIcon} />
          </Marker.Animated>
        ))}
      </MapView>
    </View>
  );
}

// if (loading) {
//   return (
//     <View style={styles.loaderContainer}>
//       <ActivityIndicator size="large" color="#00ADB5" />
//     </View>
//   );
// }

function FriendsScreen() {
  return (
    <View style={styles.centered}>
      <Text>people</Text>
    </View>
  );
}

function YouScreen() {
  const [userName, setUserName] = useState('');

  const handleNameChange = (text) => {
    setUserName(text);
  };

  const handleNameSubmit = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    if (storedUserId) {
      const userRef = ref(database, `users/${storedUserId}`);
      update(userRef, { name: userName.trim() });
      await AsyncStorage.setItem('userName', userName.trim());
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  return (
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
      <TouchableOpacity onPress={
        async () => {
          await AsyncStorage.clear();
        }
      } style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Delete All Data</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const checkUserData = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId && storedUserName) {
        setUserId(storedUserId);
        setUserName(storedUserName);
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    };

    checkUserData();
  }, []);

  const handleFinishOnboarding = (username, userId) => {
    setUserName(username);
    setUserId(userId);
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  console.log('Finished onboarding:', userName, userId);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00ADB5',
        tabBarInactiveTintColor: '#EEEEEE',
        tabBarStyle: styles.bottomNavBar,
      }}>
        <Tab.Screen name="Map" component={MapScreen} options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="earth-americas" size={size} color={color} />
          ),
        }} />
        <Tab.Screen name="Friends" component={FriendsScreen} options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="users" size={size} color={color} />
          ),
        }} />
        <Tab.Screen name="You" component={YouScreen} options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="user" size={size} color={color} />
          ),
        }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
