import {
  ArrowRight,
  ArrowUp,
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  Check,
  Clock3,
  Copy,
  Cpu,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Home,
  Info,
  MessageCircle,
  Languages,
  LogIn,
  LogOut,
  Laptop,
  Mail,
  MapPin,
  Menu,
  Monitor,
  Network,
  Newspaper,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Play,
  RefreshCw,
  Search,
  Save,
  Send,
  Share2,
  Settings,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
  UserRoundCheck,
  UserPlus,
  Users,
  Wrench,
  Zap,
  X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { LanguageProvider } from './LanguageProvider'
import { useLanguage, useTranslate, type Language } from './language'
import './App.css'

type UserRole = string

type AppUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  roleId?: string | null
  permissions?: string[]
}

function getAnonymousDailyVisitorId(): string {
  const today = getLocalDateKey()
  const savedRecord = window.localStorage.getItem(DAILY_VISITOR_STORAGE_KEY)
  if (savedRecord) {
    try {
      const record: unknown = JSON.parse(savedRecord)
      if (
        typeof record === 'object' && record !== null &&
        'date' in record && record.date === today &&
        'visitorId' in record && typeof record.visitorId === 'string' &&
        VISITOR_ID_PATTERN.test(record.visitorId)
      ) return record.visitorId
    } catch {
      window.localStorage.removeItem(DAILY_VISITOR_STORAGE_KEY)
    }
  }
  const visitorId = window.crypto.randomUUID()
  window.localStorage.setItem(DAILY_VISITOR_STORAGE_KEY, JSON.stringify({ date: today, visitorId }))
  return visitorId
}

type Session = {
  user: AppUser
}

type AuthMode = 'login' | 'register' | null

const VETMIS_REGISTRATION_URL = 'https://vetmis.veta.go.tz/vet-mis/RegisterUserAccount/RegisterUserAccount.do'
const CAMPAIGN_ATTRIBUTION_STORAGE_KEY = 'kipawa-campaign-attribution'
const CAMPAIGN_ATTRIBUTION_FIELD_LIMITS = { source: 100, medium: 100, campaign: 150 } as const

type CampaignAttribution = {
  source: string
  medium: string
  campaign: string
}

function getCampaignAttribution(search: string): CampaignAttribution | null {
  const params = new URLSearchParams(search)
  const values = {
    source: params.get('utm_source')?.trim() ?? '',
    medium: params.get('utm_medium')?.trim() ?? '',
    campaign: params.get('utm_campaign')?.trim() ?? ''
  }
  if (!Object.values(values).some(Boolean)) return null
  if (
    values.source.length > CAMPAIGN_ATTRIBUTION_FIELD_LIMITS.source ||
    values.medium.length > CAMPAIGN_ATTRIBUTION_FIELD_LIMITS.medium ||
    values.campaign.length > CAMPAIGN_ATTRIBUTION_FIELD_LIMITS.campaign ||
    Object.values(values).some((value) => /[\u0000-\u001f\u007f]/.test(value))
  ) {
    console.warn('Campaign attribution was ignored because a campaign parameter is invalid.')
    return null
  }

  try {
    window.sessionStorage.setItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY, JSON.stringify(values))
  } catch (error) {
    console.warn('Campaign attribution could not be saved for this browser session.', error)
  }
  return values
}

function getStoredCampaignAttribution(): CampaignAttribution | null {
  try {
    const stored = window.sessionStorage.getItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return null

    const fields = ['source', 'medium', 'campaign'] as const
    const values = fields.map((field) => {
      const value = Reflect.get(parsed, field)
      const normalized = typeof value === 'string' ? value.trim() : ''
      return normalized.length <= CAMPAIGN_ATTRIBUTION_FIELD_LIMITS[field] &&
        !/[\u0000-\u001f\u007f]/.test(normalized)
        ? normalized
        : ''
    })
    if (!values.some(Boolean)) return null
    const [source, medium, campaign] = values
    return { source, medium, campaign }
  } catch (error) {
    console.warn('Campaign attribution could not be read from this browser session.', error)
    return null
  }
}

type CourseMediaItem = {
  id: string
  type: 'image' | 'video'
  url: string
}

type CourseCatalogItem = {
  id?: string
  name: string
  slug: string
  nameEn?: string
  level: string
  levelEn?: string
  duration: string
  durationEn?: string
  courseType?: string
  category?: string
  startDate?: string | null
  endDate?: string | null
  publishedFrom?: string | null
  publishedUntil?: string | null
  fee?: number | null
  imageUrl?: string | null
  media?: CourseMediaItem[]
  summary?: string
  summaryEn?: string
}

type SiteStatistic = {
  key: string
  value: number
  label: string
}

type OrganizationMember = {
  id: string
  name: string
  nameSw?: string | null
  nameEn?: string
  position: string
  positionSw?: string | null
  positionEn?: string
  biography: string
  biographySw?: string | null
  biographyEn?: string
  qualifications?: string | null
  qualificationsSw?: string | null
  qualificationsEn?: string
  responsibilities?: string | null
  responsibilitiesSw?: string | null
  responsibilitiesEn?: string
  imageUrl: string | null
  managerId: string | null
  sortOrder: number
  isPublished?: boolean
}

type PartnerProfile = {
  id: string
  name: string
  nameSw?: string | null
  description: string
  descriptionSw?: string | null
  logoUrl: string | null
  websiteUrl?: string | null
}

type NewsItem = {
  id: string
  slug: string
  title: string
  titleEn?: string
  date: string
  summary: string
  summaryEn?: string
  body?: string
  bodyEn?: string
  imageUrl?: string | null
  videoUrl?: string | null
  youtubeUrl?: string | null
}

type NewsCommentItem = {
  id: string
  userName: string
  content: string
  createdAt: string
}

type NewsArticleDetail = NewsItem & {
  likes: number
  dislikes: number
  userReaction: 'like' | 'dislike' | null
  comments: NewsCommentItem[]
}

type PublicationItem = {
  id: string
  title: string
  titleEn?: string
  titleSw?: string | null
  fileUrl: string
  course: {
    id: string
    name: string
    nameSw?: string | null
    slug: string
  } | null
  createdAt: string
}

type SiteSearchResult = {
  title: string
  category: string
  description: string
  to: string
  searchableText: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin
const canAccessAdmin = (user: AppUser) => user.role === 'admin' || Boolean(user.permissions?.length)
const COURSE_INTEREST_DATE_MAX = new Date().toISOString().slice(0, 10)
const SHORT_COURSE_TICKER_SETTING_KEY = 'home.shortCoursesTicker'
const DEFAULT_SHORT_COURSE_TICKER = 'NEW SHORT COURSES INTAKE OPENING SOON — ENROLMENT STARTS ON {startDate} — APPLY NOW!'
const SITE_SETTINGS_CHANGED_EVENT = 'site-settings-changed'
const SITE_VISITOR_COUNT_UPDATED_EVENT = 'site-visitor-count-updated'
const DAILY_VISITOR_STORAGE_KEY = 'kipawa-daily-visitor'
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_STORAGE_KEY = 'veta-session-v2'
let csrfToken: string | null = null
let csrfTokenRequest: Promise<string> | null = null
const KIPAWA_MAP_URL = 'https://www.google.com/maps/place/VETA+Kipawa-+ICT+CENTER/@-6.8524503,39.2112337,17.43z/data=!4m6!3m5!1s0x185c49c47717d247:0x7216aaad4e9f7ba3!8m2!3d-6.8523213!4d39.210794!16s%2Fg%2F11b6gp5v0m'
const KIPAWA_MAP_EMBED_URL = 'https://maps.google.com/maps?q=-6.8523213%2C39.210794&z=17&output=embed'
const KIPAWA_PHYSICAL_ADDRESS = 'Karakata, Kipawa Ward, Ilala District, Dar es Salaam, Tanzania (near Julius Nyerere International Airport)'
const KIPAWA_POSTAL_ADDRESS = 'P.O. Box 40040, Dar es Salaam, Tanzania'
const KIPAWA_CONTACT_PHONE = '+255 22 284 3360 / +255 22 284 3363'
const KIPAWA_CONTACT_EMAIL = 'kict@veta.go.tz'
const shortCourseAreas = [
  {
    id: 'ICT',
    label: 'ICT short courses',
    name: 'ICT',
    icon: Laptop,
    description: 'Build practical digital skills with focused training in computing, software and information technology.',
    topics: ['Computer applications and digital productivity', 'Networking and internet services', 'Software, web and digital tools', 'Practical ICT support and troubleshooting']
  },
  {
    id: 'ELECTRICAL',
    label: 'Electrical short courses',
    name: 'Electrical',
    icon: Zap,
    description: 'Develop focused electrical skills through practical instruction in safe installation, testing and maintenance.',
    topics: ['Electrical safety and tools', 'Wiring and installation practice', 'Circuit testing and measurements', 'Fault-finding and maintenance']
  },
  {
    id: 'ELECTRONICS',
    label: 'Electronics short courses',
    name: 'Electronics',
    icon: Cpu,
    description: 'Learn practical electronics through guided work with components, circuits and test equipment.',
    topics: ['Electronic components and circuits', 'Measurement and testing instruments', 'Assembly and soldering practice', 'Safe troubleshooting and equipment care']
  },
  {
    id: 'MECHATRONICS',
    label: 'Mechatronics short courses',
    name: 'Mechatronics',
    icon: Wrench,
    description: 'Explore practical skills combining mechanical systems, electrical components and basic automation.',
    topics: ['Mechanical systems and workshop practice', 'Motors, actuators and electrical components', 'Sensors and introductory controls', 'Basic automation and maintenance']
  },
  {
    id: 'OTHER',
    label: 'Other short courses',
    name: 'Other short courses',
    icon: BookOpen,
    description: 'Browse focused short-course training in additional practical and vocational areas.',
    topics: ['Course-specific practical skills', 'Guided hands-on activities', 'Workplace methods and safe practice', 'Applied exercises based on the course topic']
  }
] as const

function getShortCourseArea(course: CourseCatalogItem) {
  const category = course.category?.trim().toUpperCase()
  if (category && shortCourseAreas.some((area) => area.id === category)) return category
  return 'OTHER'
}

type NavigationChild = {
  label: string
  icon: LucideIcon
} & ({ to: string; href?: never } | { href: string; to?: never })

type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
  children?: NavigationChild[]
}

const navItems: NavigationItem[] = [
  { label: 'Home', to: '/', icon: Home },
  {
    label: 'About',
    to: '/about',
    icon: Info,
    children: [
      { label: 'About us', to: '/about', icon: Info },
      { label: 'Team', to: '/team', icon: Users },
      { label: 'Our partners', to: '/about#partners', icon: Building2 }
    ]
  },
  {
    label: 'Explore',
    to: '/long-courses',
    icon: BookOpen,
    children: [
      { label: 'Long courses', to: '/long-courses', icon: GraduationCap },
      { label: 'Short courses', to: '/short-courses', icon: Clock3 },
      { label: 'Labs', to: '/labs', icon: Cpu },
      { label: 'News', to: '/news', icon: FileText },
      { label: 'Contact', to: '/contact', icon: Mail }
    ]
  },
  {
    label: 'Services',
    to: '#services',
    icon: Cpu,
    children: [
      { label: 'Publications', to: '/publications', icon: FileText },
      { label: 'FAQ', to: '/faq', icon: MessageCircle },
      { label: 'Privacy policy', to: '/privacy', icon: FileText }
    ]
  }
]

const pageCoverImages = {
  about: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  news: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
  publications: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
  bookings: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80',
  dashboard: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80'
} as const

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  if (csrfTokenRequest) return csrfTokenRequest

  csrfTokenRequest = fetch(`${API_BASE_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  })
    .then(async (response) => {
      const body = await response.json()
      if (!response.ok || typeof body.csrfToken !== 'string') {
        throw new Error(body?.message ?? 'Unable to initialize request security.')
      }
      csrfToken = body.csrfToken
      return body.csrfToken as string
    })
    .finally(() => {
      csrfTokenRequest = null
    })

  return csrfTokenRequest
}

function localizeContentRecord<T>(record: T, language: Language): T {
  if (language !== 'sw' || record === null || typeof record !== 'object' || Array.isArray(record)) {
    return record
  }

  const source = record as Record<string, unknown>
  const localized: Record<string, unknown> = { ...source }
  for (const [key, value] of Object.entries(source)) {
    if (!key.endsWith('Sw') || typeof value !== 'string' || !value.trim()) continue
    const englishKey = key.slice(0, -2)
    if (englishKey in localized) {
      localized[`${englishKey}En`] ??= localized[englishKey]
      localized[englishKey] = value
    }
  }
  return localized as T
}

function useApiData<T>(endpoint: string) {
  const { language } = useLanguage()
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let requestController: AbortController | null = null

    const loadData = () => {
      requestController?.abort()
      const request = new AbortController()
      requestController = request
      fetchJson<{ data?: T[] }>(endpoint, request.signal)
        .then((body) => {
          if (!Array.isArray(body.data)) {
            throw new Error('The server returned an invalid data response.')
          }
          setData(body.data)
          setError('')
          setLoading(false)
        })
        .catch((requestError: unknown) => {
          if (!request.signal.aborted) {
            setError(requestError instanceof Error ? requestError.message : 'Unable to load data.')
            setLoading(false)
          }
        })
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadData()
    }

    loadData()
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      requestController?.abort()
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [endpoint])

  const localizedData = useMemo(() => data.map((item) => localizeContentRecord(item, language)), [data, language])
  return { data: localizedData, error, loading }
}

async function postJson<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': await getCsrfToken()
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload)
  })
  return parseApiResponse<T>(response)
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.ok
      ? 'The server returned an invalid response.'
      : `Request failed with status ${response.status}.`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error(`The server returned an invalid JSON response (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
      ? body.message
      : `Request failed with status ${response.status}.`
    throw new Error(message)
  }
  return body as T
}

async function mutateJson<T>(
  method: 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = { 'X-CSRF-Token': await getCsrfToken() }
  if (payload) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
    ...(payload ? { body: JSON.stringify(payload) } : {})
  })
  return parseApiResponse<T>(response)
}

async function mutateFormData<T>(
  method: 'POST' | 'PATCH' | 'PUT',
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'X-CSRF-Token': await getCsrfToken() },
    credentials: 'include',
    cache: 'no-store',
    body: formData
  })
  return parseApiResponse<T>(response)
}

function getMediaUrl(imageUrl: string): string {
  return new URL(imageUrl, API_ORIGIN).toString()
}

function formatLocaleDate(value: string, language: Language): string {
  return new Date(value).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB')
}

function formatCourseStartDate(value: string, language: Language): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    return date.toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
      dateStyle: 'medium',
      timeZone: 'Africa/Dar_es_Salaam'
    })
  }
  return date.toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Africa/Dar_es_Salaam'
  })
}

function formatExactDateTime(value: string, language: Language): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Dar_es_Salaam'
  })
}

function formatTanzaniaDateTimeInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    return `${date.toISOString().slice(0, 10)}T00:00`
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

function getTanzaniaDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function getLocalDateKey(date = new Date()): string {
  return getTanzaniaDateKey(date)
}

function isFutureCourseStart(value: string, today: string): boolean {
  return getTanzaniaDateKey(new Date(value)) > today
}

function isAnnouncedShortCourse(course: CourseCatalogItem, today: string): boolean {
  const publishedFrom = course.publishedFrom?.slice(0, 10)
  const publishedUntil = course.publishedUntil?.slice(0, 10)
  return course.courseType === 'Short Course' &&
    Boolean(publishedFrom && publishedUntil && publishedFrom <= today && publishedUntil >= today)
}

async function fetchJson<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    signal
  })
  return parseApiResponse<T>(response)
}

function useSiteSettings() {
  const { language } = useLanguage()
  const [englishSettings, setEnglishSettings] = useState<Record<string, string>>({})
  const [swahiliSettings, setSwahiliSettings] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let controller: AbortController | null = null
    const loadSettings = () => {
      controller?.abort()
      const requestController = new AbortController()
      controller = requestController
      setLoading(true)
      fetchJson<{ data: Record<string, string>; translations?: Record<string, string> }>('/site-settings', requestController.signal)
        .then(({ data, translations = {} }) => {
          setEnglishSettings(data)
          setSwahiliSettings(translations)
          setError('')
        })
        .catch((requestError: unknown) => {
          if (!requestController.signal.aborted) {
            setError(requestError instanceof Error ? requestError.message : 'Unable to load site settings.')
          }
        })
        .finally(() => {
          if (!requestController.signal.aborted) setLoading(false)
        })
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadSettings()
    }

    loadSettings()
    window.addEventListener(SITE_SETTINGS_CHANGED_EVENT, loadSettings)
    window.addEventListener('focus', loadSettings)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      controller?.abort()
      window.removeEventListener(SITE_SETTINGS_CHANGED_EVENT, loadSettings)
      window.removeEventListener('focus', loadSettings)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  const settings = useMemo(() => {
    if (language !== 'sw') return englishSettings
    return Object.fromEntries(
      Object.entries(englishSettings).map(([key, value]) => [key, swahiliSettings[key]?.trim() || value])
    )
  }, [englishSettings, language, swahiliSettings])

  return { settings, error, loading }
}

function safeHttpsUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function splitContactPhones(value: string): string[] {
  return value.split(/[;,]/).flatMap((group) => group.split('/')).map((phone) => phone.trim()).filter(Boolean)
}

function PageCover({ label, title, image }: { label: string; title: string; image: string }) {
  const t = useTranslate()
  return (
    <div className="page-cover" style={{ backgroundImage: `linear-gradient(135deg, rgba(6, 24, 52, 0.72), rgba(10, 88, 170, 0.48)), url(${image})` }}>
      <div className="page-cover-inner">
        <span className="eyebrow light-eyebrow">{t(label)}</span>
        <h1>{t(title)}</h1>
      </div>
    </div>
  )
}

