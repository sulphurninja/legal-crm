/**  lib/dynamic-fields.ts
 *  Every mass-tort “application type” maps to its own list
 *  of { key, label, type } objects that the UI renders
 *  dynamically when that case is chosen.
 */
export const DYNAMIC_FIELDS: Record<
  string,
  Array<{ key: string; label: string; type: 'text' | 'date' | 'radio' | 'checkbox' }>
> = {
  /* ───────────────────────── CA WILDFIRE ───────────────────────── */
  'CA Wildfire': [
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zip', label: 'ZIP Code', type: 'text' },
    { key: 'dateOfIncident', label: 'Date of Incident', type: 'date' },
    { key: 'descriptionOfIncident', label: 'Description of Incident', type: 'text' },
    { key: 'wildfireName', label: 'Wildfire Name', type: 'text' },
    { key: 'homeownerOrRenter', label: 'Homeowner or Renter?', type: 'radio' },
    { key: 'maritalStatus', label: 'Marital Status', type: 'text' },
    { key: 'alreadySignedAttorney', label: 'Already signed with an attorney?', type: 'radio' }
  ],

  /* ───────────────────────── HAIR RELAXER ──────────────────────── */
  'Hair Relaxer': [
    { key: 'attorney', label: 'Attorney retained?', type: 'radio' },
    { key: 'brandUsed', label: 'Brand of Hair Relaxer Used', type: 'text' },
    { key: 'startDate', label: 'Hair Relaxer Used Start Date', type: 'date' },
    { key: 'stopDate', label: 'Hair Relaxer Used Stop Date', type: 'date' },
    { key: 'usageFrequency', label: 'How often used (≥ 3×/yr for > 1 yr)', type: 'text' },
    { key: 'injuryType', label: 'Type of Injury', type: 'text' },
    { key: 'diagnosisDate', label: 'Diagnosis Date', type: 'date' },
    { key: 'healthcareFacility', label: 'Healthcare Provider / Facility', type: 'text' },
    { key: 'breastCancerOrLynch', label: 'Diagnosed with Breast Cancer / Lynch ?', type: 'radio' }
  ],

  /* ───────────────────────── DEPO PROVERA ──────────────────────── */
  'Depo Provera': [
    { key: 'yearUsed', label: 'Year brand drug first used', type: 'text' },
    { key: 'usageDuration', label: 'Total years Depo-Provera used', type: 'text' },
    { key: 'shotFrequency', label: 'How often did you take a shot?', type: 'text' },
    { key: 'illness', label: 'Illness diagnosed with', type: 'text' },
    { key: 'symptoms', label: 'Symptoms', type: 'text' },
    { key: 'diagnosingDoctor', label: 'Doctor who diagnosed you', type: 'text' }
  ],

  /* ───────────────────────── RIDE SHARE ────────────────────────── */
  'Ride Share': [
    { key: 'incidentDate', label: 'Date of Incident', type: 'date' },
    { key: 'role', label: 'Role (Driver / Passenger)', type: 'text' },
    { key: 'company', label: 'Rideshare Company', type: 'text' },
    { key: 'physicallyAssaulted', label: 'Physically / sexually assaulted?', type: 'radio' },
    { key: 'proofOfRide', label: 'Proof of ride when assaulted?', type: 'radio' },
    { key: 'reportDetails', label: 'Report filed (police / company / etc.)', type: 'text' },
    { key: 'attorney', label: 'Attorney retained for this matter?', type: 'radio' }
  ],

  /* ───────────────────────── ROUNDUP ───────────────────────────── */
  'Roundup': [
    { key: 'roundupType', label: 'Type of Roundup used (concentrate / pre-mix)', type: 'text' },
    { key: 'useDuration', label: 'Total years Roundup used (› 1 yr)', type: 'text' },
    { key: 'useStart', label: 'Use started (MM/YYYY)', type: 'text' },
    { key: 'nhlDiagnosed', label: 'Diagnosed with Non-Hodgkin’s Lymphoma?', type: 'radio' },
    { key: 'nhlDiagnosisDate', label: 'Date of NHL diagnosis', type: 'date' },
    { key: 'treatedForNHL', label: 'Received treatment for NHL?', type: 'radio' },
    { key: 'treatmentType', label: 'Treatment received (Chemo / Radiation / Both)', type: 'text' },
    { key: 'hospitalName', label: 'Hospital Name', type: 'text' },
    { key: 'hospitalAddress', label: 'Hospital Address', type: 'text' },
    { key: 'doctorName', label: 'Doctor Name', type: 'text' },
    { key: 'doctorDesignation', label: 'Doctor Designation', type: 'text' }
  ],

  /* ───────────────────────── PFAS ──────────────────────────────── */
  'PFAS': [
    { key: 'diagnosis', label: 'Diagnosis (Kidney / Testicular / etc.)', type: 'text' },
    { key: 'dateDiagnosed', label: 'Date Diagnosed', type: 'date' },
    { key: 'symptomsStage', label: 'Symptoms / Stage', type: 'text' },
    { key: 'treatment', label: 'Treatment received', type: 'text' },
    { key: 'prior1970', label: 'Only exposed prior to 1970?', type: 'radio' },
    { key: 'attorney', label: 'Currently have an attorney?', type: 'radio' }
  ],

  /* ───────────────────────── NEC ───────────────────────────────── */
  'NEC': [
    { key: 'qualifyingInjury', label: 'Qualifying Injury', type: 'text' },
    { key: 'childName', label: 'Child Name', type: 'text' },
    { key: 'childDOB', label: 'Child DOB', type: 'date' },
    { key: 'diagnoseDate', label: 'NEC Diagnose Date', type: 'date' },
    { key: 'weeksAtBirth', label: 'Weeks of pregnancy when gave birth', type: 'text' },
    { key: 'cowMilkFormula', label: 'Infant given cow-milk formula/fortifier?', type: 'radio' },
    { key: 'attorney', label: 'Attorney retained?', type: 'radio' }
  ],

  /* ───────────────────────── LUNG CANCER ───────────────────────── */
  'Lung Cancer': [
    { key: 'asbestosExposure', label: 'Diagnosed lung cancer w/ asbestos exposure?', type: 'radio' },
    { key: 'whoDiagnosed', label: 'Who diagnosed you?', type: 'text' },
    { key: 'occupation', label: 'Occupation / Trade (dropdown)', type: 'text' },
    { key: 'company', label: 'Company worked for', type: 'text' },
    { key: 'employmentProof', label: 'Can prove employment in that field?', type: 'radio' }
  ],

  /* ───────────────────────── PARAQUAT ──────────────────────────── */
  'Paraquat': [
    { key: 'exposureDate', label: 'Date of exposure to Paraquat', type: 'date' },
    { key: 'companyName', label: 'Company you worked for', type: 'text' },
    { key: 'exposuresPerYear', label: 'Times per year exposed (≥ 8 lifetime)', type: 'text' },
    { key: 'geneticTesting', label: 'Had genetic testing for Parkinson’s?', type: 'radio' },
    { key: 'parkinsonDxDate', label: 'Parkinson’s Date of Diagnosis', type: 'date' },
    { key: 'symptoms', label: 'Symptoms of Illness', type: 'text' },
    { key: 'doctorName', label: 'Diagnosing Doctor Name', type: 'text' },
    { key: 'hospital', label: 'Hospital Name and Address', type: 'text' }
  ],

  /* ───────────────────────── LDS ───────────────────────────────── */
  'LDS': [
    { key: 'drugPrescribed', label: 'Drug Prescribed', type: 'text' },
    { key: 'treatedFor', label: 'Condition Treated', type: 'text' },
    { key: 'reactionType', label: 'Reaction Type', type: 'text' },
    { key: 'reactionDate', label: 'Date of Reaction', type: 'date' },
    { key: 'hospitalization', label: 'Hospitalization Duration', type: 'text' },
    { key: 'stillOnMedication', label: 'Still on Medication?', type: 'radio' }
  ],

  /* ───────────────────────── TALCUM ────────────────────────────── */
  'Talcum': [
    { key: 'usageYears', label: 'Start – End Year of Talcum Usage', type: 'text' },
    { key: 'diagnosis', label: 'Diagnosis', type: 'text' },
    { key: 'yearDx', label: 'Year of Dx', type: 'text' },
    { key: 'treatment', label: 'Treatment', type: 'text' },
    { key: 'attorney', label: 'Attorney retained?', type: 'radio' },
    { key: 'hospitalName', label: 'Hospital Name', type: 'text' }
  ]
};
