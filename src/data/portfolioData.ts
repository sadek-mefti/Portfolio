import { PARTNERS, PartnerItem } from './brandLogos';

export interface DeploymentGroupItem {
  id: string;
  group: string;
  when: string;
  text: string;
}

export interface DeploymentCardItem {
  id: string;
  feature?: boolean;
  art: 'coverage' | 'greet' | 'screen' | 'bench';
  title: string;
  site: string;
  note: string;
  defaultPhoto: string;
  photoPosition?: string;
  platformBadge: string;
  specs: {
    platform: string;
    navigation: string;
    capacityOrMode: string;
    efficiencyOrRuntime: string;
    partnerScope: string;
    region: string;
  };
}

export type DeploymentEntry = DeploymentGroupItem | DeploymentCardItem;

export function isGroupEntry(item: DeploymentEntry): item is DeploymentGroupItem {
  return 'group' in item;
}

export interface FigureItem {
  id: string;
  prefix?: string;
  count: number;
  suffix: string;
  caption: string;
}

export interface CustomSectionCardItem {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  image?: string;
}

export interface SectionConfig {
  id: string;
  type: 'figures' | 'deployments' | 'clients' | 'experience' | 'projects' | 'toolkit' | 'contact' | 'custom';
  navLabel: string;
  showInNav: boolean;
  visible: boolean;
  title: string;
  lede: string;
  bgColorOverride?: string;
  textColorOverride?: string;
  titleScale?: number;
  bodyScale?: number;
  customLayout?: 'cards' | 'list' | 'metrics';
  customItems?: CustomSectionCardItem[];
}

export interface ToolkitCategory {
  id: string;
  title: string;
  items: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  year: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  details: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface HeroContent {
  brandName: string;
  headerCtaText: string;
  headerCtaHref: string;
  firstName: string;
  lastName: string;
  pitchLead: string;
  pitchSub: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
  hudLabel: string;
  hudHint: string;
}

export interface ContactContent {
  heading: string;
  email: string;
  phoneLabel: string;
  phoneDisplay: string;
  phoneHref: string;
  linkedinLabel: string;
  linkedinDisplay: string;
  linkedinHref: string;
  locationLabel: string;
  locationDisplay: string;
  copyright: string;
}

export interface StyleOverrides {
  heroTitleScale: number;
  sectionHeadingScale: number;
  cardTitleScale: number;
  bodyTextScale: number;
  kpiNumberScale: number;
  customColors: {
    heroBg?: string;
    heroInk?: string;
    heroMuted?: string;
    botColor?: string;
    beaconColor?: string;
    pageBg?: string;
    panelBg?: string;
    inkColor?: string;
    mutedColor?: string;
    lineColor?: string;
    hiBg?: string;
    hiInk?: string;
    markColor?: string;
  };
  textStyles: Record<
    string,
    {
      fontSizePct?: number;
      color?: string;
    }
  >;
}

export interface SeoConfig {
  siteTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  ogBannerKicker: string;
  ogBannerHeadline: string;
  ogBannerSubline: string;
  jobTitle: string;
  worksFor: string;
}

export const DEFAULT_HERO: HeroContent = {
  brandName: 'Sadek Mefti',
  headerCtaText: 'Email me',
  headerCtaHref: 'mailto:sadekmefti@gmail.com',
  firstName: 'Sadek',
  lastName: 'Mefti',
  pitchLead: 'Technical solutions lead. I deploy autonomous robot fleets and build the AI and automation around them.',
  pitchSub:
    'Based in Dubai, working across the UAE and Saudi Arabia in Arabic, French and English, with over a decade in B2B technical sales.',
  ctaPrimaryText: 'See the deployments',
  ctaPrimaryHref: '#deployments',
  ctaSecondaryText: 'Open LinkedIn',
  ctaSecondaryHref: 'https://www.linkedin.com/in/sadekmefti/',
  hudLabel: 'of this floor covered.',
  hudHint: 'Click the floor to drop an obstacle and the robot replans.'
};

export const DEFAULT_FIGURES: FigureItem[] = [
  {
    id: 'fig-1',
    count: 150,
    suffix: '+',
    caption:
      'commercial robots deployed and maintained across UAE sites, including Dubai International Airport and Dubai Mall'
  },
  {
    id: 'fig-2',
    prefix: 'AED',
    count: 15,
    suffix: 'M+',
    caption: 'total value of that autonomous fleet'
  },
  {
    id: 'fig-3',
    prefix: 'AED',
    count: 40,
    suffix: 'M+',
    caption: 'enterprise deal with Du, secured with Samsung Gulf and Grabba'
  },
  {
    id: 'fig-4',
    prefix: 'AED',
    count: 3,
    suffix: 'M+',
    caption: 'in robotics sales to government and semi-government entities'
  }
];

export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: 'figures',
    type: 'figures',
    navLabel: 'Figures',
    showInNav: false,
    visible: true,
    title: 'Key Figures',
    lede: ''
  },
  {
    id: 'deployments',
    type: 'deployments',
    navLabel: 'Deployments',
    showInNav: true,
    visible: true,
    title: 'Robots in the field',
    lede: 'Cleaning fleets, humanoids and service robots I have deployed, demonstrated and repaired on site.'
  },
  {
    id: 'clients',
    type: 'clients',
    navLabel: 'Clients',
    showInNav: true,
    visible: true,
    title: 'Clients',
    lede: 'Organizations I have worked with directly across the GCC.'
  },
  {
    id: 'experience',
    type: 'experience',
    navLabel: 'Experience',
    showInNav: true,
    visible: true,
    title: 'Experience',
    lede: ''
  },
  {
    id: 'projects',
    type: 'projects',
    navLabel: 'Projects',
    showInNav: true,
    visible: true,
    title: 'Built and shipped',
    lede: 'The integrations, tools and practices behind the deals.'
  },
  {
    id: 'toolkit',
    type: 'toolkit',
    navLabel: 'Toolkit',
    showInNav: true,
    visible: true,
    title: 'Toolkit',
    lede: ''
  },
  {
    id: 'contact',
    type: 'contact',
    navLabel: 'Contact',
    showInNav: true,
    visible: true,
    title: 'Get in touch',
    lede: ''
  }
];

