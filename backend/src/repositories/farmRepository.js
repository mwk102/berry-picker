const farmInclude = {
  hours: {
    orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
  },
  specialHours: {
    orderBy: { date: 'asc' },
  },
  amenities: {
    include: { amenity: true },
    orderBy: { createdAt: 'asc' },
  },
  farmCrops: {
    include: {
      crop: true,
      prices: {
        orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
      },
      reports: {
        include: { crop: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  cropPrices: {
    orderBy: [{ effectiveStartDate: 'desc' }, { createdAt: 'desc' }],
  },
  reports: {
    include: { crop: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  },
  announcements: {
    where: { isPublished: true },
    orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
  },
}

function buildFarmWhere(filters = {}) {
  const where = { isActive: true }

  if (filters.city) {
    where.city = { equals: filters.city, mode: 'insensitive' }
  }

  if (filters.verified !== undefined) {
    where.isVerified = filters.verified
  }

  if (filters.crop) {
    where.farmCrops = {
      some: {
        isActive: true,
        crop: {
          slug: { equals: filters.crop, mode: 'insensitive' },
          isActive: true,
        },
      },
    }
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
      { county: { contains: filters.search, mode: 'insensitive' } },
      {
        farmCrops: {
          some: {
            crop: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      },
    ]
  }

  return where
}

function createFarmRepository(prisma) {
  return {
    async findFarms(filters) {
      const where = buildFarmWhere(filters)
      const [total, farms] = await prisma.$transaction([
        prisma.farm.count({ where }),
        prisma.farm.findMany({
          where,
          include: farmInclude,
          orderBy: [{ name: 'asc' }],
          take: filters.limit,
          skip: filters.offset,
        }),
      ])

      return { farms, total }
    },

    async findFarmBySlug(slug) {
      return prisma.farm.findFirst({
        where: { slug, isActive: true },
        include: farmInclude,
      })
    },

    async findFarmsByCropSlug(slug, filters) {
      const where = buildFarmWhere({ ...filters, crop: slug })
      const [total, farms] = await prisma.$transaction([
        prisma.farm.count({ where }),
        prisma.farm.findMany({
          where,
          include: farmInclude,
          orderBy: [{ name: 'asc' }],
          take: filters.limit,
          skip: filters.offset,
        }),
      ])

      return { farms, total }
    },
  }
}

module.exports = { createFarmRepository }
