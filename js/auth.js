const Auth = {
  async init() {
    TG.init();
    const token = localStorage.getItem('lobby_token');
    if (token) {
      try {
        API.setToken(token);
        const data = await API.getMe();
        if (data.user && data.user.name && data.user.age && data.user.gender) {
          window.location.href = 'swipe.html';
        } else {
          window.location.href = 'register.html';
        }
        return;
      } catch(e) {
        API.clearToken();
      }
    }
    try {
      const data = await API.auth(TG.initData);
      API.setToken(data.token);
      localStorage.setItem('lobby_user', JSON.stringify(data.user));
      if (data.registered && data.user.gender && data.user.age > 0 && data.user.city) {
        window.location.href = 'swipe.html';
      } else {
        window.location.href = 'register.html';
      }
    } catch(e) {
      var el = document.getElementById('loading-text');
      if (el) el.textContent = 'Ошибка подключения. Проверьте соединение.';
      console.error('[AUTH]', e);
    }
  },

  logout() {
    localStorage.clear();
    window.location.href = 'index.html';
  }
};

document.addEventListener('DOMContentLoaded', function() { Auth.init(); });
