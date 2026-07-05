import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  View,
  StatusBar,
  Text
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { useSalesStore, ChatMessage } from '../../src/store/salesStore';
import { useContentStore } from '../../src/store/contentStore';
import { useFinanceStore } from '../../src/store/financeStore';
import { useNetworkStore } from '../../src/store/networkStore';
import { analyticsService } from '../../src/services/analytics';
import { Ionicons } from '@expo/vector-icons';
import EditOrderModal from '../../src/components/EditOrderModal';
import TransactionModal from '../../src/components/TransactionModal';
import { audioRecorder } from '../../src/services/audioRecorder';
import { financeAiService } from '../../src/services/financeAi';
import BackgroundGlows from '../../src/components/BackgroundGlows';
import { calendarService } from '../../src/services/calendarService';

export default function SalesScreen() {
  const { 
    messages, 
    loadSalesData, 
    sendCustomerMessage, 
    confirmIntent, 
    confirmOrderOnly,
    updateExtractedOrder,
    clearChatHistory,
    isLoading 
  } = useSalesStore();

  const { products } = useContentStore();
  const { addTransaction } = useFinanceStore();

  const [inputVal, setInputVal] = useState('');
  
  // Edit Order modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeEditMsgId, setActiveEditMsgId] = useState<string | null>(null);
  const [activeEditQty, setActiveEditQty] = useState(1);
  const [activeEditVariant, setActiveEditVariant] = useState('Standard');

  // Transaction Modal (Form-First Confirmation Flow)
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txModalInitialData, setTxModalInitialData] = useState<any>(null);
  const [activeConfirmMsgId, setActiveConfirmMsgId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const activeRecognitionRef = useRef<any>(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  // Scroll to bottom on message change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    const textToSend = inputVal.trim();
    setInputVal('');
    
    analyticsService.trackEvent('send_chat_message_clicked');
    
    try {
      await sendCustomerMessage(textToSend, products);
    } catch (err: any) {
      Alert.alert('Gagal Mengirim', err.message || 'Terjadi kesalahan.');
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Info', 'Browser Anda tidak mendukung Web Speech API (Gunakan Chrome/Edge/Safari).');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      activeRecognitionRef.current = recognition;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
        Alert.alert('Input Suara Berhasil', `Kalimat direkam: "${transcript}". Silakan klik Kirim untuk menganalisis.`);
      };
      recognition.onerror = (event: any) => {
        Alert.alert('Eror Rekaman', `Gagal merekam suara: ${event.error}`);
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
        activeRecognitionRef.current = null;
      };
      recognition.start();
    } catch (err: any) {
      Alert.alert('Eror', 'Gagal memulai perekam suara.');
    }
  };

  const handleMicPress = () => {
    if (Platform.OS === 'web') {
      if (isRecording) {
        if (activeRecognitionRef.current) activeRecognitionRef.current.stop();
        return;
      }
      Alert.alert(
        'Input Suara Chat',
        'Pilih opsi:',
        [
          { text: '🎙️ Mulai Bicara', onPress: () => startSpeechRecognition() },
          { text: 'Batal', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Dikte Obrolan Lokal',
        'Ketuk kolom obrolan di bawah, lalu tekan tombol Mikrofon pada keyboard HP Anda (Gboard/iOS dictation) untuk mendikte pesan secara gratis dan luring tanpa internet.'
      );
    }
  };

  const handleConfirmOrder = (messageId: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.extractedIntent) return;
    
    const intent = targetMsg.extractedIntent;
    const unitPrice = 120000;
    const totalAmount = (intent.quantity || 1) * unitPrice;
    
    setTxModalInitialData({
      description: `Penjualan ${intent.quantity}x ${intent.productName} (${intent.variant})`,
      amount: totalAmount,
      type: 'INCOME',
      category: 'SALES',
      source: 'TEXT',
    });
    setActiveConfirmMsgId(messageId);
    setTxModalVisible(true);
  };

  const handleConfirmFinance = (messageId: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.extractedIntent) return;
    
    const intent = targetMsg.extractedIntent;
    setTxModalInitialData({
      description: intent.description || 'Transaksi dari AI',
      amount: intent.amount || 0,
      type: intent.financeType || 'EXPENSE',
      category: 'OTHER',
      source: 'TEXT',
    });
    setActiveConfirmMsgId(messageId);
    setTxModalVisible(true);
  };

  const handleConfirmReminder = async (messageId: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.extractedIntent) return;
    
    const intent = targetMsg.extractedIntent;
    const date = intent.reminderDateISO ? new Date(intent.reminderDateISO) : new Date();
    const success = await calendarService.createReminder(intent.reminderTitle || 'Pengingat UMKM', date, intent.answer);
    
    if (success) {
      await confirmIntent(messageId);
    }
  };

  const handleTxSaveSuccess = async () => {
    if (activeConfirmMsgId) {
      try {
        await confirmIntent(activeConfirmMsgId);
      } catch (err: any) {
        Alert.alert('Eror', 'Gagal memperbarui status konfirmasi.');
      } finally {
        setActiveConfirmMsgId(null);
        setTxModalInitialData(null);
      }
    }
  };

  const triggerEditModal = (messageId: string, quantity: number, variant: string) => {
    setActiveEditMsgId(messageId);
    setActiveEditQty(quantity);
    setActiveEditVariant(variant);
    setEditModalVisible(true);
  };

  const handleSaveEdit = (quantity: number, variant: string) => {
    if (activeEditMsgId) {
      updateExtractedOrder(activeEditMsgId, quantity, variant);
    }
  };

  const { isOnline } = useNetworkStore();

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <StatusBar barStyle="light-content" />
      <BackgroundGlows />
      {!isOnline && (
        <OfflineBanner>
          <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <OfflineBannerText>Mode Offline: Menyinkronkan...</OfflineBannerText>
        </OfflineBanner>
      )}
      <ChatHeader>
        <HeaderUserInfo>
          <AvatarWrapper>
            <Ionicons name="person-circle-sharp" size={42} color={theme.colors.textSecondary} />
            <OnlineIndicator />
          </AvatarWrapper>
          <HeaderTitleWrapper>
            <HeaderTitleName>Asisten UMKM Pintar</HeaderTitleName>
            <HeaderTitleStatus>Siap Membantu • Online</HeaderTitleStatus>
          </HeaderTitleWrapper>
        </HeaderUserInfo>

        <HeaderActionRow>
          <TouchableOpacity onPress={clearChatHistory} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </HeaderActionRow>
      </ChatHeader>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(3) }}
      >
        {messages.map((msg) => {
          const isCust = msg.sender === 'CUSTOMER';
          const intent = msg.extractedIntent;
          
          return (
            <MessageGroup key={msg.id} align={isCust ? 'flex-end' : 'flex-start'}>
              <SenderLabel align={isCust ? 'flex-end' : 'flex-start'}>{isCust ? 'Anda' : 'UPN AI Assistant'}</SenderLabel>

              <ChatBubble isCustomer={isCust}>
                <BubbleText isCustomer={isCust}>{msg.text}</BubbleText>
                <Timestamp isCustomer={isCust}>{msg.timestamp}</Timestamp>
              </ChatBubble>

              {intent && (
                <OrderCard>
                  <OrderCardHeader>
                    <Ionicons 
                      name={msg.intentConfirmed ? 'checkmark-circle' : 'bulb'} 
                      size={20} 
                      color={msg.intentConfirmed ? theme.colors.secondary : theme.colors.primary} 
                    />
                    <OrderCardHeaderTitle>
                      {msg.intentConfirmed ? 'Tersimpan' : 
                        intent.type === 'ORDER' ? 'Deteksi Pesanan' : 
                        intent.type === 'FINANCE' ? 'Deteksi Keuangan' : 
                        intent.type === 'REMINDER' ? 'Deteksi Pengingat' : 'Informasi AI'}
                    </OrderCardHeaderTitle>
                  </OrderCardHeader>

                  {intent.type === 'ORDER' && (
                    <OrderDetailsWrapper>
                      <OrderDetailRow>
                        <OrderDetailLabel>Produk:</OrderDetailLabel>
                        <OrderDetailValue>{intent.productName}</OrderDetailValue>
                      </OrderDetailRow>
                      <OrderDetailRow>
                        <OrderDetailLabel>Jumlah (Qty):</OrderDetailLabel>
                        <OrderDetailValue>{intent.quantity} pcs</OrderDetailValue>
                      </OrderDetailRow>
                      <OrderDetailRow>
                        <OrderDetailLabel>Varian:</OrderDetailLabel>
                        <OrderDetailValue>{intent.variant}</OrderDetailValue>
                      </OrderDetailRow>
                    </OrderDetailsWrapper>
                  )}

                  {intent.type === 'FINANCE' && (
                    <OrderDetailsWrapper>
                      <OrderDetailRow>
                        <OrderDetailLabel>Tipe:</OrderDetailLabel>
                        <OrderDetailValue style={{ color: intent.financeType === 'INCOME' ? theme.colors.secondary : theme.colors.danger }}>
                          {intent.financeType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </OrderDetailValue>
                      </OrderDetailRow>
                      <OrderDetailRow>
                        <OrderDetailLabel>Nominal:</OrderDetailLabel>
                        <OrderDetailValue>Rp {intent.amount?.toLocaleString('id-ID')}</OrderDetailValue>
                      </OrderDetailRow>
                    </OrderDetailsWrapper>
                  )}

                  {intent.type === 'REMINDER' && (
                    <OrderDetailsWrapper>
                      <OrderDetailRow>
                        <OrderDetailLabel>Kegiatan:</OrderDetailLabel>
                        <OrderDetailValue>{intent.reminderTitle}</OrderDetailValue>
                      </OrderDetailRow>
                      <OrderDetailRow>
                        <OrderDetailLabel>Waktu:</OrderDetailLabel>
                        <OrderDetailValue>
                          {intent.reminderDateISO ? new Date(intent.reminderDateISO).toLocaleDateString('id-ID') : '-'}
                        </OrderDetailValue>
                      </OrderDetailRow>
                    </OrderDetailsWrapper>
                  )}

                  {msg.intentConfirmed ? (
                    <ConfirmedIndicator>
                      <Ionicons name="checkmark-sharp" size={16} color={theme.colors.secondary} />
                      <ConfirmedIndicatorText>Selesai Diproses</ConfirmedIndicatorText>
                    </ConfirmedIndicator>
                  ) : (
                    <OrderCardActions>
                      {intent.type === 'ORDER' && (
                        <>
                          <EditBtn onPress={() => triggerEditModal(msg.id, intent.quantity || 1, intent.variant || 'Standard')}>
                            <Ionicons name="create-outline" size={16} color={theme.colors.textSecondary} />
                            <EditBtnText>Edit</EditBtnText>
                          </EditBtn>
                          <ConfirmBtn onPress={() => handleConfirmOrder(msg.id)} disabled={isLoading}>
                            <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                            <ConfirmBtnText>Simpan Pesanan</ConfirmBtnText>
                          </ConfirmBtn>
                        </>
                      )}
                      
                      {intent.type === 'FINANCE' && (
                        <ConfirmBtn onPress={() => handleConfirmFinance(msg.id)} disabled={isLoading}>
                          <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                          <ConfirmBtnText>Simpan ke Buku Kas</ConfirmBtnText>
                        </ConfirmBtn>
                      )}

                      {intent.type === 'REMINDER' && (
                        <ConfirmBtn style={{ backgroundColor: '#3182CE' }} onPress={() => handleConfirmReminder(msg.id)} disabled={isLoading}>
                          <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                          <ConfirmBtnText>Simpan ke Kalender</ConfirmBtnText>
                        </ConfirmBtn>
                      )}
                    </OrderCardActions>
                  )}
                </OrderCard>
              )}
            </MessageGroup>
          );
        })}
        {isLoading && (
          <LoadingBubble>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </LoadingBubble>
        )}
      </ScrollView>

      <InputBar>
        <MicButton onPress={handleMicPress}>
          <Ionicons 
            name={isRecording ? 'mic' : 'mic-outline'} 
            size={24} 
            color={isRecording ? theme.colors.danger : theme.colors.primary} 
          />
        </MicButton>
        
        <InputWrapper>
          <TextInput
            placeholder="Tanya AI atau input transaksi..."
            placeholderTextColor={theme.colors.textSecondary}
            value={inputVal}
            onChangeText={setInputVal}
            onSubmitEditing={handleSend}
          />
        </InputWrapper>

        <SendButton onPress={handleSend}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </SendButton>
      </InputBar>

      <EditOrderModal
        visible={editModalVisible}
        quantity={activeEditQty}
        variant={activeEditVariant}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
      />

      <TransactionModal
        visible={txModalVisible}
        onClose={() => {
          setTxModalVisible(false);
          setActiveConfirmMsgId(null);
          setTxModalInitialData(null);
        }}
        initialData={txModalInitialData}
        onSaveSuccess={handleTxSaveSuccess}
      />
    </Container>
  );
}

