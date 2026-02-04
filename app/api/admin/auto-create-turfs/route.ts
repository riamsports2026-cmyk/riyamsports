import { NextRequest, NextResponse } from 'next/server';
import { autoCreateMissingTurfs } from '@/lib/actions/admin/auto-create-turfs';

export async function POST(_request: NextRequest) {
  try {
    const result = await autoCreateMissingTurfs();
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      createdCount: result.createdCount || 0,
      message: `Successfully created ${result.createdCount || 0} turf(s)`,
    });
  } catch (error: any) {
    console.error('Error in auto-create turfs API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create turfs' },
      { status: 500 }
    );
  }
}




