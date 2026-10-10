import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

dotenv.config({ path: '../.env' })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in the project root .env file.')
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

const trainingCentreSeeds = [
  {
    name: 'Multimedia Lab',
    district: 'Kinondoni',
    region: 'Dar es Salaam',
    type: 'Creative digital production lab',
    focus: 'Graphic design, video editing, digital storytelling, and multimedia systems.'
  },
  {
    name: 'Mechatronics Lab',
    district: 'Temeke',
    region: 'Dar es Salaam',
    type: 'Automation and robotics workshop',
    focus: 'Sensors, PLCs, robotics, industrial wiring, and smart manufacturing.'
  },
  {
    name: 'Web Design Lab',
    district: 'Mwanza City',
    region: 'Mwanza',
    type: 'UI/UX and web production studio',
    focus: 'Responsive web design, front-end development, and digital branding.'
  },
  {
    name: 'Electronics Lab',
    district: 'Arusha City',
    region: 'Arusha',
    type: 'Applied electronics workshop',
    focus: 'Circuit design, troubleshooting, maintenance, and embedded systems.'
  },
  {
    name: 'Computer Maintenance Lab',
    district: 'Mbeya Rural',
    region: 'Mbeya',
    type: 'Hardware support and repair unit',
    focus: 'PC servicing, diagnostics, networking support, and preventive maintenance.'
  },
  {
    name: 'Administration Office',
    district: 'Kinondoni',
    region: 'Dar es Salaam',
    type: 'Academic and student support office',
    focus: 'Admissions, timetabling, student welfare, and enrollment support.'
  },
  {
    name: 'Training Coordination Office',
    district: 'Temeke',
    region: 'Dar es Salaam',
    type: 'Programme coordination unit',
    focus: 'Course planning, trainer coordination, and assessment management.'
  },
  {
    name: 'Industry Liaison Office',
    district: 'Mwanza City',
    region: 'Mwanza',
    type: 'Employer engagement and placement office',
    focus: 'Workplace links, internship matching, and employer partnerships.'
  }
]

const courseSeeds = [
  {
    name: 'Diploma in Computer Systems and Networking',
    slug: 'diploma-computer-systems-networking',
    description: 'Build practical skills in computer installation, troubleshooting, LAN administration, and network support for digital workplaces.',
    level: 'Diploma',
    duration: '18 months',
    centre: {
      name: 'Dar es Salaam Digital Skills Hub',
      district: 'Kinondoni',
      region: 'Dar es Salaam',
      type: 'Urban digital training centre',
      focus: 'ICT infrastructure and networking'
    }
  },
  {
    name: 'Certificate in Web and Mobile App Development',
    slug: 'certificate-web-mobile-app-development',
    description: 'Learn front-end and back-end development, UI/UX, mobile product design, and deployment for modern digital services.',
    level: 'Certificate',
    duration: '12 months',
    centre: {
      name: 'Kigamboni ICT Academy',
      district: 'Temeke',
      region: 'Dar es Salaam',
      type: 'Technology learning centre',
      focus: 'Software engineering and digital design'
    }
  },
  {
    name: 'Certificate in Cybersecurity and Data Protection',
    slug: 'certificate-cybersecurity-data-protection',
    description: 'Gain foundational skills in cybersecurity, digital safety, threat awareness, and secure computing for everyday ICT environments.',
    level: 'Certificate',
    duration: '12 months',
    centre: {
      name: 'Mwanza ICT Training Centre',
      district: 'Mwanza City',
      region: 'Mwanza',
      type: 'Regional ICT centre',
      focus: 'Cybersecurity and digital transformation'
    }
  },
  {
    name: 'Python Programming Fundamentals',
    slug: 'python-programming-fundamentals',
    description: 'Learn programming logic, Python syntax, automation, and problem-solving for entry-level digital jobs and further study.',
    level: 'Short Course',
    duration: '3 months',
    centre: {
      name: 'Arusha Digital Skills Studio',
      district: 'Arusha City',
      region: 'Arusha',
      type: 'Short-course innovation hub',
      focus: 'Software basics and digital literacy'
    }
  },
  {
    name: 'Cisco Networking Essentials',
    slug: 'cisco-networking-essentials',
    description: 'Develop hands-on networking skills in IP addressing, switching, routing, and troubleshooting essential network systems.',
    level: 'Short Course',
    duration: '4 months',
    centre: {
      name: 'Mbeya Tech Skills Lab',
      district: 'Mbeya Rural',
      region: 'Mbeya',
      type: 'Applied technology training site',
      focus: 'Networking and hardware support'
    }
  },
  {
    name: 'Digital Marketing and Website Design',
    slug: 'digital-marketing-website-design',
    description: 'Practice website design, social media strategy, branding, and online customer engagement for modern digital businesses.',
    level: 'Short Course',
    duration: '2 months',
    centre: {
      name: 'Morogoro Creative ICT Centre',
      district: 'Morogoro Municipal',
      region: 'Morogoro',
      type: 'Creative digital campus',
      focus: 'Web design and digital business skills'
    }
  }
]

