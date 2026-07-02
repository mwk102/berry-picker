function createFarmInclude(now = new Date()) {
  return {
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
    where: {
      isPublished: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
  },
  sources: {
    orderBy: { importedAt: 'desc' },
  },
  verification: true,
  candidates: {
    orderBy: { updatedAt: 'desc' },
    take: 1,
  },
}
}

function buildFarmWhere(filters = {}) {
  const where = { isActive: true }
  const andConditions = []

  if (!filters.includeUnverified) {
    where.reviewStatus = 'APPROVED'
  } else {
    andConditions.push({
      OR: [
        { reviewStatus: 'APPROVED' },
        { isVerified: false, reviewStatus: 'PENDING_REVIEW' },
      ],
    })
  }

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
    andConditions.push({
      OR: [
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
      ],
    })
  }

  if (andConditions.length > 0) {
    where.AND = andConditions
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
          include: createFarmInclude(),
          orderBy: [{ name: 'asc' }],
          take: filters.limit,
          skip: filters.offset,
        }),
      ])

      return { farms, total }
    },

    async findFarmBySlug(slug) {
      return prisma.farm.findFirst({
        where: { slug, isActive: true, reviewStatus: 'APPROVED' },
        include: createFarmInclude(),
      })
    },

    async findNearbyFarms(farm, limit = 4) {
      return prisma.farm.findMany({
        where: {
          id: { not: farm.id },
          isActive: true,
          reviewStatus: 'APPROVED',
          latitude: {
            gte: Number(farm.latitude) - 0.5,
            lte: Number(farm.latitude) + 0.5,
          },
          longitude: {
            gte: Number(farm.longitude) - 0.5,
            lte: Number(farm.longitude) + 0.5,
          },
        },
        include: createFarmInclude(),
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        take: limit * 3,
      })
    },

    async findFarmsByCropSlug(slug, filters) {
      const where = buildFarmWhere({ ...filters, crop: slug })
      const [total, farms] = await prisma.$transaction([
        prisma.farm.count({ where }),
        prisma.farm.findMany({
          where,
          include: createFarmInclude(),
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
