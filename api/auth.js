// Configuración
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'https://informes-registros.vercel.app/api/auth/callback';
const SERVER_ID = '390267426157101064';
const ALLOWED_ROLE_ID = '754043321349046435';

export default async function handler(request, response) {
  const { pathname } = new URL(request.url, `https://${request.headers.host}`);
  
  console.log('Solicitud recibida:', pathname);
  
  // Ruta principal - redirige a Discord OAuth
  if (pathname.endsWith('/auth')) {
    console.log('Redirigiendo a Discord OAuth');
    return Response.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`,
      302
    );
  }
  
  // Callback de OAuth
  if (pathname.endsWith('/auth/callback')) {
    console.log('Procesando callback de OAuth');
    const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
    const code = searchParams.get('code');
    
    if (!code) {
      console.error('No se proporcionó código de autorización');
      return Response.redirect(
        `/login.html?error=${encodeURIComponent('Código de autorización no proporcionado')}`,
        302
      );
    }
    
    try {
      console.log('Intercambiando código por token');
      // Intercambiar código por token de acceso
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          scope: 'identify guilds guilds.members.read',
        }),
      });
      
      const tokenData = await tokenResponse.json();
      console.log('Respuesta de token:', tokenData);
      
      if (!tokenResponse.ok) {
        console.error('Error al obtener token:', tokenData);
        throw new Error(tokenData.error_description || 'Error al obtener token');
      }
      
      // Obtener información del usuario
      console.log('Obteniendo información del usuario');
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('Error al obtener información del usuario:', errorText);
        throw new Error('Error al obtener información del usuario');
      }
      
      const userData = await userResponse.json();
      console.log('Datos del usuario:', userData);
      
      // Obtener información de membresía del servidor
      console.log('Verificando membresía del servidor');
      const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${SERVER_ID}/member`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      // Si el usuario no está en el servidor
      if (memberResponse.status === 404) {
        console.error('Usuario no encontrado en el servidor');
        return Response.redirect(
          `/login.html?error=${encodeURIComponent('No estás en el servidor requerido')}`,
          302
        );
      }
      
      if (!memberResponse.ok) {
        const errorText = await memberResponse.text();
        console.error('Error al verificar membresía:', errorText);
        throw new Error('Error al verificar membresía del servidor');
      }
      
      const memberData = await memberResponse.json();
      console.log('Datos de membresía:', memberData);
      console.log('Roles del usuario:', memberData.roles);
      console.log('Rol requerido:', ALLOWED_ROLE_ID);
      
      // Verificar si el usuario tiene el rol requerido
      const hasRequiredRole = memberData.roles && memberData.roles.includes(ALLOWED_ROLE_ID);
      console.log('¿Tiene el rol requerido?', hasRequiredRole);
      
      if (!hasRequiredRole) {
        console.error('Usuario no tiene el rol requerido');
        return Response.redirect(
          `/login.html?error=${encodeURIComponent('No eres miembro de la LSAF. Para acceder al sistema debes ser un miembro activo. Mantente pendiente del canal de reclutamiento para más información.')}`,
          302
        );
      }
      
      // Si todo está bien, redirigir al index.html
      console.log('Autenticación exitosa, redirigiendo a index.html');
      const response = Response.redirect('/index.html', 302);
      response.headers.append('Set-Cookie', 'userAuth=true; Path=/; Secure; SameSite=Lax; Max-Age=3600');
      return response;
      
    } catch (error) {
      console.error('Error en autenticación:', error);
      return Response.redirect(
        `/login.html?error=${encodeURIComponent('Error en el proceso de autenticación: ' + error.message)}`,
        302
      );
    }
  }
  
  console.error('Ruta no encontrada:', pathname);
  return new Response('Ruta no encontrada', { status: 404 });
}
