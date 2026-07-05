import { Platform } from 'react-native';

/**
 * AudioRecorder using expo-audio (SDK 57+).
 * Uses lazy dynamic require to avoid crash on web where native module isn't available.
 */
export class AudioRecorder {
  private recorder: any = null;

  async startRecording(): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('Native audio recording is not supported on web. Use Web Speech API instead.');
    }

    try {
      // Lazy require to avoid loading native modules on web
      const AudioModule = require('expo-audio/src/AudioModule').default;
      const { RecordingPresets } = require('expo-audio/src/RecordingConstants');
      const { createRecordingOptions } = require('expo-audio/src/utils/options');
      const { requestRecordingPermissionsAsync } = require('expo-audio');

      // 1. Request microphone permission
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Izin mikrofon ditolak. Silakan buka pengaturan aplikasi.');
      }

      // 2. Create recorder with processed platform-specific options
      const platformOptions = createRecordingOptions(RecordingPresets.HIGH_QUALITY);
      this.recorder = new AudioModule.AudioRecorder(platformOptions);

      // 3. Prepare and start recording
      await this.recorder.prepareToRecordAsync();
      this.recorder.record();
      console.log('[Audio] Recording started with expo-audio.');
    } catch (err) {
      console.error('[Audio] Failed to start recording:', err);
      this.recorder = null;
      throw err;
    }
  }

  async stopRecording(): Promise<{ uri: string; base64: string } | null> {
    if (!this.recorder) return null;

    try {
      // Stop recording
      await this.recorder.stop();
      const uri = this.recorder.uri;
      console.log('[Audio] Recording stopped. URI:', uri);

      if (!uri) {
        this.recorder = null;
        return null;
      }

      // Use the new expo-file-system File API (SDK 57+)
      const { File } = require('expo-file-system');
      const file = new File(uri);
      const bytes = await file.bytes();
      
      // Convert Uint8Array to base64
      const base64 = uint8ArrayToBase64(bytes);

      this.recorder = null;
      return { uri, base64 };
    } catch (err) {
      console.error('[Audio] Failed to stop recording:', err);
      this.recorder = null;
      throw err;
    }
  }
}

/** Convert Uint8Array to base64 string (works on all platforms) */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const audioRecorder = new AudioRecorder();
