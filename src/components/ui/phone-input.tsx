'use client'

import * as React from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { cn } from '@/lib/utils'

export interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  type?: 'mobile' | 'landline'
}

const CustomPhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { className, value = '', onChange, placeholder, disabled = false, type = 'mobile', ...props },
    _ref, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    const handleChange = (phone: string) => {
      onChange?.(phone)
    }

    return (
      <div className={cn('phone-input-wrapper', className)}>
        <PhoneInput
          country={'br'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder || (type === 'mobile' ? '(11) 99999-9999' : '(11) 9999-9999')}
          disabled={disabled}
          inputClass="phone-input-field"
          containerClass="phone-input-container"
          buttonClass="phone-input-button"
          dropdownClass="phone-input-dropdown"
          searchClass="phone-input-search"
          inputStyle={{
            width: '100%',
            height: '40px',
            fontSize: '14px',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            paddingLeft: '48px',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }}
          buttonStyle={{
            border: '1px solid hsl(var(--border))',
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            backgroundColor: 'hsl(var(--background))',
            height: '40px',
          }}
          dropdownStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))',
            zIndex: 1000,
          }}
          searchStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '4px',
            color: 'hsl(var(--foreground))',
            padding: '8px',
            margin: '8px',
          }}
          enableSearch={true}
          disableSearchIcon={false}
          countryCodeEditable={false}
          specialLabel=""
          {...props}
        />
      </div>
    )
  },
)

CustomPhoneInput.displayName = 'PhoneInput'

export { CustomPhoneInput as PhoneInput }
