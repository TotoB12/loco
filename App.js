import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Image, Platform } from 'react-native';
import { Avatar, Button, Icon, SearchBar, Chip, ListItem } from '@rneui/themed';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Create context for users
const UsersContext = createContext();

const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState({});
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const fetchUsers = () => {
      const usersRef = ref(database, 'users');
      onValue(usersRef, (snapshot) => {
        setUsers(snapshot.val() || {});
      });
    };

    const fetchCurrentUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      if (userId && userName) {
        setCurrentUserId(userId);
        setCurrentUserName(userName);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, []);

  const updateUser = (userId, data) => {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, data);
  };

  const value = {
    users,
    currentUserId,
    currentUserName,
    setCurrentUserId,
    setCurrentUserName,
    updateUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateUuidAndSave = async () => {
  const existingUuid = await AsyncStorage.getItem('userId');
  if (!existingUuid) {
    const uuid = generateUuid();
    await AsyncStorage.setItem('userId', uuid);
    return uuid;
  }
  return existingUuid;
};

const Tab = createBottomTabNavigator();

const Header = () => {
  return (
    <SafeAreaView style={styles.headerContainer}></SafeAreaView>
  );
};

const UserAvatarMarker = ({ user, size, color }) => {
  const getTwoFirstLetters = (name) => {
    if (!name) {
      return '';
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar
      size={size || 30}
      rounded
      title={getTwoFirstLetters(user.name)}
      containerStyle={{ backgroundColor: color || '#FFFFFF' }}
      titleStyle={{ color: 'black' }}
    />
  );
};

// Haversine formula
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const OnboardingScreen = ({ onFinish }) => {
  const pagerRef = useRef(null);
  const [username, setUsername] = useState(generateUsername('-', 3));

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
};

const MapScreen = () => {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBarRef = useRef(null);
  const [searchActive, setSearchActive] = useState(false);
  const userMarkers = useRef(new Map()).current;
  const [isTracking, setIsTracking] = useState(false);

  const { users, currentUserId, currentUserName, updateUser } = useUsers();

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
        ) : Infinity,
      }))
      .filter(user => user.id !== currentUserId && user.name.toLowerCase().includes(query))
      .sort((a, b) => a.distance - b.distance);
  }, [users, location, currentUserId, searchQuery]);

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

      if (currentUserId && currentUserName) {
        const userRef = ref(database, `users/${currentUserId}`);
        update(userRef, {
          name: currentUserName,
          location: currentLocation.coords,
          timestamp: Date.now(),
        });

        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val() || {};
          Object.entries(data).forEach(([id, user]) => {
            if (id !== currentUserId) {
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
        });

        Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        }, (newLocation) => {
          setLocation(newLocation.coords);
          updateUser(currentUserId, { location: newLocation.coords, timestamp: Date.now() });
          updateMarkers();
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
  }, [currentUserId, currentUserName]);

  const updateMarkers = () => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([id, user]) => {
        if (id !== currentUserId) {
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
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleMapAllPress = () => {
    console.log('All was pressed!');
  };

  const handleMapFriendsPress = () => {
    console.log('Friends was pressed!');
  };

  const toggleFriendRequest = async (receiverId) => {
    if (!currentUserId) {
      console.log('User ID is not set');
      return;
    }

    const requestsRef = ref(database, `users/${receiverId}/requests/${currentUserId}`);
    onValue(requestsRef, async (snapshot) => {
      if (snapshot.exists()) {
        await set(requestsRef, null);
        console.log('Friend request removed.');
      } else {
        await set(requestsRef, true);
        console.log('Friend request sent!');
      }
    }, {
      onlyOnce: true,
    });
  };

  const removeFriend = async (friendId) => {
    if (!currentUserId) {
      console.log('User ID is not set');
      return;
    }

    const currentUserRef = ref(database, `users/${currentUserId}`);
    const friendUserRef = ref(database, `users/${friendId}`);

    await update(currentUserRef, {
      [`friends/${friendId}`]: null,
    });
    await update(friendUserRef, {
      [`friends/${currentUserId}`]: null,
    });

    console.log(`Removed friend ${friendId}`);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1 }}>
        <Header />
        <View style={styles.filterContainer}>
          <SearchBar
            platform="default"
            placeholder="Search for friends..."
            onChangeText={handleSearch}
            value={searchQuery}
            onFocus={() => setSearchActive(true)}
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
              {sortedUsers.map((user) => {
                const isFriend = users[currentUserId]?.friends?.[user.id];
                return (
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
                        name: isFriend ? 'user-times' : user.requests && user.requests[currentUserId] ? 'check' : 'user-plus',
                        type: 'font-awesome',
                        size: 25,
                        color: isFriend ? 'red' : user.requests && user.requests[currentUserId] ? 'green' : '#222831',
                      }}
                      onPress={() => isFriend ? removeFriend(user.id) : toggleFriendRequest(user.id)}
                    />
                  </ListItem>
                );
              })}
            </ScrollView>
          </View>
        )}
        <MapView
          ref={mapRef}
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
              key={currentUserId}
              coordinate={new AnimatedRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              })}
              title="You"
            >
              <UserAvatarMarker user={{ name: currentUserName }} color="#00ADB5" />
            </Marker.Animated>
          )}
          {Object.entries(users).filter(([id]) => id !== currentUserId).map(([id, user]) => (
            <Marker.Animated key={id} coordinate={userMarkers.get(id)} title={user.name || 'Anonymous'}>
              <UserAvatarMarker user={user} />
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
              color={isTracking ? '#FFF' : '#00ADB5'}
            />
          }
          onPress={recenterMap}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const FriendsScreen = () => {
  const { users, currentUserId, updateUser } = useUsers();

  const acceptFriendRequest = async (friendId) => {
    // Add each user's UUID to each other's "friends" element
    const currentUserRef = ref(database, `users/${currentUserId}`);
    const friendUserRef = ref(database, `users/${friendId}`);

    await update(currentUserRef, {
      [`friends/${friendId}`]: true,
    });
    await update(friendUserRef, {
      [`friends/${currentUserId}`]: true,
    });

    // Remove requests from both users
    await update(currentUserRef, {
      [`requests/${friendId}`]: null,
    });
    await update(friendUserRef, {
      [`requests/${currentUserId}`]: null,
    });

    console.log(`Accepted friend request from ${friendId}`);
  };

  const rejectFriendRequest = async (friendId) => {
    // Remove the request from the current user's requests
    const currentUserRef = ref(database, `users/${currentUserId}`);
    await update(currentUserRef, {
      [`requests/${friendId}`]: null,
    });

    console.log(`Rejected friend request from ${friendId}`);
  };

  const FriendRequestCard = ({ username, onAccept, onReject }) => (
    <View style={styles.friendRequestCard}>
      <View style={styles.friendRequestHeader}>
        <Icon
          name="bell-o"
          type="font-awesome"
          color="white"
          size={30}
          containerStyle={styles.friendRequestIcon}
        />
        <Text style={styles.friendRequestText}>{username} asked to be your friend!</Text>
      </View>
      <View style={styles.friendRequestActions}>
        <Button
          type="outline"
          title="Hel yeah!"
          icon={{
            name: 'check',
            type: 'font-awesome',
            color: 'green',
          }}
          titleStyle={{ color: 'white' }}
          buttonStyle={styles.acceptButton}
          onPress={onAccept}
        />
        <Button
          type="outline"
          title="Eww no..."
          icon={{
            name: 'times',
            type: 'font-awesome',
            color: 'red',
          }}
          titleStyle={{ color: 'white' }}
          buttonStyle={styles.rejectButton}
          onPress={onReject}
        />
      </View>
    </View>
  );

  const friendRequests = users[currentUserId]?.requests || {};

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
            color: '#00ADB5',
          }}
          title="Add friend"
          buttonStyle={styles.addFriendButton}
          titleStyle={{ color: 'white' }}
          onPress={() => console.log('Add friend button pressed:', currentUserId)}
        />
      </View>
      <ScrollView style={styles.friendRequestsContainer}>
        {Object.entries(friendRequests).map(([id, _]) => (
          <FriendRequestCard
            key={id}
            username={users[id]?.name}
            onAccept={() => acceptFriendRequest(id)}
            onReject={() => rejectFriendRequest(id)}
          />
        ))}
      </ScrollView>
      <View style={styles.friendsListContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        {Object.entries(users[currentUserId]?.friends || {}).map(([friendId, _]) => (
          <Text key={friendId} style={{ color: 'white' }}>
            {users[friendId]?.name}
          </Text>
        ))}
      </View>
    </View>
  );
};

