exports.handler = async (event) => {
  const path = event.path;
  
  // Permitir acceso directo a login.html y a las funciones de Netlify
  if (path === '/login.html' || path.includes('/.netlify/')) {
    return {
      statusCode: 200
    };
  }
  
  // Verificar si el usuario tiene la cookie de autenticación
  const cookies = event.headers.cookie || '';
  const isAuthenticated = cookies.includes('userAuth=true');
  
  if (!isAuthenticated) {
    return {
      statusCode: 302,
      headers: {
        Location: '/login.html'
      }
    };
  }
  
  // Si está autenticado, permitir acceso al contenido estático
  return {
    statusCode: 200
  };
};
