const fetch = require('node-fetch');

// Configuración - Reemplaza con tus valores
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.SITE_URL + '/.netlify/functions/auth/callback';
const SERVER_ID = '390267426157101064'; // Reemplaza con el ID del servidor
const ALLOWED_ROLE_ID = '754043321349046435'; // Reemplaza con el ID del rol requerido

exports.handler = async (event) => {
  const path = event.path.replace(/\/\.netlify\/functions\/[^/]*\//, '');
  const parts = path.split('/');
  
  // Ruta principal - redirige a Discord OAuth
  if (event.path.endsWith('/auth')) {
    return {
      statusCode: 302,
      headers: {
        Location: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`
      }
    };
  }
  
  // Callback de OAuth
  if (event.path.endsWith('/auth/callback')) {
    const code = event.queryStringParameters.code;
    
    if (!code) {
      return {
        statusCode: 302,
        headers: {
          Location: `/login.html?error=${encodeURIComponent('Código de autorización no proporcionado')}`
        }
      };
    }
    
    try {
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
      
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Error al obtener token');
      }
      
      // Obtener información del usuario
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error('Error al obtener información del usuario');
      }
      
      // Obtener información de membresía del servidor
      const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${SERVER_ID}/member`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      // Si el usuario no está en el servidor
      if (memberResponse.status === 404) {
        return {
          statusCode: 302,
          headers: {
            Location: `/login.html?error=${encodeURIComponent('No estás en el servidor requerido')}`
          }
        };
      }
      
      if (!memberResponse.ok) {
        throw new Error('Error al verificar membresía del servidor');
      }
      
      const memberData = await memberResponse.json();
      
      // Verificar si el usuario tiene el rol requerido
      if (!memberData.roles || !memberData.roles.includes(ALLOWED_ROLE_ID)) {
        return {
          statusCode: 302,
          headers: {
            Location: `/login.html?error=${encodeURIComponent('No tienes el rol requerido para acceder')}`
          }
        };
      }
      
      // Si todo está bien, redirigir al index.html
      // Podrías establecer una cookie o usar otro método para mantener la sesión
      return {
        statusCode: 302,
        headers: {
          Location: '/index.html',
          'Set-Cookie': `userAuth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
        }
      };
      
    } catch (error) {
      console.error('Error en autenticación:', error);
      return {
        statusCode: 302,
        headers: {
          Location: `/login.html?error=${encodeURIComponent('Error en el proceso de autenticación')}`
        }
      };
    }
  }
  
  return {
    statusCode: 404,
    body: 'Ruta no encontrada'
  };
};