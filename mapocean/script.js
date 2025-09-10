console.log("Initializing GeoTIFF Viewer...")

// Import necessary libraries
const L = window.L
const parseGeoraster = window.parseGeoraster
const GeoRasterLayer = window.GeoRasterLayer

// Initialize map centered on Kerala
const map = L.map("map").setView([10.8505, 76.2711], 9)
console.log("Map initialized:", map)

// UI Elements
const leftYearSelect = document.getElementById("left-year")
const rightYearSelect = document.getElementById("right-year")
const leftOpacitySlider = document.getElementById("left-opacity")
const rightOpacitySlider = document.getElementById("right-opacity")
// Status text removed - no error display
const loadingScreen = document.getElementById("loading-screen")
const syncMapsBtn = document.getElementById("sync-maps")
const resetViewBtn = document.getElementById("reset-view")

const leftFileInput = document.getElementById("left-file")
const rightFileInput = document.getElementById("right-file")
const leftFileName = document.getElementById("left-file-name")
const rightFileName = document.getElementById("right-file-name")
const leftOpacityValue = document.getElementById("left-opacity-value")
const rightOpacityValue = document.getElementById("right-opacity-value")

// State variables
let leftLayer = null
let rightLayer = null
let sideBySideControl = null
let leftUploadedFile = null
let rightUploadedFile = null

// Fixed file paths - corrected to use .tiff extension
function getFloodImagePath(year) {
  switch (year) {
    case "2018":
      return "flood_2018.tiff"
    case "2020-after":
      return "2020/after/2020-08-15-00_00_2020-08-15-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2020-before":
      return "2020/before/2020-08-03-00_00_2020-08-03-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2022-after":
      return "2022/after/2022-08-12-00_00_2022-08-12-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2022-before":
      return "2022/before/2022-07-26-00_00_2022-07-26-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2025-after":
      return "2025/after floods/2025-08-27-00_00_2025-08-27-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2025-before":
      return "2025/before floods/2025-07-27-00_00_2025-07-27-23_59_Sentinel-1_AWS-IW-VVVH_Custom_script.tiff"
    case "2025":
      return "flood_2025.tiff"
    default:
      return null
  }
}

function getDisplayName(year) {
  switch (year) {
    case "2018":
      return "2018 Flood"
    case "2020-after":
      return "2020 After Flood"
    case "2020-before":
      return "2020 Before Flood"
    case "2022-after":
      return "2022 After Flood"
    case "2022-before":
      return "2022 Before Flood"
    case "2025-after":
      return "2025 After Flood"
    case "2025-before":
      return "2025 Before Flood"
    case "2025":
      return "2025 Flood"
    default:
      return year
  }
}

// Basemap layers
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
})

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
)

// Add default basemap
osmLayer.addTo(map)

// Add layer control
const baseMaps = {
  "OpenStreetMap": osmLayer,
  "Satellite": satelliteLayer,
}
L.control.layers(baseMaps).addTo(map)

// Status update function removed - no error display

