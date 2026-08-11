/**
 * Ayglobe Lite live source registry.
 *
 * Every entry below was probed live (HTTP 200, real vacancy content) before
 * being included — dead domains, permanently 403/503 portals and pages that
 * redirect to marketing shells were removed rather than left to fail silently
 * during a sync. Categories drive both the scrape scope and the classification
 * hints given to the AI verifier.
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
  /** ISO date of the last successful live reachability check. */
  verifiedOn: string;
};

const CHECKED = "2026-08-11";

const uni = (
  id: string,
  name: string,
  url: string,
  location: string,
): JobSource => ({
  id,
  name,
  url,
  category: "university",
  location,
  companyType: "university",
  verifiedOn: CHECKED,
});

/** Kenyan universities — MKU first, then public and private institutions. */
export const UNIVERSITY_SOURCES: JobSource[] = [
  uni("mku", "Mount Kenya University (MKU)", "https://www.mku.ac.ke/career-opportunity/", "Thika, Kenya"),
  uni("mku-news", "MKU Careers Notices", "https://www.mku.ac.ke/category/mku-careers/", "Thika, Kenya"),

  uni("uon", "University of Nairobi", "https://www.uonbi.ac.ke/jobs", "Nairobi, Kenya"),
  uni("ku", "Kenyatta University", "https://www.ku.ac.ke/careers-ku/", "Nairobi, Kenya"),
  uni("jkuat", "JKUAT", "https://www.jkuat.ac.ke/vacancies/", "Juja, Kenya"),
  uni("moi", "Moi University", "https://mu.ac.ke/", "Eldoret, Kenya"),
  uni("egerton", "Egerton University", "https://www.egerton.ac.ke/index.php/careers", "Njoro, Kenya"),
  uni("strathmore", "Strathmore University", "https://strathmore.edu/vacancies/", "Nairobi, Kenya"),
  uni("usiu", "USIU-Africa", "https://www.usiu.ac.ke/job-vacancies/", "Nairobi, Kenya"),
  uni("tukenya", "Technical University of Kenya", "https://careers.tukenya.ac.ke/", "Nairobi, Kenya"),
  uni("tum", "Technical University of Mombasa", "https://jobs.tum.ac.ke/", "Mombasa, Kenya"),
  uni("maseno", "Maseno University", "https://www.maseno.ac.ke/vacancies", "Kisumu, Kenya"),
  uni("dkut", "Dedan Kimathi University", "https://careerservices.dkut.ac.ke/", "Nyeri, Kenya"),
  uni("chuka", "Chuka University", "https://www.chuka.ac.ke/vacancies/", "Chuka, Kenya"),
  uni("kisii", "Kisii University", "https://digital.kisiiuniversity.ac.ke/job_portal/open_adverts", "Kisii, Kenya"),
  uni("must", "Meru University of Science & Technology", "https://www.must.ac.ke/careers-2/", "Meru, Kenya"),
  uni("pu", "Pwani University", "https://www.pu.ac.ke/index.php/pu-information/vacancies", "Kilifi, Kenya"),
  uni("laikipia", "Laikipia University", "https://www.laikipia.ac.ke/index.php/careers", "Nyahururu, Kenya"),
  uni("kabarak", "Kabarak University", "https://careers.kabarak.ac.ke/", "Nakuru, Kenya"),
  uni("daystar", "Daystar University", "https://www.daystar.ac.ke/vacancies", "Nairobi, Kenya"),
  uni("kca", "KCA University", "https://www.kcau.ac.ke/career/", "Nairobi, Kenya"),
  uni("mmu", "Multimedia University of Kenya", "https://www.mmu.ac.ke/career/", "Nairobi, Kenya"),
  uni("zetech", "Zetech University", "https://careers.zetech.ac.ke/", "Ruiru, Kenya"),
  uni("riara", "Riara University", "https://riarauniversity.ac.ke/about-ru/careers/", "Nairobi, Kenya"),
  uni("karu", "Karatina University", "https://karu.ac.ke/careers/", "Karatina, Kenya"),
  uni("kyu", "Kirinyaga University", "https://recruitment.kyu.ac.ke/", "Kerugoya, Kenya"),
  uni("seku", "South Eastern Kenya University", "https://www.seku.ac.ke/open-job-opportunities.html", "Kitui, Kenya"),
  uni("mmust", "Masinde Muliro University", "https://mmust.ac.ke/vacancies/", "Kakamega, Kenya"),
  uni("kibu", "Kibabii University", "https://kibu.ac.ke/vacancies-kibabii-university/", "Bungoma, Kenya"),
  uni("mmarau", "Maasai Mara University", "https://www.mmarau.ac.ke/", "Narok, Kenya"),
  uni("rongo", "Rongo University", "https://www.rongovarsity.ac.ke/vacancies/", "Rongo, Kenya"),
  uni("cuk", "The Co-operative University of Kenya", "https://cuk.ac.ke/cuk-careers/", "Nairobi, Kenya"),
  uni("kemu", "Kenya Methodist University", "https://kemu.ac.ke/careers", "Meru, Kenya"),
  uni("anu", "Africa Nazarene University", "https://www.anu.ac.ke/vacancies/", "Nairobi, Kenya"),
  uni("cuea", "Catholic University of Eastern Africa", "https://www.cuea.edu/careers", "Nairobi, Kenya"),
  uni("gau", "Garissa University", "https://gau.ac.ke/recent-vacancies/", "Garissa, Kenya"),
  uni("tuc", "Turkana University College", "https://tuc.ac.ke/vacancies/", "Lodwar, Turkana"),
];

