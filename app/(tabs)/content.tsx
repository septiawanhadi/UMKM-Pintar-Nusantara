import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image,
  View,
  StatusBar
} from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/tokens';
import { useContentStore, Product, ContentCaption } from '../../src/store/contentStore';
import { useNetworkStore } from '../../src/store/networkStore';
import { analyticsService } from '../../src/services/analytics';
import { Ionicons } from '@expo/vector-icons';
import { ProductCategory } from '../../src/services/ai';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import BackgroundGlows from '../../src/components/BackgroundGlows';

export default function ContentScreen() {
  const { 
    generateContent, 
    latestProduct, 
    products, 
    loadHistory, 
    isLoading,
    clearLatestProduct
  } = useContentStore();

  const { isOnline } = useNetworkStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory>('UMUM');
  const [subCategory, setSubCategory] = useState('');
  
  // Active states for result tabs
  const [activeCaptionStyle, setActiveCaptionStyle] = useState<'PERSUASIVE' | 'CASUAL' | 'EDUCATIONAL'>('PERSUASIVE');
  const [activePreviewProduct, setActivePreviewProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Update active preview whenever a new product is generated
  useEffect(() => {
    if (latestProduct) {
      setActivePreviewProduct(latestProduct);
    }
  }, [latestProduct]);

  // Image Picker Logic
  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin kamera untuk memotret produk.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libraryPermission.granted) {
          Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk memilih foto.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Gagal mengambil gambar', 'Terjadi kesalahan saat mengakses foto.');
    }
  };

  const selectImageSource = () => {
    Alert.alert(
      'Unggah Foto Produk',
      'Pilih sumber foto produk Anda:',
      [
        { text: 'Kamera', onPress: () => pickImage(true) },
        { text: 'Galeri Foto', onPress: () => pickImage(false) },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  // Generate Action
  const handleGenerate = async () => {
    if (!name.trim()) {
      Alert.alert('Eror', 'Silakan masukkan nama produk Anda.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Eror', 'Silakan masukkan penjelasan singkat produk Anda.');
      return;
    }

    analyticsService.trackEvent('generate_content_clicked', { productName: name.trim() });

    try {
      // If no image is selected, we use a placeholder icon/URI
      const finalImageUri = imageUri || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
      await generateContent(name.trim(), description.trim(), finalImageUri, category, subCategory.trim());
      
      // Reset inputs after generation
      setName('');
      setDescription('');
      setSubCategory('');
      setImageUri(null);
    } catch (error: any) {
      Alert.alert('Gagal Membuat Konten', error.message || 'Terjadi kesalahan.');
    }
  };

  // Clipboard Copiers
  const copyToClipboard = async (text: string, typeLabel: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Berhasil Disalin', `${typeLabel} telah disalin ke clipboard.`);
  };

  const getActiveCaption = () => {
    if (!activePreviewProduct) return '';
    const cap = activePreviewProduct.generatedCaptions.find(c => c.style === activeCaptionStyle);
    return cap ? cap.text : '';
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <BackgroundGlows />
      {!isOnline && (
        <OfflineBanner>
          <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <OfflineBannerText>Mode Offline: Menyinkronkan...</OfflineBannerText>
        </OfflineBanner>
      )}
      <ScrollView contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: 100 }}>
        
        {/* Form Header */}
        <FormHeader>
          <FormTitle>Buat Materi Promosi AI</FormTitle>
          <FormSub>Unggah foto produk dan isi detail singkat untuk mulai membuat konten promosi.</FormSub>
        </FormHeader>

        {/* Form Container */}
        <FormWrapper>
          <InputLabel>Nama Produk</InputLabel>
          <InputWrapper>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Contoh: Keripik Singkong Pedas"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </InputWrapper>

          <InputLabel>Deskripsi Produk</InputLabel>
          <TextAreaWrapper>
            <TextAreaInput
              placeholder="Jelaskan keunggulan produk Anda (misal: dibuat dari singkong organik pilihan, gurih bumbu rempah asli, renyah)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline={true}
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </TextAreaWrapper>

          <InputLabel>Kategori Produk</InputLabel>
          <CategoryGrid>
            {[
              { key: 'KULINER', label: 'Kuliner', icon: 'fast-food' },
              { key: 'FASHION', label: 'Fashion', icon: 'shirt' },
              { key: 'KECANTIKAN', label: 'Kecantikan', icon: 'color-palette' },
              { key: 'ELEKTRONIK', label: 'Elektronik', icon: 'hardware-chip' },
              { key: 'UMUM', label: 'Lainnya', icon: 'apps' },
            ].map((item) => (
              <CategoryCard
                key={item.key}
                selected={category === item.key}
                onPress={() => setCategory(item.key as ProductCategory)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={20} 
                  color={category === item.key ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <CategoryCardText selected={category === item.key}>{item.label}</CategoryCardText>
              </CategoryCard>
            ))}
          </CategoryGrid>

          <InputLabel>Jenis Spesifik (Opsional)</InputLabel>
          <InputWrapper>
            <Ionicons name="list-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Contoh: Camilan, Minuman, Laptop, Skincare"
              placeholderTextColor={theme.colors.textSecondary}
              value={subCategory}
              onChangeText={setSubCategory}
            />
          </InputWrapper>

          <InputLabel>Foto Produk</InputLabel>
          {imageUri ? (
            <ImagePreviewContainer>
              <ImagePreview source={{ uri: imageUri }} />
              <RemoveImageBtn onPress={() => setImageUri(null)}>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
              </RemoveImageBtn>
            </ImagePreviewContainer>
          ) : (
            <UploadPlaceholder onPress={selectImageSource}>
              <Ionicons name="camera-outline" size={32} color={theme.colors.primary} />
              <UploadPlaceholderText>Ketuk untuk Unggah Foto</UploadPlaceholderText>
              <UploadPlaceholderSub>Mendukung Kamera / Galeri</UploadPlaceholderSub>
            </UploadPlaceholder>
          )}

          <GenerateButton onPress={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <GenerateButtonText>Buat Konten AI</GenerateButtonText>
              </>
            )}
          </GenerateButton>
        </FormWrapper>

        {/* ACTIVE CONTENT GENERATION OUTPUT */}
        {activePreviewProduct && (
          <OutputContainer>
            <OutputHeader>
              <OutputHeaderTitle>Hasil AI: {activePreviewProduct.name}</OutputHeaderTitle>
              <ResetBtn onPress={() => setActivePreviewProduct(null)}>
                <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} />
                <ResetBtnText>Buat Baru</ResetBtnText>
              </ResetBtn>
            </OutputHeader>

            {/* CARD 1: INSTAGRAM CAPTIONS */}
            <OutputCard>
              <CardTitleRow>
                <Ionicons name="logo-instagram" size={22} color="#E1306C" />
                <CardHeaderTitle>Caption Instagram</CardHeaderTitle>
              </CardTitleRow>

              <CaptionStyleRow>
                {([
                  { key: 'PERSUASIVE', label: 'Persuasif' },
                  { key: 'CASUAL', label: 'Santai' },
                  { key: 'EDUCATIONAL', label: 'Edukasi' }
                ] as const).map((style) => (
                  <StyleBtn 
                    key={style.key} 
                    active={activeCaptionStyle === style.key}
                    onPress={() => setActiveCaptionStyle(style.key)}
                  >
                    <StyleBtnText active={activeCaptionStyle === style.key}>{style.label}</StyleBtnText>
                  </StyleBtn>
                ))}
              </CaptionStyleRow>

              <TextContentContainer>
                <TextContent>{getActiveCaption()}</TextContent>
              </TextContentContainer>

              <CopyBtn onPress={() => copyToClipboard(getActiveCaption(), 'Caption Instagram')}>
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                <CopyBtnText>Salin Caption</CopyBtnText>
              </CopyBtn>
            </OutputCard>

            {/* CARD 2: MARKETPLACE DESCRIPTION */}
            <OutputCard>
              <CardTitleRow>
                <Ionicons name="cart-outline" size={22} color={theme.colors.secondary} />
                <CardHeaderTitle>Deskripsi Marketplace</CardHeaderTitle>
              </CardTitleRow>

              <TextContentContainer>
                <TextContent>{activePreviewProduct.marketplaceDescription}</TextContent>
              </TextContentContainer>

              <CopyBtn onPress={() => copyToClipboard(activePreviewProduct.marketplaceDescription, 'Deskripsi Marketplace')}>
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                <CopyBtnText>Salin Deskripsi</CopyBtnText>
              </CopyBtn>
            </OutputCard>

            {/* CARD 3: HASHTAGS LIST */}
            <OutputCard>
              <CardTitleRow>
                <Ionicons name="pricetags-outline" size={22} color="#3182CE" />
                <CardHeaderTitle>Hashtag Populer</CardHeaderTitle>
              </CardTitleRow>

              <TextContentContainer>
                <HashtagContainer>
                  {activePreviewProduct.suggestedHashtags.map((tag, idx) => (
                    <HashtagBadge key={idx}>
                      <HashtagText>{tag}</HashtagText>
                    </HashtagBadge>
                  ))}
                </HashtagContainer>
              </TextContentContainer>

              <CopyBtn onPress={() => copyToClipboard(activePreviewProduct.suggestedHashtags.join(' '), 'Semua Hashtag')}>
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                <CopyBtnText>Salin Semua Hashtag</CopyBtnText>
              </CopyBtn>
            </OutputCard>
          </OutputContainer>
        )}

        {/* HISTORICAL GENERATION FEED */}
        {products.length > 0 && (
          <HistoryContainer>
            <HistoryTitle>Riwayat Pembuatan Konten</HistoryTitle>
            {products.map((item) => (
              <HistoryCard 
                key={item.id}
                onPress={() => {
                  setActivePreviewProduct(item);
                  // Scroll to output
                  Alert.alert('Riwayat Dimuat', `Menampilkan kembali hasil promosi untuk "${item.name}".`);
                }}
              >
                <HistoryThumbnail source={{ uri: item.imageUrl }} />
                <HistoryInfo>
                  <HistoryName>{item.name}</HistoryName>
                  <HistoryDesc numberOfLines={1}>{item.descriptionRaw}</HistoryDesc>
                  <HistoryDate>{new Date(item.createdAt).toLocaleDateString('id-ID')}</HistoryDate>
                </HistoryInfo>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </HistoryCard>
            ))}
          </HistoryContainer>
        )}

      </ScrollView>
    </Container>
  );
}