// Enhanced GeoTIFF loading with better error handling
async function loadGeoTIFF(source, opacity = 0.6, layerType = 'left') {
  try {
    let displayName = ""
    let arrayBuffer

    if (source instanceof File) {
      displayName = source.name
      console.log(`Loading GeoTIFF from file: ${displayName}`)
      console.log(`Loading ${displayName}...`)

      arrayBuffer = await source.arrayBuffer()
    } else {
      displayName = source
      console.log(`Loading GeoTIFF from URL: ${displayName}`)
      console.log(`Loading ${displayName}...`)

      // Check if file exists first
      try {
        const response = await fetch(source)
        if (!response.ok) {
          throw new Error(`File not found: ${source}`)
        }
        arrayBuffer = await response.arrayBuffer()
      } catch (error) {
        console.warn(`File not found: ${source}, skipping...`)
        console.log(`File not found: ${displayName}`)
        return null
      }
    }

    console.log(`GeoTIFF loaded, size: ${arrayBuffer.byteLength} bytes`)
    console.log(`Processing ${displayName}...`)

    // Parse the GeoTIFF using georaster
    const georaster = await parseGeoraster(arrayBuffer)
    console.log("GeoTIFF parsed:", georaster)

    console.log(`Rendering ${displayName}...`)

    const geoRasterLayer = new GeoRasterLayer({
      georaster: georaster,
      opacity: opacity,
      pixelValuesToColorFn: (pixelValues) => {
        const pixelValue = pixelValues[0]

        if (pixelValue === null || pixelValue === undefined || pixelValue === georaster.noDataValue) {
          return null
        }

        // Handle 16-bit values - normalize to 0-255 range
        let normalizedValue
        if (georaster.pixelDepth === 16) {
          normalizedValue = Math.floor((pixelValue / 65535) * 255)
        } else {
          normalizedValue = pixelValue
        }

        // Enhanced color mapping for better visualization
        if (layerType === 'right') {
          // Green color scheme for right layer
          if (normalizedValue < 30) {
            // Very low backscatter - water/flood (dark green)
            return `rgba(0, ${Math.floor(normalizedValue * 3)}, 100, 0.9)`
          } else if (normalizedValue < 60) {
            // Low backscatter - shallow water (medium green)
            return `rgba(0, ${Math.floor(normalizedValue * 2)}, 150, 0.7)`
          } else if (normalizedValue < 120) {
            // Medium backscatter - mixed areas (light green)
            return `rgba(${Math.floor(normalizedValue * 0.5)}, ${Math.floor(normalizedValue)}, 100, 0.5)`
          } else if (normalizedValue < 200) {
            // High backscatter - land (yellow-green)
            return `rgba(${Math.floor(normalizedValue * 0.8)}, 255, 0, 0.4)`
          } else {
            // Very high backscatter - dense land (bright green)
            return `rgba(0, 255, 0, 0.3)`
          }
        } else {
          // Blue/red color scheme for left layer (original)
          if (normalizedValue < 30) {
            // Very low backscatter - water/flood
            return `rgba(0, ${Math.floor(normalizedValue * 3)}, 255, 0.9)`
          } else if (normalizedValue < 60) {
            // Low backscatter - shallow water
            return `rgba(0, ${Math.floor(normalizedValue * 2)}, 255, 0.7)`
          } else if (normalizedValue < 120) {
            // Medium backscatter - mixed areas
            return `rgba(${Math.floor(normalizedValue)}, ${Math.floor(normalizedValue)}, 255, 0.5)`
          } else if (normalizedValue < 200) {
            // High backscatter - land
            return `rgba(255, ${Math.floor(255 - normalizedValue * 0.5)}, 0, 0.4)`
          } else {
            // Very high backscatter - dense land
            return `rgba(255, 0, 0, 0.3)`
          }
        }
      },
      resolution: 256,
      className: "geotiff-overlay",
    })

    console.log(`Loaded: ${displayName}`)
    return geoRasterLayer
  } catch (error) {
    console.error(`Error loading GeoTIFF:`, error)
    console.log(`Error: ${error.message}`)
    return null
  }
}

// Enhanced map update function
async function updateMap() {
  try {
    console.log("Updating map layers...")
    console.log("Updating map...")

    const leftYear = leftYearSelect.value
    const rightYear = rightYearSelect.value
    const leftOpacity = Number.parseFloat(leftOpacitySlider.value) / 100
    const rightOpacity = Number.parseFloat(rightOpacitySlider.value) / 100

    console.log(`Loading data for years: ${leftYear} and ${rightYear}`)

    // Clear existing layers
    if (leftLayer) {
      map.removeLayer(leftLayer)
      leftLayer = null
    }
    if (rightLayer) {
      map.removeLayer(rightLayer)
      rightLayer = null
    }
    if (sideBySideControl) {
      sideBySideControl.remove()
      sideBySideControl = null
    }

    // Determine sources - prioritize uploaded files
    const leftSource = leftUploadedFile || getFloodImagePath(leftYear)
    const rightSource = rightUploadedFile || getFloodImagePath(rightYear)

    console.log(`Left source:`, leftSource, `Right source:`, rightSource)

    // Load left layer
    if (leftSource) {
      console.log(`Loading left layer`)
      leftLayer = await loadGeoTIFF(leftSource, leftOpacity, 'left')
      if (leftLayer) {
        leftLayer.addTo(map)
        console.log(`Left layer added successfully`)
      }
    }

    // Load right layer
    if (rightSource && rightSource !== leftSource) {
      console.log(`Loading right layer`)
      rightLayer = await loadGeoTIFF(rightSource, rightOpacity, 'right')
      if (rightLayer) {
        rightLayer.addTo(map)
        console.log(`Right layer added successfully`)

        if (leftLayer && rightLayer) {
          sideBySideControl = L.control.sideBySide(leftLayer, rightLayer).addTo(map)
          console.log("Side-by-side comparison ready")
        }
      }
    }

    // Update status based on loaded layers
    if (leftLayer && rightLayer) {
      console.log("Comparison view active")
    } else if (leftLayer) {
      console.log("Single layer view active")
    } else {
      console.log("No data loaded")
    }
  } catch (error) {
    console.error("Error in updateMap:", error)
    console.log(`Error: ${error.message}`)
  }
}

