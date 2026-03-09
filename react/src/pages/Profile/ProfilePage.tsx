import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { profileService } from '@/services/profile.service';
import { API_CONFIG } from '@/config/api.config';
import { MyProfileDto } from '@/types/profile.types';
import { LogoSpinner } from '@components/common/LogoSpinner';
import {
  PersonalDetailsSection,
  EmploymentDetailsSection,
  EmergencyContactsSection,
} from '@/components/profile';

export const ProfilePage = () => {
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async ({ signal }) => {
      const response = await profileService.getProfile(signal);
      return response.result;
    },
  });

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const profile = profileData as MyProfileDto | undefined;
  const profilePictureId = profile?.profilePictureFileObjectId?.trim() || undefined;
  const displayName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '';

  const profilePictureSrc = profilePictureId
    ? `${API_CONFIG.baseURL}/file/view/${profilePictureId}`
    : '/user.png';

  if (isLoadingProfile) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LogoSpinner spinnerClassName="border-b-2 border-blue-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={profilePictureSrc}
            alt={displayName ? `${displayName} profile` : 'Employee profile'}
            className="h-32 w-32 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.jobTitleName} at {profile?.branchName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID: {profile?.code}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Hired on {formatDate(profile?.dateHired)}</p>
          </div>
        </div>

        {profile && (
          <>
            <PersonalDetailsSection profile={profile} formatDate={formatDate} />
            <EmploymentDetailsSection profile={profile} formatDate={formatDate} />
            {/* <DocumentsSection documents={documents} isLoading={isLoadingDocuments} /> */}
            {/* <DependentsSection profile={profile} /> */}
            <EmergencyContactsSection profile={profile} />
          </>
        )}
      </div>
    </MainLayout>
  );
};
