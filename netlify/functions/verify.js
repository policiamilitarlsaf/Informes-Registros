exports.handler = async (event) => {
  // Verificar la cookie de autenticación
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
  
  return {
    statusCode: 200,
    body: 'Autorizado'
  };
};