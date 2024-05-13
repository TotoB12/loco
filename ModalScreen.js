import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ModalScreen = ({ navigation }) => {
  return (
    <View style={styles.centeredView}>
      <Text style={styles.modalText}>Hello World</Text>
      <Button title="Dismiss" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  }
});

export default ModalScreen;