const Container = styled(KeyboardAvoidingView)`
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

const ChatHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(11, 16, 29, 0.85);
  border-bottom-width: 1.5px;
  border-bottom-color: rgba(255, 255, 255, 0.12);
  padding: ${theme.spacing(1.5)}px ${theme.spacing(2)}px;
  height: 68px;
`;

const HeaderUserInfo = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AvatarWrapper = styled.View`
  position: relative;
  margin-right: ${theme.spacing(1)}px;
`;

const OnlineIndicator = styled.View`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 11px;
  height: 11px;
  border-radius: 6px;
  background-color: ${theme.colors.secondary};
  border: 1.5px solid #0B101D;
`;

const HeaderTitleWrapper = styled.View``;

const HeaderTitleName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const HeaderTitleStatus = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  color: ${theme.colors.textSecondary};
`;

const HeaderActionRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const MessageGroup = styled.View<{ align: string }>`
  align-self: ${(props) => props.align};
  align-items: ${(props) => props.align};
  margin-bottom: ${theme.spacing(2)}px;
  width: 80%;
`;

const SenderLabel = styled.Text<{ align: string }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 10px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  margin-bottom: 3px;
  margin-horizontal: 8px;
  align-self: ${(props) => props.align};
`;

const ChatBubble = styled.View<{ isCustomer: boolean }>`
  background-color: ${(props) => (props.isCustomer ? theme.colors.primary : theme.colors.cardBg)};
  border: 1.5px solid ${(props) => (props.isCustomer ? theme.colors.primary : theme.colors.border)};
  padding: ${theme.spacing(1.5)}px;
  border-radius: 16px;
  border-top-right-radius: ${(props) => (props.isCustomer ? '2px' : '16px')};
  border-top-left-radius: ${(props) => (props.isCustomer ? '16px' : '2px')};
  position: relative;
  max-width: 100%;
`;