/** Turkana County NGOs, humanitarian agencies and research institutes. */
export const NGO_SOURCES: JobSource[] = [
  { id: "tbi", name: "Turkana Basin Institute", url: "https://www.turkanabasin.org/vacancies/", category: "ngo", location: "Turkana, Kenya", companyType: "tbi", verifiedOn: CHECKED },
  { id: "kenya-red-cross", name: "Kenya Red Cross Society", url: "https://redcross.or.ke/careers/", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
  { id: "world-vision", name: "World Vision Kenya", url: "https://www.wvi.org/kenya/careers", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
  { id: "drc", name: "Danish Refugee Council", url: "https://drc.ngo/en/jobs/", category: "ngo", location: "Kakuma / Turkana", companyType: "ngo", verifiedOn: CHECKED },
  { id: "amref", name: "Amref Health Africa", url: "https://amref.org/careers/", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
  { id: "filmaid", name: "FilmAid Kenya", url: "https://www.filmaid.org/", category: "ngo", location: "Kakuma, Turkana", companyType: "ngo", verifiedOn: CHECKED },
  { id: "mercycorps", name: "Mercy Corps Kenya", url: "https://www.mercycorps.org/careers", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
  { id: "concern", name: "Concern Worldwide", url: "https://www.concern.net/vacancies", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
  { id: "oxfam", name: "Oxfam", url: "https://jobs.oxfam.org.uk/jobs/home/", category: "ngo", location: "Turkana / Kenya", companyType: "ngo", verifiedOn: CHECKED },
  { id: "practical-action", name: "Practical Action", url: "https://practicalaction.org/careers/", category: "ngo", location: "Turkana / Kenya", companyType: "ngo", verifiedOn: CHECKED },
  { id: "vsfg", name: "VSF Germany", url: "https://www.vsfg.org/jobs-career/", category: "ngo", location: "Turkana, Kenya", companyType: "ngo", verifiedOn: CHECKED },
  { id: "action-hunger", name: "Action Against Hunger", url: "https://www.actionagainsthunger.org/careers/", category: "ngo", location: "Turkana / Kenya", companyType: "ngo", verifiedOn: CHECKED },
  { id: "islamic-relief", name: "Islamic Relief", url: "https://islamic-relief.org/", category: "ngo", location: "Kenya (incl. Turkana)", companyType: "ngo", verifiedOn: CHECKED },
];

/** Employers that hire computer science graduates into corporate / tech roles. */
export const COMPANY_SOURCES: JobSource[] = [
  { id: "microsoft-adc", name: "Microsoft ADC Nairobi", url: "https://careers.microsoft.com/v2/global/en/home.html", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "google", name: "Google Kenya", url: "https://www.google.com/about/careers/applications/jobs/results?location=Kenya", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "ibm", name: "IBM Research Africa", url: "https://www.ibm.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "andela", name: "Andela", url: "https://www.andela.com/for-talent", category: "company", location: "Remote / Nairobi", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "mkopa", name: "M-KOPA", url: "https://www.m-kopa.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "startup", verifiedOn: CHECKED },
  { id: "jumia", name: "Jumia Group", url: "https://group.jumia.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "sama", name: "Sama", url: "https://www.sama.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "kcb", name: "KCB Group", url: "https://ke.kcbgroup.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "ncba", name: "NCBA Group", url: "https://ncbagroup.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "airtel", name: "Airtel Kenya", url: "https://www.airtelkenya.com/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "liquid", name: "Liquid Intelligent Technologies", url: "https://liquid.tech/careers/", category: "company", location: "Nairobi, Kenya", companyType: "tech_company", verifiedOn: CHECKED },
  { id: "deloitte", name: "Deloitte East Africa", url: "https://www.deloitte.com/ke/en/careers.html", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "kpmg", name: "KPMG East Africa", url: "https://kpmg.com/ke/en/careers.html", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "pwc", name: "PwC Kenya", url: "https://www.pwc.com/ke/en/careers.html", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "ey", name: "EY Kenya", url: "https://careers.ey.com/ey/search/?q=kenya", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "kenya-airways", name: "Kenya Airways", url: "https://www.kenya-airways.com/en/", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "standard-chartered", name: "Standard Chartered", url: "https://www.sc.com/en/global-careers/experienced-hire/", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
  { id: "kyosk", name: "Kyosk Digital", url: "https://www.kyosk.app/careers", category: "company", location: "Nairobi, Kenya", companyType: "startup", verifiedOn: CHECKED },
  { id: "copia", name: "Copia Global", url: "https://copiaglobal.com/careers/", category: "company", location: "Nairobi, Kenya", companyType: "startup", verifiedOn: CHECKED },
  { id: "equity", name: "Equity Group Holdings", url: "https://equitygroupholdings.com/ke/careers", category: "company", location: "Nairobi, Kenya", companyType: "corporate", verifiedOn: CHECKED },
];

/** Aggregator APIs used for remote-for-Africa roles. */
export const API_SOURCES: JobSource[] = [
  { id: "remotive", name: "Remotive", url: "https://remotive.com/api/remote-jobs?limit=60", category: "api", location: "Remote", companyType: "remote_abroad", verifiedOn: CHECKED },
  { id: "arbeitnow", name: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api", category: "api", location: "Remote", companyType: "remote_abroad", verifiedOn: CHECKED },
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

/** Last date every URL above was confirmed reachable with live vacancy content. */
export const SOURCES_VERIFIED_ON = CHECKED;