export const DEPLOYMENTS: DeploymentEntry[] = [
  {
    id: 'group-softbank',
    group: 'SoftBank Robotics',
    when: 'July 2026 to now',
    text: 'Autonomous cleaning fleets across the UAE and Saudi Arabia.'
  },
  {
    id: 'fleet',
    feature: true,
    art: 'coverage',
    title: '150+ robot cleaning fleet',
    site: 'Dubai International Airport, Dubai Mall and more',
    note: 'Deployment, lifecycle maintenance and partner success for a fleet worth over AED 15 million, run with facilities partners EFS, Transguard and Farnek.',
    defaultPhoto: '/src/assets/images/robot_fleet_airport_1794743261221.jpg',
    photoPosition: 'center center',
    platformBadge: '150+ Active Units · AED 15M+ Fleet',
    specs: {
      platform: 'Gausium (Omnie, Scrubber 50, Phantas) & Whiz',
      navigation: '3D/2D LiDAR SLAM & BrainOS Vision',
      capacityOrMode: 'Synchronized multi-terminal fleet operations',
      efficiencyOrRuntime: 'Up to 3,931 m²/h per heavy-duty unit',
      partnerScope: 'EFS, Transguard Group, Farnek SLA Lead',
      region: 'Dubai International Airport (DXB) & Dubai Mall'
    }
  },
  {
    id: 'gausium-phantas',
    art: 'coverage',
    title: 'Gausium Phantas',
    site: 'SoftBank Robotics fleet, UAE',
    note: 'Rolled out in synchronized deployments with a two-person engineering team.',
    defaultPhoto: '/src/assets/images/robot_gausium_phantas_1794743262350.jpg',
    photoPosition: 'center center',
    platformBadge: '4-in-1 Compact AI Cleaner',
    specs: {
      platform: 'Gausium Phantas Commercial Cobot',
      navigation: '2D/3D LiDAR + RGB-D AI Floor Recognition',
      capacityOrMode: '4-in-1 Scrubbing, Sweeping, Vacuuming, Dust Mopping',
      efficiencyOrRuntime: 'Up to 4.5 hrs runtime · Zero-distance edge cleaning',
      partnerScope: 'Synchronized rollout & FM crew training',
      region: 'UAE Commercial Towers & Hospitality'
    }
  },
  {
    id: 'gausium-omnie',
    art: 'coverage',
    title: 'Gausium Omnie',
    site: 'SoftBank Robotics fleet, UAE',
    note: 'Kept running with on-site electro-mechanical diagnostics and repairs.',
    defaultPhoto: '/src/assets/images/robot_gausium_scrubber_1794743263328.jpg',
    photoPosition: 'center 35%',
    platformBadge: '3D LiDAR · 360° OmniVision',
    specs: {
      platform: 'Gausium Omnie Heavy-Duty Scrubber',
      navigation: '3D LiDAR + 360° Panoramic Cameras',
      capacityOrMode: '33L Clean / 24L Recovery Tank + Pre-sweep',
      efficiencyOrRuntime: 'Up to 2,621 m²/h scrubbing · 3,931 m²/h sweeping',
      partnerScope: 'Electro-mechanical L1–L3 diagnostics & SLA',
      region: 'Airports & High-Footfall Concourses, UAE'
    }
  },
  {
    id: 'gausium-scrubber-50',
    art: 'coverage',
    title: 'Gausium Scrubber 50',
    site: 'SoftBank Robotics fleet, UAE',
    note: 'Tracked through cloud IoT telemetry for utilization and performance reporting.',
    defaultPhoto: '/src/assets/images/robot_gausium_scrubber_1794743263328.jpg',
    photoPosition: '65% 60%',
    platformBadge: '30L Tank · Cloud IoT Telemetry',
    specs: {
      platform: 'Gausium Scrubber 50 Pro',
      navigation: '2D LiDAR + 3D Depth & RGB Sensor Fusion',
      capacityOrMode: '30L Clean / 24L Waste Water · 25 kg brush pressure',
      efficiencyOrRuntime: 'Up to 1,490 m²/h practical · 60 Ah LiFePO4',
      partnerScope: 'Cloud IoT telemetry & automated ROI reporting',
      region: 'Malls, Healthcare & Retail Atriums, UAE & KSA'
    }
  },
  {
    id: 'whiz',
    art: 'coverage',
    title: 'Whiz',
    site: 'SoftBank Robotics fleet, UAE',
    note: 'Launched with SOPs, onboarding guides and field service documentation for partners.',
    defaultPhoto: '/src/assets/images/robot_whiz_pudu_1794743263969.jpg',
    photoPosition: 'center top',
    platformBadge: 'BrainOS · HEPA Commercial Vacuum',
    specs: {
      platform: 'SoftBank Robotics Whiz (Powered by BrainOS)',
      navigation: 'Teach-and-Repeat LiDAR & 3D Obstacle Avoidance',
      capacityOrMode: '4.0L HEPA filtration bag (99.97% PM2.5)',
      efficiencyOrRuntime: 'Up to 1,500 m² per charge · 3 hrs normal runtime',
      partnerScope: 'Regional launch SOPs, onboarding & service playbooks',
      region: 'UAE & KSA Hospitality and Corporate Offices'
    }
  },
  {
    id: 'group-jackys',
    group: 'Jacky’s Business Solutions',
    when: 'September 2022 to February 2024',
    text: 'Pre-sales, live proofs of concept and exhibitions for humanoid, service and cleaning robots.'
  },
  {
    id: 'pudu-cc1',
    art: 'coverage',
    title: 'Pudu CC1',
    site: 'Jumeirah Emirates Towers, Dubai',
    note: 'Cleaning robot deployment, August 2023.',
    defaultPhoto: '/src/assets/images/robot_whiz_pudu_1794743263969.jpg',
    photoPosition: 'center 70%',
    platformBadge: 'PUDU SLAM · Jumeirah Deployment',
    specs: {
      platform: 'Pudu Robotics CC1 4-in-1 Cleaner',
      navigation: 'PUDU VSLAM+ & Multi-Sensor LiDAR Fusion',
      capacityOrMode: '15L Clean / 15L Waste Tank · 500 mm cleaning width',
      efficiencyOrRuntime: '700–1,000 m²/h coverage · Automatic dock refill',
      partnerScope: 'Site mapping, deployment & operator handover',
      region: 'Jumeirah Emirates Towers, Dubai (Aug 2023)'
    }
  },
  {
    id: 'pepper-ecae',
    art: 'greet',
    title: 'SoftBank Robotics Pepper',
    site: 'Emirates College for Advanced Education',
    note: 'On the stand at Gitex 2023.',
    defaultPhoto: '/src/assets/images/robot_pepper_humanoid_1794743266194.jpg',
    photoPosition: 'center 25%',
    platformBadge: '20-DOF Humanoid · GITEX 2023',
    specs: {
      platform: 'SoftBank Robotics Pepper (120 cm Humanoid)',
      navigation: 'Omnidirectional 3-wheel base + 3D depth & sonar',
      capacityOrMode: '20 degrees of freedom + 10.1" chest touch display',
      efficiencyOrRuntime: 'Up to 12 hrs battery life · Multi-lingual dialogue',
      partnerScope: 'Custom exhibition workflow & live stand deployment',
      region: 'GITEX Global 2023 — ECAE Stand, Dubai'
    }
  },
  {
    id: 'pepper-gems',
    art: 'greet',
    title: 'SoftBank Robotics Pepper',
    site: 'GEMS School',
    note: 'Live proof of concept on site.',
    defaultPhoto: '/src/assets/images/robot_pepper_humanoid_1794743266194.jpg',
    photoPosition: 'center 55%',
    platformBadge: 'Education & STEM Live POC',
    specs: {
      platform: 'SoftBank Robotics Pepper Education Edition',
      navigation: 'NAOqi OS + QiSDK Android Tablet Integration',
      capacityOrMode: 'Interactive student greeting & curriculum demo',
      efficiencyOrRuntime: '4 directional microphones + HD cameras',
      partnerScope: 'On-site proof of concept & stakeholder demo',
      region: 'GEMS Education Campus, UAE'
    }
  },
  {
    id: 'digital-avatar',
    art: 'screen',
    title: 'Digital avatar',
    site: 'Etihad Water and Electricity',
    note: 'A first digital avatar proof of concept, with Humanizing Technologies, at Gitex 2023.',
    defaultPhoto: '/src/assets/images/robot_pepper_humanoid_1794743266194.jpg',
    photoPosition: 'center 40%',
    platformBadge: 'Interactive AI Kiosk · GITEX 2023',
    specs: {
      platform: 'Humanizing Technologies Digital Avatar Kiosk',
      navigation: 'Real-time Vision Presence Detection + Voice NLP',
      capacityOrMode: 'Conversational AI customer service & utility inquiries',
      efficiencyOrRuntime: 'Low-latency speech synthesis in Arabic & English',
      partnerScope: 'First-of-its-kind regional POC for Etihad WE',
      region: 'GITEX Global 2023 — Federal Government Pavilion'
    }
  },
  {
    id: 'pepper-nao-hitex',
    art: 'greet',
    title: 'Pepper and Nao',
    site: 'Hitex 2023, Erbil, Iraq',
    note: 'Exhibition demonstrations on the show floor.',
    defaultPhoto: '/src/assets/images/robot_nao_bench_1794743268270.jpg',
    photoPosition: 'center 25%',
    platformBadge: 'Dual Humanoid Showcase · HITEX 2023',
    specs: {
      platform: 'SoftBank Robotics Pepper & Nao V6 Pair',
      navigation: 'Synchronized choreography & crowd engagement',
      capacityOrMode: '25-DOF Nao + 20-DOF Pepper live floor demos',
      efficiencyOrRuntime: 'Continuous multi-day exhibition operation',
      partnerScope: 'International logistics, programming & floor lead',
      region: 'HITEX 2023 Technology Expo, Erbil'
    }
  },
  {
    id: 'pepper-tv',
    art: 'greet',
    title: 'SoftBank Robotics Pepper',
    site: 'Kurdistan National TV',
    note: 'Live demonstration for the broadcaster.',
    defaultPhoto: '/src/assets/images/robot_pepper_humanoid_1794743266194.jpg',
    photoPosition: '40% 30%',
    platformBadge: 'Live Broadcast Demonstration',
    specs: {
      platform: 'SoftBank Robotics Pepper Broadcast Setup',
      navigation: 'Studio-calibrated voice recognition & gesture sync',
      capacityOrMode: 'Live on-air interview & interactive Q&A with anchors',
      efficiencyOrRuntime: 'Zero-drop wireless studio telemetry',
      partnerScope: 'Technical director & live broadcast operator',
      region: 'Kurdistan National TV Studio'
    }
  },
  {
    id: 'temi-hitex',
    art: 'greet',
    title: 'Temi',
    site: 'Hitex 2023',
    note: 'Service robot demonstrations for visitors.',
    defaultPhoto: '/src/assets/images/robot_gausium_phantas_1794743262350.jpg',
    photoPosition: 'center 60%',
    platformBadge: 'Autonomous Wayfinding & Telepresence',
    specs: {
      platform: 'Temi V3 Autonomous Service Robot',
      navigation: 'ROBOX Navigation (360° LiDAR + Depth Cameras)',
      capacityOrMode: '13.3" tiltable HD screen + autonomous visitor escort',
      efficiencyOrRuntime: 'Up to 8 hrs runtime · 1 m/s dynamic pathing',
      partnerScope: 'Booth mapping, waypoint programming & live demos',
      region: 'HITEX 2023 Exhibition Floor'
    }
  },
  {
    id: 'nao-repair',
    art: 'bench',
    title: 'SoftBank Robotics Nao',
    site: 'Workshop repair',
    note: 'Bench diagnosis and repair of a Nao humanoid.',
    defaultPhoto: '/src/assets/images/robot_nao_bench_1794743268270.jpg',
    photoPosition: 'center center',
    platformBadge: '25-DOF Actuator & PCB Diagnostics',
    specs: {
      platform: 'SoftBank Robotics Nao Humanoid (58 cm)',
      navigation: '25-DOF Brushless Motors + Magnetic Rotary Encoders',
      capacityOrMode: 'Joint actuator teardown, harness & sensor calibration',
      efficiencyOrRuntime: 'Full kinematics verification & thermal stress test',
      partnerScope: 'Component-level electro-mechanical bench repair',
      region: 'Dubai Technical Service Workshop'
    }
  }
];

