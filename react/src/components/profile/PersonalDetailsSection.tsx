import { Section } from './Section';
import { FieldGroup } from './FieldGroup';
import { MyProfileDto } from '@/types/profile.types';
import { UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface PersonalDetailsSectionProps {
  profile: MyProfileDto;
  formatDate: (date?: string) => string;
}

export const PersonalDetailsSection = ({ profile, formatDate }: PersonalDetailsSectionProps) => (
  <Section title="Personal Details" icon={UserIcon}>
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-3">
          <FieldGroup label="Employee ID" value={profile.code || ''} />
          <FieldGroup label="Last Name" value={profile.lastName || ''} />
          <FieldGroup label="First Name" value={profile.firstName || ''} />
          <FieldGroup label="Middle Name" value={profile.middleName || ''} />
          <FieldGroup label="Marital Status" value={profile.maritalStatusName || ''} />
        </div>
        <div className="space-y-3">
          <FieldGroup label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
          <FieldGroup label="Place of Birth" value={profile.placeOfBirth || ''} />
          <FieldGroup label="Gender" value={profile.genderName || ''} />
          <FieldGroup label="Spouse Name" value={profile.spouseName || ''} />
        </div>
      </div>

      {/* Contact Information */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <PhoneIcon className="w-4 h-4" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldGroup label="Company Email" value={profile.email || ''} />
          <FieldGroup label="Personal Email" value={profile.personalEmail || ''} />
          <FieldGroup label="Mobile Number" value={profile.mobileNumber || ''} />
          <FieldGroup label="Telephone Number" value={profile.telephoneNumber || ''} />
        </div>
      </div>

      {/* Address Information */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MapPinIcon className="w-4 h-4" />
          Address Information
        </h3>
        <div className="space-y-3">
          <FieldGroup label="Present Address" value={profile.presentAddress || ''} />
          <FieldGroup label="Permanent Address" value={profile.permanentAddress || ''} />
        </div>
      </div>
    </div>
  </Section>
);