const YouScreen = () => {
  const { currentUserId, currentUserName, setCurrentUserName, updateUser } = useUsers();

  const handleNameChange = (text) => {
    setCurrentUserName(text);
  };

  const handleNameSubmit = async () => {
    if (currentUserId) {
      updateUser(currentUserId, { name: currentUserName.trim() });
      await AsyncStorage.setItem('userName', currentUserName.trim());
    }
  };

  return (
    <View style={styles.settingsContainer}>
      <Header />
      <Text style={styles.settingsTitle}>Your Profile</Text>
      <TextInput
        style={styles.nameInput}
        value={currentUserName}
        onChangeText={handleNameChange}
        placeholder="Enter your name"
        placeholderTextColor="#CCCCCC"
        onSubmitEditing={handleNameSubmit}
      />
      <TouchableOpacity onPress={handleNameSubmit} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      <Text style={styles.uuidText}>Your UUID: {currentUserId}</Text>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.clear();
        setCurrentUserName('');
        setCurrentUserId('');
      }} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete All Data</Text>
      </TouchableOpacity>
    </View>
  );
};

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(null);
  const { currentUserName, currentUserId, setCurrentUserName, setCurrentUserId } = useUsers();

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const storedUserName = await AsyncStorage.getItem('userName');
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId && storedUserName) {
          setCurrentUserId(storedUserId);
          setCurrentUserName(storedUserName);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkUserData();
  }, []);

  const handleFinishOnboarding = (username, userId) => {
    setCurrentUserName(username);
    setCurrentUserId(userId);
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#00ADB5',
          tabBarInactiveTintColor: '#EEEEEE',
          tabBarStyle: styles.bottomNavBar,
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="earth-americas" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Friends"
          component={FriendsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="users" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="You"
          component={YouScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <UserAvatarMarker user={{ name: currentUserName }} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusBar barStyle="light-content" />
    </NavigationContainer>
  );
};

export default function Root() {
  return (
    <UsersProvider>
      <App />
    </UsersProvider>
  );
}