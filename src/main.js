import './style.css'

// import local image so bundler resolves the path
import banner from './assets/PBBSchedulerMainPic.png'
import { events } from './events.js'

const FAVORITES_KEY = 'pbb:favorites';
let favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
let currentDayFilter = undefined;
let currentTagFilter = undefined;

// optionally supply a day name (e.g. "Sunday") to filter events by the event.day field
function renderEvents(list, dayName, tagName) {
  if (!list || list.length === 0) return '<p>No events scheduled</p>';
  let filtered = list;
  if (dayName) {
    filtered = list.filter((e) => e.day === dayName);
  }
  if (tagName) {
    filtered = filtered.filter((e) => Array.isArray(e.tags) && e.tags.includes(tagName));
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
              <span>${e.location} — ${e.description}</span><br />
              <small class="tags">${(e.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}</small>
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
  updateEventsView();
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
  const favEvents = events.filter((e) => favorites.has(e.id) && (!dayName || e.day === dayName) && (!currentTagFilter || (Array.isArray(e.tags) && e.tags.includes(currentTagFilter))));
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
              <span>${e.location} — ${e.description}</span><br />
              <small class="tags">${(e.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}</small>
            </li>`
        )
        .join('')}
    </ul>
  `;
}

// parse a date string like '2026-03-01' and a time like '08:00 AM' into a Date
function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  let [timePart, ampm] = timeStr.split(' ');
  let [hour, minute] = timePart.split(':').map(Number);
  if (ampm) {
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }
  return new Date(year, month - 1, day, hour, minute);
}

function getEventsHappeningNow(list) {
  const now = new Date();
  return list.filter((e) => {
    try {
      const start = parseDateTime(e.date, e.start);
      const end = parseDateTime(e.date, e.end);
      return now >= start && now <= end;
    } catch (err) {
      return false;
    }
  });
}

function renderHappeningNow(list) {
  if (!list || list.length === 0) return '<p>No events happening now</p>';
  return `
    <ul class="event-list happening-now">
      ${list.map(e => `
        <li class="event-item now">
          <strong>${e.title}</strong> — <small>${e.location}</small><br />
          <small>${e.day} — ${e.date} | ${e.start} - ${e.end}</small>
        </li>
      `).join('')}
    </ul>
  `;
}

function populateTagSelector(tags) {
  const selector = document.getElementById('tagSelector');
  if (!selector) return;
  selector.innerHTML = '<option value="">-- all tags --</option>' +
    tags.map(t => `<option value="${t}">${t}</option>`).join('');
}

function updateEventsView() {
  const happeningBtn = document.getElementById('happeningNowBtn');
  const nowActive = happeningBtn && happeningBtn.classList.contains('active');
  const eventsContainer = document.getElementById('eventsContainer');
  if (nowActive) {
    const nowList = getEventsHappeningNow(events).filter(ev => !currentTagFilter || (Array.isArray(ev.tags) && ev.tags.includes(currentTagFilter)));
    eventsContainer.innerHTML = renderHappeningNow(nowList);
  } else if (document.getElementById('viewFavBtn').classList.contains('active')) {
    eventsContainer.innerHTML = renderFavorites(currentDayFilter);
  } else {
    eventsContainer.innerHTML = renderEvents(events, currentDayFilter, currentTagFilter);
  }
  attachFavListeners();
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
      <div class="filters">
        <label for="daySelector">Filter by day:</label>
        <select id="daySelector"></select>
        <label for="tagSelector">Filter by tag:</label>
        <select id="tagSelector"></select>
      </div>
      <div class="now-header">
        <button id="happeningNowBtn" class="view-btn">Happening Now</button>
      </div>
      <div id="eventsContainer">
        ${renderEvents(events)}
      </div>
    </div>
  `;

  populateDaySelector(uniqueDays);
  // compute unique tags
  const uniqueTags = [...new Set(events.flatMap(e => e.tags || []))];
  populateTagSelector(uniqueTags);

  // attach favorite handlers for initial render
  attachFavListeners();

  // wire Happening Now button
  const happeningBtn = document.getElementById('happeningNowBtn');
  if (happeningBtn) {
    happeningBtn.addEventListener('click', () => {
      const isActive = happeningBtn.classList.toggle('active');
      // when activating, clear other view active states
      if (isActive) {
        document.getElementById('viewAllBtn').classList.remove('active');
        document.getElementById('viewFavBtn').classList.remove('active');
      } else {
        // restore to All view when toggled off
        document.getElementById('viewAllBtn').classList.add('active');
      }
      updateEventsView();
    });
  }

  document.getElementById('viewAllBtn').addEventListener('click', () => {
    document.getElementById('viewAllBtn').classList.add('active');
    document.getElementById('viewFavBtn').classList.remove('active');
    const hb = document.getElementById('happeningNowBtn');
    if (hb) hb.classList.remove('active');
    currentDayFilter = undefined;
    document.getElementById('daySelector').value = '';
    updateEventsView();
  });

  document.getElementById('viewFavBtn').addEventListener('click', () => {
    document.getElementById('viewFavBtn').classList.add('active');
    document.getElementById('viewAllBtn').classList.remove('active');
    const hb = document.getElementById('happeningNowBtn');
    if (hb) hb.classList.remove('active');
    updateEventsView();
  });

  document.getElementById('daySelector').addEventListener('change', (e) => {
    const day = e.target.value;
    currentDayFilter = day || undefined;
    updateEventsView();
  });

  document.getElementById('tagSelector').addEventListener('change', (e) => {
    const tag = e.target.value;
    currentTagFilter = tag || undefined;
    updateEventsView();
  });

  // update happening-now every 30s
  setInterval(() => {
    const hb = document.getElementById('happeningNowBtn');
    if (hb && hb.classList.contains('active')) {
      updateEventsView();
    }
  }, 30 * 1000);
}

init();

