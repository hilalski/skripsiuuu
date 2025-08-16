var dataset = ee.ImageCollection('WorldPop/GP/100m/pop')
              .filterDate('2020-01-01', '2020-12-31')
              .filter(ee.Filter.bounds(jateng.geometry())); 

var wp = dataset.mosaic().clip(jateng);

//var wp = dataset.filter(ee.Filter.bounds(jateng.geometry())).median().clip(jateng);
  
var wpVis = {
  bands: ['population'],
  min: 0.0,
  max: 50.0,
  palette: ['24126c', '1fff4f', 'd4ff50']
};

Map.addLayer(wp, wpVis, 'WP');

Export.image.toDrive({
    image: wp,
    description: 'WP_Jateng',
    folder: 'GEE',
    fileNamePrefix: 'WP_Jateng',
    region: jateng,  
    scale: 10,  
    crs: 'EPSG:4326',
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
  });