export const SECTORS: [string, string][] = [
  ['all', 'All'],
  ['fm', 'Facilities management'],
  ['venue', 'Real estate and aviation'],
  ['gov', 'Government and utilities'],
  ['telecom', 'Telecom'],
  ['security', 'Security'],
  ['health', 'Healthcare']
];

export interface ClientItem {
  key: string;
  name: string;
  short?: string;
  sector: string;
  does: string;
}

export const CLIENTS: ClientItem[] = [
  { key: 'transguard', name: 'Transguard Group', sector: 'fm', does: 'Aviation and facility management' },
  { key: 'farnek', name: 'Farnek', sector: 'fm', does: 'Smart FM and sustainability' },
  { key: 'efs', name: 'EFS Facilities Services', short: 'EFS', sector: 'fm', does: 'Global FM operations' },
  { key: 'emaar', name: 'Emaar', sector: 'venue', does: 'Hospitality and real estate' },
  { key: 'dubai-airports', name: 'Dubai Airports', sector: 'venue', does: 'Terminal fleet robotics' },
  { key: 'al-yalayis', name: 'Al Yalayis', sector: 'gov', does: 'Government services center' },
  { key: 'du', name: 'du', sector: 'telecom', does: '5G IoT and autonomous nodes' },
  { key: 'eand', name: 'e& (Etisalat)', short: 'e&', sector: 'telecom', does: 'Telecom infrastructure' },
  { key: 'dewa', name: 'DEWA', sector: 'gov', does: 'Water and power facilities' },
  { key: 'etihad-we', name: 'Etihad Water and Electricity', short: 'Etihad WE', sector: 'gov', does: 'Federal utility authority' },
  { key: 'dubai-police', name: 'Dubai Police', sector: 'security', does: 'Smart patrols and stations' },
  { key: 'moi', name: 'Ministry of Interior', sector: 'security', does: 'Federal security facilities' },
  { key: 'mohap', name: 'Ministry of Health and Prevention', short: 'MOHAP', sector: 'health', does: 'Federal health facilities' },
  { key: 'dha', name: 'Dubai Health Authority', sector: 'health', does: 'Dubai hospitals and clinics' },
  { key: 'doh', name: 'Department of Health Abu Dhabi', short: 'DoH Abu Dhabi', sector: 'health', does: 'Capital health authority' },
  { key: 'burjeel', name: 'Burjeel Holdings', sector: 'health', does: 'Specialized hospital chain' },
  { key: 'saudi-german', name: 'Saudi German Health', sector: 'health', does: 'Tertiary medical hospitals' },
  { key: 'sulaiman-al-habib', name: 'Dr. Sulaiman Al Habib', sector: 'health', does: 'Regional medical centers' }
];

