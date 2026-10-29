import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type CropInput = {
  name: string;
  category: string;
};

export function listCrops() {
  return prisma.crop.findMany({ orderBy: { name: "asc" } });
}

export async function getCrop(id: string) {
  const crop = await prisma.crop.findUnique({ where: { id } });

  if (!crop) {
    throw new NotFoundError("Crop not found");
  }

  return crop;
}

export function createCrop(data: CropInput) {
  return prisma.crop.create({ data });
}

export async function updateCrop(id: string, data: CropInput) {
  await getCrop(id);
  return prisma.crop.update({ where: { id }, data });
}

export async function deleteCrop(id: string) {
  await getCrop(id);
  return prisma.crop.delete({ where: { id } });
}