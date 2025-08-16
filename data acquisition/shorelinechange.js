Map.addLayer(jateng, {
  color: '0082e6',
}, 'Jawa Tengah', false);
// Ekspor
Export.table.toDrive({
  collection: ee.FeatureCollection(pesisir),
  description: 'AOI_Peisisr',
  folder: 'GEE',
  fileNamePrefix: 'AOI_Peisisr',
  fileFormat: 'SHP'
});

//Fungsi Masking
var maskclouds = function(image) {
  var qa = image.select('QA_PIXEL');
  //Bitmask Awan 
  var CloudsBitMask = 1 << 3;
  var cloudShadowBitMask = 1 << 4;
  //Masking Awan
  var mask = qa.bitwiseAnd(CloudsBitMask).eq(0)
            .and(qa.bitwiseAnd(cloudShadowBitMask).eq(0));
  return image.updateMask(mask);
};

// Landsat 8 - 2021
var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  //Filter Tanggal	
  .filter(ee.Filter.date('2021-07-01', '2021-11-01'))
  //Filter Awan
  .filter(ee.Filter.lt('CLOUD_COVER', 30))
  // Load Masking to Data Collection
  .map(maskclouds)
  .median()
   // Clip Raster
  .clip(pesisir)
  // Memilih Bands Dataset
  .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
  // Faktor Skala Band
  .multiply(0.0000275).add(-0.2);
Map.addLayer(landsat8, {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0, 
  max: 0.3,
},
'2021 True', true);
Export.image.toDrive({
  image: landsat8,
  description: 'Pesisir_2021',
  folder: 'GEE',
  scale: 30, //resolusi spasial
  region: pesisir,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:4326',
  });

// Menambahkan Layer Citra Komposit ke Display Peta
Map.addLayer(landsat8, {
  bands: ['SR_B5', 'SR_B4', 'SR_B3'],
  min: 0.0, 
  max: 0.45,
},
'2021 Vegetation', false);

// NDWI (Normalized Different Water Index)
var detectWater00 = function(image00) {
  var ndwi00 = image00.expression(
    '(GREEN - NIR) / (GREEN + NIR)', {
      'GREEN': image00.select('SR_B3'),
      'NIR': image00.select('SR_B5'),
  }).rename('ndwi00');
  var ndwiVis = {
    min: -1,
    max: 1,
    palette: ['144E2D' ,'628973', 'B1C4B9', 'D8E2DC']
  };
  // Tambahkan NDWI ke peta
  Map.addLayer(ndwi00, ndwiVis, 'NDWI');
  // Ekspor
  Export.image.toDrive({
    image: ndwi00,
    description: 'NDWI_2021',
    folder: 'GEE',
    fileNamePrefix: 'NDWI_2021',
    region: pesisir,  
    scale: 30,  
    crs: 'EPSG:4326', 
  });
  
  // Otsu Thresholding
  var OtsuTh = require('users/gena/packages:thresholding');
    // Otsu Parameters
    var scale = 30;
    var bounds = pesisir;
    var cannyThreshold = 0.5;
    var cannySigma = 2;
    var minValue = 0;
    // Threshold
    var th = OtsuTh.computeThresholdUsingOtsu(
      ndwi00, scale, bounds, cannyThreshold, cannySigma, minValue);
    //Membuat citra Perairan-Daratan menggukana Otsu Threshold
    var water00 = ndwi00.gt(th).rename('water00');
  return water00;
};

// Menampilkan Seluruh Badan Air
var water00 = detectWater00(landsat8);
Map.addLayer(water00, {
  min: 0, 
  max: 1, 
  palette: ['black', 'white']
},'2021 Land-Water All', false);
// Ekspor
Export.image.toDrive({
    image: water00,
    description: 'Land_Water_2021',
    folder: 'GEE',
    fileNamePrefix: 'Land_Water_2021',
    region: pesisir,  
    scale: 30,  
    crs: 'EPSG:4326', 
  });

//Resolusi Vektor Garis Pantai (dalam Meter)
var VectorResolution = 30;
//Nilai ambang batas untuk menghapus badan air di darat dan pulau kecil (dalam Meter).
// tergantung luas aoi, jika semakin kecil, ambangnaya dibuat kecil juga
//Jika terdapat badan air yang besar di sekitar pantai, nilai bisa dipebesar.
var WaterBody = 1500;
//jika ada daratan yang terpisah sebesar 1,5km
var smallIsland = 1500;

//Fungsi untuk menghapus badan air di darat dan pulau kecil
function removeInlandWaterAndIslands00(waterImage) {
  
//Mereduksi Komponen Terhubung menggunkan citra interger
  waterImage = waterImage.int();
  //Menentukan lingkungan berdasarkan parameter yang sudah ditetapkan
  var connectedPixelsLand = ee.Number(WaterBody)
    .divide(VectorResolution).int();
  var connectedPixelsWater = ee.Number(smallIsland)
    .divide(VectorResolution).int();
//Menghapus badan air di darat
  var landFilled = waterImage.addBands(waterImage)
   .reduceConnectedComponents(
     ee.Reducer.median(), 'water00', connectedPixelsLand)
   .unmask(99).eq(99).and(waterImage.neq(0));
//Menghapus pulau-pulau kecil  
  var waterFilled = landFilled.addBands(landFilled)
    .reduceConnectedComponents(
      ee.Reducer.median(), 'water00_1', connectedPixelsWater)
    .unmask(99).eq(99).and(landFilled.neq(1));   
//Batas Perairan dan Daratan 
  return waterFilled;
}

//Menghapus pulau-pulau kecil  
var Boundary00 = removeInlandWaterAndIslands00(water00);
Map.addLayer(Boundary00, {
  min:0,
  max:1,
  palette: ['black', 'white']
}, '2014 Land-Water Remove', true);
// Ekspor
Export.image.toDrive({
    image: Boundary00,
    description: 'Land_Water_Remove_2021',
    folder: 'GEE',
    fileNamePrefix: 'Land_Water_Remove_2021',
    region: pesisir,
    scale: 30,
    crs: 'EPSG:4326',
  });

//Konversi Raster Menjadi Vektor (Polygon)
var Coastline00 = ee.Image(Boundary00).selfMask().reduceToVectors({
    
    geometry: pesisir,
    scale: VectorResolution,
    eightConnected: true,
    maxPixels: 1e20,
    tileScale: 16
  });
//Menampilkan Layer Garis Pantai ke Display Map
Map.addLayer(Coastline00, {
  color: 'yellow'
}, '2021 Land-Water (Vector)', false);

//Konversi Raster Menjadi Vektor (Polyline)
var ExtractCoastline = function(vectors){
  //Menyederhankan Vektor
  var CLVectors = vectors.map(function(f) {
    var coordinate = f.geometry()
      .simplify({maxError: VectorResolution})
      .coordinates();
//Menambahkan buffer untuk menghindari rasterisasi poligon batas air dan darat
    var buffer = ee.Number(
      VectorResolution).multiply(-1);
    return f
      .setGeometry(
        ee.Geometry.MultiLineString(coordinate)
          .intersection(pesisir.buffer(buffer)));
  });
  return CLVectors;
};

//Menampilkan Garis Pantai ke Display Map
var CoastlineVector00 = ExtractCoastline(Coastline00);
Map.addLayer(CoastlineVector00, {
  color: 'yellow'
}, 

'2021 Shoreline');
//Ekspor
Export.table.toDrive({
  collection: CoastlineVector00,
  description: 'MGaris_Pantai_Jateng_2021',
  folder: 'GEE',
  fileFormat: 'SHP'});