export interface ExperienceItem {
  id: string;
  when: string;
  role: string;
  org: string;
  defaultOpen?: boolean;
  bullets?: string[];
  subRoles?: {
    title: string;
    bullets: string[];
  }[];
}

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'xp1',
    when: 'Jul 2026 to now',
    role: 'Robotics Technical Lead, UAE and KSA',
    org: 'SoftBank Robotics UK Ltd (EMEA HQ), Dubai, remote',
    defaultOpen: true,
    bullets: [
      'Lead a two-person engineering team running synchronized deployments of Gausium (Phantas, Omnie, Scrubber 50) and Whiz fleets at high-profile sites including Dubai International Airport and Dubai Mall.',
      'Primary technical authority for tier-1 facilities management partners EFS, Transguard and Farnek, covering operational workflows, field training and SLA adherence.',
      'On-site electro-mechanical diagnostics and repairs to keep fleet uptime high, with cloud IoT telemetry feeding automated utilization and performance reports.',
      'Technical and value-engineering sessions in Arabic, French and English that prove ROI to enterprise decision-makers.',
      'Author of the regional launch SOPs, onboarding guides and field service documentation for new robot platforms.'
    ]
  },
  {
    id: 'xp2',
    when: 'Mar 2024 to Apr 2026',
    role: 'Presales and Solutions Engineer',
    org: 'Manteq Systems & Information Technology, Dubai, hybrid',
    bullets: [
      'Ran demonstrations and proofs of concept for enterprise healthcare clients looking for end-to-end revenue cycle management.',
      'Built and deployed custom serverless API endpoints on AWS Lambda to speed up client integrations and technical validations.',
      'Built internal applications in Python and HTML, integrating REST APIs with CORS, JWT/OAuth and JSON/XML data formats.',
      'Primary technical liaison between engineering teams and decision-makers across UAE healthcare facilities, mapping integrations step by step.',
      'Designed API validation protocols and test environments that cut partner onboarding time.'
    ]
  },
  {
    id: 'xp3',
    when: 'Sep 2022 to Feb 2024',
    role: 'Technical Sales Engineer, pre and post sales',
    org: 'Jacky’s Business Solutions LLC, Dubai, hybrid',
    bullets: [
      'Pre-sales, deployment and live proofs of concept for autonomous robots from SoftBank Robotics, Pudu Robotics and Temi.',
      'Regional B2B growth and solution delivery as Samsung’s first MSP Premium Partner in the GCC.',
      'Certified Samsung Knox Professional and B2B Devices Expert, configuring MDM policies, containerization and E-FOTA.',
      'Technical implementation and pilot testing of AI-powered hospitality and service robots in commercial venues.',
      'Trusted relationships with enterprise clients and telecom operators across the UAE.'
    ]
  },
  {
    id: 'xp4',
    when: 'Dec 2018 to Aug 2022',
    role: 'Customer Success and Support Specialist',
    org: 'Concentrix (formerly Webhelp)',
    subRoles: [
      {
        title: 'Customer Success Specialist, Jun 2020 to Aug 2022, full-time',
        bullets: [
          'Used Salesforce Einstein AI to analyze customer data, predict churn risk and raise satisfaction.',
          'Beat targets, leading the team to generate €100K a year through account optimization.',
          'Ran regular client follow-ups and product training sessions.'
        ]
      },
      {
        title: 'Customer Support Specialist, Dec 2018 to Jun 2020, part-time',
        bullets: [
          'Technical support for Bouygues Télécom customers on fiber, DSL, VoIP and IPTV.',
          'Generated €1,000 a month in incremental value alongside top-tier troubleshooting.'
        ]
      }
    ]
  },
  {
    id: 'xp5',
    when: 'Since 2012',
    role: 'Automation Expert and Website Developer',
    org: 'Freelance, remote',
    bullets: [
      'Designed and launched more than 30 websites for e-commerce, blogging and travel clients.',
      'Built web applications, platforms and Android apps on Supabase and SQL for real-time data.',
      'Built automated content pipelines and AI agents on OpenAI, Gemini, Claude, LLaMA and DeepSeek.',
      'Deployed AWS Lambda endpoints and Google Cloud Vertex AI for tool integration and content generation.'
    ]
  },
  {
    id: 'xp6',
    when: 'Since 2010',
    role: 'Sales Assistant Manager',
    org: 'Samir Mefti Electronics & Home Appliances, part-time, on site',
    bullets: [
      'Ran daily retail operations, face-to-face customer service and inventory.',
      'Drove upselling and cross-selling across audio-visual equipment, satellite receivers and TV memberships.',
      'Hands-on with DSL, IPTV, network tools, micro-controllers and hardware repair.'
    ]
  }
];

