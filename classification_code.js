// Step 1: Filter Sentinel-2 data for the specified area of interest (AOI), time range, and cloud coverage
var filtered_image1 = sent2.filterBounds(aoi) // Filter by geographic area (AOI)
  .filterDate('2023-01-01', '2023-06-30') // Filter data from January to June 2023
  .filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 1); // Exclude images with more than 1% cloud coverage

// Step 2: Function to mask clouds and shadows using the SWIR1 and SWIR2 bands
function maskClouds(image) {
  // Select SWIR1 and SWIR2 bands
  var swir1 = image.select('B11');
  var swir2 = image.select('B12');
  
  // Define threshold values to identify clouds based on SWIR reflectance
  var swir1_threshold = 0.15; // SWIR1 cloud threshold (customizable)
  var swir2_threshold = 0.1;  // SWIR2 cloud threshold (customizable)
  
  // Create a mask to detect cloud pixels by comparing reflectance values to the thresholds
  var cloudMask = swir1.lt(swir1_threshold).and(swir2.lt(swir2_threshold));
  
  // Return the masked image, excluding clouds, while keeping original properties
  return image.updateMask(cloudMask.not()).copyProperties(image, ["system:time_start"]);
}

// Apply cloud mask to the filtered images
var filtered_image2 = filtered_image1.map(maskClouds); // Map the maskClouds function over the image collection

// Step 3: Compute the median of the cloud-masked images to reduce noise and improve quality
var filtered_image = filtered_image2.median(); // Get the median composite of the image collection

// Step 4: Clip the image to the study area (shape)
var clippedimage = filtered_image.clip(shape); // Clip the image to the boundaries of the AOI

// Step 5: Segmentation - Create seeds for the segmentation process
var seeds = ee.Algorithms.Image.Segmentation.seedGrid(20); // Create a grid of seeds spaced 20 pixels apart

// Apply the SNIC (Simple Non-Iterative Clustering) algorithm for image segmentation
var segmentation = ee.Algorithms.Image.Segmentation.SNIC({
  image: clippedimage, // Input image
  size: 10, // Size of the segments
  compactness: 0, // Compactness of the segments
  connectivity: 8, // Connectivity for segment creation
  neighborhoodSize: 500, // Neighborhood size to use for segmentation
  seeds: seeds // Use predefined seed points for segmentation
}).select(['clusters', 'B2_mean', 'B3_mean', 'B4_mean', 'B8_mean'], 
          ['clusters', 'B2_mean', 'B3_mean', 'B4_mean', 'B8_mean']); // Select bands for segmentation output

// Select important bands and clusters from the segmentation result
var segments = segmentation.select(['clusters', 'B2_mean', 'B3_mean', 'B4_mean', 'B8_mean']);

// Step 6: Prepare training data by merging multiple land cover classes
var training_points = informal_settlements01.merge(formal_settlements01)
  .merge(vegetation01).merge(bare_land01)
  .merge(water01).merge(vegvalidationset)
  .merge(blvalidationset).merge(watvalidationset)
  .merge(infvalidationset).merge(forvalidationset); // Combine multiple feature collections into one

// Sample the segmented image using the training points to create training data
var trainingdata1 = segments.sampleRegions({
  collection: training_points, // Input training points
  properties: ['classes'], // Class labels for training
  tileScale: 16, // Adjust tiling to avoid memory issues
  scale: 10 // Spatial resolution of the sampling (10m)
}).randomColumn({distribution: 'uniform'}); // Add a random column for splitting data into training and validation sets

// Split data into training (80%) and validation (20%) sets
var trainingdata = trainingdata1.filter('random <= 0.8'); // Use 80% for training
var validationdata = trainingdata1.filter('random > 0.2'); // Use 20% for validation

// Step 7: Train a Random Forest classifier with 50 trees
var trainedClassifierorf = ee.Classifier.smileRandomForest(50).train({
  features: trainingdata, // Training dataset
  classProperty: 'classes', // Class label property
  inputProperties: ['clusters', 'B2_mean', 'B3_mean', 'B4_mean', 'B8_mean'] // Input features (bands and clusters)
});

