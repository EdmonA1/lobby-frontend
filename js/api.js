const API = {
  token: localStorage.getItem('lobby_token') || '',

  setToken(t) {
    this.token = t;
    localStorage.setItem('lobby_token', t);
  },

  clearToken() {
    this.token = '';
    localStorage.removeItem('lobby_token');
  },

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const opts = { method: method, headers: headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(CONFIG.API_URL + path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'HTTP ' + res.status);
      return data;
    } catch(e) {
      console.error('[API] ' + method + ' ' + path, e);
      throw e;
    }
  },

  get(p)    { return API.request('GET',   p, null); },
  post(p,b) { return API.request('POST',  p, b);    },
  patch(p,b){ return API.request('PATCH', p, b);    },

  auth(initData)   { return API.post('/auth/telegram', { initData: initData }); },
  getMe()          { return API.get('/users/me'); },
  updateMe(data)   { return API.patch('/users/me', data); },
  getSwipeUsers()  { return API.get('/users/swipe'); },
  like(to_user)    { return API.post('/swipe/like', { to_user: to_user }); },
  skip(to_user)    { return API.post('/swipe/skip', { to_user: to_user }); },
  getMatches()     { return API.get('/matches'); }
};
