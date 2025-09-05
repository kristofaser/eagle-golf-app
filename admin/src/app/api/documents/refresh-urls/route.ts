import { NextRequest, NextResponse } from 'next/server';
import { refreshIdentityDocumentUrls } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { frontUrl, backUrl } = await request.json();
    
    const refreshedUrls = await refreshIdentityDocumentUrls(frontUrl, backUrl);
    
    return NextResponse.json({
      success: true,
      data: refreshedUrls
    });
    
  } catch (error) {
    console.error('Erreur refresh URLs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du rafraîchissement des URLs' 
      },
      { status: 500 }
    );
  }
}