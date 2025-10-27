import { FILE_LIMITS } from '../config/constants';

// Image validation
export const validateImage = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('Please select an image file');
    return { isValid: false, errors };
  }
  
  // Check file type
  if (!FILE_LIMITS.IMAGE.ACCEPTED_TYPES.includes(file.type)) {
    errors.push('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
  }
  
  // Check file size
  if (file.size > FILE_LIMITS.IMAGE.MAX_SIZE) {
    const maxSizeMB = FILE_LIMITS.IMAGE.MAX_SIZE / (1024 * 1024);
    errors.push(`Image size must be less than ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create image preview URL
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Load image from file
export const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Get image dimensions
export const getImageDimensions = async (file) => {
  try {
    const img = await loadImage(file);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight
    };
  } catch (error) {
    throw new Error('Failed to get image dimensions');
  }
};

// Resize image
export const resizeImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;
  
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let { width, height } = img;
      
      // Maintain aspect ratio while fitting within max dimensions
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, {
            type: format,
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, format, quality);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Create thumbnail
export const createThumbnail = (file, size = 150) => {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'image/jpeg'
  });
};

// Compress image
export const compressImage = (file, quality = 0.8) => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, 'image/jpeg', quality);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Crop image
export const cropImage = (file, cropArea) => {
  const { x, y, width, height } = cropArea;
  
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(
        img,
        x, y, width, height, // Source rectangle
        0, 0, width, height  // Destination rectangle
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to crop image'));
        }
      }, file.type, 0.9);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Apply filter to image
export const applyImageFilter = (file, filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Apply CSS filter to canvas context
      ctx.filter = filter;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to apply filter'));
        }
      }, file.type, 0.9);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Extract colors from image
export const extractImageColors = (file, colorCount = 5) => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use smaller canvas for performance
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      
      const colorMap = new Map();
      
      // Sample pixels and count colors
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alpha = pixels[i + 3];
        
        // Skip transparent pixels
        if (alpha < 128) continue;
        
        // Round colors to reduce variations
        const roundedR = Math.round(r / 10) * 10;
        const roundedG = Math.round(g / 10) * 10;
        const roundedB = Math.round(b / 10) * 10;
        
        const colorKey = `${roundedR},${roundedG},${roundedB}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
      
      // Sort colors by frequency and return top colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, colorCount)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return {
            rgb: `rgb(${r}, ${g}, ${b})`,
            hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          };
        });
      
      resolve(sortedColors);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Convert image to different format
export const convertImageFormat = (file, format, quality = 0.9) => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // For PNG conversion, use white background
      if (format === 'image/png') {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const extension = format.split('/')[1];
          const newFileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
          
          resolve(new File([blob], newFileName, {
            type: format,
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, format, quality);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Create image collage
export const createCollage = (files, options = {}) => {
  const {
    width = 800,
    height = 600,
    padding = 10,
    backgroundColor = '#ffffff'
  } = options;
  
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;
      
      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      const images = await Promise.all(files.map(loadImage));
      
      // Simple grid layout
      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      
      const cellWidth = (width - (padding * (cols + 1))) / cols;
      const cellHeight = (height - (padding * (rows + 1))) / rows;
      
      images.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = padding + col * (cellWidth + padding);
        const y = padding + row * (cellHeight + padding);
        
        // Draw image maintaining aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = cellWidth;
        let drawHeight = cellHeight;
        
        if (aspectRatio > cellWidth / cellHeight) {
          drawHeight = cellWidth / aspectRatio;
        } else {
          drawWidth = cellHeight * aspectRatio;
        }
        
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + (cellHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'collage.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to create collage'));
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Add watermark to image
export const addWatermark = (file, watermarkText, options = {}) => {
  const {
    fontSize = 20,
    fontFamily = 'Arial',
    color = 'rgba(255, 255, 255, 0.8)',
    position = 'bottom-right',
    padding = 20
  } = options;
  
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      ctx.drawImage(img, 0, 0);
      
      // Set up text styling
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'bottom';
      
      const textMetrics = ctx.measureText(watermarkText);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      // Calculate position
      let x, y;
      switch (position) {
        case 'top-left':
          x = padding;
          y = padding + textHeight;
          break;
        case 'top-right':
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - padding;
          break;
        case 'bottom-right':
        default:
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height + textHeight) / 2;
          break;
      }
      
      ctx.fillText(watermarkText, x, y);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to add watermark'));
        }
      }, file.type, 0.9);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Get image metadata
export const getImageMetadata = async (file) => {
  try {
    const dimensions = await getImageDimensions(file);
    const colors = await extractImageColors(file, 3);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      dimensions,
      dominantColors: colors,
      aspectRatio: dimensions.aspectRatio,
      isLandscape: dimensions.width > dimensions.height,
      isPortrait: dimensions.height > dimensions.width,
      isSquare: Math.abs(dimensions.width - dimensions.height) < 50
    };
  } catch (error) {
    throw new Error('Failed to extract image metadata');
  }
};

export default {
  validateImage,
  createImagePreview,
  loadImage,
  getImageDimensions,
  resizeImage,
  createThumbnail,
  compressImage,
  cropImage,
  applyImageFilter,
  extractImageColors,
  convertImageFormat,
  createCollage,
  addWatermark,
  getImageMetadata
};
