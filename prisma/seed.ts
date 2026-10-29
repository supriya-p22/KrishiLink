import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const demo = "demo.krishilink.local";

async function main() {
  const farmerUser = await prisma.user.upsert({
    where: { email: `meera.farmer@${demo}` },
    update: { name: "Meera Patil (Demo Farmer)", phone: "9000001001", role: "FARMER" },
    create: { name: "Meera Patil (Demo Farmer)", email: `meera.farmer@${demo}`, phone: "9000001001", role: "FARMER" },
  });
  const farmer = await prisma.farmerProfile.upsert({ where: { userId: farmerUser.id }, update: { location: "Nashik, Maharashtra" }, create: { userId: farmerUser.id, location: "Nashik, Maharashtra" } });
  const cropData = [{ name: "Rice", category: "Cereal", quantity: 1200, harvestDaysAgo: 3 }, { name: "Tomato", category: "Vegetable", quantity: 650, harvestDaysAgo: 10 }, { name: "Wheat", category: "Cereal", quantity: 900, harvestDaysAgo: 28 }];
  const crops = await Promise.all(cropData.map(c => prisma.crop.upsert({ where: { name_category: { name: c.name, category: c.category } }, update: {}, create: { name: c.name, category: c.category } })));
  await Promise.all(crops.map((crop, i) => prisma.farmerCrop.upsert({ where: { farmerId_cropId: { farmerId: farmer.id, cropId: crop.id } }, update: { quantity: cropData[i].quantity, unit: "kg", harvestDate: new Date(Date.now() - cropData[i].harvestDaysAgo * 86_400_000) }, create: { farmerId: farmer.id, cropId: crop.id, quantity: cropData[i].quantity, unit: "kg", harvestDate: new Date(Date.now() - cropData[i].harvestDaysAgo * 86_400_000) } })));
  const marketData = [{ name: "Lasalgaon APMC (Demo)", location: "Lasalgaon", district: "Nashik", state: "Maharashtra" }, { name: "Pune APMC (Demo)", location: "Pune", district: "Pune", state: "Maharashtra" }, { name: "Vashi APMC (Demo)", location: "Navi Mumbai", district: "Thane", state: "Maharashtra" }];
  const markets = await Promise.all(marketData.map(m => prisma.market.upsert({ where: { name_location: { name: m.name, location: m.location } }, update: { district: m.district, state: m.state }, create: m })));
  const priceSets = [[2100, 2250, 2380], [1600, 1820, 1760], [2450, 2520, 2600]];
  for (let cropIndex = 0; cropIndex < crops.length; cropIndex++) for (let marketIndex = 0; marketIndex < markets.length; marketIndex++) for (let age = 2; age >= 0; age--) {
    const modal = priceSets[cropIndex][marketIndex] - age * 35;
    const key = `${demo}:price:${crops[cropIndex].name}:${markets[marketIndex].name}:${age}`;
    const recordedAt = new Date(Date.now() - age * 86_400_000);
    await prisma.marketPrice.upsert({ where: { observationKey: key }, update: { price: modal, modalPrice: modal, minPrice: modal - 100, maxPrice: modal + 120, recordedAt, arrivalDate: recordedAt, unit: "kg" }, create: { cropId: crops[cropIndex].id, marketId: markets[marketIndex].id, price: modal, modalPrice: modal, minPrice: modal - 100, maxPrice: modal + 120, unit: "kg", recordedAt, arrivalDate: recordedAt, variety: "Demo grade", sourceName: "KrishiLink demo seed", observationKey: key } });
  }
  async function buyer(name: string, type: string, location: string, contact: string) { const existing = await prisma.buyer.findFirst({ where: { contact } }); return existing ? prisma.buyer.update({ where: { id: existing.id }, data: { name, type, location } }) : prisma.buyer.create({ data: { name, type, location, contact } }); }
  const buyers = [await buyer("Nashik Fresh Foods (Demo)", "Food Processor", "Nashik, Maharashtra", `buyer1@${demo}`), await buyer("Pune Grain Traders (Demo)", "Trader", "Pune, Maharashtra", `buyer2@${demo}`)];
  const demandData = [{ buyer: buyers[0], crop: crops[1], quantity: 700, price: 1950 }, { buyer: buyers[1], crop: crops[0], quantity: 1500, price: 2425 }, { buyer: buyers[1], crop: crops[2], quantity: 1000, price: 2675 }];
  for (const d of demandData) { const existing = await prisma.buyerDemand.findFirst({ where: { buyerId: d.buyer.id, cropId: d.crop.id, unit: "kg" } }); const data = { quantity: d.quantity, unit: "kg", offeredPrice: d.price, status: "OPEN", validUntil: new Date(Date.now() + 30 * 86_400_000) }; if (existing) await prisma.buyerDemand.update({ where: { id: existing.id }, data }); else await prisma.buyerDemand.create({ data: { buyerId: d.buyer.id, cropId: d.crop.id, ...data } }); }
  const demoFarmerCrop = await prisma.farmerCrop.findUniqueOrThrow({ where: { farmerId_cropId: { farmerId: farmer.id, cropId: crops[1].id } } });
  const demoDemand = await prisma.buyerDemand.findFirstOrThrow({ where: { buyerId: buyers[0].id, cropId: crops[1].id, unit: "kg" } });
  const existingSaleIntent = await prisma.saleIntent.findFirst({ where: { farmerCropId: demoFarmerCrop.id, buyerDemandId: demoDemand.id } });
  if (!existingSaleIntent) {
    await prisma.saleIntent.create({ data: { farmerCropId: demoFarmerCrop.id, buyerDemandId: demoDemand.id, buyerId: demoDemand.buyerId, cropId: demoDemand.cropId, quantity: 300, unit: "kg", agreedPrice: demoDemand.offeredPrice, status: "PENDING" } });
  }
  const alert = await prisma.priceAlert.findFirst({ where: { farmerId: farmer.id, cropId: crops[1].id, marketId: markets[1].id, unit: "kg" } }); const alertData = { targetPrice: 1800, condition: "AT_OR_ABOVE" as const, unit: "kg", active: true }; if (alert) await prisma.priceAlert.update({ where: { id: alert.id }, data: alertData }); else await prisma.priceAlert.create({ data: { farmerId: farmer.id, cropId: crops[1].id, marketId: markets[1].id, ...alertData } });
  console.log(`Demo seed ready: farmer ${farmer.id}, crops ${crops.map(c => c.id).join(", ")}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
