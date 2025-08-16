// Function Cloud Masking
function maskS2clouds(image) {
    var qa = image.select('QA60');

    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;

    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
               .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

    return image.updateMask(mask).divide(10000);
}

// Pre-filter to get less cloudy granules.
var S2_data = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate('2024-01-01', '2024-12-31')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .median()
    .clip(jateng)

// Visualization
Map.addLayer(S2_data, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3}, "True-Color");
Map.addLayer(S2_data, {bands: ['B8', 'B3', 'B2'], min: 0, max: 0.3}, "False-Color");

// Band Compositing - NDVI
var NDVI = S2_data.expression(
    "(NIR - RED) / (NIR + RED)",
    {
        RED: S2_data.select("B4"),
        NIR: S2_data.select("B8")
    }
);

Map.addLayer(NDVI, {min: -1, max: 1}, "NDVI");

// Band Compositing - NDWI
var NDWI = S2_data.expression(
    "(GREEN - NIR) / (GREEN + NIR)",
    {
        GREEN: S2_data.select("B3"),
        NIR: S2_data.select("B8")
    }
);

Map.addLayer(NDWI, {min: -1, max: 1}, "NDWI");

// Band Compositing - NDBI
var NDBI = S2_data.expression(
    "(SWIR - NIR) / (SWIR + NIR)",
    {
        SWIR: S2_data.select("B11"),
        NIR: S2_data.select("B8")
    }
);

Map.addLayer(NDBI, {min: -1, max: 1}, "NDBI");

// Band Compositing - EVI
var EVI = S2_data.expression(
    "2.5 * ((NIR - RED)/(1 + (NIR + (RED) - (7.5 * BLUE))))",
    {
        RED: S2_data.select("B4"),
        NIR: S2_data.select("B8"),
        BLUE: S2_data.select("B2"),
    }
);

Map.addLayer(EVI, {min: -1, max: 1}, "EVI");

// Band Compositing - SAVI
var SAVI = S2_data.expression(
    "(1 + 0.5) * ((NIR - RED) / (NIR + RED + 0.5))",
    {
        RED: S2_data.select("B4"),
        NIR: S2_data.select("B8")
    }
);

Map.addLayer(SAVI, {min: -1, max: 1}, "SAVI");

// Export
Export.image.toDrive({
    image: NDVI,
    folder: 'GEE',
    description: 'NDVI',
    fileNamePrefix: 'NDVI',
    scale: 10,
    region: jateng,
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
    crs: 'EPSG:4326'
});

Export.image.toDrive({
    image: NDWI,
    folder: 'GEE',
    description: 'NDWI',
    fileNamePrefix: 'NDWI',
    scale: 10,
    region: jateng,
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
    crs: 'EPSG:4326'
});

Export.image.toDrive({
    image: NDBI,
    folder: 'GEE',
    description: 'NDBI',
    fileNamePrefix: 'NDBI',
    scale: 10,
    region: jateng,
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
    crs: 'EPSG:4326'
});

Export.image.toDrive({
    image: SAVI,
    folder: 'GEE',
    description: 'SAVI',
    fileNamePrefix: 'SAVI',
    scale: 10,
    region: jateng,
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
    crs: 'EPSG:4326'
});

Export.image.toDrive({
    image: EVI,
    folder: 'GEE',
    description: 'EVI',
    fileNamePrefix: 'EVI',
    scale: 10,
    region: jateng,
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
    crs: 'EPSG:4326'
});