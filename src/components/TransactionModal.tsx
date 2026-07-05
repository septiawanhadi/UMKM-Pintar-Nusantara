import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/financeStore';
import { analyticsService } from '../services/analytics';
import * as ImagePicker from 'expo-image-picker';
import { financeAiService } from '../services/financeAi';
import { audioRecorder } from '../services/audioRecorder';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  initialData?: {
    description?: string;
    amount?: number;
    type?: TxType;
    category?: TxCategory;
    source?: TxSource;
  };
  onSaveSuccess?: () => void;
}

type TxType = 'INCOME' | 'EXPENSE';
type TxCategory = 'SALES' | 'RAW_MATERIAL' | 'SHIPPING' | 'OTHER';
type TxSource = 'TEXT' | 'VOICE' | 'OCR';

export default function TransactionModal({ visible, onClose, initialData, onSaveSuccess }: TransactionModalProps) {
  const { addTransaction, isLoading } = useFinanceStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('INCOME');
  const [category, setCategory] = useState<TxCategory>('SALES');
  const [source, setSource] = useState<TxSource>('TEXT');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDescription(initialData.description || '');
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setType(initialData.type || 'INCOME');
        setCategory(initialData.category || 'SALES');
        setSource(initialData.source || 'TEXT');
      } else {
        setDescription('');
        setAmount('');
        setType('INCOME');
        setCategory('SALES');
        setSource('TEXT');
      }
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Eror', 'Silakan isi deskripsi transaksi.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Eror', 'Silakan masukkan jumlah nominal yang valid.');
      return;
    }

    analyticsService.trackEvent('add_transaction_clicked', {
      type,
      category,
      amount: numericAmount,
      source
    });

    try {
      await addTransaction({
        description: description.trim(),
        amount: numericAmount,
        type,
        category,
        source,
      });
      
      // Reset state and close modal
      setDescription('');
      setAmount('');
      setType('INCOME');
      setCategory('SALES');
      setSource('TEXT');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      onClose();
    } catch (error: any) {
      Alert.alert('Gagal Menyimpan', error.message || 'Terjadi kesalahan.');
    }
  };



  const handleParseTextDescription = async (text: string) => {
    if (!text.trim()) {
      Alert.alert('Info', 'Silakan ketik atau dikte kalimat transaksi terlebih dahulu.');
      return;
    }
    setIsScanning(true);
    try {
      const parsed = await financeAiService.parseVoiceCommand(text);
      setDescription(parsed.description);
      setAmount(parsed.amount.toString());
      setType(parsed.type);
      setCategory(parsed.category);
      setSource('VOICE');
      Alert.alert(
        'AI Berhasil Mengurai', 
        `Hasil penguraian:\n- Deskripsi: ${parsed.description}\n- Nominal: Rp ${parsed.amount.toLocaleString('id-ID')}\n- Kategori: ${parsed.category}`
      );
    } catch (err: any) {
      Alert.alert('Gagal Mengurai', 'Maaf, AI gagal mengurai kalimat tersebut.');
    } finally {
      setIsScanning(false);
    }
  };



  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Overlay>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <ModalContent>
            {/* Header */}
            <Header>
              <ModalTitle>Tambah Transaksi</ModalTitle>
              <CloseButton onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </CloseButton>
            </Header>

            {isScanning && (
              <ScanningOverlay>
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 8 }} />
                <ScanningText>AI sedang memproses...</ScanningText>
              </ScanningOverlay>
            )}

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              
              {/* Type Selector (INCOME / EXPENSE) */}
              <TypeSelectorContainer>
                <TypeButton 
                  active={type === 'INCOME'} 
                  activeColor={theme.colors.secondary} 
                  onPress={() => setType('INCOME')}
                >
                  <Ionicons 
                    name="trending-up-outline" 
                    size={20} 
                    color={type === 'INCOME' ? '#FFFFFF' : theme.colors.textSecondary} 
                  />
                  <TypeButtonText active={type === 'INCOME'}>Pemasukan</TypeButtonText>
                </TypeButton>

                <TypeButton 
                  active={type === 'EXPENSE'} 
                  activeColor={theme.colors.danger} 
                  onPress={() => setType('EXPENSE')}
                >
                  <Ionicons 
                    name="trending-down-outline" 
                    size={20} 
                    color={type === 'EXPENSE' ? '#FFFFFF' : theme.colors.textSecondary} 
                  />
                  <TypeButtonText active={type === 'EXPENSE'}>Pengeluaran</TypeButtonText>
                </TypeButton>
              </TypeSelectorContainer>

              {/* Description Input */}
              <InputLabel>Deskripsi Transaksi</InputLabel>
              <InputWrapperRow>
                <InputWrapper style={{ flex: 1, marginRight: 8 }}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    placeholder="Misal: Beli lakban 45 ribu"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={description}
                    onChangeText={(text) => {
                      setDescription(text);
                      if (source !== 'TEXT') setSource('TEXT'); // Reset to text if typing manually
                    }}
                  />
                </InputWrapper>
                <ParseTextBtn onPress={() => handleParseTextDescription(description)}>
                  <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                  <ParseTextBtnText>Urai AI</ParseTextBtnText>
                </ParseTextBtn>
              </InputWrapperRow>

              {/* Amount Input */}
              <InputLabel>Nominal (Rp)</InputLabel>
              <InputWrapper>
                <Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                  onChangeText={(text) => {
                    const rawVal = text.replace(/[^0-9]/g, '');
                    setAmount(rawVal);
                    if (source !== 'TEXT') setSource('TEXT');
                  }}
                />
              </InputWrapper>

              {/* Category Selector */}
              <InputLabel>Kategori</InputLabel>
              <CategoryGrid>
                {[
                  { key: 'SALES', label: 'Penjualan', icon: 'cash' },
                  { key: 'RAW_MATERIAL', label: 'Bahan Baku', icon: 'construct' },
                  { key: 'SHIPPING', label: 'Ongkir', icon: 'bicycle' },
                  { key: 'OTHER', label: 'Lainnya', icon: 'ellipsis-horizontal' },
                ].map((item) => (
                  <CategoryCard
                    key={item.key}
                    selected={category === item.key}
                    onPress={() => setCategory(item.key as TxCategory)}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={22} 
                      color={category === item.key ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <CategoryCardText selected={category === item.key}>{item.label}</CategoryCardText>
                  </CategoryCard>
                ))}
              </CategoryGrid>



              {/* Save CTA */}
              <SaveButton onPress={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <SaveButtonText>Simpan Transaksi</SaveButtonText>
                )}
              </SaveButton>

            </ScrollView>
          </ModalContent>
        </KeyboardAvoidingView>
      </Overlay>
    </Modal>
  );
}

