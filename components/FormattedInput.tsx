import React, { useState, useEffect } from 'react';

interface FormattedInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  [x: string]: any; // Allow other props to be passed to the input element
}

export const FormattedInput = ({ value, onValueChange, className, ...rest }: FormattedInputProps): React.ReactNode => {
  const [isEditing, setIsEditing] = useState(false);
  // Store the editing value as a string to allow for intermediate typing states
  const [currentValue, setCurrentValue] = useState(String(value));

  useEffect(() => {
    // If the value prop changes from the parent AND we are not editing,
    // update the local string state.
    if (!isEditing) {
      setCurrentValue(String(value));
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
    // When focusing, show the raw number for easy editing.
    setCurrentValue(String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing of numbers, decimals, and an empty string
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
        setCurrentValue(val);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numericValue = parseFloat(currentValue) || 0;
    // Notify the parent component of the final numeric value.
    onValueChange(numericValue);
  };

  // When editing, show the raw string. When not editing, show the formatted number.
  const displayValue = isEditing ? currentValue : value.toLocaleString('en-US');

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};