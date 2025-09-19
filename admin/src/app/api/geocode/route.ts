import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  // Vérifier si on a une clé API Google Maps
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'Google Maps API key not configured',
      message: 'Pour supporter les codes Plus courts, configurez GOOGLE_MAPS_API_KEY dans .env.local'
    }, { status: 500 });
  }

  try {
    // Appeler l'API Google Geocoding
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Erreur API Google Geocoding');
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return NextResponse.json({
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: data.results[0].formatted_address
      });
    } else {
      return NextResponse.json({
        error: 'Aucun résultat trouvé',
        status: data.status
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Erreur geocoding:', error);
    return NextResponse.json({
      error: 'Erreur lors de la géolocalisation'
    }, { status: 500 });
  }
}