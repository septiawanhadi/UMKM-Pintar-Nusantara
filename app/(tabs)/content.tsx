import React from 'react';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export default function ContentScreen() {
  return (
    <Container>
      <IconWrapper>
        <Ionicons name="sparkles" size={56} color={theme.colors.primary} />
      </IconWrapper>
      <Title>AI Content Generator</Title>
      <SubTitle>
        Fitur ini akan dikembangkan pada **Fase 3**. Anda akan dapat membuat materi promosi, deskripsi produk, dan hashtag secara otomatis dari foto produk Anda.
      </SubTitle>
      <PhaseBadge>
        <PhaseBadgeText>Fase 3: Segera Hadir</PhaseBadgeText>
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
  background-color: #FFF0E6;
  width: 100px;
  height: 100px;
  border-radius: 50px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(3)}px;
  border: 1px solid #FFE6D5;
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
  background-color: ${theme.colors.primary};
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
