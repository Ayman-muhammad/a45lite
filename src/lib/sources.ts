/**
 * 45LITE live source registry.
 *
 * Every entry is an official careers / vacancies page that the sync engine
 * fetches and parses on each request. Categories drive both the scrape scope
 * and the feed classification hints given to the AI verifier.
 */

export type SourceCategory = "university" | "ngo" | "company" | "api";

export type JobSource = {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  /** Human location hint used when a listing omits one. */
  location: string;
  /** Classification hint passed to the verifier. */
  companyType: "university" | "ngo" | "tbi" | "tech_company" | "startup" | "corporate" | "remote_abroad";
};

/** Kenyan universities — MKU first, then public and private institutions. */
export const UNIVERSITY_SOURCES: JobSource[] = [
  { id: "mku", name: "Mount Kenya University (MKU)", url: "https://www.mku.ac.ke/careers/", category: "university", location: "Thika, Kenya", companyType: "university" },
  { id: "uon", name: "University of Nairobi", url: "https://hr.uonbi.ac.ke/vacancies", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "ku", name: "Kenyatta University", url: "https://www.ku.ac.ke/vacancies", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "jkuat", name: "JKUAT", url: "https://www.jkuat.ac.ke/category/vacancies/", category: "university", location: "Juja, Kenya", companyType: "university" },
  { id: "moi", name: "Moi University", url: "https://www.mu.ac.ke/index.php/vacancies", category: "university", location: "Eldoret, Kenya", companyType: "university" },
  { id: "egerton", name: "Egerton University", url: "https://www.egerton.ac.ke/careers", category: "university", location: "Njoro, Kenya", companyType: "university" },
  { id: "strathmore", name: "Strathmore University", url: "https://strathmore.edu/careers/", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "usiu", name: "USIU-Africa", url: "https://www.usiu.ac.ke/careers/", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "tukenya", name: "Technical University of Kenya", url: "https://www.tukenya.ac.ke/vacancies", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "tum", name: "Technical University of Mombasa", url: "https://www.tum.ac.ke/careers", category: "university", location: "Mombasa, Kenya", companyType: "university" },
  { id: "maseno", name: "Maseno University", url: "https://www.maseno.ac.ke/vacancies", category: "university", location: "Kisumu, Kenya", companyType: "university" },
  { id: "dkut", name: "Dedan Kimathi University", url: "https://www.dkut.ac.ke/careers", category: "university", location: "Nyeri, Kenya", companyType: "university" },
  { id: "chuka", name: "Chuka University", url: "https://www.chuka.ac.ke/vacancies/", category: "university", location: "Chuka, Kenya", companyType: "university" },
  { id: "kisii", name: "Kisii University", url: "https://www.kisiiuniversity.ac.ke/vacancies", category: "university", location: "Kisii, Kenya", companyType: "university" },
  { id: "mksu", name: "Machakos University", url: "https://www.mksu.ac.ke/vacancies/", category: "university", location: "Machakos, Kenya", companyType: "university" },
  { id: "must", name: "Meru University of Science & Technology", url: "https://www.must.ac.ke/careers/", category: "university", location: "Meru, Kenya", companyType: "university" },
  { id: "pu", name: "Pwani University", url: "https://www.pu.ac.ke/vacancies", category: "university", location: "Kilifi, Kenya", companyType: "university" },
  { id: "laikipia", name: "Laikipia University", url: "https://laikipia.ac.ke/vacancies/", category: "university", location: "Nyahururu, Kenya", companyType: "university" },
  { id: "kabarak", name: "Kabarak University", url: "https://kabarak.ac.ke/careers", category: "university", location: "Nakuru, Kenya", companyType: "university" },
  { id: "daystar", name: "Daystar University", url: "https://www.daystar.ac.ke/careers", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "kca", name: "KCA University", url: "https://www.kca.ac.ke/careers/", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "mmu", name: "Multimedia University of Kenya", url: "https://www.mmu.ac.ke/careers", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "zetech", name: "Zetech University", url: "https://www.zetech.ac.ke/careers/", category: "university", location: "Ruiru, Kenya", companyType: "university" },
  { id: "riara", name: "Riara University", url: "https://riarauniversity.ac.ke/careers/", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "karu", name: "Karatina University", url: "https://www.karu.ac.ke/vacancies", category: "university", location: "Karatina, Kenya", companyType: "university" },
  { id: "kyu", name: "Kirinyaga University", url: "https://www.kyu.ac.ke/vacancies", category: "university", location: "Kerugoya, Kenya", companyType: "university" },
  { id: "mut", name: "Murang'a University of Technology", url: "https://www.mut.ac.ke/vacancies", category: "university", location: "Murang'a, Kenya", companyType: "university" },
  { id: "seku", name: "South Eastern Kenya University", url: "https://www.seku.ac.ke/vacancies", category: "university", location: "Kitui, Kenya", companyType: "university" },
  { id: "mmust", name: "Masinde Muliro University", url: "https://www.mmust.ac.ke/vacancies", category: "university", location: "Kakamega, Kenya", companyType: "university" },
  { id: "kibu", name: "Kibabii University", url: "https://kibu.ac.ke/vacancies", category: "university", location: "Bungoma, Kenya", companyType: "university" },
  { id: "mmarau", name: "Maasai Mara University", url: "https://www.mmarau.ac.ke/vacancies", category: "university", location: "Narok, Kenya", companyType: "university" },
  { id: "rongo", name: "Rongo University", url: "https://rongovarsity.ac.ke/vacancies", category: "university", location: "Rongo, Kenya", companyType: "university" },
  { id: "cuk", name: "The Co-operative University of Kenya", url: "https://cuk.ac.ke/vacancies", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "kemu", name: "Kenya Methodist University", url: "https://www.kemu.ac.ke/careers", category: "university", location: "Meru, Kenya", companyType: "university" },
  { id: "anu", name: "Africa Nazarene University", url: "https://www.anu.ac.ke/careers", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "cuea", name: "Catholic University of Eastern Africa", url: "https://cuea.edu/careers", category: "university", location: "Nairobi, Kenya", companyType: "university" },
  { id: "gau", name: "Garissa University", url: "https://www.gau.ac.ke/vacancies", category: "university", location: "Garissa, Kenya", companyType: "university" },
  { id: "tuc", name: "Turkana University College", url: "https://tuc.ac.ke/vacancies", category: "university", location: "Lodwar, Turkana", companyType: "university" },
  { id: "tharaka", name: "Tharaka University", url: "https://tharaka.ac.ke/vacancies", category: "university", location: "Tharaka Nithi, Kenya", companyType: "university" },
];

