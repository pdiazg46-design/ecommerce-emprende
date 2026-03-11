const fs = require('fs');

try {
  const content = fs.readFileSync('.next/server/pages/500.html', 'utf8');
  console.log('500 html detectado (es normal en error 500 genérico)');
} catch(e) {
  console.log('No 500.html estático.');
}

console.log('Prisma files en raiz:');
try {
  const files = fs.readdirSync('node_modules/.prisma/client');
  console.log(files);
} catch(e) {
  console.log('No se pudo leer node_modules/.prisma/client');
}
