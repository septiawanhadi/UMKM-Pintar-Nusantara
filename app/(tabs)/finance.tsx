import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  View,
  StatusBar
} from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/tokens';
import { useFinanceStore } from '../../src/store/financeStore';
import { useNetworkStore } from '../../src/store/networkStore';
import { Ionicons } from '@expo/vector-icons';
import TransactionModal from '../../src/components/TransactionModal';
import BackgroundGlows from '../../src/components/BackgroundGlows';
import { exportService } from '../../src/services/exportService';

type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export default function FinanceScreen() {
  const { 
    loadAllTransactions, 
    deleteTransaction, 
    getSummary, 
    isLoading 
  } = useFinanceStore();

  const { isOnline } = useNetworkStore();
  const [period, setPeriod] = useState<PeriodType>('DAILY');
  const [modalVisible, setModalVisible] = useState(false);
  const [chartTab, setChartTab] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  useEffect(() => {
    loadAllTransactions();
  }, []);

  const summary = getSummary(period);

  const handleExportPDF = async () => {
    try {
      if (summary.filteredTransactions.length === 0) {
        Alert.alert('Info', 'Tidak ada transaksi untuk diekspor.');
        return;
      }
      await exportService.exportToPDF(summary.filteredTransactions);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal mengekspor PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      if (summary.filteredTransactions.length === 0) {
        Alert.alert('Info', 'Tidak ada transaksi untuk diekspor.');
        return;
      }
      await exportService.exportToExcel(summary.filteredTransactions);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal mengekspor Excel');
    }
  };

  // Group transactions by category for the active tab (INCOME or EXPENSE)
  const transactionsForTab = summary.filteredTransactions.filter(tx => tx.type === chartTab);
  const totalForTab = transactionsForTab.reduce((acc, tx) => acc + tx.amount, 0);
  
  // Category totals
  const categoriesList = [
    { key: 'SALES', name: 'Penjualan', amount: 0, percentage: 0, color: theme.colors.secondary },
    { key: 'RAW_MATERIAL', name: 'Bahan Baku', amount: 0, percentage: 0, color: theme.colors.primary },
    { key: 'SHIPPING', name: 'Ongkir / Pengiriman', amount: 0, percentage: 0, color: '#3182CE' },
    { key: 'OTHER', name: 'Lain-lain', amount: 0, percentage: 0, color: '#94A3B8' }
  ];

  transactionsForTab.forEach(tx => {
    const cat = categoriesList.find(c => c.key === tx.category);
    if (cat) cat.amount += tx.amount;
  });

  categoriesList.forEach(cat => {
    cat.percentage = totalForTab > 0 ? Math.round((cat.amount / totalForTab) * 100) : 0;
  });

  // Sort by amount descending
  const sortedCategories = [...categoriesList].sort((a, b) => b.amount - a.amount);

  const getLocalAiRecommendation = () => {
    if (totalForTab === 0) {
      return 'Belum ada data transaksi dicatat dalam periode ini untuk dianalisis oleh AI.';
    }

    if (chartTab === 'EXPENSE') {
      const highestExpense = sortedCategories[0];
      if (highestExpense.amount === 0) return 'Pengeluaran terkontrol dengan sangat baik.';

      if (highestExpense.key === 'RAW_MATERIAL') {
        return `💡 AI Insights: Pengeluaran didominasi oleh Bahan Baku (${highestExpense.percentage}%). Cobalah bernegosiasi dengan supplier untuk opsi grosir (bulk) demi menghemat modal usaha.`;
      } else if (highestExpense.key === 'SHIPPING') {
        return `💡 AI Insights: Biaya logistik/ongkir menyumbang ${highestExpense.percentage}% dari pengeluaran. Pertimbangkan untuk menyatukan jadwal kirim atau meninjau tarif kurir alternatif.`;
      } else if (highestExpense.key === 'OTHER') {
        return `💡 AI Insights: Pengeluaran Lain-lain mendominasi (${highestExpense.percentage}%). Pastikan pengeluaran tak terduga terdokumentasi rapi agar arus kas tetap efisien.`;
      }
    } else {
      const salesCategory = categoriesList.find(c => c.key === 'SALES');
      if (salesCategory && salesCategory.amount > 0) {
        return `💡 AI Insights: Penjualan adalah motor utama pemasukan Anda (${salesCategory.percentage}%). Manfaatkan terus fitur Copywriter AI di menu Konten untuk mempromosikan produk unggulan!`;
      }
    }
    return 'Struktur kas keuangan usaha Anda seimbang dan stabil.';
  };

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Hapus Transaksi',
      `Apakah Anda yakin ingin menghapus transaksi "${description}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch (err: any) {
              Alert.alert('Gagal Menghapus', err.message || 'Terjadi kesalahan.');
            }
          }
        }
      ]
    );
  };

  // Icon mapping for categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SALES':
        return { name: 'cash-outline', color: theme.colors.secondary, bg: 'rgba(0, 229, 255, 0.12)' };
      case 'RAW_MATERIAL':
        return { name: 'construct-outline', color: theme.colors.primary, bg: 'rgba(255, 107, 0, 0.12)' };
      case 'SHIPPING':
        return { name: 'bicycle-outline', color: '#3182CE', bg: 'rgba(49, 130, 206, 0.12)' };
      default:
        return { name: 'ellipsis-horizontal-outline', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' };
    }
  };

  // Source badges styling
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'VOICE':
        return 'mic';
      case 'OCR':
        return 'scan';
      default:
        return 'text';
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
      {/* Top Segmented Tabs */}
      <PeriodTabContainer>
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as PeriodType[]).map((p) => (
          <PeriodTabButton 
            key={p} 
            active={period === p} 
            onPress={() => setPeriod(p)}
          >
            <PeriodTabText active={period === p}>
              {p === 'DAILY' ? 'Harian' : p === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}
            </PeriodTabText>
          </PeriodTabButton>
        ))}
      </PeriodTabContainer>

      <ScrollView contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: 100 }}>
        {/* Summary Dashboard Card */}
        <SummaryCard>
          <ProfitContainer>
            <ProfitLabel>Profit Bersih ({period === 'DAILY' ? 'Hari Ini' : period === 'WEEKLY' ? '7 Hari Terakhir' : 'Bulan Ini'})</ProfitLabel>
            <ProfitValue isPositive={summary.netProfit >= 0}>
              {summary.netProfit >= 0 ? '+' : ''}{formatRupiah(summary.netProfit)}
            </ProfitValue>
          </ProfitContainer>

          <Divider />

          <FlowRow>
            <FlowCol>
              <FlowHeader>
                <Ionicons name="arrow-up-circle-sharp" size={18} color={theme.colors.secondary} />
                <FlowLabel>Pemasukan</FlowLabel>
              </FlowHeader>
              <FlowValue color={theme.colors.secondary}>
                {formatRupiah(summary.income)}
              </FlowValue>
            </FlowCol>

            <FlowCol>
              <FlowHeader>
                <Ionicons name="arrow-down-circle-sharp" size={18} color={theme.colors.danger} />
                <FlowLabel>Pengeluaran</FlowLabel>
              </FlowHeader>
              <FlowValue color={theme.colors.danger}>
                {formatRupiah(summary.expense)}
              </FlowValue>
            </FlowCol>
          </FlowRow>
        </SummaryCard>

        {/* Glassmorphic Category Chart & Insights */}
        <ChartContainer>
          <ChartHeaderRow>
            <ChartTitleText>Laporan Visual Kategori</ChartTitleText>
            <ChartTabSelector>
              <ChartTabButton 
                active={chartTab === 'INCOME'} 
                onPress={() => setChartTab('INCOME')}
              >
                <ChartTabText active={chartTab === 'INCOME'}>Masuk</ChartTabText>
              </ChartTabButton>
              <ChartTabButton 
                active={chartTab === 'EXPENSE'} 
                onPress={() => setChartTab('EXPENSE')}
              >
                <ChartTabText active={chartTab === 'EXPENSE'}>Keluar</ChartTabText>
              </ChartTabButton>
            </ChartTabSelector>
          </ChartHeaderRow>

          {totalForTab === 0 ? (
            <NoChartData>
              <Ionicons name="pie-chart-outline" size={32} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
              <NoChartDataText>Tidak ada data visual dalam periode ini</NoChartDataText>
            </NoChartData>
          ) : (
            <ChartContentWrapper>
              {sortedCategories.map((cat) => {
                if (cat.amount === 0) return null;
                return (
                  <CategoryProgressRow key={cat.key}>
                    <CategoryInfoTextRow>
                      <CategoryNameText>{cat.name}</CategoryNameText>
                      <CategoryPercentageRow>
                        <CategoryAmountText>{formatRupiah(cat.amount)}</CategoryAmountText>
                        <CategoryPercentText color={cat.color}>{cat.percentage}%</CategoryPercentText>
                      </CategoryPercentageRow>
                    </CategoryInfoTextRow>
                    <ProgressBarBg>
                      <ProgressBarFill color={cat.color} width={cat.percentage} />
                    </ProgressBarBg>
                  </CategoryProgressRow>
                );
              })}

              <Divider style={{ marginVertical: theme.spacing(1.5) }} />

              <AiInsightsBox>
                <Ionicons name="sparkles" size={16} color={theme.colors.secondary} style={{ marginRight: 6, marginTop: 1 }} />
                <AiInsightsText>{getLocalAiRecommendation()}</AiInsightsText>
              </AiInsightsBox>
            </ChartContentWrapper>
          )}
        </ChartContainer>

        {/* Transaction Section Title */}
        <SectionHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SectionTitle>Daftar Catatan</SectionTitle>
            <CountBadge style={{ marginLeft: 8 }}>
              <CountBadgeText>{summary.filteredTransactions.length} Transaksi</CountBadgeText>
            </CountBadge>
          </View>
          <ExportActionRow>
            <ExportBtn onPress={handleExportExcel}>
              <Ionicons name="document-text-outline" size={14} color="#FFF" />
              <ExportBtnText>Excel</ExportBtnText>
            </ExportBtn>
            <ExportBtn onPress={handleExportPDF} style={{ marginLeft: 6 }}>
              <Ionicons name="print-outline" size={14} color="#FFF" />
              <ExportBtnText>PDF</ExportBtnText>
            </ExportBtn>
          </ExportActionRow>
        </SectionHeader>

        {/* List Loading State */}
        {isLoading && summary.filteredTransactions.length === 0 ? (
          <LoadingWrapper>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </LoadingWrapper>
        ) : summary.filteredTransactions.length === 0 ? (
          /* Empty state */
          <EmptyWrapper>
            <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
            <EmptyTitle>Belum ada transaksi</EmptyTitle>
            <EmptySub>
              Transaksi {period === 'DAILY' ? 'hari ini' : period === 'WEEKLY' ? 'seminggu terakhir' : 'bulan ini'} akan muncul di sini setelah dicatat.
            </EmptySub>
          </EmptyWrapper>
        ) : (
          /* Transaction Items */
          <TransactionsWrapper>
            {summary.filteredTransactions.map((tx) => {
              const meta = getCategoryIcon(tx.category);
              const sourceIcon = getSourceIcon(tx.source);
              return (
                <TransactionItem key={tx.id}>
                  <CategoryIconWrapper bg={meta.bg}>
                    <Ionicons name={meta.name as any} size={22} color={meta.color} />
                  </CategoryIconWrapper>

                  <TxDetails>
                    <TxTitle>{tx.description}</TxTitle>
                    <TxMetaRow>
                      <TxDate>{formatDate(tx.date)}</TxDate>
                      <SourceBadge>
                        <Ionicons name={sourceIcon as any} size={10} color={theme.colors.textSecondary} style={{ marginRight: 2 }} />
                        <SourceBadgeText>{tx.source}</SourceBadgeText>
                      </SourceBadge>
                    </TxMetaRow>
                  </TxDetails>

                  <TxActionRow>
                    <TxAmount isIncome={tx.type === 'INCOME'}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </TxAmount>
                    <DeleteBtn onPress={() => handleDelete(tx.id, tx.description)}>
                      <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                    </DeleteBtn>
                  </TxActionRow>
                </TransactionItem>
              );
            })}
          </TransactionsWrapper>
        )}
      </ScrollView>

      {/* Floating Add Transaction Button */}
      <FabButton onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <FabText>Tambah</FabText>
      </FabButton>

      {/* Input Modal */}
      <TransactionModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
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

const PeriodTabContainer = styled.View`
  flex-direction: row;
  background-color: rgba(11, 16, 29, 0.7);
  padding: 6px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
`;

const PeriodTabButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 38px;
  border-radius: 19px;
  background-color: ${(props) => (props.active ? theme.colors.primary : 'transparent')};
`;

const PeriodTabText = styled.Text<{ active: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#FFFFFF' : theme.colors.textSecondary)};
`;

const SummaryCard = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2.5)}px;
  ${theme.glassShadow}
  margin-bottom: ${theme.spacing(1)}px;
`;

const ProfitContainer = styled.View`
  align-items: center;
`;

const ProfitLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProfitValue = styled.Text<{ isPositive: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 26px;
  font-weight: 800;
  color: ${(props) => (props.isPositive ? theme.colors.secondary : theme.colors.danger)};
  margin-top: 6px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.08);
  margin-vertical: ${theme.spacing(2)}px;
`;

const FlowRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const FlowCol = styled.View`
  width: 48%;
`;

const FlowHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

const FlowLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.textSecondary};
  margin-left: 6px;
`;

const FlowValue = styled.Text<{ color: string }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${(props) => props.color};
  padding-left: 24px;
`;

const SectionHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${theme.spacing(3)}px;
  margin-bottom: ${theme.spacing(1.5)}px;
`;

const ExportActionRow = styled.View`
  flex-direction: row;
`;

const ExportBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ExportBtnText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
  margin-left: 4px;
`;

const SectionTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const CountBadge = styled.View`
  background-color: rgba(255, 255, 255, 0.08);
  padding-vertical: 2px;
  padding-horizontal: 8px;
  border-radius: 12px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const CountBadgeText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
`;

const LoadingWrapper = styled.View`
  padding: ${theme.spacing(5)}px;
  align-items: center;
`;

const EmptyWrapper = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(5)}px;
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px dashed ${theme.colors.border};
  margin-top: ${theme.spacing(1)}px;
`;

const EmptyTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-top: ${theme.spacing(2)}px;
  margin-bottom: 4px;
`;

const EmptySub = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  max-width: 250px;
  line-height: 18px;
`;

const TransactionsWrapper = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  overflow: hidden;
  ${theme.glassShadow}
`;

const TransactionItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing(2)}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
`;

const CategoryIconWrapper = styled.View<{ bg: string }>`
  background-color: ${(props) => props.bg};
  width: 40px;
  height: 40px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing(2)}px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const TxDetails = styled.View`
  flex: 1;
`;

const TxTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 2px;
`;

const TxMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TxDate = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-right: 8px;
`;

const SourceBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  padding-horizontal: 6px;
  padding-vertical: 1px;
  border-radius: 4px;
  border: 0.5px solid rgba(255, 255, 255, 0.15);
`;

const SourceBadgeText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 9px;
  font-weight: 700;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const TxActionRow = styled.View`
  align-items: flex-end;
  justify-content: center;
`;

const TxAmount = styled.Text<{ isIncome: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 15px;
  font-weight: 700;
  color: ${(props) => (props.isIncome ? theme.colors.secondary : theme.colors.danger)};
  margin-bottom: 4px;
`;

const DeleteBtn = styled.TouchableOpacity`
  padding: 4px;
`;

const FabButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 96px;
  right: 24px;
  background-color: ${theme.colors.primary};
  padding-horizontal: ${theme.spacing(2.5)}px;
  height: 52px;
  border-radius: 26px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 8;
`;

const FabText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 700;
  color: #FFFFFF;
  margin-left: 6px;
`;

const ChartContainer = styled.View`
  background-color: ${theme.colors.cardBg};
  border-radius: ${theme.borderRadius.default}px;
  border: 1.5px solid ${theme.colors.border};
  padding: ${theme.spacing(2)}px;
  margin-top: ${theme.spacing(2)}px;
  margin-bottom: ${theme.spacing(1)}px;
  overflow: hidden;
  ${theme.glassShadow}
`;

const ChartHeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing(2)}px;
`;

const ChartTitleText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const ChartTabSelector = styled.View`
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 2px;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
`;

const ChartTabButton = styled.TouchableOpacity<{ active: boolean }>`
  padding-horizontal: 10px;
  padding-vertical: 4px;
  background-color: ${(props) => (props.active ? 'rgba(255, 255, 255, 0.12)' : 'transparent')};
  border-radius: 6px;
`;

const ChartTabText = styled.Text<{ active: boolean }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  font-weight: 700;
  color: ${(props) => (props.active ? theme.colors.textPrimary : theme.colors.textSecondary)};
`;

const NoChartData = styled.View`
  align-items: center;
  justify-content: center;
  padding-vertical: 24px;
`;

const NoChartDataText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  text-align: center;
`;

const ChartContentWrapper = styled.View``;

const CategoryProgressRow = styled.View`
  margin-bottom: 12px;
`;

const CategoryInfoTextRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const CategoryNameText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const CategoryPercentageRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CategoryAmountText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-right: 8px;
`;

const CategoryPercentText = styled.Text<{ color: string }>`
  font-family: ${theme.typography.fontFamily};
  font-size: 12px;
  font-weight: 700;
  color: ${(props) => props.color};
`;

const ProgressBarBg = styled.View`
  height: 6px;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ color: string; width: number }>`
  height: 100%;
  background-color: ${(props) => props.color};
  width: ${(props) => props.width}%;
  border-radius: 3px;
`;

const AiInsightsBox = styled.View`
  flex-direction: row;
  background-color: rgba(0, 229, 255, 0.06);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 229, 255, 0.15);
`;

const AiInsightsText = styled.Text`
  flex: 1;
  font-family: ${theme.typography.fontFamily};
  font-size: 11px;
  line-height: 15px;
  color: ${theme.colors.textPrimary};
`;

