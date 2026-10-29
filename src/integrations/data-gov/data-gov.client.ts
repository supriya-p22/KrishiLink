export type GovernmentMandiRecord = {
  arrival_date: string;
  commodity: string;
  district: string;
  grade: string;
  market: string;
  max_price: number | string;
  min_price: number | string;
  modal_price: number | string;
  state: string;
  variety: string;
};

type GovernmentMandiResponse = {
  records?: unknown;
  total?: number;
  count?: number;
  offset?: string | number;
  limit?: string | number;
};

export type GovernmentMandiPage = {
  records: GovernmentMandiRecord[];
  total: number | undefined;
  count: number | undefined;
  offset: number;
  limit: number;
};

function getConfigValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Government API configuration is missing: ${name}`);
  }

  return value;
}

function isMandiRecord(value: unknown): value is GovernmentMandiRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const requiredStrings = ["arrival_date", "commodity", "district", "grade", "market", "state", "variety"];
  const hasStrings = requiredStrings.every((field) => typeof record[field] === "string");
  const hasPrices = ["min_price", "max_price", "modal_price"].every((field) => {
    return typeof record[field] === "number" || typeof record[field] === "string";
  });

  return hasStrings && hasPrices;
}

export async function fetchMandiPage(offset = 0, limit = 1): Promise<GovernmentMandiPage> {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("Government API offset and limit must be valid positive integers");
  }

  const apiKey = getConfigValue("DATA_GOV_API_KEY");
  const resourceId = getConfigValue("MANDI_RESOURCE_ID");
  const endpoint = new URL(`https://api.data.gov.in/resource/${resourceId}`);
  endpoint.searchParams.set("api-key", apiKey);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("offset", String(offset));
  endpoint.searchParams.set("limit", String(limit));

  let response: Response;

  try {
    response = await fetch(endpoint);
  } catch {
    throw new Error("Government API request failed");
  }

  let payload: GovernmentMandiResponse;

  try {
    payload = await response.json() as GovernmentMandiResponse;
  } catch {
    throw new Error(`Government API returned invalid JSON (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(`Government API returned HTTP ${response.status}`);
  }

  if (!Array.isArray(payload.records) || !payload.records.every(isMandiRecord)) {
    throw new Error("Government API returned an unexpected records shape");
  }

  return {
    records: payload.records,
    total: payload.total,
    count: payload.count,
    offset: Number(payload.offset ?? offset),
    limit: Number(payload.limit ?? limit),
  };
}