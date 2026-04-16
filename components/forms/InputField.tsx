import React from 'react'
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import { FieldValues } from "react-hook-form";

export const InputField = <T extends FieldValues>({name, label, placeholder, type = "text", register, error, validation, disabled, value}: FormInputProps<T>) => {
    return (
        <div className="space-y-2">
        <Label htmlFor={name as string} className="form-label">
            {label}
        </Label>
            <input
            type={type}
            id={name as string}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            className={cn('form-input w-full', { 'opacity-50 cursor-not-allowed': disabled })}
            {...register(name,validation)}
            />
            {error && <p className="text-red-500">{error.message}</p>}
        </div>
    )
}
export default InputField;
