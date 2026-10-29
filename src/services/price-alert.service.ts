import { PriceAlertCondition, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../utils/http-error";

export { PriceAlertCondition };

export type PriceAlertInput = {
  cropId: string;
  marketId: string | null;
  targetPrice: number;
  condition: PriceAlertCondition;
  unit: string;
  active: boolean;
};

export type PriceAlertUpdateInput = Partial<PriceAlertInput>;

const alertInclude = { crop: true, market: true };
type PriceAlertWithRelations = Prisma.PriceAlertGetPayload<{ include: typeof alertInclude }>;

export function isPriceAlertCondition(value: string): value is PriceAlertCondition {
  return value === "AT_OR_ABOVE" || value === "AT_OR_BELOW";
}

function presentAlert(alert: PriceAlertWithRelations) {
  return {
    ...alert,
    hasTriggered: alert.lastTriggeredAt !== null,
    description: `${alert.crop.name} price alert: ₹${alert.targetPrice.toString()}/${alert.unit} ${alert.condition === "AT_OR_ABOVE" ? "or above" : "or below"}`,
  };
}

async function requireFarmer(farmerId: string) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId } });
  if (!farmer) throw new NotFoundError("Farmer not found");
}

async function validateReferences(cropId: string, marketId: string | null) {
  const [crop, market] = await Promise.all([
    prisma.crop.findUnique({ where: { id: cropId } }),
    marketId ? prisma.market.findUnique({ where: { id: marketId } }) : Promise.resolve(null),
  ]);
  if (!crop) throw new NotFoundError("Crop not found");
  if (marketId && !market) throw new NotFoundError("Market not found");
}

function validateAlertData(data: Omit<Pick<PriceAlertInput, "targetPrice" | "condition" | "unit" | "active">, "targetPrice"> & { targetPrice: number | Prisma.Decimal }) {
  if (!Number.isFinite(Number(data.targetPrice)) || Number(data.targetPrice) <= 0) {
    throw new BadRequestError("targetPrice must be a positive number");
  }
  if (!data.unit.trim()) throw new BadRequestError("unit is required");
  if (!isPriceAlertCondition(data.condition)) {
    throw new BadRequestError("condition must be AT_OR_ABOVE or AT_OR_BELOW");
  }
  if (typeof data.active !== "boolean") throw new BadRequestError("active must be a boolean");
}

async function getOwnedAlert(farmerId: string, id: string) {
  const alert = await prisma.priceAlert.findFirst({
    where: { id, farmerId },
    include: alertInclude,
  });
  if (!alert) throw new NotFoundError("Price alert not found");
  return alert;
}

export async function createPriceAlert(farmerId: string, data: PriceAlertInput) {
  validateAlertData(data);
  await requireFarmer(farmerId);
  await validateReferences(data.cropId, data.marketId);
  const alert = await prisma.priceAlert.create({ data: { farmerId, ...data }, include: alertInclude });
  return presentAlert(alert);
}

export async function listFarmerPriceAlerts(farmerId: string) {
  await requireFarmer(farmerId);
  const alerts = await prisma.priceAlert.findMany({
    where: { farmerId },
    include: alertInclude,
    orderBy: { createdAt: "desc" },
  });
  return alerts.map(presentAlert);
}

export async function getFarmerPriceAlert(farmerId: string, id: string) {
  return presentAlert(await getOwnedAlert(farmerId, id));
}

export async function updateFarmerPriceAlert(farmerId: string, id: string, data: PriceAlertUpdateInput) {
  const existing = await getOwnedAlert(farmerId, id);
  const merged = { ...existing, ...data };
  validateAlertData(merged);
  await validateReferences(merged.cropId, merged.marketId);
  const alert = await prisma.priceAlert.update({ where: { id }, data, include: alertInclude });
  return presentAlert(alert);
}

export async function deleteFarmerPriceAlert(farmerId: string, id: string) {
  await getOwnedAlert(farmerId, id);
  await prisma.priceAlert.delete({ where: { id } });
}

export type PriceObservation = {
  cropId: string;
  marketId: string;
  unit: string;
  price: number;
  observationKey: string;
};

export async function evaluatePriceAlertsForObservation(observation: PriceObservation) {
  const alerts = await prisma.priceAlert.findMany({
    where: {
      active: true,
      cropId: observation.cropId,
      unit: observation.unit,
      OR: [{ marketId: null }, { marketId: observation.marketId }],
      AND: [{
        OR: [
          { lastTriggeredObservationKey: null },
          { NOT: { lastTriggeredObservationKey: observation.observationKey } },
        ],
      }],
    },
    include: alertInclude,
  });

  const qualifying = alerts.filter((alert) => (
    alert.condition === "AT_OR_ABOVE"
      ? observation.price >= Number(alert.targetPrice)
      : observation.price <= Number(alert.targetPrice)
  ));
  const triggered = [];

  for (const alert of qualifying) {
    const result = await prisma.priceAlert.updateMany({
      where: {
        id: alert.id,
        active: true,
        OR: [
          { lastTriggeredObservationKey: null },
          { NOT: { lastTriggeredObservationKey: observation.observationKey } },
        ],
      },
      data: {
        lastTriggeredObservationKey: observation.observationKey,
        lastTriggeredPrice: observation.price,
        lastTriggeredAt: new Date(),
      },
    });
    if (result.count === 1) {
      triggered.push(presentAlert(await prisma.priceAlert.findUniqueOrThrow({ where: { id: alert.id }, include: alertInclude })));
    }
  }

  return { evaluatedAlerts: alerts.length, triggeredAlerts: triggered, skippedInactiveAlerts: 0 };
}
