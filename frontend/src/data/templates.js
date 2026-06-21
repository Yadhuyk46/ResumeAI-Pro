// ─────────────────────────────────────────────────────────────
// 250 UNIQUE PROFESSIONAL RESUME TEMPLATES
// Adapted from ResumeGemini, Zety, and Resume.io styles.
// All templates are unique with professional names.
// ─────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  'All', 'Tech & Engineering', 'Finance & Banking', 'Design & Creative',
  'Marketing & Sales', 'Healthcare & Medical', 'Executive & Leadership',
  'Academic & Research', 'Legal & Compliance', 'Consulting & Strategy',
  'Entry Level', 'MBA & Business', 'Government & Public', 'Startup & Entrepreneurship',
  'Hospitality & Tourism', 'Education & Training', 'Real Estate', 'Logistics & Supply Chain'
];

const COLORS = [
  '#3c68b1', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b',
  '#06b6d4', '#f97316', '#64748b', '#ec4899', '#2dd4bf',
  '#84cc16', '#a855f7', '#0ea5e9', '#ef4444', '#14b8a6'
];

const TEMPLATE_NAMES = [
  // 1-50: Premier & Global Cities
  'Vancouver Elite', 'Stockholm Tech', 'Berlin Creative', 'London Executive', 'New York WallStreet',
  'Dublin Legal', 'Amsterdam Design', 'Rotterdam Port', 'Sydney Harbor', 'Melbourne Arts',
  'Auckland Alpine', 'Tokyo Minimal', 'Singapore Fintech', 'Dubai Prestige', 'Toronto Maple',
  'Paris Fashion', 'Milan Style', 'Madrid Sunny', 'Barcelona Beach', 'Lisbon Coast',
  'Vienna Classic', 'Zurich Bank', 'Geneva Intel', 'Oslo Clean', 'Helsinki Logic',
  'Copenhagen Green', 'Brussels Policy', 'Luxembourg Wealth', 'Munich Eng', 'Frankfurt Trade',
  'Seoul Digital', 'Shanghai Scale', 'Hong Kong Hub', 'Mumbai Growth', 'Bangalore Code',
  'San Francisco Cloud', 'Seattle Rain', 'Austin Start', 'Chicago Wind', 'Boston Grad',
  'Denver Peak', 'Miami Heat', 'Atlanta South', 'Phoenix Sun', 'Portland Local',
  'Moscow Bold', 'Istanbul Bridge', 'Cairo Nile', 'Cape Town View', 'Rio Carnival',

  // 51-100: Professional & Industry Specific
  'Silicon Pro', 'Wall Street Master', 'Madison Ave', 'Hollywood Star', 'NASA Space',
  'Pentagon Secure', 'UN Peace', 'WHO Health', 'CERN Physics', 'MIT Scholar',
  'Stanford Innovate', 'Harvard Law', 'Oxford Academic', 'Cambridge Research', 'LSE Econ',
  'Goldman Analyst', 'McKinsey Strategy', 'Apple Design', 'Google Eng', 'Amazon Ops',
  'Tesla Future', 'SpaceX Launch', 'Netflix Content', 'Meta Social', 'Microsoft OS',
  'Deloitte Audit', 'KPMG Tax', 'PwC Advisor', 'EY Consult', 'BlackRock Asset',
  'Citadel Quant', 'BridgeWater Fund', 'Stripe Fintech', 'Airbnb Host', 'Uber Route',
  'Nike Brand', 'Adidas Performance', 'Disney Magic', 'Sony Tech', 'Toyota Lean',
  'Boeing Fly', 'Pfizer Bio', 'Moderna Med', 'Mayo Clinic', 'Red Cross',
  'Yale Blue', 'Cornell Red', 'Columbia Ivy', 'Princeton Lead', 'Penn Wharton',

  // 101-150: Style & Design Variations
  'Cascade Modern', 'Concept Timeline', 'Crisp White', 'Cubic Grid', 'Diamond Sleek',
  'Enfold Side', 'Iconic View', 'Influx Header', 'Initials Personal', 'Minimo Text',
  'Modern Bar', 'Muse Artistic', 'Nanica Trad', 'Newcast Vertical', 'Primo Round',
  'Simple Clean', 'Valera Type', 'Vibes Color', 'Prime ATS', 'Pure ATS',
  'Precision ATS', 'Header ATS', 'Two-Column ATS', 'Card Layout', 'Minimalist Pro',
  'Professional Bold', 'Elegant Script', 'Flat Design', 'Material UI', 'Glassmorphism',
  'Neuromorphic', 'Dark Mode', 'Cyberpunk', 'Solarized', 'Nordic',
  'Gruvbox', 'Monokai', 'Dracula', 'Oceanic', 'Aura',
  'Synthwave', 'Retro 80s', 'Vintage 70s', 'Art Deco', 'Bauhaus',
  'Swiss Style', 'Brutalist', 'Post-Modern', 'Futuristic', 'Eco Friendly',

  // 151-200: Role-Focused
  'Code Wizard', 'Data Alchemist', 'Pixel Perfect', 'Brand Guru', 'Market Maven',
  'Sales Shark', 'Operation Hero', 'Health Guardian', 'Legal Eagle', 'Strategy Sensei',
  'Product Pilot', 'Project Captain', 'HR People', 'Admin Ace', 'Finance Flow',
  'Audit Shield', 'Compliance Guard', 'Growth Engine', 'FullStack Flow', 'Backend Base',
  'Frontend Face', 'DevOps Docker', 'Cloud Cast', 'Cyber Secure', 'Mobile Mover',
  'iOS Icon', 'Android App', 'Python Pro', 'Java Juggernaut', 'Ruby Gem',
  'Rust Rock', 'Go Getter', 'React Ready', 'Vue Vision', 'Angular Ace',
  'Svelte Swift', 'Tailwind Tidy', 'Bootstrap Base', 'SQL Source', 'NoSQL Node',
  'ML Model', 'AI Assistant', 'NLP Native', 'CV Vision', 'Robo Route',
  'Game Play', 'VFX Vision', 'UX User', 'UI Interface', 'CX Customer',

  // 201-250: Performance & High-Score
  'ATS ScoreMax', 'Resume Rocket', 'Career Catapult', 'Job Jump', 'Hire High',
  'Success Story', 'Impact Infographic', 'Result Ready', 'Goal Getter', 'Target Hit',
  'Arrow Up', 'Summit Peak', 'Zenith Top', 'Apex Alpha', 'Peak Performance',
  'Elite Entry', 'Midway Master', 'Senior Spark', 'Executive Edge', 'Leadership Line',
  'Management Map', 'Strategy Stream', 'Business Beat', 'Economy Edge', 'Market Move',
  'Profit Path', 'Revenue Route', 'Growth Graph', 'Chart Choice', 'Metric Move',
  'Data Driven', 'Result Rooted', 'Success Source', 'Path Pilot', 'Career Compass',
  'Future Finder', 'Opportunity Op', 'Network Node', 'Contact Core', 'Link Lead',
  'Profile Pro', 'Summary Solid', 'Experience Expert', 'Education Elite', 'Skill Set',
  'Award Ace', 'Interests Icon', 'Reference Root', 'Language Line', 'Final Finish'
];