/** Turkana County NGOs, humanitarian agencies and research institutes. */
export const NGO_SOURCES: JobSource[] = [
  { id: "tbi", name: "Turkana Basin Institute", url: "https://www.turkanabasin.org/careers/", category: "ngo", location: "Turkana, Kenya", companyType: "tbi" },
  { id: "turkana-county", name: "Turkana County Government", url: "https://turkana.go.ke/index.php/category/vacancies/", category: "ngo", location: "Lodwar, Turkana", companyType: "ngo" },
  { id: "caritas-lodwar", name: "Caritas Lodwar", url: "https://caritaslodwar.org/vacancies/", category: "ngo", location: "Lodwar, Turkana", companyType: "ngo" },
  { id: "kenya-red-cross", name: "Kenya Red Cross Society", url: "https://www.redcross.or.ke/careers", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "world-vision", name: "World Vision Kenya", url: "https://careers.wvi.org/jobs/kenya", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "drc", name: "Danish Refugee Council", url: "https://job.drc.ngo/vacancies", category: "ngo", location: "Kakuma / Turkana", companyType: "ngo" },
  { id: "nrc", name: "Norwegian Refugee Council", url: "https://www.nrc.no/vacancies", category: "ngo", location: "Kakuma / Turkana", companyType: "ngo" },
  { id: "irc", name: "International Rescue Committee", url: "https://careers.rescue.org/us/en/search-results?keywords=Kenya", category: "ngo", location: "Kakuma / Turkana", companyType: "ngo" },
  { id: "lwf", name: "Lutheran World Federation Kenya-Somalia", url: "https://kenyadjibouti.lutheranworld.org/content/vacancies", category: "ngo", location: "Kakuma, Turkana", companyType: "ngo" },
  { id: "save-children", name: "Save the Children Kenya", url: "https://kenya.savethechildren.net/careers", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "iom", name: "IOM Kenya", url: "https://kenya.iom.int/vacancies", category: "ngo", location: "Kakuma / Turkana", companyType: "ngo" },
  { id: "amref", name: "Amref Health Africa", url: "https://amref.org/vacancies/", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "filmaid", name: "FilmAid Kenya", url: "https://filmaid.org/careers/", category: "ngo", location: "Kakuma, Turkana", companyType: "ngo" },
  { id: "mercycorps", name: "Mercy Corps Kenya", url: "https://jobs.jobvite.com/mercycorps/search?q=Kenya", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "concern", name: "Concern Worldwide", url: "https://www.concern.net/jobs", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
  { id: "oxfam", name: "Oxfam", url: "https://jobs.oxfam.org.uk/vacancies", category: "ngo", location: "Turkana / Kenya", companyType: "ngo" },
  { id: "practical-action", name: "Practical Action", url: "https://practicalaction.org/jobs/", category: "ngo", location: "Turkana / Kenya", companyType: "ngo" },
  { id: "vsfg", name: "VSF Germany", url: "https://vsfg.org/vacancies/", category: "ngo", location: "Turkana, Kenya", companyType: "ngo" },
  { id: "action-hunger", name: "Action Against Hunger", url: "https://www.actionagainsthunger.org/careers/", category: "ngo", location: "Turkana / Kenya", companyType: "ngo" },
  { id: "islamic-relief", name: "Islamic Relief Kenya", url: "https://islamic-relief.org/jobs/", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo" },
];

/** Employers that hire computer science graduates into corporate / tech roles. */
export const COMPANY_SOURCES: JobSource[] = [
  { id: "safaricom", name: "Safaricom PLC", url: "https://www.safaricom.co.ke/careers/current-openings", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "microsoft-adc", name: "Microsoft ADC Nairobi", url: "https://jobs.careers.microsoft.com/global/en/search?lc=Kenya", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "google", name: "Google Kenya", url: "https://www.google.com/about/careers/applications/jobs/results?location=Kenya", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "ibm", name: "IBM Research Africa", url: "https://www.ibm.com/careers/search?q=Kenya", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "andela", name: "Andela", url: "https://andela.com/careers/", category: "company", location: "Remote / Nairobi", companyType: "tech_company" },
  { id: "cellulant", name: "Cellulant", url: "https://cellulant.io/careers/", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "mkopa", name: "M-KOPA", url: "https://m-kopa.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "startup" },
  { id: "twiga", name: "Twiga Foods", url: "https://twiga.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "startup" },
  { id: "jumia", name: "Jumia Group", url: "https://group.jumia.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "sama", name: "Sama", url: "https://www.sama.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "equity", name: "Equity Group Holdings", url: "https://equitygroupholdings.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "kcb", name: "KCB Group", url: "https://ke.kcbgroup.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "ncba", name: "NCBA Group", url: "https://ke.ncbagroup.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "airtel", name: "Airtel Kenya", url: "https://www.airtel.co.ke/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "liquid", name: "Liquid Intelligent Technologies", url: "https://liquid.tech/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "deloitte", name: "Deloitte East Africa", url: "https://www2.deloitte.com/ke/en/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "kpmg", name: "KPMG East Africa", url: "https://kpmg.com/ke/en/careers.html", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "pwc", name: "PwC Kenya", url: "https://www.pwc.com/ke/en/careers.html", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "ey", name: "EY Kenya", url: "https://www.ey.com/en_ke/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "craftsilicon", name: "Craft Silicon", url: "https://craftsilicon.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "tech_company" },
  { id: "kenya-airways", name: "Kenya Airways", url: "https://www.kenya-airways.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "standard-chartered", name: "Standard Chartered Kenya", url: "https://www.sc.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate" },
  { id: "kyosk", name: "Kyosk Digital", url: "https://kyosk.app/careers/", category: "company", location: "Nairobi, Kenya", companyType: "startup" },
  { id: "copia", name: "Copia Global", url: "https://copiakenya.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "startup" },
];

/** Aggregator APIs used for remote-for-Africa roles. */
export const API_SOURCES: JobSource[] = [
  { id: "remotive", name: "Remotive", url: "https://remotive.com/api/remote-jobs?limit=60", category: "api", location: "Remote", companyType: "remote_abroad" },
  { id: "arbeitnow", name: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api", category: "api", location: "Remote", companyType: "remote_abroad" },
];

export const ALL_SOURCES: JobSource[] = [
  ...UNIVERSITY_SOURCES,
  ...NGO_SOURCES,
  ...COMPANY_SOURCES,
  ...API_SOURCES,
];

export const SOURCE_SCOPES = [
  { key: "all", label: "All sources" },
  { key: "university", label: "Universities" },
  { key: "ngo", label: "Turkana NGOs" },
  { key: "company", label: "Companies" },
  { key: "api", label: "Remote feeds" },
] as const;

export type SourceScope = (typeof SOURCE_SCOPES)[number]["key"];

export function sourcesForScope(scope: SourceScope): JobSource[] {
  if (scope === "all") return ALL_SOURCES;
  return ALL_SOURCES.filter((s) => s.category === scope);
}

export const SOURCE_COUNTS = {
  university: UNIVERSITY_SOURCES.length,
  ngo: NGO_SOURCES.length,
  company: COMPANY_SOURCES.length,
  api: API_SOURCES.length,
  total: ALL_SOURCES.length,
};
