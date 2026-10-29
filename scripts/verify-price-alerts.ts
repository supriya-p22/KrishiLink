import prisma from "../src/lib/prisma";
import * as alerts from "../src/services/price-alert.service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Verification failed: ${message}`);
}

async function rejects(action: () => Promise<unknown>) {
  try { await action(); return false; } catch { return true; }
}

async function main() {
  const suffix = `m15-${Date.now()}`;
  const ids = { users: [] as string[], farmers: [] as string[], crops: [] as string[], markets: [] as string[], alerts: [] as string[] };
  try {
    const [userA, userB] = await Promise.all([
      prisma.user.create({ data: { name: `M15 Farmer A ${suffix}`, role: "FARMER" } }),
      prisma.user.create({ data: { name: `M15 Farmer B ${suffix}`, role: "FARMER" } }),
    ]);
    ids.users.push(userA.id, userB.id);
    const [farmerA, farmerB] = await Promise.all([
      prisma.farmerProfile.create({ data: { userId: userA.id, location: "M15 Test" } }),
      prisma.farmerProfile.create({ data: { userId: userB.id, location: "M15 Test" } }),
    ]);
    ids.farmers.push(farmerA.id, farmerB.id);
    const [rice, wheat] = await Promise.all([
      prisma.crop.create({ data: { name: `Rice ${suffix}`, category: "M15 Test" } }),
      prisma.crop.create({ data: { name: `Wheat ${suffix}`, category: "M15 Test" } }),
    ]);
    ids.crops.push(rice.id, wheat.id);
    const [marketA, marketB] = await Promise.all([
      prisma.market.create({ data: { name: `M15 Market A ${suffix}`, location: "M15 Test" } }),
      prisma.market.create({ data: { name: `M15 Market B ${suffix}`, location: "M15 Test" } }),
    ]);
    ids.markets.push(marketA.id, marketB.id);

    const base = { cropId: rice.id, marketId: marketA.id, targetPrice: 3000, condition: "AT_OR_ABOVE" as const, unit: "quintal", active: true };
    const above = await alerts.createPriceAlert(farmerA.id, base);
    ids.alerts.push(above.id);
    assert(above.description.includes("or above"), "valid Rice alert is displayable");
    assert(await rejects(() => alerts.createPriceAlert(farmerA.id, { ...base, targetPrice: 0 })), "zero target is rejected");
    assert(await rejects(() => alerts.createPriceAlert("missing", base)), "missing farmer is rejected");
    assert(await rejects(() => alerts.createPriceAlert(farmerA.id, { ...base, cropId: "missing" })), "missing crop is rejected");
    assert(await rejects(() => alerts.createPriceAlert(farmerA.id, { ...base, condition: "INVALID" as never })), "invalid condition is rejected");
    assert(await rejects(() => alerts.getFarmerPriceAlert(farmerB.id, above.id)), "farmer ownership is enforced");

    const marketBOnly = await alerts.createPriceAlert(farmerA.id, { ...base, marketId: marketB.id });
    const below = await alerts.createPriceAlert(farmerA.id, { ...base, targetPrice: 2800, condition: "AT_OR_BELOW" });
    const inactive = await alerts.createPriceAlert(farmerA.id, { ...base, active: false });
    ids.alerts.push(marketBOnly.id, below.id, inactive.id);

    const equalAbove = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "quintal", price: 3000, observationKey: `${suffix}-above-equal` });
    assert(equalAbove.triggeredAlerts.some((alert) => alert.id === above.id), "AT_OR_ABOVE triggers at equality");
    assert(!equalAbove.triggeredAlerts.some((alert) => alert.id === marketBOnly.id), "market-specific alert ignores another market");
    assert(!equalAbove.triggeredAlerts.some((alert) => alert.id === inactive.id), "inactive alert does not trigger");
    const repeat = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "quintal", price: 3000, observationKey: `${suffix}-above-equal` });
    assert(repeat.triggeredAlerts.length === 0, "same observation key does not re-trigger");
    const higher = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "quintal", price: 3100, observationKey: `${suffix}-above-higher` });
    assert(higher.triggeredAlerts.some((alert) => alert.id === above.id), "new higher observation triggers again");
    const wrongUnit = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "kg", price: 4000, observationKey: `${suffix}-kg` });
    assert(wrongUnit.triggeredAlerts.length === 0, "wrong unit does not trigger");
    const wheatObservation = await alerts.evaluatePriceAlertsForObservation({ cropId: wheat.id, marketId: marketA.id, unit: "quintal", price: 4000, observationKey: `${suffix}-wheat` });
    assert(wheatObservation.triggeredAlerts.length === 0, "Rice alert does not trigger from Wheat");
    const equalBelow = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "quintal", price: 2800, observationKey: `${suffix}-below-equal` });
    assert(equalBelow.triggeredAlerts.some((alert) => alert.id === below.id), "AT_OR_BELOW triggers at equality");
    const lower = await alerts.evaluatePriceAlertsForObservation({ cropId: rice.id, marketId: marketA.id, unit: "quintal", price: 2700, observationKey: `${suffix}-below-lower` });
    assert(lower.triggeredAlerts.some((alert) => alert.id === below.id), "AT_OR_BELOW triggers below target");
    console.log("M15 price-alert verification passed");
  } finally {
    if (ids.alerts.length) await prisma.priceAlert.deleteMany({ where: { id: { in: ids.alerts } } });
    if (ids.farmers.length) await prisma.farmerProfile.deleteMany({ where: { id: { in: ids.farmers } } });
    if (ids.users.length) await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
    if (ids.crops.length) await prisma.crop.deleteMany({ where: { id: { in: ids.crops } } });
    if (ids.markets.length) await prisma.market.deleteMany({ where: { id: { in: ids.markets } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
