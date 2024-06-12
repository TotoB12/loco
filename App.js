import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Modal, Pressable } from 'react-native';
import { Avatar, Button, Icon, SearchBar, Chip, ListItem } from '@rneui/themed';
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ViewPager from '@react-native-community/viewpager';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { generateUsername } from './generateUsername';
import { customMapStyle, styles } from './Styles';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const UsersContext = createContext();

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const { latitude, longitude } = locations[0].coords;
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      if (userId && userName) {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, {
          // location: { latitude, longitude },
          location: locations[0].coords,
          timestamp: Date.now(),
        });
      }
    }
  }
});

const startBackgroundLocationUpdates = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
      deferredUpdatesInterval: 1000,
      showsBackgroundLocationIndicator: true,
    });
    await BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
      minimumInterval: 60 * 1, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } else {
    console.error('Permission to access background location was denied');
  }
};

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
      return 'NA';
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
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity; // or some default value
  }
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

const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const OnboardingScreen = ({ onFinish }) => {
  const pagerRef = useRef(null);
  const [username, setUsername] = useState(generateUsername('-', 3));

  const finishSetup = async () => {
    const userId = await generateUuidAndSave();
    await AsyncStorage.setItem('userName', username);
    await set(ref(database, `users/${userId}`), {
      id: userId,
      name: username,
      location: null,
      timestamp: Date.now(),
      friends: {},
      requests: {}
    });
    onFinish(username, userId);
  };

  return (
    <ViewPager style={{ flex: 1 }} ref={pagerRef}>
      <View key="1" style={styles.onboardingPage}>
        <Text style={styles.onboardingTitle}>Welcome to Loco</Text>
        <FontAwesome6 name="earth-americas" size={100} color="white" />
        <TouchableOpacity onPress={() => pagerRef.current.setPage(1)} style={styles.onboardingButton}>
          <Text style={styles.onboardingButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View key="2" style={styles.onboardingPage}>
          <Text style={styles.onboardingTitle}>Choose Your Name</Text>
          <TextInput
            style={styles.onboardingInput}
            onChangeText={setUsername}
            value={username}
            placeholder="Enter your username"
            placeholderTextColor="#CCCCCC"
          />
          <TouchableOpacity onPress={() => pagerRef.current.setPage(2)} style={styles.onboardingButton}>
            <Text style={styles.onboardingButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <View key="3" style={styles.onboardingPage}>
        <Text style={styles.onboardingTitle}>Let's Get Started</Text>
        <FontAwesome6 name="globe" size={100} color="white" />
        <TouchableOpacity onPress={finishSetup} style={styles.onboardingButton}>
          <Text style={styles.onboardingButtonText}>Finish Setup</Text>
        </TouchableOpacity>
      </View>
    </ViewPager>
  );
};

const UserDialog = ({ isVisible, onClose, user }) => {
  const { currentUserId, users, updateUser } = useUsers();
  if (!user) return null;

  const isCurrentUser = user.id === currentUserId;
  const isFriend = users[currentUserId]?.friends?.[user.id];
  const hasSentRequest = users[user.id]?.requests?.[currentUserId];

  const handleFriendButtonPress = async () => {
    if (isFriend) {
      await removeFriend(user.id);
    } else {
      await toggleFriendRequest(user.id);
    }
    // close on Friend page, not on Map page
    onClose();
  };

  const handleCopyAddress = () => {
    console.log("Copy address pressed");
  };

  const handleCopyCoordinates = () => {
    console.log("Copy coordinates pressed");
    Clipboard.setStringAsync(`${user.location.latitude}, ${user.location.longitude}`);
  };

  const handleSetDirections = () => {
    if (user.location) {
      const url = `http://maps.google.com/?q=${user.location.latitude},${user.location.longitude}`;
      Linking.openURL(url);
    } else {
      console.log("User location is not available.");
    }
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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{!isCurrentUser ? user.name : "You"}</Text>
          {!isCurrentUser && (
            <>
              <Button
                title={isFriend ? "Remove friend" : hasSentRequest ? "Cancel friend request" : "Send friend request"}
                onPress={handleFriendButtonPress}
                buttonStyle={styles.dialogButton}
                titleStyle={styles.dialogButtonTitle}
              />
            </>
          )}
          <Button
            title="Copy address"
            onPress={handleCopyAddress}
            buttonStyle={styles.dialogButton}
            titleStyle={styles.dialogButtonTitle}
          />
          <Button
            title="Copy coordinates"
            onPress={handleCopyCoordinates}
            buttonStyle={styles.dialogButton}
            titleStyle={styles.dialogButtonTitle}
          />
          {!isCurrentUser && (
            <>
              <Button
                title="Set directions"
                onPress={handleSetDirections}
                buttonStyle={styles.dialogButton}
                titleStyle={styles.dialogButtonTitle}
              />
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

const MapScreen = ({ searchBarRef }) => {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogUser, setDialogUser] = useState(null);
  const [filter, setFilter] = useState('All');

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
          user.location?.latitude,
          user.location?.longitude
        ) : Infinity,
      }))
      .filter(user => user.id !== currentUserId && user.name.toLowerCase().includes(query))
      .sort((a, b) => a.distance - b.distance);
  }, [users, location, currentUserId, searchQuery, filter]);

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

        Location.watchPositionAsync({
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        }, (newLocation) => {
          setLocation(newLocation.coords);
          updateUser(currentUserId, { location: newLocation.coords, timestamp: Date.now() });
          // if (mapRef.current) {
          //   mapRef.current.animateToRegion({
          //     latitude: newLocation.coords.latitude,
          //     longitude: newLocation.coords.longitude,
          //     latitudeDelta: 0.0922,
          //     longitudeDelta: 0.0421,
          //   }, 500);
          // }
        }).then((watcher) => {
          return () => watcher.remove();
        });
      }
    };

    const getBackgroundLocationPermission = async () => {
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access background location was denied');
        return;
      }
    };

    initLocationTracking();
    getBackgroundLocationPermission();
  }, [currentUserId, currentUserName]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleMapAllPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter('All');
  };

  const handleMapFriendsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(filter === 'Friends' ? 'All' : 'Friends');
  };

  const handleCalloutPress = (user) => {
    console.log('Callout pressed:', user.name);
    setDialogUser(user);
    setDialogVisible(true);
  };

  const renderCalloutContent = (user) => {
    if (!user || !user.location || !user.location.latitude || !user.location.longitude) {
      return null;
    }

    const isCurrentUser = user.id === currentUserId;
    const distance = location && user.location
      ? getDistanceFromLatLonInKm(
        location.latitude,
        location.longitude,
        user.location.latitude,
        user.location.longitude
      ).toFixed(2)
      : 'Unknown';
    const timeAgo = user.timestamp ? formatTimeAgo(user.timestamp) : 'Unknown';

    return (
      <Callout onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleCalloutPress(user); }} >
        <View style={[styles.card]}>
          <Avatar
            size={25}
            rounded
            title={user.name.substring(0, 2).toUpperCase()}
            containerStyle={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{user.name}</Text>
            {!isCurrentUser && (
              <>
                <Text style={styles.details}>{distance} km away</Text>
                <Text style={styles.details}>{timeAgo}</Text>
              </>
            )}
          </View>
          <View style={styles.userOptions}>
            <Icon name="dots-three-vertical" type="entypo" color="black" size={20} />
          </View>
        </View>
      </Callout>
    );
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  };

  const zoomToUserLocation = (location, isFriend) => {
    setSearchQuery('');
    setSearchActive(false);
    Keyboard.dismiss();
    if (!isFriend) {
      setFilter('All');
    }
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const closeSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchBarRef.current.blur();
    setSearchActive(false);
    setSearchQuery('');
  };

  // if (!initialRegionSet) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <ActivityIndicator size="large" color="#00ADB5" />
  //     </View>
  //   );
  // }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          <Header />
          <View style={styles.filterContainer}>
            {searchActive && (
              <Button
                type="solid"
                icon={{
                  name: 'chevron-left',
                  type: 'font-awesome',
                  size: 20,
                  color: 'black',
                }}
                onPress={closeSearch}
                buttonStyle={styles.closeButtonStyle}
                containerStyle={styles.closeButtonContainer}
              />
            )}
            <SearchBar
              platform="default"
              placeholder="Search for users..."
              onChangeText={handleSearch}
              value={searchQuery}
              onFocus={() => { setSearchActive(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              ref={searchBarRef}
              containerStyle={[
                styles.searchContainerStyle,
                { marginLeft: searchActive ? 60 : 0, flex: searchActive ? 1 : 0 },
              ]}
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
                buttonStyle={[styles.chipStyle, filter === 'All' && styles.selectedChipStyle]}
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
                buttonStyle={[styles.chipStyle, filter === 'Friends' && styles.selectedChipStyle]}
              />
            </View>
          </View>
          {(searchActive || searchQuery) && (
            <View style={styles.searchResultsContainer}>
              {sortedUsers.length === 0 ? (
                <View style={styles.noUserFoundContainer}>
                  <Text style={styles.noUserFoundText}>No user found</Text>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps='handled'>
                  {sortedUsers.map((user) => {
                    const isFriend = users[currentUserId]?.friends?.[user.id];
                    return (
                      <ListItem
                        key={user.id}
                        bottomDivider
                        onPress={() => zoomToUserLocation(user.location, isFriend)}
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
              )}
            </View>
          )}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location ? {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            } : undefined}
            onMapReady={() => {
              if (location && !initialRegionSet) {
                setInitialRegionSet(true);
                mapRef.current.animateToRegion({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }, 500);
              }
            }}
            onRegionChange={() => {
            }}
            customMapStyle={customMapStyle}
          >
{location && location.latitude && location.longitude && (
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
    {renderCalloutContent({ id: currentUserId, name: currentUserName, location })}
    <UserAvatarMarker user={{ name: currentUserName }} color="#00ADB5" />
  </Marker.Animated>
)}
{Object.entries(users)
  .filter(([id, user]) =>
    id !== currentUserId &&
    user &&
    user.location &&
    user.location.latitude &&
    user.location.longitude &&
    (filter === 'All' || (filter === 'Friends' && users[currentUserId]?.friends?.[id]))
  )
  .map(([id, user]) => (
    <Marker.Animated
      key={id}
      coordinate={new AnimatedRegion({
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })}
      title={user.name || 'Anonymous'}
    >
      {renderCalloutContent(user)}
      <UserAvatarMarker user={user} />
    </Marker.Animated>
  ))
}
          </MapView>
          <Button
            buttonStyle={[styles.recenterButton, null]}
            containerStyle={styles.recenterButtonContainer}
            icon={
              <Icon
                name="location-arrow"
                type="font-awesome"
                size={25}
                color={'#00ADB5'}
              />
            }
            onPress={() => recenterMap()}
          />
        </View>
        <UserDialog
          isVisible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          user={dialogUser}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const FriendsScreen = ({ navigation, focusSearchBar }) => {
  const { users, currentUserId, updateUser } = useUsers();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogUser, setDialogUser] = useState(null);

  const acceptFriendRequest = async (friendId) => {
    const currentUserRef = ref(database, `users/${currentUserId}`);
    const friendUserRef = ref(database, `users/${friendId}`);

    await update(currentUserRef, {
      [`friends/${friendId}`]: true,
    });
    await update(friendUserRef, {
      [`friends/${currentUserId}`]: true,
    });

    await update(currentUserRef, {
      [`requests/${friendId}`]: null,
    });
    await update(friendUserRef, {
      [`requests/${currentUserId}`]: null,
    });

    console.log(`Accepted friend request from ${friendId}`);
  };

  const rejectFriendRequest = async (friendId) => {
    const currentUserRef = ref(database, `users/${currentUserId}`);
    await update(currentUserRef, {
      [`requests/${friendId}`]: null,
    });

    console.log(`Rejected friend request from ${friendId}`);
  };

  const cancelPendingRequest = async (receiverId) => {
    const receiverRef = ref(database, `users/${receiverId}/requests/${currentUserId}`);
    await remove(receiverRef);
    console.log(`Cancelled pending request to ${receiverId}`);
  };

  const FriendRequestCard = ({ username, onAccept, onReject }) => (
    <View style={styles.friendRequestCard}>
      <View style={styles.friendRequestHeader}>
        <Icon
          name="bell-ring-outline"
          type="material-community"
          color="white"
          size={27}
          containerStyle={styles.friendRequestIcon}
        />
        <Text style={styles.friendRequestUsernameText}>{username}</Text><Text style={styles.friendRequestText}> asked to be your friend!</Text>
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

  const friends = users[currentUserId]?.friends || {};
  const friendsList = Object.keys(friends).map(friendId => ({
    id: friendId,
    ...users[friendId]
  }));
  const friendRequests = users[currentUserId]?.requests || {};
  const pendingRequests = Object.entries(users).filter(([id, user]) => user.requests && user.requests[currentUserId]);

  return (
    <View style={styles.friendsPage}>
      <Header />
      <View style={styles.friendsHeader}>
        <Text style={styles.friendsTitle}>Friends</Text>
        <Button
          type="outline"
          icon={{
            name: 'user-plus',
            type: 'feather',
            size: 20,
            color: '#00ADB5',
          }}
          title="Add friend"
          buttonStyle={styles.addFriendButton}
          titleStyle={{ color: 'white' }}
          // onPress={() => { console.log('Add friend button pressed:', currentUserId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
          onPress={() => {
            navigation.navigate('Map');
            // setTimeout(() => {
            focusSearchBar();
            // }, 500);
          }}
        />
      </View>
      <ScrollView style={styles.friendPageContainer}>
        {Object.entries(friendRequests).map(([id, _]) => (
          <FriendRequestCard
            key={id}
            username={users[id]?.name}
            onAccept={() => { acceptFriendRequest(id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
            onReject={() => { rejectFriendRequest(id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
          />
        ))}

        {friendsList.length === 0 ? (
          <Text style={styles.emptyFriendsText}>You sure seem lonely...</Text>
        ) : (
          friendsList.map((friend) => (
            <ListItem key={friend.id} style={styles.friendsList} containerStyle={styles.friendsListContainer} bottomDivider>
              <UserAvatarMarker user={{ name: friend.name }} color="#00ADB5" />
              <ListItem.Content>
                <ListItem.Title style={styles.friendsListText}>{friend.name}</ListItem.Title>
                <ListItem.Subtitle style={styles.friendsListText}>
                  {getDistanceFromLatLonInKm(
                    users[currentUserId].location.latitude,
                    users[currentUserId].location.longitude,
                    friend.location.latitude,
                    friend.location.longitude
                  ).toFixed(2)} km away
                </ListItem.Subtitle>
              </ListItem.Content>
              <Button
                type="clear"
                icon={{
                  name: 'dots-three-vertical',
                  type: 'entypo',
                  color: 'white',
                  size: 20,
                }}
                onPress={() => {
                  setDialogUser(friend);
                  setDialogVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </ListItem>
          ))
        )}

        {pendingRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending Requests:</Text>
            {pendingRequests.map(([id, user]) => (
              <ListItem
                key={id}
                sytles={styles.friendsList}
                containerStyle={styles.friendsListContainer}
                bottomDivider
              // onPress={() => console.log('Pending request user pressed')}
              >
                <UserAvatarMarker user={user} size={30} color="gray" />
                <ListItem.Content>
                  <ListItem.Title style={styles.friendsPendingListText}>{user.name}</ListItem.Title>
                </ListItem.Content>
                <Button
                  type="clear"
                  icon={{
                    name: 'closecircleo',
                    type: 'antdesign',
                    color: 'gray',
                    size: 25,
                  }}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); cancelPendingRequest(id); }}
                />
              </ListItem>
            ))}
          </>
        )}
      </ScrollView>
      <UserDialog
        isVisible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        user={dialogUser}
      />
    </View>
  );
};

const YouScreen = () => {
  const { currentUserId, currentUserName, users, setCurrentUserName, setCurrentUserId, updateUser } = useUsers();
  const [name, setName] = useState(currentUserName);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setName(currentUserName);
  }, [currentUserName]);

  const handleNameChange = (text) => {
    if (text.length <= 20) {
      setName(text);
      setHasUnsavedChanges(text !== currentUserName);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentUserId && name.trim()) {
      updateUser(currentUserId, { name: name.trim() });
      await AsyncStorage.setItem('userName', name.trim());
      setCurrentUserName(name.trim());
      setHasUnsavedChanges(false);
      Keyboard.dismiss();
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(currentUserName);
    setHasUnsavedChanges(false);
  };

  const handleDeleteAccount = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (currentUserId) {
      try {
        const userRef = ref(database, `users/${currentUserId}`);

        for (let [userId, user] of Object.entries(users)) {
          if (userId === currentUserId) continue;

          const userFriendsRef = ref(database, `users/${userId}/friends/${currentUserId}`);
          const userRequestsRef = ref(database, `users/${userId}/requests/${currentUserId}`);
          await remove(userFriendsRef);
          await remove(userRequestsRef);
        }

        await remove(userRef);

        await AsyncStorage.clear();
        setCurrentUserName('');
        setCurrentUserId('');
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const numberOfFriends = users[currentUserId]?.friends ? Object.keys(users[currentUserId].friends).length : 0;

  return (
    <View style={styles.youPage}>
      <Header />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.youHeader}>
            <Text style={styles.youTitle}>My profile</Text>
          </View>
          <ScrollView contentContainerStyle={styles.youContainer}>
            <View style={styles.profileCard}>
              <Avatar
                size="large"
                rounded
                title={currentUserName.substring(0, 2).toUpperCase()}
                containerStyle={styles.profileAvatar}
              />
              <Text style={styles.profileName}>{currentUserName}</Text>
              <View style={styles.profileFriendsContainer}>
                <FontAwesome6 name="users" size={15} color="gray" />
                <Text style={styles.profileFriends}>
                  {numberOfFriends > 0 ? `${numberOfFriends} friend${numberOfFriends > 1 ? 's' : ''}` : 'lonely'}
                </Text>
              </View>
            </View>
            <Text style={styles.nameInputText}>Name:</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              placeholderTextColor="#CCCCCC"
              maxLength={20}
            />
            {hasUnsavedChanges && (
              <View style={styles.unsavedChangesContainer}>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.hiddenSection}>
              <Text style={styles.uuidText}>ONLY TOUCH THIS IF YOU</Text>
              <Text style={styles.uuidText}>KNOW WHAT YOU ARE DOING</Text>
              <Text style={styles.uuidText}>Your UUID: {currentUserId}</Text>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(null);
  const { currentUserName, currentUserId, setCurrentUserName, setCurrentUserId } = useUsers();
  const searchBarRef = useRef(null);

  const focusSearchBar = () => {
    if (searchBarRef.current) {
      searchBarRef.current.focus();
    }
  };

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
        await startBackgroundLocationUpdates(); // Start background location updates
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
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="earth-americas" size={size} color={color} />
            ),
          }}
        >
          {(props) => <MapScreen {...props} searchBarRef={searchBarRef} />}
        </Tab.Screen>
        <Tab.Screen
          name="Friends"
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6 name="users" size={size} color={color} />
            ),
          }}
        >
          {(props) => <FriendsScreen {...props} focusSearchBar={focusSearchBar} />}
        </Tab.Screen>
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
