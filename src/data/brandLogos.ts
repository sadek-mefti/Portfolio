/**
 * Official-style vector SVG brand logos and emblems for all 18 GCC clients
 * and 7 robotics/technology partners. Self-contained inline SVGs ensure 100%
 * uptime and zero CORS issues when hosted on GitHub Pages.
 */

export const CLIENT_LOGOS_SVG: Record<string, string> = {
  transguard: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(14, 14)">
      <path d="M22 2L40 10V24C40 34.5 32.3 42.8 22 46C11.7 42.8 4 34.5 4 24V10L22 2Z" fill="#23282D" stroke="#A2844B" stroke-width="2.5"/>
      <path d="M22 9L33 14V23.5C33 30.2 28.2 35.8 22 38.2C15.8 35.8 11 30.2 11 23.5V14L22 9Z" fill="#A2844B"/>
      <path d="M16 21H28M22 21V31" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>
    </g>
    <text x="66" y="36" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="18.5" letter-spacing="0.5" fill="#23282D">TRANSGUARD</text>
    <text x="66" y="51" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="10.5" letter-spacing="3.2" fill="#A2844B">GROUP</text>
  </svg>`,

  farnek: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 16)">
      <circle cx="20" cy="20" r="18" fill="#005596"/>
      <path d="M12 24C14 14 23 10 31 11C28 21 21 26 12 24Z" fill="#6DBE45"/>
      <circle cx="25" cy="15" r="2.5" fill="#FFFFFF"/>
    </g>
    <text x="64" y="41" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="25" letter-spacing="0.8" fill="#005596">FARNEK</text>
    <path d="M65 48H188" stroke="#6DBE45" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  efs: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="14" width="68" height="44" rx="5" fill="#004B87"/>
    <text x="50" y="45" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="1" fill="#FFFFFF">EFS</text>
    <circle cx="75" cy="23" r="3.5" fill="#F58220"/>
    <text x="96" y="34" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="13.5" fill="#004B87">FACILITIES</text>
    <text x="96" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="11.5" letter-spacing="1.2" fill="#4A5568">SERVICES GROUP</text>
  </svg>`,

  emaar: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="110" y="43" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="31" letter-spacing="6.5" fill="#101010">EMAAR</text>
    <line x1="36" y1="53" x2="184" y2="53" stroke="#C5A059" stroke-width="2.2"/>
  </svg>`,

  'dubai-airports': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(14, 15)">
      <path d="M4 28C14 10 30 6 44 8C34 15 26 24 22 36L4 28Z" fill="#00A651"/>
      <path d="M12 34C22 22 35 18 48 20C38 26 30 33 26 41L12 34Z" fill="#ED1C24"/>
      <path d="M2 22C16 14 32 14 46 18" stroke="#101010" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <text x="72" y="34" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="18" letter-spacing="1.2" fill="#101010">DUBAI</text>
    <text x="72" y="51" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="16" letter-spacing="2" fill="#00A651">AIRPORTS</text>
  </svg>`,

  'al-yalayis': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 14)">
      <polygon points="22,2 40,12 40,32 22,42 4,32 4,12" fill="none" stroke="#8C6D46" stroke-width="2.5"/>
      <polygon points="22,8 34,15 34,29 22,36 10,29 10,15" fill="#8C6D46"/>
      <path d="M16 22L22 15L28 22L22 29Z" fill="#FFFFFF"/>
    </g>
    <text x="68" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="18.5" letter-spacing="0.8" fill="#1A1A1A">AL YALAYIS</text>
    <text x="68" y="50" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="9.5" letter-spacing="1.5" fill="#8C6D46">GOVT TRANSACTION CENTER</text>
  </svg>`,

  du: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(66, 11)">
      <rect x="0" y="0" width="88" height="50" rx="25" fill="#00A9CE"/>
      <text x="44" y="36" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="33" fill="#FFFFFF">du</text>
      <circle cx="76" cy="14" r="5" fill="#E4002B"/>
    </g>
  </svg>`,

  eand: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="86" y="48" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="42" fill="#E00800">e&amp;</text>
    <line x1="122" y1="18" x2="122" y2="54" stroke="#D8D8D3" stroke-width="2"/>
    <text x="134" y="35" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="13" fill="#101010">etisalat</text>
    <text x="134" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="11" fill="#595955">and</text>
  </svg>`,

  dewa: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 14)">
      <circle cx="22" cy="22" r="20" fill="#00853E"/>
      <path d="M22 9C22 9 31 19 31 25.5C31 30.5 27 34.5 22 34.5C17 34.5 13 30.5 13 25.5C13 19 22 9 22 9Z" fill="#00A9E0"/>
      <path d="M23 14L18 24H23L20 32L27 21H22L23 14Z" fill="#FFD400"/>
    </g>
    <text x="68" y="38" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="1.5" fill="#00853E">DEWA</text>
    <text x="68" y="51" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="8.8" letter-spacing="0.6" fill="#0072CE">DUBAI ELECTRICITY &amp; WATER</text>
  </svg>`,

  'etihad-we': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(14, 16)">
      <path d="M6 20C6 11.2 13.2 4 22 4C27.5 4 32.3 6.8 35.2 11" stroke="#0066B3" stroke-width="5" stroke-linecap="round"/>
      <path d="M38 20C38 28.8 30.8 36 22 36C16.5 36 11.7 33.2 8.8 29" stroke="#F37021" stroke-width="5" stroke-linecap="round"/>
      <circle cx="22" cy="20" r="6" fill="#0066B3"/>
    </g>
    <text x="62" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="18.5" fill="#0066B3">Etihad<tspan fill="#F37021">WE</tspan></text>
    <text x="62" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="9.5" fill="#4A5568">الاتحاد للماء والكهرباء</text>
  </svg>`,

  'dubai-police': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 13)">
      <circle cx="23" cy="23" r="21" fill="#00593F" stroke="#C5A059" stroke-width="2"/>
      <path d="M12 27L23 12L34 27H12Z" fill="#C5A059"/>
      <path d="M10 31H36" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <text x="68" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="18.5" letter-spacing="0.8" fill="#00593F">DUBAI POLICE</text>
    <text x="68" y="50" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="11" fill="#C5A059">شرطة دبي</text>
  </svg>`,

  moi: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 13)">
      <circle cx="23" cy="23" r="20" fill="none" stroke="#8A704C" stroke-width="2.5"/>
      <path d="M23 7L28 19L40 19L30 26L34 38L23 30L12 38L16 26L6 19L18 19Z" fill="#8A704C"/>
      <circle cx="23" cy="23" r="5" fill="#101010"/>
    </g>
    <text x="68" y="34" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="19" letter-spacing="1.2" fill="#101010">MOI UAE</text>
    <text x="68" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="10" letter-spacing="0.8" fill="#8A704C">MINISTRY OF INTERIOR</text>
  </svg>`,

  mohap: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 14)">
      <rect x="2" y="2" width="40" height="40" rx="8" fill="#006838"/>
      <path d="M22 10V34M10 22H34" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="22" cy="22" r="4" fill="#C5A059"/>
    </g>
    <text x="68" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="21" letter-spacing="1.2" fill="#006838">MOHAP</text>
    <text x="68" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="9" fill="#4A5568">HEALTH &amp; PREVENTION</text>
  </svg>`,

  dha: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 15)">
      <path d="M4 21C4 11.6 11.6 4 21 4H29C38.4 4 46 11.6 46 21C46 30.4 38.4 38 29 38H21C11.6 38 4 30.4 4 21Z" fill="#008C95"/>
      <path d="M16 21H34M25 12V30" stroke="#FFFFFF" stroke-width="3.8" stroke-linecap="round"/>
    </g>
    <text x="72" y="35" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="22" letter-spacing="1" fill="#008C95">DHA</text>
    <text x="72" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="9.5" fill="#101010">DUBAI HEALTH AUTHORITY</text>
  </svg>`,

  doh: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 15)">
      <rect x="2" y="2" width="40" height="38" rx="6" fill="#8A1538"/>
      <path d="M11 22H18L21 13L25 29L28 22H34" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="68" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="20" fill="#8A1538">DoH</text>
    <text x="114" y="35" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="14" fill="#101010">ABU DHABI</text>
    <text x="68" y="49" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="9.5" fill="#595955">DEPARTMENT OF HEALTH</text>
  </svg>`,

  burjeel: `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(16, 14)">
      <circle cx="22" cy="22" r="20" fill="#1B365D"/>
      <path d="M16 32V12H24C27.5 12 30 14 30 17C30 19.2 28.5 20.8 26.5 21.3C29.2 21.8 31 23.8 31 26.5C31 30 28 32 24 32H16Z" stroke="#C5A059" stroke-width="2.6" fill="none"/>
    </g>
    <text x="68" y="35" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="20" letter-spacing="1.2" fill="#1B365D">BURJEEL</text>
    <text x="68" y="50" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="10.5" letter-spacing="2.8" fill="#C5A059">HOLDINGS</text>
  </svg>`,

  'saudi-german': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(14, 15)">
      <rect x="2" y="2" width="38" height="38" rx="6" fill="#00843D"/>
      <path d="M21 9V33M9 21H33" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="28" y="28" width="14" height="14" rx="3" fill="#004B87"/>
    </g>
    <text x="66" y="34" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="16.5" fill="#004B87">SAUDI GERMAN</text>
    <text x="66" y="50" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="13.5" letter-spacing="2" fill="#00843D">HEALTH</text>
  </svg>`,

  'sulaiman-al-habib': `<svg viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(14, 14)">
      <circle cx="22" cy="22" r="20" fill="#00549F"/>
      <path d="M22 8L26 18H36L28 24L31 34L22 28L13 34L16 24L8 18H18L22 8Z" fill="#D4AF37"/>
    </g>
    <text x="64" y="33" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="14" fill="#00549F">DR. SULAIMAN</text>
    <text x="64" y="49" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="15.5" fill="#D4AF37">AL HABIB</text>
  </svg>`
};

export interface PartnerItem {
  key: string;
  name: string;
  role: string;
  svg: string;
}

export const PARTNERS: PartnerItem[] = [
  {
    key: 'softbank',
    name: 'SoftBank Robotics',
    role: 'Whiz, Pepper & Nao platforms',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="17" width="26" height="7" fill="#B6B6B0"/>
      <rect x="10" y="29" width="26" height="7" fill="#B6B6B0"/>
      <text x="44" y="28" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="17" fill="#101010">SoftBank</text>
      <text x="44" y="42" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="11.5" letter-spacing="1.5" fill="#595955">ROBOTICS</text>
    </svg>`
  },
  {
    key: 'gausium',
    name: 'Gausium',
    role: 'Phantas, Omnie & Scrubber 50',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="28" r="14" stroke="#0066CC" stroke-width="4"/>
      <path d="M24 28H36" stroke="#00A3E0" stroke-width="4" stroke-linecap="round"/>
      <text x="48" y="34" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="21" letter-spacing="2.2" fill="#101010">GAUSIUM</text>
    </svg>`
  },
  {
    key: 'pudu',
    name: 'Pudu Robotics',
    role: 'CC1 commercial cleaning & service',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="13" width="30" height="30" rx="8" fill="#0052D9"/>
      <circle cx="22" cy="28" r="3" fill="#FFFFFF"/>
      <circle cx="32" cy="28" r="3" fill="#FFFFFF"/>
      <text x="52" y="32" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="21" letter-spacing="1.5" fill="#0052D9">PUDU</text>
      <text x="118" y="32" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="12" fill="#4A5568">ROBOTICS</text>
    </svg>`
  },
  {
    key: 'temi',
    name: 'temi',
    role: 'Autonomous hospitality & telepresence',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="28" r="15" fill="#00B4B4"/>
      <path d="M26 28L31 33L39 23" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="58" y="36" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="28" letter-spacing="-0.5" fill="#101010">temi</text>
    </svg>`
  },
  {
    key: 'samsung',
    name: 'Samsung Knox',
    role: 'Enterprise mobility, MDM & E-FOTA',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="64" cy="28" rx="52" ry="17" fill="#1428A0"/>
      <text x="64" y="33" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="15.5" letter-spacing="2" fill="#FFFFFF">SAMSUNG</text>
      <text x="126" y="34" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="17" fill="#101010">Knox</text>
    </svg>`
  },
  {
    key: 'grabba',
    name: 'Grabba',
    role: 'Biometric & enterprise field hardware',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,12 38,20 38,36 24,44 10,36 10,20" fill="#E53935"/>
      <path d="M24 20V36M17 25H31" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>
      <text x="48" y="35" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="22" letter-spacing="1.5" fill="#101010">GRABBA</text>
    </svg>`
  },
  {
    key: 'humanizing',
    name: 'Humanizing Technologies',
    role: 'Digital avatars & humanoid software',
    svg: `<svg viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="28" r="14" fill="#101010"/>
      <text x="24" y="33" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="13" fill="#FFD400">HT</text>
      <text x="46" y="26" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="13.5" fill="#101010">HUMANIZING</text>
      <text x="46" y="40" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="10.5" letter-spacing="1.2" fill="#595955">TECHNOLOGIES</text>
    </svg>`
  }
];
