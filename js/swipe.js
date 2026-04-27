var SwipeApp = {
  users: [],
  currentIndex: 0,
  isAnimating: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  isDragging: false,
  currentUser: null,
  likesRemaining: 10,

  init: async function() {
    TG.init();
    var token = localStorage.getItem('lobby_token');
    if (!token) { window.location.href = 'index.html'; return; }
    API.setToken(token);
    try {
      var meData = await API.getMe();
      this.currentUser = meData.user;
      this.likesRemaining = CONFIG.FREE_LIKES_PER_DAY;
      this.updateLikesCounter();
    } catch(e) { window.location.href = 'index.html'; return; }
    await this.loadUsers();
    this.bindNav();
  },

  loadUsers: async function() {
    this.showLoader(true);
    try {
      var data = await API.getSwipeUsers();
      this.users = data.users || [];
      this.currentIndex = 0;
      this.renderCards();
    } catch(e) {
      console.error('[SWIPE]', e);
      this.showEmpty();
    }
    this.showLoader(false);
  },

  createSkeleton: function() {
    var skeleton = document.createElement('div');
    skeleton.className = 'swipe-card skeleton-card';
    skeleton.innerHTML =
      '<div class="skeleton-photo"></div>' +
      '<div class="skeleton-info">' +
        '<div class="skeleton-text skeleton-name"></div>' +
        '<div class="skeleton-text skeleton-city" style="width:70%;margin-top:8px;"></div>' +
        '<div class="skeleton-text" style="width:80%;margin-top:8px;"></div>' +
        '<div class="skeleton-text" style="width:60%;margin-top:8px;"></div>' +
      '</div>';
    return skeleton;
  },

  renderCards: function() {
    var container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = '';

    // Показываем скелетоны пока загружается
    if (this.users.length === 0) {
      for (var i = 0; i < 2; i++) {
        container.appendChild(this.createSkeleton());
      }
      return;
    }

    if (this.currentIndex >= this.users.length) {
      this.showEmpty();
      return;
    }

    var toShow = this.users.slice(this.currentIndex, this.currentIndex + 3);
    var self = this;
    toShow.slice().reverse().forEach(function(user, i) {
      var card = self.createCard(user, i);
      container.appendChild(card);
    });

    var topCard = container.lastElementChild;
    if (topCard && !topCard.classList.contains('skeleton-card')) {
      this.bindDrag(topCard);
    }

    var empty = document.getElementById('empty-state');
    if (empty) empty.classList.add('hidden');
  },

  createCard: function(user, stackIndex) {
    var card = document.createElement('div');
    card.className = 'swipe-card';
    card.dataset.userId = user.telegram_id;
    card.style.zIndex = 10 - stackIndex;
    var scale = 1 - stackIndex * 0.04;
    var translateY = stackIndex * 10;
    card.style.transform = 'scale(' + scale + ') translateY(' + translateY + 'px)';

    var photo = (user.photos && user.photos.length > 0) ? user.photos[0] : '';
    var gamesArr = (user.games || []).slice(0, 3);
    var games = gamesArr.length > 0 ? gamesArr.join(', ') : 'Не указано';

    var lookingMap = {
      teammate: '🎮 Тиммейт',
      chat: '💬 Общение',
      relationship: '❤️ Отношения',
      friend: '👥 Друзья'
    };
    var lookingFor = (user.looking_for || [])
      .map(function(l) { return lookingMap[l] || l; })
      .join(' · ');

    var premiumBadge = user.premium ? '<span class="premium-badge">⭐</span>' : '';
    var bioHtml = user.bio ? '<div class="card-bio">' + user.bio + '</div>' : '';
    var lookingHtml = lookingFor ? '<div class="card-looking">' + lookingFor + '</div>' : '';
    var photoUrl = photo ? photo : 'assets/placeholder.png';

    card.innerHTML =
      '<div class="card-photo" style="background-image:url(\'' + photoUrl + '\');background-size:cover;background-position:center;">' +
        '<div class="card-like-badge">ЛАЙК 💚</div>' +
        '<div class="card-nope-badge">ПРОПУСК 💔</div>' +
      '</div>' +
      '<div class="card-info">' +
        '<div class="card-name-row">' +
          '<span class="card-name">' + user.name + ', ' + user.age + '</span>' +
          premiumBadge +
        '</div>' +
        '<div class="card-city">📍 ' + (user.city || 'Не указан') + '</div>' +
        '<div class="card-games">🎮 ' + games + '</div>' +
        bioHtml +
        lookingHtml +
      '</div>';

    return card;
  },

  bindDrag: function(card) {
    var self = this;
    card.addEventListener('mousedown', function(e) { self.dragStart(e, card); });
    card.addEventListener('touchstart', function(e) { self.dragStart(e, card); }, { passive: true });
    document.addEventListener('mousemove', function(e) { self.dragMove(e, card); });
    document.addEventListener('touchmove', function(e) { self.dragMove(e, card); }, { passive: true });
    document.addEventListener('mouseup', function(e) { self.dragEnd(e, card); });
    document.addEventListener('touchend', function(e) { self.dragEnd(e, card); });
  },

  dragStart: function(e, card) {
    if (this.isAnimating) return;
    this.isDragging = true;
    var pt = e.touches ? e.touches[0] : e;
    this.startX = pt.clientX;
    this.startY = pt.clientY;
    card.style.transition = 'none';
  },

  dragMove: function(e, card) {
    if (!this.isDragging) return;
    var pt = e.touches ? e.touches[0] : e;
    this.currentX = pt.clientX - this.startX;
    var rotate = this.currentX * 0.08;
    card.style.transform = 'translateX(' + this.currentX + 'px) rotate(' + rotate + 'deg)';

    var threshold = 50;
    var likeBadge = card.querySelector('.card-like-badge');
    var nopeBadge = card.querySelector('.card-nope-badge');

    if (likeBadge) {
      likeBadge.style.opacity = this.currentX > threshold
        ? Math.min((this.currentX - threshold) / 50, 1)
        : 0;
    }
    if (nopeBadge) {
      nopeBadge.style.opacity = this.currentX < -threshold
        ? Math.min((-this.currentX - threshold) / 50, 1)
        : 0;
    }
  },

  dragEnd: function(e, card) {
    if (!this.isDragging) return;
    this.isDragging = false;
    card.style.transition = 'transform 0.3s ease';

    var threshold = 100;
    if (this.currentX > threshold) {
      this.animateOut(card, 'right');
    } else if (this.currentX < -threshold) {
      this.animateOut(card, 'left');
    } else {
      var scale = 1 - 0 * 0.04;
      card.style.transform = 'scale(' + scale + ') translateY(0px)';
      var likeBadge = card.querySelector('.card-like-badge');
      var nopeBadge = card.querySelector('.card-nope-badge');
      if (likeBadge) likeBadge.style.opacity = 0;
      if (nopeBadge) nopeBadge.style.opacity = 0;
    }
    this.currentX = 0;
  },

  animateOut: function(card, direction) {
    this.isAnimating = true;
    var self = this;
    var x = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
    var rot = direction === 'right' ? 30 : -30;

    card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    card.style.transform = 'translateX(' + x + 'px) rotate(' + rot + 'deg)';
    card.style.opacity = '0';

    var userId = parseInt(card.dataset.userId);

    setTimeout(async function() {
      card.remove();
      self.currentIndex++;

      if (direction === 'right') {
        await self.doLike(userId);
      } else {
        await self.doSkip(userId);
      }

      self.renderCards();
      self.isAnimating = false;
    }, 400);
  },

  doLike: async function(userId) {
    TG.haptic('medium');
    try {
      var res = await API.like(userId);

      if (res.likes_remaining !== undefined) {
        this.likesRemaining = res.likes_remaining;
      } else {
        this.likesRemaining = Math.max(0, this.likesRemaining - 1);
      }

      this.updateLikesCounter();

      if (res.match && res.match_user) {
        this.showMatchModal(res.match_user);
        
        // Даём 2 секунды на то чтобы пользователь увидел мэтч
        var self = this;
        setTimeout(function() {
          // Перезагружаем мэтчи в фоне чтобы синхронизировать
          // (это не прерывает пользователя)
        }, 2000);
      }
    } catch(e) {
      var msg = e.message || '';
      if (msg.indexOf('429') !== -1 || msg.toLowerCase().indexOf('limit') !== -1) {
        this.showLimitModal();
      }
      console.error('[LIKE]', e);
    }
  },

  likeBtn: function() {
    var container = document.getElementById('cards-container');
    var topCard = container ? container.lastElementChild : null;
    if (topCard && !this.isAnimating && !topCard.classList.contains('skeleton-card')) {
      this.animateOut(topCard, 'right');
    }
  },

  skipBtn: function() {
    var container = document.getElementById('cards-container');
    var topCard = container ? container.lastElementChild : null;
    if (topCard && !this.isAnimating && !topCard.classList.contains('skeleton-card')) {
      this.animateOut(topCard, 'left');
    }
  },

  showMatchModal: function(user) {
    var modal = document.getElementById('match-modal');
    if (!modal) return;

    var nameEl = document.getElementById('match-user-name');
    var ageEl = document.getElementById('match-user-age');
    var cityEl = document.getElementById('match-user-city');
    var photo = document.getElementById('match-user-photo');

    if (nameEl) nameEl.textContent = user.name;
    if (ageEl) ageEl.textContent = user.age;
    if (cityEl) cityEl.textContent = user.city || '';

    if (photo) {
      var src = (user.photos && user.photos[0]) ? user.photos[0] : 'assets/placeholder.png';
      photo.style.backgroundImage = "url('" + src + "')";
    }

    if (user.username) {
      var writeBtn = document.getElementById('match-write-btn');
      if (writeBtn) {
        writeBtn.href = 'https://t.me/' + user.username;
        writeBtn.style.display = 'flex';
      }
    }

    modal.classList.remove('hidden');
    modal.classList.add('show');
    TG.haptic('success');
  },

  closeMatchModal: function() {
    var modal = document.getElementById('match-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function() { modal.classList.add('hidden'); }, 300);
  },

  showLimitModal: function() {
    var modal = document.getElementById('limit-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');
    }
  },

  closeLimitModal: function() {
    var modal = document.getElementById('limit-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function() { modal.classList.add('hidden'); }, 300);
  },

  updateLikesCounter: function() {
    var el = document.getElementById('likes-counter');
    if (!el) return;

    if (this.currentUser && this.currentUser.premium) {
      el.textContent = '∞ лайков';
      el.classList.add('premium');
    } else {
      el.textContent = this.likesRemaining + ' лайков';
      el.classList.toggle('low', this.likesRemaining <= 3);
    }
  },

  showLoader: function(show) {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.toggle('hidden', !show);
  },

  showEmpty: function() {
    var container = document.getElementById('cards-container');
    if (container) container.innerHTML = '';
    var empty = document.getElementById('empty-state');
    if (empty) empty.classList.remove('hidden');
  },

  bindNav: function() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var page = item.dataset.page;
        if (page) window.location.href = page;
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', function() { SwipeApp.init(); });