import React, { useContext } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import { Icon, Avatar } from '@rneui/themed';
import { UserContext } from './UserContext';
import { styles } from './Styles';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
    </View>
  );
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
          color: 'green'
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
          color: 'red'
        }}
        titleStyle={{ color: 'white' }}
        buttonStyle={styles.rejectButton}
        onPress={onReject}
      />
    </View>
  </View>
);

const FriendsScreen = () => {
  const { user, users } = useContext(UserContext);

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
          onPress={() => console.log("Add friend button pressed:", user.id)}
        />
      </View>
      <ScrollView style={styles.friendRequestsContainer}>
        {Object.entries(users).map(([id, user]) => user.requests && user.requests[user.id] && (
          <FriendRequestCard
            key={id}
            username={user.name}
            onAccept={() => console.log("Accepted friend request from", user.name)}
            onReject={() => console.log("Rejected friend request from", user.name)}
          />
        ))}
      </ScrollView>
      <View style={styles.friendsListContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        {/* Mockup for friend list */}
        <Text style={{ color: 'white' }}>Ravaka Ramarozatovo</Text>
      </View>
    </View>
  );
};

export default FriendsScreen;
