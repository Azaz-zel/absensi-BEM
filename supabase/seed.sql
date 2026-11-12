-- ============================================================
-- Seed: 5 kementerian piket + 64 fungsionaris
-- Sumber: DATA FUNGSIONARIS BEM PM INSTIKI KABINET NAVAKARA
-- Kementerian Administrasi Negara & Keuangan Negara sengaja tidak dimasukkan.
-- ============================================================

insert into public.ministries (name, sort_order) values
  ('Kementerian Dalam Negeri', 1),
  ('Kementerian Luar Negeri', 2),
  ('Kementerian Komunikasi dan Informasi', 3),
  ('Kementerian Pemberdayaan Sumber Daya Mahasiswa', 4),
  ('Kementerian Pemberdayaan Masyarakat dan Lingkungan', 5)
on conflict (name) do nothing;

insert into public.people (full_name, name_key, nim, ministry_id, source)
select
  v.full_name,
  lower(regexp_replace(trim(v.full_name), '\s+', ' ', 'g')),
  v.nim,
  m.id,
  'seed'
from (values
  -- Luar Negeri (11)
  ('I Gede Govinda Adi Utama', '2502010009', 'Kementerian Luar Negeri'),
  ('Rayhan Galang Aputra', '2402010057', 'Kementerian Luar Negeri'),
  ('Liyana Putri Zahira', '2502020073', 'Kementerian Luar Negeri'),
  ('Ida Bagus Parasara Manuaba', '2401010764', 'Kementerian Luar Negeri'),
  ('Gusde Andika Saputra', '2601010115', 'Kementerian Luar Negeri'),
  ('Hizkia Gerry Purnomo', '2602020130', 'Kementerian Luar Negeri'),
  ('Ignatius Angguwangthon Dangga', '2602020019', 'Kementerian Luar Negeri'),
  ('Ni Kadek Dea Clarisna Sewananda', '2602020014', 'Kementerian Luar Negeri'),
  ('Ni Wayan Febby Feriska', '2501010038', 'Kementerian Luar Negeri'),
  ('Putu Andika Mahesa Putra', '2601020122', 'Kementerian Luar Negeri'),
  ('Ni Kadek Eva Dwi Prajayanti', '2602020449', 'Kementerian Luar Negeri'),

  -- Dalam Negeri (13)
  ('Putu Dewi Arma Elysa Putri', '2502020569', 'Kementerian Dalam Negeri'),
  ('Gracio Timothy Piga', '2401010630', 'Kementerian Dalam Negeri'),
  ('Putu Riyan Sastrawan Sangging', '2402020004', 'Kementerian Dalam Negeri'),
  ('Eka Kurnia Dwi Saputra', '2402010077', 'Kementerian Dalam Negeri'),
  ('Nasrullah Alkharim', '2402010084', 'Kementerian Dalam Negeri'),
  ('Anak Agung Gde Satria Panji Dharma Putra', '2402010071', 'Kementerian Dalam Negeri'),
  ('I Gede Wirdiana Surya Aryoktajaya', '2501020082', 'Kementerian Dalam Negeri'),
  ('I Nyoman Radhea Sentana', '2601020112', 'Kementerian Dalam Negeri'),
  ('I Gusti Ayu Suci Rahmawati', '2602020533', 'Kementerian Dalam Negeri'),
  ('Ngurah Anom Satrya Wibawa', '2601010156', 'Kementerian Dalam Negeri'),
  ('Juan Aarob Immanuel Raweyai', '2602020235', 'Kementerian Dalam Negeri'),
  ('Imelda Rukmini Chaimin', '2502020575', 'Kementerian Dalam Negeri'),
  ('I Putu Ega Aditya Pramandana', '2401020124', 'Kementerian Dalam Negeri'),

  -- Komunikasi dan Informasi (13)
  ('Aditya Ramdhani', '2502010007', 'Kementerian Komunikasi dan Informasi'),
  ('Kadek Andika Putra', '2502010027', 'Kementerian Komunikasi dan Informasi'),
  ('I Gede Sadayatana Putra', '2501020011', 'Kementerian Komunikasi dan Informasi'),
  ('Rathu Rifqy Maharany', '2502010199', 'Kementerian Komunikasi dan Informasi'),
  ('Made Damar Tuhu Maha Darma', '2401010752', 'Kementerian Komunikasi dan Informasi'),
  ('I Putu Krishna Merta Pradnya Udrayana', '2502020604', 'Kementerian Komunikasi dan Informasi'),
  ('I Putu Aditya Dharma', '2402010206', 'Kementerian Komunikasi dan Informasi'),
  ('Abel Ivana Choe', '2602020046', 'Kementerian Komunikasi dan Informasi'),
  ('Adi Fahrul Qalbi', '2502010030', 'Kementerian Komunikasi dan Informasi'),
  ('Cessario Oscar', '2602010011', 'Kementerian Komunikasi dan Informasi'),
  ('I Wayan Angga Saputra', '2502010026', 'Kementerian Komunikasi dan Informasi'),
  ('Putu Ocha Valentino Adi Saputra', '2502010184', 'Kementerian Komunikasi dan Informasi'),
  ('Anak Agung Citra Amelia Putri', '2602010031', 'Kementerian Komunikasi dan Informasi'),

  -- Pemberdayaan Sumber Daya Mahasiswa (12)
  ('I Gusti Ayu Anindya Echa Swandevi', '2502020220', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Wisnu Cahya Putra', '2502020521', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('I Made Puja Pratistha', '2401010776', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Dewa Gde Julian Abi Wedanta', '2501010042', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('I Nyoman Yudi Artawiguna', '2601010161', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('I Gede Novanda Anggara Putra', '2501010160', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('I Putu Aditya Adhiguna Pratama Putra', '2602010112', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Ni Komang Tania Arianita', '2602020464', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Revalia Bintang Divana Restu', '2602020597', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Yoanita Oktaviani Kidi Mukin', '2502020423', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('Anak Agung Gede Wahyu Permana Putra', '2602010096', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),
  ('I Kadek Wardita', '2602020008', 'Kementerian Pemberdayaan Sumber Daya Mahasiswa'),

  -- Pemberdayaan Masyarakat dan Lingkungan (15)
  ('I Made Pradipta Daro Astra', '2502020356', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('I Gusti Ayu Jentika Dewayani', '2501020060', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Putu Indira Danas Tri Tiyasa', '2502020052', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Ni Made Dwi Paryani', '2502020050', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Gusti Ayu Putu Riza Indira Putri', '2602020525', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('I Komang Yoga Artha Ardhana', '2602020032', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('I Putu Surya Dipa Cahyana Putra', '2501010043', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Kadek Mas Rara Cahyaning', '2602020269', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Putu Ayu Sukma Aryanthi', '2602020450', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Ni Luh Putu Wimala Ambar Maheswari', '2602020458', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Marsya Aulia Putri', '2602010067', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Ni Luh Artalita', '2602020283', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Ni Made Kessari Oktaviani', '2501010138', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Ni Putu Ayu Setiani', '2602020515', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan'),
  ('Edward Innocent Tandisapan', '2602020594', 'Kementerian Pemberdayaan Masyarakat dan Lingkungan')
) as v(full_name, nim, ministry_name)
join public.ministries m on m.name = v.ministry_name
on conflict (name_key) do nothing;
