import React from 'react';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export default function FinanceScreen() {
  return (
    <Container>
      <IconWrapper>
        <Ionicons name="wallet" size={56} color={theme.colors.textSecondary} />
      </IconWrapper>
      <Title>Ledger & Laporan Keuangan</Title>
      <SubTitle>
        Fitur ini akan dikembangkan pada **Fase 2**. Anda akan dapat menginput transaksi (pemasukan/pengeluaran) baik secara teks manual maupun input suara.
      </SubTitle>
      <PhaseBadge>
        <PhaseBadgeText>Fase 2: Segera Hadir</PhaseBadgeText>
      </PhaseBadge>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(3)}px;
`;

const IconWrapper = styled.View`
  background-color: #F1F3F5;
  width: 100px;
  height: 100px;
  border-radius: 50px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(3)}px;
  border: 1px solid #E2E8F0;
`;

const Title = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 22px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(1.5)}px;
  text-align: center;
`;

const SubTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  line-height: 24px;
  max-width: 300px;
  margin-bottom: ${theme.spacing(3)}px;
`;

const PhaseBadge = styled.View`
  background-color: ${theme.colors.textSecondary};
  padding-vertical: ${theme.spacing(1)}px;
  padding-horizontal: ${theme.spacing(2)}px;
  border-radius: 20px;
`;

const PhaseBadgeText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.surface};
  font-weight: 600;
`;
