// OnboardingScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import ViewPager from '@react-native-community/viewpager';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUsername } from './generateUsername';
import { generateUuidAndSave } from './App';
import { styles } from './Styles';

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
        <Text style={styles.title}>Finish Setup</Text>
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

export default OnboardingScreen;