// Classify the segments using the trained Random Forest model
var classifiedorf = segments.classify(trainedClassifierorf); // Apply classifier to segments

// Step 8: Export the classified image to Google Drive
Export.image.toDrive({
  image: classifiedorf, // Classified image
  description: 'objectclassifiednew', // Description for the exported file
  folder: 'GEE_data', // Google Drive folder for export
  fileNamePrefix: 'objectclassifiednew', // Prefix for the output file name
  region: aoi, // Export region (AOI)
  scale: 10, // Export scale (resolution)
  maxPixels: 80000000, // Max number of pixels for the export
  shardSize: 100, // Shard size for splitting large images
  fileFormat: 'GeoTIFF' // Output file format
});

// Step 9: Visualize the classified image on the map
Map.addLayer(classifiedorf, {min: 0, max: 255, palette: 'green,brown,blue,red,yellow'}, 'objectclassifiedorf'); // Add classified layer to the map

// Print classified image band names for debugging
print('classsifiedorf bandnames', classifiedorf.bandNames()); 

// Step 10: Assess the accuracy of the model using training data (resubstitution accuracy)
var trainAccuracyorf = trainedClassifierorf.confusionMatrix(); // Confusion matrix for training data
print('orf Resubstitution error matrix: ', trainAccuracyorf); // Print confusion matrix
print('orf Training overall accuracy: ', trainAccuracyorf.accuracy()); // Print overall accuracy

// Classify validation data and compute accuracy for validation set
var validatedorf = validationdata.classify(trainedClassifierorf, 'classification');
var validationAccuracyorf = validatedorf.errorMatrix('classification', 'classes'); // Validation error matrix
print('Validation orf error matrix: ', validationAccuracyorf); // Print validation confusion matrix
print('Validation orf overall accuracy: ', validationAccuracyorf.accuracy()); // Print validation accuracy

// Step 11: Create features for exporting confusion matrices and accuracies
var confusionMatrixToExportorft = ee.Feature(null, {
  matrix: trainAccuracyorf.array(),
  accuracy: trainAccuracyorf.accuracy()
});

var confusionMatrixToExportorfv = ee.Feature(null, {
  matrix: validationAccuracyorf.array(),
  accuracy: validationAccuracyorf.accuracy()
});

// Step 12: Pixel-Based Classification for comparison
var training_points12 = informal_settlements01.merge(formal_settlements01)
  .merge(vegetation01).merge(bare_land01)
  .merge(water01).merge(vegvalidationset)
  .merge(blvalidationset).merge(watvalidationset)
  .merge(infvalidationset).merge(forvalidationset); // Combine training data for pixel-based classification

var readyimage = clippedimage.select(['B2','B3','B4','B8']); // Select relevant bands for classification

// Sample the image using training points
var trainingdata1 = readyimage.sampleRegions({
  collection: training_points12,
  properties: ['classes'], // Land cover class labels
  scale: 10
}).randomColumn({distribution: 'uniform'}); // Add random column for splitting data

var trainingSampleprf = trainingdata1.filter('random <= 0.8'); // 80% for training
var validationSampleprf = trainingdata1.filter('random > 0.2'); // 20% for validation

// Train Random Forest classifier for pixel-based classification
var trainedClassifierprf = ee.Classifier.smileRandomForest(50).train({
  features: trainingSampleprf,
  classProperty: 'classes', // Class property for pixel-based classification
  inputProperties: ['B2','B3','B4','B8'] // Bands used for training
});

// Classify the image using the trained Random Forest classifier
var classifiedprf = readyimage.classify(trainedClassifierprf); // Apply the classifier to pixels

// Add the pixel-based classified image to the map for visualization
Map.addLayer(classifiedprf, {min: 0, max: 255, palette: 'green,brown,blue,red,yellow'}, 'pixel-based rf Classified Image');

// Step 13: Evaluate training accuracy for pixel-based classification
var trainAccuracyprf = trainedClassifierprf.confusionMatrix(); // Confusion matrix for training set
print('Resubstitution error matrix: ', trainAccuracyprf); // Print confusion matrix
print('Training overall accuracy: ', trainAccuracyprf.accuracy()); // Print accuracy
