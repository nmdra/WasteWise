# How to Add Assets to WasteWise

This guide explains how to add the required image assets for your WasteWise app.

## Required Assets

The app requires the following image files in this directory:

### 1. App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Purpose**: Main app icon shown on device home screen
- **Guidelines**: 
  - Should be square
  - No transparency recommended
  - Simple, recognizable design
  - Consider using a recycling or waste bin symbol

### 2. Splash Screen (`splash.png`)
- **Size**: 1242x2436 pixels (or similar aspect ratio)
- **Format**: PNG
- **Purpose**: Shown while app is loading
- **Guidelines**:
  - Can include app logo and name
  - Keep it simple
  - Background color should match your theme

### 3. Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Android adaptive icon (for different shapes)
- **Guidelines**:
  - Important content in center 66% (safe zone)
  - Transparent background recommended
  - Will be masked to different shapes

### 4. Favicon (`favicon.png`)
- **Size**: 48x48 pixels or larger
- **Format**: PNG
- **Purpose**: Web browser tab icon
- **Guidelines**:
  - Should be recognizable at small sizes
  - Can be simplified version of main icon

### 5. Notification Icon (`notification-icon.png`)
- **Size**: 96x96 pixels
- **Format**: PNG
- **Purpose**: Android notification icon
- **Guidelines**:
  - Should be white silhouette on transparent background
  - Simple, clear design
  - Will be tinted by Android system

## Quick Creation Methods

### Method 1: Online Tools (Easiest)
Use online icon generators:
1. Visit https://icon.kitchen/ or similar
2. Upload your logo or create icon
3. Select "Expo" as platform
4. Download the generated asset pack
5. Extract files to this directory

### Method 2: Design Software
Using Figma, Sketch, or Photoshop:
1. Create a 1024x1024 canvas
2. Design your icon
3. Export at required sizes
4. Save files with exact names as listed above

### Method 3: Simple Placeholder (Development)
Quick placeholders for testing:

**Using ImageMagick (if installed):**
```bash
# Create basic colored squares
convert -size 1024x1024 xc:#10b981 icon.png
convert -size 1242x2436 xc:#10b981 splash.png
convert -size 1024x1024 xc:#10b981 adaptive-icon.png
convert -size 48x48 xc:#10b981 favicon.png
convert -size 96x96 xc:#10b981 notification-icon.png
```

**Or download placeholder images:**
1. Go to https://placeholder.com/
2. Generate images at required sizes
3. Rename to match required names
4. Use temporarily for development

## Design Recommendations

### Color Scheme
Match the app's theme:
- **Primary Green**: #10b981
- **Background**: #ffffff
- **Accent**: #3b82f6

### Icon Concepts
Consider these themes for your icon:
- ♻️ Recycling symbol
- 🗑️ Waste bin with lid
- 🌱 Plant/leaf for eco-friendly theme
- 📅 Calendar with recycling symbol
- 🏠 House with recycling symbol

### Design Tips
- Keep it simple and recognizable
- Use 2-3 colors maximum
- Ensure good contrast
- Test at small sizes (48x48)
- Avoid fine details that won't be visible

## File Checklist

Before building for production, ensure you have:

- [ ] `icon.png` (1024x1024)
- [ ] `splash.png` (1242x2436 or similar)
- [ ] `adaptive-icon.png` (1024x1024)
- [ ] `favicon.png` (48x48+)
- [ ] `notification-icon.png` (96x96)

## Verification

After adding files, verify them:

1. **Check file names** (must be exact, lowercase)
2. **Check dimensions** (use image viewer or tool)
3. **Check format** (PNG required)
4. **Test in app**:
   ```bash
   expo start
   ```
5. **Build and test**:
   ```bash
   expo build:android
   # or
   expo build:ios
   ```

## Common Issues

### Issue: Assets not showing
- Verify file names are exact (case-sensitive on some systems)
- Clear Expo cache: `expo start -c`
- Check file formats (must be PNG)

### Issue: Icon looks blurry
- Ensure you're using correct dimensions
- Don't upscale smaller images
- Use vector graphics when possible, then export

### Issue: Android notification icon not showing
- Must be white silhouette on transparent background
- Remove any colors from the icon
- Simplify the design

## Example Icon Creation (Figma)

1. Create 1024x1024 frame
2. Add circle or rounded square (800x800, centered)
3. Fill with #10b981
4. Add recycling symbol or leaf icon (white)
5. Add text "WW" if desired
6. Export as PNG at 1x, 2x, 3x
7. Use appropriate sizes for each asset

## Resources

- **Icon generators**: 
  - https://icon.kitchen/
  - https://www.appicon.co/
  - https://makeappicon.com/

- **Free icons**:
  - https://www.flaticon.com/
  - https://icons8.com/
  - https://www.iconfinder.com/

- **Design inspiration**:
  - https://dribbble.com/search/recycling-app-icon
  - https://www.behance.net/search/projects/app%20icon

## Need Help?

If you need assistance:
1. Check Expo documentation: https://docs.expo.dev/guides/app-icons/
2. Ask in project issues on GitHub
3. Use placeholder images for development

---

**Note**: The app will work in development without these assets, but they are required for production builds submitted to app stores.
