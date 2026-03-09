import { Section } from './Section';
import { FieldGroup } from './FieldGroup';
import { MyProfileDto } from '@/types/profile.types';
import { PhoneIcon } from '@heroicons/react/24/solid';

interface EmergencyContactsSectionProps {
  profile: MyProfileDto;
}

export const EmergencyContactsSection = ({ profile }: EmergencyContactsSectionProps) => (
  <Section title="Emergency Contacts" icon={PhoneIcon} defaultOpen={false}>
    <div className="space-y-3 max-w-2xl">
      <FieldGroup label="Contact Person Name" value={profile.contactPersonName || ''} />
      <FieldGroup label="Contact Person Relation" value={profile.contactPersonRelation || ''} />
      <FieldGroup label="Contact Person Number" value={profile.contactPersonNumber || ''} />
    </div>
  </Section>
);