const BubbleText = styled.Text<{ isCustomer: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => (props.isCustomer ? '#FFFFFF' : theme.colors.textPrimary)};
`;

const Timestamp = styled.Text<{ isCustomer: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 9px;
  color: ${(props) => (props.isCustomer ? 'rgba(255,255,255,0.75)' : theme.colors.textSecondary)};
  align-self: flex-end;
  margin-top: 4px;
`;

const OrderCard = styled.View`
  background-color: ${theme.colors.cardBg};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.default}px;
  padding: ${theme.spacing(2)}px;
  margin-top: ${theme.spacing(1)}px;
  width: 100%;
  ${theme.glassShadow}
`;

const OrderCardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const OrderCardHeaderTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 13px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-left: 6px;
`;

const OrderDetailsWrapper = styled.View`
  background-color: rgba(11, 16, 29, 0.4);
  border-radius: 8px;
  padding: ${theme.spacing(1)}px ${theme.spacing(1.5)}px;
  border: 1.5px solid ${theme.colors.border};
  margin-bottom: ${theme.spacing(2)}px;
`;

const OrderDetailRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-vertical: 2px;
`;

const OrderDetailLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  color: ${theme.colors.textSecondary};
`;

const OrderDetailValue = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const ConfirmedIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 229, 255, 0.12);
  height: 38px;
  border-radius: 8px;
  border: 1.5px solid rgba(0, 229, 255, 0.25);
`;

