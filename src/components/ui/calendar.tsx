"use client"

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-preact';
import { isSameDay } from 'date-fns';

interface CalendarProps {
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	modifiers?: {
		due?: Date[];
	};
	className?: string;
	mode?: string
}

export const Calendar = ({ mode, selected, onSelect, modifiers, className }: CalendarProps) => {
	const [viewDate, setViewDate] = useState(new Date(selected || new Date()));
	const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
	const yearPickerRef = useRef<HTMLDivElement>(null);

	const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
				setIsYearPickerOpen(false);
			}
			console.log(mode);
		};
		if (isYearPickerOpen) document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isYearPickerOpen]);

	const calendarGrid = useMemo(() => {
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const daysInPrev = new Date(year, month, 0).getDate();

		const grid = [];
		for (let i = firstDay - 1; i >= 0; i--) grid.push({ day: daysInPrev - i, type: 'prev', date: new Date(year, month - 1, daysInPrev - i) });
		for (let i = 1; i <= daysInMonth; i++) grid.push({ day: i, type: 'current', date: new Date(year, month, i) });
		const remaining = 42 - grid.length;
		for (let i = 1; i <= remaining; i++) grid.push({ day: i, type: 'next', date: new Date(year, month + 1, i) });
		return grid;
	}, [viewDate]);

	// FIXED HANDLER
	const handleDateClick = (e: any, date: Date, type: string) => {
		e.preventDefault(); // Prevent any form submission
		e.stopPropagation(); // Stop event bubbling

		if (onSelect) onSelect(date);
		if (type !== 'current') setViewDate(date);
	};

	return (
		/* Added onClick capture to stop everything from bleeding into the dialog */
		<div
			className={`bg-[#FDFBF7] rounded-lg p-4 shadow-sm border border-[#EBE5DD] w-[280px] select-none relative z-10 ${className}`}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="flex justify-between items-center mb-6 px-1">
				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }}
					className="p-1.5 rounded-full hover:bg-[#F6F4E4] text-[#5F4B3B]"
				>
					<ChevronLeft size={16} />
				</button>

				<div className="flex items-center gap-2 relative" ref={yearPickerRef}>
					<select
						value={viewDate.getMonth()}
						onChange={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), parseInt(e.currentTarget.value), 1)); }}
						className="bg-transparent text-sm font-bold text-[#5F4B3B] cursor-pointer appearance-none outline-none"
					>
						{months.map((m, i) => <option key={m} value={i}>{m}</option>)}
					</select>

					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); setIsYearPickerOpen(!isYearPickerOpen); }}
						className="text-sm font-bold text-[#5F4B3B] hover:text-emerald-600 px-1"
					>
						{viewDate.getFullYear()}
					</button>

					{isYearPickerOpen && (
						<div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-[#EBE5DD] shadow-2xl rounded-lg p-3 z-[100] flex items-center gap-4 min-w-[140px]">
							<button type="button" onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1)); }} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={14} /></button>
							<span className="bg-emerald-50 text-emerald-700 text-xs font-bold py-1.5 px-4 rounded-full border border-emerald-100">{viewDate.getFullYear()}</span>
							<button type="button" onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1)); }} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={14} /></button>
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }}
					className="p-1.5 rounded-full hover:bg-[#F6F4E4] text-[#5F4B3B]"
				>
					<ChevronRight size={16} />
				</button>
			</div>

			<div className="grid grid-cols-7 gap-1 mb-3">
				{daysOfWeek.map((day) => (<div key={day} className="text-[10px] uppercase font-bold text-[#A18E7F] text-center">{day}</div>))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{calendarGrid.map((dateObj, index) => {
					const isSelected = selected && isSameDay(dateObj.date, selected);
					const hasDue = modifiers?.due?.some(d => isSameDay(dateObj.date, d));

					return (
						<button
							key={index}
							type="button" // CRITICAL: Prevents potential form submission in Preact
							onClick={(e) => handleDateClick(e, dateObj.date, dateObj.type)}
							className={`relative w-8 h-8 flex flex-col items-center justify-center rounded-full text-xs transition-all
                ${isSelected ? 'bg-emerald-100 text-emerald-700 font-bold shadow-sm' : dateObj.type === 'current' ? 'text-[#5F4B3B] font-medium hover:bg-[#F6F4E4]' : 'text-[#C5B7A8]'}
              `}
						>
							{dateObj.day}
							{hasDue && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />}
						</button>
					);
				})}
			</div>
		</div>
	);
};