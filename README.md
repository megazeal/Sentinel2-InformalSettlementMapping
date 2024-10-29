# Mapping Informal Settlements Using Machine Learning and Remote Sensing

## Project Information

**Author:**
- Courage Kumawu
  
**Supervisor:**
Dr. Yaw Mensah Asare, Kwame Nkrumah University of Science and Technology

## Overview

This project evaluates and compares pixel-based and object-based classification techniques for mapping informal settlements in Greater Kumasi using Sentinel-2 satellite imagery. The project involves applying cloud-masking and machine learning methods, specifically Random Forest, to classify the settlements. Both object-based and pixel-based techniques are utilized, and their performance metrics, such as accuracy, precision, recall, and F1-score, are computed and compared.

## Research Objectives

1. Classify informal settlements using a pixel-based classification approach.
2. Classify informal settlements using an object-based classification approach.
3. Compare and assess the accuracy of pixel-based vs object-based methods.

## Methodology

### Data Processing Steps

1. **Image Collection and Filtering**
   - Filter Sentinel-2 imagery for the area of interest (AOI)
   - Apply date range and cloud coverage filters
   - Implement cloud masking using SWIR1 and SWIR2 bands

2. **Cloud Masking**
   - Apply threshold values to identify clouds:
     - SWIR1 threshold: 0.15
     - SWIR2 threshold: 0.1
   - Create and apply cloud masks to filtered images

3. **Image Preparation**
   - Compute median values of cloud-masked images
   - Clip images to study area boundaries
   - Prepare bands for classification

4. **Classification Approaches**

   a) **Object-Based Classification**
   - Generate segmentation seeds
   - Apply SNIC algorithm for image segmentation
   - Parameters:
     - Size: 10
     - Compactness: 0
     - Connectivity: 8
     - Neighborhood Size: 500

   b) **Pixel-Based Classification**
   - Direct classification of pixels
   - Use of spectral bands (B2, B3, B4, B8)

5. **Machine Learning**
   - Random Forest classifier with 50 trees
   - Training data split: 80% training, 20% validation
   - Features used: B2, B3, B4, B8 bands

## Implementation Options

### 1. Google Earth Engine JavaScript Implementation

```javascript
// Filter Sentinel-2 data
var filtered_image1 = sent2.filterBounds(aoi)
  .filterDate('2023-01-01', '2023-06-30')
  .filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 1);

// Cloud masking function
function maskClouds(image) {
  var swir1 = image.select('B11');
  var swir2 = image.select('B12');
  var cloudMask = swir1.lt(0.15).and(swir2.lt(0.1));
  return image.updateMask(cloudMask.not());
}

// Main classification workflow
// [Rest of JavaScript implementation...]
```

### 2. Python Implementation using geemap

```python
import ee
import geemap

# Initialize Earth Engine
ee.Authenticate()
ee.Initialize()

# Create interactive map
Map = geemap.Map()

# Filter Sentinel-2 data
filtered_image1 = (ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(aoi)
    .filterDate('2023-01-01', '2023-06-30')
    .filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 1))

# Cloud masking function
def maskClouds(image):
    swir1 = image.select('B11')
    swir2 = image.select('B12')
    cloudMask = swir1.lt(0.15).And(swir2.lt(0.1))
    return image.updateMask(cloudMask.Not())

# Main classification workflow
# [Rest of Python implementation...]
```

## Setup and Installation

### Prerequisites
- Google Earth Engine account
- Python 3.7 or higher (for geemap implementation)
- Git (for version control)

### JavaScript Implementation Setup
1. Access Google Earth Engine Code Editor
2. Copy and paste the JavaScript code
3. Set up your study area and training data
4. Run the analysis

### Python/geemap Setup
1. Install required packages:
   ```bash
   pip install geemap earthengine-api jupyter
   ```

2. Authentication:
   ```python
   import ee
   ee.Authenticate()
   ee.Initialize()
   ```

3. Run Jupyter Notebook:
   ```bash
   jupyter notebook
   ```

## Results

### Accuracy Assessment
- Object-based classification outperformed pixel-based classification:
  - Object-Based Accuracy: 95.70%
  - Pixel-Based Accuracy: 93.25%

### Visual Results

#### Pixel-Based Classification
<p align="center">
  <img src="pixel-basedmap.png" alt="Pixel-Based Classification Map" width="600">
</p>
<p align="center"><em>Figure 1: Pixel-Based Classification of Informal Settlements in Greater Kumasi</em></p>

#### Object-Based Classification
<p align="center">
  <img src="object-basedmap.png" alt="Object-Based Classification Map" width="600">
</p>
<p align="center"><em>Figure 2: Object-Based Classification of Informal Settlements in Greater Kumasi</em></p>

## File Structure

```
informal-settlements-mapping/
├── README.md
├── code/
│   ├── classification_code.js
│   └── classification_code.py
├── data/
│   ├── training_points/
│   └── validation_points/
├── results/
│   ├── accuracy_measures.csv
│   ├── object-basedmap.png
│   └── pixel-basedmap.png
└── requirements.txt
```

## Usage Guidelines

### Data Preparation
1. Prepare training points for different land cover classes:
   - Informal settlements
   - Formal settlements
   - Vegetation
   - Bare land
   - Water bodies

2. Ensure training points are labeled with the 'classes' attribute

### Running the Analysis

#### JavaScript Version
1. Open Google Earth Engine Code Editor
2. Load your training points as feature collections
3. Set your area of interest (AOI)
4. Run the classification
5. Export results to Google Drive

#### Python/geemap Version
1. Open Jupyter Notebook
2. Run the classification script
3. Use interactive map for visualization
4. Export results using geemap functions

## Interactive Features (geemap)

The geemap implementation provides:
- Interactive map visualization
- Layer opacity control
- Base map selection
- Export capabilities
- Interactive drawing tools for training data collection

## Exported Files

Both implementations export:
- Classified images (GeoTIFF)
- Accuracy metrics (CSV)
- Confusion matrices
- Visualization maps

## Troubleshooting

Common Issues and Solutions:
1. Memory Errors
   - Reduce the size of your study area
   - Increase the scale parameter
   - Use smaller time ranges for image collection

2. Authentication Issues
   - Ensure proper GEE authentication
   - Check internet connection
   - Verify account permissions

3. Export Errors
   - Check export region size
   - Verify drive permissions
   - Adjust maxPixels parameter

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Earth Engine team
- geemap developers
- Kwame Nkrumah University of Science and Technology

## Contact

Courage Kumawu - [couragezeal544@gmail.com]

