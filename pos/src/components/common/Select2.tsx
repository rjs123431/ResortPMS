// This is a wrapper for react-select to use as a Select2-like component
import React from 'react';
import Select, { Props as SelectProps } from 'react-select';

export type OptionType = { value: string | number; label: string };

export interface Select2Props extends Omit<SelectProps<OptionType, false>, 'options'> {
  options: OptionType[];
}

export const Select2: React.FC<Select2Props> = (props) => {
  return <Select classNamePrefix="select2" {...props} />;
};
