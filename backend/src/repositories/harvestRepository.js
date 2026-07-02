const publicFarmWhere = {
  isActive: true,
  reviewStatus: 'APPROVED',
}

const cropInclude = {
  harvestSummary: true,
  farmCrops: {
    where: {
      isActive: true,
      farm: publicFarmWhere,
    },
    include: {
      farm: true,
      prices: {
        where: {
          amount: { not: null },
        },
        orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
      },
      reports: {
        where: {
          isApproved: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  },
  cropPrices: {
    where: {
      amount: { not: null },
      farm: publicFarmWhere,
    },
    orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
  },
  reports: {
    where: {
      isApproved: true,
      farm: publicFarmWhere,
    },
    orderBy: { createdAt: 'desc' },
  },
}

function createHarvestRepository(prisma) {
  return {
    async findHarvestCrops() {
      return prisma.crop.findMany({
        where: { isActive: true },
        include: cropInclude,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    },

    async findHarvestCropBySlug(slug) {
      return prisma.crop.findFirst({
        where: { slug, isActive: true },
        include: cropInclude,
      })
    },

    async upsertSummary(cropId, summary) {
      return prisma.harvestSummary.upsert({
        where: { cropId },
        create: {
          cropId,
          ...summary,
        },
        update: summary,
      })
    },
  }
}

module.exports = { createHarvestRepository }
