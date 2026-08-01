
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  location text,
  job_type_preference text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  experience_years int NOT NULL DEFAULT 0,
  education_level text,
  fcm_token text,
  notify_new_jobs boolean NOT NULL DEFAULT true,
  notify_deadlines boolean NOT NULL DEFAULT true,
  subscription_tier text NOT NULL DEFAULT 'free',
  onboarded boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  company_type text NOT NULL DEFAULT 'tech_company',
  location text NOT NULL DEFAULT 'Nairobi',
  job_type text NOT NULL DEFAULT 'full_time',
  description text NOT NULL DEFAULT '',
  requirements text[] NOT NULL DEFAULT '{}',
  salary_range text,
  apply_url text,
  apply_email text,
  source text,
  source_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by text,
  verified_at timestamptz,
  deadline date,
  is_active boolean NOT NULL DEFAULT true,
  experience_level text NOT NULL DEFAULT 'mid',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verified jobs are public" ON public.jobs FOR SELECT TO anon, authenticated
  USING (verification_status = 'verified' AND is_active = true);

-- RESUMES
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url text,
  file_name text,
  parsed_text text,
  skills_extracted text[] NOT NULL DEFAULT '{}',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resumes" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SAVED JOBS
CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved jobs" ON public.saved_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- APPLICATIONS
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'saved',
  applied_at timestamptz,
  notes text,
  custom_cover_letter text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications" ON public.job_applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'new_job',
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI GENERATIONS
CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  type text NOT NULL,
  input_prompt text,
  output_content text,
  match_score int,
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own generations" ON public.ai_generations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DAILY USAGE
CREATE TABLE public.user_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  ai_generations int NOT NULL DEFAULT 0,
  searches int NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_daily_usage TO authenticated;