// Styled Components
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const OfflineBanner = styled.View`
  background-color: ${theme.colors.danger};
  height: 38px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-horizontal: 16px;
`;

const OfflineBannerText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
`;

const FormHeader = styled.View`
  margin-bottom: ${theme.spacing(2.5)}px;
`;

const FormTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 20px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const FormSub = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
  line-height: 18px;
`;

const FormWrapper = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2.5)}px;
  margin-bottom: ${theme.spacing(3)}px;
  ${theme.glassShadow}
`;

const InputLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-top: ${theme.spacing(2)}px;
  margin-bottom: ${theme.spacing(1)}px;
`;

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.default}px;
  padding-horizontal: ${theme.spacing(2)}px;
  height: 52px;
  background-color: ${theme.colors.inputBg};
`;

const TextInput = styled.TextInput`
  flex: 1;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  height: 100%;
`;

const TextAreaWrapper = styled.View`
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.default}px;
  padding: ${theme.spacing(1.5)}px;
  background-color: ${theme.colors.inputBg};
  min-height: 100px;
`;

const TextAreaInput = styled.TextInput`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  text-align-vertical: top;
  flex: 1;
`;

const UploadPlaceholder = styled.TouchableOpacity`
  border: 1.5px dashed ${theme.colors.primary};
  background-color: rgba(255, 107, 0, 0.05);
  height: 140px;
  border-radius: ${theme.borderRadius.default}px;
  align-items: center;
  justify-content: center;
  margin-vertical: ${theme.spacing(0.5)}px;
