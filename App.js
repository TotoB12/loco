import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Image, Platform } from 'react-native';
import { Avatar, Button, Icon, SearchBar, Chip, ListItem, Input } from '@rneui/themed';
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
import { customMapStyle, styles } from './Styles';
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

const Header = () => {
  return (
    <SafeAreaView style={styles.headerContainer}>
    </SafeAreaView>
  );
};

const UserAvatarMarker = ({ user, size, color }) => {
  const getInitials = (name) => {
    if (!name) {
      return "";
    }
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getTwoFirstLetters = (name) => {
    if (!name) {
      return "";
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar
      size={size || 30}
      rounded
      title={getTwoFirstLetters(user.name)}
      containerStyle={{ backgroundColor: color || "#FFFFFF" }} // #00ADB5
      titleStyle={{ color: "black" }} // #EEEEEE
    />
  );
};

// Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

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
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [users, setUsers] = useState({});
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchBarRef = useRef(null);
  const [searchActive, setSearchActive] = useState(false);
  const userMarkers = useRef(new Map()).current;
  const [isTracking, setIsTracking] = useState(false);

  const sortedUsers = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.entries(users)
      .map(([id, user]) => ({
        id,
        ...user,
        distance: location ? getDistanceFromLatLonInKm(
          location.latitude,
          location.longitude,
          user.location.latitude,
          user.location.longitude
        ) : Infinity
      }))
      .filter(user => user.id !== userId && user.name.toLowerCase().includes(query))
      .sort((a, b) => a.distance - b.distance);
  }, [users, location, userId, searchQuery]);

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
          // console.log('Users updated:', users);
        });

        Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        }, (newLocation) => {
          setLocation(newLocation.coords);
          update(userRef, { location: newLocation.coords, timestamp: Date.now() });
          if (isTracking && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }, 500);
          }
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    // do stuff
  };

  const handleMapAllPress = () => {
    console.log('All was pressed!');
  };

  const handleMapFriendsPress = () => {
    console.log('Friends was pressed!');
  };

  const toggleFriendRequest = async (receiverId) => {
    if (!userId) {
      console.log("User ID is not set");
      return;
    }

    const requestsRef = ref(database, `users/${receiverId}/requests/${userId}`);
    onValue(requestsRef, async (snapshot) => {
      if (snapshot.exists()) {
        // If request already exists, remove it
        await set(requestsRef, null);
        console.log("Friend request removed.");
      } else {
        // If no request exists, add it
        await set(requestsRef, true);
        console.log("Friend request sent!");
      }
    }, {
      onlyOnce: true
    });
  };

  const recenterMap = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  };

  const zoomToUserLocation = (location) => {
    setSearchQuery('');
    setSearchActive(false);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  if (!initialRegionSet) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00ADB5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ flex: 1 }}>
        <Header />
        <View style={styles.filterContainer}>
          <SearchBar
            platform='default'
            placeholder="Search for friends..."
            onChangeText={handleSearch}
            value={searchQuery}
            onFocus={() => setSearchActive(true)}
            // onBlur={() => setSearchActive(false)}
            ref={searchBarRef}
            containerStyle={styles.searchContainerStyle}
            inputContainerStyle={styles.searchInputContainerStyle}
            inputStyle={styles.searchInputStyle}
            round
          />
          <View style={styles.chipsContainer}>
            <Chip
              title="All"
              icon={{
                name: 'globe',
                type: 'font-awesome',
                size: 17,
                // color: '#00ADB5',
              }}
              titleStyle={{ color: 'black' }}
              onPress={handleMapAllPress}
              type="solid"
              containerStyle={styles.chipContainerStyle}
              buttonStyle={styles.chipStyle}
            />
            <Chip
              title="Friends"
              icon={{
                name: 'users',
                type: 'font-awesome',
                size: 17,
                // color: '#00ADB5',
              }}
              titleStyle={{ color: 'black' }}
              onPress={handleMapFriendsPress}
              type="solid"
              containerStyle={styles.chipContainerStyle}
              buttonStyle={styles.chipStyle}
            />
          </View>
        </View>
        {(searchActive || searchQuery) && (
          <View style={styles.searchResultsContainer}>
            <ScrollView>
              {sortedUsers.map((user) => (
                <ListItem
                  key={user.id}
                  bottomDivider
                  onPress={() => zoomToUserLocation(user.location)}
                >
                  <UserAvatarMarker user={user} size={30} color="#00ADB5" />
                  <ListItem.Content>
                    <ListItem.Title>{user.name}</ListItem.Title>
                    <ListItem.Subtitle>{user.distance.toFixed(2)} km away</ListItem.Subtitle>
                  </ListItem.Content>
                  <Button
                    type="clear"
                    icon={{
                      name: user.requests && user.requests[userId] ? 'check' : 'user-plus',
                      type: 'font-awesome',
                      size: 25,
                      color: user.requests && user.requests[userId] ? 'green' : '#222831',
                    }}
                    onPress={() => toggleFriendRequest(user.id)}
                  />
                </ListItem>
              ))}
            </ScrollView>
          </View>
        )}
        <MapView
          ref={mapRef}
          // provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onRegionChange={() => {
            if (isTracking) {
              setIsTracking(false);
            }
          }}
          customMapStyle={customMapStyle}
        >
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
              <UserAvatarMarker
                user={{ name: userName }}
                color="#00ADB5"
              />
            </Marker.Animated>
          )}
          {Object.entries(users).filter(([id]) => id !== userId).map(([id, user]) => (
            <Marker.Animated key={id} coordinate={userMarkers.get(id)} title={user.name || 'Anonymous'}>
              <UserAvatarMarker
                user={user}
              />
            </Marker.Animated>
          ))}
        </MapView>
        <Button
          buttonStyle={[styles.recenterButton, isTracking ? styles.trackingButton : null]}
          containerStyle={styles.recenterButtonContainer}
          icon={
            <Icon
              name="location-arrow"
              type="font-awesome"
              size={25}
              color={isTracking ? "#FFF" : "#00ADB5"}
            />
          }
          onPress={() => setIsTracking(!isTracking)}
        />
      </View>
    </KeyboardAvoidingView>
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
    <View style={styles.friendsContainer}>
      <Header />
      <View style={styles.friendsHeader}>
        <Text style={styles.friendsTitle}>Friends</Text>
        <Button
        type="outline"
          icon={{
            name: 'plus',
            type: 'font-awesome',
            size: 15,
            color: '#00ADB5'
          }}
          title="Add friend"
          buttonStyle={styles.addFriendButton}
          titleStyle={{ color: 'white' }}
        />
      </View>
      {/* Placeholder for friend requests */}
      <View style={styles.friendRequestsContainer}>
        <Text style={styles.sectionTitle}>Friend Requests</Text>
        {/* Mockup for friend request */}
        <Text style={{ color: 'white' }}>Antonin Beliard asked to be your friend!</Text>
      </View>
      {/* Placeholder for friend list */}
      <View style={styles.friendsListContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        {/* Mockup for friend list */}
        <Text style={{ color: 'white' }}>Ravaka Ramarozatovo</Text>
      </View>
    </View>
  );
}

function YouScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserName) {
        setUserName(storedUserName);
      }
      if (storedUserId) {
        setUserId(storedUserId);
      }
    };

    fetchUserData();
  }, []);

  const handleNameChange = text => {
    setUserName(text);
  };

  const handleNameSubmit = async () => {
    if (userId) {
      const userRef = ref(database, `users/${userId}`);
      update(userRef, { name: userName.trim() });
      await AsyncStorage.setItem('userName', userName.trim());
    }
  };

  return (
    <View style={styles.settingsContainer}>
      <Header />
      <Text style={styles.settingsTitle}>Your Profile</Text>
      <TextInput
        style={styles.nameInput}
        value={userName}
        onChangeText={handleNameChange}
        placeholder="Enter your name"
        placeholderTextColor="#CCCCCC"
        onSubmitEditing={handleNameSubmit}
      />
      <TouchableOpacity onPress={handleNameSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      <Text style={styles.uuidText}>Your UUID: {userId}</Text>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.clear();
        setUserName('');
        setUserId('');
      }} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete All Data</Text>
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
            // <Avatar
            //   size={size}
            //   rounded
            //   title={getTwoFirstLetters(userName)}
            //   containerStyle={{ backgroundColor: "#00ADB5" }}
            // />
            <UserAvatarMarker user={{ name: userName }} size={size} />
          ),
        }} />
      </Tab.Navigator>
      <StatusBar barStyle="light-content" />
    </NavigationContainer>
  );
}
