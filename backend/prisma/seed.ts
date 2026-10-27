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

function getCourseCategory(courseName: string) {
  const normalizedName = courseName.toLowerCase()
  if (normalizedName.includes('driv')) return 'ICT'
  if (normalizedName.includes('mechatronic')) return 'MECHATRONICS'
  if (normalizedName.includes('electronic')) return 'ELECTRONICS'
  if (normalizedName.includes('electri') || normalizedName.includes('automation')) return 'ELECTRICAL'
  return 'OTHER'
}

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
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80',
    centre: {
      name: 'Morogoro Creative ICT Centre',
      district: 'Morogoro Municipal',
      region: 'Morogoro',
      type: 'Creative digital campus',
      focus: 'Web design and digital business skills'
    }
  }
]

type LongCourseSeed = {
  name: string
  slug: string
  category: string
  description: string
  descriptionSw: string
  level: string
  duration: string
  fee: number | null
  imageUrl: string
}

const longCourseSeeds: LongCourseSeed[] = [
  {
    name: 'Electronics',
    slug: 'electronics-el',
    category: 'ELECTRONICS',
    description: 'Develop practical electronics skills by studying components, circuits, measurement, testing and fault diagnosis.',
    descriptionSw: 'Jenga ujuzi wa vitendo wa elektroniki kwa kujifunza vipengele, saketi, vipimo, majaribio na utambuzi wa hitilafu.',
    level: 'III',
    duration: '3 years',
    fee: 60000,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Information and Communication Technology',
    slug: 'information-and-communication-technology-ict',
    category: 'ICT',
    description: 'Build a strong foundation in computer systems, office applications, networking and practical ICT support.',
    descriptionSw: 'Jenga msingi imara katika mifumo ya kompyuta, programu za ofisi, mitandao na usaidizi wa vitendo wa TEHAMA.',
    level: 'III',
    duration: '3 years',
    fee: 60000,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Installation',
    slug: 'electrical-installation-and-automation-ela',
    category: 'ELECTRICAL',
    description: 'Learn electrical installation practices, safe use of tools, wiring, testing and maintenance.',
    descriptionSw: 'Jifunze taratibu za usakinishaji wa umeme, matumizi salama ya zana, uunganishaji wa nyaya, upimaji na matengenezo.',
    level: 'III',
    duration: '3 years',
    fee: 60000,
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Multimedia and Film Technology',
    slug: 'multimedia-and-film-technology',
    category: 'ICT',
    description: 'Explore multimedia production, photography, video, sound and digital storytelling.',
    descriptionSw: 'Jifunze uzalishaji wa maudhui ya kidijitali, upigaji picha, video, sauti na usimulizi wa hadithi kwa njia ya kidijitali.',
    level: 'Long Course',
    duration: 'Not specified',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80'
  }
]

type ShortCourseSeed = {
  name: string
  slug: string
  category: string
  description: string
  descriptionSw?: string
  level?: string
  duration: string
  startDate?: string
  fee?: number | null
  imageUrl: string
}