const ConfirmedIndicatorText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.secondary};
  margin-left: 6px;
`;

const OrderCardActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const EditBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 38px;
  border: 1.5px solid ${theme.colors.border};
  border-radius: 8px;
  padding-horizontal: 12px;
  background-color: rgba(255, 255, 255, 0.05);
`;

const EditBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  margin-left: 4px;
`;

const ConfirmBtn = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 38px;
  background-color: ${theme.colors.primary};
  border-radius: 8px;
  margin-left: 8px;
`;

const ConfirmBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 700;
  color: #FFFFFF;
  margin-left: 4px;
`;

const LoadingBubble = styled.View`
  align-self: flex-end;
  background-color: ${theme.colors.cardBg};
  border: 1.5px solid ${theme.colors.border};
  padding: 10px;
  border-radius: 12px;
  margin-bottom: ${theme.spacing(2)}px;
  margin-right: 8px;
`;

const InputBar = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(11, 16, 29, 0.85);
  border-top-width: 1.5px;
  border-top-color: rgba(255, 255, 255, 0.12);
  padding: ${theme.spacing(1.5)}px;
  padding-bottom: ${Platform.OS === 'ios' ? 24 : 12}px;
  margin-bottom: 82px;
`;

const MicButton = styled.TouchableOpacity`
  padding: 8px;
  margin-right: ${theme.spacing(1)}px;
`;

const InputWrapper = styled.View`
  flex: 1;
  border: 1.5px solid ${theme.colors.border};
  border-radius: 24px;
  padding-horizontal: 16px;
  height: 44px;
  background-color: ${theme.colors.inputBg};
  margin-right: ${theme.spacing(1.5)}px;
  justify-content: center;
`;

const TextInput = styled.TextInput`
  font-family: ${theme.typography.fontFamily};
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  flex: 1;
`;

const SendButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  width: 44px;
  height: 44px;
  border-radius: 22px;
  align-items: center;
  justify-content: center;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;
