import { GOOGLE_SHEET_CONFIG } from './config.js';

function parseGoogleResponse(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
  if (!match || !match[1]) {
    throw new Error('Unexpected Google Sheets response format.');
  }
  return JSON.parse(match[1]);
}

function normalizeGoogleDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const dateMatch = value.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]) + 1;
      const day = Number(dateMatch[3]);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return value;
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = value.getMonth() + 1;
    const day = value.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(value);
}

function normalizeEventCell(cell) {
  if (!cell) return '';
  if (typeof cell.f === 'string' && cell.f.length > 0) return cell.f;
  if (cell.v === null || cell.v === undefined) return '';
  return cell.v;
}

function normalizeEventRow(cells, index) {
  const valueAt = (position) => normalizeEventCell(cells[position]);
  const rawId = valueAt(0);
  const parsedId = Number(rawId);
  const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : index + 1;
  const rawTags = String(valueAt(8) || '');

  return {
    id,
    title: String(valueAt(1) || ''),
    date: normalizeGoogleDate(valueAt(2)),
    day: String(valueAt(3) || ''),
    start: String(valueAt(4) || ''),
    end: String(valueAt(5) || ''),
    location: String(valueAt(6) || ''),
    description: String(valueAt(7) || ''),
    tags: rawTags
      .split(/[,;]+/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

/**
 * Fetches events from a Google Sheet
 * @returns {Promise<Array>} Array of event objects
 */
export async function fetchEventsFromSheet() {
  try {
    const query = encodeURIComponent('select *');
    const sheetName = encodeURIComponent(GOOGLE_SHEET_CONFIG.SHEET_NAME);
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_CONFIG.SHEET_ID}/gviz/tq?sheet=${sheetName}&headers=1&tq=${query}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets request failed with status ${response.status}`);
    }
    const text = await response.text();
    const parsed = parseGoogleResponse(text);
    const rows = parsed?.table?.rows || [];

    const events = rows.map((row, index) => normalizeEventRow(row.c || [], index));
    
    return events;
  } catch (error) {
    console.error('Error fetching events from Google Sheets:', error);
    return [];
  }
}

/**
 * Alternative: Fetch from CSV export (simpler setup, no API needed)
 * Use this URL format: https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=SHEET_ID
 * @param {string} csvUrl - Public CSV export URL from Google Sheets
 * @returns {Promise<Array>} Array of event objects
 */
export async function fetchEventsFromCSV(csvUrl) {
  try {
    const response = await fetch(csvUrl);
    const csv = await response.text();
    
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const events = lines.slice(1).map((line, index) => {
      // Simple CSV parsing (handles basic cases)
      const values = line.split(',').map(v => v.trim());
      
      return {
        id: values[0] || index + 1,
        title: values[1] || '',
        date: values[2] || '',
        day: values[3] || '',
        start: values[4] || '',
        end: values[5] || '',
        location: values[6] || '',
        description: values[7] || '',
        tags: (values[8] || '').split(';').map(t => t.trim()).filter(t => t),
      };
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
}
