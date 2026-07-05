import * as Calendar from 'expo-calendar/legacy';
import { Alert } from 'react-native';

export const calendarService = {
  createReminder: async (title: string, date: Date, notes?: string) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin untuk mengakses kalender.');
        return false;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      // Try to find default calendar or primary
      const defaultCalendar = calendars.find(c => c.isPrimary || (c.name && c.name.toLowerCase().includes('default'))) || calendars[0];
      
      if (!defaultCalendar) {
        Alert.alert('Error', 'Tidak ada kalender yang tersedia di perangkat.');
        return false;
      }

      const endDate = new Date(date.getTime() + 60 * 60 * 1000); // +1 hour

      await Calendar.createEventAsync(defaultCalendar.id, {
        title,
        startDate: date,
        endDate: endDate,
        notes: notes || 'Dibuat secara otomatis dari asisten AI UMKM Pintar Nusantara',
        alarms: [{ relativeOffset: -30 }] // 30 minutes before
      });

      Alert.alert('Sukses', 'Pengingat berhasil ditambahkan ke kalender Anda (H-30 mnt).');
      return true;
    } catch (error: any) {
      console.error('[CalendarService] Error:', error);
      Alert.alert('Error', 'Gagal membuat pengingat kalender.');
      return false;
    }
  }
};
