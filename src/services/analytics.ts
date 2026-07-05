export const analyticsService = {
  /**
   * Tracks an event by logging it to the console with Firebase styling.
   * Can be wired directly to firebase.analytics().logEvent in production.
   */
  trackEvent(eventName: string, params?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[Firebase Analytics] 📊 Event: "${eventName}" | Time: ${timestamp} | Params:`,
      params ? JSON.stringify(params) : '{}'
    );
  }
};
