# Kerala Floods - Geospatial Analysis

A modern, interactive web application for analyzing Kerala flood data using Sentinel-1 SAR GeoTIFF files.

## Features

### 🗺️ **Interactive Mapping**
- Side-by-side comparison of flood data
- Real-time opacity controls
- Synchronized map views
- Multiple basemap options (OpenStreetMap, Satellite)

### 📊 **Data Visualization**
- Sentinel-1 SAR data processing
- 16-bit GeoTIFF support
- Custom color mapping for flood detection
- High-resolution rendering

### 📁 **File Management**
- Upload custom GeoTIFF files
- Pre-loaded flood data from 2018, 2022, and 2025
- Drag-and-drop file interface

### 🎨 **Modern UI/UX**
- Clean, minimalistic design
- Responsive layout
- Smooth animations and transitions
- Keyboard shortcuts (Ctrl+R: Reset, Ctrl+S: Sync)

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   # or
   python -m http.server 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Select data:**
   - Choose from pre-loaded flood data
   - Or upload your own GeoTIFF files
   - Adjust opacity and compare layers

## Data Sources

- **2018**: Major Kerala floods
- **2022**: Before/After flood data
- **2025**: Before/After flood data

## Technical Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js
- **GeoTIFF Processing**: georaster, georaster-layer-for-leaflet
- **Styling**: Modern CSS with CSS Grid/Flexbox
- **Fonts**: Inter (Google Fonts)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Keyboard Shortcuts

- `Ctrl/Cmd + R`: Reset view to Kerala
- `Ctrl/Cmd + S`: Sync map views

## License

MIT License - see LICENSE file for details.