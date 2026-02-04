import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/sub-admin for service images, or allow profile images
    const formData = await request.formData();
    const uploadType = formData.get('type') as string; // 'profile' or 'service'
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // For service images, require admin access
    if (uploadType === 'service' && !(await isAdminOrSubAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    // Upload without transformations to avoid signature issues
    // Transformations will be applied via URL when displaying images
    const folder = uploadType === 'service' ? 'riyam/sports' : 'riyam/profiles';
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'image',
      // Apply basic optimization without complex transformations
      quality: 'auto',
      fetch_format: 'auto',
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Provide more detailed error messages
    if (error?.http_code === 401) {
      return NextResponse.json(
        { error: 'Cloudinary authentication failed. Please check your API credentials in .env.local' },
        { status: 500 }
      );
    }
    
    if (error?.message) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload image. Please check your Cloudinary configuration.' },
      { status: 500 }
    );
  }
}

