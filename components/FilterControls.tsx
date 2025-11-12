import React from 'react';
import { SortOption, FilterOption } from '../types';

interface FilterControlsProps {
    sortOption: SortOption;
    filterOption: FilterOption;
    onSortChange: (option: SortOption) => void;
    onFilterChange: (option: FilterOption) => void;
    showSortControls?: boolean;
}

const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'popularity', label: 'Popularity' },
    { key: 'release_date', label: 'Release Date' },
    { key: 'rating', label: 'Rating' },
];

const filterOptions: { key: FilterOption; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'TV Shows' },
];

const ControlButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            isActive
                ? 'bg-brand-accent text-white'
                : 'bg-base-200 text-text-secondary hover:bg-base-300'
        }`}
    >
        {children}
    </button>
);


export const FilterControls: React.FC<FilterControlsProps> = ({
    sortOption,
    filterOption,
    onSortChange,
    onFilterChange,
    showSortControls = true,
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {showSortControls && (
                <fieldset className="flex items-center gap-2">
                    <legend className="text-sm font-bold text-text-secondary min-w-[60px] text-left">Sort by:</legend>
                    <div className="flex items-center bg-base-200 rounded-full p-1">
                        {sortOptions.map(({ key, label }) => (
                            <ControlButton
                                key={key}
                                onClick={() => onSortChange(key)}
                                isActive={sortOption === key}
                            >
                                {label}
                            </ControlButton>
                        ))}
                    </div>
                </fieldset>
            )}
            <fieldset className="flex items-center gap-2">
                <legend className="text-sm font-bold text-text-secondary min-w-[60px] text-left">Filter:</legend>
                 <div className="flex items-center bg-base-200 rounded-full p-1">
                    {filterOptions.map(({ key, label }) => (
                        <ControlButton
                            key={key}
                            onClick={() => onFilterChange(key)}
                            isActive={filterOption === key}
                        >
                            {label}
                        </ControlButton>
                    ))}
                </div>
            </fieldset>
        </div>
    );
};