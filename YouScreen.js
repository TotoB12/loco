import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { UserContext } from './UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './Styles';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
    </View>
  );
};

const YouScreen = () => {
  const { user, updateUser } = useContext(UserContext);
  const [userName, setUserName] = useState(user.name);

  const handleNameChange = text => {
    setUserName(text);
  };

  const handleNameSubmit = async () => {
    updateUser({ name: userName.trim() });
    await AsyncStorage.setItem('userName', userName.trim());
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
      <Text style={styles.uuidText}>Your UUID: {user.id}</Text>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.clear();
        updateUser(null);
      }} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete All Data</Text>
      </TouchableOpacity>
    </View>
  );
};

export default YouScreen;
