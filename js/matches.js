var Matches = {
  init: async function() {
    TG.init();
    var token = localStorage.getItem('lobby_token');
    if (!token) { window.location.href = 'index.html'; return; }
    API.setToken(token);
    TG.enableBackButton(function() { window.location.href = 'swipe.html'; });
    await this.loadMatches();
  },

  loadMatches: async function() {
    var loader = document.getElementById('loader');
    var list   = document.getElementById('matches-list');
    var empty  = document.getElementById('empty-state');
    if (loader) loader.classList.remove('hidden');
    try {
      var data = await API.getMatches();
      var matches = data.matches || [];
      if (loader) loader.classList.add('hidden');
      if (matches.length === 0) {
        if (empty) empty.classList.remove('hidden');
        return;
      }
      if (list) list.innerHTML = '';
      var self = this;
      matches.forEach(function(m) {
        var card = self.createMatchCard(m.user, m.created_at);
        if (list) list.appendChild(card);
      });
    } catch(e) {
      if (loader) loader.classList.add('hidden');
      console.error('[MATCHES]', e);
    }
  },

  createMatchCard: function(user, createdAt) {
    var div = document.createElement('div');
    div.className = 'match-card';
    var photo = (user.photos && user.photos[0]) ? user.photos[0] : 'assets/placeholder.png';
    var gamesArr = (user.games || []).slice(0, 2);
    var games = gamesArr.join(', ');
    var date = new Date(createdAt).toLocaleDateString('ru-RU');
    var gamesHtml   = games   ? '<div class="match-games">🎮 ' + games + '</div>' : '';
    var writeHtml   = user.username
      ? '<a class="btn-write" href="https://t.me/' + user.username + '" target="_blank">💬</a>'
      : '';
    div.innerHTML =
      '<div class="match-photo" style="background-image:url(\'' + photo + '\')"></div>' +
      '<div class="match-info">' +
        '<div class="match-name">' + user.name + ', ' + user.age + '</div>' +
        '<div class="match-city">📍 ' + (user.city || '') + '</div>' +
        gamesHtml +
        '<div class="match-date">Мэтч ' + date + '</div>' +
      '</div>' +
      '<div class="match-actions">' + writeHtml + '</div>';
    return div;
  }
};

document.addEventListener('DOMContentLoaded', function() { Matches.init(); });
