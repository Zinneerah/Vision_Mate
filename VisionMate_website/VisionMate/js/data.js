// ============================================================
//  VisionMate – Admin-Only System
//  data.js  |  Zones, Caretakers & Patients dummy data
// ============================================================

const VM_DATA = (() => {

  // ── Zones ──────────────────────────────────────────────────
  const zones = [
    { id: 'z1', name: 'North Nazimabad', color: '#5B3FE8', icon: 'bi-geo-alt-fill' },
    { id: 'z2', name: 'New Karachi',     color: '#06B6D4', icon: 'bi-geo-alt-fill' },
    { id: 'z3', name: 'Naya Nazimabad',  color: '#22C55E', icon: 'bi-geo-alt-fill' },
    { id: 'z4', name: 'FB Area',         color: '#F59E0B', icon: 'bi-geo-alt-fill' }
  ];

  // ── Caretakers (10 per zone = 40 total) ────────────────────
  // FB Area caretaker #1 = hardware-linked (id: 'ct_z4_1')
  const caretakers = [
    // --- North Nazimabad (z1) ---
    { id:'ct_z1_1', zoneId:'z1', zoneName:'North Nazimabad', name:'Fatima Malik',    age:34, gender:'Female', contact:'0300-1234567', address:'House 12, Block A, North Nazimabad', experience:'6 years', status:'Active',   image:null, info:'Experienced in mobility assistance and rehabilitation.' },
    { id:'ct_z1_2', zoneId:'z1', zoneName:'North Nazimabad', name:'Tariq Hussain',   age:41, gender:'Male',   contact:'0301-2345678', address:'Flat 5, Block B, North Nazimabad',  experience:'10 years', status:'Active',   image:null, info:'Specialist in elderly care and vision impairment support.' },
    { id:'ct_z1_3', zoneId:'z1', zoneName:'North Nazimabad', name:'Sana Qureshi',    age:28, gender:'Female', contact:'0302-3456789', address:'House 88, Block C, North Nazimabad', experience:'3 years',  status:'Active',   image:null, info:'Trained in first aid and emergency response.' },
    { id:'ct_z1_4', zoneId:'z1', zoneName:'North Nazimabad', name:'Bilal Ahmed',     age:37, gender:'Male',   contact:'0303-4567890', address:'House 22, Block D, North Nazimabad', experience:'8 years',  status:'Active',   image:null, info:'Handles complex medical conditions alongside blindness.' },
    { id:'ct_z1_5', zoneId:'z1', zoneName:'North Nazimabad', name:'Rabia Noor',      age:31, gender:'Female', contact:'0304-5678901', address:'Flat 9, Block E, North Nazimabad',   experience:'5 years',  status:'Inactive', image:null, info:'On medical leave.' },
    { id:'ct_z1_6', zoneId:'z1', zoneName:'North Nazimabad', name:'Asim Khan',       age:45, gender:'Male',   contact:'0305-6789012', address:'House 44, Block F, North Nazimabad', experience:'12 years', status:'Active',   image:null, info:'Senior caretaker with extensive community outreach.' },
    { id:'ct_z1_7', zoneId:'z1', zoneName:'North Nazimabad', name:'Hina Baig',       age:26, gender:'Female', contact:'0306-7890123', address:'House 3, Block G, North Nazimabad',  experience:'2 years',  status:'Active',   image:null, info:'Recent graduate with specialized vision care training.' },
    { id:'ct_z1_8', zoneId:'z1', zoneName:'North Nazimabad', name:'Usman Farooq',    age:39, gender:'Male',   contact:'0307-8901234', address:'House 67, Block H, North Nazimabad', experience:'9 years',  status:'Active',   image:null, info:'Coordinates with local hospitals for patient referrals.' },
    { id:'ct_z1_9', zoneId:'z1', zoneName:'North Nazimabad', name:'Zara Siddiqui',   age:33, gender:'Female', contact:'0308-9012345', address:'House 15, Block I, North Nazimabad',  experience:'7 years',  status:'Active',   image:null, info:'Proficient in Braille and assistive technology guidance.' },
    { id:'ct_z1_10',zoneId:'z1', zoneName:'North Nazimabad', name:'Kamran Sheikh',   age:50, gender:'Male',   contact:'0309-0123456', address:'House 90, Block J, North Nazimabad', experience:'15 years', status:'Active',   image:null, info:'Zone lead for North Nazimabad caretaker team.' },

    // --- New Karachi (z2) ---
    { id:'ct_z2_1', zoneId:'z2', zoneName:'New Karachi', name:'Amna Riaz',       age:29, gender:'Female', contact:'0310-1234567', address:'House 5, Sector 10, New Karachi',  experience:'4 years',  status:'Active',   image:null, info:'Specializes in pediatric blindness cases.' },
    { id:'ct_z2_2', zoneId:'z2', zoneName:'New Karachi', name:'Hamid Raza',      age:43, gender:'Male',   contact:'0311-2345678', address:'Flat 14, Sector 11, New Karachi', experience:'11 years', status:'Active',   image:null, info:'Expert in post-surgical vision care.' },
    { id:'ct_z2_3', zoneId:'z2', zoneName:'New Karachi', name:'Nadia Parveen',   age:36, gender:'Female', contact:'0312-3456789', address:'House 28, Sector 12, New Karachi', experience:'7 years',  status:'Active',   image:null, info:'Community health worker with NGO background.' },
    { id:'ct_z2_4', zoneId:'z2', zoneName:'New Karachi', name:'Faisal Mehmood',  age:32, gender:'Male',   contact:'0313-4567890', address:'House 71, Sector 13, New Karachi', experience:'5 years',  status:'Inactive', image:null, info:'Currently pursuing advanced care certification.' },
    { id:'ct_z2_5', zoneId:'z2', zoneName:'New Karachi', name:'Sadia Akhtar',    age:27, gender:'Female', contact:'0314-5678901', address:'Flat 2, Sector 14, New Karachi',  experience:'3 years',  status:'Active',   image:null, info:'Handles nutritional planning for visually impaired seniors.' },
    { id:'ct_z2_6', zoneId:'z2', zoneName:'New Karachi', name:'Waqar Ali',       age:48, gender:'Male',   contact:'0315-6789012', address:'House 55, Sector 15, New Karachi', experience:'13 years', status:'Active',   image:null, info:'Mental health support specialist for patients.' },
    { id:'ct_z2_7', zoneId:'z2', zoneName:'New Karachi', name:'Iram Shehzad',    age:35, gender:'Female', contact:'0316-7890123', address:'House 19, Sector 16, New Karachi', experience:'8 years',  status:'Active',   image:null, info:'Trained in assistive device maintenance.' },
    { id:'ct_z2_8', zoneId:'z2', zoneName:'New Karachi', name:'Shahzaib Mirza',  age:30, gender:'Male',   contact:'0317-8901234', address:'Flat 7, Sector 17, New Karachi',  experience:'4 years',  status:'Active',   image:null, info:'Works closely with ophthalmologists for patient care.' },
    { id:'ct_z2_9', zoneId:'z2', zoneName:'New Karachi', name:'Mahnoor Khalid',  age:24, gender:'Female', contact:'0318-9012345', address:'House 33, Sector 18, New Karachi', experience:'1 year',   status:'Active',   image:null, info:'New caretaker — extensive volunteering background.' },
    { id:'ct_z2_10',zoneId:'z2', zoneName:'New Karachi', name:'Naeem Butt',      age:52, gender:'Male',   contact:'0319-0123456', address:'House 88, Sector 19, New Karachi', experience:'18 years', status:'Active',   image:null, info:'Zone lead for New Karachi caretaker team.' },

    // --- Naya Nazimabad (z3) ---
    { id:'ct_z3_1', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Shazia Iqbal',    age:38, gender:'Female', contact:'0320-1234567', address:'Apt 4, Block A, Naya Nazimabad',  experience:'9 years',  status:'Active',   image:null, info:'Expert in chronic disease management alongside blindness.' },
    { id:'ct_z3_2', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Arif Chaudhry',   age:44, gender:'Male',   contact:'0321-2345678', address:'House 12, Block B, Naya Nazimabad', experience:'12 years', status:'Active',   image:null, info:'Former nurse with hospital-level vision care expertise.' },
    { id:'ct_z3_3', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Lubna Hayat',     age:31, gender:'Female', contact:'0322-3456789', address:'House 34, Block C, Naya Nazimabad', experience:'5 years',  status:'Active',   image:null, info:'Provides psychosocial support and counseling.' },
    { id:'ct_z3_4', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Rizwan Anwar',    age:40, gender:'Male',   contact:'0323-4567890', address:'Flat 8, Block D, Naya Nazimabad',  experience:'10 years', status:'Active',   image:null, info:'Coordinates transport and appointment scheduling.' },
    { id:'ct_z3_5', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Tahira Javed',    age:55, gender:'Female', contact:'0324-5678901', address:'House 67, Block E, Naya Nazimabad', experience:'20 years', status:'Active',   image:null, info:'Most senior caretaker in Naya Nazimabad zone.' },
    { id:'ct_z3_6', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Adnan Zafar',     age:33, gender:'Male',   contact:'0325-6789012', address:'House 21, Block F, Naya Nazimabad', experience:'6 years',  status:'Inactive', image:null, info:'Temporarily unavailable.' },
    { id:'ct_z3_7', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Saima Hashmi',    age:27, gender:'Female', contact:'0326-7890123', address:'Apt 11, Block G, Naya Nazimabad',  experience:'2 years',  status:'Active',   image:null, info:'Specializes in digital literacy training for patients.' },
    { id:'ct_z3_8', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Junaid Rauf',     age:36, gender:'Male',   contact:'0327-8901234', address:'House 50, Block H, Naya Nazimabad', experience:'8 years',  status:'Active',   image:null, info:'Liaison with local schools for blind children.' },
    { id:'ct_z3_9', zoneId:'z3', zoneName:'Naya Nazimabad', name:'Fareeha Bashir',  age:42, gender:'Female', contact:'0328-9012345', address:'House 78, Block I, Naya Nazimabad',  experience:'11 years', status:'Active',   image:null, info:'Home visit scheduling and therapy coordination.' },
    { id:'ct_z3_10',zoneId:'z3', zoneName:'Naya Nazimabad', name:'Salman Durrani',  age:47, gender:'Male',   contact:'0329-0123456', address:'House 90, Block J, Naya Nazimabad', experience:'14 years', status:'Active',   image:null, info:'Zone lead for Naya Nazimabad caretaker team.' },

    // --- FB Area (z4) ---  ct_z4_1 = HARDWARE LINKED
    { id:'ct_z4_1', zoneId:'z4', zoneName:'FB Area', name:'Ahmed Nawaz',      age:35, gender:'Male',   contact:'0331-2902951', address:'House 7, Block 14, FB Area, Karachi', experience:'8 years',  status:'Active',   image:null, info:'Primary hardware-linked caretaker. Manages live sensor monitoring for assigned patient.', hardwareLinked: true },
    { id:'ct_z4_2', zoneId:'z4', zoneName:'FB Area', name:'Samina Jaffar',    age:32, gender:'Female', contact:'0331-2345678', address:'House 18, Block 15, FB Area',         experience:'5 years',  status:'Active',   image:null, info:'Vision therapy and rehabilitation specialist.' },
    { id:'ct_z4_3', zoneId:'z4', zoneName:'FB Area', name:'Imran Sher',       age:46, gender:'Male',   contact:'0332-3456789', address:'Flat 3, Block 16, FB Area',           experience:'13 years', status:'Active',   image:null, info:'Senior caretaker experienced in multiple disabilities.' },
    { id:'ct_z4_4', zoneId:'z4', zoneName:'FB Area', name:'Humaira Sattar',   age:29, gender:'Female', contact:'0333-4567890', address:'House 44, Block 17, FB Area',         experience:'3 years',  status:'Active',   image:null, info:'Trained physiotherapist with vision care specialization.' },
    { id:'ct_z4_5', zoneId:'z4', zoneName:'FB Area', name:'Zeeshan Gill',     age:38, gender:'Male',   contact:'0334-5678901', address:'House 62, Block 18, FB Area',         experience:'9 years',  status:'Inactive', image:null, info:'On sabbatical for advanced training.' },
    { id:'ct_z4_6', zoneId:'z4', zoneName:'FB Area', name:'Mariam Qadir',     age:25, gender:'Female', contact:'0335-6789012', address:'House 5, Block 19, FB Area',          experience:'1 year',   status:'Active',   image:null, info:'Recently joined; background in occupational therapy.' },
    { id:'ct_z4_7', zoneId:'z4', zoneName:'FB Area', name:'Khalid Mahmood',   age:51, gender:'Male',   contact:'0336-7890123', address:'House 33, Block 20, FB Area',         experience:'17 years', status:'Active',   image:null, info:'Regional coordinator with 17+ years in disability services.' },
    { id:'ct_z4_8', zoneId:'z4', zoneName:'FB Area', name:'Nusrat Abbasi',    age:39, gender:'Female', contact:'0337-8901234', address:'Flat 9, Block 21, FB Area',           experience:'10 years', status:'Active',   image:null, info:'Expert in Braille instruction and low-vision aids.' },
    { id:'ct_z4_9', zoneId:'z4', zoneName:'FB Area', name:'Shahid Rasool',    age:43, gender:'Male',   contact:'0338-9012345', address:'House 81, Block 22, FB Area',         experience:'12 years', status:'Active',   image:null, info:'Medical escort specialist and community welfare officer.' },
    { id:'ct_z4_10',zoneId:'z4', zoneName:'FB Area', name:'Kehkashan Lodhi',  age:37, gender:'Female', contact:'0339-0123456', address:'House 99, Block 23, FB Area',         experience:'8 years',  status:'Active',   image:null, info:'Zone lead for FB Area caretaker team.' }
  ];

  // ── Patients ─────────────────────────────────────────────
  const blindUsers = [
    // North Nazimabad – ct_z1_1 (Fatima Malik)
    { id:'bu_1', caretakerId:'ct_z1_1', zoneId:'z1', zoneName:'North Nazimabad', caretakerName:'Fatima Malik',
      name:'Abdul Samad', age:68, gender:'Male', address:'House 20, Block A, North Nazimabad',
      medicalInfo:'Total blindness (bilateral retinal detachment, 2019)', otherConditions:'Hypertension, Type 2 Diabetes',
      contact:'0300-9876543', emergencyContact:'Usman Samad – 0300-1122334 (Son)',
      monitoringStatus:'Active', notes:'Requires daily insulin monitoring. Uses white cane.' },
    { id:'bu_2', caretakerId:'ct_z1_1', zoneId:'z1', zoneName:'North Nazimabad', caretakerName:'Fatima Malik',
      name:'Zainab Bibi', age:54, gender:'Female', address:'Flat 7, Block A, North Nazimabad',
      medicalInfo:'Low vision (advanced glaucoma)', otherConditions:'Arthritis',
      contact:'0301-8765432', emergencyContact:'Rashida Bibi – 0301-2233445 (Sister)',
      monitoringStatus:'Active', notes:'Responds well to audio-based navigation aids.' },

    // North Nazimabad – ct_z1_2 (Tariq Hussain)
    { id:'bu_3', caretakerId:'ct_z1_2', zoneId:'z1', zoneName:'North Nazimabad', caretakerName:'Tariq Hussain',
      name:'Mohammad Yaqoob', age:72, gender:'Male', address:'House 34, Block B, North Nazimabad',
      medicalInfo:'Congenital blindness', otherConditions:'Chronic kidney disease Stage 3',
      contact:'0302-7654321', emergencyContact:'Hamza Yaqoob – 0302-3344556 (Son)',
      monitoringStatus:'Active', notes:'Regular dialysis on Tuesdays and Fridays.' },
    { id:'bu_4', caretakerId:'ct_z1_2', zoneId:'z1', zoneName:'North Nazimabad', caretakerName:'Tariq Hussain',
      name:'Shahida Khatoon', age:61, gender:'Female', address:'House 56, Block B, North Nazimabad',
      medicalInfo:'Blindness due to diabetic retinopathy', otherConditions:'Type 1 Diabetes, Obesity',
      contact:'0303-6543210', emergencyContact:'Asad Khatoon – 0303-4455667 (Husband)',
      monitoringStatus:'Active', notes:'Blood sugar levels monitored thrice daily.' },

    // New Karachi – ct_z2_1 (Amna Riaz)
    { id:'bu_5', caretakerId:'ct_z2_1', zoneId:'z2', zoneName:'New Karachi', caretakerName:'Amna Riaz',
      name:'Saeed Alam', age:45, gender:'Male', address:'House 10, Sector 10, New Karachi',
      medicalInfo:'Blindness (corneal scarring from chemical injury)', otherConditions:'PTSD, Chronic Pain',
      contact:'0310-5432109', emergencyContact:'Nadia Alam – 0310-5566778 (Wife)',
      monitoringStatus:'Active', notes:'Psychological support sessions weekly. History of workplace accident.' },
    { id:'bu_6', caretakerId:'ct_z2_1', zoneId:'z2', zoneName:'New Karachi', caretakerName:'Amna Riaz',
      name:'Razia Sultana', age:79, gender:'Female', address:'Flat 3, Sector 10, New Karachi',
      medicalInfo:'Age-related macular degeneration (total vision loss)', otherConditions:'Osteoporosis, Dementia (mild)',
      contact:'0311-4321098', emergencyContact:'Arshad Sultana – 0311-6677889 (Son)',
      monitoringStatus:'Active', notes:'Fall prevention protocol in place. Memory aids installed at home.' },

    // New Karachi – ct_z2_3 (Nadia Parveen)
    { id:'bu_7', caretakerId:'ct_z2_3', zoneId:'z2', zoneName:'New Karachi', caretakerName:'Nadia Parveen',
      name:'Irfan Memon', age:38, gender:'Male', address:'House 47, Sector 12, New Karachi',
      medicalInfo:'Bilateral optic atrophy (congenital)', otherConditions:'Epilepsy',
      contact:'0312-3210987', emergencyContact:'Farida Memon – 0312-7788990 (Mother)',
      monitoringStatus:'Active', notes:'Anti-seizure medication adherence monitored. Wears medical alert bracelet.' },

    // Naya Nazimabad – ct_z3_1 (Shazia Iqbal)
    { id:'bu_8', caretakerId:'ct_z3_1', zoneId:'z3', zoneName:'Naya Nazimabad', caretakerName:'Shazia Iqbal',
      name:'Ghulam Mustafa', age:58, gender:'Male', address:'Apt 9, Block A, Naya Nazimabad',
      medicalInfo:'Blindness (glaucoma, bilateral)', otherConditions:'Heart disease (stable angina), Hypertension',
      contact:'0320-2109876', emergencyContact:'Rubina Mustafa – 0320-8899001 (Wife)',
      monitoringStatus:'Active', notes:'Cardiac medication schedule strictly maintained.' },
    { id:'bu_9', caretakerId:'ct_z3_1', zoneId:'z3', zoneName:'Naya Nazimabad', caretakerName:'Shazia Iqbal',
      name:'Fareeda Begum', age:65, gender:'Female', address:'House 23, Block A, Naya Nazimabad',
      medicalInfo:'Progressive vision loss (diabetic retinopathy)', otherConditions:'Type 2 Diabetes, Neuropathy',
      contact:'0321-1098765', emergencyContact:'Tariq Ahmed – 0321-9900112 (Brother)',
      monitoringStatus:'Active', notes:'Foot care protocol active due to neuropathy.' },

    // Naya Nazimabad – ct_z3_3 (Lubna Hayat)
    { id:'bu_10', caretakerId:'ct_z3_3', zoneId:'z3', zoneName:'Naya Nazimabad', caretakerName:'Lubna Hayat',
      name:'Nasreen Parvez', age:47, gender:'Female', address:'House 38, Block C, Naya Nazimabad',
      medicalInfo:'Blindness (retinitis pigmentosa)', otherConditions:'Anxiety disorder, Vitamin D deficiency',
      contact:'0322-0987654', emergencyContact:'Khalid Parvez – 0322-0011223 (Husband)',
      monitoringStatus:'Inactive', notes:'Enrolled in audio therapy program. Counseling sessions fortnightly.' },

    // FB Area – ct_z4_1 (Ahmed Nawaz) — HARDWARE LINKED USER
    { id:'bu_11', caretakerId:'ct_z4_1', zoneId:'z4', zoneName:'FB Area', caretakerName:'Ahmed Nawaz',
      name:'Shahbaz Qureshi', age:52, gender:'Male', address:'House 14, Block 14, FB Area, Karachi',
      medicalInfo:'Total blindness (traumatic optic neuropathy, 2021)', otherConditions:'Moderate hearing impairment, Hypertension',
      contact:'0336-6662384', emergencyContact:'Amira Qureshi – 0306-2162996 (Wife)',
      monitoringStatus:'Active', notes:'PRIMARY HARDWARE-MONITORED USER. Wears VisionMate sensor device. Real-time vitals and location tracked via hardware integration.', hardwareLinked: true },

    // FB Area – ct_z4_2 (Samina Jaffar)
    { id:'bu_12', caretakerId:'ct_z4_2', zoneId:'z4', zoneName:'FB Area', caretakerName:'Samina Jaffar',
      name:'Rukhsana Bashir', age:63, gender:'Female', address:'House 31, Block 15, FB Area',
      medicalInfo:'Blindness (cataracts – not operated due to cardiac risk)', otherConditions:'Atrial fibrillation, Asthma',
      contact:'0331-8765432', emergencyContact:'Imran Bashir – 0331-2233445 (Son)',
      monitoringStatus:'Active', notes:'Inhaler usage logged daily. Cardiac review monthly.' },

    // FB Area – ct_z4_3 (Imran Sher)
    { id:'bu_13', caretakerId:'ct_z4_3', zoneId:'z4', zoneName:'FB Area', caretakerName:'Imran Sher',
      name:'Sarfaraz Hussain', age:44, gender:'Male', address:'House 55, Block 16, FB Area',
      medicalInfo:'Congenital blindness with partial light perception', otherConditions:'Chronic migraines, Sleep apnea',
      contact:'0332-7654321', emergencyContact:'Shahnaz Hussain – 0332-3344556 (Sister)',
      monitoringStatus:'Active', notes:'CPAP therapy compliance monitored. Migraine triggers documented.' },

    // FB Area – ct_z4_7 (Khalid Mahmood)
    { id:'bu_14', caretakerId:'ct_z4_7', zoneId:'z4', zoneName:'FB Area', caretakerName:'Khalid Mahmood',
      name:'Kiran Anwar', age:29, gender:'Female', address:'House 70, Block 20, FB Area',
      medicalInfo:'Blindness (Leber congenital amaurosis)', otherConditions:'None',
      contact:'0336-6543210', emergencyContact:'Anwar Hassan – 0336-4455667 (Father)',
      monitoringStatus:'Active', notes:'Youngest user in FB Area. Active in Braille literacy program.' }
  ];

  return { zones, caretakers, blindUsers };
})();

window.VM_DATA = VM_DATA;
