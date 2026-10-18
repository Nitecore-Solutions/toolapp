import React from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PassportProvider, usePassport } from './components/Passport/PassportContext';
import Step1Upload from './components/Passport/Step1Upload';
import Step2SizePreset from './components/Passport/Step2SizePreset';
import Step3CropAdjust from './components/Passport/Step3CropAdjust';
import Step4BackgroundSelect from './components/Passport/Step4BackgroundSelect';
import Step5ChangeCloth from './components/Passport/Step5ChangeCloth';
import Step6Download from './components/Passport/Step6Download';
import { Check } from 'lucide-react-native';
import { styles } from './components/Passport/styles';

function PassportPhotoContent() {
  const { step } = usePassport();

  const renderStepper = () => {
    const steps = [
      { num: 1, label: 'Upload' },
      { num: 2, label: 'Size' },
      { num: 3, label: 'Crop' },
      { num: 4, label: 'Background' },
      { num: 5, label: 'Cloth' },
      { num: 6, label: 'Download' }
    ];
    return (
      <View style={styles.stepperContainer}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle, 
                step === s.num && styles.stepCircleActive,
                step > s.num && styles.stepCircleCompleted
              ]}>
                {step > s.num ? (
                  <Check color="#FFF" width={10} height={10} />
                ) : (
                  <Text style={[styles.stepNumText, step === s.num && styles.stepNumTextActive]}>{s.num}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, step === s.num && styles.stepLabelActive]}>{s.label}</Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={[styles.stepLine, step > s.num && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.headerTitle}>Make Passport Size Photo</Text>
          <Text style={styles.headerSubtitle}>Welcome to Image Tool - Your Reliable Solution for Passport Size Images!</Text>

          {renderStepper()}

          {step === 1 && <Step1Upload />}
          {step === 2 && <Step2SizePreset />}
          {step === 3 && <Step3CropAdjust />}
          {step === 4 && <Step4BackgroundSelect />}
          {step === 5 && <Step5ChangeCloth />}
          {step === 6 && <Step6Download />}
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function PassportPhotoScreen() {
  return (
    <PassportProvider>
      <PassportPhotoContent />
    </PassportProvider>
  );
}
