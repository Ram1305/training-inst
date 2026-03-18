import type { StudentEnrolmentFormData } from '../../../types/studentEnrolment';

export interface EnrolmentValidationResult {
  errors: Record<string, string>;
  missingFields: string[];
}

interface RequiredFieldDefinition {
  key: string;
  label: string;
}

export const REQUIRED_FIELD_DEFINITIONS: RequiredFieldDefinition[] = [
  // Applicant section
  { key: 'title', label: 'Title' },
  { key: 'surname', label: 'Surname' },
  { key: 'givenName', label: 'Given Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'mobile', label: 'Mobile Phone' },
  { key: 'email', label: 'Email' },
  { key: 'resAddress', label: 'Residential Address' },
  { key: 'resSuburb', label: 'Residential Suburb' },
  { key: 'resState', label: 'Residential State' },
  { key: 'resPostcode', label: 'Residential Postcode' },
  { key: 'emergencyName', label: 'Emergency Contact Name' },
  { key: 'emergencyRelationship', label: 'Emergency Contact Relationship' },
  { key: 'emergencyContactNumber', label: 'Emergency Contact Number' },
  { key: 'emergencyPermission', label: 'Emergency Contact Permission' },

  // USI section (high-level required fields; detailed logic still lives in per-form validation)
  { key: 'usiApply', label: 'USI Application Option' },

  // Education section
  { key: 'schoolLevel', label: 'Highest School Level Completed' },
  { key: 'hasPostQual', label: 'Post-school Qualification' },
  { key: 'employmentStatus', label: 'Employment Status' },
  { key: 'trainingReason', label: 'Reason for Training' },

  // Additional info section
  { key: 'countryOfBirth', label: 'Country of Birth' },
  { key: 'langOther', label: 'Other Language at Home' },
  { key: 'indigenousStatus', label: 'Indigenous Status' },
  { key: 'hasDisability', label: 'Disability' },

  // Privacy / terms section
  { key: 'acceptPrivacy', label: 'Privacy Notice Acceptance' },
  { key: 'acceptTerms', label: 'Terms & Conditions Acceptance' },
  { key: 'declareName', label: 'Declaration Name' },
  { key: 'declareDate', label: 'Declaration Date' },
  { key: 'signatureData', label: 'Online Signature' },
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
  const missingFields: string[] = [];

  for (const def of REQUIRED_FIELD_DEFINITIONS) {
    if (flatErrors[def.key]) {
      missingFields.push(def.label);
      continue;
    }

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
          missingFields.push(def.label);
        }
        break;
      }
      case 'usiApply': {
        const value = usi.usiApply;
        if (!value) {
          missingFields.push(def.label);
        }
        break;
      }
      case 'schoolLevel':
      case 'hasPostQual':
      case 'employmentStatus':
      case 'trainingReason': {
        const value = (education as any)[def.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(def.label);
        }
        break;
      }
      case 'countryOfBirth':
      case 'langOther':
      case 'indigenousStatus':
      case 'hasDisability': {
        const value = (additionalInfo as any)[def.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(def.label);
        }
        break;
      }
      case 'acceptPrivacy':
      case 'acceptTerms': {
        const value = (privacyTerms as any)[def.key];
        if (!value) {
          missingFields.push(def.label);
        }
        break;
      }
      case 'declareName':
      case 'declareDate':
      case 'signatureData': {
        const value = (privacyTerms as any)[def.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(def.label);
        }
        break;
      }
      default:
        break;
    }
  }

  const errors = { ...flatErrors };

  for (const def of REQUIRED_FIELD_DEFINITIONS) {
    if (!errors[def.key] && missingFields.includes(def.label)) {
      errors[def.key] = `${FIELD_LABEL_LOOKUP[def.key]} is required.`;
    }
  }

  return { errors, missingFields };
}

