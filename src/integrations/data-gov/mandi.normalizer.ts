import { createHash } from "node:crypto";
import { GovernmentMandiRecord } from "./data-gov.client";

export type NormalizedMandiRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalDate: Date;
  observationKey: string;
};

export function normalizeForMatch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
}

function parsePrice(value: number | string, field: string) {
  const price = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid government ${field}`);
  }

  return price;
}

function parseArrivalDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) {
    throw new Error("Government arrival_date must use DD/MM/YYYY");
  }

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1) {
    throw new Error("Government arrival_date is not a valid date");
  }

  return date;
}

export function normalizeMandiRecord(record: GovernmentMandiRecord): NormalizedMandiRecord {
  const state = record.state.trim().replace(/\s+/g, " ");
  const district = record.district.trim().replace(/\s+/g, " ");
  const market = record.market.trim().replace(/\s+/g, " ");
  const commodity = record.commodity.trim().replace(/\s+/g, " ");
  const variety = record.variety.trim().replace(/\s+/g, " ");
  const grade = record.grade.trim().replace(/\s+/g, " ");

  if (!state || !district || !market || !commodity) {
    throw new Error("Government record is missing a required location or commodity value");
  }

  const minPrice = parsePrice(record.min_price, "min_price");
  const maxPrice = parsePrice(record.max_price, "max_price");
  const modalPrice = parsePrice(record.modal_price, "modal_price");

  if (minPrice > maxPrice || modalPrice < minPrice || modalPrice > maxPrice) {
    throw new Error("Government price range is inconsistent");
  }

  const arrivalDate = parseArrivalDate(record.arrival_date);
  const keySource = [state, district, market, commodity, variety, grade, record.arrival_date.trim()]
    .map(normalizeForMatch)
    .join("|");

  return {
    state,
    district,
    market,
    commodity,
    variety,
    grade,
    minPrice,
    maxPrice,
    modalPrice,
    arrivalDate,
    observationKey: createHash("sha256").update(`AGMARKNET|${keySource}`).digest("hex"),
  };
}