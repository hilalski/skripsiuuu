var dataset = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')
  .filterDate('2021-01-01', '2021-12-31');

var co = dataset.median().clip(jateng);

var coViz = {
  min: 0,
  max: 0.05,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

Map.addLayer(jateng, {
  color: '0082e6',
}, 'Jawa Tengah', false);

Map.addLayer(co, coViz, 'CO');

Export.image.toDrive({
    image: co,
    description: 'CO_Jateng21',
    folder: 'GEE21',
    fileNamePrefix: 'CO_Jateng21',
    region: jateng,  
    scale: 10,  
    crs: 'EPSG:4326',
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
  });
  