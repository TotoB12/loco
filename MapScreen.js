// MapScreen.js
import React, { useRef, useContext, useState } from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE } from 'react-native-maps';
import { SearchBar, Button, Chip, ListItem, Avatar } from '@rneui/themed';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { UserContext } from './UserContext';
import { styles, customMapStyle } from './Styles';
import { getDistanceFromLatLonInKm } from './utils';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
    </View>
  );
};

const UserAvatarMarker = ({ user, size, color }) => {
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
      containerStyle={{ backgroundColor: color || "#FFFFFF" }}
      titleStyle={{ color: "black" }}
    />
  );
};

function MapScreen() {
  const mapRef = useRef(null);
  const { user, users, updateUser, isTracking, setIsTracking } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBarRef = useRef(null);
  const [searchActive, setSearchActive] = useState(false);
  const userMarkers = useRef(new Map()).current;

  const sortedUsers = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.entries(users)
      .map(([id, u]) => ({
        id,
        ...u,
        distance: user && user.location ? getDistanceFromLatLonInKm(
          user.location.latitude,
          user.location.longitude,
          u.location.latitude,
          u.location.longitude
        ) : Infinity
      }))
      .filter(u => u.id !== user?.id && u.name.toLowerCase().includes(query))
      .sort((a, b) => a.distance - b.distance);
  }, [users, user, searchQuery]);

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
    if (!user?.id) {
      console.log("User ID is not set");
      return;
    }

    const requestsRef = ref(database, `users/${receiverId}/requests/${user.id}`);
    onValue(requestsRef, async (snapshot) => {
      if (snapshot.exists()) {
        await set(requestsRef, null);
        console.log("Friend request removed.");
      } else {
        await set(requestsRef, true);
        console.log("Friend request sent!");
      }
    }, {
      onlyOnce: true
    });
  };

  const recenterMap = () => {
    if (user?.location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: user.location.latitude,
        longitude: user.location.longitude,
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

  if (!user?.location) {
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
              {sortedUsers.map((user) => (
                <ListItem
                  key={user.id}
                  bottomDivider
                  onPress={() => zoomToUserLocation(user.location)}
                >
                  <UserAvatarMarker user={user} size={30} color="#00ADB5" />
                  <ListItem.Content>
                    <ListItem.Title>{user.name}</ListItem.Title>
                    <ListItem.Subtitle>
                      {user.distance !== Infinity ? `${user.distance.toFixed(2)} km away` : 'Distance unknown'}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                  <Button
                    title="Request"
                    onPress={() => toggleFriendRequest(user.id)}
                    buttonStyle={styles.requestButton}
                    titleStyle={styles.requestButtonText}
                  />
                </ListItem>
              ))}
            </ScrollView>
          </View>
        )}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          customMapStyle={customMapStyle}
          initialRegion={{
            latitude: user.location.latitude,
            longitude: user.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {user && (
            <Marker
              coordinate={user.location}
              title="Your Location"
            >
              <UserAvatarMarker user={user} size={40} color="#00ADB5" />
            </Marker>
          )}
          {Object.values(users).map((otherUser) => (
            otherUser.location ? (
              <Marker
                key={otherUser.id}
                coordinate={otherUser.location}
                title={otherUser.name}
              >
                <UserAvatarMarker user={otherUser} size={30} />
              </Marker>
            ) : null
          ))}
        </MapView>
        <View style={styles.recenterButtonContainer}>
          <Button
            icon={{
              name: 'crosshairs',
              type: 'font-awesome',
              size: 20,
              color: 'white',
            }}
            onPress={recenterMap}
            buttonStyle={styles.recenterButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default MapScreen;