export interface ProjectItem {
  id: string;
  title: string;
  where: string;
  what: string;
  tags: string[];
  architectureNotes: string[];
  outcomeMetric: string;
}

export const PROJECTS: ProjectItem[] = [
  {
    id: 'fleet-telemetry',
    title: 'Fleet telemetry reporting',
    where: 'SoftBank Robotics',
    what: 'Cloud IoT telemetry from the robot fleet turned into automated utilization analytics and performance reports.',
    tags: ['IoT telemetry', 'Workflow automation', 'Reporting'],
    architectureNotes: [
      'Aggregates daily autonomous run logs, cleaned square meterage, battery health, and fault codes from Gausium Cloud and BrainOS.',
      'Transforms raw site telemetry into executive SLA scorecards for EFS, Transguard, and Farnek operations leads.',
      'Flags under-utilized units and preventative maintenance intervals before unplanned downtime occurs.'
    ],
    outcomeMetric: '150+ robots tracked across DXB & Dubai Mall'
  },
  {
    id: 'launch-playbooks',
    title: 'Regional launch playbooks',
    where: 'SoftBank Robotics',
    what: 'Deployment SOPs, technical onboarding guides and field service documentation that shorten a partner’s time to value on a new robot platform.',
    tags: ['SOPs', 'Partner enablement', 'Field service'],
    architectureNotes: [
      'Standardized 4-stage rollout protocol: Site SLAM Audit → Safety Zone Calibration → Multilingual Operator Training (AR/FR/EN) → SLA Handover.',
      'L1–L3 electro-mechanical troubleshooting matrices for field technicians.',
      'Cut new platform onboarding time for facilities management partners across the UAE and KSA.'
    ],
    outcomeMetric: 'Standardized across Tier-1 GCC FM partners'
  },
  {
    id: 'serverless-endpoints',
    title: 'Serverless integration endpoints',
    where: 'Manteq Systems',
    what: 'Custom API endpoints on AWS Lambda that speed up client integrations and technical validations for a healthcare revenue cycle management platform.',
    tags: ['AWS Lambda', 'REST APIs', 'JWT and OAuth', 'JSON and XML'],
    architectureNotes: [
      'Stateless AWS Lambda middleware bridging hospital EMR/HIS systems with regional claims and revenue cycle engines.',
      'Handles OAuth 2.0 / JWT token verification, CORS preflight enforcement, and bidirectional JSON ⇄ XML payload transformation.',
      'Eliminated weeks of custom hospital side-car development during enterprise presales cycles.'
    ],
    outcomeMetric: 'Zero-infrastructure serverless validation'
  },
  {
    id: 'healthcare-poc',
    title: 'Proof-of-concept apps for healthcare',
    where: 'Manteq Systems',
    what: 'AI-assisted web and desktop prototypes in Python and HTML that demonstrate API integrations and data exchange live during a POC, plus the validation protocols and test environments around them.',
    tags: ['Python', 'HTML', 'CORS', 'API testing'],
    architectureNotes: [
      'Interactive Python & HTML test harnesses built for live C-suite and clinical IT demonstrations.',
      'Simulates end-to-end claim submission, coding validation, and real-time adjudication responses against DHA, DoH, and MOHAP schemas.',
      'Includes automated schema validation suites that cut partner onboarding friction.'
    ],
    outcomeMetric: 'Accelerated healthcare POC sign-offs'
  },
  {
    id: 'samsung-knox',
    title: 'Samsung Knox managed service practice',
    where: 'Jacky’s Business Solutions',
    what: 'Enterprise mobility delivery for Samsung’s first MSP Premium Partner in the GCC, including the AED 40M+ Du deal secured with Samsung Gulf and Grabba.',
    tags: ['Samsung Knox', 'MDM policies', 'Containerization', 'E-FOTA'],
    architectureNotes: [
      'Architected zero-touch Knox Mobile Enrollment (KME), workspace containerization, and Knox E-FOTA firmware control for mission-critical field devices.',
      'Integrated Grabba biometric/smartcard hardware enclosures with Samsung enterprise devices over custom telecom APN policies.',
      'Core technical pillar behind the landmark AED 40M+ enterprise mobility contract with du and Samsung Gulf.'
    ],
    outcomeMetric: 'AED 40M+ enterprise deal secured'
  },
  {
    id: 'digital-avatar-poc',
    title: 'Digital avatar proof of concept',
    where: 'Jacky’s Business Solutions',
    what: 'A first-of-its-kind digital avatar POC from Humanizing Technologies for Etihad Water and Electricity, shown live at Gitex 2023.',
    tags: ['Digital avatar', 'Live POC', 'Gitex 2023'],
    architectureNotes: [
      'Deployed an interactive, life-size AI digital human kiosk capable of real-time spoken dialogue for utility customer service.',
      'Integrated knowledge base routing for Etihad Water and Electricity (Etihad WE) billing and service inquiries.',
      'Demonstrated live to federal officials and thousands of visitors on the GITEX Global 2023 show floor.'
    ],
    outcomeMetric: 'Featured live at GITEX Global 2023'
  },
  {
    id: 'ai-agents',
    title: 'AI agents and content pipelines',
    where: 'Freelance',
    what: 'Bots, agents and automated publishing pipelines for client sites, combining LLMs with image and video generation models.',
    tags: ['Make.com', 'OpenAI', 'Gemini', 'Claude', 'Vertex AI', 'Runware'],
    architectureNotes: [
      'Multi-step Make.com and serverless orchestration pipelines connecting Gemini, GPT, Claude, and DeepSeek with visual models (Veo, FLUX, Runware).',
      'Automated research, structured drafting, schema markup generation, and multi-channel CMS publishing.',
      'Built custom guardrails and webhook retry logic for autonomous 24/7 operation.'
    ],
    outcomeMetric: 'End-to-end multi-model automation'
  },
  {
    id: 'websites-apps',
    title: '30+ websites and apps',
    where: 'Freelance',
    what: 'E-commerce, blogging and travel sites, plus web platforms and Android apps with real-time data.',
    tags: ['Supabase', 'SQL', 'Android', 'Google CAPTCHA'],
    architectureNotes: [
      'Full-stack web platforms and native Android applications backed by Supabase PostgreSQL, Row-Level Security, and real-time subscriptions.',
      'Custom e-commerce checkout flows, travel booking engines, and high-traffic editorial sites.',
      'Hardened with Google reCAPTCHA, edge caching, and responsive mobile-first layouts.'
    ],
    outcomeMetric: '30+ production launches since 2012'
  }
];

