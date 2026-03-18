import type { StudentEnrolmentFormData } from '../../../types/studentEnrolment';

export interface EnrolmentValidationResult {
  errors: Record<string, string>;
  missingFields: { label: string; section: number }[];
}

interface RequiredFieldDefinition {
  key: string;
  label: string;
  section: number;
}

export const REQUIRED_FIELD_DEFINITIONS: RequiredFieldDefinition[] = [
  // Applicant section (Section 1)
  { key: 'title', label: 'Title', section: 1 },
  { key: 'surname', label: 'Surname', section: 1 },
  { key: 'givenName', label: 'Given Name', section: 1 },
  { key: 'dob', label: 'Date of Birth', section: 1 },
  { key: 'gender', label: 'Gender', section: 1 },
  { key: 'mobile', label: 'Mobile Phone', section: 1 },
  { key: 'email', label: 'Email', section: 1 },
  { key: 'resAddress', label: 'Residential Address', section: 1 },
  { key: 'resSuburb', label: 'Residential Suburb', section: 1 },
  { key: 'resState', label: 'Residential State', section: 1 },
  { key: 'resPostcode', label: 'Residential Postcode', section: 1 },
  { key: 'emergencyName', label: 'Emergency Contact Name', section: 1 },
  { key: 'emergencyRelationship', label: 'Emergency Contact Relationship', section: 1 },
  { key: 'emergencyContactNumber', label: 'Emergency Contact Number', section: 1 },
  { key: 'emergencyPermission', label: 'Emergency Contact Permission', section: 1 },

  // USI section (Section 2)
  { key: 'usiApply', label: 'USI Application Option', section: 2 },

  // Education section (Section 3)
  { key: 'schoolLevel', label: 'Highest School Level Completed', section: 3 },
  { key: 'hasPostQual', label: 'Post-school Qualification', section: 3 },
  { key: 'employmentStatus', label: 'Employment Status', section: 3 },
  { key: 'trainingReason', label: 'Reason for Training', section: 3 },

  // Additional info section (Section 4)
  { key: 'countryOfBirth', label: 'Country of Birth', section: 4 },
  { key: 'langOther', label: 'Other Language at Home', section: 4 },
  { key: 'indigenousStatus', label: 'Indigenous Status', section: 4 },
  { key: 'hasDisability', label: 'Disability', section: 4 },

  // Privacy / terms section (Section 5)
  { key: 'acceptPrivacy', label: 'Privacy Notice Acceptance', section: 5 },
  { key: 'acceptTerms', label: 'Terms & Conditions Acceptance', section: 5 },
  { key: 'declareName', label: 'Declaration Name', section: 5 },
  { key: 'declareDate', label: 'Declaration Date', section: 5 },
  { key: 'signatureData', label: 'Online Signature', section: 5 },
];

const FIELD_LABEL_LOOKUP: Record<string, string> = REQUIRED_FIELD_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.key] = def.label;
    return acc;
  },
  {} as Record<string, string>
);

export function collectMissingFields(
  data: StudentEnrolmentFormData,
  flatErrors: Record<string, string>
): EnrolmentValidationResult {
  const missingFields: { label: string; section: number }[] = [];

  for (const def of REQUIRED_FIELD_DEFINITIONS) {
    let isMissing = false;
    if (flatErrors[def.key]) {
      isMissing = true;
    } else {
      const { applicant, usi, education, additionalInfo, privacyTerms } = data;

      switch (def.key) {
        case 'title':
        case 'surname':
        case 'givenName':
        case 'dob':
        case 'gender':
        case 'mobile':
        case 'email':
        case 'resAddress':
        case 'resSuburb':
        case 'resState':
        case 'resPostcode':
        case 'emergencyName':
        case 'emergencyRelationship':
        case 'emergencyContactNumber':
        case 'emergencyPermission': {
          const value = (applicant as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'usiApply': {
          const value = usi.usiApply;
          if (!value) {
            isMissing = true;
          }
          break;
        }
        case 'schoolLevel':
        case 'hasPostQual':
        case 'employmentStatus':
        case 'trainingReason': {
          const value = (education as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'countryOfBirth':
        case 'langOther':
        case 'indigenousStatus':
        case 'hasDisability': {
          const value = (additionalInfo as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'acceptPrivacy':
        case 'acceptTerms': {
          const value = (privacyTerms as any)[def.key];
          if (!value) {
            isMissing = true;
          }
          break;
        }
        case 'declareName':
        case 'declareDate':
        case 'signatureData': {
          const value = (privacyTerms as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        default:
          break;
      }
    }

    if (isMissing) {
      missingFields.push({ label: def.label, section: def.section });
    }
  }

  const errors = { ...flatErrors };

  for (const def of REQUIRED_FIELD_DEFINITIONS) {
    const isFieldMissing = missingFields.some(mf => mf.label === def.label && mf.section === def.section);
    if (!errors[def.key] && isFieldMissing) {
      errors[def.key] = `${FIELD_LABEL_LOOKUP[def.key]} is required.`;
    }
  }

  return { errors, missingFields };
}

