import React, { useState } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eror', 'Harap isi semua kolom.');
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      // Error handled by store, but we can capture if needed
    }
  };

  const navigateToSignup = () => {
    clearError();
    router.push('/(auth)/signup');
  };

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollContainer contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <HeaderContainer>
          <LogoIconContainer>
            <Ionicons name="rocket-sharp" size={40} color={theme.colors.surface} />
          </LogoIconContainer>
          <AppName>
            UMKM Pintar <AppNameHighlight>Nusantara</AppNameHighlight>
          </AppName>
          <SubTitle>Mulai kelola bisnis Anda dengan kecerdasan AI</SubTitle>
        </HeaderContainer>

        <FormContainer>
          <FormTitle>Masuk Ke Akun</FormTitle>
          
          {error ? (
            <ErrorBox>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
              <ErrorText>{error}</ErrorText>
            </ErrorBox>
          ) : null}

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
              placeholder="Masukkan kata sandi"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
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

          <ForgotPasswordLink>
            <ForgotPasswordText>Lupa Kata Sandi?</ForgotPasswordText>
          </ForgotPasswordLink>

          <SubmitButton onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <>
                <SubmitButtonText>Masuk</SubmitButtonText>
                <Ionicons name="arrow-forward-outline" size={18} color={theme.colors.surface} />
              </>
            )}
          </SubmitButton>

          <FooterTextContainer>
            <FooterText>Belum punya akun? </FooterText>
            <SignupLink onPress={navigateToSignup}>
              <SignupLinkText>Daftar Sekarang</SignupLinkText>
            </SignupLink>
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
  padding: ${theme.spacing(5)}px ${theme.spacing(3)}px ${theme.spacing(2)}px ${theme.spacing(3)}px;
`;

const LogoIconContainer = styled.View`
  background-color: ${theme.colors.primary};
  width: 72px;
  height: 72px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing(2)}px;
  shadow-color: ${theme.colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`;

const AppName = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: 26px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(1)}px;
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
  line-height: 20px;
`;

const FormContainer = styled.View`
  background-color: ${theme.colors.surface};
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding: ${theme.spacing(4)}px ${theme.spacing(3)}px;
  flex: 1;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  elevation: 8;
`;

const FormTitle = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.h1.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing(3)}px;
`;

const ErrorBox = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #FFF5F5;
  border: 1px solid #FED7D7;
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
  margin-bottom: ${theme.spacing(1)}px;
  margin-top: ${theme.spacing(2)}px;
`;

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.default}px;
  padding-horizontal: ${theme.spacing(2)}px;
  height: 52px;
  background-color: ${theme.colors.background};
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

const ForgotPasswordLink = styled.TouchableOpacity`
  align-self: flex-end;
  margin-top: ${theme.spacing(1.5)}px;
  margin-bottom: ${theme.spacing(3)}px;
`;

const ForgotPasswordText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.caption.fontSize}px;
  font-weight: 600;
  color: ${theme.colors.primary};
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.cta}px;
  height: 54px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
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
  color: ${theme.colors.surface};
  margin-right: ${theme.spacing(1)}px;
`;

const FooterTextContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: ${theme.spacing(4)}px;
  margin-bottom: ${theme.spacing(2)}px;
`;

const FooterText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  color: ${theme.colors.textSecondary};
`;

const SignupLink = styled.TouchableOpacity``;

const SignupLinkText = styled.Text`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.bodySmall.fontSize}px;
  font-weight: 700;
  color: ${theme.colors.primary};
`;
