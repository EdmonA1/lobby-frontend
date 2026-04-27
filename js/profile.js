var Profile = {
  user: null,
  editMode: false,

  init: async function() {
    TG.init();
    var token = localStorage.getItem('lobby_token');
    if (!token) { window.location.href = 'index.html'; return; }
    API.setToken(token);
    TG.enableBackButton(function() { window.location.href = 'swipe.html'; });
    await this.loadProfile();
    this.bindEvents();
  },

  loadProfile: async function() {
    try {
      var data = await API.getMe();
      this.user = data.user;
      this.renderProfile();
    } catch(e) {
      console.error('[PROFILE]', e);
    }
  },

  renderProfile: function() {
    var u = this.user;
    if (!u) return;
    this.setText('prof-name', u.name + ', ' + u.age);
    this.setText('prof-city', '📍 ' + (u.city || 'Не указан'));
    this.setText('prof-bio', u.bio || 'Добавьте описание...');
    this.setText('prof-discord', u.discord || 'Не указан');
    this.setText('prof-games', (u.games || []).join(', ') || 'Не выбраны');
    var photo = document.getElementById('prof-photo');
    if (photo) {
      var src = (u.photos && u.photos[0]) ? u.photos[0] : 'assets/placeholder.png';
      photo.style.backgroundImage = "url('" + src + "')";
    }
    var lookingMap = { teammate: '🎮 Тиммейт', chat: '💬 Общение', relationship: '❤️ Отношения', friend: '👥 Друзья' };
    var lookingEl = document.getElementById('prof-looking');
    if (lookingEl) {
      lookingEl.textContent = (u.looking_for || []).map(function(l) { return lookingMap[l] || l; }).join(', ') || 'Не указано';
    }
    var badge = document.getElementById('prof-premium');
    if (badge) badge.style.display = u.premium ? 'inline-flex' : 'none';
    this.fillEditForm();
  },

  fillEditForm: function() {
    var u = this.user;
    var setVal = function(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
    setVal('edit-name', u.name);
    setVal('edit-age',  u.age);
    setVal('edit-city', u.city);
    setVal('edit-bio',  u.bio);
    setVal('edit-discord', u.discord);
    document.querySelectorAll('.edit-gender-btn').forEach(function(btn) {
      btn.classList.toggle('selected', btn.dataset.value === u.gender);
    });
    document.querySelectorAll('.edit-game-chip').forEach(function(chip) {
      chip.classList.toggle('selected', (u.games || []).indexOf(chip.dataset.game) !== -1);
    });
    document.querySelectorAll('.edit-looking-check').forEach(function(cb) {
      cb.checked = (u.looking_for || []).indexOf(cb.value) !== -1;
    });
  },

  setText: function(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  bindEvents: function() {
    var self = this;
    var editBtn   = document.getElementById('edit-btn');
    var cancelBtn = document.getElementById('cancel-edit-btn');
    var saveBtn   = document.getElementById('save-btn');
    if (editBtn)   editBtn.addEventListener('click',   function() { self.toggleEdit(true); });
    if (cancelBtn) cancelBtn.addEventListener('click', function() { self.toggleEdit(false); });
    if (saveBtn)   saveBtn.addEventListener('click',   function() { self.save(); });
    document.querySelectorAll('.edit-gender-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.edit-gender-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });
    document.querySelectorAll('.edit-game-chip').forEach(function(chip) {
      chip.addEventListener('click', function() { chip.classList.toggle('selected'); });
    });
  },

  toggleEdit: function(show) {
    this.editMode = show;
    var view = document.getElementById('view-mode');
    var edit = document.getElementById('edit-mode');
    if (view) view.classList.toggle('hidden', show);
    if (edit) edit.classList.toggle('hidden', !show);
    if (show) TG.haptic('light');
  },

  save: async function() {
    var nameEl = document.getElementById('edit-name');
    var ageEl  = document.getElementById('edit-age');
    var cityEl = document.getElementById('edit-city');
    var name = nameEl ? nameEl.value.trim() : '';
    var age  = ageEl  ? parseInt(ageEl.value) : 0;
    var city = cityEl ? cityEl.value.trim() : '';
    if (!name || !city || !age) { TG.showAlert('Заполните все обязательные поля'); return; }
    var genderBtn = document.querySelector('.edit-gender-btn.selected');
    var gender = genderBtn ? genderBtn.dataset.value : (this.user.gender || '');
    var games = Array.from(document.querySelectorAll('.edit-game-chip.selected')).map(function(el) { return el.dataset.game; });
    var looking_for = Array.from(document.querySelectorAll('.edit-looking-check:checked')).map(function(el) { return el.value; });
    var bioEl = document.getElementById('edit-bio');
    var discordEl = document.getElementById('edit-discord');
    var bio     = bioEl     ? bioEl.value.trim()     : '';
    var discord = discordEl ? discordEl.value.trim() : '';
    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) { saveBtn.textContent = 'Сохранение...'; saveBtn.disabled = true; }
    try {
      var res = await API.updateMe({ name: name, age: age, city: city, gender: gender, games: games, looking_for: looking_for, bio: bio, discord: discord });
      this.user = res.user;
      this.renderProfile();
      this.toggleEdit(false);
      TG.haptic('success');
    } catch(e) {
      TG.showAlert('Ошибка: ' + e.message);
    } finally {
      if (saveBtn) { saveBtn.textContent = 'Сохранить'; saveBtn.disabled = false; }
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Profile.init();
  CONFIG.GAMES_LIST.forEach(function(game) {
    var chip = document.createElement('div');
    chip.className = 'edit-game-chip game-chip';
    chip.dataset.game = game;
    chip.textContent = game;
    chip.addEventListener('click', function() { chip.classList.toggle('selected'); });
    var gc = document.getElementById('edit-games-container');
    if (gc) gc.appendChild(chip);
  });
});
