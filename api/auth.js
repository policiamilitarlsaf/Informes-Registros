// api/auth.js - Código completo y corregido
const { URL } = require('url');

module.exports = async (req, res) => {
  try {
    const baseUrl = `https://${req.headers.host}`;
    const url = new URL(req.url, baseUrl);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    console.log('Solicitud recibida:', pathname);
    
    // Ruta principal - redirige a Discord OAuth
    if (pathname === '/api/auth') {
      console.log('Redirigiendo a Discord OAuth');
      const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
      const REDIRECT_URI = `${baseUrl}/api/auth/callback`;
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
      
      res.writeHead(302, { Location: discordAuthUrl });
      return res.end();
    }
    
    // Callback de OAuth
    if (pathname === '/api/auth/callback') {
      console.log('Procesando callback de OAuth');
      const code = searchParams.get('code');
      
      if (!code) {
        console.error('No se proporcionó código de autorización');
        res.writeHead(302, { Location: '/login.html?error=' + encodeURIComponent('Código de autorización no proporcionado') });
        return res.end();
      }
      
      try {
        // Intercambiar código por token de acceso
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${baseUrl}/api/auth/callback`,
            scope: 'identify guilds guilds.members.read',
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Error al obtener token:', errorText);
          throw new Error('Error al obtener token de acceso');
        }
        
        const tokenData = await tokenResponse.json();
        
        // Obtener información del usuario
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (!userResponse.ok) {
          throw new Error('Error al obtener información del usuario');
        }
        
        const userData = await userResponse.json();
        
        // Obtener información de membresía del servidor
        const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/390267426157101064/member`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        // Si el usuario no está en el servidor
        if (memberResponse.status === 404) {
          res.writeHead(302, { Location: '/login.html?error=' + encodeURIComponent('No estás en el servidor requerido') });
          return res.end();
        }
        
        if (!memberResponse.ok) {
          throw new Error('Error al verificar membresía del servidor');
        }
        
        const memberData = await memberResponse.json();
        
        // Verificar si el usuario tiene el rol requerido
        const ALLOWED_ROLE_ID = '754043321349046435';
        const hasRequiredRole = memberData.roles && memberData.roles.includes(ALLOWED_ROLE_ID);
        
        if (!hasRequiredRole) {
          res.writeHead(302, { Location: '/login.html?error=' + encodeURIComponent('No tienes el rol requerido para acceder. Contacta al administrador.') });
          return res.end();
        }
        
        // Si todo está bien, redirigir al index.html
        res.setHeader('Set-Cookie', 'userAuth=true; Path=/; Secure; SameSite=Lax; Max-Age=3600');
        res.writeHead(302, { Location: '/index.html' });
        return res.end();
        
      } catch (error) {
        console.error('Error en autenticación:', error);
        res.writeHead(302, { Location: '/login.html?error=' + encodeURIComponent('Error en el proceso de autenticación') });
        return res.end();
      }
    }
    
    // Si no es ninguna de las rutas esperadas
    res.statusCode = 404;
    res.json({ error: 'Ruta no encontrada' });
    
  } catch (error) {
    console.error('Error general:', error);
    res.writeHead(302, { Location: '/login.html?error=' + encodeURIComponent('Error en el servidor') });
    res.end();
  }
};
