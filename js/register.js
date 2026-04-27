var Register = {
  step: 1,
  totalSteps: 10,
  data: {},
  selectedGames: new Set(),

  init: function() {
    TG.init();
    var token = localStorage.getItem('lobby_token');
    if (!token) { window.location.href = 'index.html'; return; }
    API.setToken(token);
    this.showStep(1);
    this.bindEvents();
  },

  bindEvents: function() {
    var self = this;
    var nextBtn = document.getElementById('btn-next');
    var backBtn = document.getElementById('btn-back');
    if (nextBtn) nextBtn.addEventListener('click', function() { self.nextStep(); });
    if (backBtn) backBtn.addEventListener('click', function() { self.prevStep(); });
  },

  showStep: function(n) {
    document.querySelectorAll('.reg-step').forEach(function(el) { el.classList.remove('active'); });
    var el = document.getElementById('step-' + n);
    if (el) el.classList.add('active');
    this.updateProgress();
    this.step = n;
    var backBtn = document.getElementById('btn-back');
    if (backBtn) backBtn.style.display = n > 1 ? 'flex' : 'none';
  },

  updateProgress: function() {
    var pct = ((this.step - 1) / (this.totalSteps - 1)) * 100;
    var bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = pct + '%';
    var txt = document.getElementById('step-counter');
    if (txt) txt.textContent = this.step + ' / ' + this.totalSteps;
  },

  validate: function() {
    switch(this.step) {
      case 1: {
        var v = document.getElementById('input-name');
        var val = v ? v.value.trim() : '';
        if (!val || val.length < 2) { this.shake(); return false; }
        this.data.name = val; return true;
      }
      case 2: {
        var v = document.getElementById('input-age');
        var val = v ? parseInt(v.value) : 0;
        if (!val || val < 18 || val > 60) { this.shake(); return false; }
        this.data.age = val; return true;
      }
      case 3: {
        var btn = document.querySelector('.gender-btn.selected');
        var val = btn ? btn.dataset.value : '';
        if (!val) { this.shake(); return false; }
        this.data.gender = val; return true;
      }
      case 4: {
        var v = document.getElementById('input-city');
        var val = v ? v.value.trim() : '';
        if (!val) { this.shake(); return false; }
        this.data.city = val; return true;
      }
      case 5: {
        if (this.selectedGames.size === 0) { this.shake(); return false; }
        this.data.games = Array.from(this.selectedGames); return true;
      }
      case 6: { this.data.photos = []; return true; }
      case 7: {
        var v = document.getElementById('input-bio');
        this.data.bio = v ? v.value.trim() : ''; return true;
      }
      case 8: {
        var v = document.getElementById('input-discord');
        this.data.discord = v ? v.value.trim() : ''; return true;
      }
      case 9: {
        var checked = document.querySelectorAll('.looking-check:checked');
        this.data.looking_for = Array.from(checked).map(function(el) { return el.value; });
        return true;
      }
      case 10: {
        var fg = document.querySelector('.filter-gender-btn.selected');
        var amin = document.getElementById('filter-age-min');
        var amax = document.getElementById('filter-age-max');
        this.data.filter_gender = fg ? fg.dataset.value : 'any';
        this.data.filter_age_min = amin ? (parseInt(amin.value) || 18) : 18;
        this.data.filter_age_max = amax ? (parseInt(amax.value) || 60) : 60;
        return true;
      }
    }
    return true;
  },

  shake: function() {
    TG.haptic('error');
    var form = document.querySelector('.reg-step.active');
    if (form) {
      form.classList.add('shake');
      setTimeout(function() { form.classList.remove('shake'); }, 500);
    }
  },

  nextStep: async function() {
    if (!this.validate()) return;
    TG.haptic('light');
    if (this.step < this.totalSteps) {
      this.showStep(this.step + 1);
    } else {
      await this.submit();
    }
  },

  prevStep: function() {
    if (this.step > 1) {
      TG.haptic('light');
      this.showStep(this.step - 1);
    }
  },

  toggleGame: function(name) {
    if (this.selectedGames.has(name)) {
      this.selectedGames.delete(name);
    } else {
      this.selectedGames.add(name);
    }
    var self = this;
    document.querySelectorAll('.game-chip').forEach(function(el) {
      if (el.dataset.game === name) {
        el.classList.toggle('selected', self.selectedGames.has(name));
      }
    });
  },

  submit: async function() {
    var btn = document.getElementById('btn-next');
    if (btn) { btn.textContent = 'Сохраняем...'; btn.disabled = true; }
    try {
      await API.updateMe(this.data);
      TG.haptic('success');
      window.location.href = 'swipe.html';
    } catch(e) {
      TG.showAlert('Ошибка сохранения: ' + e.message);
      if (btn) { btn.textContent = 'Готово!'; btn.disabled = false; }
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  Register.init();

  document.querySelectorAll('.gender-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gender-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    });
  });

  document.querySelectorAll('.filter-gender-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-gender-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    });
  });

  CONFIG.GAMES_LIST.forEach(function(game) {
    var chip = document.createElement('div');
    chip.className = 'game-chip';
    chip.dataset.game = game;
    chip.textContent = game;
    chip.addEventListener('click', function() { Register.toggleGame(game); });
    var gc = document.getElementById('games-container');
    if (gc) gc.appendChild(chip);
  });

  CONFIG.CITIES.forEach(function(city) {
    var opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    var dl = document.getElementById('city-datalist');
    if (dl) dl.appendChild(opt);
  });
});
