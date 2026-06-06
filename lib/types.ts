export type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
}

export type Profile = {
  id: string
  username: string
  full_name: string | null
  headline: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  trade: string | null
  experience_level: "apprentice" | "journeyman" | "master" | null
  years_experience: number
  city: string | null
  state: string | null
  is_available: boolean
  union_status: "Union Member" | "Non-Union" | "Open to Both" | null
  profile_views: number
  verified_project_count: number
  dark_mode_preference: boolean
  onboarding_complete: boolean
  created_at: string
}

export type WorkExperience = {
  id: string
  profile_id: string
  job_title: string
  company_name: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  created_at: string
}

export type Project = {
  id: string
  profile_id: string
  title: string
  description: string | null
  trade_category: string | null
  specific_skills: string[]
  location: string | null
  completed_date: string | null
  cover_photo_url: string | null
  before_photo_url: string | null
  after_photo_url: string | null
  created_at: string
}

export type Certification = {
  id: string
  profile_id: string
  name: string
  issuing_org: string | null
  date_earned: string | null
  expiry_date: string | null
  created_at: string
}
