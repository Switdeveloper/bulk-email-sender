// app/api/yelp/route.ts — Yelp Fusion API proxy
import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const term = searchParams.get('term') || 'business'
    const location = searchParams.get('location') || 'New York'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const settings = getSettings()
    const apiKey = settings.yelpApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'YELP_API_KEY not configured. Add it in Settings → Yelp API.' },
        { status: 400 }
      )
    }

    const url = new URL('https://api.yelp.com/v3/businesses/search')
    url.searchParams.set('term', term)
    url.searchParams.set('location', location)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('sort_by', 'rating')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Yelp API key. Check your key in Settings.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: `Yelp API error ${response.status}: ${text}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return simplified business list
    const businesses = (data.businesses || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      email: '', // Yelp doesn't provide emails
      phone: b.display_phone || b.phone || '',
      address: b.location?.address1 || '',
      city: b.location?.city || '',
      state: b.location?.state || '',
      zip: b.location?.zip_code || '',
      country: b.location?.country || '',
      category: b.categories?.[0]?.title || '',
      rating: b.rating || 0,
      reviewCount: b.review_count || 0,
      price: b.price || '',
      distance: b.distance ? `${(b.distance / 1609.34).toFixed(1)} mi` : '',
      website: b.url || '',
      imageUrl: b.image_url || '',
      isClosed: b.is_closed ?? false,
    }))

    return NextResponse.json({
      total: data.total || 0,
      businesses,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}