export const DEFAULT_TOOLKIT_CATEGORIES: ToolkitCategory[] = [
  {
    id: 'kit-1',
    title: 'Robotics and field',
    items: [
      'Gausium Phantas, Omnie, Scrubber 50',
      'SoftBank Robotics Whiz, Pepper, Nao',
      'Pudu Robotics, Temi',
      'Electro-mechanical diagnostics',
      'IoT telemetry and fleet analytics',
      'Aftermarket operations'
    ]
  },
  {
    id: 'kit-2',
    title: 'Enterprise mobility',
    items: [
      'Samsung Knox suite',
      'MDM policy design',
      'Containerization and E-FOTA',
      'Android Enterprise',
      'ManageEngine'
    ]
  },
  {
    id: 'kit-3',
    title: 'AI and automation',
    items: [
      'Make.com, advanced',
      'OpenAI GPT, Gemini, Claude, LLaMA',
      'Grok, Qwen3, DeepSeek',
      'Veo, Midjourney, FLUX, Kling AI, Recraft',
      'Vertex AI, Salesforce Einstein'
    ]
  },
  {
    id: 'kit-4',
    title: 'Cloud and code',
    items: [
      'AWS Lambda, Google Cloud',
      'REST APIs, JWT/OAuth, CORS',
      'Python, SQL, Supabase',
      'C, C++, C#, Java',
      'LabVIEW, VHDL, Ladder Logic, Matlab'
    ]
  }
];