const shortCourseSeeds = [
  {
    name: 'Basic Mechatronics',
    slug: 'basic-mechatronics',
    description: 'Pata ujuzi wa msingi wa mitambo, mifumo ya umeme na udhibiti wa mashine kwa mafunzo ya vitendo.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 155000,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Mobile Phone Technician',
    slug: 'basic-mobile-phone-technician',
    description: 'Jifunze kutambua hitilafu za simu na kufanya matengenezo ya msingi kwa usalama.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Computer Application',
    slug: 'computer-application',
    description: 'Jenga ujuzi wa matumizi ya kompyuta na programu muhimu za kazi na biashara.',
    duration: 'Wiki nne (4)',
    startDate: '2026-10-05',
    fee: 225000,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Installation Intermediate',
    slug: 'electrical-installation-intermediate',
    description: 'Imarisha ujuzi wa kufunga na kukagua mifumo ya umeme kwa kuzingatia viwango vya usalama.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-12',
    fee: 250000,
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Fundamental Electronics',
    slug: 'fundamental-electronics',
    description: 'Elewa misingi ya saketi za kielektroniki, vipengele vyake na upimaji wa hitilafu.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 300000,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Beginner',
    slug: 'electrical-beginner',
    description: 'Anza kujifunza misingi ya umeme, zana za kazi na taratibu muhimu za usalama.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-05',
    fee: 250000,
    imageUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Computer Repair & Maintenance',
    slug: 'computer-repair-maintenance',
    description: 'Jifunze kutambua na kurekebisha hitilafu za kompyuta pamoja na matengenezo ya kinga.',
    duration: 'Wiki nne (4)',
    startDate: '2026-10-05',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Customer Care',
    slug: 'customer-care',
    description: 'Boresha mawasiliano, huduma kwa wateja na utatuzi wa changamoto katika sehemu za kazi.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Graphics Design & Video Production',
    slug: 'graphics-design-video-production',
    description: 'Tengeneza michoro na video za kuvutia kwa kutumia mbinu za ubunifu na uzalishaji wa kidijitali.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-12',
    fee: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Advance',
    slug: 'electrical-advance',
    description: 'Panua maarifa ya mifumo ya umeme na utatuzi wa matatizo kwa mafunzo ya kiwango cha juu.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-12',
    fee: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Driving',
    slug: 'basic-driving',
    description: 'Pata maarifa ya msingi ya uendeshaji salama, alama za barabarani na utunzaji wa gari.',
    duration: 'Wiki sita (6)',
    startDate: '2026-09-28',
    fee: 275000,
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-2d1f8a5a6a9f?auto=format&fit=crop&w=1000&q=80'
  }
]

