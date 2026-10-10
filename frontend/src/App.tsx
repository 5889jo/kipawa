import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  Home,
  Info,
  MessageCircle,
  Languages,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquareQuote,
  Monitor,
  Phone,
  Save,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LanguageProvider } from './LanguageProvider'
import { useLanguage, useTranslate, type Language } from './language'
import './App.css'

type UserRole = 'user' | 'admin'

type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type Session = {
  token: string
  user: AppUser
}

type CourseCatalogItem = {
  id?: string
  name: string
  level: string
  duration: string
  courseType?: string
  startDate?: string | null
  fee?: number | null
  imageUrl?: string | null
  centre?: string
  summary?: string
}

type TrainingCentreItem = {
  id: string
  name: string
  district: string
  region: string
  type: string
  focus: string
}

type NewsItem = {
  id: string
  slug: string
  title: string
  date: string
  category: string
  summary: string
  body?: string
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
  fileUrl: string
  createdAt: string
}

type ReviewItem = {
  id: string
  userName: string
  course: string
  rating: number
  comment: string
}

type OverviewItem = {
  label: string
  value: string
  note: string
}

const API_BASE_URL = 'http://localhost:4000/api'
const API_ORIGIN = new URL(API_BASE_URL).origin
const SESSION_STORAGE_KEY = 'veta-session-v2'
const VISITED_STORAGE_KEY = 'veta-visited-v1'

type VisitedKind = 'pages' | 'courses' | 'news'
type VisitedState = Record<VisitedKind, string[]>
type VisitFilter = 'all' | 'visited' | 'unvisited'

const emptyVisitedState: VisitedState = { pages: [], courses: [], news: [] }
const VisitedContext = createContext<{
  visited: VisitedState
  markVisited: (kind: VisitedKind, id: string) => void
  clearVisited: () => void
} | null>(null)

function readVisitedState(): VisitedState {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(VISITED_STORAGE_KEY) ?? 'null')
    if (!stored || typeof stored !== 'object') return emptyVisitedState
    const value = stored as Partial<Record<VisitedKind, unknown>>
    return {
      pages: Array.isArray(value.pages) && value.pages.every((item) => typeof item === 'string') ? value.pages : [],
      courses: Array.isArray(value.courses) && value.courses.every((item) => typeof item === 'string') ? value.courses : [],
      news: Array.isArray(value.news) && value.news.every((item) => typeof item === 'string') ? value.news : []
    }
  } catch {
    return emptyVisitedState
  }
}

function useVisitedHistory() {
  const context = useContext(VisitedContext)
  if (!context) throw new Error('Visited history must be used within its provider.')
  return context
}

function ContentFilters({
  label,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onClearHistory
}: {
  label: string
  query: string
  onQueryChange: (value: string) => void
  filter: VisitFilter
  onFilterChange: (value: VisitFilter) => void
  onClearHistory: () => void
}) {
  const t = useTranslate()
  return (
    <div className="content-filters">
      <label className="search-field">
        <span className="sr-only">{label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder={label}
        />
      </label>
      <label className="visit-filter-field">
        <span className="sr-only">{t('Filter by visit status')}</span>
        <select value={filter} onChange={(event) => onFilterChange(event.currentTarget.value as VisitFilter)}>
          <option value="all">{t('All items')}</option>
          <option value="unvisited">{t('Not visited')}</option>
          <option value="visited">{t('Visited')}</option>
        </select>
      </label>
      <button type="button" className="clear-history-button" onClick={onClearHistory}>
        {t('Clear visit history')}
      </button>
    </div>
  )
}

function matchesVisitFilter(isVisited: boolean, filter: VisitFilter): boolean {
  return filter === 'all' || (filter === 'visited' ? isVisited : !isVisited)
}

const navItems = [
  { label: 'Home', to: '/', icon: Home },
  {
    label: 'About',
    to: '/about',
    icon: Info,
    children: [
      { label: 'About', to: '/about', icon: Info },
      { label: 'Centres', to: '/centres', icon: Building2 },
      { label: 'Courses', to: '/courses', icon: BookOpen },
      { label: 'Reviews', to: '/reviews', icon: Star }
    ]
  },
  {
    label: 'Admissions',
    to: '/admissions',
    icon: Calendar,
    children: [
      { label: 'Admissions', to: '/admissions', icon: Calendar },
      { label: 'News', to: '/news', icon: FileText },
      { label: 'Contact', to: '/contact', icon: Mail }
    ]
  },
  {
    label: 'ICT Services',
    to: '#ict-services',
    icon: Cpu,
    externalMenu: true,
    children: [
      {
        label: 'VetMIS',
        href: 'https://vetmis.veta.go.tz/vet-mis/ManageHome/ManageHome.do',
        icon: Monitor
      },
      {
        label: 'Staff Mail',
        href: 'https://mail.veta.go.tz/',
        icon: Mail
      }
    ]
  }
]

const quickLinks = [
  {
    title: 'Admissions open',
    setting: 'home.quickLinkAdmissions',
    text: 'Check entry requirements and apply for the next intake.',
    to: '/admissions'
  },
  {
    title: 'Find a centre',
    setting: 'home.quickLinkCentres',
    text: 'Explore available hubs across Tanzania and nearby districts.',
    to: '/centres'
  },
  {
    title: 'Career pathways',
    setting: 'home.quickLinkCourses',
    text: 'Browse demand-driven programmes aligned to industry needs.',
    to: '/courses'
  }
]

const homeHeroSlides = [
  {
    title: 'Digital learning, real skills',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Hands-on lab practice',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Future-ready ICT careers',
    image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80'
  }
]

const pageCoverImages = {
  about: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  centres: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  courses: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  admissions: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
  reviews: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
  news: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
  publications: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
  contact: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
  bookings: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80',
  auth: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  dashboard: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80'
} as const

const admissionsSteps = [
  'Submit an online application',
  'Upload required documents',
  'Complete interview or placement screening',
  'Receive approval and enrolment guidance'
]

function getStoredSession(): Session | null {
  window.localStorage.removeItem('veta-session')
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    fetchJson<{ data?: T[] }>(endpoint, undefined, controller.signal)
      .then((body) => {
        if (!Array.isArray(body.data)) {
          throw new Error('The server returned an invalid data response.')
        }
        setData(body.data)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load data.')
        }
      })

    return () => controller.abort()
  }, [endpoint])

  return { data, error }
}

async function postJson<T>(endpoint: string, payload: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body?.message ?? 'Request failed')
  }

  return body as T
}

async function mutateJson<T>(
  method: 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  token: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  }
  if (payload) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(payload ? { body: JSON.stringify(payload) } : {})
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body?.message ?? 'Request failed')
  return body as T
}

async function mutateFormData<T>(
  method: 'POST' | 'PATCH' | 'PUT',
  endpoint: string,
  formData: FormData,
  token: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body?.message ?? 'Request failed')
  return body as T
}

function getMediaUrl(imageUrl: string): string {
  return new URL(imageUrl, API_ORIGIN).toString()
}

function formatLocaleDate(value: string, language: Language): string {
  return new Date(value).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB')
}

async function fetchJson<T>(endpoint: string, token?: string, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
    signal
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body?.message ?? 'Request failed')
  }

  return body as T
}

function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchJson<{ data: Record<string, string> }>('/site-settings', undefined, controller.signal)
      .then(({ data }) => {
        setSettings(data)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load site settings.')
        }
      })
    return () => controller.abort()
  }, [])

  return { settings, error }
}

function parseSettingList(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : fallback
  } catch {
    return fallback
  }
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

function getCourseCategory(duration: string): 'Long Course' | 'Short Course' {
  const match = /^(\d+)/.exec(duration)
  if (!match) return 'Long Course'
  const months = Number(match[1])
  return months <= 6 ? 'Short Course' : 'Long Course'
}

