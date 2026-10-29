import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";
import { addFreshness } from "./freshness.service";

export type FarmerInput = {
  name: string;
  location: string;
  phone?: string;
  email?: string;
};

export type FarmerCropInput = {
  cropId: string;
  quantity: number;
  unit: string;
  harvestDate?: Date | null;
};

const farmerInclude = {
  user: true,
  farmerCrops: {
    include: { crop: true },
    orderBy: { createdAt: "desc" as const },
  },
};

export function listFarmers() {
  return prisma.farmerProfile.findMany({
    include: farmerInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFarmer(id: string) {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { id },
    include: farmerInclude,
  });

  if (!farmer) {
    throw new NotFoundError("Farmer not found");
  }

  return { ...farmer, farmerCrops: farmer.farmerCrops.map((listing) => addFreshness(listing)) };
}

export function createFarmer(data: FarmerInput) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: "FARMER",
      },
    });

    return transaction.farmerProfile.create({
      data: { userId: user.id, location: data.location },
      include: farmerInclude,
    });
  });
}

export async function updateFarmer(id: string, data: FarmerInput) {
  await getFarmer(id);

  return prisma.$transaction(async (transaction) => {
    const farmer = await transaction.farmerProfile.update({
      where: { id },
      data: { location: data.location },
    });

    await transaction.user.update({
      where: { id: farmer.userId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });

    return transaction.farmerProfile.findUniqueOrThrow({
      where: { id },
      include: farmerInclude,
    });
  });
}

export async function deleteFarmer(id: string) {
  const farmer = await getFarmer(id);

  await prisma.$transaction([
    prisma.farmerProfile.delete({ where: { id } }),
    prisma.user.delete({ where: { id: farmer.userId } }),
  ]);
}

export async function listFarmerCrops(farmerId: string) {
  await getFarmer(farmerId);
  const listings = await prisma.farmerCrop.findMany({
    where: { farmerId },
    include: { crop: true },
    orderBy: { createdAt: "desc" },
  });
  return listings.map((listing) => addFreshness(listing));
}

export async function getFarmerCrop(farmerId: string, listingId: string) {
  const listing = await prisma.farmerCrop.findFirst({
    where: { id: listingId, farmerId },
    include: { crop: true },
  });

  if (!listing) {
    throw new NotFoundError("Farmer crop listing not found");
  }

  return addFreshness(listing);
}

export async function createFarmerCrop(farmerId: string, data: FarmerCropInput) {
  await getFarmer(farmerId);
  return prisma.farmerCrop.create({
    data: { farmerId, ...data },
    include: { crop: true },
  });
}

export async function updateFarmerCrop(
  farmerId: string,
  listingId: string,
  data: FarmerCropInput,
) {
  await getFarmerCrop(farmerId, listingId);
  const updated = await prisma.farmerCrop.update({
    where: { id: listingId },
    data,
    include: { crop: true },
  });
  return addFreshness(updated);
}

export async function deleteFarmerCrop(farmerId: string, listingId: string) {
  await getFarmerCrop(farmerId, listingId);
  await prisma.farmerCrop.delete({ where: { id: listingId } });
}