var dataset = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')
  .select('NO2_column_number_density')
  .filterDate('2021-01-01', '2021-12-31');

var mo = dataset.median().clip(jateng);

var moViz = {
  min: 0,
  max: 0.0002,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

Map.addLayer(jateng, {
  color: '0082e6',
}, 'Jawa Tengah', false);

Map.addLayer(mo, moViz, 'MO');

Export.image.toDrive({
    image: mo,
    description: 'MO_Jateng21',
    folder: 'GEE21',
    fileNamePrefix: 'MO_Jateng21',
    region: jateng,  
    scale: 10,  
    crs: 'EPSG:4326',
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
  });
