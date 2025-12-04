import { NextResponse } from 'next/server';

const HONO_API_URL = process.env.HONO_API_URL || 'http://localhost:4000';

export async function GET(request, { params }) {
  const { path } = params;
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const url = `${HONO_API_URL}/${path.join('/')}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const headers = new Headers();
    // Copiar headers relevantes
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { path } = params;
  const url = `${HONO_API_URL}/${path.join('/')}`;
  
  try {
    const body = await request.json();
    
    const headers = new Headers();
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { path } = params;
  const url = `${HONO_API_URL}/${path.join('/')}`;
  
  try {
    const body = await request.json();
    
    const headers = new Headers();
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { path } = params;
  const url = `${HONO_API_URL}/${path.join('/')}`;
  
  try {
    const headers = new Headers();
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
