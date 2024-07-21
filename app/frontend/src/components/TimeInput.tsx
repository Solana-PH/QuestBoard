import React, { useEffect, useState } from 'react'

interface TimeInputProps {
  value: string // UTC timestamp in milliseconds
  onChange: (newValue: string) => void
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange }) => {
  const [hours, setHours] = useState<number>(12)
  const [minutes, setMinutes] = useState<number>(0)
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')

  useEffect(() => {
    // const localDate = new Date(value)
    // const localHours = localDate.getHours()
    // setHours(localHours % 12 === 0 ? 12 : localHours % 12)
    // setMinutes(localDate.getMinutes())
    // setPeriod(localHours < 12 ? 'AM' : 'PM')
    const [hours, minutes, period] = value.split('.')
    setHours(parseInt(hours))
    setMinutes(parseInt(minutes))
    setPeriod(period as 'AM' | 'PM')
  }, [value])

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(12, parseInt(e.target.value) || 1))
    setHours(value)
    updateValue(value, minutes, period)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(45, parseInt(e.target.value) || 0))
    const roundedValue = Math.floor(value / 15) * 15
    setMinutes(roundedValue)
    updateValue(hours, roundedValue, period)
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as 'AM' | 'PM'
    setPeriod(newPeriod)
    // updateValue(hours, minutes, newPeriod)
    updateValue(hours, minutes, newPeriod)
  }

  const updateValue = (hours: number, minutes: number, period: 'AM' | 'PM') => {
    // const localDate = new Date()
    // localDate.setHours(period === 'AM' ? hours % 12 : (hours % 12) + 12)
    // localDate.setMinutes(minutes)
    // localDate.setSeconds(0)
    // localDate.setMilliseconds(0)

    // const utcDate = new Date(
    //   localDate.getTime() - localDate.getTimezoneOffset() * 60000
    // )
    // onChange(utcDate.getTime())
    onChange(`${hours}.${minutes}.${period}`)
  }

  return (
    <div className='flex gap-1'>
      <div>
        <label>
          <input
            className='bg-black/10 px-3 py-2 w-16 text-center'
            type='number'
            value={hours}
            onChange={handleHoursChange}
            min={1}
            max={12}
            step={1}
          />
        </label>
      </div>
      <div>
        <label>
          <input
            className='bg-black/10 px-3 py-2 w-16 text-center'
            type='number'
            value={minutes}
            onChange={handleMinutesChange}
            min={0}
            max={45}
            step={15}
          />
        </label>
      </div>
      <div>
        <label>
          <select
            className='bg-black/10 px-3 py-2 h-10'
            value={period}
            onChange={handlePeriodChange}
          >
            <option value='AM'>AM</option>
            <option value='PM'>PM</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default TimeInput
