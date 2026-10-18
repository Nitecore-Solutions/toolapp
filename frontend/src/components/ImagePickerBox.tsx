import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UploadCloud, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerBoxProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onClear: () => void;
  title?: string;
  aspectRatio?: [number, number];
  allowsEditing?: boolean;
}

export const ImagePickerBox: React.FC<ImagePickerBoxProps> = ({ 
  imageUri, 
  onImageSelected, 
  onClear,
  title = "Upload Image",
  aspectRatio,
  allowsEditing = false,
}) => {
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: allowsEditing,
      aspect: aspectRatio,
      quality: 1,
    });

    if (!result.canceled) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <X color="#FFF" width={20} height={20} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <UploadCloud color="#4A90E2" width={32} height={32} />
          </View>
          <Text style={styles.uploadText}>Tap to select an image</Text>
          <Text style={styles.subText}>PNG, JPG, JPEG up to 10MB</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
