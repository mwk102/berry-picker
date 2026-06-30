function createCropRepository(prisma) {
  return {
    async findCrops() {
      return prisma.crop.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    },

    async findCropBySlug(slug) {
      return prisma.crop.findFirst({
        where: { slug, isActive: true },
      })
    },

    async searchCrops(search) {
      if (!search) {
        return []
      }

      return prisma.crop.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        take: 10,
      })
    },
  }
}

module.exports = { createCropRepository }