// Styled Components
const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.55);
  justify-content: flex-end;
`;

const ModalContent = styled.View`
  background-color: ${theme.colors.cardBg};
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  border-width: 1.5px;
  border-color: ${theme.colors.border};
  border-bottom-width: 0px;
  padding: ${theme.spacing(3)}px;
  max-height: 90%;
  position: relative;
`;

const ScanningOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(11, 16, 29, 0.95);
  align-items: center;
  justify-content: center;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  z-index: 10;
`;

const ScanningText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.primary};
  margin-top: 12px;
`;



const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing(3)}px;
`;

const ModalTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 20px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const CloseButton = styled.TouchableOpacity`
  padding: 4px;
`;

const TypeSelectorContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(2.5)}px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 4px;
  background-color: rgba(11, 16, 29, 0.7);
`;

const TypeButton = styled.TouchableOpacity<{ active: boolean; activeColor: string }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => (props.active ? props.activeColor : 'transparent')};
  margin-horizontal: 2px;
`;

const TypeButtonText = styled.Text<{ active: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#FFFFFF' : theme.colors.textSecondary)};
  margin-left: 8px;
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
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: ${theme.borderRadius.default}px;
  padding-horizontal: ${theme.spacing(2)}px;
  height: 52px;
  background-color: rgba(0, 0, 0, 0.35);
`;

const TextInput = styled.TextInput`
  flex: 1;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  height: 100%;
`;

const CategoryGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: ${theme.spacing(0.5)}px;
`;

const CategoryCard = styled.TouchableOpacity<{ selected: boolean }>`
  width: 48%;
  background-color: ${(props) => (props.selected ? 'rgba(255, 107, 0, 0.12)' : 'rgba(0, 0, 0, 0.35)')};
  border: 1.5px solid ${(props) => (props.selected ? theme.colors.primary : 'rgba(255, 255, 255, 0.08)')};
  border-radius: ${theme.borderRadius.default}px;
  padding: ${theme.spacing(1.5)}px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const CategoryCardText = styled.Text<{ selected: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.selected ? theme.colors.primary : theme.colors.textSecondary)};
  margin-top: 4px;
`;



const SaveButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.cta}px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-top: ${theme.spacing(4)}px;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
  elevation: 4;
`;

const SaveButtonText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 700;
  color: #FFFFFF;
`;
const InputWrapperRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing(1)}px;
`;

const ParseTextBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.primary};
  border-radius: 12px;
  height: 52px;
  padding-horizontal: 12px;
`;

const ParseTextBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  margin-left: 4px;
`;


