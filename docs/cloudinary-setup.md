# Cloudinary Image Upload Setup

## Overview

The application now uses Cloudinary for image uploads for both **Sports/Services** and **Profile Images**.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### How to Get Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Settings
3. Copy:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## Features Implemented

### 1. Sports/Service Images
- ✅ Image upload in admin service form
- ✅ Images stored in Cloudinary folder: `riyam/sports`
- ✅ Images displayed in:
  - Admin services page
  - Customer booking page
  - Service detail pages
- ✅ Image optimization (800x600, auto quality/format)

### 2. Profile Images
- ✅ Image upload in profile edit form
- ✅ Image upload in complete profile form
- ✅ Images stored in Cloudinary folder: `riyam/profiles`
- ✅ Images displayed in user profiles
- ✅ Image optimization (400x400, auto quality/format)

## Database Changes

### Migration: `016_add_service_image_url.sql`
- Added `image_url` column to `services` table
- Type: `TEXT` (nullable)

## Components Created

### 1. `components/ui/image-upload.tsx`
- Reusable image upload component
- Supports both `profile` and `service` types
- Features:
  - File validation (image types, max 5MB)
  - Preview before upload
  - Remove image option
  - Loading states
  - Error handling

### 2. `app/api/upload/route.ts`
- API route for handling image uploads
- Validates user authentication
- Checks admin permissions for service images
- Uploads to Cloudinary with optimization

### 3. `lib/cloudinary.ts`
- Cloudinary configuration
- Centralized setup for all uploads

## Updated Components

1. **`components/admin/service-form.tsx`**
   - Added `ImageUpload` component
   - Handles `image_url` in form submission

2. **`components/profile-edit-form.tsx`**
   - Replaced URL input with `ImageUpload` component
   - Uses Cloudinary for uploads

3. **`components/complete-profile-form.tsx`**
   - Replaced URL input with `ImageUpload` component
   - Uses Cloudinary for uploads

4. **`app/admin/services/page.tsx`**
   - Displays service images in the list

5. **`components/book-location-selector.tsx`**
   - Displays service images on booking page

6. **`app/book/[location]/[service]/page.tsx`**
   - Displays service image on detail page

7. **`app/book/[location]/page.tsx`**
   - Displays service images in service cards

## Image Storage Structure

```
Cloudinary:
├── riyam/
│   ├── sports/          # Service images
│   │   └── [auto-generated-name].jpg
│   └── profiles/        # Profile images
│       └── [auto-generated-name].jpg
```

## Image Optimization

All images are automatically optimized:
- **Service images**: 800x600px, auto quality, auto format
- **Profile images**: 400x400px, auto quality, auto format
- Cloudinary automatically serves WebP when supported
- Responsive delivery based on device

## Usage

### For Admins - Adding Service Images

1. Go to `/admin/services`
2. Click "Edit" on a service or "+ Add Service"
3. In the form, use the "Service Image" upload field
4. Select an image file (max 5MB)
5. Image uploads automatically to Cloudinary
6. Save the service

### For Users - Adding Profile Images

1. Go to `/profile` or `/complete-profile`
2. Use the "Profile Image" upload field
3. Select an image file (max 5MB)
4. Image uploads automatically to Cloudinary
5. Save profile

## Security

- ✅ Authentication required for all uploads
- ✅ Admin-only access for service images
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Secure Cloudinary API keys (server-side only)

## Next Steps

1. **Set up Cloudinary account** and add credentials to `.env.local`
2. **Run migration**: Apply `016_add_service_image_url.sql`
3. **Test uploads**: Try uploading images in admin panel and profile

## Troubleshooting

### Images not uploading?
- Check Cloudinary credentials in `.env.local`
- Verify API keys are correct (especially `CLOUDINARY_API_SECRET`)
- Check browser console and server logs for errors
- Ensure all three environment variables are set:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Upload fails with "Invalid Signature" error?
- **Most common issue**: Wrong `CLOUDINARY_API_SECRET` in `.env.local`
- Double-check the API Secret from Cloudinary Dashboard
- Ensure there are no extra spaces or quotes in the `.env.local` file
- Restart your development server after updating `.env.local`

### Images not displaying?
- Verify `next.config.ts` includes `res.cloudinary.com` in `remotePatterns`
- Check image URLs in database
- Verify Cloudinary folder structure

### Upload fails with "Unauthorized"?
- Ensure user is logged in
- For service images, ensure user is admin/sub-admin
- Check authentication middleware

### Environment Variables Not Loading?
- Make sure `.env.local` is in the project root (same level as `package.json`)
- Restart the Next.js dev server after adding/updating environment variables
- Never commit `.env.local` to git (it should be in `.gitignore`)

