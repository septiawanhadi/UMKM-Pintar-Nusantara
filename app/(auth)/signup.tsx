import React, { useState } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService } from '../../src/services/analytics';
import { Ionicons } from '@expo/vector-icons';
import BackgroundGlows from '../../src/components/BackgroundGlows';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignup = async () => {
    setLocalError(null);
    clearError();

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Harap isi semua kolom.');
      return;
    }

    analyticsService.trackEvent('signup_button_clicked', { name, email: email.toLowerCase() });

    if (password.length < 6) {
      setLocalError('Kata sandi harus minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Format email tidak valid.');
      return;
    }

    try {
      await signUp(email, password, name);
    } catch (err: any) {
      // Store handles the state update
    }
  };

  const navigateToLogin = () => {
    clearError();
    setLocalError(null);
    router.push('/(auth)/login');
  };

  const activeError = localError || error;

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <BackgroundGlows />
      <ScrollContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <HeaderContainer>
          <LogoIconContainer>
            <Ionicons name="rocket-sharp" size={40} color={theme.colors.primary} />
          </LogoIconContainer>
          <AppName>
            Daftar <AppNameHighlight>Akun Baru</AppNameHighlight>
          </AppName>
          <SubTitle>Gabung bersama ribuan UMKM pintar lainnya</SubTitle>
        </HeaderContainer>

        <FormContainer>
          <FormTitle>Buat Akun Anda</FormTitle>
          
          {activeError ? (
            <ErrorBox>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
              <ErrorText>{activeError}</ErrorText>
            </ErrorBox>
          ) : null}

          <InputLabel>Nama Lengkap</InputLabel>
          <InputWrapper>
            <InputIcon>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
            </InputIcon>
            <TextInput
              placeholder="Nama Toko / Nama Anda"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setLocalError(null);
                if (error) clearError();
              }}
            />
          </InputWrapper>

          <InputLabel>Alamat Email</InputLabel>
          <InputWrapper>
            <InputIcon>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
            </InputIcon>
            <TextInput
              placeholder="nama@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError(null);
                if (error) clearError();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </InputWrapper>

          <InputLabel>Kata Sandi</InputLabel>
          <InputWrapper>
            <InputIcon>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
            </InputIcon>
            <TextInput
              placeholder="Minimal 6 karakter"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError(null);
                if (error) clearError();
              }}
              autoCapitalize="none"
            />
            <PasswordToggle onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </PasswordToggle>
          </InputWrapper>

          <InputLabel>Konfirmasi Kata Sandi</InputLabel>
          <InputWrapper>
            <InputIcon>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
            </InputIcon>
            <TextInput
              placeholder="Ketik ulang kata sandi"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setLocalError(null);
                if (error) clearError();
              }}
              autoCapitalize="none"
            />
          </InputWrapper>

          <SubmitButton onPress={handleSignup} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <>
                <SubmitButtonText>Daftar</SubmitButtonText>
                <Ionicons name="arrow-forward-outline" size={18} color={theme.colors.surface} />
              </>
            )}
          </SubmitButton>

          <FooterTextContainer>
            <FooterText>Sudah punya akun? </FooterText>
            <LoginLink onPress={navigateToLogin}>
              <LoginLinkText>Masuk Saja</LoginLinkText>
            </LoginLink>
          </FooterTextContainer>
        </FormContainer>
      </ScrollContainer>
    </Container>
  );
}

// Styled Components
const Container = styled(KeyboardAvoidingView)`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const ScrollContainer = styled.ScrollView`
  flex: 1;
`;

const HeaderContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(4)}px ${theme.spacing(3)}px ${theme.spacing(1.5)}px ${theme.spacing(3)}px;
`;

const LogoIconContainer = styled.View`
  background-color: rgba(255, 107, 0, 0.12);
  border: 1.5px solid rgba(255, 107, 0, 0.25);
  width: 64px;
  height: 64px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(1.5)}px;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`;

const AppName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 24px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(0.5)}px;
  text-align: center;
`;

const AppNameHighlight = styled.Text`
  color: ${theme.colors.primary};
`;

const SubTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  max-width: 280px;
  line-height: 18px;
`;

const FormContainer = styled.View`
  background-color: ${theme.colors.cardBg};
  border: 1.5px solid ${theme.colors.border};
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding: ${theme.spacing(3)}px ${theme.spacing(3)}px;
  ${theme.glassShadow}
`;

const FormTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.h1.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(2)}px;
`;

const ErrorBox = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(229, 62, 62, 0.15);
  border: 1px solid rgba(229, 62, 62, 0.3);
  border-radius: ${theme.borderRadius.default}px;
  padding: ${theme.spacing(1.5)}px;
  margin-bottom: ${theme.spacing(2)}px;
`;

const ErrorText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.danger};
  margin-left: ${theme.spacing(1)}px;
  flex: 1;
`;

const InputLabel = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(0.5)}px;
  margin-top: ${theme.spacing(1.5)}px;
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

const InputIcon = styled.View`
  margin-right: ${theme.spacing(1.5)}px;
`;

const TextInput = styled.TextInput`
  flex: 1;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  color: ${theme.colors.textPrimary};
  height: 100%;
`;

const PasswordToggle = styled.TouchableOpacity`
  padding: ${theme.spacing(0.5)}px;
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.cta}px;
  height: 54px;
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

const SubmitButtonText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodyLarge.fontSize}px;
  font-weight: 700;
  color: #FFFFFF;
  margin-right: ${theme.spacing(1)}px;
`;

const FooterTextContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: ${theme.spacing(3)}px;
  margin-bottom: ${theme.spacing(2)}px;
`;

const FooterText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
`;

const LoginLink = styled.TouchableOpacity``;

const LoginLinkText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.primary};
`;

