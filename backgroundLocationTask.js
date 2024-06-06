import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getDatabase, ref, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';
import { initializeApp } from 'firebase/app';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      const userLocation = locations[0].coords;
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        location: userLocation,
        timestamp: Date.now(),
      });
    }
  }
});

export const startBackgroundLocationUpdate = async () => {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 1, // update every 10 meters
    deferredUpdatesInterval: 1000, // minimum time interval between updates in milliseconds
    showsBackgroundLocationIndicator: true, // show background location indicator
  });
};
