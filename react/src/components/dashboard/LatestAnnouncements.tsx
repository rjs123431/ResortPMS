import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { announcementService } from '@/services/announcement.service';
import { AnnouncementDto } from '@/types/announcement.types';
import { AnnouncementDialog } from './AnnouncementDialog';

export const LatestAnnouncements: React.FC = () => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementDto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: announcements, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['latest-announcements'],
    queryFn: ({ signal }) => announcementService.getLatestAnnouncements(5, signal),
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleAnnouncementClick = (announcement: AnnouncementDto) => {
    setSelectedAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return formatDate(dateString);
  };

  const stripHtml = (html: string | null | undefined) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Announcements</h2>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Refresh announcements"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => handleAnnouncementClick(announcement)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1 line-clamp-2">
                  {announcement.title}
                </h3>
                <span className="ml-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {getTimeAgo(announcement.docDate)}
                </span>
              </div>
              {announcement.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {stripHtml(announcement.description)}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(announcement.docDate)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No announcements</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no announcements at this time.
            </p>
          </div>
        )}
      </div>

      {/* Announcement Dialog */}
      <AnnouncementDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        announcement={selectedAnnouncement}
      />
    </div>
  );
};

