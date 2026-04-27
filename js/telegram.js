const TG = {
  app: null,
  user: null,
  initData: '',

  init() {
    if (window.Telegram && window.Telegram.WebApp) {
      this.app = window.Telegram.WebApp;
      this.app.ready();
      this.app.expand();
      this.user = this.app.initDataUnsafe && this.app.initDataUnsafe.user
        ? this.app.initDataUnsafe.user : null;
      this.initData = this.app.initData || '';
      this.app.setHeaderColor('#1a1a2e');
      this.app.setBackgroundColor('#1a1a2e');
      console.log('[TG] Initialized, user:', this.user);
    } else {
      console.warn('[TG] Not in Telegram WebApp, using mock');
      this.initData = 'mock_init_data_for_development';
      this.user = { id: 123456789, first_name: 'Dev', username: 'devuser' };
    }
  },

  showAlert(msg) {
    if (this.app) this.app.showAlert(msg);
    else alert(msg);
  },

  showConfirm(msg, cb) {
    if (this.app) this.app.showConfirm(msg, cb);
    else cb(confirm(msg));
  },

  haptic(type) {
    type = type || 'light';
    try { if (this.app && this.app.HapticFeedback) this.app.HapticFeedback.impactOccurred(type); } catch(e) {}
  },

  close() { if (this.app) this.app.close(); },

  enableBackButton(cb) {
    if (!this.app) return;
    this.app.BackButton.show();
    this.app.BackButton.onClick(cb);
  },

  disableBackButton() {
    if (!this.app) return;
    this.app.BackButton.hide();
  }
};