function SiteSearch({
  results,
  errors
}: {
  results: SiteSearchResult[]
  errors: string[]
}) {
  const t = useTranslate()
  const [query, setQuery] = useState('')
  const searchPlaceholders = useMemo(() => [
    t('Search courses, news and resources...'),
    t('Find a course or programme...'),
    t('Search Kipawa information...')
  ], [t])
  const [searchPlaceholder, setSearchPlaceholder] = useState(searchPlaceholders[0])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matchingResults = normalizedQuery.length >= 2
    ? results
      .filter((result) => {
        const searchableText = `${result.title} ${result.category} ${result.description} ${result.searchableText} ${t(result.title)} ${t(result.category)} ${t(result.description)}`.toLocaleLowerCase()
        return searchableText.includes(normalizedQuery)
      })
      .slice(0, 8)
    : []
  const showResults = normalizedQuery.length >= 2

  useEffect(() => {
    let phraseIndex = 0
    let characterIndex = 0
    let deleting = false
    let timeoutId: number | undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      setSearchPlaceholder(searchPlaceholders[0])
      return
    }

    const typeNextCharacter = () => {
      const phrase = searchPlaceholders[phraseIndex]
      if (!deleting) {
        characterIndex += 1
        setSearchPlaceholder(phrase.slice(0, characterIndex))
        if (characterIndex === phrase.length) {
          deleting = true
          timeoutId = window.setTimeout(typeNextCharacter, 1700)
          return
        }
      } else {
        characterIndex -= 1
        setSearchPlaceholder(phrase.slice(0, characterIndex))
        if (characterIndex === 0) {
          deleting = false
          phraseIndex = (phraseIndex + 1) % searchPlaceholders.length
          timeoutId = window.setTimeout(typeNextCharacter, 350)
          return
        }
      }
      timeoutId = window.setTimeout(typeNextCharacter, deleting ? 34 : 62)
    }

    setSearchPlaceholder('')
    timeoutId = window.setTimeout(typeNextCharacter, 180)
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [searchPlaceholders])

  return (
    <div className="header-search">
      <form className="header-search-form" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={19} className="header-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setQuery('')
          }}
          placeholder={searchPlaceholder}
          aria-label={t('Search the website')}
          aria-expanded={showResults}
          aria-controls="header-search-results"
          autoComplete="off"
        />
        <button
          type="submit"
          className="header-search-button"
          aria-label={t('Search')}
          title={t('Search')}
        >
          <Search size={19} aria-hidden="true" />
        </button>
      </form>
      {showResults && (
        <div className="header-search-results" id="header-search-results" role="region" aria-label={t('Search results')}>
          {matchingResults.length > 0 ? (
            <>
              <span className="search-results-heading">{t('Search results')}</span>
              {matchingResults.map((result, index) => (
                <Link
                  key={`${result.to}-${result.title}-${index}`}
                  to={result.to}
                  className="search-result-link"
                  onClick={() => setQuery('')}
                >
                  <span className="search-result-copy">
                    <strong>{t(result.title)}</strong>
                    <small>{t(result.description)}</small>
                  </span>
                  <span className="search-result-category">{t(result.category)}</span>
                </Link>
              ))}
            </>
          ) : (
            <p className="search-empty-state">{t('No results found.')}</p>
          )}
          {errors.length > 0 && (
            <p className="search-source-errors" role="status">
              {t('Some results could not be loaded')}: {errors.join('; ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Breadcrumbs({ pathname, news, courses }: {
  pathname: string
  news: NewsItem[]
  courses: CourseCatalogItem[]
}) {
  const t = useTranslate()
  if (pathname === '/') return null

  const pageLabels: Record<string, string> = {
    '/about': 'About us',
    '/labs': 'Labs',
    '/team': 'Team',
    '/courses': 'Courses and programmes',
    '/long-courses': 'Long courses',
    '/short-courses': 'Short courses',
    '/news': 'News and announcements',
    '/publications': 'Publications and downloads',
    '/contact': 'Contact us',
    '/faq': 'Frequently asked questions',
    '/sitemap': 'Sitemap',
    '/privacy': 'Privacy policy',
    '/terms': 'Terms and conditions',
    '/disclaimer': 'Disclaimer',
    '/copyright': 'Copyright statement',
    '/login': 'Login',
    '/register': 'Register',
    '/bookings': 'Book a course',
    '/dashboard': 'Learner dashboard',
    '/admin': 'Administration dashboard'
  }

  const article = news.find((item) => pathname === `/news/${encodeURIComponent(item.slug)}`)
  const course = courses.find((item) => pathname === `/courses/${encodeURIComponent(item.slug)}`)
  const courseListPath = course?.courseType === 'Short Course' ? '/short-courses' : '/long-courses'
  const courseListLabel = course?.courseType === 'Short Course' ? 'Short courses' : 'Long courses'
  const currentLabel = article?.title ?? course?.name ?? pageLabels[pathname] ??
    (pathname.startsWith('/news/') ? 'News article' : pathname.startsWith('/courses/') ? 'Course details' : 'Page not found')

  return (
    <nav className="breadcrumbs" aria-label={t('Breadcrumb')}>
      <ol>
        <li><Link to="/">{t('Home')}</Link></li>
        {article ? (
          <>
            <li><Link to="/news">{t('News and announcements')}</Link></li>
            <li aria-current="page">{article.title}</li>
          </>
        ) : course ? (
          <>
            <li><Link to={courseListPath}>{t(courseListLabel)}</Link></li>
            <li aria-current="page">{course.name}</li>
          </>
        ) : pathname.startsWith('/courses/') ? (
          <>
            <li><Link to="/long-courses">{t('Long courses')}</Link></li>
            <li aria-current="page">{t('Course details')}</li>
          </>
        ) : (
          <li aria-current="page">{t(currentLabel)}</li>
        )}
      </ol>
    </nav>
  )
}

function FaqPage() {
  const t = useTranslate()
  const questions = [
    {
      question: 'How do I find a course?',
      answer: 'Browse the courses page or use the website search to look up a programme.'
    },
    {
      question: 'How do I request a course booking?',
      answer: 'Short courses: create or sign in to a learner account, open an announced course, and submit a request. The centre will call to confirm your phone number. Wait for the centre to issue an official control number before paying the TSh 5,000 application form fee. Upload the payment screenshot in your dashboard; after staff verify it, complete the application there. A request is not a confirmed place. Long courses and diploma programmes: apply through VET-MIS; the centre website does not submit that application.'
    },
    {
      question: 'How can I contact the centre?',
      answer: 'Use the contact form on the Contact Us page. Published phone, email, address, and map details appear there when configured.'
    },
    {
      question: 'Where can I find publications and news?',
      answer: 'Open Publications for downloadable resources and News for announcements and updates.'
    }
  ]

  return (
    <section className="content-page">
      <header className="news-page-intro">
        <span className="eyebrow">{t('Frequently asked questions')}</span>
        <h1>{t('Answers to common questions about courses and training.')}</h1>
      </header>
      <div className="faq-list">
        {questions.map(({ question, answer }) => (
          <details className="faq-item" key={question}>
            <summary>{t(question)}</summary>
            <p>{t(answer)}</p>
          </details>
        ))}
      </div>
      <p className="faq-contact-link">{t('Still need help?')} <Link to="/contact">{t('Contact us')}</Link></p>
    </section>
  )
}

function SitemapPage() {
  const t = useTranslate()
  const links = [
    ['Home', '/'],
    ['About us', '/about'],
    ['Long courses', '/long-courses'],
    ['Short courses', '/short-courses'],
    ['News and announcements', '/news'],
    ['Publications and downloads', '/publications'],
    ['Contact us', '/contact'],
    ['Frequently asked questions', '/faq'],
    ['Privacy policy', '/privacy'],
    ['Terms and conditions', '/terms'],
    ['Disclaimer', '/disclaimer'],
    ['Copyright statement', '/copyright']
  ] as const

  return (
    <section className="content-page">
      <ul className="sitemap-list">
        {links.map(([label, path]) => (
          <li key={path}><Link to={path}>{t(label)}</Link></li>
        ))}
      </ul>
    </section>
  )
}

function LegalInformationPage({ title, settingKey, showCover = true }: { title: string; settingKey: string; showCover?: boolean }) {
  const t = useTranslate()
  const { settings } = useSiteSettings()
  const isPrivacyPolicy = settingKey === 'legal.privacy'
  const content = (settings[settingKey] ?? '').replace(
    /^Draft privacy notice — requires review by VETA’s authorized legal and data-protection officers before publication\.\s*/i,
    ''
  )
  const paragraphs = content.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  const publicInfoDraft = !isPrivacyPolicy && (
    settings['publicInfo.reviewStatus']?.trim().toUpperCase() !== 'APPROVED' ||
    /^\s*draft\b/i.test(settings[settingKey] ?? '')
  )

  return (
    <section className="content-page legal-page">
      {showCover && <PageCover label={title} title={title} image={pageCoverImages.publications} />}
      {publicInfoDraft && (
        <p className="legal-pending" role="status">
          {t('The text below is a suggested draft and is not an approved VETA policy. Please confirm the official wording before relying on or publishing it.')}
        </p>
      )}
      {paragraphs.length > 0 ? (
        paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
      ) : (
        <p className="legal-pending" role="status">
          {t('This statement has not yet been configured. An authorized administrator must add approved content in Site settings using the key')} <code>{settingKey}</code>.
        </p>
      )}
    </section>
  )
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

function isBackToTopVisible() {
  return window.scrollY > 400
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </LanguageProvider>
  )
}

function AppShell() {
  const t = useTranslate()
  const { language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMode, setAuthMode] = useState<AuthMode>(null)
  const [logoutRedirecting, setLogoutRedirecting] = useState(false)
  const [hasHomePageLoaded, setHasHomePageLoaded] = useState(false)
  const completeInitialHomeLoad = useCallback(() => setHasHomePageLoaded(true), [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openNavMenu, setOpenNavMenu] = useState<string | null>(null)
  const showBackToTop = useSyncExternalStore(subscribeToScroll, isBackToTopVisible, () => false)
  const { data: searchCourses, error: searchCoursesError } = useApiData<CourseCatalogItem>('/courses')
  const { data: searchNews, error: searchNewsError } = useApiData<NewsItem>('/news')
  const { data: searchPublications, error: searchPublicationsError } = useApiData<PublicationItem>('/publications')
  const { settings } = useSiteSettings()
  const siteName = settings['site.name'] ?? 'VETA Kipawa ICT Centre'
  const routeAuthMode: AuthMode = !logoutRedirecting && authReady && !session && location.pathname === '/login'
    ? 'login'
    : !logoutRedirecting && authReady && !session && location.pathname === '/register'
      ? 'register'
      : null
  const visibleAuthMode = authMode ?? routeAuthMode

  useEffect(() => {
    const scrollToCurrentLocation = () => {
      if (location.hash) {
        const rawId = location.hash.slice(1)
        let targetId = rawId
        try {
          targetId = decodeURIComponent(rawId)
        } catch {
          targetId = rawId
        }
        if (targetId === 'partners') targetId = 'about-partners-panel'
        const target = document.getElementById(targetId)
        if (target) {
          const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 16)
          document.documentElement.scrollTop = targetTop
          document.body.scrollTop = targetTop
          return
        }
      }

      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    const frame = window.requestAnimationFrame(scrollToCurrentLocation)
    const retry = window.setTimeout(scrollToCurrentLocation, 350)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [location.pathname, location.hash])

  const closeAuth = () => {
    setAuthMode(null)
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/', { replace: true })
    }
  }

  useEffect(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    window.localStorage.removeItem('veta-session')
    let active = true
    fetchJson<{ user: AppUser | null }>('/auth/session')
      .then(({ user }) => {
        if (active) setSession(user ? { user } : null)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setSession(null)
          const message = requestError instanceof Error ? requestError.message : 'Unable to restore your session.'
          setAuthError(['Authentication required.', 'Invalid or expired token.', 'User not found or inactive.'].includes(message)
            ? ''
            : message)
        }
      })
      .finally(() => {
        if (active) setAuthReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (logoutRedirecting && location.pathname === '/') {
      setLogoutRedirecting(false)
    }
  }, [location.pathname, logoutRedirecting])

  useEffect(() => {
    getCampaignAttribution(location.search)
  }, [location.search])

  useEffect(() => {
    let visitorId: string
    try {
      visitorId = getAnonymousDailyVisitorId()
    } catch (trackingError) {
      console.warn('Anonymous visitor counting is unavailable because browser storage could not be accessed.', trackingError)
      return
    }
    void postJson<{ visitorCount: number }>('/site-stats/visitor', { visitorId })
      .then(({ visitorCount }) => {
        if (!Number.isSafeInteger(visitorCount) || visitorCount < 0) {
          throw new Error('The server returned an invalid visitor count.')
        }
        window.dispatchEvent(new CustomEvent(SITE_VISITOR_COUNT_UPDATED_EVENT, { detail: visitorCount }))
      })
      .catch((trackingError: unknown) => {
        console.error('Unable to record the anonymous website visit.', trackingError)
      })
  }, [])

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      '/': 'Home',
      '/about': 'About us',
      '/labs': 'Labs',
      '/team': 'Team',
      '/courses': 'Courses and programmes',
      '/long-courses': 'Long courses',
      '/short-courses': 'Short courses',
      '/news': 'News and announcements',
      '/publications': 'Publications and downloads',
      '/contact': 'Contact us',
      '/faq': 'Frequently asked questions',
      '/sitemap': 'Sitemap',
      '/privacy': 'Privacy policy',
      '/terms': 'Terms and conditions',
      '/disclaimer': 'Disclaimer',
      '/copyright': 'Copyright statement',
      '/login': 'Login',
      '/register': 'Register',
      '/bookings': 'Book a course',
      '/dashboard': 'Learner dashboard',
      '/admin': 'Administration dashboard'
    }
    const article = searchNews.find((item) => location.pathname === `/news/${encodeURIComponent(item.slug)}`)
    const course = searchCourses.find((item) => location.pathname === `/courses/${encodeURIComponent(item.slug)}`)
    const title = article?.title ?? course?.name ?? pageTitles[location.pathname] ??
      (location.pathname.startsWith('/news/') ? 'News article' : location.pathname.startsWith('/courses/') ? 'Course details' : 'Page not found')
    document.title = `${t(title)} | VETA Kipawa ICT Center`
  }, [location.pathname, searchCourses, searchNews, t])

  const handleSignIn = (nextSession: Session) => {
    setSession(nextSession)
    setAuthError('')
    setAuthMode(null)
    if (canAccessAdmin(nextSession.user)) {
      navigate('/admin')
    } else if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/news', { replace: true })
    }
  }

  const handleSignOut = async () => {
    setAuthError('')
    try {
      await postJson('/auth/logout', {})
      csrfToken = null
      setAuthMode(null)
      setLogoutRedirecting(true)
      setSession(null)
      navigate('/', { replace: true })
    } catch (requestError) {
      setAuthError(requestError instanceof Error ? requestError.message : 'Unable to sign out.')
    }
  }

  useEffect(() => {
    if (!openNavMenu) return

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenNavMenu(null)
    }
    window.addEventListener('keydown', closeMenuOnEscape)
    return () => window.removeEventListener('keydown', closeMenuOnEscape)
  }, [openNavMenu])

  const navLinks = useMemo(
    () => session
      ? [
          ...navItems,
          {
            label: 'Dashboard',
            to: canAccessAdmin(session.user) ? '/admin' : '/dashboard',
            icon: canAccessAdmin(session.user) ? ShieldCheck : Users
          }
        ]
      : navItems,
    [session]
  )

  const searchResults = useMemo<SiteSearchResult[]>(() => {
    const pageResults: SiteSearchResult[] = [
      { title: t('Home'), category: t('Page'), description: t('Welcome to VETA Kipawa ICT Center.'), to: '/', searchableText: 'home mwanzo kipawa veta ict center' },
      { title: t('About us'), category: t('Page'), description: t('Learn about VETA and the training centre.'), to: '/about', searchableText: 'about us about veta kuhusu sisi mission values' },
      { title: t('Team'), category: t('Page'), description: t('Meet the VETA Kipawa team and explore reporting relationships.'), to: '/team', searchableText: 'team staff management leadership organization structure timu' },
      { title: t('Labs'), category: t('Page'), description: t('Explore the practical learning labs and workshops at VETA Kipawa.'), to: '/labs', searchableText: 'labs workshops maabara practical learning ict electronics mechatronics' },
      { title: t('Our partners'), category: t('Page'), description: t('Learn about opportunities to collaborate with VETA Kipawa.'), to: '/about#partners', searchableText: 'partners partnership industry employers collaboration' },
      { title: t('Long courses'), category: t('Page'), description: t('Explore long course programmes and published listings.'), to: '/long-courses', searchableText: 'long courses kozi ndefu training programme programmes' },
      { title: t('Short courses'), category: t('Page'), description: t('Browse short courses by training area.'), to: '/short-courses', searchableText: 'short courses kozi fupi ict electrical electronics mechatronics' },
      { title: t('News'), category: t('Page'), description: t('Read the latest news and announcements.'), to: '/news', searchableText: 'news habari announcements updates' },
      { title: t('Publications'), category: t('Page'), description: t('Browse publications and downloads.'), to: '/publications', searchableText: 'publications downloads resources documents machapisho' },
      { title: t('Contact us'), category: t('Page'), description: t('Get in touch with the centre support team.'), to: '/contact', searchableText: 'contact us mawasiliano help support phone email' },
      { title: t('Frequently asked questions'), category: t('Page'), description: t('Answers about courses and contact.'), to: '/faq', searchableText: 'faq frequently asked questions maswali answers' },
      { title: t('Sitemap'), category: t('Page'), description: t('Browse all website sections and information pages.'), to: '/sitemap', searchableText: 'sitemap site map ramani ya tovuti' },
      { title: t('Privacy policy'), category: t('Page'), description: t('Information about privacy and personal data.'), to: '/privacy', searchableText: 'privacy policy data information faragha' },
      { title: t('Terms and conditions'), category: t('Page'), description: t('Terms governing use of the website.'), to: '/terms', searchableText: 'terms conditions website use sheria' },
      { title: t('Disclaimer'), category: t('Page'), description: t('Website information and responsibility statement.'), to: '/disclaimer', searchableText: 'disclaimer taarifa' },
      { title: t('Copyright statement'), category: t('Page'), description: t('Copyright and reuse information.'), to: '/copyright', searchableText: 'copyright rights reuse hakimiliki' }
    ]
    const courseResults = searchCourses.map((course): SiteSearchResult => ({
      title: course.name,
      category: 'Course',
      description: [course.level, course.duration, course.summary].filter(Boolean).join(' · '),
      to: `/courses/${encodeURIComponent(course.slug)}`,
      searchableText: `${course.name} ${course.nameEn ?? ''} ${course.level} ${course.levelEn ?? ''} ${course.duration} ${course.durationEn ?? ''} ${course.courseType ?? ''} ${course.summary ?? ''} ${course.summaryEn ?? ''}`
    }))
    const newsResults = searchNews.map((item): SiteSearchResult => ({
      title: item.title,
      category: 'News',
      description: item.summary,
      to: `/news/${encodeURIComponent(item.slug)}`,
      searchableText: `${item.title} ${item.titleEn ?? ''} ${item.summary} ${item.summaryEn ?? ''} ${item.body ?? ''} ${item.bodyEn ?? ''}`
    }))
    const publicationResults = searchPublications.map((item): SiteSearchResult => ({
      title: item.title,
      category: 'Publication',
      description: item.course
        ? `${t('Publication and downloadable resource')} · ${localizeContentRecord(item.course, language).name}`
        : t('Publication and downloadable resource'),
      to: '/publications',
      searchableText: `${item.title} ${item.titleEn ?? ''}`
    }))

    return [...pageResults, ...courseResults, ...newsResults, ...publicationResults]
  }, [language, searchCourses, searchNews, searchPublications, t])

  const searchErrors = [
    searchCoursesError && `Courses: ${t(searchCoursesError)}`,
    searchNewsError && `News: ${t(searchNewsError)}`,
    searchPublicationsError && `Publications: ${t(searchPublicationsError)}`
  ].filter((error): error is string => Boolean(error))

  return (
    <div className="app-shell light-theme">
      <header className="topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label={t(mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu')}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={mobileMenuOpen ? 'main-nav open' : 'main-nav'} aria-label={t('Main navigation')}>
          {navLinks.map((item) => {
            const Icon = item.icon

            if ('children' in item && item.children) {
              const submenuId = `nav-submenu-${item.label.toLowerCase()}`
              return (
                <div key={item.label} className={openNavMenu === item.label ? 'nav-group open' : 'nav-group'}>
                  <button
                    type="button"
                    className="nav-link nav-group-trigger"
                    aria-expanded={openNavMenu === item.label}
                    aria-controls={submenuId}
                    onClick={() => setOpenNavMenu((current) => current === item.label ? null : item.label)}
                  >
                    <Icon size={16} className="nav-link-icon" />
                    <span>{t(item.label)}</span>
                    <ChevronDown size={14} className="nav-chevron" aria-hidden="true" />
                  </button>

                  <div className="nav-submenu" id={submenuId}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      if ('href' in child) {
                        return (
                          <a
                            key={child.href}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="submenu-link"
                            onClick={() => {
                              setMobileMenuOpen(false)
                              setOpenNavMenu(null)
                            }}
                          >
                            <ChildIcon size={14} className="nav-link-icon" />
                            <span>{t(child.label)}</span>
                          </a>
                        )
                      }

                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) => (isActive ? 'submenu-link active' : 'submenu-link')}
                          onClick={() => {
                            setMobileMenuOpen(false)
                            setOpenNavMenu(null)
                          }}
                        >
                          <ChildIcon size={14} className="nav-link-icon" />
                          <span>{t(child.label)}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => [
                  isActive ? 'nav-link active' : 'nav-link',
                  item.label === 'Dashboard' ? 'dashboard-nav-link' : ''
                ].filter(Boolean).join(' ')}
                title={item.label === 'Dashboard' ? t(item.label) : undefined}
                aria-label={item.label === 'Dashboard' ? t(item.label) : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={16} className="nav-link-icon" />
                {item.label !== 'Dashboard' && <span>{t(item.label)}</span>}
              </NavLink>
            )
          })}
          {session ? (
            <div className="account-box">
              <span className="account-chip">{t(session.user.role === 'admin' ? 'Admin' : canAccessAdmin(session.user) ? 'Staff' : 'User')}</span>
              <span className="account-name">{session.user.name}</span>
              <button
                type="button"
                className="secondary-button compact-button icon-button header-signout-button"
                onClick={handleSignOut}
                aria-label={t('Sign out')}
                title={t('Sign out')}
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <button
                type="button"
                className="secondary-button compact-button icon-button header-register-button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setAuthMode('register')
                }}
                aria-label={t('Register')}
                title={t('Register')}
              >
                <UserPlus size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="secondary-button compact-button icon-button header-login-button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setAuthMode('login')
                }}
                aria-label={t('Login')}
                title={t('Login')}
              >
                <LogIn size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            className="language-toggle"
            aria-label={t(language === 'en' ? 'Switch language to Kiswahili' : 'Switch language to English')}
            title={t(language === 'en' ? 'Switch language to Kiswahili' : 'Switch language to English')}
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
          >
            <Languages size={19} aria-hidden="true" />
          </button>
        </nav>
        <SiteSearch results={searchResults} errors={searchErrors} />
      </header>

      {visibleAuthMode && (
        <AuthDialog
          key={visibleAuthMode}
          mode={visibleAuthMode}
          onModeChange={setAuthMode}
          onClose={closeAuth}
          onSuccess={handleSignIn}
        />
      )}

      <main className="page-shell">
        <Breadcrumbs pathname={location.pathname} news={searchNews} courses={searchCourses} />
        {authError && <p className="error-message" role="alert">{t(authError)}</p>}
        <Routes>
          <Route path="/" element={<HomePage session={session} isInitialLoad={!hasHomePageLoaded} onInitialLoadComplete={completeInitialHomeLoad} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/labs" element={<AboutPage />} />
          <Route path="/centres" element={<Navigate to="/labs" replace />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/courses" element={<Navigate to="/long-courses" replace />} />
          <Route path="/long-courses" element={<CoursesPage courseType="Long Course" session={session} />} />
          <Route path="/short-courses" element={<CoursesPage courseType="Short Course" session={session} />} />
        <Route path="/courses/:slug" element={<CourseDetailPage session={session} />} />
          <Route path="/admissions" element={<Navigate to="/long-courses" replace />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsArticlePage session={session} onOpenLogin={() => setAuthMode('login')} />} />
          <Route path="/publications" element={<PublicationsPageV2 />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/privacy" element={<LegalInformationPage title="Privacy policy" settingKey="legal.privacy" showCover={false} />} />
          <Route path="/terms" element={<LegalInformationPage title="Terms and conditions" settingKey="legal.terms" showCover={false} />} />
          <Route path="/disclaimer" element={<LegalInformationPage title="Disclaimer" settingKey="legal.disclaimer" showCover={false} />} />
          <Route path="/copyright" element={<LegalInformationPage title="Copyright statement" settingKey="legal.copyright" showCover={false} />} />
          <Route
            path="/login"
            element={logoutRedirecting
              ? <Navigate to="/" replace />
              : !authReady
              ? <p>{t('Checking your session…')}</p>
              : session ? <Navigate to={canAccessAdmin(session.user) ? '/admin' : '/news'} replace /> : null}
          />
          <Route
            path="/register"
            element={logoutRedirecting
              ? <Navigate to="/" replace />
              : !authReady
              ? <p>{t('Checking your session…')}</p>
              : session ? <Navigate to={canAccessAdmin(session.user) ? '/admin' : '/news'} replace /> : null}
          />
          <Route path="/bookings" element={<Navigate to="/courses" replace />} />
          <Route
            path="/dashboard"
            element={logoutRedirecting
              ? <Navigate to="/" replace />
              : !authReady
              ? <p>{t('Checking your session…')}</p>
              : session
              ? canAccessAdmin(session.user)
                  ? <Navigate to="/admin" replace />
                  : <UserDashboard session={session} />
              : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={logoutRedirecting
              ? <Navigate to="/" replace />
              : !authReady
              ? <p>{t('Checking your session…')}</p>
              : session
              ? canAccessAdmin(session.user)
                ? <AdminPage session={session} />
                : <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className={`footer-top${location.pathname === '/contact' ? ' footer-top-no-location' : ''}`}>
          <div className="footer-column footer-brand-column">
            <div className="footer-brand">
              <div>
                <div className="brand-name">{siteName}</div>
                <p>{settings['site.footerTagline'] ?? t('Skilled labour force for the future of Tanzania.')}</p>
              </div>
            </div>
            <ul className="footer-list contact-list">
              <li>
                <MapPin size={15} />
                <span>{settings['site.physicalAddress'] ?? KIPAWA_PHYSICAL_ADDRESS}</span>
              </li>
              <li>
                <MapPin size={15} />
                <span>{settings['site.postalAddress'] ?? KIPAWA_POSTAL_ADDRESS}</span>
              </li>
              <li>
                <Phone size={15} />
                <span>{splitContactPhones(settings['site.contactPhone'] ?? KIPAWA_CONTACT_PHONE).map((phone, index) => (
                  <span key={phone}>{index > 0 && ' / '}<a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a></span>
                ))}</span>
              </li>
              <li>
                <Mail size={15} />
                <a href={`mailto:${settings['site.contactEmail'] ?? KIPAWA_CONTACT_EMAIL}`}>
                  {settings['site.contactEmail'] ?? KIPAWA_CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-column footer-explore-column">
            <h4>{t('Explore the website')}</h4>
            <nav aria-label={t('Footer navigation')}>
              <ul className="footer-list footer-direct-links">
                <li><Link to="/about">{t('About us')}</Link></li>
                <li><Link to="/long-courses">{t('Long courses')}</Link></li>
                <li><Link to="/short-courses">{t('Short courses')}</Link></li>
                <li><Link to="/news">{t('News')}</Link></li>
                <li><Link to="/publications">{t('Publications')}</Link></li>
                <li><a href="https://vetmis.veta.go.tz/vet-mis/ManageHome/ManageHome.do" target="_blank" rel="noreferrer">{t('VetMIS')}</a></li>
                <li><a href="https://emrejesho.gov.go.tz/" target="_blank" rel="noreferrer">emrejesho</a></li>
                <li><Link to="/faq">{t('FAQ')}</Link></li>
                <li><Link to="/contact">{t('Contact')}</Link></li>
                <li><Link to="/privacy">{t('Privacy policy')}</Link></li>
              </ul>
            </nav>
          </div>

          {location.pathname !== '/contact' && (
            <div className="footer-column">
              <h4>{t('Location')}</h4>
              <div className="map-box">
                <div className="map-box-header">
                  <MapPin size={16} />
                  <span>{siteName}</span>
                </div>
                <p>{settings['site.physicalAddress'] ?? KIPAWA_PHYSICAL_ADDRESS}</p>
                <iframe
                  src={KIPAWA_MAP_EMBED_URL}
                  title={t('VETA Kipawa ICT Centre location on Google Maps')}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <a
                  href={safeHttpsUrl(settings['site.mapUrl']) ?? KIPAWA_MAP_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('Open map')} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <span>
            {t('©')} {new Date().getFullYear()} {siteName}. {t('All rights reserved.')}
          </span>
          <div className="footer-socials social-media-rail" role="group" aria-label={t('Social media')}>
            <a className="social-link social-link-instagram" href="https://www.instagram.com/veta_kipawa/?hl=en" target="_blank" rel="noreferrer" aria-label={t('Instagram')} title={t('Instagram')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a className="social-link social-link-youtube" href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label={t('YouTube')} title={t('YouTube')}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
              </svg>
            </a>
            <a className="social-link social-link-facebook" href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label={t('Facebook')} title={t('Facebook')}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />
              </svg>
            </a>
            <a className="social-link social-link-tiktok" href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label={t('TikTok')} title={t('TikTok')}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.6 6.1a5.6 5.6 0 0 1-3.4-4.6V1h-3.8v14.5a2.8 2.8 0 1 1-2.8-2.8c.4 0 .8.1 1.1.2V9a7 7 0 1 0 5.5 6.8V8.4a9.3 9.3 0 0 0 5.4 1.7V6.3c-.7 0-1.4-.1-2-.2Z" />
              </svg>
            </a>
            <a className="social-link social-link-x" href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X" title="X">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
              </svg>
            </a>
            <a className="social-link social-link-linkedin" href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V8.9h3.5v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.2 2.4 4.2 5.5v6.4ZM5.2 7.3a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13.2H3.4V8.9H7v11.6ZM22.2 0H1.8C.8 0 0 .8 0 1.8v20.4c0 1 .8 1.8 1.8 1.8h20.4c1 0 1.8-.8 1.8-1.8V1.8c0-1-.8-1.8-1.8-1.8Z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={() => window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
          })}
          aria-label={t('Back to top')}
          title={t('Back to top')}
        >
          <ArrowUp size={22} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
      <a
        className="whatsapp-float"
        href="https://wa.me/255653764871"
        target="_blank"
        rel="noreferrer"
        aria-label={t('Chat with customer service on WhatsApp')}
        title={t('Chat with customer service on WhatsApp')}
      >
        <span className="whatsapp-presence" aria-hidden="true">
          <span className="whatsapp-presence-dot" />
          <span>{t('Chat with us')}</span>
          <small>{t('Customer service')}</small>
        </span>
        <span className="whatsapp-icon-wrap" aria-hidden="true">
          <MessageCircle className="whatsapp-chat-icon" size={26} strokeWidth={2.2} />
          <Phone className="whatsapp-phone-icon" size={12} strokeWidth={2.8} />
        </span>
      </a>
    </div>
  )
}

function AnimatedCount({ value, language }: { value: number; language: Language }) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const hasStartedRef = useRef(false)
  const displayedCountRef = useRef(0)

  useEffect(() => {
    const element = countRef.current
    if (!element) return

    let animationFrame = 0
    let observer: IntersectionObserver | null = null
    const animate = () => {
      if (!hasStartedRef.current) hasStartedRef.current = true
      const startValue = displayedCountRef.current

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        displayedCountRef.current = value
        setCount(value)
        return
      }

      const duration = 1100
      let startTime: number | null = null
      const updateCount = (timestamp: number) => {
        if (startTime === null) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const easedProgress = 1 - (1 - progress) ** 4
        const nextCount = Math.round(startValue + (value - startValue) * easedProgress)
        displayedCountRef.current = nextCount
        setCount(nextCount)
        if (progress < 1) animationFrame = window.requestAnimationFrame(updateCount)
      }
      animationFrame = window.requestAnimationFrame(updateCount)
    }

    if (hasStartedRef.current) {
      animate()
      return () => window.cancelAnimationFrame(animationFrame)
    }

    if (!('IntersectionObserver' in window)) {
      animate()
      return () => window.cancelAnimationFrame(animationFrame)
    }

    observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animate()
        observer?.disconnect()
      }
    }, { threshold: 0.25 })
    observer.observe(element)
    return () => {
      observer?.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [value])

  return <span ref={countRef} aria-hidden="true">{count.toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-US')}</span>
}

function HomePage({
  session,
  isInitialLoad,
  onInitialLoadComplete
}: {
  session: Session | null
  isInitialLoad: boolean
  onInitialLoadComplete: () => void
}) {
  const t = useTranslate()
  const { language } = useLanguage()
  const location = useLocation()
  const { settings, loading: settingsLoading } = useSiteSettings()
  const { data: courses = [], error: courseError, loading: coursesLoading } = useApiData<CourseCatalogItem>('/courses')
  const { data: siteStatistics = [], error: siteStatisticsError, loading: siteStatisticsLoading } = useApiData<SiteStatistic>('/site-stats')
  const { data: latestNews, error: newsError, loading: newsLoading } = useApiData<NewsItem>('/news')
  const { data: homeDownloads, error: downloadsError, loading: downloadsLoading } = useApiData<PublicationItem>('/publications')
  const [previewPublication, setPreviewPublication] = useState<{ title: string; fileUrl: string } | null>(null)
  const [activeNewsSlideIndex, setActiveNewsSlideIndex] = useState(0)
  const [isCarouselHovered, setIsCarouselHovered] = useState(false)
  const [isCarouselFocused, setIsCarouselFocused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const initialLoadStartedAt = useRef(Date.now())
  const newsSlides = latestNews
  const activeNewsSlide = newsSlides.length ? activeNewsSlideIndex % newsSlides.length : 0
  const isHomeLoading = settingsLoading || coursesLoading || siteStatisticsLoading || newsLoading || downloadsLoading

  useEffect(() => {
    if (!isInitialLoad || isHomeLoading) return
    const delay = Math.max(0, 500 - (Date.now() - initialLoadStartedAt.current))
    const timeout = window.setTimeout(onInitialLoadComplete, delay)
    return () => window.clearTimeout(timeout)
  }, [isHomeLoading, isInitialLoad, onInitialLoadComplete])

  useEffect(() => {
    if (location.pathname !== '/' || location.hash !== '#upcoming-short-courses') return
    document.getElementById('upcoming-short-courses')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    })
  }, [location.hash, location.pathname])

  useEffect(() => {
    if (
      newsSlides.length < 2 ||
      isCarouselHovered ||
      isCarouselFocused ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return
    const timer = window.setInterval(() => {
      setActiveNewsSlideIndex((current) => (current + 1) % newsSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [isCarouselFocused, isCarouselHovered, newsSlides.length])

  const showPreviousNewsSlide = () => {
    setActiveNewsSlideIndex((current) => (current - 1 + newsSlides.length) % newsSlides.length)
  }
  const showNextNewsSlide = () => {
    setActiveNewsSlideIndex((current) => (current + 1) % newsSlides.length)
  }

  const currentFeaturedStory = newsSlides[activeNewsSlide] ?? latestNews[0]
  const otherNews = latestNews.slice(0, 3)

  const today = getLocalDateKey()
  const upcomingCourses = courses
    .filter((course) => course.courseType === 'Short Course' && course.startDate && isFutureCourseStart(course.startDate, today))
    .sort((left, right) => new Date(left.startDate ?? '').getTime() - new Date(right.startDate ?? '').getTime())
  const quickActionLinks = [
    ...(upcomingCourses.length > 0 ? [{
      label: 'Upcoming short courses',
      to: '/#upcoming-short-courses',
      note: 'View short courses starting soon',
      icon: Bell,
      count: upcomingCourses.length
    }] : []),
    { label: 'Courses', to: '/long-courses', note: 'Explore courses and upcoming short courses', icon: undefined, count: undefined },
    { label: 'Publications', to: '/publications', note: 'Read reports and downloads', icon: undefined, count: undefined }
  ]
  const firstUpcomingCourse = upcomingCourses[0]
  const tickerStartDate = firstUpcomingCourse?.startDate
    ? formatCourseStartDate(firstUpcomingCourse.startDate, language)
    : ''
  const tickerText = (settings[SHORT_COURSE_TICKER_SETTING_KEY] || DEFAULT_SHORT_COURSE_TICKER)
    .replace(/\{startDate\}|\[START DATE\]/gi, tickerStartDate)
  const homepageStats = [
    { key: 'shortCourses', label: 'Short Courses', icon: BookOpen, value: siteStatistics.find((statistic) => statistic.key === 'shortCourses')?.value ?? 0 },
    { key: 'longCourses', label: 'Long Courses', icon: BookOpen, value: siteStatistics.find((statistic) => statistic.key === 'longCourses')?.value ?? 0 },
    { key: 'students', label: 'Students', icon: GraduationCap, value: siteStatistics.find((statistic) => statistic.key === 'students')?.value ?? 0 },
    { key: 'staff', label: 'Staff', icon: Users, value: siteStatistics.find((statistic) => statistic.key === 'staff')?.value ?? 0 }
  ]

  return (
    <div className="institutional-home home-page-reveal">
      {session && (
        <div className="session-chip" aria-live="polite">
          <span>{t('Signed in as')}</span>
          <strong>{session.user.name}</strong>
        </div>
      )}
      <section className="featured-showcase" aria-label={t('Featured content')}>
        <div
          className="featured-banner"
          role="region"
          aria-roledescription={t('slideshow')}
          aria-label={t('Featured content')}
          aria-busy={newsLoading}
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          onFocusCapture={() => setIsCarouselFocused(true)}
          onBlurCapture={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
              setIsCarouselFocused(false)
            }
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current
            touchStartX.current = null
            if (startX === null || newsSlides.length < 2) return
            const distance = event.changedTouches[0].clientX - startX
            if (Math.abs(distance) > 50) {
              if (distance > 0) showPreviousNewsSlide()
              else showNextNewsSlide()
            }
          }}
        >
          {currentFeaturedStory?.imageUrl && (
            <img
              key={`${currentFeaturedStory.id}-image`}
              className="featured-slide-image"
              src={getMediaUrl(currentFeaturedStory.imageUrl)}
              alt={currentFeaturedStory.title}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          )}
          <div className="featured-banner-overlay" />
          {currentFeaturedStory ? (
            <div key={`${currentFeaturedStory.id}-copy`} className="featured-copy" aria-live="polite">
              <h2>{currentFeaturedStory.title}</h2>
              <p>{currentFeaturedStory.summary}</p>
              <Link to={`/news/${encodeURIComponent(currentFeaturedStory.slug)}`} className="inline-link featured-read-more">
                <ArrowRight size={16} aria-hidden="true" />
                <span>{t('Read more')}</span>
              </Link>
            </div>
          ) : !newsLoading ? (
            <p className="featured-empty-state">{t('No news articles are currently available.')}</p>
          ) : null}
          {newsSlides.length > 1 && (
            <div className="featured-carousel-controls" aria-label={t('Slide navigation')}>
              <div className="featured-carousel-dots" role="group" aria-label={t('Slide navigation')}>
                {newsSlides.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    className={index === activeNewsSlide ? 'featured-carousel-dot active' : 'featured-carousel-dot'}
                    aria-label={`${t('Show featured story')} ${index + 1}`}
                    aria-pressed={index === activeNewsSlide}
                    onClick={() => setActiveNewsSlideIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="featured-sidepanel">
          <div className="panel-header compact-header">
            <span className="eyebrow">{t('Current update')}</span>
            <h3>{t('Quick highlights')}</h3>
          </div>
          <ul className="minimal-list">
            {quickActionLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={link.icon ? 'quick-action-announcement' : undefined}
                  aria-label={link.count === undefined ? t(link.label) : `${t(link.label)}: ${link.count}`}
                  onClick={() => {
                    if (location.pathname === '/' && location.hash === '#upcoming-short-courses') {
                      document.getElementById('upcoming-short-courses')?.scrollIntoView({
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                        block: 'start'
                      })
                    }
                  }}
                >
                  <strong>
                    {link.icon && (() => {
                      const Icon = link.icon
                      return <Icon className="quick-action-bell" size={16} aria-hidden="true" />
                    })()}
                    <span>{t(link.label)}</span>
                    {link.count !== undefined && <span className="quick-action-count" aria-hidden="true">{link.count}</span>}
                  </strong>
                  <span>{t(link.note)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="welcome-banner" aria-label={t('Welcome to our institute')}>
        <div className="welcome-visual">
          <img
            className="welcome-principal-embed"
            src="/principal-removebg-preview.png"
            alt={t('Principal, VETA Kipawa ICT Centre')}
            loading="lazy"
            decoding="async"
          />
          <div className="welcome-principal-caption">
            <strong>{t('Misai John Msengi')}</strong>
            <span>{t('Principal, VETA Kipawa ICT Centre')}</span>
          </div>
        </div>
        <div className="welcome-content">
          <h2 className="welcome-heading">{t('WELCOME NOTE TO OUR ESTEEMED STAKEHOLDERS')}</h2>
          <div className="welcome-message">
            <p className="welcome-message-intro">
              {t('On behalf of VETA Kipawa ICT Centre, I warmly welcome our esteemed stakeholders, partners, employers, parents, students, and visitors.')}
            </p>
            <p>
              {t('Our Centre is committed to delivering quality, practical, and competency-based ICT training that equips trainees with relevant skills for employment, self-employment, and innovation.')}
            </p>
            <p>
              {t('We sincerely appreciate your continued support and collaboration in advancing vocational education and skills development. Together, we can bridge skills gaps, promote innovation, and contribute to national development.')}
            </p>
            <p className="welcome-message-closing">
              {t('Welcome to VETA Kipawa ICT Centre. We value your partnership and look forward to working together towards a skilled and productive workforce.')}
            </p>
          </div>
          <div className="welcome-actions">
            <Link to="/long-courses" className="primary-button">
              {t('Explore courses')}
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="secondary-button">
              {t('About us')}
            </Link>
          </div>
        </div>
      </section>

      <section className="homepage-stats" aria-labelledby="homepage-stats-title">
        <div className="homepage-stats-heading">
          <div>
            <h2 id="homepage-stats-title">{t('VETA Kipawa in numbers')}<br /><span>2025-2026</span></h2>
          </div>
        </div>
        <div className="homepage-stats-grid">
          {homepageStats.map((statistic) => {
            const Icon = statistic.icon
            return (
              <article className="homepage-stat-card" key={statistic.key}>
                <span className="homepage-stat-icon"><Icon size={19} aria-hidden="true" /></span>
                <strong>
                  <AnimatedCount value={statistic.value} language={language} />
                  <span className="visually-hidden">{statistic.value.toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-US')}</span>
                </strong>
                <span className="homepage-stat-label">{t(statistic.label)}</span>
              </article>
            )
          })}
        </div>
        {siteStatisticsError && <p className="error-message" role="alert">{t(siteStatisticsError)}</p>}
      </section>

      {upcomingCourses.length > 0 && <section id="upcoming-short-courses" className="upcoming-courses-panel short-course-announcements" aria-labelledby="short-course-announcements-title">
        <header className="short-course-announcements-heading">
          <span className="eyebrow">{t('Course announcements')}</span>
          <h2 id="short-course-announcements-title">{t('New Short Courses')}</h2>
          <p>{t('Discover practical skills and upcoming training opportunities at VETA Kipawa.')}</p>
        </header>
        {courseError && <p className="error-message short-course-announcement-error" role="alert">{t(courseError)}</p>}
        {coursesLoading && !courses.length && <p className="course-empty-state short-course-announcement-loading" role="status">{t('Loading upcoming short courses…')}</p>}
        {upcomingCourses.length ? (
          <>
            <div className="short-course-announcement-ticker" role="group" aria-label={t('Course announcements')}>
              <span className="short-course-ticker-badge">{t('New')}</span>
              <div className="short-course-ticker-window" aria-label={tickerText}>
                <div className="short-course-ticker-track" aria-hidden="true">
                  <span>{tickerText}</span>
                  <span>{tickerText}</span>
                </div>
              </div>
              {firstUpcomingCourse && session?.user.role !== 'admin' && <Link
                className="short-course-ticker-apply"
                to={`/courses/${encodeURIComponent(firstUpcomingCourse.slug)}#course-interest-form`}
              >{t('Apply now')} <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
            <div className={`upcoming-course-grid course-count-${upcomingCourses.length}`}>
            {upcomingCourses.map((course) => (
              <article className="upcoming-course-card short-course-card" key={course.id ?? course.slug}>
                <div className="short-course-card-image">
                  <img
                    src={course.imageUrl ? getMediaUrl(course.imageUrl) : coursePhotoUrl(course.name, 0)}
                    alt={course.name}
                    loading="lazy"
                    decoding="async"
                  />
                  {isAnnouncedShortCourse(course, getLocalDateKey()) && <span className="short-course-card-new">{t('New')}</span>}
                </div>
                <div className="short-course-card-content">
                  <h3>{course.name}</h3>
                  <p>{course.summary || t('Discover practical skills and upcoming training opportunities at VETA Kipawa.')}</p>
                  <span className="upcoming-course-date"><Calendar size={15} aria-hidden="true" />{t('Starts')} {formatCourseStartDate(course.startDate!, language)}</span>
                  <div className="short-course-card-actions">
                    <Link to={`/courses/${encodeURIComponent(course.slug)}`} className="short-course-card-action">
                      <Eye size={15} aria-hidden="true" />
                      <span>{t('View course')}</span>
                    </Link>
                    {session?.user.role !== 'admin' && <Link to={`/courses/${encodeURIComponent(course.slug)}#course-interest-form`} className="short-course-card-action primary">
                        <Calendar size={15} aria-hidden="true" />
                        <span>{t('Apply for this short course')}</span>
                      </Link>}
                  </div>
                </div>
              </article>
            ))}
            </div>
          </>
        ) : !courseError && !coursesLoading && (
          <>
            <p className="course-empty-state">{t('No upcoming short courses are listed right now. Explore all courses for current options.')}</p>
            <div className="short-course-announcements-footer">
              <Link to="/short-courses?filter=upcoming" className="secondary-button">{t('Explore all courses')} <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </>
        )}
        {upcomingCourses.length > 0 && (
          <div className="short-course-announcements-footer">
            <Link to="/short-courses?filter=upcoming" className="secondary-button">{t('Explore all courses')} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        )}
      </section>}

      <section className="home-panel-grid" aria-label={t('Institution updates')}>
        <div className="info-panel">
          <div className="panel-header">
            <span className="eyebrow">{t('Latest news')}</span>
            <Link to="/news" className="inline-link small-inline-link">
              {t('More')} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="news-stack">
            {otherNews.map((item, index) => (
              <article key={`${item.id}-${index}`} className="news-list-card has-image">
                <img
                  src={item.imageUrl ? getMediaUrl(item.imageUrl) : '/aboutuspichacava-01.webp'}
                  alt={item.imageUrl ? item.title : ''}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h4>
                    <Link to={`/news/${encodeURIComponent(item.slug)}`}>{item.title}</Link>
                  </h4>
                  <time dateTime={item.date}>{formatLocaleDate(item.date, language)}</time>
                  <p>{item.summary}</p>
                </div>
              </article>
            ))}
            {newsError && <p className="error-message" role="alert">{t(newsError)}</p>}
            {!latestNews.length && !newsError && !newsLoading && <p className="empty-state">{t('No latest news available right now.')}</p>}
            {newsLoading && !latestNews.length && <p className="empty-state" role="status">{t('Loading news…')}</p>}
          </div>
        </div>

        <div className="info-panel home-downloads-panel">
          <div className="panel-header">
            <span className="eyebrow">{t('Downloads')}</span>
            <Link to="/publications" className="inline-link small-inline-link">
              {t('View all')} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {downloadsError && <p className="error-message" role="alert">{t(downloadsError)}</p>}
          {homeDownloads.length ? (
            <ul className="home-download-list">
              {homeDownloads.slice(0, 5).map((publication) => (
                <li key={publication.id}>
                  <FileText size={17} aria-hidden="true" />
                  <div className="home-download-copy">
                    <button
                      type="button"
                      className="home-download-title"
                      onClick={() => setPreviewPublication({
                        title: localizeContentRecord(publication, language).title,
                        fileUrl: getMediaUrl(publication.fileUrl)
                      })}
                    >
                      {localizeContentRecord(publication, language).title}
                    </button>
                    <time dateTime={publication.createdAt}>
                      <Calendar size={13} aria-hidden="true" />
                      {t('Uploaded')}: {formatExactDateTime(publication.createdAt, language)} EAT
                    </time>
                    {publication.course && (
                      <Link to={`/courses/${encodeURIComponent(publication.course.slug)}`}>
                        {t('Related course')}: {localizeContentRecord(publication.course, language).name}
                      </Link>
                    )}
                  </div>
                  <Download size={16} aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : downloadsLoading ? (
            <p className="empty-state" role="status">{t('Loading downloads…')}</p>
          ) : !downloadsError ? (
            <p className="empty-state">{t('There are no downloadable documents at the moment.')}</p>
          ) : null}
        </div>
      </section>
      <PublicationPreviewDialog publication={previewPublication} onClose={() => setPreviewPublication(null)} />
    </div>
  )
}

function OrganizationChart({ members }: { members: OrganizationMember[] }) {
  const t = useTranslate()
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null)
  const profileDialogRef = useRef<HTMLDialogElement>(null)
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const childrenByManager = useMemo(() => {
    const children = new Map<string, OrganizationMember[]>()
    for (const member of members) {
      if (!member.managerId || !membersById.has(member.managerId)) continue
      const siblings = children.get(member.managerId) ?? []
      siblings.push(member)
      children.set(member.managerId, siblings)
    }
    for (const siblings of children.values()) {
      siblings.sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name))
    }
    return children
  }, [members, membersById])
  const roots = useMemo(() => members
    .filter((member) => !member.managerId || !membersById.has(member.managerId))
    .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name)),
  [members, membersById])

  useEffect(() => {
    const dialog = profileDialogRef.current
    if (!dialog) return
    if (selectedMember && !dialog.open) dialog.showModal()
    else if (!selectedMember && dialog.open) dialog.close()
  }, [selectedMember])

  const renderMember = (member: OrganizationMember, ancestors: Set<string>) => {
    if (ancestors.has(member.id)) return null
    const nextAncestors = new Set(ancestors).add(member.id)
    const reports = childrenByManager.get(member.id) ?? []
    return (
      <li className="organization-chart-node" key={member.id}>
        <article className="organization-person-card">
          <button
            type="button"
            className="organization-person-photo-button"
            aria-label={`${t('View full profile:')} ${member.name}`}
            onClick={() => setSelectedMember(member)}
          >
            {member.imageUrl
              ? <img className="organization-person-photo" src={getMediaUrl(member.imageUrl)} alt="" loading="lazy" decoding="async" />
              : <span className="organization-person-photo-fallback" aria-hidden="true"><Users size={26} /></span>}
            <span className="organization-person-photo-hint">{t('View profile')}</span>
          </button>
          <h3>{member.name}</h3>
          <p>{member.position}</p>
        </article>
        {reports.length > 0 && (
          <ol className="organization-chart-children" aria-label={`${t('Reports to')} ${member.name}`}>
            {reports.map((report) => renderMember(report, nextAncestors))}
          </ol>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="organization-chart-scroll">
        <ol className="organization-chart-roots" aria-label={t('Organization structure')}>
          {roots.map((root) => renderMember(root, new Set()))}
        </ol>
      </div>
      <dialog
        ref={profileDialogRef}
        className="organization-profile-dialog"
        aria-labelledby="organization-profile-name"
        onCancel={() => setSelectedMember(null)}
        onClose={() => setSelectedMember(null)}
      >
        {selectedMember && (
          <div className="organization-profile-content">
            <button
              type="button"
              className="organization-profile-close"
              onClick={() => setSelectedMember(null)}
              aria-label={t('Close')}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className="organization-profile-heading">
              {selectedMember.imageUrl
                ? <img src={getMediaUrl(selectedMember.imageUrl)} alt="" />
                : <span className="organization-profile-photo-fallback" aria-hidden="true"><Users size={34} /></span>}
              <div>
                <span className="eyebrow">{t('Organization profile')}</span>
                <h2 id="organization-profile-name">{selectedMember.name}</h2>
                <p>{selectedMember.position}</p>
              </div>
            </div>
            {selectedMember.biography && (
              <section className="organization-profile-section">
                <h3>{t('Biography')}</h3>
                <p>{selectedMember.biography}</p>
              </section>
            )}
            {selectedMember.qualifications && (
              <section className="organization-profile-section">
                <h3>{t('Qualifications')}</h3>
                <p>{selectedMember.qualifications}</p>
              </section>
            )}
            {selectedMember.responsibilities && (
              <section className="organization-profile-section">
                <h3>{t('Responsibilities')}</h3>
                <p>{selectedMember.responsibilities}</p>
              </section>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}

function TeamPage() {
  const t = useTranslate()
  const { data: members, error, loading } = useApiData<OrganizationMember>('/organization')

  return (
    <section className="content-page team-page">
      <header className="team-page-intro">
        <div className="team-page-intro-copy">
          <span className="eyebrow">{t('VETA Kipawa ICT Centre')}</span>
          <h1>{t('Our team')}</h1>
          <p>{t('Meet the people who lead and support learning at VETA Kipawa. Start with leadership, then follow the reporting flow to discover the teams behind our work.')}</p>
        </div>
        <div className="team-page-intro-mark" aria-hidden="true">
          <Users size={52} strokeWidth={1.5} />
        </div>
      </header>
      {loading && members.length === 0 ? (
        <p className="about-organization-status" role="status">{t('Loading team members…')}</p>
      ) : error ? (
        <p className="error-message" role="alert">{t(error)}</p>
      ) : members.length ? (
        <TeamHierarchy members={members} />
      ) : (
        <div className="about-organization-empty team-empty">
          <Users size={28} aria-hidden="true" />
          <p>{t('Team profiles will appear here once published.')}</p>
        </div>
      )}
    </section>
  )
}

function TeamHierarchy({ members }: { members: OrganizationMember[] }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(() => new Set())
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const childrenByManager = useMemo(() => {
    const children = new Map<string, OrganizationMember[]>()
    for (const member of members) {
      if (!member.managerId || !membersById.has(member.managerId)) continue
      const siblings = children.get(member.managerId) ?? []
      siblings.push(member)
      children.set(member.managerId, siblings)
    }
    for (const reports of children.values()) {
      reports.sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name))
    }
    return children
  }, [members, membersById])
  const roots = members
    .filter((member) => !member.managerId || !membersById.has(member.managerId))
    .sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name))

  const toggleMember = (id: string) => {
    setExpandedMemberIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderMember = (member: OrganizationMember, ancestors: Set<string>, isRoot = false): ReactNode => {
    if (ancestors.has(member.id)) return null
    const nextAncestors = new Set(ancestors).add(member.id)
    const reports = childrenByManager.get(member.id) ?? []
    const expanded = expandedMemberIds.has(member.id)
    const position = language === 'sw' && member.positionSw ? member.positionSw : member.position
    const biography = language === 'sw' && member.biographySw ? member.biographySw : member.biography
    const qualifications = language === 'sw' && member.qualificationsSw ? member.qualificationsSw : member.qualifications
    const responsibilities = language === 'sw' && member.responsibilitiesSw ? member.responsibilitiesSw : member.responsibilities
    const panelId = `team-member-panel-${member.id}`
    const isPrincipal = isRoot && [member.position, member.positionEn, member.positionSw]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes('principal'))

    return (
      <li className={`organization-chart-node team-member-node${isRoot ? ' is-root' : ''}${isPrincipal ? ' is-principal' : ''}${reports.length ? ' has-reports' : ''}`} key={member.id}>
        <article className={`team-member-card${expanded ? ' is-expanded' : ''}`}>
          <button
            type="button"
            className="team-member-toggle"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => toggleMember(member.id)}
          >
            {member.imageUrl
              ? <img className="team-member-photo" src={getMediaUrl(member.imageUrl)} alt="" loading="lazy" decoding="async" />
              : <span className="team-member-photo-fallback" aria-hidden="true"><Users size={27} /></span>}
            <span className="team-member-identity">
              <span className="team-member-position">{t('Team role')}</span>
              <strong>{position || t('Team member')}</strong>
              <span className="team-member-direct-count">
                {reports.length
                  ? `${reports.length} ${t(reports.length === 1 ? 'team member' : 'team members')}`
                  : t('View profile details')}
              </span>
            </span>
            <ChevronDown className="team-member-chevron" size={19} aria-hidden="true" />
          </button>
        </article>
        {expanded && (
          <div className="team-member-children" id={panelId}>
            {reports.length > 0 && (
              <ol
                className="organization-chart-children team-member-level"
                aria-label={`${t('Team members reporting to')} ${position}`}
                style={isPrincipal ? { '--team-report-count': reports.length } as CSSProperties : undefined}
              >
                {reports.map((report) => renderMember(report, nextAncestors))}
              </ol>
            )}
            {(biography || qualifications || responsibilities) && (
              <div className="team-member-expanded">
                {biography && <p>{biography}</p>}
                {qualifications && (
                  <div className="team-member-detail">
                    <h3>{t('Qualifications')}</h3>
                    <p>{qualifications}</p>
                  </div>
                )}
                {responsibilities && (
                  <div className="team-member-detail">
                    <h3>{t('Responsibilities')}</h3>
                    <p>{responsibilities}</p>
                  </div>
                )}
              </div>
            )}
            {!reports.length && !biography && !qualifications && !responsibilities ? (
              <div className="team-member-expanded">
                <p className="team-member-no-details">{t('No additional profile details are available.')}</p>
              </div>
            ) : null}
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="team-hierarchy">
      <div className="team-hierarchy-overview">
        <div>
          <span className="eyebrow">{t('Organization at a glance')}</span>
          <h2>{t('People, leadership and clear responsibility')}</h2>
          <p>{t('Select a person to open their profile. Follow the connected lines to understand who each team supports.')}</p>
        </div>
        <div className="team-hierarchy-stats" aria-label={t('Team overview')}>
          <div><strong>{members.length}</strong><span>{t('team members')}</span></div>
          <div><strong>{roots.length}</strong><span>{t('leadership groups')}</span></div>
        </div>
      </div>
      <div className="organization-chart-scroll team-tree-scroll">
        <div className="team-structure-heading">
          <span>{t('Leadership and reporting lines')}</span>
          <small>{t('Click any card to view details and direct reports')}</small>
        </div>
        <ol className="organization-chart-roots team-member-level team-member-roots" aria-label={t('Team leadership')}>
          {roots.map((member) => renderMember(member, new Set(), true))}
        </ol>
      </div>
    </div>
  )
}

function AboutPage() {
  const t = useTranslate()
  const { language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: organizationMembers, error: organizationError, loading: organizationLoading } = useApiData<OrganizationMember>('/organization')
  const { data: partners, error: partnersError, loading: partnersLoading } = useApiData<PartnerProfile>('/partners')
  const [activeLab, setActiveLab] = useState(0)
  const [activeIctLab, setActiveIctLab] = useState(0)
  const organizationViewActive = location.hash === '#organization'
  const partnersViewActive = location.hash === '#partners'
  const labsViewActive = location.pathname === '/labs' || location.hash === '#explore-labs'
  type LabExperience = {
    title: string
    category: string
    image: string
    description: string
    topics: string[]
  }
  type LabCategory = Pick<LabExperience, 'title' | 'category'> & (
    | { subLabs: LabExperience[] }
    | Omit<LabExperience, 'title' | 'category'>
  )
  const labs: LabCategory[] = [
    {
      title: 'ICT and Computer Labs',
      category: 'Digital skills',
      subLabs: [
        {
          title: 'Multimedia Lab',
          category: 'Digital media and creativity',
          image: coursePhotoUrl('multimedia video production', 0, 1200),
          description: 'Create and refine digital media through practical work with visual design, image editing, audio and video.',
          topics: ['Graphics and visual communication', 'Audio and video production fundamentals', 'Editing and preparing digital media projects']
        },
        {
          title: 'Web Design Lab',
          category: 'Web and digital experiences',
          image: coursePhotoUrl('web design website', 1, 1200),
          description: 'Plan and build accessible, responsive websites while learning how design and technology work together.',
          topics: ['Web page structure and styling', 'Responsive design and usability', 'Building and publishing a small website']
        },
        {
          title: 'Computer Maintenance Lab',
          category: 'Computer hardware and support',
          image: coursePhotoUrl('computer maintenance hardware repair', 2, 1200),
          description: 'Learn how to care for computer equipment, identify common faults and carry out basic maintenance safely.',
          topics: ['Computer components and safe handling', 'Basic diagnosis and troubleshooting', 'Preventive maintenance and user support']
        }
      ]
    },
    {
      title: 'Electronics Labs',
      category: 'Electronics',
      image: coursePhotoUrl('electronics circuit', 1, 1200),
      description: 'Understand how electronic systems work by learning about components, circuits, and technical troubleshooting.',
      topics: ['Electronic components and circuits', 'Measurement and testing techniques', 'Fault-finding and repair principles']
    },
    {
      title: 'Electrical Labs',
      category: 'Electrical technology',
      image: coursePhotoUrl('electrical installation wiring', 0, 1200),
      description: 'Explore electrical systems through practical learning focused on safe installation, maintenance, and automation.',
      topics: ['Electrical safety and tools', 'Wiring and installation practice', 'Circuit testing and measurements', 'Fault-finding and maintenance']
    },
    {
      title: 'Mechatronics Labs',
      category: 'Integrated technology',
      image: coursePhotoUrl('mechatronics robotics', 1, 1200),
      description: 'Discover how mechanical, electrical, electronic, and control technologies work together in modern systems.',
      topics: ['Electromechanical systems', 'Sensors and control fundamentals', 'Automation and applied problem-solving']
    }
  ]
  const selectedLab = labs[activeLab]
  const selectedExperience = 'subLabs' in selectedLab
    ? selectedLab.subLabs[activeIctLab]
    : selectedLab

  useEffect(() => {
    if (location.hash !== '#mission' && location.hash !== '#vision') return
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [location.hash])

  useEffect(() => {
    if (location.pathname !== '/about' || location.hash !== '#explore-labs' || !labsViewActive) return
    document.getElementById('about-labs-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.pathname, location.hash, labsViewActive])

  useEffect(() => {
    if (location.hash !== '#organization') return
    document.getElementById('about-organization-panel')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    })
  }, [location.hash])

  return (
    <section className={`content-page about-centre-page${labsViewActive ? ' labs-page' : ''}`}>
      {!labsViewActive && (
        <>
      <header className="about-centre-intro">
        <h1>{t('About us')}</h1>
      </header>

      <div className="about-section-switch" role="group" aria-label={t('About section')}>
        <button
          id="about-us-tab"
          type="button"
          aria-pressed={!partnersViewActive && !organizationViewActive}
          className={`about-section-switch-button${!partnersViewActive && !organizationViewActive ? ' is-active' : ''}`}
          onClick={() => navigate('/about')}
        >
          {t('About us')}
        </button>
        <button
          id="about-partners-tab"
          type="button"
          aria-pressed={partnersViewActive}
          className={`about-section-switch-button${partnersViewActive ? ' is-active' : ''}`}
          onClick={() => navigate('/about#partners')}
        >
          <Building2 size={16} aria-hidden="true" />
          {t('Our partners')}
        </button>
      </div>
        </>
      )}

      {!labsViewActive && organizationViewActive ? (
        <section id="about-organization-panel" className="about-organization-panel" aria-labelledby="about-organization-title">
          <div className="about-organization-heading">
            <span className="eyebrow">{t('Meet our team')}</span>
            <h2 id="about-organization-title">{t('Organization structure')}</h2>
            <p>{t('Explore how the centre is organized from leadership through its teams. Select a profile photo to learn more about each person.')}</p>
          </div>
          {organizationLoading ? (
            <p className="about-organization-status" role="status">{t('Loading organization structure…')}</p>
          ) : organizationError ? (
            <p className="error-message" role="alert">{t(organizationError)}</p>
          ) : organizationMembers.length ? (
            <OrganizationChart members={organizationMembers} />
          ) : (
            <div className="about-organization-empty">
              <Network size={28} aria-hidden="true" />
              <p>{t('The organization structure is being prepared. Please check back soon.')}</p>
            </div>
          )}
        </section>
      ) : !labsViewActive && partnersViewActive ? (
        <section id="about-partners-panel" className="about-partners-panel" aria-labelledby="about-partners-title">
          <div className="about-partners-heading">
            <span className="eyebrow">{t('Working together')}</span>
            <h2 id="about-partners-title">{t('Building stronger pathways together')}</h2>
            <p>{t('We welcome employers, training providers and community organizations interested in connecting practical learning with the world of work.')}</p>
          </div>
          {partnersLoading ? (
            <p className="about-organization-status" role="status">{t('Loading partner profiles…')}</p>
          ) : partnersError ? (
            <p className="error-message" role="alert">{t(partnersError)}</p>
          ) : partners.length ? (
            <div className="about-partner-grid">
              {partners.map((partner) => {
                const name = language === 'sw' && partner.nameSw ? partner.nameSw : partner.name
                const description = language === 'sw' && partner.descriptionSw ? partner.descriptionSw : partner.description
                const logo = partner.logoUrl
                  ? <img src={getMediaUrl(partner.logoUrl)} alt={`${name} ${t('logo')}`} loading="lazy" decoding="async" />
                  : <Building2 size={34} aria-hidden="true" />
                return (
                  <article className="about-partner-card" key={partner.id}>
                    <div className="about-partner-logo">
                      {partner.websiteUrl
                        ? <a href={partner.websiteUrl} target="_blank" rel="noreferrer" aria-label={`${name} — ${t('Open partner website')}`}>{logo}</a>
                        : logo}
                    </div>
                    <h3>{name}</h3>
                    {description && <p>{description}</p>}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="about-organization-empty about-partners-empty">
              <Building2 size={28} aria-hidden="true" />
              <p>{t('Partner profiles will appear here once published.')}</p>
            </div>
          )}
          <div className="about-partners-cta">
            <p>{t('Interested in supporting practical skills and career pathways? Get in touch with the centre to explore collaboration.')}</p>
            <Link to="/contact" className="primary-button">{t('Become a partner')} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      ) : (
        <div id="about-us-panel">
      {labsViewActive ? (
        <section id="about-labs-explorer" className="about-labs-explorer" aria-labelledby="about-labs-title">
          <div className="about-labs-heading">
            <div>
              <span className="eyebrow">{t('Learn by doing')}</span>
              <h2 id="about-labs-title">{t('Labs and workshops')}</h2>
              <p>{t('Choose a learning area to explore the practical skills and study themes connected with VETA Kipawa programmes.')}</p>
            </div>
          </div>
          <div className="about-labs-category-list" role="group" aria-label={t('Choose a lab category')}>
            {labs.map((lab, index) => (
              <button
                key={lab.title}
                id={`lab-tab-${index}`}
                type="button"
                aria-pressed={activeLab === index}
                className={`about-lab-category${activeLab === index ? ' is-active' : ''}`}
                onClick={() => setActiveLab(index)}
              >
                <span className="about-lab-category-icon" aria-hidden="true">
                  {index === 0 ? <Laptop size={19} /> : index === 1 ? <Cpu size={19} /> : index === 2 ? <Zap size={19} /> : <Wrench size={19} />}
                </span>
                <span>{t(lab.title)}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
          {'subLabs' in selectedLab && (
            <div className="about-ict-sub-labs" role="group" aria-label={t('Choose an ICT lab')}>
              {selectedLab.subLabs.map((lab, index) => (
                <button
                  key={lab.title}
                  type="button"
                  aria-pressed={activeIctLab === index}
                  className={`about-ict-sub-lab${activeIctLab === index ? ' is-active' : ''}`}
                  onClick={() => setActiveIctLab(index)}
                >
                  {t(lab.title)}
                </button>
              ))}
            </div>
          )}
          <article id="about-lab-panel" className="about-lab-feature" aria-labelledby="about-lab-title" aria-live="polite">
            <figure className="about-lab-image">
              <img src={selectedExperience.image} alt={t(`${selectedExperience.title} learning space`)} loading="lazy" decoding="async" />
              <figcaption>{t('Illustrative image')}</figcaption>
            </figure>
            <div className="about-lab-copy">
              <span className="about-lab-kicker">{t(selectedExperience.category)}</span>
              <h3 id="about-lab-title">{t(selectedExperience.title)}</h3>
              <p>{t(selectedExperience.description)}</p>
              <h4>{t('Skills and learning themes')}</h4>
              <ul>
                {selectedExperience.topics.map((topic) => <li key={topic}><Check size={16} aria-hidden="true" />{t(topic)}</li>)}
              </ul>
            </div>
          </article>
        </section>
      ) : (
      <div className="about-authority-content">
        <section className="about-authority-introduction" aria-labelledby="about-introduction-title">
          <figure className="about-authority-figure">
            <img
              src="/aboutuspichacava-01.webp"
              alt={t('VETA Kipawa ICT Centre building')}
              loading="lazy"
              decoding="async"
            />
            <figcaption>{t('VETA Kipawa ICT Centre')}</figcaption>
          </figure>
          <div className="about-authority-copy">
            <div className="about-authority-introduction-heading">
              <span className="about-authority-index">01</span>
              <div>
                <span className="eyebrow">{t('Who we are')}</span>
                <h2 id="about-introduction-title">{t('Introduction')}</h2>
              </div>
            </div>
            <p>
              {t('The Vocational Education and Training Authority')}{' '}
              <a href="https://www.youtube.com/watch?v=1ikXGzelu7s" target="_blank" rel="noreferrer">(VETA)</a>{' '}
              {t('is an autonomous Government Agency established under the Vocational Education and Training Act, Chapter 82 charged with the duties of providing, financing and coordinating vocational education and training in the country.')}
            </p>
            <div className="about-authority-purpose-grid is-compact">
              <section id="mission" className="about-authority-purpose-card is-mission is-compact" aria-labelledby="about-mission-title">
                <div className="about-authority-card-heading">
                  <span className="about-authority-card-icon"><Award size={17} aria-hidden="true" /></span>
                  <h2 id="about-mission-title">{t('Our purpose')}</h2>
                </div>
                <p>"{t('To ensure availability of Vocational Skills in Tanzania through provision and promotion of Vocational Education and Training (VET) to meet labour market demand for socio-economic development.')}"</p>
              </section>
              <section id="vision" className="about-authority-purpose-card is-vision is-compact" aria-labelledby="about-vision-title">
                <div className="about-authority-card-heading">
                  <span className="about-authority-card-icon"><Eye size={17} aria-hidden="true" /></span>
                  <h2 id="about-vision-title">{t('Our aspiration')}</h2>
                </div>
                <p>"{t('Tanzania with sufficient and competent artisans.')}"</p>
              </section>
            </div>
          </div>
        </section>

        <section className="about-core-values" aria-labelledby="about-core-values-title">
          <div className="about-core-values-heading">
            <div>
              <span className="eyebrow">{t('What guides us')}</span>
              <h2 id="about-core-values-title">{t('Core Values')}</h2>
            </div>
            <span className="about-core-values-count">{t('Four guiding values')}</span>
          </div>
          <div className="about-core-values-grid">
            {[
              {
                title: 'People first',
                description: "We are committed to meet people's expectations with courtesy and responsiveness;",
                icon: UserRoundCheck
              },
              {
                title: 'Dexterity and creativity',
                description: 'Dedicated to Enhance hands on skills in responding technological challenges and meet labour market needs;',
                icon: Zap
              },
              {
                title: 'Teamwork and integrity',
                description: 'Believing in working together with high levels of integrity to achieve the common goal; and',
                icon: Users
              },
              {
                title: 'Relevancy',
                description: 'Working towards ensuring provision of relevant Vocational Training and Services that respond to the demand of labour market and people needs',
                icon: Check
              }
            ].map(({ title, description, icon: ValueIcon }, index) => (
              <article className="about-core-value-card" key={title}>
                <div className="about-core-value-card-top">
                  <span className="about-core-value-icon"><ValueIcon size={20} aria-hidden="true" /></span>
                  <span className="about-core-value-number">0{index + 1}</span>
                </div>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      )}
        </div>
      )}
    </section>
  )
}

const coursePhotoIds = {
  ict: ['photo-1516321318423-f06f85e504b3', 'photo-1526379095098-d400fd0bf935', 'photo-1498050108023-c5249f4df085'],
  electrical: ['photo-1621905251918-48416bd8575a', 'photo-1497440001374-f26997328c1b', 'photo-1581092918056-0c4c3acd3789'],
  electronics: ['photo-1518770660439-4636190af475'],
  mechatronics: ['photo-1581092160562-40aa08e78837'],
  data: ['photo-1460925895917-afdab827c52f'],
  software: ['photo-1498050108023-c5249f4df085'],
  multimedia: ['photo-1492619375914-88005aa9e8fb', 'photo-1545235617-9465d2a55698', 'photo-1485846234645-a62644f84728'],
  automotive: ['photo-1486262715619-67b85e0b08d3', 'photo-1581092918056-0c4c3acd3789', 'photo-1557597774-9d273605dfa9'],
  networks: ['photo-1558494949-ef010cbdcc31', 'photo-1516321318423-f06f85e504b3', 'photo-1460925895917-afdab827c52f']
} as const

const courseLearningContentBySlug: Record<string, string[]> = {
  'information-and-communication-technology-ict': [
    'Install, configure and maintain computer systems and operating environments.',
    'Use productivity software and manage digital information responsibly.',
    'Set up, support and troubleshoot computer networks and user devices.'
  ],
  'electronics-el': [
    'Identify electronic components and explain their functions in common circuits.',
    'Assemble, measure and test electronic circuits using suitable instruments.',
    'Diagnose common circuit faults and follow safe workshop procedures.'
  ],
  'electrical-installation-and-automation-ela': [
    'Interpret basic electrical drawings and plan installation work.',
    'Install, inspect and test wiring and electrical equipment safely.',
    'Apply introductory automation and motor-control principles to practical tasks.'
  ],
  'computer-application': [
    'Use a computer, manage files and work confidently with the operating environment.',
    'Create and format documents, spreadsheets and presentations.',
    'Use email and the internet safely for study and workplace tasks.'
  ],
  'advanced-computer-application': [
    'Create professional documents using advanced formatting and templates.',
    'Use spreadsheet formulas, functions, charts and data tools.',
    'Build effective presentations and collaborate with digital productivity tools.'
  ],
  'graphics-designing': [
    'Apply colour, typography, layout and visual hierarchy in graphic designs.',
    'Create and edit digital artwork for print and online communication.',
    'Prepare correctly sized and exported design files for different uses.'
  ],
  'graphics-design-video-production': [
    'Develop visual concepts and create graphics for communication projects.',
    'Plan shots, capture footage and edit video with suitable audio.',
    'Export and present a finished design or video project.'
  ],
  'basic-website-design': [
    'Structure web pages with headings, text, links and images.',
    'Style pages with introductory HTML and CSS techniques.',
    'Build and preview a simple website that works on common screen sizes.'
  ],
  'advanced-website-design': [
    'Plan responsive page layouts and accessible user interactions.',
    'Add interactive website features and organize reusable page components.',
    'Test, refine and prepare a multi-page website for publication.'
  ],
  'pc-maintenance': [
    'Identify computer components and carry out routine hardware care.',
    'Install and configure operating systems, drivers and common applications.',
    'Diagnose common computer faults and perform preventive maintenance.'
  ],
  'pc-maintenance-networking': [
    'Assemble, maintain and troubleshoot computer hardware and peripherals.',
    'Connect devices to a local network and configure basic IP settings.',
    'Diagnose common connectivity and computer-support problems.'
  ],
  'statistical-packages-social-science-spss': [
    'Prepare, label and code data for social-science analysis.',
    'Run introductory descriptive statistics and create clear tables and charts.',
    'Interpret basic SPSS output and present findings in a short report.'
  ],
  autocad: [
    'Navigate the drawing workspace and use essential drafting tools.',
    'Create and edit accurate 2D drawings with dimensions and annotations.',
    'Organize drawings with layers and prepare sheets for printing or sharing.'
  ],
  'electrical-beginner': [
    'Recognize basic electrical tools, materials and safety precautions.',
    'Understand simple circuits and practise basic wiring techniques.',
    'Use introductory testing methods to check a simple electrical task.'
  ],
  'electrical-installation-for-beginners': [
    'Select installation tools and materials and follow safe working practices.',
    'Practise basic wiring, cable routing and fitting common accessories.',
    'Inspect and test a simple installation under appropriate supervision.'
  ],
  'advanced-electrical-automation': [
    'Read control diagrams and identify automation components.',
    'Practise motor-control circuits, sensors and introductory control logic.',
    'Test and troubleshoot electrical automation systems safely.'
  ],
  english: [
    'Practise listening and speaking in everyday and workplace situations.',
    'Build useful vocabulary, grammar and clear sentence structure.',
    'Read and write practical messages, forms and short workplace documents.'
  ],
  'basic-entrepreneurship': [
    'Identify a customer need and develop a simple business idea.',
    'Prepare a basic business plan with costs, pricing and sales goals.',
    'Keep simple business records and provide good customer service.'
  ],
  salesmanship: [
    'Understand customer needs and explain product features clearly.',
    'Practise sales conversations, handling questions and closing a sale.',
    'Record sales and follow up with customers professionally.'
  ],
  'merchandizing-apparels-marketing-basic': [
    'Organize apparel by product type, size and stock availability.',
    'Display and promote clothing products for clear, attractive presentation.',
    'Apply basic pricing, inventory and customer-service practices.'
  ]
}

function coursePhotoSet(courseName: string) {
  const name = courseName.toLowerCase()
  if (/film|multimedia|graphic|video|design|marketing/.test(name)) return coursePhotoIds.multimedia
  if (/mechatronic/.test(name)) return coursePhotoIds.mechatronics
  if (/electronics?/.test(name)) return coursePhotoIds.electronics
  if (/data science|analytics/.test(name)) return coursePhotoIds.data
  if (/software engineering|programming/.test(name)) return coursePhotoIds.software
  if (/auto|diagnos/.test(name)) return coursePhotoIds.automotive
  if (/network|server|cyber/.test(name)) return coursePhotoIds.networks
  if (/electri|cctv|automation/.test(name)) return coursePhotoIds.electrical
  return coursePhotoIds.ict
}

function coursePhotoUrl(courseName: string, index: number, width = 900) {
  const photos = coursePhotoSet(courseName)
  return `https://images.unsplash.com/${photos[index % photos.length]}?auto=format&fit=crop&w=${width}&q=85`
}

function CoursesPage({ courseType, session }: { courseType: 'Long Course' | 'Short Course'; session: Session | null }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const isShortCoursePage = courseType === 'Short Course'
  const { data: courses, error } = useApiData<CourseCatalogItem>(
    isShortCoursePage ? '/courses?includeAllShortCourses=true' : '/courses'
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter')
  const courseFilter = filterParam === 'upcoming' || filterParam === 'ongoing' || filterParam === 'short' || filterParam === 'all'
    ? filterParam
    : 'all'
  const requestedShortAreaId = searchParams.get('area')
  const selectedShortAreaId = shortCourseAreas.find((area) => area.id === requestedShortAreaId)?.id ?? 'ALL'
  const [courseSearch, setCourseSearch] = useState('')
  const [activeProgrammeGroup, setActiveProgrammeGroup] = useState<'level-one' | 'level-three' | 'diploma'>('level-one')
  const [activeProgrammeId, setActiveProgrammeId] = useState('ict-level-one')
  const today = getLocalDateKey()
  const shortCourses = courses.filter((course) => course.courseType === 'Short Course')
  const longCourses = courses.filter((course) => course.courseType !== 'Short Course')
  const isUpcoming = (course: CourseCatalogItem) => Boolean(course.startDate &&
    getTanzaniaDateKey(new Date(course.startDate)) > today)
  const isOngoing = (course: CourseCatalogItem) => Boolean(course.startDate &&
    getTanzaniaDateKey(new Date(course.startDate)) <= today &&
    (!course.endDate || getTanzaniaDateKey(new Date(course.endDate)) >= today))
  const selectedShortArea = shortCourseAreas.find((area) => area.id === selectedShortAreaId) ?? null
  const shortCoursesInSelectedArea = selectedShortArea
    ? shortCourses.filter((course) => getShortCourseArea(course) === selectedShortArea.id)
    : shortCourses
  const matchesShortCourseFilter = (course: CourseCatalogItem) =>
    courseFilter === 'upcoming' ? isUpcoming(course) :
      courseFilter === 'ongoing' ? isOngoing(course) :
        true
  const upcomingCount = shortCoursesInSelectedArea.filter(isUpcoming).length
  const ongoingCount = shortCoursesInSelectedArea.filter(isOngoing).length
  const programmeGroups = [
    {
      id: 'level-one',
      label: 'Level I & II long courses',
      level: 'Long course · Level I & II',
      icon: BookOpen,
      programmes: [
        {
          id: 'ict-level-one',
          name: 'ICT',
          icon: Laptop,
          summary: 'Build confidence with computers, productivity tools and networking. Start with practical skills you can use for study, work and everyday digital tasks.',
          imageCaption: 'Computers, networks and digital skills',
          topics: ['Computer fundamentals and operating systems', 'Office applications and digital productivity', 'Networking basics and internet services', 'Digital safety and practical ICT support']
        },
        {
          id: 'electronics-level-one',
          name: 'Electronics',
          icon: Cpu,
          summary: 'Discover what makes electronic devices work. Learn to assemble and test simple circuits, use measurement tools and trace faults through guided workshop practice.',
          imageCaption: 'Circuits, components and testing',
          topics: ['Electronic components and circuit fundamentals', 'Using measurement and testing instruments', 'Basic circuit assembly and soldering practice', 'Safe troubleshooting and equipment care']
        },
        {
          id: 'mechatronics-level-one',
          name: 'Mechatronics',
          icon: Wrench,
          summary: 'See how mechanical parts, motors, sensors and controls work together. Gain hands-on experience with the building blocks of automation and machine maintenance.',
          imageCaption: 'Machines, motors and smart controls',
          topics: ['Mechanical systems and workshop practice', 'Electrical components, motors and actuators', 'Sensors and introductory control systems', 'Basic automation, maintenance and fault-finding']
        },
        {
          id: 'electrical-level-one',
          name: 'Electrical',
          icon: Zap,
          summary: 'Start working confidently and safely with electrical systems. Practise wiring, circuit testing and basic maintenance with tools used in electrical installations.',
          imageCaption: 'Electrical installation and testing',
          topics: ['Electrical principles and workplace safety', 'Wiring, tools and installation methods', 'Testing circuits and interpreting results', 'Finding faults and carrying out basic maintenance']
        }
      ]
    },
    {
      id: 'level-three',
      label: 'Level III long course',
      level: 'Long course · Level III',
      icon: Award,
      programmes: [
        {
          id: 'ict-level-three',
          name: 'ICT',
          icon: Laptop,
          summary: 'Take your ICT foundation further with systems and network support, secure practices and practical projects. Build confidence solving more complex technical problems.',
          imageCaption: 'Systems, networks and secure support',
          topics: ['Advanced computer systems and user support', 'Network setup, administration and troubleshooting', 'Web, database and software development fundamentals', 'Cybersecurity practices and a supervised ICT project']
        },
        {
          id: 'electronics-level-three',
          name: 'Electronics',
          icon: Cpu,
          summary: 'Move beyond the basics into circuit analysis, electronic servicing and fault diagnosis. Strengthen your technical confidence through advanced workshop practice.',
          imageCaption: 'Advanced circuits and diagnostics',
          topics: ['Analogue and digital circuit analysis', 'Electronic systems installation and servicing', 'Advanced testing and fault diagnosis', 'Applied electronics workshop project']
        },
        {
          id: 'electrical-level-three',
          name: 'Electrical',
          icon: Zap,
          summary: 'Develop the skills to plan, inspect and maintain electrical installations. Practise testing, control systems and troubleshooting with safety at every step.',
          imageCaption: 'Installation, inspection and control',
          topics: ['Electrical installation planning and standards', 'Inspection, testing and commissioning', 'Electrical machines and control systems', 'Advanced maintenance and fault diagnosis']
        }
      ]
    },
    {
      id: 'diploma',
      label: 'Certificate and diploma courses',
      level: 'Certificate and diploma programmes',
      icon: GraduationCap,
      programmes: [
        {
          id: 'diploma-cyber-security',
          name: 'Diploma in Cyber Security',
          icon: ShieldCheck,
          summary: 'Prepare to help protect digital systems and information. Study security foundations, secure configuration and incident response through controlled practical exercises.',
          imageCaption: 'Cyber defence and secure systems',
          topics: ['Networking, operating systems and security foundations', 'Secure configuration and access management', 'Threat awareness, risk and vulnerability assessment', 'Incident response exercises and security projects']
        },
        {
          id: 'diploma-data-science',
          name: 'Diploma in Data Science',
          icon: Network,
          summary: 'Turn raw data into useful insight. Build foundations in programming and statistics, then practise cleaning, analysing and visualising data through projects.',
          imageCaption: 'Data analysis and visualisation',
          topics: ['Programming for data analysis', 'Statistics and responsible data handling', 'Data cleaning, exploration and visualisation', 'Introductory machine learning and a portfolio project']
        },
        {
          id: 'diploma-software-engineering',
          name: 'Diploma in Software Engineering',
          icon: Monitor,
          summary: 'Bring ideas to life as working software. Practise programming, requirements analysis, testing and teamwork while building foundations for complete applications.',
          imageCaption: 'Software design and development',
          topics: ['Programming, algorithms and problem-solving', 'Requirements, user experience and application design', 'Databases, APIs, version control and testing', 'Team-based software project and deployment fundamentals']
        }
      ]
    }
  ] as const
  const selectedProgrammeGroup = programmeGroups.find((group) => group.id === activeProgrammeGroup) ?? programmeGroups[0]
  const selectedProgramme = selectedProgrammeGroup.programmes.find((programme) => programme.id === activeProgrammeId) ??
    selectedProgrammeGroup.programmes[0]
  const selectedLongCourseCategory = activeProgrammeGroup === 'diploma'
    ? 'ICT'
    : selectedProgramme.name.toUpperCase()
  const longCoursesInSelectedProgramme = longCourses.filter((course) =>
    activeProgrammeId === 'all-long-courses' ||
    (course.category ?? 'ICT').trim().toUpperCase() === selectedLongCourseCategory
  )
  const visibleCourses = (isShortCoursePage ? shortCoursesInSelectedArea : longCoursesInSelectedProgramme).filter((course) => {
    const matchesFilter = !isShortCoursePage || matchesShortCourseFilter(course)
    const matchesSearch = `${course.name} ${course.level} ${course.category ?? ''} ${course.summary ?? ''}`.toLowerCase().includes(courseSearch.trim().toLowerCase())
    return matchesFilter && matchesSearch
  }).sort((left, right) => isShortCoursePage && courseFilter === 'upcoming'
    ? new Date(left.startDate ?? '').getTime() - new Date(right.startDate ?? '').getTime()
    : left.name.localeCompare(right.name))

  return (
    <section className="content-page courses-page">
      {!isShortCoursePage && <section className="programme-explorer" aria-labelledby="programme-explorer-title">
        <div className="programme-explorer-heading">
          <div>
            <span className="eyebrow">{t('Choose your study path')}</span>
            <h2 id="programme-explorer-title">{t('Long courses and diploma programmes')}</h2>
            <p>{t('Compare the programme areas and suggested topics, then follow the correct admissions route.')}</p>
          </div>
          <span className="programme-explorer-count">
            {programmeGroups.reduce((count, group) => count + group.programmes.length, 0)} {t('programme areas')}
          </span>
        </div>
        <div className="programme-group-tabs" role="group" aria-label={t('Choose a programme level')}>
          {programmeGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`programme-group-tab${activeProgrammeGroup === group.id ? ' is-active' : ''}`}
              aria-pressed={activeProgrammeGroup === group.id}
              onClick={() => {
                setActiveProgrammeGroup(group.id)
                setActiveProgrammeId(group.programmes[0].id)
              }}
            >
              <group.icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{t(group.label)}</span>
              <span className="programme-group-count">{group.programmes.length}</span>
            </button>
          ))}
        </div>
        <div className="programme-area-tabs" role="group" aria-label={t('Choose a course area')}>
          <button
            type="button"
            className={`programme-area-tab${activeProgrammeId === 'all-long-courses' ? ' is-active' : ''}`}
            aria-pressed={activeProgrammeId === 'all-long-courses'}
            onClick={() => setActiveProgrammeId('all-long-courses')}
          >
            <BookOpen size={17} aria-hidden="true" />
            {t('All long courses')}
            <span className="short-course-area-count">{longCourses.length}</span>
          </button>
          {selectedProgrammeGroup.programmes.map((programme) => (
            <button
              key={programme.id}
              type="button"
              className={`programme-area-tab${activeProgrammeId === programme.id ? ' is-active' : ''}`}
              aria-pressed={activeProgrammeId === programme.id}
              onClick={() => setActiveProgrammeId(programme.id)}
            >
              <programme.icon size={17} strokeWidth={1.9} aria-hidden="true" />
              {t(programme.name)}
            </button>
          ))}
        </div>
        <article className="programme-detail-panel programme-description-panel" aria-live="polite">
          <figure className="programme-detail-image">
            <img
              src={coursePhotoUrl(selectedProgramme.name, 0, 1000)}
              alt={`${t(selectedProgramme.name)} ${t('training illustration')}`}
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>{t('Learn by doing')}</span>
              <strong>{t(selectedProgramme.imageCaption)}</strong>
            </figcaption>
          </figure>
          <div className="programme-detail-body">
            <div className="programme-detail-heading">
              <span className="programme-detail-symbol" aria-hidden="true">
                <selectedProgramme.icon size={30} strokeWidth={1.7} />
              </span>
              <div>
                <span className="eyebrow">{t(selectedProgrammeGroup.level)}</span>
                <h3>{t(selectedProgramme.name)}</h3>
              </div>
            </div>
            <div className="programme-detail-copy">
              <p>{t(selectedProgramme.summary)}</p>
              <div className="programme-admissions">
                <p><Clock3 size={17} aria-hidden="true" /> {t('Duration')}: {t('Confirm the current programme duration through VET-MIS.')}</p>
                <a className="primary-button programme-action" href={VETMIS_REGISTRATION_URL} target="_blank" rel="noreferrer">
                  {t('Join through VET-MIS')} <ArrowRight size={17} aria-hidden="true" />
                </a>
                {longCoursesInSelectedProgramme[0] && <Link className="secondary-button programme-action" to={`/courses/${encodeURIComponent(longCoursesInSelectedProgramme[0].slug)}`}>
                  {t('View course details')} <ArrowRight size={17} aria-hidden="true" />
                </Link>}
              </div>
            </div>
          </div>
        </article>
      </section>}
      {isShortCoursePage && (
        <section className="programme-explorer short-course-explorer" aria-labelledby="short-course-explorer-title">
          <div className="programme-explorer-heading">
            <div>
              <span className="eyebrow">{t('Choose a training area')}</span>
              <h2 id="short-course-explorer-title">{t(selectedShortArea?.label ?? 'Short courses by area')}</h2>
              <p>{t(selectedShortArea?.description ?? 'Choose an area to browse its currently listed short courses and their learning content.')}</p>
            </div>
            <span className="programme-explorer-count">
              {selectedShortArea ? shortCoursesInSelectedArea.length : shortCourses.length} {t('courses')}
            </span>
          </div>
          <div className="programme-area-tabs short-course-area-tabs" role="group" aria-label={t('Choose a course area')}>
            <button
              type="button"
              className={`programme-area-tab${selectedShortAreaId === 'ALL' ? ' is-active' : ''}`}
              aria-pressed={selectedShortAreaId === 'ALL'}
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams)
                nextParams.delete('area')
                setSearchParams(nextParams)
              }}
            >
              <BookOpen size={17} aria-hidden="true" />{t('All short courses')}
              <span className="short-course-area-count">
                {shortCourses.filter(matchesShortCourseFilter).length}
              </span>
            </button>
            {shortCourseAreas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={`programme-area-tab${selectedShortArea?.id === area.id ? ' is-active' : ''}`}
                aria-pressed={selectedShortArea?.id === area.id}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.set('area', area.id)
                  setSearchParams(nextParams)
                }}
              >
                <area.icon size={17} aria-hidden="true" />{t(area.label)}
                <span className="short-course-area-count">
                  {shortCourses.filter((course) =>
                    getShortCourseArea(course) === area.id && matchesShortCourseFilter(course)
                  ).length}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {error && <p className="error-message" role="alert">{t(error)}</p>}
      {isShortCoursePage && (
        <>
          <div className="course-toolbar">
            <div className="course-filters" role="group" aria-label={t('Filter courses')}>
              {([
                ['all', 'All short courses', shortCoursesInSelectedArea.length],
                ['upcoming', 'Upcoming short courses', upcomingCount],
                ['ongoing', 'Ongoing short courses', ongoingCount]
              ] as const).map(([filter, label, count]) => (
                <button key={filter} type="button" className={`course-filter-button${courseFilter === filter ? ' is-active' : ''}`}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.set('filter', filter)
                    setSearchParams(nextParams)
                  }} aria-pressed={courseFilter === filter}>
                  {t(label)}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <label className="course-search">
              <Search size={18} aria-hidden="true" />
              <span className="visually-hidden">{t('Search courses')}</span>
              <input type="search" value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder={t('Search courses')} />
            </label>
          </div>
          <div className="course-results-heading">
            <h2>{t(courseFilter === 'all' || courseFilter === 'short'
              ? selectedShortArea?.label ?? 'All short courses'
              : courseFilter === 'upcoming' ? 'Upcoming short courses' : 'Ongoing short courses')}</h2>
            <span>{visibleCourses.length} {t('courses')}</span>
          </div>
          {visibleCourses.length > 0 ? (
            <div className="course-showcase-grid">
              {visibleCourses.map((course, index) => (
                <article key={`${course.id ?? course.slug}-${index}`} className="course-showcase-card">
                  <div className={`course-card-art course-card-art-${index % 4}`}>
                    <img className="course-card-image" src={course.imageUrl ? getMediaUrl(course.imageUrl) : coursePhotoUrl(course.name, 0)}
                      alt={`${course.name} ${t('illustrative training image')}`} loading="lazy" />
                    <div className="course-card-image-overlay" aria-hidden="true" />
                    <span className="course-card-icon"><BookOpen size={25} strokeWidth={1.8} /></span>
                    <span className="course-type-badge">{t('Short course')}</span>
                  </div>
                  <div className="course-showcase-content">
                    <span className="course-category">{t(course.category || 'ICT')} · {t(course.level)}</span>
                    <span className="course-schedule-status">
                      {isUpcoming(course) ? t('Starting soon') : isOngoing(course) ? t('Ongoing') : course.endDate && course.endDate.slice(0, 10) < today ? t('Completed') : t('Schedule to be announced')}
                    </span>
                    <h3>{course.name}</h3>
                    <p>{course.summary || t('Build practical skills through guided learning and hands-on activities.')}</p>
                    <p className="course-card-dates">
                      {course.startDate && <span>{t(isUpcoming(course) ? 'Starts' : 'Started')}: {formatLocaleDate(course.startDate, language)}</span>}
                      {course.endDate && <span>{t('Ends')}: {formatLocaleDate(course.endDate, language)}</span>}
                    </p>
                    <Link to={`/courses/${encodeURIComponent(course.slug)}`} className="course-enquire-link">
                      {t('Explore course')} <ArrowRight size={16} />
                    </Link>
                    {session?.user.role !== 'admin' && isAnnouncedShortCourse(course, today) && <Link to={`/courses/${encodeURIComponent(course.slug)}#course-interest-form`} className="course-interest-shortcut">{t('Apply for this short course')}</Link>}
                    <CompactShareActions url={`${window.location.origin}/courses/${encodeURIComponent(course.slug)}`} title={course.name} />
                  </div>
                  {isAnnouncedShortCourse(course, today) && (
                    <div className="new-short-course-banner" role="note" aria-label={t('New short course announced')}>
                      <span className="new-short-course-marquee">
                        <span>{t('New short course announced')}</span>
                        <span aria-hidden="true">{t('New short course announced')}</span>
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : !error ? (
            <p className="course-empty-state">{t(courseSearch ? 'No courses match your search. Try a different course name or filter.' : 'No courses are currently listed.')}</p>
          ) : null}
        </>
      )}
      {!isShortCoursePage && (
        <>
          <div className="course-toolbar">
            <div>
              <span className="eyebrow">{t('Courses offered')}</span>
              <h2>{t(activeProgrammeId === 'all-long-courses' ? 'All long courses' : `${selectedProgramme.name} courses`)}</h2>
            </div>
            <label className="course-search">
              <Search size={18} aria-hidden="true" />
              <span className="visually-hidden">{t('Search courses')}</span>
              <input type="search" value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder={t('Search courses')} />
            </label>
          </div>
          <div className="course-results-heading">
            <h2>{t(activeProgrammeId === 'all-long-courses' ? 'All long courses' : `${selectedProgramme.name} courses`)}</h2>
            <span>{visibleCourses.length} {t('courses')}</span>
          </div>
          {visibleCourses.length > 0 ? (
            <div className="course-showcase-grid">
              {visibleCourses.map((course, index) => (
                <article key={`${course.id ?? course.slug}-${index}`} className="course-showcase-card">
                  <div className={`course-card-art course-card-art-${index % 4}`}>
                    <img className="course-card-image" src={course.imageUrl ? getMediaUrl(course.imageUrl) : coursePhotoUrl(course.name, 0)}
                      alt={`${course.name} ${t('illustrative training image')}`} loading="lazy" />
                    <div className="course-card-image-overlay" aria-hidden="true" />
                    <span className="course-card-icon"><BookOpen size={25} strokeWidth={1.8} /></span>
                    <span className="course-type-badge">{t('Long course')}</span>
                  </div>
                  <div className="course-showcase-content">
                    <span className="course-category">{t(course.category || 'ICT')} · {t(course.level)}</span>
                    <h3>{course.name}</h3>
                    <p>{course.summary || t('Build practical skills through guided learning and hands-on activities.')}</p>
                    <Link to={`/courses/${encodeURIComponent(course.slug)}`} className="course-enquire-link">
                      {t('Explore course')} <ArrowRight size={16} />
                    </Link>
                    <CompactShareActions url={`${window.location.origin}/courses/${encodeURIComponent(course.slug)}`} title={course.name} />
                  </div>
                </article>
              ))}
            </div>
          ) : !error ? (
            <p className="course-empty-state">{t(courseSearch ? 'No courses match your search. Try a different course name or filter.' : 'No courses are currently listed.')}</p>
          ) : null}
        </>
      )}
    </section>
  )
}

function CompactShareActions({ url, title }: { url: string; title: string }) {
  const t = useTranslate()
  const [feedback, setFeedback] = useState('')

  const shareData = { title, text: title, url }
  const handleNativeShare = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(url)
      setFeedback(t('Link copied.'))
    } catch {
      setFeedback(t('Unable to share this item.'))
    }
  }

  return (
    <div className="compact-share-actions" role="group" aria-label={t('Share')}>
      <a className="compact-share-icon whatsapp" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label={t('Share on WhatsApp')} title={t('Share on WhatsApp')}>
        <MessageCircle size={15} aria-hidden="true" />
      </a>
      <a className="compact-share-icon facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label={t('Share on Facebook')} title={t('Share on Facebook')}>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H7.8v3h2.6v8h3.1Z" /></svg>
      </a>
      <a className="compact-share-icon x" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label={t('Share on X')} title={t('Share on X')}>
        <X size={15} aria-hidden="true" />
      </a>
      <button type="button" className="compact-share-icon native" onClick={() => void handleNativeShare()} aria-label={t('Share')} title={t('Share')}>
        <Share2 size={15} aria-hidden="true" />
      </button>
      {feedback && <span className="compact-share-feedback" role="status">{feedback}</span>}
    </div>
  )
}

function CourseDetailPage({ session }: { session: Session | null }) {
  const t = useTranslate()
  const { language, setLanguage } = useLanguage()
  const { slug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [courseData, setCourseData] = useState<CourseCatalogItem | null>(null)
  const [loadedSlug, setLoadedSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [isInterestDialogOpen, setIsInterestDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ slug: string; message: string } | null>(null)
  const [courseMediaPreview, setCourseMediaPreview] = useState<CourseMediaItem | null>(null)
  const [guestInterest, setGuestInterest] = useState({ fullName: '', email: '', phone: '', message: '' })
  const interestDialogRef = useRef<HTMLDialogElement>(null)
  const courseMediaDialogRef = useRef<HTMLDialogElement>(null)
  const course = useMemo(
    () => courseData ? localizeContentRecord(courseData, language) : null,
    [courseData, language]
  )
  const isShortCourse = course?.courseType === 'Short Course'
  const canRequestShortCourse = Boolean(course && isAnnouncedShortCourse(course, getLocalDateKey()))

  useEffect(() => {
    const controller = new AbortController()
    fetchJson<{ course: CourseCatalogItem }>(`/courses/${encodeURIComponent(slug)}`, controller.signal)
      .then(({ course: result }) => {
        setCourseData(result)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setCourseData(null)
          setError(requestError instanceof Error ? requestError.message : 'Unable to load this course.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadedSlug(slug)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    if (session?.user.role !== 'admin' && (isShortCourse ? canRequestShortCourse : Boolean(course)) && loadedSlug === slug && location.hash === '#course-interest-form') {
      setIsInterestDialogOpen(true)
    }
  }, [canRequestShortCourse, course, isShortCourse, loadedSlug, location.hash, session?.user.role, slug])

  useEffect(() => {
    const dialog = interestDialogRef.current
    if (!dialog) return
    if (isInterestDialogOpen && !dialog.open) dialog.showModal()
    else if (!isInterestDialogOpen && dialog.open) dialog.close()
  }, [isInterestDialogOpen])

  useEffect(() => {
    const dialog = courseMediaDialogRef.current
    if (!dialog) return
    if (courseMediaPreview && !dialog.open) dialog.showModal()
    else if (!courseMediaPreview && dialog.open) dialog.close()
  }, [courseMediaPreview])

  const closeInterestDialog = () => {
    setIsInterestDialogOpen(false)
    if (location.hash === '#course-interest-form') {
      navigate(`${location.pathname}${location.search}`, { replace: true })
    }
  }

  const handleInterestSubmit = async () => {
    if (!course || (isShortCourse && !canRequestShortCourse)) return
    if (session?.user.role === 'admin') return
    if (!session && (!guestInterest.fullName.trim() || !guestInterest.email.trim() || !guestInterest.phone.trim())) {
      setError(t('Enter your name, email address and phone number.'))
      return
    }
    setSubmitting(true)
    setError('')
    setNotice(null)
    try {
      await postJson('/course-interests', {
        courseSlug: course.slug,
        ...(session ? {} : guestInterest),
        campaign: getStoredCampaignAttribution()
      })
      setNotice({
        slug,
        message: t(session
          ? 'Your course request has been received. Follow its progress from your learner dashboard.'
          : 'Your interest has been sent to the centre. We will contact you with the next intake details.')
      })
      closeInterestDialog()
      if (session) navigate('/dashboard')
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to submit your booking request.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || loadedSlug !== slug) {
    return <section className="content-page"><p>{t('Loading course information…')}</p></section>
  }
  if (!course) {
    return <section className="content-page error-page"><span className="eyebrow">{t('Course information')}</span><h1>{t('Course not found')}</h1>
      <p>{t(error || 'This course could not be found.')}</p><Link to="/courses" className="primary-button">{t('Browse courses')}</Link></section>
  }

  const courseName = course.name.toLowerCase()
  const learningPoints = courseLearningContentBySlug[course.slug]
    ? courseLearningContentBySlug[course.slug].map((point) => t(point))
    : /film|multimedia|graphic|video|design|marketing/.test(courseName)
    ? [t('Plan and develop a clear creative brief.'), t('Practise creating and refining digital media content.'), t('Prepare a finished piece of work for a portfolio.')]
    : /electri|electronics|cctv|automation/.test(courseName)
      ? [t('Learn to identify tools, materials and components.'), t('Practise installation, testing and fault-finding tasks.'), t('Build safe, methodical working habits through practical exercises.')]
      : /auto|diagnos/.test(courseName)
        ? [t('Become familiar with diagnostic tools and vehicle systems.'), t('Practise structured inspection and fault-finding.'), t('Interpret findings and explain a repair recommendation.')]
        : /network|server|cyber/.test(courseName)
          ? [t('Understand network devices and how they connect.'), t('Practise configuration, troubleshooting and basic security.'), t('Document a working setup and resolve common faults.')]
          : [t('Build confidence using relevant digital tools and equipment.'), t('Practise solving common, realistic workplace tasks.'), t('Complete guided exercises that demonstrate your new skills.')]
  const activities = /film|multimedia|graphic|video|design|marketing/.test(courseName)
    ? [t('Create and review a small design or media project.'), t('Practise using creative software and production workflows.'), t('Share work for feedback and improve the final result.')]
    : /electri|electronics|cctv|automation|auto|diagnos/.test(courseName)
      ? [t('Work through supervised, practical workshop exercises.'), t('Use appropriate tools to inspect, assemble or test equipment.'), t('Follow safety procedures and explain the result of each task.')]
      : [t('Work through instructor-guided practical exercises.'), t('Apply concepts to realistic individual and group tasks.'), t('Review your work, troubleshoot issues and build a small project.')]
  const pathways = /film|multimedia|graphic|video|design|marketing/.test(courseName)
    ? [t('Creative production assistant'), t('Junior graphic or web design support'), t('Digital content and communications roles')]
    : /electri|electronics|cctv|automation/.test(courseName)
      ? [t('Electrical or electronics workshop assistant'), t('Installation and maintenance support'), t('Further technical training and certification')]
      : /auto|diagnos/.test(courseName)
        ? [t('Automotive service assistant'), t('Vehicle inspection and diagnostics support'), t('Further automotive technical training')]
        : /network|server|cyber/.test(courseName)
          ? [t('IT helpdesk or computer support'), t('Junior network support'), t('Further ICT training and certification')]
          : [t('Digital workplace and computer operations'), t('Entry-level ICT support'), t('Further vocational training in a chosen specialty')]
  const courseImage = course.imageUrl ? getMediaUrl(course.imageUrl) : coursePhotoUrl(course.name, 0, 1500)
  const courseCentre = 'VETA Kipawa ICT Centre'

  return (
    <section className="content-page course-detail-page">
      <header className={`course-detail-hero${course.courseType === 'Short Course' ? ' short-course-preview' : ' long-course-preview'}`}>
        <img src={courseImage} alt={`${course.name} ${t('illustrative course image')}`} />
        <div className="course-detail-hero-copy">
          <span className="eyebrow">{t(course.courseType === 'Long Course' ? 'Long course' : 'Short course')} · {t(course.category || 'ICT')} · {t(course.level)}</span>
          <h1>{course.name}</h1>
          <p>{course.summary || t('Develop practical skills for work, further learning and new opportunities.')}</p>
          <div className="course-detail-meta">
            <span><Clock3 size={17} />{t(course.duration)}</span>
            {course.fee != null && <span>{t('Fee')}: TSh {course.fee.toLocaleString()}</span>}
            {course.startDate && <span>{t('Starts')}: {formatLocaleDate(course.startDate, language)}</span>}
            {course.endDate && <span>{t('Ends')}: {formatLocaleDate(course.endDate, language)}</span>}
            {course.courseType === 'Short Course' && course.publishedUntil && <span>{t('Public listing ends')}: {formatLocaleDate(course.publishedUntil, language)}</span>}
          </div>
          {course.courseType === 'Long Course' ? (
            <div className="course-detail-hero-actions">
              <a className="primary-button" href={VETMIS_REGISTRATION_URL} target="_blank" rel="noreferrer">
                {t('Register through VET-MIS')} <ArrowRight size={17} aria-hidden="true" />
              </a>
              <button type="button" className="secondary-button" onClick={() => setIsInterestDialogOpen(true)}>
                {t('Ask about this course')} <MessageCircle size={17} aria-hidden="true" />
              </button>
            </div>
          ) : canRequestShortCourse ? (
            <button type="button" className="primary-button" onClick={() => setIsInterestDialogOpen(true)}>
              {t('Request to join this course')} <ArrowRight size={17} />
            </button>
          ) : (
            <p className="course-schedule-status" role="status">{t('Requests are closed outside the published dates for this course.')}</p>
          )}
          <CompactShareActions url={window.location.href} title={course.name} />
        </div>
      </header>

      {course.media?.length ? (
        <section className="course-media-gallery" aria-labelledby="course-media-gallery-title">
          <header className="course-media-gallery-heading">
            <span className="eyebrow">{t('Course gallery')}</span>
            <h2 id="course-media-gallery-title">{t('See this course in action')}</h2>
            <p>{t('Preview photos and videos related to this course.')}</p>
          </header>
          <div className="course-media-grid">
            {course.media.map((item, index) => (
              <button
                className="course-media-card"
                key={item.id}
                type="button"
                onClick={() => setCourseMediaPreview(item)}
                aria-label={t(item.type === 'video' ? 'Preview course video' : 'Preview course image')}
              >
                {item.type === 'video' ? (
                  <video src={getMediaUrl(item.url)} preload="metadata" muted playsInline aria-hidden="true" />
                ) : (
                  <img
                    src={getMediaUrl(item.url)}
                    alt={`${course.name} ${t('course photo')} ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span className="course-media-card-action" aria-hidden="true">
                  {item.type === 'video' ? <Play size={19} fill="currentColor" /> : <Eye size={19} />}
                </span>
                <span className="course-media-card-label">{t(item.type === 'video' ? 'Watch video' : 'View photo')}</span>
              </button>
            ))}
          </div>
          <dialog
            ref={courseMediaDialogRef}
            className="course-media-preview-dialog"
            aria-label={t('Course media preview')}
            onCancel={(event) => {
              event.preventDefault()
              setCourseMediaPreview(null)
            }}
            onClose={() => setCourseMediaPreview(null)}
            onClick={(event) => {
              if (event.target === event.currentTarget) setCourseMediaPreview(null)
            }}
          >
            <div className="course-media-preview-content">
              <button
                type="button"
                className="course-media-preview-close secondary-button action-icon-button"
                onClick={() => setCourseMediaPreview(null)}
                aria-label={t('Close')}
                title={t('Close')}
              >
                <X size={18} aria-hidden="true" />
              </button>
              {courseMediaPreview?.type === 'video' ? (
                <video src={getMediaUrl(courseMediaPreview.url)} controls playsInline />
              ) : courseMediaPreview ? (
                <img src={getMediaUrl(courseMediaPreview.url)} alt={`${course.name} ${t('course photo')}`} />
              ) : null}
            </div>
          </dialog>
        </section>
      ) : null}

      <div className="course-detail-columns">
        <div className="course-detail-main">
          <section className="course-detail-section">
            <span className="eyebrow">{t('What you can learn')}</span>
            <h2>{t('Learning content')}</h2>
            <p>{course.summary || t('This programme is designed to help learners build practical knowledge through instruction, demonstration and supervised activities.')}</p>
            <ul className="course-detail-list">{learningPoints.map((point) => <li key={point}><Check size={17} />{point}</li>)}</ul>
          </section>
          <section className="course-detail-section">
            <span className="eyebrow">{t('Learning by doing')}</span>
            <h2>{t('How training can be conducted')}</h2>
            <p>{t('Expect a blend of tutor guidance, demonstrations, individual practice and hands-on assignments. The exact timetable and facilities depend on the course and intake.')}</p>
            <ul className="course-detail-list">{activities.map((activity) => <li key={activity}><Check size={17} />{activity}</li>)}</ul>
          </section>
          <section className="course-detail-section">
            <span className="eyebrow">{t('Course details')}</span>
            <h2>{t('Training location and availability')}</h2>
            <ul className="course-detail-list"><li><MapPin size={17} />{courseCentre}</li></ul>
            <p>{t('Please contact the centre to confirm the current intake, entry requirements, fee and timetable before making travel or study plans.')}</p>
          </section>
          <section className="course-detail-section">
            <span className="eyebrow">{t('Where skills can take you')}</span>
            <h2>{t('Possible next steps')}</h2>
            <p>{t('These are examples of directions learners may explore as they build experience. Employment and progression depend on each learner, employer requirements and further qualifications.')}</p>
            <ul className="course-detail-list">{pathways.map((pathway) => <li key={pathway}><ArrowRight size={17} />{pathway}</li>)}</ul>
          </section>
        </div>
        {course.courseType === 'Short Course' && session?.user.role === 'admin' && (
          <p className="course-interest-privacy">{t('Administrator accounts cannot request course bookings.')}</p>
        )}
        {session?.user.role !== 'admin' && <dialog
          ref={interestDialogRef}
          className="course-interest-dialog"
          aria-label={t('Short-course application steps')}
          onCancel={(event) => {
            event.preventDefault()
            closeInterestDialog()
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeInterestDialog()
          }}
        >
        <aside className="course-interest-panel" id="course-interest-form">
          <div className="course-interest-dialog-controls">
            <button
              type="button"
              className="course-interest-language-button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              aria-label={t(language === 'en' ? 'Switch language to Kiswahili' : 'Switch language to English')}
            >
              {t(language === 'en' ? 'Kiswahili' : 'English')}
            </button>
            <button type="button" className="course-interest-dialog-close secondary-button action-icon-button"
              onClick={closeInterestDialog} aria-label={t('Close')} title={t('Close')}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <span className="eyebrow">{t('Take the next step')}</span>
          <h2>{t('Request to join this course')}</h2>
          <p>{t(isShortCourse ? session
            ? 'Sign in or create a learner account to start your request. The centre will provide a control number for the TSh 5,000 application form fee. Upload your payment screenshot in your dashboard; the full application form opens after staff verify the payment.'
            : 'Send your details now and the centre will contact you with the next intake, fee and application steps. You can create an account later if you decide to apply.'
            : 'Send your details and the centre will contact you about entry requirements, fees, the next intake and the official application process.')}</p>
          <p>{t(isShortCourse ? 'Submitting a request does not confirm a place. Wait for the centre to contact you and confirm availability before paying any course fees.' : 'This enquiry does not submit your VET-MIS application or confirm a place.')}</p>
          {isShortCourse && <div className="course-payment-guide">
            <h3>{t('What happens next')}</h3>
            <ol>
              <li>{t('Send your course request from your registered account.')}</li>
              <li>{t('Wait for the centre to add your payment control number to your dashboard.')}</li>
              <li>{t('Pay TSh 5,000 using the official instructions and upload a screenshot of the transaction message.')}</li>
              <li>{t('After staff verify the payment, complete the course application form in your dashboard.')}</li>
              <li>{t('The centre reviews your application and updates your dashboard with the decision and start date.')}</li>
            </ol>
          </div>}
          {!session && (
            <div className="guest-interest-form">
              <label>{t('Full name')}<input value={guestInterest.fullName} onChange={(event) => setGuestInterest((current) => ({ ...current, fullName: event.target.value }))} autoComplete="name" /></label>
              <label>{t('Email address')}<input type="email" value={guestInterest.email} onChange={(event) => setGuestInterest((current) => ({ ...current, email: event.target.value }))} autoComplete="email" /></label>
              <label>{t('Phone number')}<input type="tel" value={guestInterest.phone} onChange={(event) => setGuestInterest((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" placeholder="+255..." /></label>
              <label>{t('Question or message')}<textarea value={guestInterest.message} onChange={(event) => setGuestInterest((current) => ({ ...current, message: event.target.value }))} rows={3} /></label>
            </div>
          )}
          {error && <p className="error-message" role="alert">{t(error)}</p>}
          {notice?.slug === slug && <p className="success-message" role="status">{t(notice.message)}</p>}
          <button type="button" className="primary-button" disabled={submitting}
            onClick={() => void handleInterestSubmit()}>
            {submitting ? t('Please wait…') : session ? t(isShortCourse ? 'Send course request' : 'Send course enquiry') : t('Send course interest')}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </aside>
        </dialog>}
      </div>
      <div className="course-detail-footer-links">
        <Link to={course.courseType === 'Short Course' ? '/short-courses' : '/long-courses'} className="secondary-button">{t('Back to all courses')}</Link>
        <Link to={course.courseType === 'Short Course' ? '/long-courses' : '/short-courses'} className="text-link">
          {t(course.courseType === 'Short Course' ? 'Browse long courses' : 'Browse short courses')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/contact" className="text-link">{t('Contact the centre')}</Link>
      </div>
    </section>
  )
}

function NewsPage() {
  const t = useTranslate()
  const { language } = useLanguage()
  const { data: news, error } = useApiData<NewsItem>('/news')

  return (
    <section className="content-page">
      <header className="news-page-intro">
        <span className="eyebrow">{t('News & announcements')}</span>
        <h1>{t('Explore updates affecting learning, training and partnerships.')}</h1>
      </header>
      <div className="card-grid three-up">
        {news.map((item, index) => (
          <article key={`${item.id}-${index}`} className="info-card news-article">
            {item.imageUrl && <img className="news-article-image" src={getMediaUrl(item.imageUrl)} alt={item.title} loading="lazy" decoding="async" />}
            <h3><Link to={`/news/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h3>
            <p>{item.summary}</p>
            <p className="news-card-date">{formatLocaleDate(item.date, language)}</p>
            <Link to={`/news/${encodeURIComponent(item.slug)}`} className="text-link">
              {t('Read full story')} <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
      {error && <p className="error-message">{t(error)}</p>}
      {!error && news.length === 0 && <p>{t('No news articles are currently available.')}</p>}
    </section>
  )
}

function NewsArticlePage({ session, onOpenLogin }: { session: Session | null; onOpenLogin: () => void }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const { slug = '' } = useParams()
  const [articleData, setArticleData] = useState<NewsArticleDetail | null>(null)
  const article = useMemo(
    () => articleData ? localizeContentRecord(articleData, language) : null,
    [articleData, language]
  )
  const [loading, setLoading] = useState(true)
  const [loadedSlug, setLoadedSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [shareFeedback, setShareFeedback] = useState('')
  const [showYoutubeVideo, setShowYoutubeVideo] = useState(false)

  useEffect(() => {
    setShowYoutubeVideo(false)
    const controller = new AbortController()
    fetchJson<{ article: NewsArticleDetail }>(
      `/news/${encodeURIComponent(slug)}`,
      controller.signal
    )
      .then(({ article: loadedArticle }) => {
        setArticleData(loadedArticle)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load this news article.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadedSlug(slug)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [slug, session?.user.id])

  const isLoading = loading || loadedSlug !== slug

  const handleReaction = async (reaction: 'like' | 'dislike') => {
    if (!article || !session) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await mutateJson('PUT', `/news/${encodeURIComponent(slug)}/reaction`, {
        reaction: article.userReaction === reaction ? null : reaction
      })
      const { article: updatedArticle } = await fetchJson<{ article: NewsArticleDetail }>(
        `/news/${encodeURIComponent(slug)}`
      )
      setArticleData(updatedArticle)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save your reaction.')
    } finally {
      setBusy(false)
    }
  }

  const handleComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return
    const form = event.currentTarget
    const content = String(new FormData(form).get('content') ?? '').trim()
    if (!content) {
      setError(t('Write a comment before posting.'))
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await postJson<{ comment: NewsCommentItem }>(
        `/news/${encodeURIComponent(slug)}/comments`,
        { content }
      )
      setArticleData((current) => current
        ? { ...current, comments: [result.comment, ...current.comments] }
        : current)
      setNotice(t('Your comment has been posted.'))
      form.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to post your comment.')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) return <section className="content-page"><p>{t('Loading news article…')}</p></section>
  if (!article) {
    return (
      <section className="content-page">
        <p className="error-message">{t(error || 'News article not found.')}</p>
        <Link to="/news" className="text-link">{t('Back to news')}</Link>
      </section>
    )
  }

  const articleUrl = window.location.href
  const handleShare = async () => {
    setShareFeedback('')
    try {
      await navigator.share({
        title: article.title,
        text: article.summary || article.title,
        url: articleUrl
      })
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      setShareFeedback('Unable to share this story.')
    }
  }

  const handleCopyArticleLink = async () => {
    setShareFeedback('')
    try {
      await navigator.clipboard.writeText(articleUrl)
      setShareFeedback('Link copied.')
    } catch {
      setShareFeedback('Unable to copy the link.')
    }
  }

  return (
    <article className="content-page news-detail-page">
      <Link to="/news" className="text-link news-back-link">← {t('Back to news')}</Link>
      {article.videoUrl ? (
        <video className="news-detail-video" src={getMediaUrl(article.videoUrl)} controls playsInline preload="metadata">
          {t('Your browser does not support embedded video.')}
        </video>
      ) : article.youtubeUrl ? (
        showYoutubeVideo || !article.imageUrl ? (
          <div className="news-youtube-frame">
            <iframe
              src={article.youtubeUrl}
              title={`${t('Video')}: ${article.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <button
            type="button"
            className="news-video-cover-button"
            onClick={() => setShowYoutubeVideo(true)}
            aria-label={t('Play video')}
          >
            <img className="news-detail-image" src={getMediaUrl(article.imageUrl!)} alt={article.title} loading="eager" fetchPriority="high" decoding="async" />
            <span className="news-video-play-badge">
              <Play size={18} />
              {t('Play video')}
            </span>
          </button>
        )
      ) : article.imageUrl ? (
        <img className="news-detail-image" src={getMediaUrl(article.imageUrl)} alt={article.title} loading="eager" fetchPriority="high" decoding="async" />
      ) : null}
      <header className="news-detail-header">
        <h1>{article.title}</h1>
        <p className="news-card-date">{formatLocaleDate(article.date, language)}</p>
        {article.summary && <p className="news-detail-summary">{article.summary}</p>}
      </header>
      <div className="news-detail-body">{article.body}</div>

      <section className="news-share" aria-labelledby="news-share-heading">
        <h2 id="news-share-heading">{t('Share this story')}</h2>
        <div className="news-share-actions" role="group" aria-label={t('Share this story')}>
          <a
            className="news-share-button whatsapp"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title} ${articleUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Share on WhatsApp')}
            title={t('Share on WhatsApp')}
          >
            <MessageCircle size={18} aria-hidden="true" />
          </a>
          <a
            className="news-share-button facebook"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Share on Facebook')}
            title={t('Share on Facebook')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H7.8v3h2.6v8h3.1Z" />
            </svg>
          </a>
          <a
            className="news-share-button x"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Share on X')}
            title={t('Share on X')}
          >
            <X size={18} aria-hidden="true" />
          </a>
          {typeof navigator.share === 'function' && (
            <button type="button" className="news-share-button" onClick={() => void handleShare()}
              aria-label={t('Share')} title={t('Share')}>
              <Share2 size={18} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="news-share-button" onClick={() => void handleCopyArticleLink()}
            aria-label={t('Copy link')} title={t('Copy link')}>
            <Copy size={18} aria-hidden="true" />
          </button>
        </div>
        {shareFeedback && (
          <p className={shareFeedback === 'Link copied.' ? 'success-message' : 'error-message'}
            role={shareFeedback === 'Link copied.' ? 'status' : 'alert'}>
            {t(shareFeedback)}
          </p>
        )}
      </section>

      <section className="news-interactions" aria-labelledby="news-interactions-heading">
        <h2 id="news-interactions-heading">{t('Join the conversation')}</h2>
        {session ? (
          <div className="news-reaction-actions">
            <button
              type="button"
              className={article.userReaction === 'like' ? 'news-reaction-button selected' : 'news-reaction-button'}
              onClick={() => void handleReaction('like')}
              disabled={busy}
              aria-pressed={article.userReaction === 'like'}
            >
              <ThumbsUp size={18} aria-hidden="true" /> {t('Like')} <span>{article.likes}</span>
            </button>
            <button
              type="button"
              className={article.userReaction === 'dislike' ? 'news-reaction-button selected dislike-selected' : 'news-reaction-button'}
              onClick={() => void handleReaction('dislike')}
              disabled={busy}
              aria-pressed={article.userReaction === 'dislike'}
            >
              <ThumbsDown size={18} aria-hidden="true" /> {t('Dislike')} <span>{article.dislikes}</span>
            </button>
          </div>
        ) : (
          <p>{t('Sign in to like, dislike, or comment on this story.')} {' '}
            <button type="button" className="auth-inline-link" onClick={onOpenLogin}>{t('Login')}</button>.
          </p>
        )}

        {session && (
          <form className="news-comment-form" onSubmit={(event) => void handleComment(event)}>
            <label htmlFor="news-comment">{t('Add a comment')}</label>
            <textarea id="news-comment" name="content" rows={4} maxLength={2000} required
              placeholder={t('Share your thoughts respectfully')} disabled={busy} />
            <button className="primary-button action-icon-button" type="submit" disabled={busy}
              aria-label={t(busy ? 'Please wait…' : 'Post comment')} title={t(busy ? 'Please wait…' : 'Post comment')}>
              <MessageCircle size={17} aria-hidden="true" />
              <span className="visually-hidden">{busy ? t('Please wait…') : t('Post comment')}</span>
            </button>
          </form>
        )}
        {error && <p className="error-message" role="alert">{t(error)}</p>}
        {notice && <p className="success-message" role="status">{t(notice)}</p>}

        <div className="news-comments">
          <h3>{t('Comments')} ({article.comments.length})</h3>
          {article.comments.length ? article.comments.map((comment, index) => (
            <article key={`${comment.id}-${index}`} className="news-comment">
              <div className="news-comment-heading">
                <strong>{comment.userName}</strong>
                <time dateTime={comment.createdAt}>{formatLocaleDate(comment.createdAt, language)}</time>
              </div>
              <p>{comment.content}</p>
            </article>
          )) : <p>{t('No comments yet. Be the first to share your thoughts.')}</p>}
        </div>
      </section>
    </article>
  )
}

/*
 * The former external VETA catalogue was intentionally retired. Kipawa
 * publications now come only from the centre-managed publication endpoint.
 *
type VetaPublication = {
  category: 'Short Courses' | 'Long Courses' | 'Financial Reports' | 'Other'
  title: string
  date: string
  fileUrl: string
}

const vetaPublicationCategories = ['Short Courses', 'Long Courses', 'Financial Reports', 'Other'] as const

const vetaRecentPublications: VetaPublication[] = [
  { category: 'Other', title: 'MABADILIKO YA RATIBA YA MITIHANI YA TAIFA YA UFUNDI STADI KWA MSIMU WA MWEZI NOVEMBA/DESEMBA 2026', date: '2026-10-10', fileUrl: 'https://www.veta.go.tz/publication/doc/TNnQoL7jqEpSy4SFSywhB09yjSaRhQTgauk9iYa3.pdf' },
  { category: 'Financial Reports', title: 'FINANCIAL STATEMENT FOR THE FINANCIAL YEAR ENDED 30 JUNE 2025', date: '2026-09-24', fileUrl: 'https://www.veta.go.tz/publication/doc/gmZpmPCSXVczIcxvgZ3IuKZhQgBJYXaRql2TpQTe.pdf' },
  { category: 'Financial Reports', title: 'FINANCIAL STATEMENT FOR THE FINANCIAL YEAR ENDED 30 JUNE 2024', date: '2026-09-15', fileUrl: 'https://www.veta.go.tz/publication/doc/FNDykf4ao3X8FyAue0WyAE67n70PMW25ZCIuyXP9.pdf' },
  { category: 'Financial Reports', title: 'FINANCIAL STATEMENT FOR THE FINANCIAL YEAR ENDED 30 JUNE 2023', date: '2026-09-15', fileUrl: 'https://www.veta.go.tz/publication/doc/rgGtgwFPyX6YBwYonm1JFnnyOMLQg7zxbyOIqGs0.pdf' },
  { category: 'Financial Reports', title: 'FINANCIAL STATEMENT FOR THE FINANCIAL YEAR ENDED 30 JUNE 2022', date: '2026-09-15', fileUrl: 'https://www.veta.go.tz/publication/doc/xmN3ZNVlstP6N4bLzFIYaxmA5nMoVUK5kblhNc9G.pdf' },
  { category: 'Long Courses', title: 'MAJINA YA WALIOCHAGULIWA KUJIUNGA NA MAFUNZO YA UFUNDI STADI NGAZI YA TATU KATIKA VYUO VYA VETA – AWAMU YA PILI (SECOND SELECTION)', date: '2026-08-21', fileUrl: 'https://www.veta.go.tz/publication/doc/5NHOBaDBQqWDJYSe3VtjjT1OxKR7fdlgwAM1R88Q.pdf' },
  { category: 'Other', title: 'UTARATIBU WA UTOAJI WA VYETI MBADALA KWA WAHITIMU WA ELIMU NA MAFUNZO YA UFUNDI STADI', date: '2026-07-30', fileUrl: 'https://www.veta.go.tz/publication/doc/LFIlrIMczW2KSOBsSrCHYR9P5yPLtHgl53GsDRxJ.pdf' },
  { category: 'Long Courses', title: 'Fomu ya Maombi ya Kujiunga na Chuo cha VETA cha Mafunzo ya Hoteli na Utalii (VHTTI) kwa Mwaka wa Masomo 2026/2027 – Ngazi ya Diploma', date: '2026-07-23', fileUrl: 'https://www.veta.go.tz/publication/doc/iP7j9y2oR2Odlwpr24yg2cPQppBBqKt8BIEVqy0r.pdf' },
  { category: 'Short Courses', title: 'ORODHA YA KOZI ZA MUDA MFUPI ZINAZOTOLEWA NA VYUO VYA VETA', date: '2026-07-20', fileUrl: 'https://www.veta.go.tz/publication/doc/jpHUGdA0nJYaSn5lUMlxyz4addQw3TZk2BCmdVTl.pdf' },
  { category: 'Other', title: 'FOMU YA MAOMBI YA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KWA NGAZI YA TATU', date: '2026-07-18', fileUrl: 'https://www.veta.go.tz/publication/doc/OjcfSJnnNmKG185BgYF3aFrfIj6jEaZOrpHpj9Yj.pdf' },
  { category: 'Other', title: 'FOMU YA MAOMBI YA KUJIUNGA NA VETA NGAZI YA KWANZA KWA MWAKA WA MASOMO UNAOANZA JANUARI 2027', date: '2026-07-11', fileUrl: 'https://www.veta.go.tz/publication/doc/vBu4hxviu71ZqgE5WRvVNmwIOPRLXUClYrbhYrvY.pdf' },
  { category: 'Other', title: 'MAJINA YA WALIOCHAGULIWA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KUPITIA NBC WAJIBIKA SCHOLARSHIP', date: '2026-05-17', fileUrl: 'https://www.veta.go.tz/publication/doc/JcMzNH5cWjdRnk2OsWWDOfg69agRnxFPkdeG22Vu.pdf' },
  { category: 'Other', title: 'FOMU YA MAOMBI YA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KUPITIA NBC WAJIBIKA SCHOLARSHIP', date: '2026-04-27', fileUrl: 'https://www.veta.go.tz/publication/doc/ugTEaTApQta6NMBoWP0B9Oix4yDkLrnZE5OlxxYT.pdf' },
  { category: 'Other', title: 'FOMU YA MAOMBI MAFUNZO YA UHIFADHI WA MAZAO (YEFFA)', date: '2026-04-14', fileUrl: 'https://www.veta.go.tz/publication/doc/76nZcF7kLRcMSmEOQ8C1XIp4FIxWMRzq4A1VAZFx.pdf' },
  { category: 'Other', title: 'FOMU YA MAOMBI YA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KWA NGAZI YA TATU KWA MWAKA 2026', date: '2026-03-30', fileUrl: 'https://www.veta.go.tz/publication/doc/efUeyXgKpli3u8BOucIQL9F75MSsZaJHjI6a1zUV.pdf' },
  { category: 'Other', title: 'MAJINA YA WALIOCHAGULIWA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KWA MWAKA WA 2026 (SECOND SELECTION)', date: '2026-02-14', fileUrl: 'https://www.veta.go.tz/publication/doc/UnSKLEDboUSSRTjBCcQH9ZrH9G00cj0nRnHoTxl7.pdf' },
  { category: 'Other', title: 'MAJINA YA WALIOCHAGULIWA KUJIUNGA NA KOZI ZA MUDA MFUPI KUPITIA MRADI WA YEFFA', date: '2026-01-15', fileUrl: 'https://www.veta.go.tz/publication/doc/GifT7u9rEFVOK4ia7dNhWsaD56jlb5Pex9Tp5E0G.pdf' },
  { category: 'Other', title: 'FURSA ZA MAFUNZO YA UFUNDI STADI YA MUDA MFUPI KATIKA VYUO VYA VETA KUPITIA MRADI YEFFA', date: '2025-12-18', fileUrl: 'https://www.veta.go.tz/publication/doc/bdaIIKQ1jLz9lPfuEGvZmVHq5a5eTqyz1ywvwQVl.pdf' },
  { category: 'Other', title: 'MAJINA YA WALIOCHAGULIWA KUJIUNGA NA MAFUNZO YA UFUNDI STADI KWA MWAKA WA 2026', date: '2025-12-15', fileUrl: 'https://www.veta.go.tz/publication/doc/NLXAzTZwTjZ3J97sWn5bW7MClZd67j2mNiu2eUSM.pdf' },
  { category: 'Other', title: 'MATOKEO YA MITIHANI YA TAIFA YA UFUNDI STADI KWA MSIMU WA MWEZI JUNI 2025', date: '2025-09-02', fileUrl: 'https://www.veta.go.tz/publication/doc/O1aPYO0PDVcbfBZiE2Fco9biRKkdXZhn44JFqOpN.pdf' }
]
*/

function PublicationPreviewDialog({
  publication,
  onClose
}: {
  publication: { title: string; fileUrl: string } | null
  onClose: () => void
}) {
  const t = useTranslate()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (publication && !dialog.open) dialog.showModal()
    if (!publication && dialog.open) dialog.close()
  }, [publication])

  return (
    <dialog
      ref={dialogRef}
      className="publication-preview-dialog"
      aria-labelledby="publication-preview-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {publication && (
        <div className="publication-preview-content">
          <header className="publication-preview-header">
            <h2 id="publication-preview-title">{publication.title}</h2>
            <button type="button" className="publication-preview-close" onClick={onClose} aria-label={t('Close')}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <iframe
            className="publication-preview-frame"
            src={publication.fileUrl}
            title={`${t('Publication preview')}: ${publication.title}`}
          />
          <footer className="publication-preview-actions">
            <a
              className="publication-download-button"
              href={publication.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} aria-hidden="true" /> {t('Download PDF')}
            </a>
          </footer>
        </div>
      )}
    </dialog>
  )
}

/* Legacy external-catalogue page removed from the active publication route.
function PublicationsPage() {
  const t = useTranslate()
  const { language } = useLanguage()
  const { data: publications, error, loading: publicationsLoading } = useApiData<PublicationItem>('/publications')
  const [category, setCategory] = useState<string>('All')
  const [query, setQuery] = useState('')
  const [previewPublication, setPreviewPublication] = useState<{ title: string; fileUrl: string } | null>(null)
  const matchingVetaPublications = vetaRecentPublications.filter((publication) => {
    const categoryMatches = category === 'All' || publication.category === category
    return categoryMatches && publication.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  })

  return (
    <section className="content-page publications-page">
      <header className="publications-intro">
        <span className="publications-intro-icon"><Building2 size={25} aria-hidden="true" /></span>
        <span className="eyebrow">{t('Publications & downloads')}</span>
        <h1>{t('Centre publications')}</h1>
        <p>{t('Browse official VETA publications and resources for learners, staff, and the Kipawa community.')}</p>
      </header>

      <div className="publication-category-grid" role="group" aria-label={t('Publication categories')} tabIndex={0}>
        <button
          className={`publication-category-card${category === 'All' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setCategory('All')}
          aria-pressed={category === 'All'}
        >
          <span className="publication-category-icon"><BookOpen size={20} aria-hidden="true" /></span>
          <span className="publication-category-name">{t('All publications')}</span>
          <span className="publication-category-count">{vetaRecentPublications.length} {t('recent documents')}</span>
        </button>
        {vetaPublicationCategories.map((name) => {
          const count = vetaRecentPublications.filter((publication) => publication.category === name).length
          return (
            <button
              className={`publication-category-card${category === name ? ' is-active' : ''}`}
              type="button"
              key={name}
              onClick={() => setCategory(category === name ? 'All' : name)}
              aria-pressed={category === name}
            >
              <span className="publication-category-icon">
                {name === 'Short Courses' ? <Monitor size={20} aria-hidden="true" /> :
                  name === 'Long Courses' ? <Award size={20} aria-hidden="true" /> :
                    name === 'Financial Reports' ? <ShieldCheck size={20} aria-hidden="true" /> :
                      <FileText size={20} aria-hidden="true" />}
              </span>
              <span className="publication-category-name">{t(name)}</span>
              <span className="publication-category-count">{count} {t(count === 1 ? 'document' : 'documents')}</span>
            </button>
          )
        })}
      </div>

      <div className="publications-section-heading">
        <div>
          <span className="eyebrow">{t('Official VETA catalogue')}</span>
          <h2><Newspaper size={21} aria-hidden="true" /> {t('Recent publications')}</h2>
        </div>
        <a className="text-link" href="https://www.veta.go.tz/publications" target="_blank" rel="noreferrer">
          {t('View complete catalogue')} <ArrowRight size={16} />
        </a>
      </div>
      <label className="publication-search">
        <Search size={18} aria-hidden="true" />
        <span className="visually-hidden">{t('Search publications')}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('Search publications')}
        />
      </label>

      <div className="publication-list">
        {matchingVetaPublications.map((publication) => (
          <article className="publication-list-item" key={publication.fileUrl}>
            <div className="publication-list-copy">
              <span className="publication-category-label">{t(publication.category)}</span>
              <h3>{publication.title}</h3>
              <time dateTime={publication.date}>{formatLocaleDate(publication.date, language)}</time>
            </div>
            <button
              className="publication-download-button"
              type="button"
              onClick={() => setPreviewPublication({ title: publication.title, fileUrl: publication.fileUrl })}
            >
              <Eye size={16} aria-hidden="true" /> {t('View PDF')}
            </button>
          </article>
        ))}
        {!matchingVetaPublications.length && <p className="course-empty-state">{t('No publications match your search.')}</p>}
      </div>

      <section className="kipawa-publications-section" aria-labelledby="centre-publications-title">
        <div className="publications-section-heading">
          <div>
            <h2 id="centre-publications-title">{t('Centre publications')}</h2>
          </div>
        </div>
        {publicationsLoading ? (
          <p className="course-empty-state" role="status">{t('Loading centre publications…')}</p>
        ) : error ? (
          <p className="error-message" role="alert">{t(error)}</p>
        ) : publications.length ? (
          <div className="publication-list">
            {publications.map((publication) => {
              const localizedPublication = localizeContentRecord(publication, language)
              const relatedCourse = publication.course ? localizeContentRecord(publication.course, language) : null
              return (
                <article key={publication.id} className="publication-list-item">
                  <div className="publication-list-copy">
                    <h3>{localizedPublication.title}</h3>
                    <time dateTime={publication.createdAt}>
                      {t('Published')}: {formatLocaleDate(publication.createdAt, language)}
                    </time>
                    {relatedCourse && (
                      <p>{t('Related course')}: <Link to={`/courses/${encodeURIComponent(relatedCourse.slug)}`}>{relatedCourse.name}</Link></p>
                    )}
                  </div>
                  <button
                    className="publication-download-button"
                    type="button"
                    onClick={() => setPreviewPublication({
                      title: localizedPublication.title,
                      fileUrl: getMediaUrl(publication.fileUrl)
                    })}
                  >
                    <Eye size={16} aria-hidden="true" /> {t('View publication')}
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="course-empty-state">{t('No centre publications are available right now.')}</p>
        )}
      </section>
      <PublicationPreviewDialog publication={previewPublication} onClose={() => setPreviewPublication(null)} />
    </section>
  )
}
*/

function PublicationsPageV2() {
  const t = useTranslate()
  const { language } = useLanguage()
  const { data: publications, error, loading: publicationsLoading } = useApiData<PublicationItem>('/publications')
  const [resourceFilter, setResourceFilter] = useState<'all' | 'courses' | 'general'>('all')
  const [query, setQuery] = useState('')
  const searchPlaceholders = useMemo(() => [
    t('Search guides, forms and resources'),
    t('Find a course document'),
    t('Discover centre downloads')
  ], [t])
  const [searchPlaceholder, setSearchPlaceholder] = useState(searchPlaceholders[0])
  const [previewPublication, setPreviewPublication] = useState<{ title: string; fileUrl: string } | null>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matchingPublications = publications.filter((publication) => {
    const localizedPublication = localizeContentRecord(publication, language)
    const relatedCourse = publication.course ? localizeContentRecord(publication.course, language) : null
    const searchableText = `${localizedPublication.title} ${relatedCourse?.name ?? ''}`.toLocaleLowerCase()
    const filterMatches = resourceFilter === 'all' || (resourceFilter === 'courses' ? Boolean(relatedCourse) : !relatedCourse)
    return filterMatches && searchableText.includes(normalizedQuery)
  })
  const featuredPublication = matchingPublications[0]

  useEffect(() => {
    let phraseIndex = 0
    let characterIndex = 0
    let deleting = false
    let timeoutId: number | undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      setSearchPlaceholder(searchPlaceholders[0])
      return
    }

    const typeNextCharacter = () => {
      const phrase = searchPlaceholders[phraseIndex]
      if (!deleting) {
        characterIndex += 1
        setSearchPlaceholder(phrase.slice(0, characterIndex))
        if (characterIndex === phrase.length) {
          deleting = true
          timeoutId = window.setTimeout(typeNextCharacter, 1700)
          return
        }
      } else {
        characterIndex -= 1
        setSearchPlaceholder(phrase.slice(0, characterIndex))
        if (characterIndex === 0) {
          deleting = false
          phraseIndex = (phraseIndex + 1) % searchPlaceholders.length
          timeoutId = window.setTimeout(typeNextCharacter, 350)
          return
        }
      }
      timeoutId = window.setTimeout(typeNextCharacter, deleting ? 34 : 62)
    }

    setSearchPlaceholder('')
    timeoutId = window.setTimeout(typeNextCharacter, 180)
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [searchPlaceholders])

  return (
    <section className="content-page publications-page publications-page-modern">
      <header className="publications-hero">
        <div className="publications-hero-copy">
          <span className="eyebrow">{t('Kipawa resource library')}</span>
          <h1>{t('Useful resources, ready when you need them.')}</h1>
          <p>{t('Find guides, forms and centre resources in one simple, welcoming place. Preview a document first or download it for later.')}</p>
          <div className="publications-hero-actions">
            <a className="primary-button" href="#publication-library"><Download size={17} aria-hidden="true" /> {t('Explore downloads')}</a>
            <span className="publications-hero-note"><ShieldCheck size={16} aria-hidden="true" /> {t('Centre-managed resources')}</span>
          </div>
        </div>
        <div className="publications-hero-art" aria-hidden="true">
          <span className="publication-art-card publication-art-card-back"><FileText size={30} /></span>
          <span className="publication-art-card publication-art-card-middle"><BookOpen size={30} /></span>
          <span className="publication-art-card publication-art-card-front"><Download size={34} /></span>
          <span className="publication-art-orbit publication-art-orbit-one" />
          <span className="publication-art-orbit publication-art-orbit-two" />
        </div>
      </header>

      <div className="publication-library-heading" id="publication-library">
        <div><span className="eyebrow">{t('Browse the library')}</span><h2>{t('Downloads for the Kipawa community')}</h2></div>
        <div className="publication-library-stats"><strong>{publications.length}</strong><span>{t('available resources')}</span></div>
      </div>

      <div className="publication-library-toolbar">
        <label className="publication-search">
          <Search size={18} aria-hidden="true" /><span className="visually-hidden">{t('Search publications')}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
        </label>
        <div className="publication-filter-tabs" role="group" aria-label={t('Resource filters')}>
          {([
            ['all', 'All resources'],
            ['courses', 'Course resources'],
            ['general', 'General resources']
          ] as const).map(([value, label]) => (
            <button className={resourceFilter === value ? 'is-active' : ''} type="button" key={value} onClick={() => setResourceFilter(value)} aria-pressed={resourceFilter === value}>{t(label)}</button>
          ))}
        </div>
      </div>

      {publicationsLoading ? (
        <div className="publication-skeleton-grid" aria-busy="true" aria-label={t('Loading publications')}>
          {Array.from({ length: 4 }, (_, index) => <span key={index} className="publication-skeleton-card" />)}
        </div>
      ) : error ? (
        <p className="error-message" role="alert">{t(error)}</p>
      ) : !matchingPublications.length ? (
        <div className="publication-empty-state"><span><Search size={26} aria-hidden="true" /></span><h3>{t('No resources found')}</h3><p>{t('Try another search or choose a different resource filter.')}</p></div>
      ) : (
        <div className="publication-results">
          <article className="publication-featured-card">
            <div className="publication-featured-mark"><FileText size={26} aria-hidden="true" /></div>
            <div className="publication-featured-copy">
              <span className="publication-card-label">{t('Featured resource')}</span>
              <h3>{localizeContentRecord(featuredPublication, language).title}</h3>
              <p>{t('A centre resource selected for quick access.')}</p>
              <div className="publication-card-meta"><time dateTime={featuredPublication.createdAt}>{formatLocaleDate(featuredPublication.createdAt, language)}</time>{featuredPublication.course && <span><BookOpen size={14} aria-hidden="true" /> {localizeContentRecord(featuredPublication.course, language).name}</span>}</div>
            </div>
              <div className="publication-card-actions">
              <button className="primary-button" type="button" onClick={() => setPreviewPublication({ title: localizeContentRecord(featuredPublication, language).title, fileUrl: getMediaUrl(featuredPublication.fileUrl) })}><Eye size={16} aria-hidden="true" /> {t('Preview')}</button>
              <a className="secondary-button" href={getMediaUrl(featuredPublication.fileUrl)} download target="_blank" rel="noreferrer"><Download size={16} aria-hidden="true" /> {t('Download')}</a>
                <CompactShareActions url={getMediaUrl(featuredPublication.fileUrl)} title={localizeContentRecord(featuredPublication, language).title} />
            </div>
          </article>

          <div className="publication-results-heading"><h3>{t('All resources')}</h3><span>{matchingPublications.length} {t(matchingPublications.length === 1 ? 'resource' : 'resources')}</span></div>
          <div className="publication-card-grid">
            {matchingPublications.slice(1).map((publication) => {
              const localizedPublication = localizeContentRecord(publication, language)
              const relatedCourse = publication.course ? localizeContentRecord(publication.course, language) : null
              const fileUrl = getMediaUrl(publication.fileUrl)
              return (
                <article key={publication.id} className="publication-resource-card">
                  <div className="publication-resource-icon"><FileText size={22} aria-hidden="true" /></div>
                  <div className="publication-resource-copy"><span>{relatedCourse ? t('Course resource') : t('Centre resource')}</span><h3>{localizedPublication.title}</h3><time dateTime={publication.createdAt}>{formatLocaleDate(publication.createdAt, language)}</time>{relatedCourse && <p><BookOpen size={13} aria-hidden="true" /> {relatedCourse.name}</p>}</div>
                  <div className="publication-resource-actions">
                    <button type="button" className="publication-icon-action" onClick={() => setPreviewPublication({ title: localizedPublication.title, fileUrl })} aria-label={`${t('Preview')}: ${localizedPublication.title}`} title={t('Preview')}><Eye size={17} aria-hidden="true" /></button>
                    <a className="publication-icon-action" href={fileUrl} download target="_blank" rel="noreferrer" aria-label={`${t('Download')}: ${localizedPublication.title}`} title={t('Download')}><Download size={17} aria-hidden="true" /></a>
                    <CompactShareActions url={fileUrl} title={localizedPublication.title} />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
      <PublicationPreviewDialog publication={previewPublication} onClose={() => setPreviewPublication(null)} />
    </section>
  )
}

function ContactPage() {
  const t = useTranslate()
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState('')
  const [copyError, setCopyError] = useState('')
  const { settings } = useSiteSettings()
  const physicalAddress = settings['site.physicalAddress'] ?? KIPAWA_PHYSICAL_ADDRESS
  const postalAddress = settings['site.postalAddress'] ?? KIPAWA_POSTAL_ADDRESS
  const contactPhones = splitContactPhones(settings['site.contactPhone'] ?? KIPAWA_CONTACT_PHONE)
  const contactEmail = settings['site.contactEmail'] ?? KIPAWA_CONTACT_EMAIL
  const locationMapUrl = safeHttpsUrl(settings['site.mapUrl']) ?? KIPAWA_MAP_URL

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      setCopiedPhone(phone)
      setCopyError('')
      window.setTimeout(() => setCopiedPhone((current) => current === phone ? '' : current), 2000)
    } catch {
      setCopiedPhone('')
      setCopyError(t('Unable to copy the phone number.'))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const category = String(form.get('category') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()

    if (!name || !email || !category) {
      setError(t('Enter your name and email, then choose what you need help with.'))
      return
    }

    try {
      await postJson('/contact', { name, email, category, message: message || category })
      setError('')
      setSubmitted(true)
      formElement.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to send your message.'))
    }
  }

  return (
    <section className="content-page contact-page">
      <header className="contact-intro">
        <span className="contact-intro-icon" aria-hidden="true"><MessageCircle size={22} /></span>
        <div>
          <span className="eyebrow">{t('Contact us')}</span>
          <h1>{t('Speak with our information and support team.')}</h1>
          <p>{t('Choose a phone number to call, or send us a message using the form.')}</p>
        </div>
      </header>
      <div className="contact-layout">
        <div className="info-stack">
          <div className="info-card contact-summary-card">
            <section className="contact-summary-item contact-summary-phone">
              <span className="contact-detail-icon phone-detail-icon" aria-hidden="true"><Phone size={19} /></span>
              <div>
                <h3>{t('Call us')}</h3>
                <p className="contact-detail-hint">{t('Choose a phone number to call, or copy it for later.')}</p>
                <div className="contact-phone-list">
                  {contactPhones.length ? contactPhones.map((phone) => (
                    <div className="contact-phone-row" key={phone}>
                      <a className="contact-phone-number" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                        <Phone size={16} aria-hidden="true" />
                        <span>{phone}</span>
                      </a>
                      <button
                        type="button"
                        className="contact-copy-button"
                        onClick={() => void handleCopyPhone(phone)}
                        aria-label={`${t('Copy phone number')} ${phone}`}
                      >
                        {copiedPhone === phone ? <Check size={15} /> : <Copy size={15} />}
                        {copiedPhone === phone ? t('Copied') : t('Copy')}
                      </button>
                    </div>
                  )) : (
                    <p>{t('Contact phone not configured')}</p>
                  )}
                </div>
                {copyError && <p className="error-message contact-copy-error" role="status">{copyError}</p>}
              </div>
            </section>
            <section className="contact-summary-item">
              <span className="contact-detail-icon email-detail-icon" aria-hidden="true"><Mail size={18} /></span>
              <div>
                <h3>{t('Email')}</h3>
                {contactEmail
                  ? <p><a className="contact-email-link" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
                  : <p>{t('Contact email not configured')}</p>}
              </div>
            </section>
            <section className="contact-summary-item">
              <span className="contact-detail-icon hours-detail-icon" aria-hidden="true"><Clock3 size={18} /></span>
              <div>
                <h3>{t('Office hours')}</h3>
                <p>{settings['site.officeHours']?.trim() || t('Office hours not configured')}</p>
              </div>
            </section>
            {(physicalAddress || postalAddress || locationMapUrl) && (
              <section className="contact-summary-item contact-address-card">
                <span className="contact-detail-icon address-detail-icon" aria-hidden="true"><MapPin size={18} /></span>
                <div>
                  <h3>{t('Our address')}</h3>
                  {physicalAddress && <p><strong>{t('Physical address')}:</strong> {physicalAddress}</p>}
                  {postalAddress && <p><strong>{t('Postal address')}:</strong> {postalAddress}</p>}
                  {locationMapUrl && <a className="contact-directions-link" href={locationMapUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} />{t('View location map')}</a>}
                </div>
              </section>
            )}
          </div>
          <div className="info-card contact-map-card">
            <iframe
              src={KIPAWA_MAP_EMBED_URL}
              title={t('VETA Kipawa ICT Centre location on Google Maps')}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a href={locationMapUrl} target="_blank" rel="noopener noreferrer"><MapPin size={17} />{t('Open directions to VETA Kipawa')}</a>
          </div>
        </div>
        <form className="application-form contact-message-form" onSubmit={handleSubmit}>
          <label>
            {t('Name')}
            <input name="name" type="text" placeholder={t('Name')} required />
          </label>
          <label>
            {t('Email address')}
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            {t('What do you need help with?')}
            <select name="category" defaultValue="" required>
              <option value="" disabled>
                {t('Choose a topic')}
              </option>
              <option value="Admission enquiry">{t('Admission enquiry')}</option>
              <option value="Course guidance">{t('Course guidance')}</option>
              <option value="Fees and payments">{t('Fees and payments')}</option>
              <option value="Office location">{t('Office location')}</option>
              <option value="General support">{t('General support')}</option>
              <option value="Other">{t('Other')}</option>
            </select>
          </label>
          <details className="contact-optional-message">
            <summary>{t('Add a message (optional)')}</summary>
            <label>
              {t('Message')}
              <textarea name="message" rows={3} maxLength={2000} placeholder={t('How can we help?')} />
            </label>
          </details>
          <button
            type="submit"
            className="primary-button contact-send-button"
            aria-label={t('Send message')}
            title={t('Send message')}
          >
            <Send size={18} aria-hidden="true" />{t('Send message')}
          </button>
          {error && <p className="error-message">{t(error)}</p>}
          {submitted && <p className="success-message">{t('Your message has been sent successfully.')}</p>}
        </form>
      </div>
    </section>
  )
}

function PasswordInput({
  name,
  placeholder,
  required = false,
  minLength,
  autoComplete
}: {
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
}) {
  const t = useTranslate()
  const [visible, setVisible] = useState(false)

  return (
    <span className="password-input-wrap">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={t(visible ? 'Hide password' : 'Show password')}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  )
}

function AuthDialog({
  mode,
  onModeChange,
  onClose,
  onSuccess
}: {
  mode: Exclude<AuthMode, null>
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
  onSuccess: (session: Session) => void
}) {
  const t = useTranslate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.classList.add('auth-dialog-open')
    return () => document.body.classList.remove('auth-dialog-open')
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('Passwords do not match.'))
      return
    }
    if (!email || !password || (mode === 'register' && (!name || !phone))) {
      setError(t('Please complete all required details.'))
      return
    }

    setLoading(true)

    try {
      const response = await postJson<{ user: AppUser }>(
        mode === 'register' ? '/auth/register' : '/auth/login',
        mode === 'register' ? { name, email, phone, password } : { email, password }
      )
      onSuccess({ user: response.user })
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to authenticate right now.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="auth-card">
        <button type="button" className="auth-dialog-close" aria-label={t('Close')} onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
        <span className="eyebrow">{t(mode === 'login' ? 'Welcome back' : 'Join the conversation')}</span>
        <h1 id="auth-dialog-title">{t(mode === 'login' ? 'Login to your account' : 'Create an account')}</h1>

        <form className="application-form" onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'register' && (
            <label>
              {t('Name')}
              <input name="name" type="text" autoComplete="name" minLength={2} maxLength={160} required />
            </label>
          )}
          <label>
            {t('Email address')}
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          {mode === 'register' && (
            <label>
              {t('Phone number')}
              <input name="phone" type="tel" autoComplete="tel" placeholder="+255 7XX XXX XXX" minLength={7} maxLength={20} required />
              <small>{t('The centre will call this number to confirm your contact before issuing a course payment control number. Shared family numbers are accepted.')}</small>
            </label>
          )}
          <label>
            {t('Password')}
            <PasswordInput
              name="password"
              placeholder={t('Enter a secure password')}
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </label>
          {mode === 'register' && (
            <label>
              {t('Confirm password')}
              <PasswordInput
                name="confirmPassword"
                placeholder={t('Confirm password')}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          )}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading
              ? t('Please wait...')
              : mode === 'login'
                ? <><LogIn size={18} aria-hidden="true" />{t('Login')}</>
                : <><UserPlus size={18} aria-hidden="true" />{t('Register')}</>}
          </button>
          {error && <p className="error-message" role="alert">{t(error)}</p>}
        </form>

        <p className="auth-helper">
          {mode === 'login' ? t("Don't have an account?") : t('Already have an account?')}{' '}
          <button
            type="button"
            className="auth-inline-link"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
          >
            {t(mode === 'login' ? 'Register' : 'Login')}
          </button>
        </p>
      </div>
    </dialog>
  )
}

function UserDashboard({ session }: { session: Session }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [courseInterests, setCourseInterests] = useState<Array<{
    id: string
    course: string
    courseSlug: string
    courseType: string
    status: string
    controlNumber: string | null
    paymentProofAvailable: boolean
    paymentProofUploadedAt: string | null
    paymentProofRejectionCount: number
    formFeeTransactionReference: string
    formFeeVerifiedAmount: number | null
    phoneVerifiedAt: string | null
    proofReviewedAt: string | null
    proofFeedback: string
    applicationSubmittedAt: string | null
    applicationFeedback: string
    fullName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    nationality: string
    address: string
    educationLevel: string
    emergencyContactName: string
    emergencyContactPhone: string
    confirmedStartDate: string | null
    createdAt: string
    courseChoiceEditableUntil: string
    updatedAt: string
  }>>([])
  const [bookings, setBookings] = useState<Array<{
    id: string
    course: string
    centre: string
    date: string
    note: string
    status: string
    confirmedStartDate: string | null
    adminFeedback: string | null
  }>>([])
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: string
    course: string
    createdAt: string
  }>>([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingInterestId, setSubmittingInterestId] = useState('')
  const [courseChoiceSelections, setCourseChoiceSelections] = useState<Record<string, string>>({})
  const [dashboardNow, setDashboardNow] = useState<number | null>(null)
  const { data: availableCourses, error: availableCoursesError } = useApiData<CourseCatalogItem>('/courses')

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setDashboardNow(Date.now()), 0)
    const updateInterval = window.setInterval(() => setDashboardNow(Date.now()), 10_000)
    return () => {
      window.clearTimeout(initialUpdate)
      window.clearInterval(updateInterval)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchJson<{ data: typeof bookings }>('/bookings'),
      fetchJson<{ data: typeof courseInterests }>('/course-interests'),
      fetchJson<{ unreadCount: number; data: typeof notifications }>('/notifications')
    ])
      .then(([bookingResponse, interestResponse, notificationResponse]) => {
        setBookings(bookingResponse.data)
        setCourseInterests(interestResponse.data)
        setNotifications(notificationResponse.data)
        setUnreadNotificationCount(notificationResponse.unreadCount)
        setError('')
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load your bookings.')
      })
      .finally(() => setLoading(false))
  }, [session.user.id])

  useEffect(() => {
    let active = true
    const refreshNotifications = () => {
      if (document.visibilityState !== 'visible') return
      void fetchJson<{ unreadCount: number; data: typeof notifications }>('/notifications')
        .then((response) => {
          if (!active) return
          setNotifications(response.data)
          setUnreadNotificationCount(response.unreadCount)
        })
        .catch((requestError: unknown) => {
          if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications.')
        })
    }
    const interval = window.setInterval(refreshNotifications, 30_000)
    window.addEventListener('focus', refreshNotifications)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshNotifications)
    }
  }, [session.user.id])

  const refreshDashboard = async () => {
      setLoading(true)
      try {
        const [bookingResponse, interestResponse, notificationResponse] = await Promise.all([
          fetchJson<{ data: typeof bookings }>('/bookings'),
          fetchJson<{ data: typeof courseInterests }>('/course-interests'),
          fetchJson<{ unreadCount: number; data: typeof notifications }>('/notifications')
        ])
        setBookings(bookingResponse.data)
        setCourseInterests(interestResponse.data)
        setNotifications(notificationResponse.data)
        setUnreadNotificationCount(notificationResponse.unreadCount)
        setError('')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to refresh your learner dashboard.')
      } finally {
        setLoading(false)
      }
  }

  const markNotificationsRead = async () => {
    try {
      await mutateJson('PATCH', '/notifications/read', {})
      setNotifications([])
      setUnreadNotificationCount(0)
      setNotificationsOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to mark notifications as read.')
    }
  }

  const handlePaymentProofUpload = async (event: React.FormEvent<HTMLFormElement>, interestId: string) => {
      event.preventDefault()
      const form = event.currentTarget
      const file = new FormData(form).get('paymentProof')
      if (!(file instanceof File) || !file.name) {
        setError(t('Choose a payment screenshot before uploading.'))
        return
      }
      setSubmittingInterestId(interestId)
      setError('')
      try {
        const formData = new FormData()
        formData.set('paymentProof', file)
        await mutateFormData('POST', `/course-interests/${interestId}/payment-proof`, formData)
        form.reset()
        await refreshDashboard()
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to upload your payment screenshot.')
      } finally {
        setSubmittingInterestId('')
      }
  }

  const handleApplicationSubmit = async (event: React.FormEvent<HTMLFormElement>, interestId: string) => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      setSubmittingInterestId(interestId)
      setError('')
      try {
        await postJson(`/course-interests/${interestId}/application`, {
          fullName: form.get('fullName'),
          dateOfBirth: form.get('dateOfBirth'),
          gender: form.get('gender'),
          nationality: form.get('nationality'),
          address: form.get('address'),
          educationLevel: form.get('educationLevel'),
          emergencyContactName: form.get('emergencyContactName'),
          emergencyContactPhone: form.get('emergencyContactPhone')
        })
        await refreshDashboard()
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to submit your course application.')
      } finally {
        setSubmittingInterestId('')
      }
  }

  const handleCourseChoiceUpdate = async (event: React.FormEvent<HTMLFormElement>, interestId: string) => {
    event.preventDefault()
    const courseSlug = String(new FormData(event.currentTarget).get('courseSlug') ?? '')
    if (!courseSlug) {
      setError(t('Choose a course before saving your choice.'))
      return
    }
    setSubmittingInterestId(interestId)
    setError('')
    setNotice('')
    try {
      await mutateJson('PATCH', `/course-interests/${interestId}/course`, { courseSlug })
      setNotice(t('Your course choice has been updated.'))
      await refreshDashboard()
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to update your course choice.'))
    } finally {
      setSubmittingInterestId('')
    }
  }

  return (
    <section className="content-page dashboard-page">
      <div className={`dashboard-shell user-dashboard-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="dashboard-main">
          <div className="dashboard-header-card" id="user-overview">
            <div>
              <span className="eyebrow">{t('Learning dashboard')}</span>
              <h2>{t('Your progress at a glance')}</h2>
            </div>
            <div className="dashboard-header-actions">
              <div className="learner-notifications">
                <button
                  type="button"
                  className="learner-notification-bell"
                  aria-label={`${t('Notifications')}${unreadNotificationCount ? `, ${unreadNotificationCount} ${t('unread')}` : ''}`}
                  aria-expanded={notificationsOpen}
                  aria-controls="learner-notification-panel"
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell size={20} aria-hidden="true" />
                  {unreadNotificationCount > 0 && (
                    <span className="learner-notification-count" aria-hidden="true">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="learner-notification-panel" id="learner-notification-panel" role="region" aria-label={t('Notifications')}>
                    <div className="learner-notification-panel-heading">
                      <strong>{t('Notifications')}</strong>
                      <button type="button" onClick={() => void markNotificationsRead()} disabled={unreadNotificationCount === 0}>
                        {t('Mark all as read')}
                      </button>
                    </div>
                    {notifications.length ? (
                      <ul>
                        {notifications.map((notification) => {
                          const messages: Record<string, string> = {
                            phone_verified: 'Your phone number was confirmed.',
                            contacted: 'The centre has contacted you about your request.',
                            issue_control_number: 'A payment control number was issued.',
                            verify_form_fee: 'Your application form fee was verified.',
                            reject_form_fee: 'Your payment screenshot needs attention.',
                            verify_course_fee: 'Your course fee was verified.',
                            request_application_changes: 'The centre requested changes to your application.',
                            decline_application: 'Your application was declined.',
                            send_start_date: 'Your course start date was confirmed.'
                          }
                          return (
                            <li key={notification.id}>
                              <a href="#user-course-requests" onClick={() => setNotificationsOpen(false)}>
                                <strong>{notification.course}</strong>
                                <span>{t(messages[notification.type] ?? 'Your course request has been updated.')}</span>
                                <time dateTime={notification.createdAt}>{formatLocaleDate(notification.createdAt, language)}</time>
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="learner-notification-empty">{t('You have no unread updates.')}</p>
                    )}
                  </div>
                )}
              </div>
              <Link to="/courses" className="primary-button">
                {t('Browse courses')} <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="secondary-button">
                {t('Explore courses')}
              </Link>
            </div>
          </div>

          <div className="dashboard-summary-grid">
            <div className="summary-card primary">
              <span>{t('Course requests')}</span>
              <strong>{courseInterests.length + bookings.length}</strong>
              <small>{t('Tracked requests')}</small>
            </div>
            <div className="summary-card success">
              <span>{t('Approved')}</span>
              <strong>{courseInterests.filter((interest) => interest.status === 'start_date_sent').length + bookings.filter((booking) => /approved|confirmed|accepted/i.test(booking.status)).length}</strong>
              <small>{t('Ready to start')}</small>
            </div>
            <div className="summary-card warning">
              <span>{t('Pending')}</span>
              <strong>{courseInterests.filter((interest) => !['start_date_sent', 'application_declined'].includes(interest.status)).length + bookings.filter((booking) => /pending|review/i.test(booking.status)).length}</strong>
              <small>{t('Awaiting review')}</small>
            </div>
            <div className="summary-card accent">
              <span>{t('Courses')}</span>
              <strong>{bookings.length > 0 ? '1+' : '0'}</strong>
              <small>{t('Current focus')}</small>
            </div>
          </div>

          {(error || availableCoursesError) && <p className="error-message">{t(error || availableCoursesError)}</p>}
          {notice && <p className="success-message" role="status">{t(notice)}</p>}
          <section className="admin-table-wrap dashboard-panel learner-course-requests" id="user-course-requests">
            <div className="section-header">
              <div>
                <h3>{t('Course application progress')}</h3>
                <p>{t('Follow each step here. New updates from the centre will appear when you refresh your dashboard.')}</p>
              </div>
              <button type="button" className="secondary-button compact-button" onClick={() => void refreshDashboard()} disabled={loading}>
                <RefreshCw size={15} aria-hidden="true" /> {t('Refresh data')}
              </button>
            </div>
            {loading && !courseInterests.length ? <p role="status">{t('Loading your course requests…')}</p> : null}
            {!loading && !courseInterests.length ? (
              <div className="learner-no-requests">
                <p>{t('You have not requested a place on a course yet.')}</p>
                <Link to="/courses" className="primary-button">{t('Browse courses')} <ArrowRight size={16} /></Link>
              </div>
            ) : null}
            <div className="learner-course-request-list">
              {courseInterests.map((interest) => {
                const editableUntil = Date.parse(interest.courseChoiceEditableUntil)
                const courseChoiceCanBeEdited = ['new', 'contacted'].includes(interest.status) &&
                  !interest.controlNumber &&
                  Number.isFinite(editableUntil) &&
                  dashboardNow !== null &&
                  dashboardNow < editableUntil
                const currentCourseSlug = interest.courseSlug ||
                  availableCourses.find((course) => course.name === interest.course)?.slug ||
                  ''
                const step = interest.status === 'new' ? 0
                  : ['control_number_issued', 'payment_rejected', 'payment_submitted'].includes(interest.status) ? 1
                    : interest.status === 'form_fee_verified' ? 2
                      : ['application_submitted', 'application_needs_changes'].includes(interest.status) ? 3
                        : 4
                const stepLabels = ['Request sent', 'Form fee', 'Form verified', 'Application review', 'Decision']
                const statusText: Record<string, string> = {
                  new: interest.phoneVerifiedAt
                    ? 'Phone number confirmed — waiting for the centre to issue your control number.'
                    : 'The centre will call to confirm your phone number before issuing a payment control number.',
                  control_number_issued: 'Control number issued — pay the TSh 5,000 form fee, then upload a screenshot.',
                  payment_rejected: 'Payment screenshot needs attention. Read the centre’s note and upload a new screenshot.',
                  payment_submitted: 'Payment screenshot received — waiting for staff verification.',
                  form_fee_verified: 'Form fee verified — complete the course application below.',
                  application_submitted: 'Application submitted — the centre is reviewing your details.',
                  application_needs_changes: 'The centre needs you to update your application. Read the note and resubmit it.',
                  application_declined: 'The centre has declined this application. Read the note below for details.',
                  superseded: 'This request was replaced by a newer course request.',
                  start_date_sent: 'You are approved to join this course. Review your confirmed start date below.',
                  contacted: 'The centre is following up on this request.',
                  course_fee_verified: 'Course fee verified — the centre will confirm your start date.',
                }
                return (
                  <article className="learner-course-request" key={interest.id}>
                    <div className="learner-course-request-heading">
                      <div><span className="eyebrow">{t(interest.courseType)}</span><h4>{interest.course}</h4></div>
                      <span className={`status-badge learner-status-${interest.status}`}>{t(interest.status.replaceAll('_', ' '))}</span>
                    </div>
                    {courseChoiceCanBeEdited ? (
                      <form className="learner-course-choice-form" onSubmit={(event) => void handleCourseChoiceUpdate(event, interest.id)}>
                        <p>{t('You may change your course choice within three days of your request. It locks earlier if the centre issues your payment control number.')}
                          <br /><strong>{t('Choice deadline')}:</strong> {new Date(editableUntil).toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-GB')}
                        </p>
                        <label>{t('Choose a course')}
                          <select name="courseSlug" value={courseChoiceSelections[interest.id] ?? currentCourseSlug}
                            onChange={(event) => setCourseChoiceSelections((choices) => ({ ...choices, [interest.id]: event.target.value }))} required>
                            <option value="" disabled>{t('Choose a course')}</option>
                            {availableCourses.map((course) => (
                              <option key={course.id ?? course.slug} value={course.slug}>{course.name}</option>
                            ))}
                          </select>
                        </label>
                        <button type="submit" className="secondary-button compact-button"
                          disabled={submittingInterestId === interest.id ||
                            !currentCourseSlug ||
                            (courseChoiceSelections[interest.id] ?? currentCourseSlug) === currentCourseSlug}>
                          {submittingInterestId === interest.id ? t('Please wait…') : t('Save course choice')}
                        </button>
                      </form>
                    ) : dashboardNow === null && ['new', 'contacted'].includes(interest.status) && !interest.controlNumber ? (
                      <p className="learner-course-choice-locked">{t('Checking your course-choice editing period…')}</p>
                    ) : !['superseded', 'application_declined'].includes(interest.status) && (
                      <p className="learner-course-choice-locked">{t(interest.controlNumber
                        ? 'Your course choice is locked because the centre has issued a payment control number.'
                        : dashboardNow !== null && dashboardNow >= editableUntil
                          ? 'Your three-day course choice editing period has ended.'
                          : 'Your course choice is locked because payment processing has started.')}</p>
                    )}
                    <ol className="learner-course-progress" aria-label={t('Application progress')}>
                      {stepLabels.map((label, index) => (
                        <li key={label} className={index < step ? 'is-complete' : index === step ? 'is-current' : ''}>
                          <span>{index < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
                          <small>{t(label)}</small>
                        </li>
                      ))}
                    </ol>
                    <p className="learner-course-status-message" role="status">{t(statusText[interest.status] ?? 'Your request is being processed.')}</p>
                    {interest.controlNumber && (
                      <div className="learner-control-number">
                        <strong>{t('Payment control number')}</strong><span>{interest.controlNumber}</span>
                        <small>{t('Pay TSh 5,000 using only the official payment instructions from VETA Kipawa.')}</small>
                      </div>
                    )}
                    {interest.proofFeedback && <p className="error-message learner-staff-feedback"><strong>{t('Centre note')}:</strong> {interest.proofFeedback}</p>}
                    {interest.status === 'payment_rejected' && (
                      <p className="error-message learner-staff-feedback" role="alert">
                        <strong>{t('Account warning')}:</strong>{' '}
                        {t('Your account has {count} rejected payment screenshots out of 3. A third rejected screenshot will block your account. Upload a valid payment screenshot.')
                          .replace('{count}', String(interest.paymentProofRejectionCount))}
                      </p>
                    )}
                    {interest.applicationFeedback && <p className={interest.status === 'application_declined' ? 'error-message learner-staff-feedback' : 'learner-staff-feedback'}>
                      <strong>{t('Centre note')}:</strong> {interest.applicationFeedback}
                    </p>}
                    {interest.status === 'start_date_sent' && interest.confirmedStartDate && (
                      <p className="learner-start-date"><Calendar size={17} aria-hidden="true" /><strong>{t('Confirmed course start date')}:</strong> {formatLocaleDate(interest.confirmedStartDate, language)}</p>
                    )}
                    {['control_number_issued', 'payment_rejected'].includes(interest.status) && (
                      <form className="application-form learner-proof-form" onSubmit={(event) => void handlePaymentProofUpload(event, interest.id)}>
                        <label>{t('Upload payment screenshot')}<input name="paymentProof" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
                        <small>{t('Upload a clear screenshot showing the payment result, exact TSh 5,000 amount, control number, and transaction reference. Staff will verify it against official payment records. JPEG, PNG, or WebP; maximum 5 MB.')}</small>
                        <button type="submit" className="primary-button" disabled={submittingInterestId === interest.id}>
                          <Upload size={16} aria-hidden="true" />{submittingInterestId === interest.id ? t('Please wait…') : interest.status === 'payment_rejected' ? t('Upload new screenshot') : t('Submit payment screenshot')}
                        </button>
                      </form>
                    )}
                    {['form_fee_verified', 'application_needs_changes'].includes(interest.status) && (
                      <form className="application-form learner-application-form" onSubmit={(event) => void handleApplicationSubmit(event, interest.id)}>
                        <h4>{t('Course joining application')}</h4>
                        <p>{t('Complete the required details so the centre can review your eligibility and contact you.')}</p>
                        <label>{t('Full name')}<input name="fullName" autoComplete="name" minLength={2} maxLength={160} defaultValue={interest.fullName} required /></label>
                        <label>{t('Email address')}<input type="email" value={interest.email} readOnly /></label>
                        <label>{t('Phone number')}<input type="tel" autoComplete="tel" value={interest.phone} readOnly /></label>
                        <label>{t('Date of birth')}<input name="dateOfBirth" type="date" max={COURSE_INTEREST_DATE_MAX} defaultValue={interest.dateOfBirth} required /></label>
                        <label>{t('Gender (optional)')}<select name="gender" defaultValue={interest.gender}><option value="">{t('Prefer not to say')}</option><option value="Female">{t('Female')}</option><option value="Male">{t('Male')}</option><option value="Other">{t('Other')}</option></select></label>
                        <label>{t('Nationality (optional)')}<input name="nationality" maxLength={100} defaultValue={interest.nationality} /></label>
                        <label>{t('Current location')}<input name="address" autoComplete="street-address" maxLength={500} defaultValue={interest.address} placeholder={t('District or area')} required /></label>
                        <label>{t('Highest education level')}<select name="educationLevel" defaultValue={interest.educationLevel} required>
                          <option value="" disabled>{t('Select your education level')}</option>
                          <option>{t('Primary education')}</option><option>{t('Secondary education')}</option><option>{t('Certificate')}</option>
                          <option>{t('Diploma')}</option><option>{t('Degree or higher')}</option><option>{t('Other')}</option>
                        </select></label>
                        <label>{t('Emergency contact name (optional)')}<input name="emergencyContactName" maxLength={160} defaultValue={interest.emergencyContactName} /></label>
                        <label>{t('Emergency contact phone (optional)')}<input name="emergencyContactPhone" type="tel" maxLength={40} defaultValue={interest.emergencyContactPhone} /></label>
                        <button type="submit" className="primary-button" disabled={submittingInterestId === interest.id}>
                          <Send size={16} aria-hidden="true" />{submittingInterestId === interest.id ? t('Please wait…') : t('Submit course application')}
                        </button>
                      </form>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
          <div className="admin-table-wrap dashboard-panel" id="user-bookings">
            <div className="section-header">
              <h3>{t('Other booking requests')}</h3>
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() => void refreshDashboard()}
              >
                {t('Refresh data')}
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{t('Course')}</th>
                  <th>{t('Centre')}</th>
                  <th>{t('Requested start date')}</th>
                  <th>{t('Confirmed start date')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Admin feedback')}</th>
                </tr>
              </thead>
              <tbody>
                {!loading && bookings.length > 0 ? (
                  bookings.map((booking, index) => (
                    <tr key={`${booking.id}-${index}`}>
                      <td>{booking.course}</td>
                      <td>{booking.centre}</td>
                      <td>{formatLocaleDate(booking.date, language)}</td>
                      <td>{booking.confirmedStartDate ? formatLocaleDate(booking.confirmedStartDate, language) : t('Not confirmed yet')}</td>
                      <td><span className="status-badge">{t(booking.status)}</span></td>
                      <td>{booking.adminFeedback || t('No feedback yet')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>{loading ? t('Loading bookings…') : t('You have not submitted any course bookings yet.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="dashboard-sidebar">
          <nav className="dashboard-menu" aria-label={t('Learner dashboard menu')}>
            <div className="admin-menu-heading">
              <span className="dashboard-menu-title">{t('Learning menu')}</span>
              <button
                type="button"
                className="admin-sidebar-toggle"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                title={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>
            <a className="dashboard-menu-link" href="#user-overview" title={t('Overview')} aria-label={t('Overview')}>
              <Home size={17} /> {t('Overview')}
            </a>
            <a className="dashboard-menu-link" href="#user-bookings" title={t('My bookings')} aria-label={t('My bookings')}>
              <Calendar size={17} /> {t('My bookings')}
            </a>
            <a className="dashboard-menu-link" href="#user-course-requests" title={t('Course application progress')} aria-label={t('Course application progress')}>
              <Calendar size={17} /> {t('Course application progress')}
            </a>
            <Link className="dashboard-menu-link" to="/courses" title={t('Explore courses')} aria-label={t('Explore courses')}>
              <Calendar size={17} /> {t('Book a course')}
            </Link>
            <Link className="dashboard-menu-link" to="/courses" title={t('Browse courses')} aria-label={t('Browse courses')}>
              <BookOpen size={17} /> {t('Browse courses')}
            </Link>
          </nav>

          <div className={`mini-panel dashboard-tip${sidebarCollapsed ? ' is-hidden' : ''}`}>
            <span className="eyebrow">{t('Next steps')}</span>
            <ul className="side-list">
              <li>{t('Review course requirements')}</li>
              <li>{t('Confirm course details and availability')}</li>
              <li>{t('Prepare supporting documents')}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

function AdminPage({ session }: { session: Session }) {
  const t = useTranslate()
  const permittedSections = managementSections.filter((item) => {
    if (session.user.role === 'admin') return true
    const permissions = session.user.permissions ?? []
    return item === 'Bookings'
      ? permissions.includes('bookings') || permissions.includes('shortCourseEnquiries')
      : permissions.includes(managementSectionPermissions[item])
  })
  const [selectedManagementSection, setSelectedManagementSection] = useState<ManagementSection>(
    permittedSections.includes('Courses') ? 'Courses' : permittedSections[0]
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <section className="content-page dashboard-page">
      <div className={`dashboard-shell admin-dashboard-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="dashboard-main">
          <div className="dashboard-header-card admin-header-card" id="admin-overview">
            <div>
              <span className="eyebrow">{t('Administration')}</span>
              <h2>{t('Manage news, courses and publications')}</h2>
            </div>
          </div>

          <AdminManagement
            session={session}
            section={selectedManagementSection}
          />
        </div>

        <aside className="dashboard-sidebar">
          <nav className="dashboard-menu" aria-label={t('Admin dashboard menu')}>
            <div className="admin-menu-heading">
              <span className="dashboard-menu-title">{t('Administration')}</span>
              <button
                type="button"
                className="admin-sidebar-toggle"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                title={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>
            {permittedSections.map((item) => {
              const Icon = managementSectionIcons[item]
              return (
                <button
                  key={item}
                  type="button"
                  className={`dashboard-menu-link admin-management-link${selectedManagementSection === item ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedManagementSection(item)
                    document.getElementById('admin-management')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  aria-current={selectedManagementSection === item ? 'page' : undefined}
                  title={t(item)}
                  aria-label={t(item)}
                  aria-pressed={selectedManagementSection === item}
                >
                  <Icon size={17} /> {t(item)}
                </button>
              )
            })}
          </nav>
        </aside>
      </div>
    </section>
  )
}

type AdminUserRecord = {
  id: string
  name: string
  email: string
  phone: string | null
  phoneVerifiedAt: string | null
  role: UserRole
  roleId: string | null
  permissions: string[]
  isActive: boolean
}

type AdminRoleRecord = {
  id: string
  name: string
  description: string
  permissions: string[]
}

type AdminCourseRecord = {
  id: string
  name: string
  nameSw: string
  level: string
  levelSw: string
  duration: string
  durationSw: string
  courseType: string
  category: string
  startDate: string | null
  endDate: string | null
  publishedFrom: string | null
  publishedUntil: string | null
  fee: number | null
  imageUrl: string | null
  media: CourseMediaItem[]
  description: string
  descriptionSw: string
}

type AdminNewsRecord = {
  id: string
  title: string
  titleSw: string
  summary: string
  summarySw: string
  body: string
  bodySw: string
  imageUrl: string | null
  videoUrl: string | null
  youtubeUrl: string | null
  published: boolean
}

type AdminPublicationRecord = {
  id: string
  title: string
  titleSw: string
  fileUrl: string
  courseId: string | null
}

type AdminOrganizationMember = OrganizationMember & {
  nameSw: string
  positionSw: string
  biographySw: string
  qualifications: string
  qualificationsSw: string
  responsibilities: string
  responsibilitiesSw: string
  managerId: string
  sortOrder: number
  isPublished: boolean
}

type AdminPartner = PartnerProfile & {
  nameSw: string
  descriptionSw: string
  websiteUrl: string
  sortOrder: number
  isPublished: boolean
}

type CourseInterestWorkflowStatus =
  | 'new'
  | 'contacted'
  | 'control_number_issued'
  | 'payment_submitted'
  | 'payment_rejected'
  | 'form_fee_verified'
  | 'course_fee_verified'
  | 'application_submitted'
  | 'application_needs_changes'
  | 'application_declined'
  | 'superseded'
  | 'start_date_sent'

type LeadFeedbackAction = 'request_application_changes' | 'decline_application'

type AdminManagementData = {
  users: AdminUserRecord[]
  roles: AdminRoleRecord[]
  courses: AdminCourseRecord[]
  courseCategories: string[]
  publicationCourses: Array<{ id: string; name: string; nameSw: string }>
  news: AdminNewsRecord[]
  publications: AdminPublicationRecord[]
  courseBookings: Array<{
    id: string
    userId: string | null
    fullName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    nationality: string
    address: string
    educationLevel: string
    emergencyContactName: string
    emergencyContactPhone: string
    course: string
    courseType: string
    campaignSource: string
    campaignMedium: string
    campaignName: string
    centrePreference: string
    message: string
    status: CourseInterestWorkflowStatus
    controlNumber: string
    paymentProofAvailable: boolean
    paymentProofUploadedAt: string | null
    paymentProofRejectionCount: number
    formFeeTransactionReference: string
    formFeeVerifiedAmount: number | null
    phoneVerifiedAt: string | null
    proofFeedback: string
    applicationSubmittedAt: string | null
    applicationFeedback: string
    contactedAt: string | null
    formFeePaidAt: string | null
    courseFeePaidAt: string | null
    confirmedStartDate: string | null
    createdAt: string
  }>
  bookings: Array<{
    id: string
    userName: string
    course: string
    centre: string
    date: string
    status: string
    confirmedStartDate: string | null
    adminFeedback: string | null
  }>
  organizationMembers: AdminOrganizationMember[]
  partners: AdminPartner[]
  settings: Record<string, string>
  settingsSw: Record<string, string>
}

const managementSections = [
  'Users',
  'Courses',
  'News',
  'Bookings',
  'Publications',
  'Team',
  'Partners',
  'Site settings'
] as const
type ManagementSection = typeof managementSections[number]
const managementSectionPermissions: Record<ManagementSection, string> = {
  Users: 'users',
  Courses: 'courses',
  News: 'news',
  Bookings: 'bookings',
  Publications: 'publications',
  Team: 'organizationStructure',
  Partners: 'partners',
  'Site settings': 'siteSettings'
}
const managementSectionIcons = {
  Users,
  Courses: BookOpen,
  News: Newspaper,
  Bookings: Calendar,
  Publications: Award,
  Team: Network,
  Partners: Building2,
  'Site settings': Settings
}

function downloadCourseBookingsCsv(
  leads: AdminManagementData['courseBookings'],
  course: string
) {
  const columns: Array<[string, (lead: AdminManagementData['courseBookings'][number]) => string]> = [
    ['Submitted', (lead) => lead.createdAt],
    ['Full name', (lead) => lead.fullName],
    ['Email', (lead) => lead.email],
    ['Phone', (lead) => lead.phone],
    ['Date of birth', (lead) => lead.dateOfBirth],
    ['Gender', (lead) => lead.gender],
    ['Nationality', (lead) => lead.nationality],
    ['Current location', (lead) => lead.address],
    ['Education level', (lead) => lead.educationLevel],
    ['Emergency contact name', (lead) => lead.emergencyContactName],
    ['Emergency contact phone', (lead) => lead.emergencyContactPhone],
    ['Interested course', (lead) => lead.course],
    ['Course type', (lead) => lead.courseType],
    ['Campaign source', (lead) => lead.campaignSource],
    ['Campaign medium', (lead) => lead.campaignMedium],
    ['Campaign name', (lead) => lead.campaignName],
    ['Preferred centre', (lead) => lead.centrePreference],
    ['Question or message', (lead) => lead.message],
    ['Follow-up status', (lead) => lead.status],
    ['Payment control number', (lead) => lead.controlNumber],
    ['Payment screenshot uploaded', (lead) => lead.paymentProofUploadedAt ?? ''],
    ['Form fee transaction reference', (lead) => lead.formFeeTransactionReference],
    ['Form fee verified amount (TSh)', (lead) => lead.formFeeVerifiedAmount?.toString() ?? ''],
    ['Payment review feedback', (lead) => lead.proofFeedback],
    ['Form fee verified', (lead) => lead.formFeePaidAt ?? ''],
    ['Application submitted', (lead) => lead.applicationSubmittedAt ?? ''],
    ['Application review feedback', (lead) => lead.applicationFeedback],
    ['Course fee verified', (lead) => lead.courseFeePaidAt ?? ''],
    ['Confirmed start date', (lead) => lead.confirmedStartDate ?? '']
  ]
  const csvCell = (value: string) => {
    const safeValue = /^\s*[=+\-@]/.test(value) ? `'${value}` : value
    return `"${safeValue.replace(/"/g, '""')}"`
  }
  const rows = [
    columns.map(([label]) => csvCell(label)).join(','),
    ...leads.map((lead) => columns.map(([, value]) => csvCell(value(lead))).join(','))
  ]
  const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const filenamePart = course ? course.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'all-courses'
  link.href = url
  link.download = `course-bookings-${filenamePart}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function AdminManagement({
  session,
  section
}: {
  session: Session
  section: ManagementSection
}) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [data, setData] = useState<AdminManagementData | null>(null)
  const [courseRowsRevision, setCourseRowsRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [leadCourseFilter, setLeadCourseFilter] = useState('')
  const [leadStartDates, setLeadStartDates] = useState<Record<string, string>>({})
  const [leadControlNumbers, setLeadControlNumbers] = useState<Record<string, string>>({})
  const [leadPaymentReferences, setLeadPaymentReferences] = useState<Record<string, string>>({})
  const [leadPaymentAmounts, setLeadPaymentAmounts] = useState<Record<string, string>>({})
  const [proofRejectionBookingId, setProofRejectionBookingId] = useState('')
  const [proofRejectionFeedback, setProofRejectionFeedback] = useState('')
  const [feedbackDialog, setFeedbackDialog] = useState<{ bookingId: string; action: LeadFeedbackAction } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [confirmationDialog, setConfirmationDialog] = useState<{
    message: string
    confirmLabel: string
    onConfirm: () => Promise<void>
  } | null>(null)
  const confirmationDialogRef = useRef<HTMLDialogElement>(null)
  const feedbackDialogRef = useRef<HTMLDialogElement>(null)
  const [newCourseType, setNewCourseType] = useState<'Long Course' | 'Short Course'>('Short Course')
  const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'Short Course' | 'Long Course'>('all')
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)
  const courseDialogRef = useRef<HTMLDialogElement>(null)

  const fetchManagementData = useCallback((signal?: AbortSignal) => {
    return fetchJson<AdminManagementData>('/admin/data', signal)
  }, [])

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await fetchManagementData(signal)
      setData(result)
      setCourseRowsRevision((revision) => revision + 1)
      setError('')
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load management data.')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [fetchManagementData])

  useEffect(() => {
    const controller = new AbortController()
    fetchManagementData(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setData(result)
          setError('')
        }
      })
      .catch(requestError => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load management data.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [fetchManagementData, session.user.id])

  useEffect(() => {
    if (section !== 'Bookings') return
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadData()
    }
    const refreshInterval = window.setInterval(refreshWhenVisible, 30_000)

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadData, section])

  useEffect(() => {
    const dialog = confirmationDialogRef.current
    if (!dialog) return
    if (confirmationDialog && !dialog.open) dialog.showModal()
    else if (!confirmationDialog && dialog.open) dialog.close()
  }, [confirmationDialog])

  useEffect(() => {
    const dialog = courseDialogRef.current
    if (!dialog) return
    if (isCourseDialogOpen && !dialog.open) dialog.showModal()
    else if (!isCourseDialogOpen && dialog.open) dialog.close()
  }, [isCourseDialogOpen])

  useEffect(() => {
    const dialog = feedbackDialogRef.current
    if (!dialog) return
    if (feedbackDialog && !dialog.open) dialog.showModal()
    else if (!feedbackDialog && dialog.open) dialog.close()
  }, [feedbackDialog])

  const saveForm = async (
    event: React.FormEvent<HTMLFormElement>,
    method: 'POST' | 'PATCH' | 'PUT',
    endpoint: string,
    transform?: (form: FormData) => Record<string, unknown>,
    multipart = false
  ) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const formData = new FormData(formElement)
      if (multipart) {
        for (const field of ['image', 'video', 'coverImage', 'courseMedia', 'profileImage', 'partnerLogo', 'publicationPdf', 'adImage']) {
          const file = formData.get(field)
          if (file instanceof File && !file.name) formData.delete(field)
        }
        if (transform) {
          for (const [key, value] of Object.entries(transform(formData))) {
            if (value instanceof File) continue
            formData.set(key, Array.isArray(value) ? JSON.stringify(value) : value == null ? '' : String(value))
          }
        }
        await mutateFormData(method, endpoint, formData)
      } else if (method === 'POST') {
        const payload = transform?.(formData) ?? Object.fromEntries(formData.entries()) as Record<string, unknown>
        await postJson(endpoint, payload)
      } else {
        const payload = transform?.(formData) ?? Object.fromEntries(formData.entries()) as Record<string, unknown>
        await mutateJson(method, endpoint, payload)
      }
      if (endpoint.startsWith('/admin/site-settings/')) {
        window.dispatchEvent(new Event(SITE_SETTINGS_CHANGED_EVENT))
      }
      setNotice(endpoint === '/admin/news'
        ? 'News article added successfully.'
        : endpoint.startsWith('/admin/news/')
          ? 'News article updated successfully.'
          : 'Changes saved.')
      formElement.reset()
      if (endpoint === '/admin/courses') {
        setNewCourseType('Short Course')
        setIsCourseDialogOpen(false)
      }
      await loadData()
    } catch (requestError) {
      setNotice('')
      setError(requestError instanceof Error ? requestError.message : 'Unable to save changes.')
      setLoading(false)
    }
  }

  const deleteRecord = (endpoint: string) => {
    setConfirmationDialog({
      message: 'Delete this record? This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setLoading(true)
        try {
          await mutateJson('DELETE', endpoint)
          if (endpoint.startsWith('/admin/site-settings/')) {
            window.dispatchEvent(new Event(SITE_SETTINGS_CHANGED_EVENT))
          }
          setNotice('Record deleted.')
          setError('')
          await loadData()
        } catch (requestError) {
          setNotice('')
          setError(requestError instanceof Error ? requestError.message : 'Unable to delete this record.')
          setLoading(false)
        }
      }
    })
  }

  const applyCourseBookingProgress = async (
    bookingId: string,
    action: string,
    payload: Record<string, string | number> = {}
  ): Promise<boolean> => {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await mutateJson<{ accountBlocked?: boolean }>('PATCH', `/admin/bookings/requests/${bookingId}`, {
        action,
        ...payload
      })
      const updateNotice = response.accountBlocked
        ? 'The learner account has been blocked after three rejected payment screenshots.'
        : action === 'verify_phone'
          ? 'Phone number confirmed. You can now issue the payment control number.'
          : 'The course request progress was updated. The learner can see the latest status in their dashboard.'
      setNotice(t(updateNotice))
      await loadData()
      return true
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to update this booking.'
      setError(message)
      if (feedbackDialog) setFeedbackError(message)
      setLoading(false)
      return false
    }
  }

  const progressCourseBooking = async (
    bookingId: string,
    action: string,
    payload: Record<string, string | number> = {}
  ): Promise<boolean> => {
    const confirmationMessage: Record<string, string> = {
      verify_phone: 'Confirm that you called the learner and verified this phone number belongs to them.',
      verify_form_fee: 'Confirm that the official payment record shows this control number paid in full for exactly TSh 5,000. The screenshot alone is not proof of payment.',
      verify_course_fee: 'Confirm that you have verified receipt of the course fee through the official centre process.',
      send_start_date: 'Confirm that the learner is approved and you are notifying them of this course start date.'
    }
    const message = confirmationMessage[action]
    if (message) {
      setConfirmationDialog({
        message,
        confirmLabel: 'Confirm',
        onConfirm: async () => {
          await applyCourseBookingProgress(bookingId, action, payload)
        }
      })
      return false
    }
    return applyCourseBookingProgress(bookingId, action, payload)
  }

  const askForLeadFeedback = (bookingId: string, action: LeadFeedbackAction) => {
    setFeedbackText('')
    setFeedbackError('')
    setFeedbackDialog({ bookingId, action })
  }

  const submitLeadFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!feedbackDialog) return
    const feedback = feedbackText.trim()
    if (feedback.length < 10 || feedback.length > 2000) {
      setFeedbackError(t('Enter a clear reason using 10 to 2,000 characters.'))
      return
    }
    const updated = await progressCourseBooking(feedbackDialog.bookingId, feedbackDialog.action, { feedback })
    if (updated) {
      setFeedbackDialog(null)
      setFeedbackText('')
      setFeedbackError('')
    }
  }

  const submitProofRejection = async (event: React.FormEvent<HTMLFormElement>, bookingId: string) => {
    event.preventDefault()
    const feedback = proofRejectionFeedback.trim()
    if (feedback.length < 10 || feedback.length > 2000) {
      setError(t('Enter a clear reason using 10 to 2,000 characters.'))
      return
    }
    const updated = await progressCourseBooking(bookingId, 'reject_form_fee', { feedback })
    if (updated) {
      setProofRejectionBookingId('')
      setProofRejectionFeedback('')
    }
  }

  const viewPaymentProof = async (bookingId: string) => {
    const proofWindow = window.open('about:blank', '_blank')
    if (!proofWindow) {
      setError('Allow pop-ups to open the payment screenshot.')
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/course-interests/${bookingId}/payment-proof`, {
        credentials: 'include',
        cache: 'no-store'
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? 'Unable to load payment screenshot.')
      }
      const objectUrl = URL.createObjectURL(await response.blob())
      proofWindow.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (requestError) {
      proofWindow.close()
      setError(requestError instanceof Error ? requestError.message : 'Unable to load payment screenshot.')
    }
  }

  const rowSaveForm = (
    id: string,
    endpoint: string,
    transform?: (form: FormData) => Record<string, unknown>,
    multipart = false,
    method: 'PATCH' | 'PUT' = 'PATCH'
  ) => (
    <form
      id={`save-${id}`}
      className="admin-row-save-form"
      onSubmit={(event) => void saveForm(event, method, endpoint, transform, multipart)}
    />
  )

  if (loading && !data) return <p>{t('Loading management data…')}</p>
  if (!data) return <p className="error-message">{error || t('Management data is unavailable.')}</p>

  const courseTypeFilters = [
    { value: 'all', label: 'All courses', count: data.courses.length },
    { value: 'Short Course', label: 'Short courses', count: data.courses.filter((course) => course.courseType === 'Short Course').length },
    { value: 'Long Course', label: 'Long courses', count: data.courses.filter((course) => course.courseType !== 'Short Course').length }
  ] as const
  const visibleAdminCourses = data.courses.filter((course) =>
    courseTypeFilter === 'all' || course.courseType === courseTypeFilter
  )

  const editableSettings = Object.entries(data.settings).filter(([key]) =>
    key !== 'home.advertisement' &&
    key !== SHORT_COURSE_TICKER_SETTING_KEY &&
    key !== 'home.statsStaff' &&
    key !== 'home.statsStudents' &&
    !['home.statsUndergraduate', 'home.statsPostgraduate', 'home.statsEmployees', 'home.statsProgrammes'].includes(key)
  )
  const organizationFields = (member?: AdminOrganizationMember) => (
    <>
      <div className="organization-admin-field-grid">
        <label>{t('Full name')}<input name="name" defaultValue={member?.name ?? ''} maxLength={120} required /></label>
        <label>{t('Full name (Kiswahili)')}<input name="nameSw" defaultValue={member?.nameSw ?? ''} maxLength={120} /></label>
        <label>{t('Position')}<input name="position" defaultValue={member?.position ?? ''} maxLength={160} required /></label>
        <label>{t('Position (Kiswahili)')}<input name="positionSw" defaultValue={member?.positionSw ?? ''} maxLength={160} /></label>
        <label>{t('Reports to')}
          <select name="managerId" defaultValue={member?.managerId ?? ''}>
            <option value="">{t('Top level')}</option>
            {data.organizationMembers.filter((option) => option.id !== member?.id).map((option) => (
              <option key={option.id} value={option.id}>{option.name} — {option.position}</option>
            ))}
          </select>
        </label>
        <label>{t('Display order')}<input name="sortOrder" type="number" min="0" max="10000" defaultValue={member?.sortOrder ?? 0} required /></label>
        <label>{t('Publication status')}
          <select name="isPublished" defaultValue={String(member?.isPublished ?? true)}>
            <option value="true">{t('Published')}</option>
            <option value="false">{t('Draft')}</option>
          </select>
        </label>
      </div>
      <div className="organization-admin-field-grid organization-admin-long-fields">
        <label>{t('Biography')}<textarea name="biography" rows={4} maxLength={10000} defaultValue={member?.biography ?? ''} /></label>
        <label>{t('Biography (Kiswahili)')}<textarea name="biographySw" rows={4} maxLength={10000} defaultValue={member?.biographySw ?? ''} /></label>
        <label>{t('Qualifications')}<textarea name="qualifications" rows={3} maxLength={5000} defaultValue={member?.qualifications ?? ''} /></label>
        <label>{t('Qualifications (Kiswahili)')}<textarea name="qualificationsSw" rows={3} maxLength={5000} defaultValue={member?.qualificationsSw ?? ''} /></label>
        <label>{t('Responsibilities')}<textarea name="responsibilities" rows={3} maxLength={5000} defaultValue={member?.responsibilities ?? ''} /></label>
        <label>{t('Responsibilities (Kiswahili)')}<textarea name="responsibilitiesSw" rows={3} maxLength={5000} defaultValue={member?.responsibilitiesSw ?? ''} /></label>
      </div>
      <div className="organization-admin-image-field">
        {member?.imageUrl && <img src={getMediaUrl(member.imageUrl)} alt="" loading="lazy" decoding="async" />}
        <label>{t('Profile photo (JPEG, PNG or WebP, up to 10 MB)')}
          <input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        {member?.imageUrl && <label className="organization-admin-clear-image">
          <input name="clearImage" type="checkbox" value="true" />
          {t('Remove current photo')}
        </label>}
      </div>
    </>
  )
  const partnerFields = (partner?: AdminPartner) => (
    <>
      <div className="organization-admin-field-grid">
        <label>{t('Partner name')}<input name="name" defaultValue={partner?.name ?? ''} maxLength={160} required /></label>
        <label>{t('Partner name (Kiswahili)')}<input name="nameSw" defaultValue={partner?.nameSw ?? ''} maxLength={160} /></label>
        <label>{t('Website URL (optional)')}<input name="websiteUrl" type="url" defaultValue={partner?.websiteUrl ?? ''} maxLength={500} placeholder="https://" /></label>
        <label>{t('Display order')}<input name="sortOrder" type="number" min="0" max="10000" defaultValue={partner?.sortOrder ?? 0} required /></label>
        <label>{t('Publication status')}
          <select name="isPublished" defaultValue={String(partner?.isPublished ?? false)}>
            <option value="false">{t('Draft')}</option>
            <option value="true">{t('Published')}</option>
          </select>
        </label>
      </div>
      <div className="organization-admin-field-grid organization-admin-long-fields">
        <label>{t('Partner description')}<textarea name="description" rows={3} maxLength={2000} defaultValue={partner?.description ?? ''} /></label>
        <label>{t('Partner description (Kiswahili)')}<textarea name="descriptionSw" rows={3} maxLength={2000} defaultValue={partner?.descriptionSw ?? ''} /></label>
      </div>
      <div className="organization-admin-image-field partner-admin-logo-field">
        {partner?.logoUrl && <img src={getMediaUrl(partner.logoUrl)} alt="" loading="lazy" decoding="async" />}
        <label>{t('Partner logo (JPEG, PNG or WebP, up to 5 MB)')}
          <input name="partnerLogo" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        {partner?.logoUrl && <label className="organization-admin-clear-image">
          <input name="clearLogo" type="checkbox" value="true" />
          {t('Remove current logo')}
        </label>}
      </div>
    </>
  )

  return (
    <section className="section-block admin-management-section" id="admin-management">
      <div className="section-header">
        <div>
          <span className="eyebrow">{t('Database management')}</span>
          <h2>{t('Manage site data')}</h2>
        </div>
        <button type="button" className="secondary-button action-icon-button" onClick={() => { setLoading(true); void loadData() }}
          aria-label={t('Refresh data')} title={t('Refresh data')}>
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>
      {error && <p className="error-message" role="alert">{t(error)}</p>}
      {notice && <p className="success-message" role="status">{t(notice)}</p>}
      {(['Courses', 'News', 'Publications', 'Team', 'Partners', 'Site settings'] as ManagementSection[]).includes(section) && (
        <p className="management-translation-help">
          {t('Fill in the optional Kiswahili fields to show translated content. If left blank, the English text is used.')}
        </p>
      )}

      {section === 'Users' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/users')}>
            <h3>{t('Create user')}</h3>
            <label>{t('Name')}<input name="name" required /></label>
            <label>{t('Email')}<input name="email" type="email" required /></label>
            <label>{t('Phone')}<input name="phone" type="tel" placeholder="+255 7XX XXX XXX" minLength={7} maxLength={20} required /></label>
            <small>{t('Phone numbers can be shared by family members.')}</small>
            <label>{t('Temporary password')}<PasswordInput name="password" minLength={8} required autoComplete="new-password" /></label>
            <label>{t('Role')}<select name="roleId" defaultValue={data.roles.find((role) => role.name.toLowerCase() === 'applicant')?.id ?? ''} required>
              {data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select></label>
            <button className="primary-button action-icon-button" type="submit"
              aria-label={t('Create user')} title={t('Create user')}><Plus size={18} aria-hidden="true" /></button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Users')} ({data.users.length})</h3><table>
            <thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Phone')}</th><th>{t('Role')}</th><th>{t('Active')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.users.map((user, index) => {
              const formId = `save-user-${user.id}-${index}`
              return <tr key={`${user.id}-${user.roleId}-${user.isActive}-${user.name}-${user.email}-${index}`}>
                <td><input aria-label={t('Name')} name="name" form={formId} defaultValue={user.name} /></td>
                <td><input aria-label={t('Email')} name="email" type="email" form={formId} defaultValue={user.email} /></td>
                <td><input aria-label={t('Phone')} name="phone" form={formId} defaultValue={user.phone ?? ''} />
                  <small>{user.phoneVerifiedAt ? `${t('Phone verified')}: ${formatLocaleDate(user.phoneVerifiedAt, language)}` : t('Phone not confirmed')}</small>
                </td>
                <td><select aria-label={t('Role')} name="roleId" form={formId} defaultValue={user.roleId ?? data.roles.find((role) => role.name.toLowerCase() === 'applicant')?.id ?? ''}>
                  {data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select></td>
                <td><select aria-label={t('Active status')} name="isActive" form={formId} defaultValue={String(user.isActive)}><option value="true">{t('Active')}</option><option value="false">{t('Inactive')}</option></select></td>
                <td>{rowSaveForm(`user-${user.id}-${index}`, `/admin/users/${user.id}`, (form) => ({
                  name: form.get('name'),
                  email: form.get('email'),
                  phone: form.get('phone'),
                  roleId: form.get('roleId'),
                  isActive: form.get('isActive') === 'true'
                }))}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/users/${user.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button>
                </td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'Courses' && (
        <>
          <p className="management-translation-help">
            {t('The admin list includes all courses, even when they are not currently public. Public short courses appear only between their publish dates. Set both dates when adding or updating a short course. Add the actual training start date and time and an optional end date. The NEW badge is shown only while the short course is within its publication dates.')}
          </p>
          <div className="course-management-toolbar">
            <h3>{t('Courses')} ({visibleAdminCourses.length})</h3>
            <div className="course-filters" role="group" aria-label={t('Filter courses')}>
              {courseTypeFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`course-filter-button${courseTypeFilter === filter.value ? ' is-active' : ''}`}
                  aria-pressed={courseTypeFilter === filter.value}
                  onClick={() => setCourseTypeFilter(filter.value)}
                >
                  {t(filter.label)} <span>{filter.count}</span>
                </button>
              ))}
            </div>
            <button type="button" className="primary-button" onClick={() => {
              setNewCourseType('Short Course')
              setIsCourseDialogOpen(true)
            }}>
              <Plus size={18} aria-hidden="true" />{t('Add upcoming short course')}
            </button>
          </div>
          <dialog
            ref={courseDialogRef}
            className="course-admin-dialog"
            aria-labelledby="course-admin-dialog-title"
            onCancel={() => setIsCourseDialogOpen(false)}
            onClose={() => setIsCourseDialogOpen(false)}
          >
            <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/courses', (form) => ({
              name: form.get('name'), nameSw: form.get('nameSw'),
              level: form.get('level'), levelSw: form.get('levelSw'),
              duration: form.get('duration'), durationSw: form.get('durationSw'),
              description: form.get('description'), descriptionSw: form.get('descriptionSw'),
              courseType: form.get('courseType'),
              category: form.get('category'),
              startDate: form.get('startDate') || null,
              endDate: form.get('endDate') || null,
              publishedFrom: form.get('publishedFrom') || null,
              publishedUntil: form.get('publishedUntil') || null,
              fee: form.get('fee') ? Number(form.get('fee')) : null,
              imageUrl: form.get('imageUrl') || null,
            }), true)}>
              <div className="course-admin-dialog-heading">
                <div>
                  <span className="eyebrow">{t('Course announcements')}</span>
                  <h2 id="course-admin-dialog-title">{newCourseType === 'Short Course' ? t('Add upcoming short course') : t('Add course')}</h2>
                  <p>{t('Enter the course details, training start date and public listing dates. The course appears on the website only during its publication dates.')}</p>
                </div>
                <button type="button" className="secondary-button action-icon-button" onClick={() => setIsCourseDialogOpen(false)}
                  aria-label={t('Close')} title={t('Close')}><X size={18} aria-hidden="true" /></button>
              </div>
              <label>{t('Course type')}<select name="courseType" value={newCourseType} onChange={(event) => setNewCourseType(event.target.value === 'Short Course' ? 'Short Course' : 'Long Course')}><option value="Long Course">{t('Long Course')}</option><option value="Short Course">{t('Short Course')}</option></select></label>
              <label>{t('Name')}<input name="name" required /></label><label>{t('Name (Kiswahili)')}<input name="nameSw" /></label>
              <label>{t('Level')}<input name="level" required /></label><label>{t('Level (Kiswahili)')}<input name="levelSw" /></label>
              <label>{t('Duration')}<input name="duration" required /></label><label>{t('Duration (Kiswahili)')}<input name="durationSw" /></label>
              <label>{t('Description')}<textarea name="description" rows={2} /></label><label>{t('Description (Kiswahili)')}<textarea name="descriptionSw" rows={2} /></label>
              <label>{t('Category')}<select name="category" defaultValue="OTHER">{data.courseCategories.map((category) => <option key={category} value={category}>{t(category)}</option>)}</select></label>
              <label>{t('Start date and time')}<input name="startDate" type="datetime-local" required={newCourseType === 'Short Course'} /></label>
              <label>{t('End date (optional)')}<input name="endDate" type="date" /></label>
              <label>{t('Publish from')}<input name="publishedFrom" type="date" required={newCourseType === 'Short Course'} /></label>
              <label>{t('Publish until')}<input name="publishedUntil" type="date" required={newCourseType === 'Short Course'} /></label>
              <label>{t('Fee (TSh)')}<input name="fee" type="number" min="0" step="1" /></label>
              <label>{t('Course cover image URL')}<input name="imageUrl" type="url" /></label>
              <label>{t('Upload course cover image')}<input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
              <label>{t('Upload course gallery images or videos')}<input name="courseMedia" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple /></label>
              <p className="course-media-upload-help">{t('Select up to 10 files at once. Images must be 5 MB or smaller; MP4 and WebM videos must be 50 MB or smaller.')}</p>
              <p className="course-interest-location"><MapPin size={16} />{t('Training takes place at VETA Kipawa ICT Centre.')}</p>
              <div className="course-admin-dialog-actions">
                <button className="primary-button" type="submit" disabled={loading}>
                  <Plus size={18} aria-hidden="true" />{newCourseType === 'Short Course' ? t('Save upcoming short course') : t('Add course')}
                </button>
                <button className="secondary-button" type="button" onClick={() => setIsCourseDialogOpen(false)}>{t('Cancel')}</button>
              </div>
            </form>
          </dialog>
          <div className="admin-table-wrap"><table>
            <thead><tr><th>{t('Name')}</th><th>{t('Level')}</th><th>{t('Type')}</th><th>{t('Category')}</th><th>{t('Duration')}</th><th>{t('Start / end date')}</th><th>{t('Public listing')}</th><th>{t('Fee (TSh)')}</th><th>{t('Cover image')}</th><th>{t('Course gallery')}</th><th>{t('Description')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{visibleAdminCourses.map((course) => {
              const formId = `save-course-${course.id}`
              return <tr key={`${course.id}-${courseRowsRevision}`}>
                <td><input aria-label={t('Course name')} name="name" form={formId} defaultValue={course.name} required />
                  <input aria-label={t('Name (Kiswahili)')} name="nameSw" form={formId} defaultValue={course.nameSw} placeholder={t('Kiswahili translation')} /></td>
                <td><input aria-label={t('Level')} name="level" form={formId} defaultValue={course.level} required />
                  <input aria-label={t('Level (Kiswahili)')} name="levelSw" form={formId} defaultValue={course.levelSw} placeholder={t('Kiswahili translation')} /></td>
                <td><select aria-label={t('Course type')} name="courseType" form={formId} defaultValue={course.courseType ?? 'Long Course'}>
                  <option value="Long Course">{t('Long Course')}</option><option value="Short Course">{t('Short Course')}</option>
                </select></td>
                <td><select aria-label={t('Category')} name="category" form={formId} defaultValue={course.category}>{data.courseCategories.map((category) => <option key={category} value={category}>{t(category)}</option>)}</select></td>
                <td><input aria-label={t('Duration')} name="duration" form={formId} defaultValue={course.duration} required />
                  <input aria-label={t('Duration (Kiswahili)')} name="durationSw" form={formId} defaultValue={course.durationSw} placeholder={t('Kiswahili translation')} /></td>
                <td><label>{t('Start date and time')}<input aria-label={t('Start date and time')} name="startDate" type="datetime-local" form={formId} defaultValue={formatTanzaniaDateTimeInput(course.startDate ?? null)} required={course.courseType === 'Short Course'} /></label>
                  <label>{t('End date (optional)')}<input aria-label={t('End date (optional)')} name="endDate" type="date" form={formId} defaultValue={course.endDate?.slice(0, 10) ?? ''} /></label></td>
                <td><label>{t('Publish from')}<input aria-label={t('Publish from')} name="publishedFrom" type="date" form={formId} defaultValue={course.publishedFrom?.slice(0, 10) ?? ''} required={course.courseType === 'Short Course'} /></label>
                  <label>{t('Publish until')}<input aria-label={t('Publish until')} name="publishedUntil" type="date" form={formId} defaultValue={course.publishedUntil?.slice(0, 10) ?? ''} required={course.courseType === 'Short Course'} /></label></td>
                <td><input aria-label={t('Fee')} name="fee" type="number" min="0" step="1" form={formId} defaultValue={course.fee ?? ''} /></td>
                <td className="course-cover-cell">
                  {course.imageUrl && <img className="admin-course-cover-preview" src={getMediaUrl(course.imageUrl)} alt="" />}
                  <input aria-label={t('Course cover image URL')} name="imageUrl" type="url" form={formId} defaultValue={course.imageUrl?.startsWith('/uploads/courses/') ? '' : course.imageUrl ?? ''} />
                  <input aria-label={`${t('Upload course cover image for')} ${course.name}`} name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" form={formId} />
                  {course.imageUrl && <label className="remove-news-image"><input name="removeCoverImage" form={formId} type="checkbox" value="true" /> {t('Remove cover image')}</label>}
                </td>
                <td className="course-media-admin-cell">
                  <div className="course-media-admin-list">
                    {course.media.map((media) => (
                      <div className="course-media-admin-item" key={media.id}>
                        {media.type === 'video'
                          ? <span className="course-media-admin-video"><Play size={16} aria-hidden="true" />{t('Video')}</span>
                          : <img src={getMediaUrl(media.url)} alt="" loading="lazy" decoding="async" />}
                        <button
                          type="button"
                          className="secondary-button compact-button"
                          disabled={loading}
                          onClick={() => void deleteRecord(`/admin/courses/${course.id}/media/${media.id}`)}
                        >
                          {t('Remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                  <label>
                    {t('Add course photos or videos')}
                    <input aria-label={`${t('Add course photos or videos')} ${course.name}`} name="courseMedia" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple form={formId} />
                  </label>
                  <small>{t('Select up to 10 files at once. Images must be 5 MB or smaller; MP4 and WebM videos must be 50 MB or smaller.')}</small>
                </td>
                <td><textarea aria-label={t('Description')} name="description" form={formId} defaultValue={course.description} rows={2} />
                  <textarea aria-label={t('Description (Kiswahili)')} name="descriptionSw" form={formId} defaultValue={course.descriptionSw} rows={2} placeholder={t('Kiswahili translation')} /></td>
                <td>{rowSaveForm(`course-${course.id}`, `/admin/courses/${course.id}`, (form) => {
                  const coverFile = form.get('coverImage')
                  const clearCover = form.get('removeCoverImage') === 'true'
                  return {
                    name: form.get('name'), nameSw: form.get('nameSw'),
                    level: form.get('level'), levelSw: form.get('levelSw'),
                    duration: form.get('duration'), durationSw: form.get('durationSw'),
                    description: form.get('description'), descriptionSw: form.get('descriptionSw'),
                    courseType: form.get('courseType'),
                    category: form.get('category'),
                    startDate: form.get('startDate') || null,
                    endDate: form.get('endDate') || null,
                    publishedFrom: form.get('publishedFrom') || null,
                    publishedUntil: form.get('publishedUntil') || null,
                    fee: form.get('fee') ? Number(form.get('fee')) : null,
                    imageUrl: clearCover || (coverFile instanceof File && coverFile.name)
                      ? null
                      : form.get('imageUrl') || (course.imageUrl?.startsWith('/uploads/courses/') ? '' : course.imageUrl ?? ''),
                    removeCoverImage: clearCover
                  }
                }, true)}
                  <div className="admin-row-actions">
                    <button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>
                    <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/courses/${course.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'News' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/news', undefined, true)}>
            <h3>{t('Publish news article')}</h3>
            <label>{t('Title')}<input name="title" required /></label><label>{t('Title (Kiswahili)')}<input name="titleSw" /></label>
            <label>{t('Summary')}<textarea name="summary" rows={2} /></label><label>{t('Summary (Kiswahili)')}<textarea name="summarySw" rows={2} /></label>
            <label>{t('Article body')}<textarea name="body" rows={4} required /></label><label>{t('Article body (Kiswahili)')}<textarea name="bodySw" rows={4} /></label>
            <label>{t('News image (up to 5 MB)')}<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label>{t('Upload news video (MP4 or WebM; up to 50 MB)')}<input name="video" type="file" accept="video/mp4,video/webm" /></label>
            <label>{t('YouTube video link')}<input name="youtubeUrl" type="url" placeholder={t('YouTube URL')} /></label>
            <label>{t('Visibility')}<select name="published" defaultValue="true"><option value="true">{t('Published')}</option><option value="false">{t('Draft')}</option></select></label>
            <button className="primary-button action-icon-button" type="submit"
              aria-label={t('Add article')} title={t('Add article')}><Plus size={18} aria-hidden="true" /></button>
          </form>
          <div className="admin-table-wrap"><h3>{t('News articles')} ({data.news.length})</h3><table>
            <thead><tr><th>{t('Title')}</th><th>{t('Summary')}</th><th>{t('Body')}</th><th>{t('Media')}</th><th>{t('Visibility')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.news.map((article, index) => {
              const formId = `save-news-${article.id}-${index}`
              return <tr key={`${article.id}-${index}`}>
                <td><input aria-label={t('Title')} name="title" form={formId} defaultValue={article.title} required />
                  <input aria-label={t('Title (Kiswahili)')} name="titleSw" form={formId} defaultValue={article.titleSw} placeholder={t('Kiswahili translation')} /></td>
                <td><textarea aria-label={t('Summary')} name="summary" form={formId} defaultValue={article.summary} rows={2} />
                  <textarea aria-label={t('Summary (Kiswahili)')} name="summarySw" form={formId} defaultValue={article.summarySw} rows={2} placeholder={t('Kiswahili translation')} /></td>
                <td><textarea aria-label={t('Article body')} name="body" form={formId} defaultValue={article.body} rows={2} required />
                  <textarea aria-label={t('Article body (Kiswahili)')} name="bodySw" form={formId} defaultValue={article.bodySw} rows={2} placeholder={t('Kiswahili translation')} /></td>
                <td>
                  {article.imageUrl && <img className="admin-news-thumbnail" src={getMediaUrl(article.imageUrl)} alt="" />}
                  <input aria-label={`${t('Replace image for')} ${article.title}`} name="image" form={formId} type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                  {article.imageUrl && <label className="remove-news-image"><input name="removeImage" form={formId} type="checkbox" value="true" /> {t('Remove image')}</label>}
                  {article.videoUrl && <video className="admin-news-thumbnail" src={getMediaUrl(article.videoUrl)} controls preload="metadata" />}
                  <input aria-label={`${t('Upload video for')} ${article.title}`} name="video" form={formId} type="file" accept="video/mp4,video/webm" />
                  {article.videoUrl && <label className="remove-news-image"><input name="removeVideo" form={formId} type="checkbox" value="true" /> {t('Remove video')}</label>}
                  <input aria-label={`${t('YouTube video link for')} ${article.title}`} name="youtubeUrl" form={formId} type="url" defaultValue={article.youtubeUrl ?? ''} placeholder={t('YouTube URL')} />
                </td>
                <td><select aria-label={t('Visibility')} name="published" form={formId} defaultValue={String(article.published)}><option value="true">{t('Published')}</option><option value="false">{t('Draft')}</option></select></td>
                <td>{rowSaveForm(`news-${article.id}-${index}`, `/admin/news/${article.id}`, undefined, true)}
                  <div className="admin-row-actions">
                    <button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>
                    <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/news/${article.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'Bookings' && (() => {
        const courseOptions = [...new Set(data.courseBookings.map((lead) => lead.course))].sort()
        const visibleLeads = data.courseBookings.filter((lead) => !leadCourseFilter || lead.course === leadCourseFilter)
        const messageCount = visibleLeads.filter((lead) => lead.message.trim()).length
        const newRequestCount = visibleLeads.filter((lead) => lead.status === 'new').length
        const paymentReviewCount = visibleLeads.filter((lead) => lead.status === 'payment_submitted').length
        const applicationReviewCount = visibleLeads.filter((lead) => lead.status === 'application_submitted').length
        const feedbackLead = feedbackDialog
          ? data.courseBookings.find((lead) => lead.id === feedbackDialog.bookingId)
          : undefined
        const feedbackTitle = feedbackDialog?.action === 'request_application_changes'
          ? 'Changes required from learner'
          : 'Reason for declining application'
        return (
          <>
          <div className="admin-table-wrap course-leads-table">
            <div className="section-header">
              <div>
                <h3>{t('Course registration requests')} ({visibleLeads.length})</h3>
                <p>{t('Learners who submitted course booking requests. Follow up to confirm details and availability.')}</p>
              </div>
              <div className="course-leads-actions">
                <label>{t('Filter by course')}
                  <select value={leadCourseFilter} onChange={(event) => setLeadCourseFilter(event.target.value)}>
                    <option value="">{t('All courses')}</option>
                    {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
                  </select>
                </label>
                <button type="button" className="secondary-button action-icon-button" disabled={!visibleLeads.length}
                  aria-label={t('Export Excel CSV')} title={t('Export Excel CSV')}
                  onClick={() => downloadCourseBookingsCsv(visibleLeads, leadCourseFilter)}>
                  <Download size={18} aria-hidden="true" />
                </button>
                <button type="button" className="secondary-button action-icon-button" disabled={loading}
                  aria-label={t('Refresh applications')} title={t('Refresh applications')}
                  onClick={() => { setLoading(true); void loadData() }}>
                  <RefreshCw size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="course-leads-alerts" aria-label={t('Applicant workflow summary')}>
              <div className="course-leads-alert warning">
                <span>{t('New requests')}</span>
                <strong>{newRequestCount}</strong>
              </div>
              <div className="course-leads-alert primary">
                <span>{t('Payments to verify')}</span>
                <strong>{paymentReviewCount}</strong>
              </div>
              <div className="course-leads-alert accent">
                <span>{t('Applications to review')}</span>
                <strong>{applicationReviewCount}</strong>
              </div>
              <div className="course-leads-alert success">
                <span>{t('Applicants with a message')}</span>
                <strong>{messageCount}</strong>
              </div>
            </div>
            <div className="admin-leads-privacy-note">{t('Call each learner to confirm their registered phone number and mark it verified before issuing a control number. Check each payment in the official payment system: confirm the control number, exact TSh 5,000 amount, and transaction reference. A screenshot alone is not proof. Record the reference once; duplicate references are blocked.')}</div>
            <table>
              <thead><tr><th>{t('Received')}</th><th>{t('Full name')}</th><th>{t('Contact')}</th><th>{t('Course')}</th><th>{t('Applicant details')}</th><th>{t('Applicant message')}</th><th>{t('Progress')}</th><th>{t('Form fee (TSh 5,000)')}</th><th>{t('Course fee')}</th><th>{t('Confirmed start date')}</th><th>{t('Next step')}</th><th>{t('Actions')}</th></tr></thead>
              <tbody>{visibleLeads.map((lead, index) => (
                <tr key={`${lead.id}-${index}`}>
                  <td>{formatLocaleDate(lead.createdAt, language)}</td>
                  <td>{lead.fullName}</td>
                  <td><a href={`mailto:${lead.email}`}>{lead.email}</a><br /><a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>
                    {lead.userId && <small>{lead.phoneVerifiedAt
                      ? `${t('Phone verified')}: ${formatLocaleDate(lead.phoneVerifiedAt, language)}`
                      : t('Phone not confirmed')}</small>}
                  </td>
                  <td>{lead.course}<small>{t(lead.courseType)}</small>{lead.centrePreference && <small>{lead.centrePreference}</small>}</td>
                  <td>{lead.educationLevel || t('Not provided')}<small>{lead.address}</small><small>{[lead.dateOfBirth, lead.gender, lead.nationality, lead.emergencyContactName, lead.emergencyContactPhone].filter(Boolean).join(' · ')}</small>
                    {lead.userId && lead.paymentProofRejectionCount > 0 && <small>{t('Rejected payment screenshots')}: {lead.paymentProofRejectionCount}/3</small>}
                    {lead.userId && lead.status === 'payment_submitted' && lead.paymentProofRejectionCount === 2 && <small>{t('Rejecting this screenshot will block the learner account.')}</small>}
                    {lead.applicationSubmittedAt && <small>{t('Application submitted')}: {formatLocaleDate(lead.applicationSubmittedAt, language)}</small>}
                  </td>
                  <td>{lead.message.trim()
                    ? <div className="course-lead-message"><strong>{t('Applicant message')}</strong><p>{lead.message}</p></div>
                    : <span className="course-lead-no-message">{t('No message provided')}</span>}
                  </td>
                  <td><span className={`status-badge admin-stage-badge admin-stage-${lead.status.replaceAll('_', '-')}`}>{t(lead.status === 'new' ? 'New booking'
                    : lead.status === 'contacted' ? 'Contacted'
                      : lead.status === 'control_number_issued' ? 'Control number issued'
                        : lead.status === 'payment_submitted' ? 'Payment screenshot submitted'
                          : lead.status === 'payment_rejected' ? 'Payment screenshot needs attention'
                            : lead.status === 'form_fee_verified' ? 'Form fee verified'
                              : lead.status === 'application_submitted' ? 'Application submitted'
                                : lead.status === 'application_needs_changes' ? 'Application needs changes'
                                  : lead.status === 'application_declined' ? 'Application declined'
                                    : lead.status === 'course_fee_verified' ? 'Course fee verified'
                                      : 'Start date sent')}</span>
                    {['new', 'payment_submitted', 'application_submitted', 'course_fee_verified'].includes(lead.status) &&
                      <small className="course-lead-action-needed">{t('Action required')}</small>}
                    {lead.contactedAt && <small>{t('Contacted')}: {formatLocaleDate(lead.contactedAt, language)}</small>}
                    {lead.proofFeedback && <small>{t('Payment review')}: {lead.proofFeedback}</small>}
                    {lead.applicationFeedback && <small>{t('Application review')}: {lead.applicationFeedback}</small>}
                  </td>
                  <td>{lead.formFeePaidAt ? `${t('Verified')} · ${formatLocaleDate(lead.formFeePaidAt, language)}` : t('Not verified')}
                    {lead.controlNumber && <small>{t('Control number')}: {lead.controlNumber}</small>}
                      {lead.formFeeTransactionReference && <small>{t('Transaction reference')}: {lead.formFeeTransactionReference}</small>}
                      {lead.formFeeVerifiedAmount !== null && <small>{t('Verified amount (TSh)')}: {lead.formFeeVerifiedAmount.toLocaleString()}</small>}
                      {lead.paymentProofUploadedAt && <small>{t('Screenshot received')}: {formatLocaleDate(lead.paymentProofUploadedAt, language)}</small>}
                  </td>
                  <td>{lead.courseFeePaidAt ? `${t('Verified')} · ${formatLocaleDate(lead.courseFeePaidAt, language)}` : t('Not verified')}</td>
                  <td>{lead.confirmedStartDate ? formatLocaleDate(lead.confirmedStartDate, language) : t('Not set')}</td>
                  <td>
                    {lead.status === 'new' && lead.userId && !lead.phoneVerifiedAt && lead.phone && (
                      <button type="button" className="secondary-button compact-button" disabled={loading}
                        onClick={() => void progressCourseBooking(lead.id, 'verify_phone')}>
                        {t('Confirm phone number')}
                      </button>
                    )}
                    {lead.status === 'new' && lead.userId && !lead.phone && <small>{t('Add a phone number to the learner account before confirming it.')}</small>}
                    {lead.status === 'new' && lead.userId && lead.phoneVerifiedAt && <>
                      <input aria-label={t('Payment control number')} value={leadControlNumbers[lead.id] ?? ''}
                        onChange={(event) => setLeadControlNumbers((numbers) => ({ ...numbers, [lead.id]: event.target.value }))}
                        placeholder={t('Payment control number')} />
                      <button type="button" className="secondary-button compact-button" disabled={loading || !leadControlNumbers[lead.id]?.trim()}
                        onClick={() => void progressCourseBooking(lead.id, 'issue_control_number', { controlNumber: leadControlNumbers[lead.id].trim() })}>
                        {t('Issue control number')}
                      </button>
                    </>}
                    {lead.status === 'new' && !lead.userId && <button type="button" className="secondary-button action-icon-button" disabled={loading}
                      onClick={() => void progressCourseBooking(lead.id, 'contacted')}
                      aria-label={t('Mark contacted')} title={t('Mark contacted')}><UserRoundCheck size={18} aria-hidden="true" /></button>}
                    {lead.status === 'payment_submitted' && <>
                      <button type="button" className="secondary-button compact-button" disabled={loading}
                        onClick={() => void viewPaymentProof(lead.id)}>{t('View payment screenshot')}</button>
                      <label>
                        {t('Official transaction reference')}
                        <input
                          type="text"
                          value={leadPaymentReferences[lead.id] ?? ''}
                          onChange={(event) => setLeadPaymentReferences((references) => ({ ...references, [lead.id]: event.target.value }))}
                          minLength={3}
                          maxLength={120}
                          autoComplete="off"
                          placeholder={t('Enter the reference from the payment system')}
                          required
                        />
                      </label>
                      <label>
                        {t('Verified amount (TSh)')}
                        <input
                          type="number"
                          value={leadPaymentAmounts[lead.id] ?? ''}
                          onChange={(event) => setLeadPaymentAmounts((amounts) => ({ ...amounts, [lead.id]: event.target.value }))}
                          min={5000}
                          max={5000}
                          step={1}
                          inputMode="numeric"
                          required
                        />
                      </label>
                      <small>{t('Confirm these details against the official payment system. The screenshot is not verified automatically.')}</small>
                      <button type="button" className="secondary-button compact-button"
                        disabled={loading ||
                          (leadPaymentReferences[lead.id] ?? '').trim().length < 3 ||
                          Number(leadPaymentAmounts[lead.id]) !== 5000}
                        onClick={() => void progressCourseBooking(lead.id, 'verify_form_fee', {
                          paymentTransactionReference: leadPaymentReferences[lead.id]?.trim() ?? '',
                          verifiedAmount: Number(leadPaymentAmounts[lead.id])
                        })}>{t('Verify TSh 5,000 form fee')}</button>
                      <button type="button" className="secondary-button compact-button" disabled={loading}
                        onClick={() => {
                          setError('')
                          setProofRejectionBookingId((currentId) => currentId === lead.id ? '' : lead.id)
                          setProofRejectionFeedback('')
                        }}>{t('Reject screenshot')}</button>
                      {proofRejectionBookingId === lead.id && (
                        <form className="proof-rejection-form" onSubmit={(event) => void submitProofRejection(event, lead.id)}>
                          <label htmlFor={`proof-rejection-feedback-${lead.id}`}>{t('Reason for rejecting payment screenshot')}</label>
                          <p>{t('Explain what is wrong with this screenshot so the learner knows what to correct.')}</p>
                          <textarea
                            id={`proof-rejection-feedback-${lead.id}`}
                            value={proofRejectionFeedback}
                            onChange={(event) => {
                              setProofRejectionFeedback(event.target.value)
                              setError('')
                            }}
                            minLength={10}
                            maxLength={2000}
                            rows={4}
                            placeholder={t('Type the reason for rejecting the screenshot here…')}
                            required
                            autoFocus
                          />
                          <small>{proofRejectionFeedback.trim().length}/2,000 {t('characters')}</small>
                          <div className="proof-rejection-actions">
                            <button type="button" className="secondary-button compact-button" disabled={loading}
                              onClick={() => {
                                setProofRejectionBookingId('')
                                setProofRejectionFeedback('')
                              }}>{t('Cancel')}</button>
                            <button type="submit" className="primary-button compact-button"
                              disabled={loading || proofRejectionFeedback.trim().length < 10}>
                              {loading ? t('Please wait…') : t('Confirm screenshot rejection')}
                            </button>
                          </div>
                        </form>
                      )}
                    </>}
                    {lead.status === 'contacted' && <button type="button" className="secondary-button action-icon-button" disabled={loading}
                      onClick={() => void progressCourseBooking(lead.id, 'verify_form_fee')}
                      aria-label={t('Verify TSh 5,000 form fee')} title={t('Verify TSh 5,000 form fee')}><Check size={18} aria-hidden="true" /></button>}
                    {lead.status === 'payment_rejected' && <span>{t('Learner may upload a corrected screenshot')}</span>}
                    {lead.status === 'form_fee_verified' && <button type="button" className="secondary-button action-icon-button" disabled={loading}
                      onClick={() => void progressCourseBooking(lead.id, 'verify_course_fee')}
                      aria-label={t('Verify course fee')} title={t('Verify course fee')}><Check size={18} aria-hidden="true" /></button>}
                    {lead.status === 'application_submitted' && <>
                      <input aria-label={t('Confirmed start date')} name={`confirmedStartDate-${lead.id}`} type="date" min={COURSE_INTEREST_DATE_MAX}
                        value={leadStartDates[lead.id] ?? ''} onChange={(event) => setLeadStartDates((dates) => ({ ...dates, [lead.id]: event.target.value }))} />
                      <button type="button" className="secondary-button compact-button" disabled={loading || !leadStartDates[lead.id]}
                        onClick={() => void progressCourseBooking(lead.id, 'send_start_date', { confirmedStartDate: leadStartDates[lead.id] })}>
                        {t('Approve and send start date')}
                      </button>
                      <button type="button" className="secondary-button compact-button" disabled={loading}
                        onClick={() => askForLeadFeedback(lead.id, 'request_application_changes')}>{t('Request changes')}</button>
                      <button type="button" className="secondary-button compact-button" disabled={loading}
                        onClick={() => askForLeadFeedback(lead.id, 'decline_application')}>{t('Decline application')}</button>
                    </>}
                    {lead.status === 'application_needs_changes' && <span>{t('Waiting for learner to update application')}</span>}
                    {lead.status === 'application_declined' && <span>{t('Application declined')}</span>}
                    {lead.status === 'course_fee_verified' && <>
                      <input aria-label={t('Confirmed start date')} name={`confirmedStartDate-${lead.id}`} type="date" min={COURSE_INTEREST_DATE_MAX}
                        value={leadStartDates[lead.id] ?? ''} onChange={(event) => setLeadStartDates((dates) => ({ ...dates, [lead.id]: event.target.value }))} />
                      <button type="button" className="secondary-button action-icon-button" disabled={loading || !leadStartDates[lead.id]}
                        onClick={() => void progressCourseBooking(lead.id, 'send_start_date', { confirmedStartDate: leadStartDates[lead.id] })}
                        aria-label={t('Mark start date sent')} title={t('Mark start date sent')}><Calendar size={18} aria-hidden="true" /></button>
                    </>}
                    {lead.status === 'start_date_sent' && <span>{t('Learner notified of start date')}</span>}
                  </td>
                  <td><button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button"
                    onClick={() => void deleteRecord(`/admin/bookings/requests/${lead.id}`)} aria-label={t('Delete')} title={t('Delete')}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button></td>
                </tr>
              ))}</tbody>
            </table>
            {!visibleLeads.length && <p>{t('No course booking requests match this filter yet.')}</p>}
          </div>
          <dialog
            ref={feedbackDialogRef}
            className="admin-feedback-dialog"
            aria-labelledby="lead-feedback-title"
            aria-describedby="lead-feedback-help"
            onCancel={() => setFeedbackDialog(null)}
            onClose={() => {
              setFeedbackDialog(null)
              setFeedbackText('')
              setFeedbackError('')
            }}
          >
            {feedbackDialog && (
              <form className="admin-feedback-form" onSubmit={(event) => void submitLeadFeedback(event)}>
                <div className="admin-feedback-heading">
                  <div>
                    <span className="eyebrow">{t('Course application review')}</span>
                    <h2 id="lead-feedback-title">{t(feedbackTitle)}</h2>
                  </div>
                  <button type="button" className="secondary-button action-icon-button"
                    onClick={() => setFeedbackDialog(null)} aria-label={t('Close')} title={t('Close')}>
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                {feedbackLead && (
                  <p className="admin-feedback-applicant">
                    <strong>{feedbackLead.fullName}</strong> · {feedbackLead.course}
                  </p>
                )}
                <p id="lead-feedback-help">{t('Write a clear, respectful reason or list the exact changes the learner needs to make. This message will be visible in their dashboard.')}</p>
                <label htmlFor="lead-feedback-text">{t(feedbackDialog.action === 'request_application_changes' ? 'Reason or requested changes' : 'Reason for declining application')}</label>
                <textarea
                  id="lead-feedback-text"
                  value={feedbackText}
                  onChange={(event) => {
                    setFeedbackText(event.target.value)
                    setFeedbackError('')
                  }}
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  required
                  autoFocus
                />
                <small className="admin-feedback-count">{feedbackText.trim().length}/2,000 {t('characters')}</small>
                {feedbackError && <p className="error-message" role="alert">{t(feedbackError)}</p>}
                <div className="admin-feedback-actions">
                  <button type="button" className="secondary-button" disabled={loading}
                    onClick={() => setFeedbackDialog(null)}>{t('Cancel')}</button>
                  <button type="submit" className="primary-button" disabled={loading || feedbackText.trim().length < 10}>
                    {loading ? t('Please wait…') : feedbackDialog.action === 'request_application_changes'
                      ? t('Send requested changes')
                      : t('Confirm application decline')}
                  </button>
                </div>
              </form>
            )}
          </dialog>
          </>
        )
      })()}

      {section === 'Publications' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/publications', undefined, true)}>
            <h3>{t('Add publication')}</h3><label>{t('Title')}<input name="title" required /></label>
            <label>{t('Title (Kiswahili)')}<input name="titleSw" /></label>
            <label>{t('Related course')}
              <select name="courseId" defaultValue="">
                <option value="">{t('No related course')}</option>
                {data.publicationCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.nameSw || course.name}</option>
                ))}
              </select>
            </label>
            <label>{t('PDF file')}<input name="publicationPdf" type="file" accept="application/pdf,.pdf" /></label>
            <label>{t('Or PDF URL')}<input name="fileUrl" type="url" /></label>
            <button className="primary-button action-icon-button" type="submit"
              aria-label={t('Add publication')} title={t('Add publication')}><Plus size={18} aria-hidden="true" /></button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Publications')} ({data.publications.length})</h3><table>
            <thead><tr><th>{t('Title')}</th><th>{t('PDF file')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.publications.map((publication, index) => {
              const formId = `save-publication-${publication.id}-${index}`
              return <tr key={`${publication.id}-${index}`}>
                <td><input aria-label={t('Publication title')} name="title" form={formId} defaultValue={publication.title} required />
                  <input aria-label={t('Title (Kiswahili)')} name="titleSw" form={formId} defaultValue={publication.titleSw} placeholder={t('Kiswahili translation')} />
                  <select aria-label={t('Related course')} name="courseId" form={formId} defaultValue={publication.courseId ?? ''}>
                    <option value="">{t('No related course')}</option>
                    {data.publicationCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.nameSw || course.name}</option>
                    ))}
                  </select>
                </td>
                <td><a href={getMediaUrl(publication.fileUrl)} target="_blank" rel="noreferrer">{t('Open current PDF')}</a>
                  <input aria-label={t('Replace PDF file URL')} name="fileUrl" type="url" form={formId} defaultValue={publication.fileUrl.startsWith('/uploads/publications/') ? '' : publication.fileUrl} placeholder={t('Optional external PDF URL')} />
                  <input aria-label={`${t('Upload replacement PDF for')} ${publication.title}`} name="publicationPdf" type="file" accept="application/pdf,.pdf" form={formId} /></td>
                <td>{rowSaveForm(`publication-${publication.id}-${index}`, `/admin/publications/${publication.id}`, undefined, true)}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/publications/${publication.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'Team' && (
        <div className="organization-admin">
          <div className="organization-admin-intro">
            <Network size={22} aria-hidden="true" />
            <p>{t('Add each person once, then choose the person they report to. This relationship builds the public team structure from top to bottom. Draft profiles stay hidden until published. Starter role templates are unpublished; replace each placeholder name and review reporting lines before publishing.')}</p>
          </div>
          <form
            className="application-form organization-admin-form"
            onSubmit={(event) => void saveForm(event, 'POST', '/admin/organization-structure', undefined, true)}
          >
            <h3>{t('Add team member')}</h3>
            {organizationFields()}
            <button className="primary-button" type="submit"><Plus size={17} aria-hidden="true" />{t('Add profile')}</button>
          </form>
          <div className="organization-admin-records">
            <h3>{t('Team profiles')} ({data.organizationMembers.length})</h3>
            {data.organizationMembers.length === 0 ? (
              <p>{t('No team profiles have been added yet.')}</p>
            ) : data.organizationMembers.map((member) => (
              <article className="organization-admin-record" key={member.id}>
                <form
                  className="application-form organization-admin-form"
                  onSubmit={(event) => void saveForm(
                    event,
                    'PATCH',
                    `/admin/organization-structure/${member.id}`,
                    undefined,
                    true
                  )}
                >
                  <div className="organization-admin-record-heading">
                    <div>
                      <h4>{member.name}</h4>
                      <p>{member.position}{member.managerId
                        ? ` · ${t('Reports to')}: ${data.organizationMembers.find((candidate) => candidate.id === member.managerId)?.name ?? t('Unknown')}`
                        : ` · ${t('Top level')}`}</p>
                    </div>
                    <span className={`organization-admin-status${member.isPublished ? ' is-published' : ''}`}>
                      {t(member.isPublished ? 'Published' : 'Draft')}
                    </span>
                  </div>
                  {organizationFields(member)}
                  <div className="organization-admin-actions">
                    <button className="primary-button" type="submit"><Save size={16} aria-hidden="true" />{t('Save profile')}</button>
                    <button
                      className="secondary-button organization-admin-delete"
                      type="button"
                      onClick={() => void deleteRecord(`/admin/organization-structure/${member.id}`)}
                    >
                      <Trash2 size={16} aria-hidden="true" />{t('Delete profile')}
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </div>
      )}

      {section === 'Partners' && (
        <div className="organization-admin">
          <div className="organization-admin-intro">
            <Building2 size={22} aria-hidden="true" />
            <p>{t('Add approved partner profiles, upload their logos, and publish them when they are ready to appear on the About page.')}</p>
          </div>
          <form
            className="application-form organization-admin-form"
            onSubmit={(event) => void saveForm(event, 'POST', '/admin/partners', undefined, true)}
          >
            <h3>{t('Add partner profile')}</h3>
            {partnerFields()}
            <button className="primary-button" type="submit"><Plus size={17} aria-hidden="true" />{t('Add partner')}</button>
          </form>
          <div className="organization-admin-records">
            <h3>{t('Partner profiles')} ({data.partners.length})</h3>
            {data.partners.length === 0 ? (
              <p>{t('No partner profiles have been added yet.')}</p>
            ) : data.partners.map((partner) => (
              <article className="organization-admin-record" key={`${partner.id}-${partner.name}-${partner.description}-${partner.logoUrl}-${partner.isPublished}-${partner.sortOrder}`}>
                <form
                  className="application-form organization-admin-form"
                  onSubmit={(event) => void saveForm(
                    event,
                    'PATCH',
                    `/admin/partners/${partner.id}`,
                    undefined,
                    true
                  )}
                >
                  <div className="organization-admin-record-heading">
                    <div>
                      <h4>{partner.name}</h4>
                      <p>{partner.websiteUrl || t('No website added')}</p>
                    </div>
                    <span className={`organization-admin-status${partner.isPublished ? ' is-published' : ''}`}>
                      {t(partner.isPublished ? 'Published' : 'Draft')}
                    </span>
                  </div>
                  {partnerFields(partner)}
                  <div className="organization-admin-actions">
                    <button className="primary-button" type="submit"><Save size={16} aria-hidden="true" />{t('Save partner')}</button>
                    <button
                      className="secondary-button organization-admin-delete"
                      type="button"
                      onClick={() => void deleteRecord(`/admin/partners/${partner.id}`)}
                    >
                      <Trash2 size={16} aria-hidden="true" />{t('Delete partner')}
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </div>
      )}

      {section === 'Site settings' && (
        <>
          <form
            key={`${data.settings[SHORT_COURSE_TICKER_SETTING_KEY] ?? ''}-${data.settingsSw[SHORT_COURSE_TICKER_SETTING_KEY] ?? ''}`}
            className="application-form management-create-form"
            onSubmit={(event) => void saveForm(event, 'PUT', `/admin/site-settings/${encodeURIComponent(SHORT_COURSE_TICKER_SETTING_KEY)}`, (form) => ({
              value: form.get('value') || DEFAULT_SHORT_COURSE_TICKER,
              valueSw: form.get('valueSw')
            }))}
          >
            <h3>{t('Short-course announcement ticker')}</h3>
            <p>{t('Use {startDate} in the message to insert the earliest upcoming short-course start date automatically. Course dates and the NEW badge are managed in Courses.')}</p>
            <label>{t('Ticker message')}<textarea name="value" rows={3} defaultValue={data.settings[SHORT_COURSE_TICKER_SETTING_KEY] || DEFAULT_SHORT_COURSE_TICKER} required /></label>
            <label>{t('Ticker message (Kiswahili)')}<textarea name="valueSw" rows={3} defaultValue={data.settingsSw[SHORT_COURSE_TICKER_SETTING_KEY] ?? ''} /></label>
            <button className="primary-button action-icon-button" type="submit"
              aria-label={t('Save ticker message')} title={t('Save ticker message')}><Save size={18} aria-hidden="true" /></button>
          </form>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'PUT', `/admin/site-settings/${encodeURIComponent(String(new FormData(event.currentTarget).get('key') ?? ''))}`, (form) => ({ value: form.get('value'), valueSw: form.get('valueSw') }))}>
            <h3>{t('Add or update a site setting')}</h3><label>{t('Key')}<input name="key" required /></label>
            <label>{t('Value')}<textarea name="value" rows={3} required /></label>
            <label>{t('Value (Kiswahili)')}<textarea name="valueSw" rows={3} /></label>
            <button className="primary-button action-icon-button" type="submit"
              aria-label={t('Save setting')} title={t('Save setting')}><Save size={18} aria-hidden="true" /></button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Site settings')} ({editableSettings.length})</h3><table>
            <thead><tr><th>{t('Key')}</th><th>{t('Value')}</th><th>{t('Value (Kiswahili)')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{editableSettings.map(([key, value], index) => {
              const formId = `save-setting-${index}`
              return <tr key={key}><td>{key}</td><td><textarea aria-label={`${t('Value')} ${key}`} name="value" form={formId} defaultValue={value} rows={2} /></td>
                <td><textarea aria-label={`${t('Value (Kiswahili)')} ${key}`} name="valueSw" form={formId} defaultValue={data.settingsSw[key] ?? ''} rows={2} placeholder={t('Kiswahili translation')} /></td>
                <td>{rowSaveForm(`setting-${index}`, `/admin/site-settings/${encodeURIComponent(key)}`, (form) => ({ value: form.get('value'), valueSw: form.get('valueSw') }), false, 'PUT')}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/site-settings/${encodeURIComponent(key)}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>
            })}</tbody>
          </table></div>
        </>
      )}
      <dialog
        ref={confirmationDialogRef}
        className="admin-confirm-dialog"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-message"
        onCancel={() => setConfirmationDialog(null)}
        onClose={() => setConfirmationDialog(null)}
      >
        {confirmationDialog && (
          <div className="admin-confirm-content">
            <h2 id="admin-confirm-title">{t('Please confirm')}</h2>
            <p id="admin-confirm-message">{t(confirmationDialog.message)}</p>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                autoFocus
                onClick={() => setConfirmationDialog(null)}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={loading}
                onClick={() => {
                  const pendingConfirmation = confirmationDialog
                  setConfirmationDialog(null)
                  void pendingConfirmation.onConfirm()
                }}
              >
                {t(confirmationDialog.confirmLabel)}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}

function NotFoundPage() {
  const t = useTranslate()
  return (
    <section className="content-page error-page">
      <span className="eyebrow">404</span>
      <h1>{t('Page not found')}</h1>
      <p>{t('The page you requested could not be located.')}</p>
      <Link to="/" className="primary-button">
        {t('Return home')}
      </Link>
    </section>
  )
}

export default App
