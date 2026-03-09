import { Section } from './Section';
import { MyProfileDto } from '@/types/profile.types';
import { UsersIcon } from '@heroicons/react/24/outline';

interface DependentsSectionProps {
  profile: MyProfileDto;
}

export const DependentsSection = ({ profile }: DependentsSectionProps) => (
  <Section title="Employee Dependents" icon={UsersIcon} defaultOpen={false}>
    {profile.dependents && profile.dependents.length > 0 ? (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Full Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Date of Birth
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Relationship
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {profile.dependents.map((dependent, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white">
                    {dependent.fullName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                    {dependent.dateOfBirth}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                    {dependent.relationship}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
        No dependents listed
      </p>
    )}
  </Section>
);
