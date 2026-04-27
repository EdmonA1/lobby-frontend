const TG = {
    app: null,
    user: null,
    initData: '',
    isMock: false,

    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.app = window.Telegram.WebApp;
            this.app.ready();
            this.app.expand();
            this.initData = this.app.initData || '';
            this.user = (this.app.initDataUnsafe && this.app.initDataUnsafe.user)
                ? this.app.initDataUnsafe.user
                : null;
            this.isMock = false;

            try { this.app.setHeaderColor('#1a1a2e'); } catch(e) {}
            try { this.app.setBackgroundColor('#1a1a2e'); } catch(e) {}

            console.log('[TG] Initialized, user:', this.user);
        } else {
            // ✅ НЕ подставляем фиктивный ID — пусть бэкенд вернёт ошибку
            console.warn('[TG] Not in Telegram WebApp');
            this.isMock = true;
            this.initData = '';
            this.user = null;
        }
    },

    // ✅ Получить пользователя
    getUser() {
        return this.user;
    },

    // ✅ Получить ID пользователя
    getUserId() {
        return this.user ? this.user.id : null;
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
        try {
            if (this.app && this.app.HapticFeedback) {
                this.app.HapticFeedback.impactOccurred(type);
            }
        } catch(e) {}
    },

    close() {
        if (this.app) this.app.close();
    },

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