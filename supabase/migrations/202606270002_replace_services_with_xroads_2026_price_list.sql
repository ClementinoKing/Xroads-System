-- Replace the starter service catalog with the Xroads Health 2026 price list.
-- Existing appointment rows are preserved by remapping legacy consultation bookings
-- before retiring the old starter services.

alter table public.services
  drop constraint if exists services_category_check;

insert into public.service_categories (name, description, sort_order, is_active)
values
  ('General Dentistry', 'General dental diagnosis, preventive care, extractions, restorations and root treatment.', 1, true),
  ('Dental Prosthetics', 'Crowns, bridges, dentures and related prosthetic procedures.', 2, true),
  ('Oral Surgery', 'Oral surgery, periodontics, infection treatment and surgical extractions.', 3, true),
  ('Maxillo-Facial Surgery', 'Oral and maxillo-facial surgery services.', 4, true),
  ('Orthodontics', 'Orthodontics and mal-occlusion treatment services.', 5, true)
on conflict (name) do update set
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = timezone('utc', now());

insert into public.service_price_lists (name, description, effective_from, currency_code, is_active)
values (
  'Xroads Health Price List 2026',
  'Imported Xroads Health tariff effective 1 March 2026.',
  '2026-03-01',
  'MWK',
  true
)
on conflict (name, effective_from) do update set
  description = excluded.description,
  currency_code = excluded.currency_code,
  is_active = true,
  updated_at = timezone('utc', now());

with category_map as (
  select id, name from public.service_categories
)
insert into public.service_sections (category_id, name, sort_order, is_active)
values
  ((select id from category_map where name = 'General Dentistry'), 'Diagnosis', 1, true),
  ((select id from category_map where name = 'General Dentistry'), 'Miscellaneous', 2, true),
  ((select id from category_map where name = 'General Dentistry'), 'Preventive Dentistry', 3, true),
  ((select id from category_map where name = 'General Dentistry'), 'Exodontics / Extractions', 4, true),
  ((select id from category_map where name = 'General Dentistry'), 'Amalgam Restoration', 5, true),
  ((select id from category_map where name = 'General Dentistry'), 'Composite Restoration', 6, true),
  ((select id from category_map where name = 'General Dentistry'), 'Endodontics / Root Treatment', 7, true),
  ((select id from category_map where name = 'General Dentistry'), 'Complete Root Treatment', 8, true),
  ((select id from category_map where name = 'Dental Prosthetics'), 'Crowns and Bridges', 1, true),
  ((select id from category_map where name = 'Dental Prosthetics'), 'Dentures', 2, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Oral Surgery', 1, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Tumours', 2, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Periodontics', 3, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Treatment of Oral Infection', 4, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Surgical Extraction of Tooth or Root', 5, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Surgical Removal of Buried Roots', 6, true),
  ((select id from category_map where name = 'Oral Surgery'), 'Para-Orthodontic Surgical Procedures', 7, true),
  ((select id from category_map where name = 'Maxillo-Facial Surgery'), 'Consultations', 1, true),
  ((select id from category_map where name = 'Maxillo-Facial Surgery'), 'Records and Investigations', 2, true),
  ((select id from category_map where name = 'Maxillo-Facial Surgery'), 'Soft Tissue Injuries', 3, true),
  ((select id from category_map where name = 'Maxillo-Facial Surgery'), 'Oral Surgical Procedures', 4, true),
  ((select id from category_map where name = 'Orthodontics'), 'Orthodontics Consultations', 1, true),
  ((select id from category_map where name = 'Orthodontics'), 'Removable Appliances', 2, true),
  ((select id from category_map where name = 'Orthodontics'), 'Fixed Appliances', 3, true)
on conflict (category_id, name) do update set
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = timezone('utc', now());

