const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://npobomswhswnhnvpcgna.supabase.co';
// Usa la llave maestra anon/service_role ya que storage API a veces es caprichosa
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb2JvbXN3aHN3bmhudnBjZ25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDE0NTcsImV4cCI6MjA4NzExNzQ1N30.1iWnt5OrUtNob3FcSjKyXIGx__pATy6MYOReQvREzHs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
  console.log('Verificando bucket "ecommerce-products"...');
  
  // 1. Obtener lista actual
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const exists = buckets.find(b => b.name === 'ecommerce-products');

  // 2. Crear si no existe
  if (!exists) {
    console.log('Bucket inactivo. Procediendo a crear ecommerce-products...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('ecommerce-products', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (createError) {
       console.error('⛔ Error creando bucket, asegúrate de tener permisos RLS (Si dice new row violates row-level security policy):', createError.message);
    } else {
       console.log('✅ Bucket "ecommerce-products" CREADO EXITOSAMENTE y es PÚBLICO.');
    }
  } else {
    console.log('✅ El Bucket "ecommerce-products" ya existe.');
  }
}

setupBucket();