GRANT ALL ON public.user_daily_usage TO service_role;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage" ON public.user_daily_usage FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED 30 VERIFIED JOBS
INSERT INTO public.jobs (title, company, company_type, location, job_type, description, requirements, salary_range, apply_url, apply_email, source, verification_status, verified_by, verified_at, deadline, experience_level, tags) VALUES
('Lecturer, Computer Science','University of Nairobi','university','Nairobi','full_time','The School of Computing and Informatics invites applications for a Lecturer in Computer Science. The successful candidate will teach undergraduate and postgraduate units, supervise research, and contribute to grant writing and curriculum development.','{"PhD in Computer Science or related field","At least 3 years university teaching experience","Record of peer-reviewed publications","Experience supervising postgraduate students"}','KES 150,000 - 220,000','https://hr.uonbi.ac.ke/vacancies',NULL,'UoN HR Portal','verified','45LITE Verification Team',now(),CURRENT_DATE + 21,'senior','{"lecturing","academia","computer science"}'),
('Senior Lecturer, Data Science','Kenyatta University','university','Nairobi','full_time','Kenyatta University seeks a Senior Lecturer to lead the Data Science programme, deliver graduate courses in machine learning and statistical modelling, and grow industry research partnerships.','{"PhD in Data Science, Statistics or Computer Science","5+ years teaching at university level","Minimum 8 publications in refereed journals","Grant acquisition experience"}','KES 200,000 - 280,000',NULL,'recruitment@ku.ac.ke','KU Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 30,'senior','{"lecturing","data science","research"}'),
('Lecturer, Business Information Systems','Strathmore University','university','Nairobi','full_time','Strathmore Business School is recruiting a Lecturer for Business Information Systems to teach modules in enterprise systems, digital transformation and IT governance.','{"Masters required, PhD preferred","Industry consulting experience","Teaching philosophy statement","Strong communication skills"}','KES 180,000 - 250,000','https://strathmore.edu/careers',NULL,'Strathmore Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 14,'mid','{"lecturing","information systems"}'),
('Assistant Lecturer, Software Engineering','JKUAT','university','Juja, Kiambu','full_time','JKUAT School of Computing invites applications for Assistant Lecturer in Software Engineering to support teaching of programming, software architecture and capstone project supervision.','{"Masters in Software Engineering or Computer Science","Practical software development experience","Willingness to pursue PhD"}','KES 110,000 - 160,000',NULL,'careers@jkuat.ac.ke','JKUAT HR','verified','45LITE Verification Team',now(),CURRENT_DATE + 10,'entry','{"lecturing","software engineering"}'),
('Lecturer, Public Health','Mount Kenya University','university','Thika','full_time','MKU School of Health Sciences requires a Lecturer in Public Health to teach epidemiology and biostatistics units across campuses.','{"PhD or Masters in Public Health","Teaching experience preferred","Research output in health systems"}','KES 120,000 - 170,000','https://mku.ac.ke/careers',NULL,'MKU Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 25,'mid','{"lecturing","public health"}'),
('Senior Software Engineer, Payments','Safaricom PLC','tech_company','Nairobi','full_time','Join the M-PESA engineering group to design and scale payment services handling millions of transactions daily. You will own microservices end to end, from design through production reliability.','{"5+ years backend engineering","Java or Go, Kafka, PostgreSQL","Experience with high-throughput distributed systems","Cloud (AWS/Azure) experience"}','KES 400,000 - 600,000','https://safaricom.co.ke/careers',NULL,'Safaricom Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 12,'senior','{"tech","backend","fintech"}'),
('Frontend Engineer (React)','Andela','tech_company','Remote (Kenya)','remote','Andela is matching senior frontend engineers with global engineering teams. You will build production React applications for international clients while working from Kenya.','{"4+ years React and TypeScript","Strong CSS and accessibility fundamentals","Excellent written English","Overlap with US timezones"}','USD 3,500 - 5,500 / month','https://andela.com/talent',NULL,'Andela Talent','verified','45LITE Verification Team',now(),CURRENT_DATE + 18,'mid','{"tech","react","remote"}'),
('Backend Engineer, Merchant Platform','Flutterwave','tech_company','Nairobi','full_time','Build and maintain APIs powering merchant payments across Africa. Work closely with product and compliance to ship reliable financial infrastructure.','{"3+ years backend development","Node.js or Python","REST API design and testing","Payments domain interest"}','KES 350,000 - 500,000','https://flutterwave.com/careers',NULL,'Flutterwave Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 20,'mid','{"tech","fintech","backend"}'),
('Data Analyst, Credit Risk','M-KOPA','tech_company','Nairobi','full_time','Analyse repayment behaviour across our asset financing portfolio and build dashboards that guide credit policy for millions of customers.','{"2+ years analytics experience","Advanced SQL and Python","Experience with BI tooling","Statistics background"}','KES 250,000 - 350,000',NULL,'careers@m-kopa.com','M-KOPA Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 9,'mid','{"tech","data","analytics"}'),
('IT Systems Administrator','Britam','tech_company','Nairobi','full_time','Maintain and secure Britam core insurance IT infrastructure, manage server estates, and support business continuity operations.','{"Bachelors in IT or related","Windows Server and Linux administration","Networking and security certifications an advantage","4+ years experience"}','KES 200,000 - 300,000','https://britam.com/careers',NULL,'Britam Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 16,'mid','{"tech","infrastructure"}'),
('Research Assistant, Paleoanthropology','Turkana Basin Institute','tbi','Turkana','contract','TBI seeks a Research Assistant to support excavation, fossil documentation and specimen cataloguing during field seasons in the Turkana Basin.','{"Degree in Archaeology, Geology or Anthropology","Field work experience","Ability to work in remote arid conditions","Meticulous record keeping"}','KES 120,000 - 160,000',NULL,'research@turkanabasin.org','TBI Research','verified','45LITE Verification Team',now(),CURRENT_DATE + 28,'entry','{"tbi","research","field"}'),
('Field School Coordinator','Turkana Basin Institute','tbi','Turkana','full_time','Coordinate the TBI Origins Field School: student logistics, curriculum scheduling, faculty liaison and camp operations across each academic season.','{"Masters in a relevant science field","Programme coordination experience","Strong logistics and people management","Comfort with extended field deployments"}','KES 180,000 - 240,000',NULL,'fieldschool@turkanabasin.org','TBI','verified','45LITE Verification Team',now(),CURRENT_DATE + 22,'mid','{"tbi","education","operations"}'),
('Laboratory Technician, Isotope Lab','Turkana Basin Institute','tbi','Turkana','full_time','Operate and maintain isotope preparation equipment, process sediment and fossil samples, and support visiting researchers with lab protocols.','{"Diploma or degree in Laboratory Technology","Sample preparation experience","Equipment maintenance skills","Strict adherence to lab safety"}','KES 100,000 - 140,000',NULL,'lab@turkanabasin.org','TBI','verified','45LITE Verification Team',now(),CURRENT_DATE + 15,'entry','{"tbi","laboratory"}'),
('Postdoctoral Researcher, Paleoecology','Turkana Basin Institute','tbi','Turkana / Nairobi','contract','Two-year postdoctoral position investigating Plio-Pleistocene paleoecological change using faunal and isotopic datasets from the Turkana Basin.','{"PhD in Paleoecology or related","Publication record","Statistical modelling in R or Python","Field season availability"}','KES 250,000 - 320,000',NULL,'postdoc@turkanabasin.org','TBI','verified','45LITE Verification Team',now(),CURRENT_DATE + 35,'senior','{"tbi","postdoc","research"}'),
('Camp Operations Assistant','Turkana Basin Institute','tbi','Ileret, Turkana','contract','Support daily operations at TBI Ileret research camp including supplies, vehicle coordination, and visitor researcher support.','{"Certificate or diploma in hospitality or logistics","Driving licence","Fluency in Kiswahili and English","Practical problem solving"}','KES 60,000 - 90,000',NULL,'operations@turkanabasin.org','TBI','verified','45LITE Verification Team',now(),CURRENT_DATE + 11,'entry','{"tbi","operations"}'),
('Software Engineering Intern','Safaricom PLC','tech_company','Nairobi','internship','A six-month paid internship in the Digital Engineering tribe. Interns pair with senior engineers on real production features and complete a capstone project.','{"Final year or recent graduate in CS/IT","Familiarity with one programming language","Strong problem solving","Available full time for 6 months"}','KES 40,000 stipend','https://safaricom.co.ke/careers',NULL,'Safaricom Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 8,'entry','{"internship","tech"}'),
('Industrial Attachment - ICT Department','Kenya Commercial Bank','tech_company','Nairobi','attachment','Three-month industrial attachment for students requiring attachment as part of their degree or diploma. Rotations across service desk, networks and applications support.','{"Currently enrolled student","Attachment letter from institution","Basic ICT knowledge","Insurance cover"}','KES 15,000 stipend',NULL,'attachments@kcbgroup.com','KCB Group','verified','45LITE Verification Team',now(),CURRENT_DATE + 5,'entry','{"attachment","ict","student"}'),
('Industrial Attachment - Research Office','Egerton University','university','Nakuru','attachment','Attachment opportunity supporting the university research office with data entry, grant tracking and publication indexing.','{"Ongoing undergraduate studies","Attachment introduction letter","Good MS Excel skills"}','KES 10,000 stipend',NULL,'research@egerton.ac.ke','Egerton University','verified','45LITE Verification Team',now(),CURRENT_DATE + 13,'entry','{"attachment","research","student"}'),
('Marketing Intern','Twiga Foods','startup','Nairobi','internship','Support the growth team with market research, vendor outreach campaigns and content for our farmer and retailer community.','{"Degree in Marketing or Communications","Excellent writing","Social media familiarity","3-month commitment"}','KES 30,000 stipend',NULL,'internships@twiga.com','Twiga Foods','verified','45LITE Verification Team',now(),CURRENT_DATE + 17,'entry','{"internship","marketing"}'),
('Graduate Trainee, Engineering','Equity Bank','tech_company','Nairobi','internship','A 12-month graduate trainee programme rotating through data engineering, cloud platform and digital channels teams.','{"First class or upper second degree","Graduated within the last 2 years","Analytical mindset","Strong academic record"}','KES 70,000 stipend','https://equitygroupholdings.com/careers',NULL,'Equity Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 19,'entry','{"internship","graduate","tech"}'),
('Remote Full Stack Engineer','Deel','remote_abroad','Remote (Africa)','remote','Deel is hiring full stack engineers across Africa to build global payroll and compliance products used in 150+ countries.','{"5+ years full stack experience","TypeScript, React, Node.js","Async communication skills","Own reliable internet"}','USD 60,000 - 95,000 / year','https://deel.com/careers',NULL,'Deel Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 24,'senior','{"remote","abroad","full stack"}'),
('Remote Customer Success Manager','Zapier','remote_abroad','Remote (EMEA)','remote','Own a portfolio of mid-market accounts, drive adoption of automation workflows, and partner with product on customer feedback loops.','{"3+ years SaaS customer success","Excellent English communication","Comfort with technical products","EMEA timezone overlap"}','USD 55,000 - 75,000 / year','https://zapier.com/jobs',NULL,'Zapier Jobs','verified','45LITE Verification Team',now(),CURRENT_DATE + 26,'mid','{"remote","abroad","customer success"}'),
('Remote Data Engineer','Shopify','remote_abroad','Remote (Global)','remote','Build data pipelines that power merchant analytics at scale. You will work with streaming and batch systems across a very large data estate.','{"4+ years data engineering","Spark, dbt, SQL at scale","Python","Strong written communication"}','USD 90,000 - 130,000 / year','https://shopify.com/careers',NULL,'Shopify Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 29,'senior','{"remote","abroad","data"}'),
('Remote Technical Writer','GitLab','remote_abroad','Remote (Global)','remote','Document developer-facing features for GitLab CI/CD. Work fully async with engineering teams across all timezones.','{"2+ years technical writing","Git and CI/CD familiarity","Markdown and docs-as-code","Portfolio of published docs"}','USD 60,000 - 85,000 / year','https://about.gitlab.com/jobs',NULL,'GitLab Jobs','verified','45LITE Verification Team',now(),CURRENT_DATE + 23,'mid','{"remote","abroad","writing"}'),
('Remote Product Designer','Canonical','remote_abroad','Remote (EMEA/Africa)','remote','Design interfaces for open source infrastructure tooling used by millions of developers worldwide.','{"4+ years product design","Systems thinking and design systems","Figma expertise","Portfolio required"}','USD 70,000 - 100,000 / year','https://canonical.com/careers',NULL,'Canonical Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 27,'mid','{"remote","abroad","design"}'),
('Programme Officer, Food Systems','FAO Kenya','ngo','Nairobi','contract','Support implementation of FAO food systems programmes in arid and semi-arid counties, including partner coordination and donor reporting.','{"Masters in Agriculture, Development or related","5 years programme experience","Donor reporting experience","Field travel readiness"}','USD 3,500 - 4,800 / month','https://fao.org/employment',NULL,'FAO Employment','verified','45LITE Verification Team',now(),CURRENT_DATE + 20,'senior','{"ngo","development","food systems"}'),
('Monitoring & Evaluation Officer','International Rescue Committee','ngo','Kakuma, Turkana','contract','Lead M&E for refugee livelihoods programming in Kakuma: indicator tracking, data quality assurance and learning reviews.','{"Degree in Statistics, Development or related","3+ years M&E in humanitarian settings","Kobo/ODK data collection","Report writing"}','KES 300,000 - 400,000',NULL,'kenya.jobs@rescue.org','IRC Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 14,'mid','{"ngo","m&e","humanitarian"}'),
('Data Officer, Health Programmes','UNICEF Kenya','ngo','Nairobi','contract','Manage health programme datasets, build dashboards for county health teams and support evidence generation for advocacy.','{"Degree in Data Science, Public Health or Statistics","Power BI or Tableau","Health information systems experience","UN system experience an advantage"}','USD 3,000 - 4,200 / month','https://unicef.org/careers',NULL,'UNICEF Careers','verified','45LITE Verification Team',now(),CURRENT_DATE + 18,'mid','{"ngo","health","data"}'),
('Communications Specialist','UN Habitat','ngo','Nairobi','contract','Craft communications for urban development programmes: press materials, digital campaigns and donor-facing storytelling.','{"Degree in Communications or Journalism","4+ years communications experience","Multimedia production skills","Excellent English writing"}','USD 3,200 - 4,500 / month','https://unhabitat.org/vacancies',NULL,'UN Habitat','verified','45LITE Verification Team',now(),CURRENT_DATE + 21,'mid','{"ngo","communications"}'),
('Grants Coordinator','Devex Partner NGO','ngo','Nairobi','part_time','Coordinate grant cycles for a portfolio of East Africa education programmes, including proposal development and compliance tracking.','{"3+ years grants management","Familiarity with USAID/FCDO compliance","Excellent organisation","Part time 20 hrs/week"}','KES 180,000 - 240,000',NULL,'grants@devexpartner.org','Devex','verified','45LITE Verification Team',now(),CURRENT_DATE + 6,'mid','{"ngo","grants","part time"}');
