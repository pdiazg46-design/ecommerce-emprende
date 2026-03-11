const { execSync } = require('child_process');

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb2JvbXN3aHN3bmhudnBjZ25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDE0NTcsImV4cCI6MjA4NzExNzQ1N30.1iWnt5OrUtNob3FcSjKyXIGx__pATy6MYOReQvREzHs';

console.log('Inyectando llave pura (longitud ' + key.length + ')...');

try {
  execSync('npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes --token="vca_04h8ya8NbFgOlD8FbRbC3CqlW6NNWWRenqvS0EmcREA7zhUqHp45pG5r"');
} catch(e) { /* ignores if not exist */ }

try {
  // Pass input exactly as buffer without newlines
  execSync('npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token="vca_04h8ya8NbFgOlD8FbRbC3CqlW6NNWWRenqvS0EmcREA7zhUqHp45pG5r"', {
    input: Buffer.from(key)
  });
  console.log('¡Llave inyectada con éxito sin retornos de carro!');
} catch(e) {
  console.error('Error inyectando llave:', e.stderr ? e.stderr.toString() : e.message);
}
