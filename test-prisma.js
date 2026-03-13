const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Connecting to Prisma...");
        const orders = await prisma.ecommerceOrder.findMany({ take: 1 });
        console.log("Connection successful. Orders found:", orders.length);
    } catch(e) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
