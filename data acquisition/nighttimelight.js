var dataset = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG')
                  .filter(ee.Filter.date('2021-01-01', '2021-12-31'));
  
var ntl =  dataset.filter(ee.Filter.bounds(jateng.geometry()))
                  .select('avg_rad')
                  .median()
                  .clip(jateng);
  
var ntlVis = {min: 0.0, max: 60.0};

Map.addLayer(ntl, ntlVis, 'NTL');

Export.image.toDrive({
    image: ntl,
    description: 'NTL_Jateng21',
    folder: 'GEE21',
    fileNamePrefix: 'NTL_Jateng21',
    region: jateng,  
    scale: 10,  
    crs: 'EPSG:4326',
    maxPixels: 1e11,
    fileFormat: 'GeoTIFF',
  });
