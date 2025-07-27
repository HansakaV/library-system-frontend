import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
    variant = 'primary', 
    size = 'md', 
    children, 
    className, 
    ...props 
}) => {
    const baseStyle = 'rounded-md font-semibold transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    // Size styles
    let sizeStyle = '';
    switch (size) {
        case 'sm':
            sizeStyle = 'px-3 py-1.5 text-sm';
            break;
        case 'md':
            sizeStyle = 'px-4 py-2 text-base';
            break;
        case 'lg':
            sizeStyle = 'px-6 py-3 text-lg';
            break;
    }

    // Variant styles
    let variantStyle = '';
    switch (variant) {
        case 'primary':
            variantStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
            break;
        case 'secondary':
            variantStyle = 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400';
            break;
        case 'danger':
            variantStyle = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
            break;
        case 'warning':
            variantStyle = 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400';
            break;
    }

    return (
        <button 
            className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className || ''}`} 
            {...props}
        >
            {children}
        </button>
    );
};