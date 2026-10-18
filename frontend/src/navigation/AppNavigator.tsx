import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

// Image Screens
import ResizeScreen from '../screens/ToolScreens/Image/ResizeScreen';
import CompressToKBScreen from '../screens/ToolScreens/Image/CompressToKBScreen';
import FormatConvertScreen from '../screens/ToolScreens/Image/FormatConvertScreen';
import AddNameDateScreen from '../screens/ToolScreens/Image/AddNameDateScreen';
import JoinPhotoSigScreen from '../screens/ToolScreens/Image/JoinPhotoSigScreen';
import PassportPhotoScreen from '../screens/ToolScreens/Image/PassportPhotoScreen';
import ImageTo20KBScreen from '../screens/ToolScreens/Image/ImageTo20KBScreen';
import SignatureResizerScreen from '../screens/ToolScreens/Image/SignatureResizerScreen';
import ChangeFormatScreen from '../screens/ToolScreens/Image/ChangeFormatScreen';
import RemoveBgScreen from '../screens/ToolScreens/Image/RemoveBgScreen';
import PosterEditorScreen from '../screens/ToolScreens/Image/PosterEditorScreen';
import InstaPromptsScreen from '../screens/ToolScreens/Image/InstaPromptsScreen';

// PDF Screens
import ImageToPdfScreen from '../screens/ToolScreens/Pdf/ImageToPdfScreen';
import PdfToJpgScreen from '../screens/ToolScreens/Pdf/PdfToJpgScreen';
import EditPdfScreen from '../screens/ToolScreens/Pdf/EditPdfScreen';
import PdfEditorScreen from '../screens/ToolScreens/Pdf/PdfEditorScreen';
import CompressPdfScreen from '../screens/ToolScreens/Pdf/CompressPdfScreen'; // PDF Size Compressor

// Utility Screens
import ResumeMakerScreen from '../screens/ToolScreens/Utility/ResumeMakerScreen';
import AgeCalculatorScreen from '../screens/ToolScreens/Utility/AgeCalculatorScreen';
import TypingTestScreen from '../screens/ToolScreens/Utility/TypingTestScreen';
import BiodataMakerScreen from '../screens/ToolScreens/Utility/BiodataMakerScreen';
import CollegeCardMakerScreen from '../screens/ToolScreens/Utility/CollegeCardMakerScreen';

// Govt Exam Screens
import NsdlPanPhotoScreen from '../screens/ToolScreens/Govt/NsdlPanPhotoScreen';
import NsdlPanSignatureScreen from '../screens/ToolScreens/Govt/NsdlPanSignatureScreen';
import RrbPhotoScreen from '../screens/ToolScreens/Govt/RrbPhotoScreen';
import RrbSignatureScreen from '../screens/ToolScreens/Govt/RrbSignatureScreen';
import UpscPhotoScreen from '../screens/ToolScreens/Govt/UpscPhotoScreen';
import SscSignatureScreen from '../screens/ToolScreens/Govt/SscSignatureScreen';

