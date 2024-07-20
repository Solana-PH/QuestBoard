import React, { useState, useEffect, InputHTMLAttributes } from 'react'
import { formatNumber } from '../utils/formatNumber'

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>(value)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleBlur = () => {
    const formattedValue = formatNumber(value)
    setDisplayValue(formattedValue)
    onChange(formattedValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    onChange(inputValue)
  }

  return (
    <input
      type='text'
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}
