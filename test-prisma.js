const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!adminUser) {
            console.log("No admin user found");
            return;
        }
        console.log("Found admin user:", adminUser.id);
        const settings = await prisma.ecommerceSettings.upsert({
            where: { userId: adminUser.id },
            update: { storeSlug: 'emprende' },
            create: {
                userId: adminUser.id,
                storeSlug: 'emprende',
                storeName: 'E-commerce Emprende',
                isActive: true
            }
        });
        console.log("Settings Configured Successfully:", settings.storeSlug);
    } catch(e) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
