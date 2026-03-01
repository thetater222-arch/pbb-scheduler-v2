import './style.css'

// import local image so bundler resolves the path
import banner from './assets/PBBSchedulerMainPic.png'
import { events } from './events.js'

const FAVORITES_KEY = 'pbb:favorites';
let favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
let currentDayFilter = undefined;

// optionally supply a day name (e.g. "Sunday") to filter events by the event.day field
function renderEvents(list, dayName) {
  if (!list || list.length === 0) return '<p>No events scheduled</p>';
  let filtered = list;
  if (dayName) {
    filtered = list.filter((e) => e.day === dayName);
  }

  if (filtered.length === 0) {
    return `<p>No events scheduled for ${dayName}</p>`;
  }

  return `
    <ul class="event-list">
      ${filtered
        .map(
          (e) =>
            `<li class="event-item">
              <button class="fav-btn ${favorites.has(e.id) ? 'active' : ''}" data-id="${e.id}" aria-label="Toggle favorite">❤</button>
              <strong>${e.title}</strong><br />
              <small>${e.day} — ${e.date} | ${e.start} - ${e.end}</small><br />
              <span>${e.location} — ${e.description}</span>
            </li>`
        )
        .join('')}
    </ul>
  `;
}

function toggleFavorite(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  // re-render current view
  document.getElementById('eventsContainer').innerHTML = renderEvents(events, currentDayFilter);
  attachFavListeners();
}

function attachFavListeners() {
  document.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.removeEventListener('click', btn.__favHandler);
    const handler = (e) => {
      const id = Number(btn.dataset.id);
      toggleFavorite(id);
    };
    btn.__favHandler = handler;
    btn.addEventListener('click', handler);
  });
}

function populateDaySelector(days) {
  const selector = document.getElementById('daySelector');
  selector.innerHTML = '<option value="">-- all days --</option>' +
    days
      .map((d) => `<option value="${d}">${d}</option>`)
      .join('');
}

function renderFavorites(dayName) {
  const favEvents = events.filter((e) => favorites.has(e.id) && (!dayName || e.day === dayName));
  if (favEvents.length === 0) return '<p>No favorite events</p>';
  return `
    <ul class="event-list">
      ${favEvents
        .map(
          (e) =>
            `<li class="event-item">
              <button class="fav-btn ${favorites.has(e.id) ? 'active' : ''}" data-id="${e.id}" aria-label="Toggle favorite">❤</button>
              <strong>${e.title}</strong><br />
              <small>${e.day} — ${e.date} | ${e.start} - ${e.end}</small><br />
              <span>${e.location} — ${e.description}</span>
            </li>`
        )
        .join('')}
    </ul>
  `;
}

function init() {
  // compute unique day names from events (uses the `day` field on each event)
  const uniqueDays = [...new Set(events.map((e) => e.day))];
  document.querySelector('#app').innerHTML = `
    <div>
      <h1>PBB Schedule Helper</h1>
      <img src="${banner}" alt="PPB Pic" class="header-image" />
      <h2>2026 List of Events</h2>
      <div class="view-toggle">
        <button id="viewAllBtn" class="view-btn active">All</button>
        <button id="viewFavBtn" class="view-btn">Favorites</button>
      </div>
      <label for="daySelector">Filter by day:</label>
      <select id="daySelector"></select>
      <div id="eventsContainer">
        ${renderEvents(events)}
      </div>
    </div>
  `;

  populateDaySelector(uniqueDays);

  // attach favorite handlers for initial render
  attachFavListeners();

  document.getElementById('viewAllBtn').addEventListener('click', () => {
    document.getElementById('viewAllBtn').classList.add('active');
    document.getElementById('viewFavBtn').classList.remove('active');
    currentDayFilter = undefined;
    document.getElementById('daySelector').value = '';
    document.getElementById('eventsContainer').innerHTML = renderEvents(events);
    attachFavListeners();
  });

  document.getElementById('viewFavBtn').addEventListener('click', () => {
    document.getElementById('viewFavBtn').classList.add('active');
    document.getElementById('viewAllBtn').classList.remove('active');
    document.getElementById('eventsContainer').innerHTML = renderFavorites(currentDayFilter);
    attachFavListeners();
  });

  document.getElementById('daySelector').addEventListener('change', (e) => {
    const day = e.target.value;
    currentDayFilter = day || undefined;
    if (document.getElementById('viewFavBtn').classList.contains('active')) {
      document.getElementById('eventsContainer').innerHTML = renderFavorites(currentDayFilter);
    } else {
      document.getElementById('eventsContainer').innerHTML = renderEvents(events, currentDayFilter);
    }
    attachFavListeners();
  });
}

init();

