# Loco - Live Location Sharing App

Loco is a simple mobile application built with Expo and React Native that enables users to share and view live locations with friends. It offers a seamless way to connect with others by displaying their real-time positions on an interactive map. Whether you're coordinating a meetup or just curious about where your friends are, Loco makes location sharing straightforward and engaging.

## Features

- **Live Location Sharing**: Share your real-time location with friends, making it easier to coordinate and meet up.
- **Interactive Map Interface**: View your friends on a map with customizable markers and avatars.
- **Friend Requests**: Send, accept, or decline friend requests to control who can see your location.
- **Search Functionality**: Easily search for other users to add as friends or view their profiles.
- **Background Location Updates**: Continue sharing your location even when the app is running in the background.
- **User Profiles**: Customize your profile with a unique username and avatar.

## Technologies Used

- **React Native & Expo**: For building a cross-platform mobile application.
- **Firebase Realtime Database**: To store user data, including locations, friends, and friend requests.
- **Expo Location Services**: To access and track device location in both foreground and background modes.
- **React Navigation**: To handle navigation between different screens within the app.
- **Expo Notifications**: To manage in-app notifications and alerts.
- **Lodash Debounce**: To optimize location updates and prevent excessive database writes.
- **Haversine Formula**: For calculating distances between latitude and longitude coordinates.

## Getting Started

To run the app locally, clone the repository and install the dependencies:

```bash
git clone https://github.com/yourusername/loco.git
cd loco
npm install
```

Then, start the Expo development server:

```bash
expo start
```

Use the Expo Go app on your mobile device to scan the QR code and launch the application.