// Event listeners
leftYearSelect.addEventListener("change", updateMap)
rightYearSelect.addEventListener("change", updateMap)

leftFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (file) {
    leftUploadedFile = file
    leftFileName.textContent = file.name
    leftFileName.classList.add("selected")
    console.log(`Left file selected: ${file.name}`)
    updateMap()
  } else {
    leftUploadedFile = null
    leftFileName.textContent = "Left Map"
    leftFileName.classList.remove("selected")
  }
})

rightFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (file) {
    rightUploadedFile = file
    rightFileName.textContent = file.name
    rightFileName.classList.add("selected")
    console.log(`Right file selected: ${file.name}`)
    updateMap()
  } else {
    rightUploadedFile = null
    rightFileName.textContent = "Right Map"
    rightFileName.classList.remove("selected")
  }
})

leftOpacitySlider.addEventListener("input", () => {
  const value = Number.parseFloat(leftOpacitySlider.value)
  leftOpacityValue.textContent = `${value}%`
  if (leftLayer) {
    leftLayer.setOpacity(value / 100)
  }
})

rightOpacitySlider.addEventListener("input", () => {
  const value = Number.parseFloat(rightOpacitySlider.value)
  rightOpacityValue.textContent = `${value}%`
  if (rightLayer) {
    rightLayer.setOpacity(value / 100)
  }
})

syncMapsBtn.addEventListener("click", () => {
  if (leftLayer && rightLayer && sideBySideControl) {
    sideBySideControl.setLeftLayers(leftLayer)
    sideBySideControl.setRightLayers(rightLayer)
    console.log("Maps synchronized")
  } else {
    console.log("Both layers required for sync")
  }
})

resetViewBtn.addEventListener("click", () => {
  map.setView([10.8505, 76.2711], 9)
  console.log("View reset to Kerala")
})

// Hide loading screen
function hideLoadingScreen() {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden')
    setTimeout(() => {
      loadingScreen.style.display = 'none'
    }, 350)
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, initializing GeoTIFF map...")

  // Check if required libraries are loaded
  if (typeof parseGeoraster === "undefined") {
    console.log("Error: GeoTIFF libraries not loaded")
    console.error("GeoTIFF libraries not loaded")
    return
  }

  if (typeof GeoRasterLayer === "undefined") {
    console.log("Error: GeoRaster layer library not loaded")
    console.error("GeoRaster layer library not loaded")
    return
  }

  console.log("All libraries loaded successfully")

  // Hide loading screen after a short delay
  setTimeout(() => {
    hideLoadingScreen()
  }, 1500)

  // Initial map load
  await updateMap()

  console.log("GeoTIFF Viewer ready - Select flood data to compare")
})

// Map event listeners
map.on("layeradd", (e) => {
  console.log("Layer added:", e.layer)
})

map.on("layerremove", (e) => {
  console.log("Layer removed:", e.layer)
})

// Network status monitoring
window.addEventListener("online", () => {
  console.log("Connection restored")
})

window.addEventListener("offline", () => {
  console.log("Connection lost - some features may not work")
})

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  console.log("An unexpected error occurred")
})

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'r':
        e.preventDefault()
        resetViewBtn.click()
        break
      case 's':
        e.preventDefault()
        syncMapsBtn.click()
        break
    }
  }
})

console.log("GeoTIFF Viewer initialized successfully")