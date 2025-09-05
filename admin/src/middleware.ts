import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchir la session si elle existe
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protéger les routes admin (exclure les API routes)
  const isAdminPage = (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/users') ||
      request.nextUrl.pathname.startsWith('/bookings') ||
      request.nextUrl.pathname.startsWith('/courses') ||
      request.nextUrl.pathname.startsWith('/payments') ||
      request.nextUrl.pathname.startsWith('/analytics') ||
      request.nextUrl.pathname.startsWith('/support') ||
      request.nextUrl.pathname.startsWith('/settings')) &&
      !request.nextUrl.pathname.startsWith('/api');

  // Protéger les routes super admin (nécessite super_admin uniquement)
  const isSuperAdminPage = request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/api');

  // Vérifier d'abord les pages super admin (plus restrictives)
  if (isSuperAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Vérifier le rôle super_admin uniquement avec la nouvelle table admin_profiles
    const { data: superAdminProfile, error: superAdminError } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .single();

    if (superAdminError || !superAdminProfile) {
      console.log('Utilisateur non super admin tenté d\'accéder à /admin:', user.email);
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }
  // Vérifier les pages admin standard (admin OU super_admin)
  else if (isAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Vérifier le profil admin avec la nouvelle table admin_profiles
    const { data: adminProfile, error: roleError } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (roleError || !adminProfile) {
      console.log('Utilisateur non admin tenté d\'accéder:', user.email);
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  // Rediriger vers dashboard si déjà connecté et sur la page de login
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};