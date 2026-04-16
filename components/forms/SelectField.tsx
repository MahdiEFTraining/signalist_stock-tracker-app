import React from 'react'
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {Controller, FieldValues} from "react-hook-form";

const SelectField = <T extends FieldValues>({name, label, placeholder, options, control, error, required = false }:SelectFieldProps<T>) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({field}) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="select-trigger">
                            <SelectValue placeholder={placeholder}/>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-56">
                            {options.map(option => (
                                <SelectItem key={option.value} value={option.value} className="focus:bg-gray-600 focus:text-white">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    )
}

export default SelectField