`;

const UploadPlaceholderText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.primary};
  margin-top: 8px;
`;

const UploadPlaceholderSub = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
`;

const CategoryGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: ${theme.spacing(0.5)}px;
  margin-bottom: ${theme.spacing(1)}px;
`;

const CategoryCard = styled.TouchableOpacity<{ selected: boolean }>`
  width: 48%;
  background-color: ${(props) => (props.selected ? 'rgba(255, 107, 0, 0.12)' : 'rgba(0, 0, 0, 0.35)')};
  border: 1.5px solid ${(props) => (props.selected ? theme.colors.primary : 'rgba(255, 255, 255, 0.08)')};
  border-radius: ${theme.borderRadius.default}px;
  padding: ${theme.spacing(1.2)}px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1.2)}px;
`;

const CategoryCardText = styled.Text<{ selected: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.selected ? theme.colors.primary : theme.colors.textSecondary)};
  margin-top: 4px;
`;

const ImagePreviewContainer = styled.View`
  height: 160px;
  border-radius: ${theme.borderRadius.default}px;
  overflow: hidden;
  margin-vertical: ${theme.spacing(0.5)}px;
  position: relative;
`;

const ImagePreview = styled.Image`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

const RemoveImageBtn = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(229, 62, 62, 0.9);
  width: 38px;
  height: 38px;
  border-radius: 19px;
  align-items: center;
  justify-content: center;