export const DEFAULT_CERTIFICATIONS: CertificationItem[] = [
  { id: 'cert-1', name: 'Make.com Automation, Advanced', year: '2025' },
  { id: 'cert-2', name: 'Android Enterprise Associate, Google', year: '2023' },
  { id: 'cert-3', name: 'Samsung Knox Professional', year: '2023' },
  { id: 'cert-4', name: 'Samsung Mobile B2B Expert', year: '2023' },
  { id: 'cert-5', name: 'Samsung Knox Associate', year: '2023' },
  { id: 'cert-6', name: 'ManageEngine Product Associate', year: '2023' },
  { id: 'cert-7', name: 'Agile Framework Fundamentals, Udacity', year: '2023' }
];

export const DEFAULT_EDUCATION: EducationItem[] = [
  {
    id: 'edu-1',
    degree: 'Master’s in Automation and Control Systems',
    details: 'Blida 1 University, 2018 to 2020. Thesis on improving a TRIA 35 30 XTBM plastic crushing machine.'
  },
  {
    id: 'edu-2',
    degree: 'Bachelor’s in Electrical Engineering',
    details: 'Blida 1 University, 2015 to 2018. Thesis on a line-following robot built on Arduino Uno.'
  }
];

export const DEFAULT_LANGUAGES: LanguageItem[] = [
  { id: 'lang-1', language: 'French', proficiency: 'Native' },
  { id: 'lang-2', language: 'Arabic', proficiency: 'Native' },
  { id: 'lang-3', language: 'English', proficiency: 'Fluent' },
  { id: 'lang-4', language: 'Spanish', proficiency: 'Basic' }
];

