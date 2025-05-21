import React, { useState, useEffect } from "react";

interface MultiCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function MultiCheckbox({ id, label, checked, onChange }: MultiCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={handleChange}
        style={{ width: '20px', height: '20px' }}
        className="cursor-pointer"
      />
      <label 
        htmlFor={id}
        className="text-sm font-medium leading-none cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
}