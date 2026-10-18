import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, StatusBar, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOOLS, ToolItem, ToolCategory } from '../constants/tools';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { ToolCard } from '../components/ToolCard';
import { Award, FileText, Image as LucideImage, Search, Settings, Sparkles, Wrench } from 'lucide-react-native';
import AppBannerAd from '../components/AppBannerAd';
import { showInterstitialAd } from '../utils/adManager';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface CategoryTab {
  id: 'All' | ToolCategory;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'All', label: 'All Tools', icon: 'Sparkles', color: '#4F46E5' },
  { id: 'Image', label: 'Image', icon: 'Image', color: '#4F46E5' },
  { id: 'PDF', label: 'PDF', icon: 'FileText', color: '#4F46E5' },
  { id: 'Govt Form', label: 'Govt Form', icon: 'Award', color: '#4F46E5' },
  { id: 'Utility', label: 'Utility', icon: 'Settings', color: '#4F46E5' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ToolCategory>('All');

  const filteredTools = TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getScreenName = (id: string) => {
    switch (id) {
      case 'resize': return 'ResizeScreen';
      case 'compress-kb': return 'CompressToKBScreen';
      case 'format-convert': return 'FormatConvertScreen';
      case 'add-name-date': return 'AddNameDateScreen';
      case 'join-photo-sig': return 'JoinPhotoSigScreen';
      case 'image-to-pdf': return 'ImageToPdfScreen';
      case 'pdf-to-jpg': return 'PdfToJpgScreen';
      case 'edit-pdf': return 'EditPdfScreen';
      case 'pdf-editor': return 'PdfEditorScreen';
      case 'compress-pdf': return 'CompressPdfScreen';
      case 'resume-maker': return 'ResumeMakerScreen';
      case 'age-calculator': return 'AgeCalculatorScreen';
      case 'typing-test': return 'TypingTestScreen';
      case 'passport-photo': return 'PassportPhotoScreen';
      case 'image-to-20kb': return 'ImageTo20KBScreen';
      case 'signature-resizer': return 'SignatureResizerScreen';
      case 'change-format': return 'ChangeFormatScreen';
      case 'remove-bg': return 'RemoveBgScreen';
      case 'nsdl-pan-photo': return 'NsdlPanPhotoScreen';
      case 'nsdl-pan-signature': return 'NsdlPanSignatureScreen';
      case 'rrb-photo': return 'RrbPhotoScreen';
      case 'rrb-signature': return 'RrbSignatureScreen';
      case 'upsc-photo': return 'UpscPhotoScreen';
      case 'ssc-signature': return 'SscSignatureScreen';
      case 'poster-editor': return 'PosterEditorScreen';
      case 'insta-prompts': return 'InstaPromptsScreen';
      case 'biodata-maker': return 'BiodataMakerScreen';
      case 'college-card-maker': return 'CollegeCardMakerScreen';
      default: return 'Home';
    }
  };

  const handleToolPress = (toolId: string) => {
    const screenName = getScreenName(toolId);
    showInterstitialAd(() => {
      navigation.navigate(screenName as any);
    });
  };

  const renderItem = ({ item }: { item: ToolItem }) => (
    <ToolCard 
      item={item} 
      onPress={() => handleToolPress(item.id)} 
    />
  );

  const categoriesList: ToolCategory[] = ['Image', 'PDF', 'Govt Form', 'Utility'];

  // Helper to resolve header icons dynamically from Lucide library
  const getCategoryHeaderIcon = (category: ToolCategory) => {
    switch (category) {
      case 'Image': return LucideImage;
      case 'PDF': return FileText;
      case 'Govt Form': return Award;
      case 'Utility': return Settings;
    }
  };

  const getCategoryColor = (category: ToolCategory) => {
    switch (category) {
      case 'Image': return '#1A73E8';
      case 'PDF': return '#D93025';
      case 'Govt Form': return '#137333';
      case 'Utility': return '#7E22CE';
    }
  };

  const renderSectionedContent = () => {
    if (searchQuery !== '') {
      return (
        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tools found matching your query.</Text>
            </View>
          }
        />
      );
    }

    // Split tools for visual layout matching screenshots
    const generalTools = filteredTools.filter(t => t.category !== 'Govt Form' && t.id !== 'insta-prompts');
    const formTools = filteredTools.filter(t => t.category === 'Govt Form');
    const trendingTools = filteredTools.filter(t => t.id === 'insta-prompts');

    const showGeneral = generalTools.length > 0;
    const showForm = formTools.length > 0 && (selectedCategory === 'All' || selectedCategory === 'Govt Form');
    const showTrending = trendingTools.length > 0 && (selectedCategory === 'All' || selectedCategory === 'Image');

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 1. General Tools Grid */}
        {showGeneral && (
          <View style={styles.gridContainer}>
            {generalTools.map(tool => (
              <ToolCard 
                key={tool.id}
                item={tool} 
                onPress={() => handleToolPress(tool.id)} 
              />
            ))}
          </View>
        )}

        {/* 2. FORM TOOL Section */}
        {showForm && (
          <View>
            <View style={styles.customSectionHeader}>
              <Text style={styles.customSectionHeaderText}>FORM TOOL</Text>
            </View>
            <View style={styles.gridContainer}>
              {formTools.map(tool => (
                <ToolCard 
                  key={tool.id}
                  item={tool} 
                  onPress={() => handleToolPress(tool.id)} 
                />
              ))}
            </View>
          </View>
        )}

        {/* 3. Trending Photo Section */}
        {showTrending && (
          <View>
            <View style={styles.customSectionHeader}>
              <Text style={styles.customSectionHeaderText}>Trending Photo</Text>
            </View>
            <View style={styles.gridContainer}>
              {trendingTools.map(tool => (
                <ToolCard 
                  key={tool.id}
                  item={tool} 
                  onPress={() => handleToolPress(tool.id)} 
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Simple, Professional, Clean Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ 
            width: 38, 
            height: 38, 
            borderRadius: 8, 
            marginRight: 12,
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}>
            <Image 
              source={require('../../assets/logo2.jpeg')} 
              style={{ width: '100%', height: '100%' }} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Bharat Job Result tool</Text>
            <Text style={styles.headerSubtitle}>Official Photo, Signature & Document Resizer Tools</Text>
          </View>
        </View>
      </View>

      {/* Clean Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="#64748B" width={20} height={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools, forms, PDF helpers..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Horizontal Category Selector with Lucide Library Icons */}
      <View style={styles.categoryBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            const getCategoryTabIcon = (iconName: string) => {
              switch (iconName) {
                case 'Sparkles': return Sparkles;
                case 'Image': return LucideImage;
                case 'FileText': return FileText;
                case 'Award': return Award;
                case 'Settings': return Settings;
                default: return Wrench;
              }
            };
            const IconComponent = getCategoryTabIcon(cat.icon);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id !== 'All') {
                    setSearchQuery('');
                  }
                }}
              >
                <IconComponent color={isActive ? '#4F46E5' : '#64748B'} width={13} height={13} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {/* Quick Tool Shortcut Pills (Matching BHR site format) */}
      <View style={styles.shortcutsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsBar}>
          {[
            { name: 'सरकारी रिजल्ट', url: 'https://bharatjobresult.com/sarkari-result/' },
            { name: 'सरकारी काम', url: 'https://bharatjobresult.com/sarkari-kaam/' },
            { name: 'सरकारी योजना', url: 'https://bharatjobresult.com/sarkari-yojana/' },
          ].map((shortcut, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.shortcutPill}
              onPress={() => Linking.openURL(shortcut.url).catch(err => console.error("Couldn't open URL", err))}
            >
              <Text style={styles.shortcutPillText}>{shortcut.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content (Sectioned or Filtered List) */}
      <View style={{ flex: 1 }}>
        {renderSectionedContent()}
      </View>

      {/* Footer Banner Ad */}
      <AppBannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
    fontFamily: 'Outfit-Regular',
  },
  categoryBarContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryBar: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  categoryTabActive: {
    backgroundColor: '#EFF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5,
  },
  categoryTabText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#4F46E5',
    fontFamily: 'Outfit-Bold',
  },
  listContainer: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Outfit-SemiBold',
  },
  sectionContainer: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Outfit-SemiBold',
    marginLeft: 6,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shortcutsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  shortcutsBar: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  shortcutPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    marginRight: 8,
  },
  shortcutPillText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: '#2563EB',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  customSectionHeader: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSectionHeaderText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
});