async function main() {
  for (const centreSeed of trainingCentreSeeds) {
    const region = await prisma.region.upsert({
      where: { name: centreSeed.region },
      update: {},
      create: { name: centreSeed.region }
    })
    const district = await prisma.district.findFirst({
      where: { name: centreSeed.district, regionId: region.id }
    }) ?? await prisma.district.create({
      data: { name: centreSeed.district, regionId: region.id }
    })
    const centreSlug = centreSeed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    await prisma.trainingCentre.upsert({
      where: { slug: centreSlug },
      update: {
        name: centreSeed.name,
        type: centreSeed.type,
        focus: centreSeed.focus,
        districtId: district.id
      },
      create: {
        name: centreSeed.name,
        slug: centreSlug,
        type: centreSeed.type,
        focus: centreSeed.focus,
        districtId: district.id
      }
    })
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'System administrator' }
  })
  await prisma.role.upsert({
    where: { name: 'applicant' },
    update: {},
    create: { name: 'applicant', description: 'Training applicant' }
  })

  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminPassword) {
    const [firstName, ...lastNameParts] = 'System Administrator'.split(' ')
    const admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL ?? 'admin@veta.go.tz' },
      update: {
        passwordHash: await bcrypt.hash(adminPassword, 12)
      },
      create: {
        email: process.env.ADMIN_EMAIL ?? 'admin@veta.go.tz',
        passwordHash: await bcrypt.hash(adminPassword, 12),
        firstName,
        lastName: lastNameParts.join(' '),
        roles: { create: { role: { connect: { id: adminRole.id } } } }
      }
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id }
    })
    console.log(`Admin account seeded for ${admin.email}`)
  } else {
    console.warn('Admin account was not seeded. Set ADMIN_PASSWORD in .env and run the seed command again.')
  }

  for (const courseSeed of courseSeeds) {
    const { centre: centreInfo, ...courseData } = courseSeed
    const region = await prisma.region.upsert({
      where: { name: centreInfo.region },
      update: {},
      create: { name: centreInfo.region }
    })
    const district = await prisma.district.findFirst({
      where: { name: centreInfo.district, regionId: region.id }
    }) ?? await prisma.district.create({
      data: { name: centreInfo.district, regionId: region.id }
    })
    const centreSlug = centreInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const centre = await prisma.trainingCentre.upsert({
      where: { slug: centreSlug },
      update: {
        name: centreInfo.name,
        type: centreInfo.type,
        focus: centreInfo.focus,
        districtId: district.id
      },
      create: {
        name: centreInfo.name,
        slug: centreSlug,
        type: centreInfo.type,
        focus: centreInfo.focus,
        districtId: district.id
      }
    })
    const course = await prisma.course.upsert({
      where: { slug: courseSeed.slug },
      update: {
        name: courseSeed.name,
        description: courseSeed.description,
        level: courseSeed.level,
        duration: courseSeed.duration,
        courseType: courseSeed.level === 'Short Course' ? 'Short Course' : 'Long Course'
      },
      create: { ...courseData, courseType: courseSeed.level === 'Short Course' ? 'Short Course' : 'Long Course' }
    })
    await prisma.centreCourse.upsert({
      where: { centreId_courseId: { centreId: centre.id, courseId: course.id } },
      update: {},
      create: { centreId: centre.id, courseId: course.id }
    })
  }

  for (const courseSeed of shortCourseSeeds) {
    await prisma.course.upsert({
      where: { slug: courseSeed.slug },
      update: {
        name: courseSeed.name,
        description: courseSeed.description,
        level: 'Short Course',
        duration: courseSeed.duration,
        courseType: 'Short Course',
        startDate: new Date(`${courseSeed.startDate}T00:00:00.000Z`),
        fee: courseSeed.fee,
        imageUrl: courseSeed.imageUrl
      },
      create: {
        ...courseSeed,
        level: 'Short Course',
        courseType: 'Short Course',
        startDate: new Date(`${courseSeed.startDate}T00:00:00.000Z`)
      }
    })
  }

  await prisma.newsArticle.upsert({
    where: { slug: 'new-intake-opens-for-artisan-programmes' },
    update: {
      category: 'Admissions',
      summary: 'Applications are now open for the next training cycle.',
      body: 'We invite interested learners to apply for our next intake across multiple centres.'
    },
    create: {
      title: 'New intake opens for artisan and entrepreneurship programmes',
      slug: 'new-intake-opens-for-artisan-programmes',
      category: 'Admissions',
      summary: 'Applications are now open for the next training cycle.',
      body: 'We invite interested learners to apply for our next intake across multiple centres.',
      published: true
    }
  })
  await prisma.newsArticle.upsert({
    where: { slug: 'regional-skills-fairs-connect-employers-and-trainees' },
    update: {},
    create: {
      title: 'Regional skills fairs connect employers and trainees',
      slug: 'regional-skills-fairs-connect-employers-and-trainees',
      category: 'Partnerships',
      summary: 'Regional skills fairs bring trainees and local employers together.',
      body: 'Training centres are hosting skills fairs to strengthen links between employers and trainees.',
      published: true
    }
  })
  await prisma.newsArticle.upsert({
    where: { slug: 'graduates-receive-business-startup-support' },
    update: {},
    create: {
      title: 'Graduates receive support for business startup and workplace placement',
      slug: 'graduates-receive-business-startup-support',
      category: 'Student Success',
      summary: 'Graduates receive practical support as they move into work and enterprise.',
      body: 'New support services help graduates pursue workplace placements and business opportunities.',
      published: true
    }
  })

  const siteSettings = [
    ['site.footerTagline', 'Skilled labour force for the future of Tanzania.'],
    ['site.contactPhone', '+255 22 000 0000'],
    ['site.contactEmail', 'info@veta.go.tz'],
    ['site.officeHours', 'Mon–Fri, 8:00am–5:00pm'],
    ['home.eyebrow', 'Skills for a productive future'],
    ['home.headline', 'Learning pathways that turn talent into opportunity.'],
    ['home.description', 'VETA Tanzania connects learners, employers and training centres through practical, workplace-ready vocational programmes that support inclusive growth.'],
    ['home.approachTitle', 'Training rooted in employability and community growth.'],
    ['home.featuredTitle', 'Mechatronics Technician'],
    ['home.featuredDescription', 'Hands-on training in automation, robotics, and smart manufacturing systems for modern industrial workplaces.'],
    ['home.featuredBenefits', JSON.stringify([
      'Industrial automation and PLC systems',
      'Robotics, sensors and control logic',
      'Maintenance, troubleshooting and safety'
    ])],
    ['home.stats.placementSupport', '96%'],
    ['home.stats.learnersReached', '12k'],
    ['home.quickLinkAdmissions', 'Check entry requirements and apply for the next intake.'],
    ['home.quickLinkCentres', 'Explore available hubs across Tanzania and nearby districts.'],
    ['home.quickLinkCourses', 'Browse demand-driven programmes aligned to industry needs.'],
    ['about.heading', 'Delivery that strengthens skills, institutions and communities.'],
    ['about.paragraph1', 'The VETA-inspired model focuses on technical and vocational education that matches national development priorities, labour market realities and local employer needs.'],
    ['about.paragraph2', 'We work across training centres, district partnerships and public information systems to improve access, quality and progression for learners entering technical and productive careers.'],
    ['about.values', JSON.stringify([
      'Access and equity',
      'Industry relevance',
      'Quality and accountability',
      'Innovation and sustainability'
    ])],
    ['admissions.steps', JSON.stringify([
      'Submit an online application',
      'Upload required documents',
      'Complete interview or placement screening',
      'Receive approval and enrolment guidance'
    ])]
  ] as const
  for (const [key, value] of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
  }

  if (await prisma.review.count() === 0) {
    await prisma.review.createMany({
      data: [
        {
          userName: 'Grace M.',
          course: 'Hospitality Management',
          rating: 5,
          comment: 'The practical sessions helped me gain confidence for real hospitality jobs.'
        },
        {
          userName: 'Thomas S.',
          course: 'Electrical Installation',
          rating: 4,
          comment: 'Excellent trainers and a very practical learning environment.'
        }
      ]
    })
  }

  console.log('Seed complete')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
