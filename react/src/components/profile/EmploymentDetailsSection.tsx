import { Section } from './Section';
import { FieldGroup } from './FieldGroup';
import { MyProfileDto } from '@/types/profile.types';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

interface EmploymentDetailsSectionProps {
  profile: MyProfileDto;
  formatDate: (date?: string) => string;
}

export const EmploymentDetailsSection = ({ profile, formatDate }: EmploymentDetailsSectionProps) => (
  <Section title="Employment Details" icon={BriefcaseIcon} defaultOpen={false}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FieldGroup label="Date Hired" value={formatDate(profile.dateHired)} />
      <FieldGroup label="Department" value={profile.departmentName || ''} />
      <FieldGroup label="Job Title" value={profile.jobTitleName || ''} />
      <FieldGroup label="Employment Type" value={profile.employmentTypeName || ''} />
      <FieldGroup label="Employment Status" value={profile.employmentStatusName || ''} />
      <FieldGroup label="Manager" value={profile.managerName || ''} />
      <FieldGroup label="Shift Group" value={profile.defaultShiftGroupName || ''} />
      <FieldGroup label="Biometrics ID" value={profile.biometricsId || ''} />
    </div>
  </Section>
);