`;

const GenerateButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.cta}px;
  height: 52px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: ${theme.spacing(3)}px;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
  elevation: 4;
`;

const GenerateButtonText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 700;
  color: #FFFFFF;
`;

const OutputContainer = styled.View`
  margin-top: ${theme.spacing(1)}px;
`;

const OutputHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const OutputHeaderTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  flex: 1;
  margin-right: 10px;
`;

const ResetBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  border: 1px solid ${theme.colors.primary};
  padding-horizontal: 10px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.05);
`;

const ResetBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin-left: 4px;
`;

const OutputCard = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2.5)}px;
  margin-bottom: ${theme.spacing(2.5)}px;
  ${theme.glassShadow}
`;

const CardTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing(2)}px;
`;

const CardHeaderTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-left: 8px;
`;

const CaptionStyleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(2)}px;
  background-color: rgba(11, 16, 29, 0.7);
  border-radius: 20px;
  border: 1.5px solid ${theme.colors.border};
  padding: 3px;
`;

const StyleBtn = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 32px;
  border-radius: 16px;
  background-color: ${(props) => (props.active ? theme.colors.primary : 'transparent')};
`;

const StyleBtnText = styled.Text<{ active: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#FFFFFF' : theme.colors.textSecondary)};
`;

const TextContentContainer = styled.View`
  background-color: rgba(11, 16, 29, 0.4);
  border-radius: 12px;
  padding: ${theme.spacing(2)}px;
  margin-bottom: ${theme.spacing(2)}px;
  border: 1.5px solid ${theme.colors.border};
`;

const TextContent = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  line-height: 22px;
`;

const HashtagContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;

const HashtagBadge = styled.View`
  background-color: rgba(0, 229, 255, 0.12);
  border: 1.5px solid rgba(0, 229, 255, 0.25);
  border-radius: 8px;
  padding-horizontal: 8px;
  padding-vertical: 4px;
  margin-right: 6px;
  margin-bottom: 6px;
`;

const HashtagText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.secondary};
`;

const CopyBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  border: 1px solid ${theme.colors.primary};
  border-radius: 8px;
  height: 38px;
  padding-horizontal: 16px;
  background-color: rgba(255, 255, 255, 0.05);
`;

const CopyBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin-left: 6px;
`;

const HistoryContainer = styled.View`
  margin-top: ${theme.spacing(1.5)}px;
`;

const HistoryTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const HistoryCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(1.5)}px;
  margin-bottom: ${theme.spacing(1.5)}px;
  ${theme.glassShadow}
`;

const HistoryThumbnail = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: ${theme.spacing(1.5)}px;
  background-color: ${theme.colors.background};
`;

const HistoryInfo = styled.View`
  flex: 1;
`;

const HistoryName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 2px;
`;

const HistoryDesc = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const HistoryDate = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 10px;
  color: ${theme.colors.textSecondary};
`;