with seed_data(service_code, category_name, section_name, service_name, amount) as (
  values
    ('98101', 'General Dentistry', 'Diagnosis', 'Initial, charting and case history', 15000.00),
    ('98102', 'General Dentistry', 'Diagnosis', 'Periodic after initial visit', 15000.00),
    ('98103', 'General Dentistry', 'Diagnosis', 'Consultation: covers patient referrals and problems', 15000.00),
    ('98104', 'General Dentistry', 'Diagnosis', 'Intra-Oral X-ray per film', 15000.00),
    ('98105', 'General Dentistry', 'Diagnosis', 'Occlusal view per film', 10000.00),
    ('98107', 'General Dentistry', 'Diagnosis', 'Panorex', 30000.00),
    ('98109', 'General Dentistry', 'Miscellaneous', 'Comprehensive Treatment Plan', 8200.00),
    ('98110', 'General Dentistry', 'Miscellaneous', 'Emergency after hour surcharge - treatment excludes filling and scaling. Applicable to extraction or injury e.g. RTA', 15000.00),
    ('98111', 'General Dentistry', 'Miscellaneous', 'Domiciliary or hospital visits', 11200.00),
    ('98112', 'General Dentistry', 'Miscellaneous', 'Additional fee for procedure under GA', 18000.00),
    ('98116', 'General Dentistry', 'Miscellaneous', 'Minor occlusal equilibration', 10000.00),
    ('98117', 'General Dentistry', 'Miscellaneous', 'Treatment of Hypersensitive Dentine per quadrant', 10000.00),
    ('98119', 'General Dentistry', 'Miscellaneous', 'Cement of Crown', 55000.00),
    ('98201', 'General Dentistry', 'Preventive Dentistry', 'Prophylaxis - children 4-18 years', 20000.00),
    ('98204', 'General Dentistry', 'Preventive Dentistry', 'Prophylaxis - adult gross', 35000.00),
    ('98205', 'General Dentistry', 'Preventive Dentistry', 'Topical application of fluoride - children under 18 years', 25000.00),
    ('98208', 'General Dentistry', 'Preventive Dentistry', 'Fissure sealants per tooth', 25000.00),
    ('98300', 'General Dentistry', 'Exodontics / Extractions', 'First Extraction - Adult', 35000.00),
    ('98301', 'General Dentistry', 'Exodontics / Extractions', 'First extraction - child deciduous teeth between 4-18 years', 28000.00),
    ('98302', 'General Dentistry', 'Exodontics / Extractions', 'Each additional extraction in same quadrant', 28000.00),
    ('98303', 'General Dentistry', 'Exodontics / Extractions', 'Clearance maximum upper jaws', 90000.00),
    ('98304', 'General Dentistry', 'Exodontics / Extractions', 'Per jaw maximum', 95000.00),
    ('98305', 'General Dentistry', 'Exodontics / Extractions', 'Treatment of post-extraction hemorrhage', 28000.00),
    ('98306', 'General Dentistry', 'Exodontics / Extractions', 'Treatment of septic socket', 28000.00),
    ('98401', 'General Dentistry', 'Amalgam Restoration', 'One surface / simple deciduous', 44000.00),
    ('98402', 'General Dentistry', 'Amalgam Restoration', 'Two surfaces / compound deciduous', 50000.00),
    ('98403', 'General Dentistry', 'Amalgam Restoration', 'Three surfaces', 55000.00),
    ('98404', 'General Dentistry', 'Amalgam Restoration', 'Four or more surfaces', 56000.00),
    ('98408', 'General Dentistry', 'Composite Restoration', 'One surface', 54000.00),
    ('98409', 'General Dentistry', 'Composite Restoration', 'Two surfaces', 56000.00),
    ('98410', 'General Dentistry', 'Composite Restoration', 'Three surfaces', 60000.00),
    ('98411', 'General Dentistry', 'Composite Restoration', 'Four or more surfaces', 65000.00),
    ('98412', 'General Dentistry', 'Composite Restoration', 'Additional fee for light cure, per restoration', 10000.00),
    ('98413', 'General Dentistry', 'Composite Restoration', 'Composite resin build-up including veneers', 75000.00),
    ('98415', 'General Dentistry', 'Composite Restoration', 'Pin reinforcement - per tooth', 15000.00),
    ('98601', 'General Dentistry', 'Endodontics / Root Treatment', 'One canal - per visit', 35000.00),
    ('98602', 'General Dentistry', 'Endodontics / Root Treatment', 'Two canals - per visit', 40000.00),
    ('98603', 'General Dentistry', 'Endodontics / Root Treatment', 'Three canals - per visit', 48000.00),
    ('98604', 'General Dentistry', 'Endodontics / Root Treatment', 'Four or more canals - per visit', 60000.00),
    ('98605', 'General Dentistry', 'Endodontics / Root Treatment', 'Obturation / placement of root canal filling - one canal', 45000.00),
    ('98606', 'General Dentistry', 'Endodontics / Root Treatment', 'Obturation / placement of root canal filling - two canals', 50000.00),
    ('98607', 'General Dentistry', 'Endodontics / Root Treatment', 'Obturation / placement of root canal filling - three canals', 65000.00),
    ('98608', 'General Dentistry', 'Endodontics / Root Treatment', 'Obturation / placement of root canal filling - four or more canals', 70000.00),
    ('98609', 'General Dentistry', 'Complete Root Treatment', 'Complete root treatment - one canal', 75000.00),
    ('98610', 'General Dentistry', 'Complete Root Treatment', 'Complete root treatment - two canals', 80000.00),
    ('98611', 'General Dentistry', 'Complete Root Treatment', 'Complete root treatment - three canals', 85000.00),
    ('98612', 'General Dentistry', 'Complete Root Treatment', 'Complete root treatment - four or more canals', 100000.00),
    ('98613', 'General Dentistry', 'Complete Root Treatment', 'Pre-apical X-rays', 10000.00),
    ('98614', 'General Dentistry', 'Complete Root Treatment', 'Pulp Cap', 20000.00),
    ('98615', 'General Dentistry', 'Complete Root Treatment', 'Pulpotomy', 20000.00),
    ('98616', 'General Dentistry', 'Complete Root Treatment', 'Devitalization - not to be used with root treatment carried out', 15000.00),
    ('98516', 'Dental Prosthetics', 'Crowns and Bridges', 'Full metal crown - Porcelain Bonded', 550000.00),
    ('98517', 'Dental Prosthetics', 'Crowns and Bridges', 'Full metal crown - Silver Bonded', 550000.00),
    ('98518', 'Dental Prosthetics', 'Crowns and Bridges', 'Full metal crown - Gold Bonded', 650000.00),
    ('98519', 'Dental Prosthetics', 'Crowns and Bridges', '3 unit bridge - Porcelain bonded', 1650000.00),
    ('98520', 'Dental Prosthetics', 'Crowns and Bridges', 'Zirconia crown', 1000000.00),
    ('98529', 'Dental Prosthetics', 'Crowns and Bridges', 'Ceramic Crown', 1000000.00),
    ('98701', 'Dental Prosthetics', 'Dentures', 'Full upper and lower denture', 650000.00),
    ('98702', 'Dental Prosthetics', 'Dentures', 'Full upper or lower denture', 400000.00),
    ('98703', 'Dental Prosthetics', 'Dentures', 'Partial upper or lower denture', 200000.00),
    ('98704', 'Dental Prosthetics', 'Dentures', 'Immediate denture', 240000.00),
    ('98705', 'Dental Prosthetics', 'Dentures', 'Stainless steel clasp', 45000.00),
    ('98706', 'Dental Prosthetics', 'Dentures', 'Stainless steel lingual or palatal', 150000.00),
    ('98707', 'Dental Prosthetics', 'Dentures', 'Reline denture', 80000.00),
    ('98708', 'Dental Prosthetics', 'Dentures', 'Additional tooth', 70000.00),
    ('98709', 'Dental Prosthetics', 'Dentures', 'Fracture or crack repair', 100000.00),
    ('98750', 'Oral Surgery', 'Oral Surgery', 'Alveolectory - per jaw and suturing', 18000.00),
    ('98751', 'Oral Surgery', 'Oral Surgery', 'Frenectomy', 27000.00),
    ('98752', 'Oral Surgery', 'Oral Surgery', 'Frenoplasty', 62000.00),
    ('98753', 'Oral Surgery', 'Oral Surgery', 'Mylo-Hyoid ridge reduction - per side', 64000.00),
    ('98754', 'Oral Surgery', 'Oral Surgery', 'Reduction of hypertrophic tuberosities - per side', 64000.00),
    ('98755', 'Oral Surgery', 'Oral Surgery', 'Excision of denture hyperplasia', 86000.00),
    ('98756', 'Oral Surgery', 'Oral Surgery', 'Placement of an Osseo integrated implant', 96000.00),
    ('98757', 'Oral Surgery', 'Oral Surgery', 'Cost of implant', 48000.00),
    ('98758', 'Oral Surgery', 'Oral Surgery', 'Exposure of an Osseo integrated implant and placement of a transmucosal element', 64000.00),
    ('98759', 'Oral Surgery', 'Tumours', 'Biopsy - excisional', 30000.00),
    ('98760', 'Oral Surgery', 'Tumours', 'Partial / Incisional biopsy', 23500.00),
    ('98762', 'Oral Surgery', 'Periodontics', 'Gingivectomy per quadrant', 47000.00),
    ('98763', 'Oral Surgery', 'Periodontics', 'Apically repositioned flaps - per quadrant', 67000.00),
    ('98764', 'Oral Surgery', 'Periodontics', 'Plastic or flap procedure involving region of a few teeth', 62000.00),
    ('98765', 'Oral Surgery', 'Periodontics', 'Treatment of deep pocketing per mouth / oral cavity', 21000.00),
    ('98766', 'Oral Surgery', 'Periodontics', 'Reattachment procedure per quadrant', 58000.00),
    ('98767', 'Oral Surgery', 'Periodontics', 'Major occlusal equilibration', 26500.00),
    ('98768', 'Oral Surgery', 'Periodontics', 'Splinting of teeth', 55000.00),
    ('98769', 'Oral Surgery', 'Periodontics', 'Removal of splint', 21000.00),
    ('98770', 'Oral Surgery', 'Treatment of Oral Infection', 'Incision and drainage pyogenic abscess - intra-oral', 23000.00),
    ('98771', 'Oral Surgery', 'Treatment of Oral Infection', 'Incision and drainage pyogenic abscess - extra-oral', 46000.00),
    ('98772', 'Oral Surgery', 'Treatment of Oral Infection', 'Apicectomy per root', 37000.00),
    ('98773', 'Oral Surgery', 'Treatment of Oral Infection', 'Retrograde root filling', 27000.00),
    ('98774', 'Oral Surgery', 'Treatment of Oral Infection', 'Sequestrectomy - intra-oral flap operation', 40000.00),
    ('98775', 'Oral Surgery', 'Surgical Extraction of Tooth or Root', 'Surgical extraction of wisdom tooth', 250000.00),
    ('98776', 'Oral Surgery', 'Surgical Extraction of Tooth or Root', 'Extraction complex - not to include removal of roots / subsequent roots', 350000.00),
    ('98777', 'Oral Surgery', 'Surgical Removal of Buried Roots', 'Removal of first root', 250000.00),
    ('98778', 'Oral Surgery', 'Surgical Removal of Buried Roots', 'Removal of subsequent roots - same quadrant', 100000.00),
    ('98779', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Incursionary exposure of unerupted tooth - soft tissue only', 100000.00),
    ('98780', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Surgical exposure of unerupted tooth - bone removal', 200000.00),
    ('98781', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Surgical re-implantation of tooth plus lab fees and splinting', 200000.00),
    ('98782', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Surgical transplantation plus lab fees and splinting', 200000.00),
    ('98783', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Soft tissue impaction - flap', 250000.00),
    ('98784', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Bony impaction - flap and bone removal', 150000.00),
    ('98785', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Bony impaction - flap, bone removal and tooth section', 350000.00),
    ('98786', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Second tooth - same quadrant', 250000.00),
    ('98787', 'Oral Surgery', 'Para-Orthodontic Surgical Procedures', 'Subsequent at same operation - same quadrant', 200000.00),
    ('98811', 'Maxillo-Facial Surgery', 'Consultations', 'At consulting rooms', 9500.00),
    ('98812', 'Maxillo-Facial Surgery', 'Consultations', 'At home, nursing home or hospitals', 16500.00),
    ('98813', 'Maxillo-Facial Surgery', 'Consultations', 'Subsequent consultation at rooms', 4000.00),
    ('98814', 'Maxillo-Facial Surgery', 'Consultations', 'Subsequent consultation elsewhere', 8500.00),
    ('98815', 'Maxillo-Facial Surgery', 'Consultations', 'Subsequent consultation per week to a maximum of', 22000.00),
    ('98817', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Full mouth intra-oral X-rays', 37500.00),
    ('98818', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Cephalometric X-ray analysis', 37500.00),
    ('98819', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Panoramic X-ray', 32000.00),
    ('98820', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Study models', 21000.00),
    ('98821', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Full face and profile photographs', 4000.00),
    ('98822', 'Maxillo-Facial Surgery', 'Records and Investigations', 'Diagnosis and treatment planning', 11000.00),
    ('98842', 'Maxillo-Facial Surgery', 'Soft Tissue Injuries', 'Epulis', 75000.00),
    ('98843', 'Maxillo-Facial Surgery', 'Soft Tissue Injuries', 'Associated soft tissue injuries', 120000.00),
    ('98444', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Decorticoectomy and saucerization of osteomyelitis', 257000.00),
    ('98845', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Hemi-resection of mandible', 541000.00),
    ('98846', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Bone grafts major repairs', 3000.00),
    ('98847', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Operation for improvement or restoration of occlusion and masticatory function e.g. bilateral Remi section', 250000.00),
    ('98848', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Condylotomy', 265000.00),
    ('98849', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Reduction of mandibular joint dislocation', 280500.00),
    ('98850', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Requiring G.A', 51000.00),
    ('98851', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Requiring G.A plus wiring', 160000.00),
    ('98852', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Cysts - intra-oral approach large or complex', 180000.00),
    ('98853', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Extra-oral approach', 223000.00),
    ('98854', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Removal of calcium from duct by operation', 64000.00),
    ('98855', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Closure of oral-antral opening', 64000.00),
    ('98856', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Removal of tooth fragment from antrum with closure', 166000.00),
    ('98857', 'Maxillo-Facial Surgery', 'Oral Surgical Procedures', 'Vestibule-plasty without skin graft - per quadrant', 166000.00),
    ('98902', 'Orthodontics', 'Orthodontics Consultations', 'Subsequent consultation', 50000.00),
    ('98903', 'Orthodontics', 'Orthodontics Consultations', 'A pair of study models', 70000.00),
    ('98904', 'Orthodontics', 'Removable Appliances', 'Simple movement - 1 to 2 teeth', 200000.00),
    ('98905', 'Orthodontics', 'Removable Appliances', 'Complicated movement', 250000.00),
    ('98906', 'Orthodontics', 'Removable Appliances', 'Major', 300000.00),
    ('98907', 'Orthodontics', 'Removable Appliances', 'Follow-up appliances', 150000.00),
    ('98908', 'Orthodontics', 'Removable Appliances', 'Cover plates', 150000.00),
    ('98909', 'Orthodontics', 'Removable Appliances', 'Habit correctors', 250000.00),
    ('98910', 'Orthodontics', 'Removable Appliances', 'Maintenance and adjustments per month - excluding repairs', 55000.00),
    ('98911', 'Orthodontics', 'Removable Appliances', 'Repairs', 150000.00),
    ('98913', 'Orthodontics', 'Fixed Appliances', 'Fixed space maintainer', 75000.00),
    ('98914', 'Orthodontics', 'Fixed Appliances', 'Adaptation of each band', 75000.00),
    ('98915', 'Orthodontics', 'Fixed Appliances', 'Placement of appliances', 500000.00),
    ('98917', 'Orthodontics', 'Fixed Appliances', 'Retention appliance', 161000.00),
    ('98918', 'Orthodontics', 'Fixed Appliances', 'Bracelets', 4500000.00),
    ('98919', 'Orthodontics', 'Fixed Appliances', 'Teeth alignment only - Invisalign', 6000000.00),
    ('98920', 'Orthodontics', 'Fixed Appliances', 'Teeth alignment plus jaw involving - Invisalign', 3800000.00)
),
resolved_seed as (
  select
    sd.service_code,
    c.id as category_id,
    ss.id as section_id,
    sd.service_name,
    sd.amount,
    row_number() over (order by c.sort_order, ss.sort_order, sd.service_code) as sort_order
  from seed_data sd
  join public.service_categories c
    on c.name = sd.category_name
  join public.service_sections ss
    on ss.category_id = c.id
    and ss.name = sd.section_name
),
updated_services as (
  update public.services s
  set
    category_id = rs.category_id,
    section_id = rs.section_id,
    name = rs.service_name,
    description = rs.service_name,
    duration_minutes = coalesce(s.duration_minutes, s.default_duration_minutes, 30),
    default_duration_minutes = coalesce(s.default_duration_minutes, s.duration_minutes, 30),
    sort_order = rs.sort_order,
    is_active = true,
    deleted_at = null,
    metadata = jsonb_build_object(
      'source', 'Xroads Health Price List',
      'effective_from', '2026-03-01'
    )
  from resolved_seed rs
  where s.service_code = rs.service_code
    and s.deleted_at is null
  returning s.id, s.service_code
),
inserted_services as (
  insert into public.services (
    service_code,
    category_id,
    section_id,
    name,
    description,
    duration_minutes,
    default_duration_minutes,
    sort_order,
    is_active,
    metadata
  )
  select
    rs.service_code,
    rs.category_id,
    rs.section_id,
    rs.service_name,
    rs.service_name,
    30,
    30,
    rs.sort_order,
    true,
    jsonb_build_object(
      'source', 'Xroads Health Price List',
      'effective_from', '2026-03-01'
    )
  from resolved_seed rs
  where not exists (
    select 1
    from public.services s
    where s.service_code = rs.service_code
      and s.deleted_at is null
  )
  returning id, service_code
),
seeded_services as (
  select id, service_code from updated_services
  union
  select id, service_code from inserted_services
)
insert into public.service_prices (
  service_id,
  price_list_id,
  amount,
  pricing_unit,
  notes,
  is_active
)
select
  ss.id,
  pl.id,
  rs.amount,
  'per procedure',
  'Imported from Xroads Health Price List effective 1 March 2026',
  true
from resolved_seed rs
join seeded_services ss
  on ss.service_code = rs.service_code
join public.service_price_lists pl
  on pl.name = 'Xroads Health Price List 2026'
 and pl.effective_from = '2026-03-01'
on conflict (service_id, price_list_id) do update set
  amount = excluded.amount,
  pricing_unit = excluded.pricing_unit,
  notes = excluded.notes,
  is_active = true,
  updated_at = timezone('utc', now());

update public.appointments a
set service_id = replacement_service.id
from public.services legacy_service
join public.services replacement_service
  on replacement_service.service_code = '98103'
 and replacement_service.deleted_at is null
where a.service_id = legacy_service.id
  and legacy_service.service_code = 'consultation'
  and a.deleted_at is null
  and a.service_id <> replacement_service.id;

with seed_codes(service_code) as (
  values
    ('98101'), ('98102'), ('98103'), ('98104'), ('98105'), ('98107'),
    ('98109'), ('98110'), ('98111'), ('98112'), ('98116'), ('98117'), ('98119'),
    ('98201'), ('98204'), ('98205'), ('98208'),
    ('98300'), ('98301'), ('98302'), ('98303'), ('98304'), ('98305'), ('98306'),
    ('98401'), ('98402'), ('98403'), ('98404'),
    ('98408'), ('98409'), ('98410'), ('98411'), ('98412'), ('98413'), ('98415'),
    ('98444'),
    ('98516'), ('98517'), ('98518'), ('98519'), ('98520'), ('98529'),
    ('98601'), ('98602'), ('98603'), ('98604'), ('98605'), ('98606'), ('98607'), ('98608'),
    ('98609'), ('98610'), ('98611'), ('98612'), ('98613'), ('98614'), ('98615'), ('98616'),
    ('98701'), ('98702'), ('98703'), ('98704'), ('98705'), ('98706'), ('98707'), ('98708'), ('98709'),
    ('98750'), ('98751'), ('98752'), ('98753'), ('98754'), ('98755'), ('98756'), ('98757'), ('98758'),
    ('98759'), ('98760'),
    ('98762'), ('98763'), ('98764'), ('98765'), ('98766'), ('98767'), ('98768'), ('98769'),
    ('98770'), ('98771'), ('98772'), ('98773'), ('98774'),
    ('98775'), ('98776'),
    ('98777'), ('98778'),
    ('98779'), ('98780'), ('98781'), ('98782'), ('98783'), ('98784'), ('98785'), ('98786'), ('98787'),
    ('98811'), ('98812'), ('98813'), ('98814'), ('98815'),
    ('98817'), ('98818'), ('98819'), ('98820'), ('98821'), ('98822'),
    ('98842'), ('98843'),
    ('98845'), ('98846'), ('98847'), ('98848'), ('98849'), ('98850'), ('98851'), ('98852'), ('98853'), ('98854'), ('98855'), ('98856'), ('98857'),
    ('98902'), ('98903'), ('98904'), ('98905'), ('98906'), ('98907'), ('98908'), ('98909'), ('98910'), ('98911'),
    ('98913'), ('98914'), ('98915'), ('98917'), ('98918'), ('98919'), ('98920')
)
update public.services s
set
  is_active = false,
  metadata = coalesce(s.metadata, '{}'::jsonb) || jsonb_build_object(
    'legacy_catalog', true,
    'replaced_by_price_list', 'Xroads Health Price List 2026'
  )
where s.deleted_at is null
  and not exists (
    select 1
    from seed_codes sc
    where sc.service_code = s.service_code
  )
  and exists (
    select 1
    from public.appointments a
    where a.service_id = s.id
      and a.deleted_at is null
  );

with seed_codes(service_code) as (
  values
    ('98101'), ('98102'), ('98103'), ('98104'), ('98105'), ('98107'),
    ('98109'), ('98110'), ('98111'), ('98112'), ('98116'), ('98117'), ('98119'),
    ('98201'), ('98204'), ('98205'), ('98208'),
    ('98300'), ('98301'), ('98302'), ('98303'), ('98304'), ('98305'), ('98306'),
    ('98401'), ('98402'), ('98403'), ('98404'),
    ('98408'), ('98409'), ('98410'), ('98411'), ('98412'), ('98413'), ('98415'),
    ('98444'),
    ('98516'), ('98517'), ('98518'), ('98519'), ('98520'), ('98529'),
    ('98601'), ('98602'), ('98603'), ('98604'), ('98605'), ('98606'), ('98607'), ('98608'),
    ('98609'), ('98610'), ('98611'), ('98612'), ('98613'), ('98614'), ('98615'), ('98616'),
    ('98701'), ('98702'), ('98703'), ('98704'), ('98705'), ('98706'), ('98707'), ('98708'), ('98709'),
    ('98750'), ('98751'), ('98752'), ('98753'), ('98754'), ('98755'), ('98756'), ('98757'), ('98758'),
    ('98759'), ('98760'),
    ('98762'), ('98763'), ('98764'), ('98765'), ('98766'), ('98767'), ('98768'), ('98769'),
    ('98770'), ('98771'), ('98772'), ('98773'), ('98774'),
    ('98775'), ('98776'),
    ('98777'), ('98778'),
    ('98779'), ('98780'), ('98781'), ('98782'), ('98783'), ('98784'), ('98785'), ('98786'), ('98787'),
    ('98811'), ('98812'), ('98813'), ('98814'), ('98815'),
    ('98817'), ('98818'), ('98819'), ('98820'), ('98821'), ('98822'),
    ('98842'), ('98843'),
    ('98845'), ('98846'), ('98847'), ('98848'), ('98849'), ('98850'), ('98851'), ('98852'), ('98853'), ('98854'), ('98855'), ('98856'), ('98857'),
    ('98902'), ('98903'), ('98904'), ('98905'), ('98906'), ('98907'), ('98908'), ('98909'), ('98910'), ('98911'),
    ('98913'), ('98914'), ('98915'), ('98917'), ('98918'), ('98919'), ('98920')
)
update public.services s
set
  is_active = false,
  deleted_at = coalesce(s.deleted_at, timezone('utc', now())),
  metadata = coalesce(s.metadata, '{}'::jsonb) || jsonb_build_object(
    'legacy_catalog', true,
    'replaced_by_price_list', 'Xroads Health Price List 2026'
  )
where s.deleted_at is null
  and not exists (
    select 1
    from seed_codes sc
    where sc.service_code = s.service_code
  )
  and not exists (
    select 1
    from public.appointments a
    where a.service_id = s.id
      and a.deleted_at is null
  );

update public.service_price_lists
set
  is_active = false,
  updated_at = timezone('utc', now())
where not (
  name = 'Xroads Health Price List 2026'
  and effective_from = '2026-03-01'
);

with seed_categories(name) as (
  values
    ('General Dentistry'),
    ('Dental Prosthetics'),
    ('Oral Surgery'),
    ('Maxillo-Facial Surgery'),
    ('Orthodontics')
)
update public.service_categories c
set
  is_active = false,
  updated_at = timezone('utc', now())
where not exists (
    select 1 from seed_categories sc where sc.name = c.name
  )
  and not exists (
    select 1
    from public.services s
    where s.category_id = c.id
      and s.deleted_at is null
      and s.is_active = true
  );

with seed_sections(category_name, section_name) as (
  values
    ('General Dentistry', 'Diagnosis'),
    ('General Dentistry', 'Miscellaneous'),
    ('General Dentistry', 'Preventive Dentistry'),
    ('General Dentistry', 'Exodontics / Extractions'),
    ('General Dentistry', 'Amalgam Restoration'),
    ('General Dentistry', 'Composite Restoration'),
    ('General Dentistry', 'Endodontics / Root Treatment'),
    ('General Dentistry', 'Complete Root Treatment'),
    ('Dental Prosthetics', 'Crowns and Bridges'),
    ('Dental Prosthetics', 'Dentures'),
    ('Oral Surgery', 'Oral Surgery'),
    ('Oral Surgery', 'Tumours'),
    ('Oral Surgery', 'Periodontics'),
    ('Oral Surgery', 'Treatment of Oral Infection'),
    ('Oral Surgery', 'Surgical Extraction of Tooth or Root'),
    ('Oral Surgery', 'Surgical Removal of Buried Roots'),
    ('Oral Surgery', 'Para-Orthodontic Surgical Procedures'),
    ('Maxillo-Facial Surgery', 'Consultations'),
    ('Maxillo-Facial Surgery', 'Records and Investigations'),
    ('Maxillo-Facial Surgery', 'Soft Tissue Injuries'),
    ('Maxillo-Facial Surgery', 'Oral Surgical Procedures'),
    ('Orthodontics', 'Orthodontics Consultations'),
    ('Orthodontics', 'Removable Appliances'),
    ('Orthodontics', 'Fixed Appliances')
)
update public.service_sections ss
set
  is_active = false,
  updated_at = timezone('utc', now())
from public.service_categories c
where ss.category_id = c.id
  and not exists (
    select 1
    from seed_sections seeds
    where seeds.category_name = c.name
      and seeds.section_name = ss.name
  )
  and not exists (
    select 1
    from public.services s
    where s.section_id = ss.id
      and s.deleted_at is null
      and s.is_active = true
  );