export const DEFAULT_CONTACT: ContactContent = {
  heading: 'Get in touch',
  email: 'sadekmefti@gmail.com',
  phoneLabel: 'Phone',
  phoneDisplay: '+971 52 48 300 59',
  phoneHref: 'tel:+971524830059',
  linkedinLabel: 'LinkedIn',
  linkedinDisplay: 'linkedin.com/in/sadekmefti',
  linkedinHref: 'https://www.linkedin.com/in/sadekmefti/',
  locationLabel: 'Based in',
  locationDisplay: 'Dubai, UAE',
  copyright: '© 2026 Sadek Mefti'
};

export const DEFAULT_STYLE_OVERRIDES: StyleOverrides = {
  heroTitleScale: 100,
  sectionHeadingScale: 100,
  cardTitleScale: 100,
  bodyTextScale: 100,
  kpiNumberScale: 100,
  customColors: {},
  textStyles: {}
};

export const DEFAULT_SEO: SeoConfig = {
  siteTitle: 'Sadek Mefti — Technical Solutions Lead | Robotics, AI & Automation',
  metaDescription:
    'Official portfolio of Sadek Mefti, Dubai-based Robotics Technical Lead deploying 150+ autonomous commercial robots (AED 15M+) and AI automation across the GCC.',
  canonicalUrl: 'https://sadekmefti.github.io/',
  ogImageUrl: 'og-card.jpg',
  ogBannerKicker: 'DUBAI, UAE · ROBOTICS, AI & ENTERPRISE AUTOMATION',
  ogBannerHeadline: 'Sadek Mefti',
  ogBannerSubline: 'Technical Solutions Lead · 150+ Autonomous Robots Deployed (AED 15M+) · AED 40M+ Enterprise Deals',
  jobTitle: 'Robotics Technical Lead & Solutions Engineer',
  worksFor: 'SoftBank Robotics UK Ltd (EMEA HQ)'
};

export interface FullPortfolioContent {
  hero: HeroContent;
  figures: FigureItem[];
  sections: SectionConfig[];
  deployments: DeploymentEntry[];
  sectors: [string, string][];
  clients: ClientItem[];
  partnersHeading: string;
  partnersSubheading: string;
  partners: PartnerItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  toolkitCategories: ToolkitCategory[];
  certificationsTitle: string;
  certifications: CertificationItem[];
  educationTitle: string;
  education: EducationItem[];
  languagesTitle: string;
  languages: LanguageItem[];
  contact: ContactContent;
  styleOverrides: StyleOverrides;
  seo: SeoConfig;
}

export const DEFAULT_PORTFOLIO_CONTENT: FullPortfolioContent = {
  hero: DEFAULT_HERO,
  figures: DEFAULT_FIGURES,
  sections: DEFAULT_SECTIONS,
  deployments: DEPLOYMENTS,
  sectors: SECTORS,
  clients: CLIENTS,
  partnersHeading: 'Robotics and technology partners',
  partnersSubheading: 'Official hardware, autonomous navigation and enterprise mobility ecosystems deployed.',
  partners: PARTNERS,
  experiences: EXPERIENCES,
  projects: PROJECTS,
  toolkitCategories: DEFAULT_TOOLKIT_CATEGORIES,
  certificationsTitle: 'Certifications',
  certifications: DEFAULT_CERTIFICATIONS,
  educationTitle: 'Education',
  education: DEFAULT_EDUCATION,
  languagesTitle: 'Languages',
  languages: DEFAULT_LANGUAGES,
  contact: DEFAULT_CONTACT,
  styleOverrides: DEFAULT_STYLE_OVERRIDES,
  seo: DEFAULT_SEO
};
