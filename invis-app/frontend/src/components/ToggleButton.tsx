import React from 'react';

type ToggleButtonProps = {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    checked?: boolean;
    span?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ onChange, checked, span }) => {
    return (
        <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange}/>
            <div className="relative w-11 h-6 bg-black-lighter-border rounded-full peer peer-focus:ring-4 peer-focus:ring-transparent peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            {span && <span className="ms-3 text-sm font-medium text-text-light">{span}</span>}
        </label>
    )
}

export default ToggleButton;