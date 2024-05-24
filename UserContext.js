// UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import * as Location from 'expo-location';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserName = await AsyncStorage.getItem('userName');
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId && storedUserName) {
          const currentLocation = await Location.getCurrentPositionAsync({});
          const userRef = ref(database, `users/${storedUserId}`);
          set(userRef, {
            name: storedUserName,
            location: currentLocation.coords,
            timestamp: Date.now(),
          });
          setUser({
            id: storedUserId,
            name: storedUserName,
            location: currentLocation.coords,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      const userRef = ref(database, `users/${user.id}`);
      const handleLocationUpdate = (newLocation) => {
        setUser((prevUser) => ({
          ...prevUser,
          location: newLocation.coords,
        }));
        update(userRef, {
          location: newLocation.coords,
          timestamp: Date.now(),
        });
      };

      const watchLocation = async () => {
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
          },
          handleLocationUpdate
        );
      };

      watchLocation();
    }
  }, [user]);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = async (newData) => {
    if (user && user.id) {
      const userRef = ref(database, `users/${user.id}`);
      setUser((prevUser) => ({
        ...prevUser,
        ...newData,
      }));
      await update(userRef, newData);
    }
  };

  return (
    <UserContext.Provider value={{ user, users, updateUser, setIsTracking, isTracking }}>
      {children}
    </UserContext.Provider>
  );
};
