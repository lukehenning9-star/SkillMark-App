export type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
}

export type AccountType = "worker" | "company"

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+"

export type Profile = {
  id: string
  username: string
  account_type: AccountType
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
  // Company-account fields (null / empty for worker accounts)
  website: string | null
  company_size: CompanySize | null
  hiring_trades: string[]
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
  post_to_feed: boolean
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

export type ConnectionStatus = "pending" | "accepted"

export type Connection = {
  id: string
  requester_id: string
  addressee_id: string
  status: ConnectionStatus
  created_at: string
  responded_at: string | null
}

export type CollaboratorStatus = "invited" | "requested" | "accepted"

export type ProjectCollaborator = {
  id: string
  project_id: string
  profile_id: string
  status: CollaboratorStatus
  contribution: string | null
  invited_by: string | null
  created_at: string
  responded_at: string | null
}

// A collaborator row joined with the person's public profile fields, for display.
export type CollaboratorWithProfile = ProjectCollaborator & {
  profile: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "trade"> | null
}

export type ProjectPhoto = {
  id: string
  project_id: string
  photo_url: string
  caption: string | null
  display_order: number
  uploaded_by: string | null
  created_at: string
}

export type ProjectComment = {
  id: string
  project_id: string
  profile_id: string
  content: string
  created_at: string
  profile?: Pick<Profile, "username" | "full_name" | "avatar_url"> | null
}

// A ranked collaborator for the "who you work with most" tracker.
export type TopCollaborator = {
  profile: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "trade">
  shared_count: number
}

// A project as it appears in the ranked feed, with engagement + author.
export type FeedProject = Project & {
  author: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "trade"> | null
  like_count: number
  comment_count: number
  liked_by_me: boolean
  from_connection: boolean
}

export type Subscription = {
  profile_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: string | null
  price_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  updated_at: string
}

export type ReferralStatus = "pending" | "rewarded" | "pending_review" | "rejected"

export type Referral = {
  id: string
  referrer_id: string
  referred_id: string
  code_used: string | null
  status: ReferralStatus
  created_at: string
  activated_at: string | null
  rewarded_at: string | null
}

export type ReferralStats = {
  code: string
  pending: number
  rewarded: number
  review: number
  monthsEarned: number
}

export type Notification = {
  id: string
  profile_id: string
  type: string
  title: string
  body: string | null
  read: boolean
  link: string | null
  created_at: string
}
