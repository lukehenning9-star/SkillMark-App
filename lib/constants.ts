export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export const TRADES = [
  "Boilermaker",
  "Bricklayer / Mason",
  "Carpenter",
  "Concrete Worker",
  "Crane Operator",
  "Demolition Worker",
  "Drywall / Plasterer",
  "Electrician",
  "Elevator Mechanic",
  "Fence Installer",
  "Flooring Installer",
  "Glazier",
  "Heavy Equipment Operator",
  "HVAC Technician",
  "Industrial Mechanic",
  "Insulation Worker",
  "Ironworker",
  "Landscaper / Hardscape",
  "Millwright",
  "Painter",
  "Pipefitter",
  "Plumber",
  "Refrigeration Mechanic",
  "Roofer",
  "Sheet Metal Worker",
  "Solar Installer",
  "Sprinkler Fitter",
  "Tile Setter",
  "Welder",
] as const

export type Trade = typeof TRADES[number]

export const UNION_STATUS_OPTIONS = [
  "Union Member",
  "Non-Union",
  "Open to Both",
] as const

export type UnionStatus = typeof UNION_STATUS_OPTIONS[number]

export const PROJECT_SKILLS = [
  "Panel Work","Conduit Bending","Rough-In Wiring","Service Upgrade",
  "Low Voltage","Commercial Wiring","Residential Wiring",
  "HVAC Install","HVAC Repair","Duct Work",
  "Plumbing Rough-In","Water Heater Install","Drain Work","Gas Line",
  "Framing","Finish Carpentry","Structural Welding","Pipe Welding",
  "Pipe Fitting","Other",
] as const

export const SUGGESTED_CERTS = [
  "OSHA-10","OSHA-30","EPA 608","NFPA 70E","NCCER Core",
  "First Aid/CPR","TX Journeyman License","TX Master License",
] as const