export type RootStackParamList = {
  Home: undefined;
  ResizeScreen: undefined;
  CompressToKBScreen: undefined;
  FormatConvertScreen: undefined;
  AddNameDateScreen: undefined;
  JoinPhotoSigScreen: undefined;
  ImageToPdfScreen: undefined;
  PdfToJpgScreen: undefined;
  EditPdfScreen: undefined;
  PdfEditorScreen: undefined;
  CompressPdfScreen: undefined;
  ResumeMakerScreen: undefined;
  AgeCalculatorScreen: undefined;
  TypingTestScreen: undefined;
  PassportPhotoScreen: undefined;
  ImageTo20KBScreen: undefined;
  SignatureResizerScreen: undefined;
  ChangeFormatScreen: undefined;
  RemoveBgScreen: undefined;
  NsdlPanPhotoScreen: undefined;
  NsdlPanSignatureScreen: undefined;
  RrbPhotoScreen: undefined;
  RrbSignatureScreen: undefined;
  UpscPhotoScreen: undefined;
  SscSignatureScreen: undefined;
  PosterEditorScreen: undefined;
  InstaPromptsScreen: undefined;
  BiodataMakerScreen: undefined;
  CollegeCardMakerScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Outfit-Bold',
        },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Bharat Job Result tool' }} />
      <Stack.Screen name="ResizeScreen" component={ResizeScreen} options={{ title: 'Image Resizer' }} />
      <Stack.Screen name="CompressToKBScreen" component={CompressToKBScreen} options={{ title: 'MB to KB' }} />
      <Stack.Screen name="FormatConvertScreen" component={FormatConvertScreen} options={{ title: 'JPG Converter' }} />
      <Stack.Screen name="AddNameDateScreen" component={AddNameDateScreen} options={{ title: 'Add Name & Date' }} />
      <Stack.Screen name="JoinPhotoSigScreen" component={JoinPhotoSigScreen} options={{ title: 'Photo Signature Joiner' }} />
      <Stack.Screen name="ImageToPdfScreen" component={ImageToPdfScreen} options={{ title: 'Image to PDF' }} />
      <Stack.Screen name="PdfToJpgScreen" component={PdfToJpgScreen} options={{ title: 'PDF to JPG' }} />
      <Stack.Screen name="EditPdfScreen" component={EditPdfScreen} options={{ title: 'Edit PDF' }} />
      <Stack.Screen name="PdfEditorScreen" component={PdfEditorScreen} options={{ title: 'PDF Editor' }} />
      <Stack.Screen name="CompressPdfScreen" component={CompressPdfScreen} options={{ title: 'Compress PDF' }} />
      <Stack.Screen name="ResumeMakerScreen" component={ResumeMakerScreen} options={{ title: 'Resume Maker' }} />
      <Stack.Screen name="AgeCalculatorScreen" component={AgeCalculatorScreen} options={{ title: 'Age Calculator' }} />
      <Stack.Screen name="TypingTestScreen" component={TypingTestScreen} options={{ title: 'Typing Test' }} />
      <Stack.Screen name="PassportPhotoScreen" component={PassportPhotoScreen} options={{ title: 'Passport Size Photo' }} />
      <Stack.Screen name="ImageTo20KBScreen" component={ImageTo20KBScreen} options={{ title: 'Image to 20KB' }} />
      <Stack.Screen name="SignatureResizerScreen" component={SignatureResizerScreen} options={{ title: 'Signature Resizer' }} />
      <Stack.Screen name="ChangeFormatScreen" component={ChangeFormatScreen} options={{ title: 'Change Image Format' }} />
      <Stack.Screen name="RemoveBgScreen" component={RemoveBgScreen} options={{ title: 'Remove Background' }} />
      <Stack.Screen name="NsdlPanPhotoScreen" component={NsdlPanPhotoScreen} options={{ title: 'NSDL PAN Photo' }} />
      <Stack.Screen name="NsdlPanSignatureScreen" component={NsdlPanSignatureScreen} options={{ title: 'NSDL PAN Signature' }} />
      <Stack.Screen name="RrbPhotoScreen" component={RrbPhotoScreen} options={{ title: 'RRB Photo Resizer' }} />
      <Stack.Screen name="RrbSignatureScreen" component={RrbSignatureScreen} options={{ title: 'RRB Signature Resizer' }} />
      <Stack.Screen name="UpscPhotoScreen" component={UpscPhotoScreen} options={{ title: 'UPSC Photo Resizer' }} />
      <Stack.Screen name="SscSignatureScreen" component={SscSignatureScreen} options={{ title: 'SSC Signature Resizer' }} />
      <Stack.Screen name="PosterEditorScreen" component={PosterEditorScreen} options={{ title: 'Poster Editor' }} />
      <Stack.Screen name="InstaPromptsScreen" component={InstaPromptsScreen} options={{ title: 'Trending Photo Prompts' }} />
      <Stack.Screen name="BiodataMakerScreen" component={BiodataMakerScreen} options={{ title: 'Marriage Bio Data' }} />
      <Stack.Screen name="CollegeCardMakerScreen" component={CollegeCardMakerScreen} options={{ title: 'Online ID Card Maker' }} />
    </Stack.Navigator>
  );
}
