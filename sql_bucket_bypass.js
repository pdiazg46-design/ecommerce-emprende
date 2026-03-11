const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBucketBypass() {
   try {
     console.log('1. Forzando Inserción del Bucket en auth.storage...');
     await prisma.$executeRawUnsafe(`
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types) 
        VALUES ('ecommerce-products', 'ecommerce-products', true, false, 5242880, '{"image/png", "image/jpeg", "image/gif", "image/webp"}')
        ON CONFLICT (id) DO UPDATE SET public = true;
     `);
     console.log('✅ Bucket "ecommerce-products" insertado vía SQL.');

     console.log('2. Configuramos Políticas RLS Públicas de Subida y Lectura');
     
     // Política SELECT
     await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Ecommerce' AND tablename = 'objects' AND schemaname = 'storage'
            ) THEN
                CREATE POLICY "Public Access for Ecommerce"
                ON storage.objects FOR SELECT
                USING ( bucket_id = 'ecommerce-products' );
            END IF;
        END
        $$;
     `);

     // Política INSERT
     await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload for Ecommerce' AND tablename = 'objects' AND schemaname = 'storage'
            ) THEN
                CREATE POLICY "Public Upload for Ecommerce"
                ON storage.objects FOR INSERT
                WITH CHECK ( bucket_id = 'ecommerce-products' );
            END IF;
        END
        $$;
     `);
     
     // Política UPDATE
     await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Update for Ecommerce' AND tablename = 'objects' AND schemaname = 'storage'
            ) THEN
                CREATE POLICY "Public Update for Ecommerce"
                ON storage.objects FOR UPDATE
                USING ( bucket_id = 'ecommerce-products' );
            END IF;
        END
        $$;
     `);

      console.log('✅ Todas las Políticas RLS de Storage están forjadas en piedra.');

   } catch(e) {
      console.error('⛔ SQL Fatal:', e.message);
   } finally {
      await prisma.$disconnect()
   }
}

createBucketBypass();
