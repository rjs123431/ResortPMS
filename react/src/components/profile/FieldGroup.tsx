interface FieldGroupProps {
  label: string;
  value: string;
}

export const FieldGroup = ({ label, value }: FieldGroupProps) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={value}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    />
  </div>
);
