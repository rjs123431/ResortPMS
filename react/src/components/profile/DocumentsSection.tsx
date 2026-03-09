import { Section } from './Section';
import { DocumentDto } from '@/types/profile.types';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface DocumentsSectionProps {
  documents?: DocumentDto[];
  isLoading: boolean;
}

export const DocumentsSection = ({ documents, isLoading }: DocumentsSectionProps) => (
  <Section title="Documents" icon={DocumentIcon} defaultOpen={false}>
    {isLoading ? (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    ) : documents && documents.length > 0 ? (
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <a
              href={`/File/View?id=${doc.binaryObjectId}&contentType=${doc.fileType}&fileName=${doc.fileName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
            >
              <DocumentIcon className="w-4 h-4" />
              {doc.fileName}
            </a>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
        No documents available
      </p>
    )}
  </Section>
);
