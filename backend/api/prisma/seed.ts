/**
 * Idempotent seed for demo data.
 * Safe to re-run: creates users/vehicles/shipments only if they don't exist.
 * Run via: npm run seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_SHIPPER_EMAIL = 'demo-shipper@trackas.demo';
const DEMO_FLEET_OWNER_EMAIL = 'demo-fleet@trackas.demo';
const DEMO_DRIVER_EMAIL = 'demo-driver@trackas.demo';

async function main() {
  // 1. Create or get users (idempotent by email)
  const shipper =
    (await prisma.user.findUnique({ where: { email: DEMO_SHIPPER_EMAIL } })) ??
    (await prisma.user.create({
      data: { email: DEMO_SHIPPER_EMAIL, role: 'SHIPPER' },
    }));

  const fleetOwner =
    (await prisma.user.findUnique({
      where: { email: DEMO_FLEET_OWNER_EMAIL },
    })) ??
    (await prisma.user.create({
      data: { email: DEMO_FLEET_OWNER_EMAIL, role: 'FLEET_OWNER' },
    }));

  const driver =
    (await prisma.user.findUnique({ where: { email: DEMO_DRIVER_EMAIL } })) ??
    (await prisma.user.create({
      data: { email: DEMO_DRIVER_EMAIL, role: 'DRIVER' },
    }));

  // 2. Create vehicles (if fleet owner has none)
  const existingVehicles = await prisma.vehicle.count({
    where: { ownerId: fleetOwner.id },
  });
  let v1: { id: string };
  let v2: { id: string };
  if (existingVehicles === 0) {
    v1 = await prisma.vehicle.create({
      data: {
        ownerId: fleetOwner.id,
        driverId: driver.id,
        plateNumber: 'AB 123 CD',
        make: 'Toyota',
        model: 'Hiace',
      },
    });
    v2 = await prisma.vehicle.create({
      data: {
        ownerId: fleetOwner.id,
        plateNumber: 'XY 789 ZZ',
        make: 'Ford',
        model: 'Transit',
      },
    });
  } else {
    const [a, b] = await prisma.vehicle.findMany({
      where: { ownerId: fleetOwner.id },
      take: 2,
    });
    v1 = a!;
    v2 = b ?? a!;
  }

  // 3. Create shipments (idempotent: only if shipper has < 2)
  const existingShipments = await prisma.shipment.count({
    where: { shipperId: shipper.id },
  });
  if (existingShipments < 2) {
    const s1 = await prisma.shipment.create({
      data: {
        shipperId: shipper.id,
        driverId: driver.id,
        status: 'DELIVERED',
        deliveryLatitude: 52.53,
        deliveryLongitude: 13.41,
      },
    });
    await prisma.payment.upsert({
      where: { shipmentId: s1.id },
      create: { shipmentId: s1.id, status: 'RELEASED' },
      update: {},
    });
    await prisma.trackingEvent.createMany({
      data: [
        {
          shipmentId: s1.id,
          eventType: 'PICKUP',
          latitude: 52.52,
          longitude: 13.405,
          createdById: driver.id,
        },
        {
          shipmentId: s1.id,
          eventType: 'DELIVERY',
          latitude: 52.53,
          longitude: 13.41,
          createdById: driver.id,
        },
      ],
    });

    const s2 = await prisma.shipment.create({
      data: {
        shipperId: shipper.id,
        status: 'PENDING',
        deliveryLatitude: 52.54,
        deliveryLongitude: 13.42,
      },
    });
    await prisma.payment.upsert({
      where: { shipmentId: s2.id },
      create: { shipmentId: s2.id, status: 'HELD' },
      update: {},
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
