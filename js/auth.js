const Auth = {
  async init() {
    TG.init();
    const token = localStorage.getItem('lobby_token');
    
    if (token) {
      try {
        API.setToken(token);
        const data = await API.getMe();
        
        // Проверяем завершена ли регистрация
        const isCompleted = (
          data.user.gender && 
          data.user.age && 
          data.user.city && 
          data.user.games && 
          data.user.games.length > 0
        );
        
        if (isCompleted) {
          // Полностью зарегистрирован → в свайпы
          window.location.href = 'swipe.html';
        } else {
          // Не заполнена информация → регистрация
          window.location.href = 'register.html';
        }
        return;
      } catch(e) {
        // Токен неправильный
        API.clearToken();
      }
    }

    // Нет токена → авторизуемся
    try {
      const data = await API.auth(TG.initData);
      API.setToken(data.token);
      localStorage.setItem('lobby_user', JSON.stringify(data.user));
      
      // Проверяем завершена ли регистрация
      const isCompleted = data.completed === true;
      
      if (isCompleted) {
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