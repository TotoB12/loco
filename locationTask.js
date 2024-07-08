import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getDatabase, ref, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const database = getDatabase();
    const userId = await AsyncStorage.getItem('userId');
    const userName = await AsyncStorage.getItem('userName');
    if (userId && userName && locations && locations.length > 0) {
      const { latitude, longitude } = locations[0].coords;
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        location: locations[0].coords,
        timestamp: Date.now(),
      });
    }
  }
});

export const startLocationTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    console.error('Foreground location permission is required');
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    console.error('Background location permission is required');
    return;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 1,
    deferredUpdatesInterval: 1000,
    foregroundService: {
      notificationTitle: "Location tracking",
      notificationBody: "Location tracking is running",
      notificationColor: "#00ADB5",
    },
    pausesUpdatesAutomatically: false,
  });
};