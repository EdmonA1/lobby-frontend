const Auth = {
    async init() {
        // ✅ Сначала инициализируем TG
        TG.init();
        // ✅ Потом API (чтобы взял правильный токен)
        API.init();

        this.showLoader('Подключение...');

        // ✅ Проверяем — открыто в Telegram?
        if (TG.isMock) {
            this.showError('Открывайте приложение через Telegram бота @lobby_mind_bot');
            return;
        }

        // ✅ Есть токен — пробуем войти
        if (API.token) {
            try {
                this.showLoader('Загрузка профиля...');
                const data = await API.getMe();

                if (data.profile_complete) {
                    window.location.href = 'swipe.html';
                } else {
                    window.location.href = 'register.html';
                }
                return;
            } catch(e) {
                // Токен протух — чистим
                console.warn('[AUTH] Token invalid, re-auth');
                API.clearToken();
            }
        }

        // ✅ Авторизация через Telegram initData
        try {
            this.showLoader('Авторизация...');

            if (!TG.initData) {
                this.showError('Ошибка получения данных Telegram. Перезапустите бота.');
                return;
            }

            const data = await API.auth(TG.initData);

            // ✅ Сохраняем токен привязанный к Telegram ID
            API.setToken(data.token, data.user.telegram_id);

            if (data.registered) {
                window.location.href = 'swipe.html';
            } else {
                window.location.href = 'register.html';
            }

        } catch(e) {
            console.error('[AUTH]', e);
            this.showError('Ошибка подключения: ' + (e.message || 'попробуйте позже'));
        }
    },

    showLoader(text) {
        const el = document.getElementById('loading-text');
        if (el) {
            el.textContent = text;
            el.style.color = '#ffffff';
        }
    },

    showError(text) {
        const el = document.getElementById('loading-text');
        if (el) {
            el.textContent = text;
            el.style.color = '#ff6b6b';
        }
    },

    logout() {
        API.clearToken();
        localStorage.removeItem('lobby_user_id');
        window.location.href = 'index.html';
    }
};

document.addEventListener('DOMContentLoaded', function() { Auth.init(); });