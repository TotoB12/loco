import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import socketIOClient from 'socket.io-client';

const BACKEND_URL = 'https://936ff5c0-26d7-46ed-a685-37d559d3059c-00-38bx89sq6lor3.kirk.replit.dev';
const socket = socketIOClient(BACKEND_URL);

const NameScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [userName, setUserName] = useState('');

  const handleNameChange = (text) => {
    setUserName(text);
  };

  const handleNameSubmit = () => {
    socket.emit('updateName', { id: userId, name: userName });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your name</Text>
      <TextInput
        style={styles.nameInput}
        value={userName}
        onChangeText={handleNameChange}
        onSubmitEditing={handleNameSubmit}
      />
      <Button title="Submit" onPress={handleNameSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
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
});

export default NameScreen;