function isIctCourse(course: CourseCatalogItem): boolean {
  const haystack = `${course.name} ${course.summary ?? ''} ${course.level} ${course.duration ?? ''}`.toLowerCase()
  return /(ict|computer|digital|network|software|web|app|cyber|data|automation|robot|tech|programming|technology)/.test(haystack)
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
  const [session, setSession] = useState<Session | null>(() => getStoredSession())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { settings } = useSiteSettings()

  const handleSignIn = (nextSession: Session) => {
    setSession(nextSession)
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
  }

  const handleSignOut = () => {
    setSession(null)
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  const navLinks = useMemo(
    () => session
      ? [
          ...navItems,
          {
            label: 'Dashboard',
            to: session.user.role === 'admin' ? '/admin' : '/dashboard',
            icon: session.user.role === 'admin' ? ShieldCheck : Users
          }
        ]
      : navItems,
    [session]
  )

  return (
    <div className="app-shell">
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
              return (
                <div key={item.label} className="nav-group">
                  {'externalMenu' in item && item.externalMenu ? (
                    <button type="button" className="nav-link nav-group-trigger" aria-haspopup="true">
                      <Icon size={16} className="nav-link-icon" />
                      <span>{t(item.label)}</span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={16} className="nav-link-icon" />
                      <span>{t(item.label)}</span>
                    </NavLink>
                  )}

                  <div className="nav-submenu">
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
                            onClick={() => setMobileMenuOpen(false)}
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
                          onClick={() => setMobileMenuOpen(false)}
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
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={16} className="nav-link-icon" />
                <span>{t(item.label)}</span>
              </NavLink>
            )
          })}
          {session ? (
            <div className="account-box">
              <span className="account-chip">{t(session.user.role === 'admin' ? 'Admin' : 'User')}</span>
              <span className="account-name">{session.user.name}</span>
              <button type="button" className="secondary-button compact-button header-signout-button" onClick={handleSignOut}>
                <LogOut size={16} />
                {t('Sign out')}
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <Link to="/login" className="secondary-button compact-button header-login-button" onClick={() => setMobileMenuOpen(false)}>
                <LogIn size={16} />
                {t('Login')}
              </Link>
              <Link to="/register" className="primary-button compact-button" onClick={() => setMobileMenuOpen(false)}>
                <UserPlus size={16} />
                {t('Register')}
              </Link>
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
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage session={session} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/centres" element={<CentresPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsArticlePage session={session} />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/login"
            element={session
              ? <Navigate to={session.user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              : <AuthPage mode="login" onSuccess={handleSignIn} />}
          />
          <Route
            path="/register"
            element={session
              ? <Navigate to={session.user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              : <AuthPage mode="register" onSuccess={handleSignIn} />}
          />
          <Route path="/bookings" element={<BookingPage session={session} />} />
          <Route
            path="/dashboard"
            element={session
              ? session.user.role === 'admin'
                ? <Navigate to="/admin" replace />
                : <UserDashboard session={session} />
              : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={session
              ? session.user.role === 'admin'
                ? <AdminPage session={session} />
                : <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div>
          <div className="brand-name">Veta Kipawa ICT Center</div>
          <p>{settings['site.footerTagline'] ?? t('Skilled labour force for the future of Tanzania.')}</p>
        </div>
        <div className="footer-links">
          <span>{t('Helpdesk:')} {settings['site.contactPhone'] ?? '+255 22 000 0000'}</span>
          <span>{settings['site.contactEmail'] ?? 'info@veta.go.tz'}</span>
          <div className="footer-socials" role="group" aria-label="Social media">
            <a
              className="social-link"
              href="https://www.instagram.com/veta_kipawa/?hl=en"
              target="_blank"
              rel="noreferrer"
              aria-label="VETA Kipawa on Instagram"
              title="VETA Kipawa on Instagram"
            >
              <svg className="social-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <span className="social-link social-link-pending" role="img" aria-label="YouTube profile link coming soon" title="YouTube profile link coming soon">
              <svg className="social-brand-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
              </svg>
            </span>
            <span className="social-link social-link-pending" role="img" aria-label="Facebook profile link coming soon" title="Facebook profile link coming soon">
              <svg className="social-brand-icon social-facebook-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" />
              </svg>
            </span>
            <span className="social-link social-link-pending" role="img" aria-label="TikTok profile link coming soon" title="TikTok profile link coming soon">
              <svg className="social-brand-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.6 6.1a5.6 5.6 0 0 1-3.4-4.6V1h-3.8v14.5a2.8 2.8 0 1 1-2.8-2.8c.4 0 .8.1 1.1.2V9a7 7 0 1 0 5.5 6.8V8.4a9.3 9.3 0 0 0 5.4 1.7V6.3c-.7 0-1.4-.1-2-.2Z" />
              </svg>
            </span>
          </div>
        </div>
      </footer>
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
          <MessageCircle className="whatsapp-chat-icon" size={31} strokeWidth={2.2} />
          <Phone className="whatsapp-phone-icon" size={14} strokeWidth={2.8} />
        </span>
      </a>
    </div>
  )
}

function HomePage({ session }: { session: Session | null }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const { data: courseCatalog, error: courseError } = useApiData<CourseCatalogItem>('/courses')
  const { data: latestNews, error: newsError } = useApiData<NewsItem>('/news')
  const { data: stats, error: statsError } = useApiData<{ value: string; label: string }>('/site-stats')
  const { settings } = useSiteSettings()
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeNewsSlideIndex, setActiveNewsSlideIndex] = useState(0)
  const newsSlides = latestNews.filter(
    (item): item is NewsItem & { imageUrl: string } => Boolean(item.imageUrl)
  )
  const activeNewsSlide = newsSlides.length ? activeNewsSlideIndex % newsSlides.length : 0

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % homeHeroSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (newsSlides.length < 2) return
    const timer = window.setInterval(() => {
      setActiveNewsSlideIndex((current) => (current + 1) % newsSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [newsSlides.length])

  const ictCourses = courseCatalog.filter(isIctCourse)

  return (
    <>
      {newsSlides.length > 0 && (
        <section className="home-news-carousel" aria-label={t('Latest news')}>
          {newsSlides.map((item, index) => (
            <article
              key={item.id}
              className={`home-news-slide ${index === activeNewsSlide ? 'active' : ''}`}
              aria-hidden={index !== activeNewsSlide}
            >
              <img className="home-news-image" src={getMediaUrl(item.imageUrl)} alt="" />
              <div className="home-news-overlay" />
              <div className="home-news-copy">
                <span className="home-news-category">{item.category}</span>
                <h1>{item.title}</h1>
                <p>{item.summary}</p>
                <Link to="/news" className="home-news-link">
                  {t('Read the news')} <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
          {newsSlides.length > 1 && (
            <>
              <button
                type="button"
                className="home-news-arrow previous"
                aria-label={t('Previous news story')}
                onClick={() => setActiveNewsSlideIndex((activeNewsSlide + newsSlides.length - 1) % newsSlides.length)}
              >
                <ChevronRight size={22} />
              </button>
              <button
                type="button"
                className="home-news-arrow next"
                aria-label={t('Next news story')}
                onClick={() => setActiveNewsSlideIndex((activeNewsSlide + 1) % newsSlides.length)}
              >
                <ChevronRight size={22} />
              </button>
              <div className="home-news-dots" aria-label={t('News story navigation')}>
                {newsSlides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={index === activeNewsSlide ? 'active' : ''}
                    aria-label={`${t('Show news story')} ${index + 1}`}
                    aria-current={index === activeNewsSlide}
                    onClick={() => setActiveNewsSlideIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="hero-section">
        <div className="hero-panel">
          <div className="hero-slider" aria-label={t('Featured training highlights')}>
            {homeHeroSlides.map((slide, index) => (
              <div
                key={slide.title}
                className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
                style={{ backgroundImage: `linear-gradient(135deg, rgba(4, 23, 51, 0.62), rgba(11, 82, 160, 0.42)), url(${slide.image})` }}
              />
            ))}
            <div className="hero-slider-card">
              <div className="mini-label">{t('Featured course')}</div>
              <h3>{t(homeHeroSlides[activeSlide].title)}</h3>
              <p>{settings['home.featuredDescription'] ?? 'Hands-on training in automation, robotics, and smart manufacturing systems for modern industrial workplaces.'}</p>
              <div className="slider-dots" aria-label={t('Slide navigation')}>
                {homeHeroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    className={index === activeSlide ? 'dot active' : 'dot'}
                    aria-label={`${t('Show slide')} ${index + 1}`}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-copy">
          <span className="eyebrow">                    {settings['home.eyebrow'] ?? t('Skills for a productive future')}</span>
          <h1>{settings['home.headline'] ?? t('Learning pathways that turn talent into opportunity.')}</h1>
          <p>
            {settings['home.description'] ?? t('VETA Tanzania connects learners, employers and training centres through practical, workplace-ready vocational programmes that support inclusive growth.')}
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="primary-button">
              {t('Explore programmes')}
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="secondary-button">
              {t('Learn more')}
            </Link>
          </div>
          <div className="hero-status">
            <CheckCircle2 size={16} />
            {session
              ? `Signed in as ${session.user.name}`
              : t('Create an account to apply and book a course.')}
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{t(stat.label)}</div>
          </div>
        ))}
        {statsError && <p className="error-message">{t(statsError)}</p>}
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('Quick access')}</span>
            <h2>{t('Start your journey')}</h2>
          </div>
        </div>
        <div className="card-grid three-up">
          {quickLinks.map((link) => (
            <div key={link.title} className="info-card large-card">
              <div className="card-icon">
                <ChevronRight size={18} />
              </div>
              <h3>{t(link.title)}</h3>
              <p>{settings[link.setting] ?? t(link.text)}</p>
              <Link to={link.to} className="text-link">
                {t('View details')} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block split-section">
        <div>
          <span className="eyebrow">{t('Our approach')}</span>
          <h2>{settings['home.approachTitle'] ?? t('Training rooted in employability and community growth.')}</h2>
        </div>
        <div className="feature-list">
          <div className="feature-item">
            <ShieldCheck size={22} />
            <div>
              <h3>{t('Quality assurance')}</h3>
              <p>{t('Clear standards, strong oversight and employer-informed curricula.')}</p>
            </div>
          </div>
          <div className="feature-item">
            <TrendingUp size={22} />
            <div>
              <h3>{t('Market-driven skills')}</h3>
              <p>{t('Programmes aligned to industry demand, entrepreneurship and local value chains.')}</p>
            </div>
          </div>
          <div className="feature-item">
            <Users size={22} />
            <div>
              <h3>{t('Inclusive access')}</h3>
              <p>{t('Accessible entry points for youth, women, and underserved communities.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('Popular programmes')}</span>
            <h2>{t('Vocational courses to match tomorrow’s jobs')}</h2>
          </div>
          <Link to="/courses" className="text-link">
            {t('View all courses')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card-grid four-up">
          {(ictCourses.length ? ictCourses : courseCatalog).slice(0, 4).map((course) => (
            <div key={course.name} className="info-card">
              <span className="pill">{t(course.level)}</span>
              <h3>{course.name}</h3>
              <p>{course.summary}</p>
              <div className="meta-row">
                <span>
                  <Calendar size={14} />
                  {course.duration}
                </span>
                <span>
                  <BookOpen size={14} />
                  {t('Practical training')}
                </span>
              </div>
            </div>
          ))}
        </div>
        {courseError && <p className="error-message">{t(courseError)}</p>}
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('Latest updates')}</span>
            <h2>{t('News and announcements')}</h2>
          </div>
          <Link to="/news" className="text-link">
            {t('See all updates')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card-grid three-up">
          {latestNews.slice(0, 3).map((item) => (
            <article key={item.id} className="info-card news-card">
              <span className="pill muted-pill">{item.category}</span>
              <h3><Link to={`/news/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h3>
              <p>{formatLocaleDate(item.date, language)}</p>
              <Link to={`/news/${encodeURIComponent(item.slug)}`} className="text-link">
                {t('Read full story')} <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
        {newsError && <p className="error-message">{t(newsError)}</p>}
      </section>
    </>
  )
}

function AboutPage() {
  const t = useTranslate()
  const { settings } = useSiteSettings()
  const values = parseSettingList(settings['about.values'], [
    'Access and equity',
    'Industry relevance',
    'Quality and accountability',
    'Innovation and sustainability'
  ])

  return (
    <section className="content-page">
      <PageCover label="About us" title={settings['about.heading'] ?? t('Delivery that strengthens skills, institutions and communities.')} image={pageCoverImages.about} />
      <div className="text-columns">
        <div>
          <p>
            {settings['about.paragraph1'] ?? t('The VETA-inspired model focuses on technical and vocational education that matches national development priorities, labour market realities and local employer needs.')}
          </p>
          <p>
            {settings['about.paragraph2'] ?? t('We work across training centres, district partnerships and public information systems to improve access, quality and progression for learners entering technical and productive careers.')}
          </p>
        </div>
        <div className="aside-box">
          <h3>{t('Core values')}</h3>
          <ul>
            {values.map((value) => <li key={value}>{value}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

function CentresPage() {
  const t = useTranslate()
  const { data: centres, error } = useApiData<TrainingCentreItem>('/centres')

  const centreIconByType = (centre: TrainingCentreItem) => {
    const haystack = `${centre.name} ${centre.type} ${centre.focus}`.toLowerCase()
    if (/(multimedia|design|ui|web|graphic|video|media)/.test(haystack)) return Monitor
    if (/(mechatronics|robot|automation|plc|sensor|electronics|electrical|circuit)/.test(haystack)) return Cpu
    if (/(computer maintenance|hardware|repair|support|networking)/.test(haystack)) return Building2
    if (/(administration|student support|admissions|welfare|coordination|training|assessment|liaison)/.test(haystack)) return Users
    if (/(industry|placement|partnership|employment|business)/.test(haystack)) return TrendingUp
    return Building2
  }

  const labCentres = centres.filter((centre) => /lab|workshop|studio|media|multimedia|mechatronics|electronics|computer maintenance|web design|network|maintenance/i.test(`${centre.name} ${centre.type} ${centre.focus}`))
  const officeCentres = centres.filter((centre) => /office|administration|coordination|liaison|support/i.test(`${centre.name} ${centre.type} ${centre.focus}`))
  const remainingCentres = centres.filter((centre) => !labCentres.some((lab) => lab.id === centre.id) && !officeCentres.some((office) => office.id === centre.id))

  const renderCentres = (items: TrainingCentreItem[], label: string) => (
    <div className="course-section-block">
      <h2 className="course-section-title">{label}</h2>
      <div className="card-grid two-up">
        {items.map((centre) => {
          const Icon = centreIconByType(centre)
          return (
            <div key={centre.id} className="info-card centre-card">
              <div className="card-icon tertiary-icon">
                <Icon size={20} />
              </div>
              <h3>{centre.name}</h3>
              <p className="location-line">
                <MapPin size={14} />
                {centre.district}, {centre.region}
              </p>
              <p>{centre.type}</p>
              <div className="focus-tag">{centre.focus}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="content-page">
      <PageCover label="Training centres" title="Practical ICT learning spaces, labs and support offices." image={pageCoverImages.centres} />

      {labCentres.length > 0 && renderCentres(labCentres, t('Labs and workshops'))}
      {officeCentres.length > 0 && renderCentres(officeCentres, t('Administrative and support offices'))}
      {remainingCentres.length > 0 && renderCentres(remainingCentres, t('Centre network overview'))}
      {!labCentres.length && !officeCentres.length && centres.length > 0 && renderCentres(centres, t('Centre network overview'))}
      {error && <p className="error-message">{t(error)}</p>}
    </section>
  )
}

function CoursesPage() {
  const t = useTranslate()
  const { language } = useLanguage()
  const { data: courseCatalog, error: courseError } = useApiData<CourseCatalogItem>('/courses')
  const ictCourses = courseCatalog.filter(isIctCourse)
  const longCourses = ictCourses.filter((course) => course.courseType !== 'Short Course' && getCourseCategory(course.duration ?? '12 months') === 'Long Course')
  const shortCourses = courseCatalog
    .filter((course) => course.courseType === 'Short Course' || getCourseCategory(course.duration) === 'Short Course')
    .sort((first, second) =>
      (first.startDate ?? '9999').localeCompare(second.startDate ?? '9999') || first.name.localeCompare(second.name)
    )

  const renderCourses = (items: CourseCatalogItem[], label?: string) => (
    <div className="course-section-block">
      {label && <h2 className="course-section-title">{label}</h2>}
      <div className={items.some((course) => course.courseType === 'Short Course') ? 'card-grid short-course-grid' : 'card-grid two-up'}>
        {items.map((course) => {
          const isShortCourse = course.courseType === 'Short Course'
          return (
            <article key={course.id ?? course.name} className={`info-card course-card ${isShortCourse ? 'short-course-card' : ''}`}>
              {(isShortCourse || course.imageUrl) && (
                <img
                  className="short-course-image"
                  src={course.imageUrl ? getMediaUrl(course.imageUrl) : pageCoverImages.courses}
                  alt={`${course.name} practical training`}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.src = pageCoverImages.courses }}
                />
              )}
              <div className={isShortCourse ? 'short-course-content' : 'course-content'}>
                <span className="pill">{t(course.level)}</span>
                <h3>{course.name}</h3>
                <p>{course.summary}</p>
                <div className="meta-row compact-meta">
                  {course.startDate && (
                    <span>
                      <Calendar size={14} />
                      {t('Starts')} {new Date(course.startDate).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </span>
                  )}
                  <span>
                    <Award size={14} />
                    {course.duration}
                  </span>
                </div>
                {course.fee != null && <p className="short-course-fee">TSh {course.fee.toLocaleString(language === 'sw' ? 'sw-TZ' : 'en-TZ')}</p>}
                <Link to="/bookings" className="text-link center-link">
                  Book this course <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="content-page">
      <PageCover label="Courses and programmes" title="ICT-focused long courses and short courses for practical skills." image={pageCoverImages.courses} />
      {longCourses.length > 0 && renderCourses(longCourses, t('Long Courses'))}
      {shortCourses.length > 0 && (
        <section className="course-section-block short-courses-section">
          <span className="eyebrow">{t('Kozi fupi za ufundi')}</span>
          <h2 className="course-section-title">{t('Short courses starting September–October 2026')}</h2>
          <p className="short-courses-intro">{t('Build practical skills in a short time. Check each course start date, duration and fee.')}</p>
          {renderCourses(shortCourses)}
        </section>
      )}
      {courseError && <p className="error-message">{t(courseError)}</p>}
    </section>
  )
}

function AdmissionsPage() {
  const t = useTranslate()
  const { data: courses, error: coursesError } = useApiData<CourseCatalogItem>('/courses')
  const { data: centres, error: centresError } = useApiData<TrainingCentreItem>('/centres')
  const { settings } = useSiteSettings()
  const steps = parseSettingList(settings['admissions.steps'], admissionsSteps)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const applicantName = String(form.get('applicantName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const programme = String(form.get('programme') ?? '').trim()
    const centrePreference = String(form.get('centrePreference') ?? '').trim()

    if (!applicantName || !email || !programme) {
      setError(t('Please complete your name, email address and programme.'))
      return
    }

    try {
      await postJson('/applications', {
        applicantName,
        email,
        programme,
        centrePreference
      })
      setError('')
      setSubmitted(true)
      formElement.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to submit your application.'))
    }
  }

  return (
    <section className="content-page">
      <PageCover label="Admissions" title="Apply for the next intake with confidence." image={pageCoverImages.admissions} />
      <div className="admission-layout">
        <div className="admission-steps">
          {steps.map((step, index) => (
            <div key={step} className="step-item">
              <span className="step-number">0{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
        <form className="application-form" onSubmit={handleSubmit}>
          <label>
            {t('Full name')}
            <input name="applicantName" type="text" placeholder={t('Your full name')} required />
          </label>
          <label>
            {t('Email address')}
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            {t('Programme of interest')}
            <select name="programme" defaultValue="" required>
              <option value="" disabled>
                {t('Select a programme')}
              </option>
              {courses.map((course) => (
                <option key={course.id ?? course.name} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Preferred training centre (optional)')}
            <select name="centrePreference" defaultValue="">
              <option value="">{t('No preference')}</option>
              {centres.map((centre) => (
                <option key={centre.id} value={centre.name}>
                  {centre.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-button">
            {t('Submit application')}
          </button>
          {(error || coursesError || centresError) && (
            <p className="error-message">{error || coursesError || centresError}</p>
          )}
          {submitted && <p className="success-message">{t('Your application has been submitted successfully.')}</p>}
        </form>
      </div>
    </section>
  )
}

function ReviewsPage() {
  const t = useTranslate()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { data: courses, error: coursesError } = useApiData<CourseCatalogItem>('/courses')

  useEffect(() => {
    fetchJson<{ data: ReviewItem[] }>('/comments')
      .then(({ data }) => setReviews(data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load reviews.')
      })
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    const course = String(form.get('course') ?? '').trim()
    const rating = Number(form.get('rating') ?? 5)
    const comment = String(form.get('comment') ?? '').trim()

    if (!name || !course || !comment) {
      setError(t('Please complete all review details.'))
      return
    }

    try {
      const response = await postJson<{ review: ReviewItem }>('/comments', {
        userName: name,
        course,
        rating,
        comment
      })
      setReviews((current) => [response.review, ...current])
      setError('')
      setSubmitted(true)
      formElement.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your review.')
    }
  }

  return (
    <section className="content-page">
      <PageCover label="Student reviews" title="Encouraging voices from learners, graduates and employers." image={pageCoverImages.reviews} />

      <div className="review-layout">
        <form className="application-form" onSubmit={handleSubmit}>
          <h3>{t('Share feedback')}</h3>
          <label>
            {t('Your name')}
            <input name="name" type="text" placeholder={t('Full name')} />
          </label>
          <label>
            {t('Course')}
            <select name="course" defaultValue="">
              <option value="" disabled>
                {t('Select a programme')}
              </option>
              {courses.map((course) => (
                <option key={course.id ?? course.name} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Rating')}
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} {value > 1 ? t('stars') : t('star')}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Comment')}
            <textarea name="comment" rows={5} placeholder={t('Tell us about your learning experience')} />
          </label>
          <button type="submit" className="primary-button">
            {t('Submit review')}
          </button>
          {error && <p className="error-message">{t(error)}</p>}
          {coursesError && <p className="error-message">{t(coursesError)}</p>}
          {submitted && <p className="success-message">{t('Thank you. Your comment has been added.')}</p>}
        </form>

        <div className="review-list">
          {reviews.map((review) => (
            <article key={review.id} className="comment-card">
              <div className="comment-header">
                <div>
                  <h3>{review.userName}</h3>
                  <span>{review.course}</span>
                </div>
                <div className="star-row" aria-label={`${review.rating} ${t('star review')}`}>
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star key={`${review.id}-${index}`} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
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
      <PageCover label="News & announcements" title="Explore updates affecting learning, training and partnerships." image={pageCoverImages.news} />
      <div className="card-grid three-up">
        {news.map((item) => (
          <article key={item.id} className="info-card news-article">
            {item.imageUrl && <img className="news-article-image" src={getMediaUrl(item.imageUrl)} alt="" />}
            <span className="pill muted-pill">{item.category}</span>
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

function NewsArticlePage({ session }: { session: Session | null }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const { slug = '' } = useParams()
  const [article, setArticle] = useState<NewsArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedSlug, setLoadedSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchJson<{ article: NewsArticleDetail }>(
      `/news/${encodeURIComponent(slug)}`,
      session?.token,
      controller.signal
    )
      .then(({ article: loadedArticle }) => {
        setArticle(loadedArticle)
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
  }, [slug, session?.token])

  const isLoading = loading || loadedSlug !== slug

  const handleReaction = async (reaction: 'like' | 'dislike') => {
    if (!article || !session) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await mutateJson('PUT', `/news/${encodeURIComponent(slug)}/reaction`, session.token, {
        reaction: article.userReaction === reaction ? null : reaction
      })
      const { article: updatedArticle } = await fetchJson<{ article: NewsArticleDetail }>(
        `/news/${encodeURIComponent(slug)}`,
        session.token
      )
      setArticle(updatedArticle)
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
        { content },
        session.token
      )
      setArticle((current) => current
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

  return (
    <article className="content-page news-detail-page">
      <Link to="/news" className="text-link news-back-link">← {t('Back to news')}</Link>
      {article.imageUrl && (
        <img className="news-detail-image" src={getMediaUrl(article.imageUrl)} alt="" />
      )}
      {article.videoUrl && (
        <video className="news-detail-video" src={getMediaUrl(article.videoUrl)} controls playsInline preload="metadata">
          {t('Your browser does not support embedded video.')}
        </video>
      )}
      {article.youtubeUrl && (
        <div className="news-youtube-frame">
          <iframe
            src={article.youtubeUrl}
            title={`${t('Video')}: ${article.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
      <header className="news-detail-header">
        <span className="pill muted-pill">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="news-card-date">{formatLocaleDate(article.date, language)}</p>
        {article.summary && <p className="news-detail-summary">{article.summary}</p>}
      </header>
      <div className="news-detail-body">{article.body}</div>

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
            <Link to="/login">{t('Login')}</Link> {t('or')} <Link to="/register">{t('Register')}</Link>.
          </p>
        )}

        {session && (
          <form className="news-comment-form" onSubmit={(event) => void handleComment(event)}>
            <label htmlFor="news-comment">{t('Add a comment')}</label>
            <textarea id="news-comment" name="content" rows={4} maxLength={2000} required
              placeholder={t('Share your thoughts respectfully')} disabled={busy} />
            <button className="primary-button" type="submit" disabled={busy}>
              <MessageCircle size={17} aria-hidden="true" /> {busy ? t('Please wait…') : t('Post comment')}
            </button>
          </form>
        )}
        {error && <p className="error-message" role="alert">{t(error)}</p>}
        {notice && <p className="success-message" role="status">{notice}</p>}

        <div className="news-comments">
          <h3>{t('Comments')} ({article.comments.length})</h3>
          {article.comments.length ? article.comments.map((comment) => (
            <article key={comment.id} className="news-comment">
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

function PublicationsPage() {
  const t = useTranslate()
  const { data: publications, error } = useApiData<PublicationItem>('/publications')

  return (
    <section className="content-page">
      <PageCover label="Publications & downloads" title="Resources and publications from our training network." image={pageCoverImages.publications} />
      <div className="card-grid two-up">
        {publications.map((publication) => (
          <article key={publication.id} className="info-card">
            <h3>{publication.title}</h3>
            <a className="text-link" href={publication.fileUrl} target="_blank" rel="noreferrer">
              {t('Open publication')} <ArrowRight size={16} />
            </a>
          </article>
        ))}
      </div>
      {error && <p className="error-message">{t(error)}</p>}
      {!error && publications.length === 0 && <p>{t('No publications are currently available.')}</p>}
    </section>
  )
}

function ContactPage() {
  const t = useTranslate()
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { settings } = useSiteSettings()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const category = String(form.get('category') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()

    if (!name || !email || !category || !message) {
      setError(t('Please complete all contact details.'))
      return
    }

    try {
      await postJson('/contact', { name, email, category, message })
      setError('')
      setSubmitted(true)
      formElement.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to send your message.'))
    }
  }

  return (
    <section className="content-page">
      <PageCover label="Contact us" title="Speak with our information and admissions team." image={pageCoverImages.contact} />
      <div className="contact-layout">
        <div className="info-stack">
          <div className="info-card compact-contact">
            <Phone size={18} />
            <div>
              <h3>{t('Call us')}</h3>
              <p>{settings['site.contactPhone'] ?? '+255 22 000 0000'}</p>
            </div>
          </div>
          <div className="info-card compact-contact">
            <FileText size={18} />
            <div>
              <h3>{t('Email')}</h3>
              <p>{settings['site.contactEmail'] ?? 'info@veta.go.tz'}</p>
            </div>
          </div>
          <div className="info-card compact-contact">
            <MessageSquareQuote size={18} />
            <div>
              <h3>{t('Office hours')}</h3>
              <p>{settings['site.officeHours'] ?? t('Mon–Fri, 8:00am–5:00pm')}</p>
            </div>
          </div>
        </div>
        <form className="application-form" onSubmit={handleSubmit}>
          <label>
            {t('Name')}
            <input name="name" type="text" placeholder={t('Name')} required />
          </label>
          <label>
            {t('Email address')}
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            {t('Inquiry type')}
            <select name="category" defaultValue="" required>
              <option value="" disabled>
                {t('Choose an inquiry type')}
              </option>
              <option value="Admission enquiry">{t('Admission enquiry')}</option>
              <option value="Course guidance">{t('Course guidance')}</option>
              <option value="General support">{t('General support')}</option>
            </select>
          </label>
          <label>
            {t('Message')}
            <textarea name="message" rows={5} placeholder={t('How can we help?')} required />
          </label>
          <button type="submit" className="primary-button">
            {t('Send message')}
          </button>
          {error && <p className="error-message">{t(error)}</p>}
          {submitted && <p className="success-message">{t('Your message has been sent successfully.')}</p>}
        </form>
      </div>
    </section>
  )
}

function BookingPage({ session }: { session: Session | null }) {
  const t = useTranslate()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { data: courses, error: coursesError } = useApiData<CourseCatalogItem>('/courses')
  const { data: centres, error: centresError } = useApiData<TrainingCentreItem>('/centres')

  useEffect(() => {
    if (!session) {
      navigate('/login')
    }
  }, [navigate, session])

  if (!session) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const course = String(form.get('course') ?? '')
    const centre = String(form.get('centre') ?? '')
    const date = String(form.get('date') ?? '')
    const note = String(form.get('note') ?? '')

    if (!course || !centre || !date) {
      setError(t('Please select a course, centre and preferred date.'))
      return
    }

    try {
      await postJson<{ message: string }>('/bookings', {
        course,
        centre,
        date,
        note,
        userName: session.user.name
      }, session.token)

      setError('')
      setSubmitted(true)
      formElement.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to book a course right now.'))
    }
  }

  return (
    <section className="content-page">
      <PageCover label="Book your placement" title="Reserve your next learning opportunity." image={pageCoverImages.bookings} />
      <form className="application-form booking-form" onSubmit={handleSubmit}>
        <label>
          {t('Programme')}
          <select name="course" defaultValue="" required>
            <option value="" disabled>
              {t('Choose a programme')}
            </option>
            {courses.map((course) => (
              <option key={course.id ?? course.name} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Preferred centre')}
          <select name="centre" defaultValue="" required>
            <option value="" disabled>
              {t('Choose a training centre')}
            </option>
            {centres.map((centre) => (
              <option key={centre.id} value={centre.name}>
                {centre.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Preferred start date')}
          <input name="date" type="date" />
        </label>
        <label>
          {t('Notes')}
          <textarea name="note" rows={5} placeholder={t('Any additional information for the admissions team')} />
        </label>
        <button type="submit" className="primary-button">
          {t('Confirm booking')}
        </button>
        {error && <p className="error-message">{t(error)}</p>}
        {(coursesError || centresError) && (
          <p className="error-message">{coursesError || centresError}</p>
        )}
        {submitted && <p className="success-message">{t('Your booking request has been submitted successfully.')}</p>}
      </form>
    </section>
  )
}

function AuthPage({ mode, onSuccess }: { mode: 'login' | 'register'; onSuccess: (session: Session) => void }) {
  const t = useTranslate()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '').trim()

    if (!email || !password || (mode === 'register' && !name)) {
      setError(t('Please complete all required details.'))
      return
    }

    setLoading(true)

    try {
      const response = await postJson<{ token: string; user: AppUser }>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        mode === 'login' ? { email, password } : { name, email, password },
      )

      const nextSession = { token: response.token, user: response.user }
      onSuccess(nextSession)
      navigate(response.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? t(requestError.message) : t('Unable to authenticate right now.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="content-page auth-page">
      <PageCover label={mode === 'login' ? 'Account access' : 'Create an account'} title={mode === 'login' ? 'Welcome back to Kipawa ICT Center.' : 'Start your learning journey with us.'} image={pageCoverImages.auth} />
      <div className="auth-card">
        <span className="eyebrow">{t(mode === 'login' ? 'Welcome back' : 'Create an account')}</span>
        <h1>{t(mode === 'login' ? 'Login to your account' : 'Sign up for VETA')}</h1>

        <form className="application-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              {t('Full name')}
              <input name="name" type="text" placeholder={t('Your full name')} />
            </label>
          )}
          <label>
            {t('Email address')}
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <label>
            {t('Password')}
            <input name="password" type="password" placeholder={t('Enter a secure password')} />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? (
              t('Please wait...')
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                {t('Login')}
              </>
            ) : (
              <>
                <UserPlus size={18} />
                {t('Create account')}
              </>
            )}
          </button>
          {error && <p className="error-message">{t(error)}</p>}
        </form>

        <p className="auth-helper">
          {t(mode === 'login' ? 'Need an account?' : 'Already have an account?')}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'}>{t(mode === 'login' ? 'Register' : 'Login')}</Link>
        </p>

      </div>
    </section>
  )
}

function UserDashboard({ session }: { session: Session }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [bookings, setBookings] = useState<Array<{
    id: string
    course: string
    centre: string
    date: string
    note: string
    status: string
  }>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJson<{ data: typeof bookings }>('/bookings', session.token)
      .then(({ data }) => {
        setBookings(data)
        setError('')
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load your bookings.')
      })
  }, [session.token])

  return (
    <section className="content-page">
      <PageCover label="Learner dashboard" title={`${t('Welcome')}, ${session.user.name}.`} image={pageCoverImages.dashboard} />
      <div className="hero-actions">
        <Link to="/bookings" className="primary-button">
          {t('Book a course')} <ArrowRight size={18} />
        </Link>
        <Link to="/courses" className="secondary-button">
          {t('Explore courses')}
        </Link>
      </div>
      {error && <p className="error-message">{t(error)}</p>}
      <div className="admin-table-wrap">
        <h3>{t('Your course bookings')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('Course')}</th>
              <th>{t('Centre')}</th>
              <th>{t('Preferred start date')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.course}</td>
                  <td>{booking.centre}</td>
                  <td>{formatLocaleDate(booking.date, language)}</td>
                  <td>{booking.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>{t('You have not submitted any course bookings yet.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AdminPage({ session }: { session: Session }) {
  const t = useTranslate()
  const [overview, setOverview] = useState<OverviewItem[]>([])
  const [bookings, setBookings] = useState<Array<{ id: string; user_name: string; course: string; centre: string; start_date: string; status: string }>>([])
  const [reviews, setReviews] = useState<Array<{ id: string; user_name: string; course: string; rating: number; comment: string }>>([])
  const [applications, setApplications] = useState<Array<{
    id: string
    applicant_name: string
    email: string
    programme: string
    centre_preference: string
    status: string
    submitted_at: string
  }>>([])
  const [inquiries, setInquiries] = useState<Array<{
    id: string
    name: string
    email: string
    category: string
    message: string
    created_at: string
  }>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJson<{
      overview: OverviewItem[]
      bookings: typeof bookings
      reviews: typeof reviews
      applications: typeof applications
      inquiries: typeof inquiries
    }>('/admin/overview', session.token)
      .then((data) => {
        setOverview(data.overview)
        setBookings(data.bookings)
        setReviews(data.reviews)
        setApplications(data.applications)
        setInquiries(data.inquiries)
        setError('')
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the admin dashboard.')
      })
  }, [session.token])

  return (
    <section className="content-page">
      <PageCover label="Administration dashboard" title="Operational overview for intake and centre management." image={pageCoverImages.dashboard} />
      <div className="dashboard-grid">
        {overview.map(({ label, value, note }) => (
          <div key={label} className="metric-card">
            <span>{t(label)}</span>
            <strong>{value}</strong>
            <small>{t(note)}</small>
          </div>
        ))}
      </div>
      {error && <p className="error-message">{t(error)}</p>}

      <div className="admin-table-wrap">
        <h3>{t('Recent bookings')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('Student')}</th>
              <th>{t('Course')}</th>
              <th>{t('Centre')}</th>
              <th>{t('Start date')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.user_name}</td>
                  <td>{booking.course}</td>
                  <td>{booking.centre}</td>
                  <td>{booking.start_date}</td>
                  <td>{booking.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>{t('No bookings found.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrap">
        <h3>{t('Recent applications')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('Applicant')}</th>
              <th>{t('Email')}</th>
              <th>{t('Programme')}</th>
              <th>{t('Preferred centre')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.applicant_name}</td>
                  <td>{application.email}</td>
                  <td>{application.programme}</td>
                  <td>{application.centre_preference || t('No preference')}</td>
                  <td>{application.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>{t('No applications found.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrap">
        <h3>{t('Recent contact inquiries')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Email')}</th>
              <th>{t('Inquiry type')}</th>
              <th>{t('Message')}</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.name}</td>
                  <td>{inquiry.email}</td>
                  <td>{inquiry.category}</td>
                  <td>{inquiry.message}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>{t('No contact inquiries found.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrap">
        <h3>{t('Recent comments')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('User')}</th>
              <th>{t('Course')}</th>
              <th>{t('Rating')}</th>
              <th>{t('Comment')}</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.user_name}</td>
                  <td>{review.course}</td>
                  <td>{Array.from({ length: review.rating }, () => '★').join('')}</td>
                  <td>{review.comment}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>{t('No reviews found.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminManagement session={session} />
    </section>
  )
}

type AdminUserRecord = {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
}

type AdminCourseRecord = {
  id: string
  name: string
  level: string
  duration: string
  courseType: string
  startDate: string | null
  fee: number | null
  imageUrl: string | null
  description: string
  centres: string[]
}

type AdminCentreRecord = {
  id: string
  name: string
  region: string
  district: string
  type: string
  focus: string
}

type AdminNewsRecord = {
  id: string
  title: string
  category: string
  summary: string
  body: string
  imageUrl: string | null
  videoUrl: string | null
  youtubeUrl: string | null
  published: boolean
}

type AdminPublicationRecord = {
  id: string
  title: string
  fileUrl: string
}

type AdminManagementData = {
  users: AdminUserRecord[]
  courses: AdminCourseRecord[]
  centres: AdminCentreRecord[]
  news: AdminNewsRecord[]
  publications: AdminPublicationRecord[]
  bookings: Array<{ id: string; userName: string; course: string; centre: string; date: string; status: string }>
  applications: Array<{ id: string; applicantName: string; email: string; programme: string; centrePreference: string; status: string }>
  reviews: Array<{ id: string; userName: string; course: string; rating: number; comment: string }>
  inquiries: Array<{ id: string; name: string; email: string; category: string; message: string }>
  settings: Record<string, string>
}

const managementSections = [
  'Users',
  'Courses',
  'Centres',
  'News',
  'Bookings',
  'Applications',
  'Reviews',
  'Inquiries',
  'Publications',
  'Site settings'
] as const

type ManagementSection = typeof managementSections[number]

function AdminManagement({ session }: { session: Session }) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [data, setData] = useState<AdminManagementData | null>(null)
  const [section, setSection] = useState<ManagementSection>('Users')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = async () => {
    try {
      const result = await fetchJson<AdminManagementData>('/admin/data', session.token)
      setData(result)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load management data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchJson<AdminManagementData>('/admin/data', session.token, controller.signal)
      .then((result) => {
        setData(result)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load management data.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [session.token])

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
    try {
      const formData = new FormData(formElement)
      if (multipart) {
        for (const field of ['image', 'video', 'coverImage']) {
          const file = formData.get(field)
          if (file instanceof File && !file.name) formData.delete(field)
        }
        if (transform) {
          for (const [key, value] of Object.entries(transform(formData))) {
            if (value instanceof File) continue
            formData.set(key, Array.isArray(value) ? JSON.stringify(value) : value == null ? '' : String(value))
          }
        }
        await mutateFormData(method, endpoint, formData, session.token)
      } else if (method === 'POST') {
        const payload = transform?.(formData) ?? Object.fromEntries(formData.entries()) as Record<string, unknown>
        await postJson(endpoint, payload, session.token)
      } else {
        const payload = transform?.(formData) ?? Object.fromEntries(formData.entries()) as Record<string, unknown>
        await mutateJson(method, endpoint, session.token, payload)
      }
      setNotice('Changes saved.')
      setError('')
      formElement.reset()
      await loadData()
    } catch (requestError) {
      setNotice('')
      setError(requestError instanceof Error ? requestError.message : 'Unable to save changes.')
      setLoading(false)
    }
  }

  const deleteRecord = async (endpoint: string) => {
    if (!window.confirm(t('Delete this record? This action cannot be undone.'))) return
    setLoading(true)
    try {
      await mutateJson('DELETE', endpoint, session.token)
      setNotice('Record deleted.')
      setError('')
      await loadData()
    } catch (requestError) {
      setNotice('')
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete this record.')
      setLoading(false)
    }
  }

  const rowSaveForm = (
    id: string,
    endpoint: string,
    transform?: (form: FormData) => Record<string, unknown>,
    multipart = false
  ) => (
    <form
      id={`save-${id}`}
      className="admin-row-save-form"
      onSubmit={(event) => void saveForm(event, 'PATCH', endpoint, transform, multipart)}
    />
  )

  if (loading && !data) return <p>{t('Loading management data…')}</p>
  if (!data) return <p className="error-message">{error || t('Management data is unavailable.')}</p>

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <span className="eyebrow">{t('Database management')}</span>
          <h2>{t('Manage site data')}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => { setLoading(true); void loadData() }}>
          {t('Refresh data')}
        </button>
      </div>
      <div className="management-tabs" role="tablist" aria-label={t('Admin data sections')}>
        {managementSections.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={section === item}
            className={section === item ? 'primary-button compact-button' : 'secondary-button compact-button'}
            onClick={() => setSection(item)}
          >
            {t(item)}
          </button>
        ))}
      </div>
      {error && <p className="error-message" role="alert">{t(error)}</p>}
      {notice && <p className="success-message" role="status">{t(notice)}</p>}

      {section === 'Users' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/users')}>
            <h3>{t('Create user')}</h3>
            <label>{t('Name')}<input name="name" required /></label>
            <label>{t('Email')}<input name="email" type="email" required /></label>
            <label>{t('Phone')}<input name="phone" /></label>
            <label>{t('Temporary password')}<input name="password" type="password" minLength={8} required /></label>
            <label>{t('Role')}<select name="role" defaultValue="user"><option value="user">{t('User')}</option><option value="admin">{t('Admin')}</option></select></label>
            <button className="primary-button" type="submit">{t('Create user')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Users')} ({data.users.length})</h3><table>
            <thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Phone')}</th><th>{t('Role')}</th><th>{t('Active')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.users.map((user) => {
              const formId = `save-user-${user.id}`
              return <tr key={user.id}>
                <td><input aria-label={t('Name')} name="name" form={formId} defaultValue={user.name} /></td>
                <td><input aria-label={t('Email')} name="email" type="email" form={formId} defaultValue={user.email} /></td>
                <td><input aria-label={t('Phone')} name="phone" form={formId} defaultValue={user.phone ?? ''} /></td>
                <td><select aria-label={t('Role')} name="role" form={formId} defaultValue={user.role}><option value="user">{t('User')}</option><option value="admin">{t('Admin')}</option></select></td>
                <td><select aria-label={t('Active status')} name="isActive" form={formId} defaultValue={String(user.isActive)}><option value="true">{t('Active')}</option><option value="false">{t('Inactive')}</option></select></td>
                <td>{rowSaveForm(`user-${user.id}`, `/admin/users/${user.id}`, (form) => ({
                  name: form.get('name'),
                  email: form.get('email'),
                  phone: form.get('phone'),
                  role: form.get('role'),
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
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/courses', (form) => ({
            name: form.get('name'), level: form.get('level'), duration: form.get('duration'),
            description: form.get('description'), courseType: form.get('courseType'),
            startDate: form.get('startDate') || null,
            fee: form.get('fee') ? Number(form.get('fee')) : null,
            imageUrl: form.get('imageUrl') || null,
            centres: form.getAll('centres')
          }), true)}>
            <h3>{t('Add course')}</h3>
            <label>{t('Name')}<input name="name" required /></label><label>{t('Level')}<input name="level" required /></label>
            <label>{t('Duration')}<input name="duration" required /></label><label>{t('Description')}<textarea name="description" rows={2} /></label>
            <label>{t('Course type')}<select name="courseType" defaultValue="Long Course"><option>{t('Long Course')}</option><option>{t('Short Course')}</option></select></label>
            <label>{t('Start date')}<input name="startDate" type="date" /></label>
            <label>{t('Fee (TSh)')}<input name="fee" type="number" min="0" step="1" /></label>
            <label>{t('Course cover image URL')}<input name="imageUrl" type="url" /></label>
            <label>{t('Upload course cover image')}<input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label>{t('Training centres')}<select name="centres" multiple>{data.centres.map((centre) => <option key={centre.id} value={centre.name}>{centre.name}</option>)}</select></label>
            <button className="primary-button" type="submit">{t('Add course')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Courses')} ({data.courses.length})</h3><table>
            <thead><tr><th>{t('Name')}</th><th>{t('Level')}</th><th>{t('Type')}</th><th>{t('Duration')}</th><th>{t('Start date')}</th><th>{t('Fee (TSh)')}</th><th>{t('Cover image')}</th><th>{t('Description')}</th><th>{t('Centres')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.courses.map((course) => {
              const formId = `save-course-${course.id}`
              return <tr key={course.id}>
                <td><input aria-label={t('Course name')} name="name" form={formId} defaultValue={course.name} required /></td>
                <td><input aria-label={t('Level')} name="level" form={formId} defaultValue={course.level} required /></td>
                <td><select aria-label={t('Course type')} name="courseType" form={formId} defaultValue={course.courseType ?? 'Long Course'}>
                  <option value="Long Course">{t('Long Course')}</option><option value="Short Course">{t('Short Course')}</option>
                </select></td>
                <td><input aria-label={t('Duration')} name="duration" form={formId} defaultValue={course.duration} required /></td>
                <td><input aria-label={t('Start date')} name="startDate" type="date" form={formId} defaultValue={course.startDate?.slice(0, 10) ?? ''} /></td>
                <td><input aria-label={t('Fee')} name="fee" type="number" min="0" step="1" form={formId} defaultValue={course.fee ?? ''} /></td>
                <td className="course-cover-cell">
                  {course.imageUrl && <img className="admin-course-cover-preview" src={getMediaUrl(course.imageUrl)} alt="" />}
                  <input aria-label={t('Course cover image URL')} name="imageUrl" type="url" form={formId} defaultValue={course.imageUrl?.startsWith('/uploads/courses/') ? '' : course.imageUrl ?? ''} />
                  <input aria-label={`${t('Upload course cover image for')} ${course.name}`} name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif" form={formId} />
                  {course.imageUrl && <label className="remove-news-image"><input name="removeCoverImage" form={formId} type="checkbox" value="true" /> {t('Remove cover image')}</label>}
                </td>
                <td><textarea aria-label={t('Description')} name="description" form={formId} defaultValue={course.description} rows={2} /></td>
                <td><select aria-label={t('Training centres')} name="centres" form={formId} multiple defaultValue={course.centres}>
                  {data.centres.map((centre) => <option key={centre.id} value={centre.name}>{centre.name}</option>)}
                </select></td>
                <td>{rowSaveForm(`course-${course.id}`, `/admin/courses/${course.id}`, (form) => {
                  const coverFile = form.get('coverImage')
                  const clearCover = form.get('removeCoverImage') === 'true'
                  return {
                    name: form.get('name'), level: form.get('level'), duration: form.get('duration'),
                    description: form.get('description'), courseType: form.get('courseType'),
                    startDate: form.get('startDate') || null,
                    fee: form.get('fee') ? Number(form.get('fee')) : null,
                    imageUrl: clearCover || (coverFile instanceof File && coverFile.name)
                      ? null
                      : form.get('imageUrl') || course.imageUrl || null,
                    centres: form.getAll('centres'),
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

      {section === 'Centres' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/centres')}>
            <h3>{t('Add training centre')}</h3>
            <label>{t('Name')}<input name="name" required /></label><label>{t('Region')}<input name="region" required /></label>
            <label>{t('District')}<input name="district" required /></label><label>{t('Centre type')}<input name="type" required /></label>
            <label>{t('Focus')}<input name="focus" required /></label><button className="primary-button" type="submit">{t('Add centre')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Training centres')} ({data.centres.length})</h3><table>
            <thead><tr><th>{t('Name')}</th><th>{t('Region')}</th><th>{t('District')}</th><th>{t('Type')}</th><th>{t('Focus')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.centres.map((centre) => {
              const formId = `save-centre-${centre.id}`
              return <tr key={centre.id}>
                {(['name', 'region', 'district', 'type', 'focus'] as const).map((field) => <td key={field}>
                  <input aria-label={t(field === 'type' ? 'Centre type' : field === 'focus' ? 'Focus' : field === 'name' ? 'Name' : field === 'region' ? 'Region' : 'District')} name={field} form={formId} defaultValue={centre[field]} required />
                </td>)}
                <td>{rowSaveForm(`centre-${centre.id}`, `/admin/centres/${centre.id}`)}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/centres/${centre.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'News' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/news', undefined, true)}>
            <h3>{t('Publish news article')}</h3>
            <label>{t('Title')}<input name="title" required /></label><label>{t('Category')}<input name="category" required /></label>
            <label>{t('Summary')}<textarea name="summary" rows={2} /></label><label>{t('Article body')}<textarea name="body" rows={4} required /></label>
            <label>{t('News image (up to 5 MB)')}<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label>{t('Upload news video (MP4 or WebM; up to 50 MB)')}<input name="video" type="file" accept="video/mp4,video/webm" /></label>
            <label>{t('YouTube video link')}<input name="youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=…" /></label>
            <label>{t('Visibility')}<select name="published" defaultValue="true"><option value="true">{t('Published')}</option><option value="false">{t('Draft')}</option></select></label>
            <button className="primary-button" type="submit">{t('Add article')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('News articles')} ({data.news.length})</h3><table>
            <thead><tr><th>{t('Title')}</th><th>{t('Category')}</th><th>{t('Summary')}</th><th>{t('Body')}</th><th>{t('Media')}</th><th>{t('Visibility')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.news.map((article) => {
              const formId = `save-news-${article.id}`
              return <tr key={article.id}>
                <td><input aria-label={t('Title')} name="title" form={formId} defaultValue={article.title} required /></td>
                <td><input aria-label={t('Category')} name="category" form={formId} defaultValue={article.category} required /></td>
                <td><textarea aria-label={t('Summary')} name="summary" form={formId} defaultValue={article.summary} rows={2} /></td>
                <td><textarea aria-label={t('Article body')} name="body" form={formId} defaultValue={article.body} rows={2} required /></td>
                <td>
                  {article.imageUrl && <img className="admin-news-thumbnail" src={getMediaUrl(article.imageUrl)} alt="" />}
                  <input aria-label={`${t('Replace image for')} ${article.title}`} name="image" form={formId} type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                  {article.imageUrl && <label className="remove-news-image"><input name="removeImage" form={formId} type="checkbox" value="true" /> {t('Remove image')}</label>}
                  {article.videoUrl && <video className="admin-news-thumbnail" src={getMediaUrl(article.videoUrl)} controls preload="metadata" />}
                  <input aria-label={`${t('Upload video for')} ${article.title}`} name="video" form={formId} type="file" accept="video/mp4,video/webm" />
                  {article.videoUrl && <label className="remove-news-image"><input name="removeVideo" form={formId} type="checkbox" value="true" /> {t('Remove video')}</label>}
                  <input aria-label={`${t('YouTube video link for')} ${article.title}`} name="youtubeUrl" form={formId} type="url" defaultValue={article.youtubeUrl ?? ''} placeholder="YouTube URL" />
                </td>
                <td><select aria-label={t('Visibility')} name="published" form={formId} defaultValue={String(article.published)}><option value="true">{t('Published')}</option><option value="false">{t('Draft')}</option></select></td>
                <td>{rowSaveForm(`news-${article.id}`, `/admin/news/${article.id}`, undefined, true)}
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

      {section === 'Bookings' && <div className="admin-table-wrap"><h3>{t('Bookings')} ({data.bookings.length})</h3><table>
        <thead><tr><th>{t('User')}</th><th>{t('Course')}</th><th>{t('Centre')}</th><th>{t('Date')}</th><th>{t('Status')}</th><th>{t('Actions')}</th></tr></thead>
        <tbody>{data.bookings.map((booking) => {
          const formId = `save-booking-${booking.id}`
          return <tr key={booking.id}><td>{booking.userName}</td><td>{booking.course}</td><td>{booking.centre}</td><td>{formatLocaleDate(booking.date, language)}</td>
            <td><select aria-label={t('Booking status')} name="status" form={formId} defaultValue={booking.status}><option>{t('Pending')}</option><option>{t('Confirmed')}</option><option>{t('Review')}</option></select></td>
            <td>{rowSaveForm(`booking-${booking.id}`, `/admin/bookings/${booking.id}`)}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
              <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/bookings/${booking.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>
        })}</tbody>
      </table></div>}

      {section === 'Applications' && <div className="admin-table-wrap"><h3>{t('Applications')} ({data.applications.length})</h3><table>
        <thead><tr><th>{t('Applicant')}</th><th>{t('Email')}</th><th>{t('Programme')}</th><th>{t('Centre')}</th><th>{t('Status')}</th><th>{t('Actions')}</th></tr></thead>
        <tbody>{data.applications.map((application) => {
          const formId = `save-application-${application.id}`
          return <tr key={application.id}><td>{application.applicantName}</td><td>{application.email}</td><td>{application.programme}</td><td>{application.centrePreference || t('No preference')}</td>
            <td><select aria-label={t('Application status')} name="status" form={formId} defaultValue={application.status}><option value="submitted">{t('Submitted')}</option><option value="under_review">{t('Under review')}</option><option value="accepted">{t('Accepted')}</option><option value="rejected">{t('Rejected')}</option></select></td>
            <td>{rowSaveForm(`application-${application.id}`, `/admin/applications/${application.id}`)}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
              <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/applications/${application.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>
        })}</tbody>
      </table></div>}

      {section === 'Reviews' && <div className="admin-table-wrap"><h3>{t('Reviews')} ({data.reviews.length})</h3><table>
        <thead><tr><th>{t('Name')}</th><th>{t('Course')}</th><th>{t('Rating')}</th><th>{t('Comment')}</th><th>{t('Actions')}</th></tr></thead>
        <tbody>{data.reviews.map((review) => <tr key={review.id}><td>{review.userName}</td><td>{review.course}</td><td>{review.rating}</td><td>{review.comment}</td>
          <td><button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/reviews/${review.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>)}</tbody>
      </table></div>}

      {section === 'Inquiries' && <div className="admin-table-wrap"><h3>{t('Contact inquiries')} ({data.inquiries.length})</h3><table>
        <thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Type')}</th><th>{t('Message')}</th><th>{t('Actions')}</th></tr></thead>
        <tbody>{data.inquiries.map((inquiry) => <tr key={inquiry.id}><td>{inquiry.name}</td><td>{inquiry.email}</td><td>{inquiry.category}</td><td>{inquiry.message}</td>
          <td><button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/inquiries/${inquiry.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>)}</tbody>
      </table></div>}

      {section === 'Publications' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'POST', '/admin/publications')}>
            <h3>{t('Add publication')}</h3><label>{t('Title')}<input name="title" required /></label>
            <label>{t('File URL')}<input name="fileUrl" type="url" required /></label>
            <button className="primary-button" type="submit">{t('Add publication')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Publications')} ({data.publications.length})</h3><table>
            <thead><tr><th>{t('Title')}</th><th>{t('File URL')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{data.publications.map((publication) => {
              const formId = `save-publication-${publication.id}`
              return <tr key={publication.id}>
                <td><input aria-label={t('Publication title')} name="title" form={formId} defaultValue={publication.title} required /></td>
                <td><input aria-label={t('File URL')} name="fileUrl" type="url" form={formId} defaultValue={publication.fileUrl} required /></td>
                <td>{rowSaveForm(`publication-${publication.id}`, `/admin/publications/${publication.id}`)}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/publications/${publication.id}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td>
              </tr>
            })}</tbody>
          </table></div>
        </>
      )}

      {section === 'Site settings' && (
        <>
          <form className="application-form management-create-form" onSubmit={(event) => void saveForm(event, 'PUT', `/admin/site-settings/${encodeURIComponent(String(new FormData(event.currentTarget).get('key') ?? ''))}`, (form) => ({ value: form.get('value') }))}>
            <h3>{t('Add or update a site setting')}</h3><label>{t('Key')}<input name="key" required /></label>
            <label>{t('Value')}<textarea name="value" rows={3} required /></label>
            <button className="primary-button" type="submit">{t('Save setting')}</button>
          </form>
          <div className="admin-table-wrap"><h3>{t('Site settings')} ({Object.keys(data.settings).length})</h3><table>
            <thead><tr><th>{t('Key')}</th><th>{t('Value')}</th><th>{t('Actions')}</th></tr></thead>
            <tbody>{Object.entries(data.settings).map(([key, value], index) => {
              const formId = `save-setting-${index}`
              return <tr key={key}><td>{key}</td><td><textarea aria-label={`${t('Value')} ${key}`} name="value" form={formId} defaultValue={value} rows={2} /></td>
                <td>{rowSaveForm(`setting-${index}`, `/admin/site-settings/${encodeURIComponent(key)}`, (form) => ({ value: form.get('value') }))}<button type="submit" className="secondary-button compact-button admin-icon-button admin-save-button" form={formId} aria-label={t('Save')} title={t('Save')}><Save size={16} aria-hidden="true" /></button>{' '}
                  <button type="button" className="secondary-button compact-button admin-icon-button admin-delete-button" onClick={() => void deleteRecord(`/admin/site-settings/${encodeURIComponent(key)}`)} aria-label={t('Delete')} title={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button></td></tr>
            })}</tbody>
          </table></div>
        </>
      )}
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
        Return home
      </Link>
    </section>
  )
}

export default App
