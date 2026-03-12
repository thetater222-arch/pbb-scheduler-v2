# Google Sheets Integration Setup Guide

## How to Set Up and Use Google Sheets for Events

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Rename it to something like "PBB Events 2026" (or your year)
3. Set up columns with these headers in row 1:
   ```
   id | title | date | day | start | end | location | description | tags
   ```

### Step 2: Add Your Events

Add your events as rows. Example:
```
1 | Sunrise Event | 2026-03-01 | Sunday | 08:00 AM | 09:00 AM | Down the Rabbit Hole | Tequilla and breakfast | food,social
2 | Moonrise Event | 2026-03-01 | Sunday | 03:00 PM | 07:00 PM | Yoga spot | Relax with friends | wellness,crafts
```

**Important notes:**
- `id` should be unique numbers
- `date` format: YYYY-MM-DD
- `day` format: Sunday, Monday, etc.
- `start`/`end` format: HH:MM AM/PM
- `tags` should be comma-separated (no spaces): `food,social` or `wellness,crafts`

### Step 3: Share Your Sheet

1. Click the **Share** button in the top right
2. Change sharing to **"Anyone with the link"** or make it **Public** (required for the app to access it)
3. Copy the sheet URL from the address bar

### Step 4: Get Your Sheet ID

The Sheet ID is in the URL. Example URL:
```
https://docs.google.com/spreadsheets/d/1ABCD1234567890abcdefgh/edit#gid=0
```
The Sheet ID is: `1ABCD1234567890abcdefgh`

### Step 5: Update config.js

Open `src/config.js` and update it with your Sheet ID and sheet tab name:

```javascript
export const GOOGLE_SHEET_CONFIG = {
  SHEET_ID: '1ABCD1234567890abcdefgh', // Your actual Sheet ID
  SHEET_NAME: 'Events', // Name of the tab (default is 'Sheet1' for new sheets)
};
```

### Step 6: Test

1. Run `npm run dev` to start the app
2. Your events from Google Sheets should load automatically
3. If nothing appears, check the browser console for errors (F12 → Console tab)

## Each Year: Create a New Sheet

1. Create a new Google Sheet with that year's events
2. Make it shareable
3. Copy its Sheet ID
4. Update `src/config.js` with the new Sheet ID
5. Rebuild and deploy your app

That's it! No code changes needed—just update the config.

## Troubleshooting

**Events not loading?**
- Make sure the sheet is shared (Anyone with the link)
- Check that the Sheet ID is correct
- Check Sheet Name matches your tab name (case-sensitive)
- Open browser console (F12) to see error messages

**Using Different Fetch Methods:**

The app comes with two loading methods:

1. **Google Visualization Query API** (Default) - Works with public sheets
   - Currently used in `googleSheetsLoader.js` → `fetchEventsFromSheet()`

2. **CSV Export** - Alternative method
   - Edit `main.js` to use `fetchEventsFromCSV()` instead
   - Export your sheet as CSV: File → Download → CSV
   - Host it somewhere accessible and use the CSV URL

## Columns Reference

| Column | Format | Example | Required |
|--------|--------|---------|----------|
| id | Number | 1 | Yes |
| title | Text | "Sunrise Event" | Yes |
| date | YYYY-MM-DD | 2026-03-01 | Yes |
| day | Day name | Sunday | Yes |
| start | HH:MM AM/PM | 08:00 AM | Yes |
| end | HH:MM AM/PM | 09:00 AM | Yes |
| location | Text | Down the Rabbit Hole | Yes |
| description | Text | Breakfast event | Yes |
| tags | Comma-separated | food,social | Yes (can be empty) |
