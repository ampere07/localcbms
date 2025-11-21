# Quick Setup Checklist - Google Maps Integration

## ✅ Files Already Updated
- `frontend/src/pages/LcpNapLocation.tsx` - Main map with Google Maps
- `frontend/src/modals/AddLcpNapLocationModal.tsx` - Coordinate selection modal
- `frontend/src/config/maps.ts` - API key configuration file
- `frontend/src/types/google-maps.d.ts` - TypeScript declarations

## 🔧 What You Need To Do

### 1. Enable Google Maps JavaScript API
Since you already have a Google Cloud project with billing enabled:

1. Go to https://console.cloud.google.com/
2. Select your existing project (the one with Google Drive)
3. Click hamburger menu → **APIs & Services** → **Library**
4. Search for: **"Maps JavaScript API"**
5. Click **ENABLE**

### 2. Create API Key for Maps
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the generated API key

### 3. Restrict API Key (Important for Security)
1. Click on the API key to edit
2. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add:
     ```
     https://atssfiber.ph/*
     https://sync.atssfiber.ph/*
     http://localhost:3000/*
     ```
3. Under **API restrictions**:
   - Select **Restrict key**
   - Check **Maps JavaScript API**
4. Click **SAVE**

### 4. Update Your Code
Edit `frontend/src/config/maps.ts`:
```typescript
export const GOOGLE_MAPS_API_KEY = 'AIzaSyB...your-key-here';
```

### 5. Install TypeScript Types
```bash
cd frontend
npm install --save-dev @types/google.maps
```

### 6. Build and Deploy
```bash
npm run build
```

If build succeeds, deploy to your hosting.

## 🧪 Testing

### Local Testing
```bash
cd frontend
npm start
```
Navigate to LCP/NAP Location page and verify:
- Map loads with Google Maps
- Markers appear at correct locations
- Clicking markers shows info windows
- Clicking map in modal sets coordinates

### Production Testing
After deployment:
1. Visit https://atssfiber.ph/sync/
2. Navigate to LCP/NAP Location page
3. Verify map loads without errors
4. Test adding new location with coordinate selection

## 💰 Cost Information
- **Free Tier**: $200 monthly credit
- **Map Loads**: 28,000 free per month
- **Your Usage**: Likely stays within free tier
- **Monitor**: Google Cloud Console → Billing

## 🔍 Troubleshooting

### Build Error: Type Issue
Already fixed - `google.maps.Symbol` type used correctly.

### Map Not Loading
- Check API key in `maps.ts`
- Verify Maps JavaScript API is enabled
- Check browser console for errors

### "This page can't load Google Maps correctly"
- Verify billing is enabled (you already have this)
- Check API key is correct
- Verify HTTP referrer restrictions include your domain

### Markers Not Appearing
- Check coordinates format: "latitude, longitude"
- Verify coordinates are valid numbers
- Check browser console for errors

## 📝 Important Notes

- Your Google Drive API will continue to work normally
- Maps API uses the same billing account
- You do not need to create a new project
- Both APIs can coexist in the same project
- Monitor usage to stay within free tier

## 📞 Support
If you encounter issues:
1. Check browser console for error messages
2. Verify all steps completed correctly
3. Check Google Cloud Console for API status
4. Review error messages for specific issues

---

**Total Time**: ~10 minutes
**Difficulty**: Easy (since you already have Google Cloud setup)
**Cost**: Free (with $200 monthly credit)