const shortCourseSeeds: ShortCourseSeed[] = [
  {
    name: 'Basic Mechatronics',
    slug: 'basic-mechatronics',
    category: 'MECHATRONICS',
    description: 'Pata ujuzi wa msingi wa mitambo, mifumo ya umeme na udhibiti wa mashine kwa mafunzo ya vitendo.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 155000,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Mobile Phone Technician',
    slug: 'basic-mobile-phone-technician',
    category: 'ELECTRONICS',
    description: 'Jifunze kutambua hitilafu za simu na kufanya matengenezo ya msingi kwa usalama.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Computer Application',
    slug: 'computer-application',
    category: 'ICT',
    description: 'Learn computer fundamentals, file management, word processing, spreadsheets, presentations and safe internet use.',
    descriptionSw: 'Jifunze misingi ya kompyuta, usimamizi wa mafaili, uandishi wa nyaraka, majedwali, mawasilisho na matumizi salama ya intaneti.',
    level: 'Not specified',
    duration: '2 years',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Installation Intermediate',
    slug: 'electrical-installation-intermediate',
    category: 'ELECTRICAL',
    description: 'Imarisha ujuzi wa kufunga na kukagua mifumo ya umeme kwa kuzingatia viwango vya usalama.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-12',
    fee: 250000,
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Fundamental Electronics',
    slug: 'fundamental-electronics',
    category: 'ELECTRONICS',
    description: 'Elewa misingi ya saketi za kielektroniki, vipengele vyake na upimaji wa hitilafu.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 300000,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Beginner',
    slug: 'electrical-beginner',
    category: 'ELECTRICAL',
    description: 'Start with electrical safety, basic tools, simple circuits, wiring principles and introductory testing.',
    descriptionSw: 'Anza na usalama wa umeme, zana za msingi, saketi rahisi, kanuni za uunganishaji wa nyaya na upimaji wa utangulizi.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Computer Repair & Maintenance',
    slug: 'computer-repair-maintenance',
    category: 'ICT',
    description: 'Jifunze kutambua na kurekebisha hitilafu za kompyuta pamoja na matengenezo ya kinga.',
    duration: 'Wiki nne (4)',
    startDate: '2026-10-05',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Customer Care',
    slug: 'customer-care',
    category: 'OTHER',
    description: 'Boresha mawasiliano, huduma kwa wateja na utatuzi wa changamoto katika sehemu za kazi.',
    duration: 'Wiki nne (4)',
    startDate: '2026-09-28',
    fee: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Graphics Design & Video Production',
    slug: 'graphics-design-video-production',
    category: 'ICT',
    description: 'Combine graphic design and video production through visual communication, image editing, filming and editing practice.',
    descriptionSw: 'Unganisha usanifu wa picha na utengenezaji wa video kupitia mawasiliano ya kuona, uhariri wa picha, kurekodi na kuhariri video.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Advance',
    slug: 'electrical-advance',
    category: 'ELECTRICAL',
    description: 'Panua maarifa ya mifumo ya umeme na utatuzi wa matatizo kwa mafunzo ya kiwango cha juu.',
    duration: 'Wiki sita (6)',
    startDate: '2026-10-12',
    fee: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Driving',
    slug: 'basic-driving',
    category: 'OTHER',
    description: 'Pata maarifa ya msingi ya uendeshaji salama, alama za barabarani na utunzaji wa gari.',
    duration: 'Wiki sita (6)',
    startDate: '2026-09-28',
    fee: 275000,
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-2d1f8a5a6a9f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Advanced Computer Application',
    slug: 'advanced-computer-application',
    category: 'ICT',
    description: 'Build advanced productivity skills with document formatting, spreadsheet analysis, presentations and collaborative digital tools.',
    descriptionSw: 'Jenga ujuzi wa hali ya juu wa kazi za kompyuta kwa upangiliaji wa nyaraka, uchanganuzi wa majedwali, mawasilisho na zana za ushirikiano.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Graphics Designing',
    slug: 'graphics-designing',
    category: 'ICT',
    description: 'Learn graphic design principles, typography, colour, layout and digital artwork for print and online use.',
    descriptionSw: 'Jifunze kanuni za usanifu wa picha, uchapaji, rangi, mpangilio na kazi za sanaa za kidijitali kwa uchapishaji na matumizi ya mtandaoni.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Website Design',
    slug: 'basic-website-design',
    category: 'ICT',
    description: 'Create simple websites using page structure, styling, images and responsive layouts.',
    descriptionSw: 'Tengeneza tovuti rahisi kwa kutumia muundo wa kurasa, mitindo, picha na mpangilio unaojibadilisha.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Advanced Website Design',
    slug: 'advanced-website-design',
    category: 'ICT',
    description: 'Extend website design skills with responsive interfaces, interactive features, accessibility and testing.',
    descriptionSw: 'Boresha ujuzi wa usanifu wa tovuti kwa violesura vinavyojibadilisha, vipengele shirikishi, ufikivu na upimaji.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'PC Maintenance',
    slug: 'pc-maintenance',
    category: 'ICT',
    description: 'Learn computer hardware care, operating system setup, fault diagnosis and preventive maintenance.',
    descriptionSw: 'Jifunze utunzaji wa vifaa vya kompyuta, usanidi wa mfumo wa uendeshaji, utambuzi wa hitilafu na matengenezo ya kinga.',
    level: 'Not specified',
    duration: '1 year',
    fee: 600000,
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'PC Maintenance & Networking',
    slug: 'pc-maintenance-networking',
    category: 'ICT',
    description: 'Combine computer maintenance with local networking, IP configuration, device connections and troubleshooting.',
    descriptionSw: 'Unganisha matengenezo ya kompyuta na mitandao ya eneo, usanidi wa IP, uunganishaji wa vifaa na utatuzi wa matatizo.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Statistical Packages for Social Science (SPSS)',
    slug: 'statistical-packages-social-science-spss',
    category: 'ICT',
    description: 'Practise preparing datasets, entering and coding data, running introductory statistical summaries and presenting results in SPSS.',
    descriptionSw: 'Fanya mazoezi ya kuandaa seti za data, kuingiza na kuweka misimbo ya data, kufanya muhtasari wa takwimu na kuwasilisha matokeo kwa SPSS.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'AutoCAD',
    slug: 'autocad',
    category: 'ICT',
    description: 'Learn computer-aided drafting, drawing tools, dimensions, layers and preparation of clear technical drawings.',
    descriptionSw: 'Jifunze usanifu wa michoro kwa kompyuta, zana za kuchora, vipimo, tabaka na maandalizi ya michoro ya kiufundi iliyo wazi.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Electrical Installation for Beginners',
    slug: 'electrical-installation-for-beginners',
    category: 'ELECTRICAL',
    description: 'Practise safe basic electrical installation, including tools, conductors, simple wiring, inspection and testing.',
    descriptionSw: 'Fanya mazoezi ya usakinishaji salama wa msingi wa umeme, ikiwemo zana, nyaya, uunganishaji rahisi, ukaguzi na upimaji.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Advanced Electrical & Automation',
    slug: 'advanced-electrical-automation',
    category: 'ELECTRICAL',
    description: 'Develop advanced electrical and automation skills through control circuits, sensors, motor control and system troubleshooting.',
    descriptionSw: 'Jenga ujuzi wa hali ya juu wa umeme na otomatiki kupitia saketi za udhibiti, vihisi, udhibiti wa mota na utatuzi wa mifumo.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'English',
    slug: 'english',
    category: 'OTHER',
    description: 'Strengthen practical English speaking, listening, reading and writing for everyday and workplace communication.',
    descriptionSw: 'Imarisha ujuzi wa vitendo wa kuzungumza, kusikiliza, kusoma na kuandika Kiingereza kwa mawasiliano ya kila siku na kazini.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Basic Entrepreneurship',
    slug: 'basic-entrepreneurship',
    category: 'OTHER',
    description: 'Explore business opportunities, customer needs, simple business planning, pricing and basic record keeping.',
    descriptionSw: 'Chunguza fursa za biashara, mahitaji ya wateja, mipango rahisi ya biashara, uwekaji wa bei na utunzaji wa kumbukumbu za msingi.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Salesmanship',
    slug: 'salesmanship',
    category: 'OTHER',
    description: 'Practise product knowledge, customer communication, sales conversations, handling objections and basic sales records.',
    descriptionSw: 'Fanya mazoezi ya maarifa ya bidhaa, mawasiliano na wateja, mazungumzo ya mauzo, kushughulikia pingamizi na kumbukumbu za mauzo.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'MERCHANDIZING/APPARELS MARKETING BASIC',
    slug: 'merchandizing-apparels-marketing-basic',
    category: 'OTHER',
    description: 'Learn basic apparel merchandising, product presentation, stock and size organization, pricing and customer service.',
    descriptionSw: 'Jifunze uuzaji wa msingi wa mavazi, uwasilishaji wa bidhaa, upangaji wa stoo na saizi, uwekaji wa bei na huduma kwa wateja.',
    level: 'Not specified',
    duration: '1 year',
    fee: null,
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80'
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

  const organizationMemberCount = await prisma.organizationMember.count()
  if (organizationMemberCount === 0) {
    const templateName = '[Replace with staff name]'
    const centreLead = await prisma.organizationMember.create({
      data: {
        name: templateName,
        position: 'Centre Principal',
        biography: '',
        isPublished: false,
        sortOrder: 0
      }
    })
    const academicLead = await prisma.organizationMember.create({
      data: {
        name: templateName,
        position: 'Deputy Principal — Training and Academics',
        managerId: centreLead.id,
        biography: '',
        isPublished: false,
        sortOrder: 1
      }
    })
    const administrationLead = await prisma.organizationMember.create({
      data: {
        name: templateName,
        position: 'Deputy Principal — Administration',
        managerId: centreLead.id,
        biography: '',
        isPublished: false,
        sortOrder: 2
      }
    })
    const teamTemplates = [
      { position: 'Head of ICT', managerId: academicLead.id, sortOrder: 1 },
      { position: 'Head of Electrical and Electronics', managerId: academicLead.id, sortOrder: 2 },
      { position: 'Head of Mechatronics and Automation', managerId: academicLead.id, sortOrder: 3 },
      { position: 'Head of Student Services and Administration', managerId: administrationLead.id, sortOrder: 1 }
    ]
    await prisma.organizationMember.createMany({
      data: teamTemplates.map((template) => ({
        name: templateName,
        position: template.position,
        managerId: template.managerId,
        biography: '',
        isPublished: false,
        sortOrder: template.sortOrder
      }))
    })
    console.log('Unpublished team structure templates seeded. Replace placeholder names before publishing.')
  }

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
      update: {},
      create: {
        ...courseData,
        category: getCourseCategory(courseSeed.name),
        courseType: courseSeed.level === 'Short Course' ? 'Short Course' : 'Long Course'
      }
    })
    await prisma.centreCourse.upsert({
      where: { centreId_courseId: { centreId: centre.id, courseId: course.id } },
      update: {},
      create: { centreId: centre.id, courseId: course.id }
    })
  }

  for (const courseSeed of longCourseSeeds) {
    await prisma.course.upsert({
      where: { slug: courseSeed.slug },
      update: {},
      create: {
        ...courseSeed,
        courseType: 'Long Course',
        category: courseSeed.category
      }
    })
  }

  for (const courseSeed of shortCourseSeeds) {
    await prisma.course.upsert({
      where: { slug: courseSeed.slug },
      update: {},
      create: {
        ...courseSeed,
        level: courseSeed.level ?? 'Short Course',
        courseType: 'Short Course',
        startDate: courseSeed.startDate ? new Date(`${courseSeed.startDate}T00:00:00.000Z`) : null,
        fee: courseSeed.fee ?? null
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
    ['site.contactPhone', '+255 22 284 3360 / +255 22 284 3363'],
    ['site.contactEmail', 'kict@veta.go.tz'],
    ['site.officeHours', '8:00 AM - 3:30 PM, Monday to Friday'],
    ['site.physicalAddress', 'Karakata, Kipawa Ward, Ilala District, Dar es Salaam, Tanzania (near Julius Nyerere International Airport)'],
    ['site.postalAddress', 'P.O. Box 40040, Dar es Salaam, Tanzania'],
    ['site.mapUrl', 'https://www.google.com/maps/place/VETA+Kipawa-+ICT+CENTER/@-6.8524503,39.2112337,17.43z/data=!4m6!3m5!1s0x185c49c47717d247:0x7216aaad4e9f7ba3!8m2!3d-6.8523213!4d39.210794!16s%2Fg%2F11b6gp5v0m'],
    ['site.mapUrlNote', 'Google Maps listing for VETA Kipawa ICT Centre, Karakata, Kipawa, Ilala, Dar es Salaam.'],
    ['site.feedbackUrl', 'https://emrejesho.gov.go.tz'],
    ['publicInfo.reviewStatus', 'DRAFT: Office hours and legal notices require approval by authorized VETA Kipawa management and legal/ICT officers. The map and contact details point to the VETA Kipawa ICT Centre. After review, update this setting to APPROVED in Admin → Site settings.'],
    ['legal.privacy', 'This website may process information you provide when creating an account, submitting a course booking or application, sending an inquiry, or using other features. Depending on the feature, this may include your name, contact details, selected course or centre, and the contents of your message.\n\nThe suggested purposes are to operate the website, respond to requests, manage training enquiries and bookings, and maintain the security and functionality of the service. Any access to personal information should be limited to authorized staff whose duties require it.\n\nDo not submit passwords, payment card details, health information, or other sensitive personal information through free-text fields unless the institution has expressly requested it through an approved secure process.\n\nBefore approval, the institution must confirm the applicable lawful basis, retention periods, hosting and service providers, any data transfers, security controls, and procedures for access, correction, deletion, complaints, and data-protection requests. For questions, contact kict@veta.go.tz or +255 22 284 3360.'],
    ['legal.terms', 'Draft terms and conditions — requires review and approval by VETA before publication.\n\nBy using this website, you agree to use it lawfully and provide accurate information when creating an account, applying, booking a course, or contacting the institution. Keep your sign-in details confidential and promptly report suspected unauthorized use.\n\nSubmitting an application or course booking is a request only. It does not guarantee admission, a place, a particular course schedule, or a start date. Enrolment and any confirmed start date are subject to a decision communicated by authorized staff. Course availability, fees, locations, and schedules must be confirmed by the institution.\n\nWebsite content and services may be updated, changed, or temporarily unavailable. Links to external websites are provided for convenience; their content and practices are controlled by their respective operators.\n\nBefore approval, VETA should confirm eligibility and age requirements, fee and payment rules, cancellation and refund terms, account suspension rules, governing law, dispute handling, and any other official conditions of service.'],
    ['legal.disclaimer', 'Draft disclaimer — requires review and approval by VETA before publication.\n\nInformation on this website is provided for general information about training, courses, admissions, and related services. Course availability, fees, schedules, locations, and entry requirements may change and should be confirmed with the relevant VETA office before decisions are made.\n\nA submitted application or booking request is not an admission offer or guarantee of enrolment. A learner should rely on an official decision and the confirmed start date communicated by authorized staff.\n\nThe institution should review website information for accuracy, but this draft does not promise that every item is complete, current, or available at all times. External links lead to services operated by third parties and are not controlled by this website.\n\nThis draft is not legal, financial, or professional advice. VETA’s authorized officers should review and replace it with approved wording before publication.'],
    ['legal.copyright', 'Draft copyright notice — requires confirmation by VETA before publication.\n\n© 2026 VETA Kipawa ICT Centre. All rights reserved. Unless otherwise stated, website text, design, photographs, and other materials are provided for the purposes of this website and may be protected by copyright or other applicable rights. Do not reproduce or distribute protected material without permission from its rights holder, except where permitted by law.\n\nThird-party names, marks, and materials remain the property of their respective owners. Confirm ownership, permissions, exceptions, and the approved institutional name with VETA before publishing this notice.'],
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
  const preserveExistingSettings = new Set([
    'site.mapUrl',
    'publicInfo.reviewStatus',
    'legal.privacy',
    'legal.terms',
    'legal.disclaimer',
    'legal.copyright'
  ])
  for (const [key, value] of siteSettings) {
    if (preserveExistingSettings.has(key)) {
      const existing = await prisma.siteSetting.findUnique({ where: { key } })
      const hasOutdatedHeadOfficeDetails = /info@veta\.go\.tz|\+255 26 2963661|VETA\+HEAD\+OFFICE|VETA HEAD OFFICE|published VETA Head Office/i.test(existing?.value ?? '')
      if (existing?.value.trim() && !hasOutdatedHeadOfficeDetails) continue
    }
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
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
