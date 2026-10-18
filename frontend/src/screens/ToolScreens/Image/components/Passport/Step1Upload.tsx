import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../../../../context/AlertContext';
import { usePassport } from './PassportContext';
import { styles } from './styles';

export default function Step1Upload() {
  const { setImageUri, setImageWidth, setImageHeight, setStep } = usePassport();
  const { showAlert } = useAlert();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageWidth(result.assets[0].width);
        setImageHeight(result.assets[0].height);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to select image.", type: 'error' });
    }
  };

  return (
    <View style={styles.uploadContainer}>
      <View style={styles.uploadBox}>
        <Text style={styles.uploadMainText}>Select Or Drag & Drop Image Here</Text>
        <TouchableOpacity style={styles.selectImageBtn} onPress={pickImage} activeOpacity={0.8}>
          <Text style={styles.selectImageBtnText}>Select Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
