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
  // Postal address is conditionally required when "Postal Address is different" is checked
  { key: 'postAddress', label: 'Postal Address', section: 1 },
  { key: 'postSuburb', label: 'Postal Suburb', section: 1 },
  { key: 'postState', label: 'Postal State', section: 1 },
  { key: 'postPostcode', label: 'Postal Postcode', section: 1 },
  // Emergency contact details are conditionally required when emergency permission is "Yes"
  { key: 'emergencyName', label: 'Emergency Contact Name', section: 1 },
  { key: 'emergencyRelationship', label: 'Emergency Contact Relationship', section: 1 },
  { key: 'emergencyContactNumber', label: 'Emergency Contact Number', section: 1 },
  { key: 'emergencyPermission', label: 'Emergency Contact Permission', section: 1 },

  // USI section (Section 2)
  { key: 'usiApply', label: 'USI Application Option', section: 2 },
  { key: 'usi', label: 'USI Number', section: 2 },
  { key: 'usiAuthoriseName', label: 'USI Authorisation Name', section: 2 },
  { key: 'usiConsent', label: 'USI Consent', section: 2 },
  { key: 'townCityBirth', label: 'Town/City of Birth', section: 2 },
  { key: 'overseasCityBirth', label: 'Overseas City of Birth', section: 2 },
  { key: 'usiIdType', label: 'USI ID Type', section: 2 },
  { key: 'usiIdUpload', label: 'USI ID Document Upload', section: 2 },

  // Education section (Section 3)
  { key: 'schoolLevel', label: 'Highest School Level Completed', section: 3 },
  { key: 'hasPostQual', label: 'Post-school Qualification', section: 3 },
  { key: 'employmentStatus', label: 'Employment Status', section: 3 },
  { key: 'trainingReason', label: 'Reason for Training', section: 3 },
  { key: 'trainingReasonOther', label: 'Other — Reason for Training (details)', section: 3 },

  // Additional info section (Section 4)
  { key: 'countryOfBirth', label: 'Country of Birth', section: 4 },
  { key: 'langOther', label: 'Other Language at Home', section: 4 },
  { key: 'homeLanguage', label: 'Home Language', section: 4 },
  { key: 'indigenousStatus', label: 'Indigenous Status', section: 4 },
  { key: 'hasDisability', label: 'Disability', section: 4 },

  // Privacy / terms section (Section 5)
  { key: 'acceptPrivacy', label: 'Privacy Notice Acceptance', section: 5 },
  { key: 'acceptTerms', label: 'Terms & Conditions Acceptance', section: 5 },
  { key: 'declareName', label: 'Declaration Name', section: 5 },
  { key: 'declareDate', label: 'Declaration Date', section: 5 },
  { key: 'signatureData', label: 'Online Signature', section: 5 },
  { key: 'docPrimaryId', label: 'Primary Photo ID', section: 5 },
  { key: 'docSecondaryId', label: 'Secondary Photo Document', section: 5 },
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
        case 'emergencyPermission': {
          const value = (applicant as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'postAddress':
        case 'postSuburb':
        case 'postState':
        case 'postPostcode': {
          // Only required when postal address is different
          if (!applicant.postalDifferent) break;
          const value = (applicant as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'emergencyName':
        case 'emergencyRelationship':
        case 'emergencyContactNumber': {
          // Only required when emergency permission is Yes
          if (applicant.emergencyPermission !== 'Yes') break;
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
        case 'usi': {
          if (usi.usiApply !== 'No') break;
          const value = usi.usi;
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'usiAuthoriseName':
        case 'townCityBirth':
        case 'overseasCityBirth':
        case 'usiIdType': {
          if (usi.usiApply !== 'Yes') break;
          const value = (usi as any)[def.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            isMissing = true;
          }
          break;
        }
        case 'usiConsent': {
          if (usi.usiApply !== 'Yes') break;
          if (!usi.usiConsent) isMissing = true;
          break;
        }
        case 'usiIdUpload': {
          if (usi.usiApply !== 'Yes') break;
          if (!usi.usiIdUpload) isMissing = true;
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
        case 'trainingReasonOther': {
          if (education.trainingReason !== 'Other') break;
          const value = education.trainingReasonOther;
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
        case 'homeLanguage': {
          if (additionalInfo.langOther !== 'Yes') break;
          const value = additionalInfo.homeLanguage;
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
        case 'docPrimaryId':
        case 'docSecondaryId': {
          const value = (applicant as any)[def.key];
          if (!value) isMissing = true;
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

