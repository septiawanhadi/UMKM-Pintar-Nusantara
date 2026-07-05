import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

interface EditOrderModalProps {
  visible: boolean;
  quantity: number;
  variant: string;
  onClose: () => void;
  onSave: (quantity: number, variant: string) => void;
}

export default function EditOrderModal({ 
  visible, 
  quantity, 
  variant, 
  onClose, 
  onSave 
}: EditOrderModalProps) {
  const [inputQty, setInputQty] = useState('');
  const [inputVariant, setInputVariant] = useState('');

  // Prepopulate state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setInputQty(quantity.toString());
      setInputVariant(variant);
    }
  }, [visible, quantity, variant]);

  const handleSave = () => {
    const parsedQty = parseInt(inputQty.replace(/[^0-9]/g, ''));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Eror', 'Silakan masukkan jumlah pesanan yang valid.');
      return;
    }
    if (!inputVariant.trim()) {
      Alert.alert('Eror', 'Silakan isi varian pesanan.');
      return;
    }
    
    onSave(parsedQty, inputVariant.trim());
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Overlay>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ModalContent>
            {/* Header */}
            <Header>
              <ModalTitle>Edit Rincian Pesanan</ModalTitle>
              <CloseButton onPress={onClose}>
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </CloseButton>
            </Header>

            {/* Inputs */}
            <InputLabel>Jumlah Pesanan (Qty)</InputLabel>
            <InputWrapper>
              <Ionicons name="cart-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Jumlah"
                keyboardType="numeric"
                value={inputQty}
                onChangeText={(text) => setInputQty(text.replace(/[^0-9]/g, ''))}
              />
            </InputWrapper>

            <InputLabel>Varian (Warna / Ukuran)</InputLabel>
            <InputWrapper>
              <Ionicons name="color-palette-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Misal: Merah (L), Hijau"
                value={inputVariant}
                onChangeText={setInputVariant}
              />
            </InputWrapper>

            {/* Buttons */}
            <ButtonGroup>
              <CancelButton onPress={onClose}>
                <CancelButtonText>Batal</CancelButtonText>
              </CancelButton>
              <SaveButton onPress={handleSave}>
                <SaveButtonText>Simpan</SaveButtonText>
              </SaveButton>
            </ButtonGroup>
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
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing(3)}px;
`;

const ModalContent = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2.5)}px;
  width: 100%;
  max-width: 320px;
  ${theme.glassShadow}
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing(2.5)}px;
`;

const ModalTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const CloseButton = styled.TouchableOpacity`
  padding: 4px;
`;

const InputLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  margin-bottom: 6px;
  margin-top: ${theme.spacing(1.5)}px;
`;

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.default}px;
  padding-horizontal: ${theme.spacing(2)}px;
  height: 48px;
  background-color: ${theme.colors.inputBg};
`;

const TextInput = styled.TextInput`
  flex: 1;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  height: 100%;
`;

const ButtonGroup = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing(3)}px;
`;

const CancelButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 44px;
  border: 1.5px solid ${theme.colors.border};
  border-radius: 22px;
  margin-right: 8px;
  background-color: rgba(255, 255, 255, 0.05);
`;

const CancelButtonText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
`;

const SaveButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 44px;
  background-color: ${theme.colors.primary};
  border-radius: 22px;
`;

const SaveButtonText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 600;
  color: #FFFFFF;
`;

