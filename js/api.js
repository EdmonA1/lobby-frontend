const API = {
    token: '',
    tokenKey: 'lobby_token',

    // ✅ Вызывать после TG.init() чтобы знать ID
    init() {
        const userId = localStorage.getItem('lobby_user_id');
        if (userId) {
            this.tokenKey = 'lobby_token_' + userId;
        } else {
            this.tokenKey = 'lobby_token';
        }
        this.token = localStorage.getItem(this.tokenKey) || '';
    },

    setToken(t, userId) {
        this.token = t;
        if (userId) {
            this.tokenKey = 'lobby_token_' + userId;
            localStorage.setItem('lobby_user_id', String(userId));
        }
        localStorage.setItem(this.tokenKey, t);
    },

    clearToken() {
        this.token = '';
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('lobby_token');
    },

    async request(method, path, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = 'Bearer ' + this.token;

        const opts = { method: method, headers: headers };
        if (body) opts.body = JSON.stringify(body);

        // ✅ Таймаут 15 секунд
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        opts.signal = controller.signal;

        try {
            const res = await fetch(CONFIG.API_URL + path, opts);
            clearTimeout(timer);

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'HTTP ' + res.status);
            return data;

        } catch(e) {
            clearTimeout(timer);
            if (e.name === 'AbortError') {
                throw new Error('Сервер не отвечает. Попробуйте позже.');
            }
            console.error('[API] ' + method + ' ' + path, e);
            throw e;
        }
    },

    get(p)      { return this.request('GET',   p, null); },
    post(p, b)  { return this.request('POST',  p, b);    },
    patch(p, b) { return this.request('PATCH', p, b);    },

    auth(initData)  { return this.post('/auth/telegram', { initData: initData }); },
    getMe()         { return this.get('/users/me'); },
    updateMe(data)  { return this.patch('/users/me', data); },
    getSwipeUsers() { return this.get('/users/swipe'); },
    like(to_user)   { return this.post('/swipe/like', { to_user: to_user }); },
    skip(to_user)   { return this.post('/swipe/skip', { to_user: to_user }); },
    getMatches()    { return this.get('/matches'); }
};