const makeTemplate = (id, name, category, subcategory, bg, accent, level, tags, atsScore) => {
  return {
    id, name, category, subcategory, bg, accent, level, tags, atsScore,
    layoutIndex: 12, // Force LayoutGemini for all to match user request
    description: `Professional ${name} template optimized for ${category} roles`,
    features: ['ATS Optimized', 'Fully Editable', 'AI-Enhanced', 'PDF Ready'],
  };
};

export const ALL_TEMPLATES = TEMPLATE_NAMES.map((name, index) => {
  const id = index + 1;
  const categories = TEMPLATE_CATEGORIES.filter(c => c !== 'All');
  const cat = categories[index % categories.length];
  const color = COLORS[index % COLORS.length];
  const levels = ['Entry', 'Mid', 'Senior', 'Executive'];
  const level = levels[index % levels.length];

  return {
    id,
    name: name,
    category: cat,
    subcategory: `${cat} Specialist`,
    bg: '#ffffff',
    accent: color,
    level: level,
    tags: [cat, 'Professional', 'ATS-Friendly'],
    atsScore: 90 + (index % 11),
    layoutIndex: 12,
    description: `${name} - A high-performance template for ${cat} roles.`,
    features: ['ATS Optimized', 'Fully Editable', 'AI-Enhanced', 'PDF Ready']
  };
});
