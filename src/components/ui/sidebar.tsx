
'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip';
import { Button } from './button';

type SidebarContextType = {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(
	undefined
);

export function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = React.useState(true);
	const isMobile = useIsMobile();

	React.useEffect(() => {
		if (isMobile) {
			setIsOpen(false);
		}
	}, [isMobile]);

	const toggleSidebar = () => {
		// setIsOpen((prev) => !prev);
	};

	return (
		<SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
			<TooltipProvider delayDuration={0}>
				{children}
			</TooltipProvider>
		</SidebarContext.Provider>
	);
}

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
	({ className, children, ...props }, ref) => {
		const { isOpen } = useSidebar();
		const isMobile = useIsMobile();

		const sidebarClasses = cn(
			'fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-transform duration-300 ease-in-out',
			'w-64', // width of the sidebar
			isOpen ? 'translate-x-0' : '-translate-x-full',
			'md:translate-x-0',
			!isOpen && 'md:-translate-x-full',
			className
		);

		if (isMobile) {
			return (
				<div
					ref={ref}
					className={cn(sidebarClasses, "w-full max-w-xs")} // Full width on mobile for overlay effect
					{...props}
				>
					{children}
				</div>
			)
		}

		return (
			<div
				ref={ref}
				className={sidebarClasses}
				{...props}
			>
				{children}
			</div>
		);
	}
);
Sidebar.displayName = 'Sidebar';


const SidebarHeader = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			data-sidebar="header"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			data-sidebar="content"
			className={cn(
				'flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
				className
			)}
			{...props}
		/>
	);
});
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			data-sidebar="footer"
			className={cn('flex flex-col gap-2 p-2 mt-auto', className)}
			{...props}
		/>
	);
});
SidebarFooter.displayName = 'SidebarFooter';

const SidebarMenu = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		data-sidebar="menu"
		className={cn('flex w-full min-w-0 flex-col gap-1', className)}
		{...props}
	/>
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
	<li
		ref={ref}
		data-sidebar="menu-item"
		className={cn('group/menu-item relative', className)}
		{...props}
	/>
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef<
	HTMLButtonElement,
	React.ComponentProps<typeof Button> & {
		tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	}
>(({ tooltip, className, ...props }, ref) => {
	const { isOpen } = useSidebar();
	const button = <Button ref={ref} className={cn(!isOpen && "justify-center", className)} {...props} />;

	if (!tooltip || isOpen) {
		return button;
	}

	if (typeof tooltip === 'string') {
		tooltip = {
			children: tooltip,
		};
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent side="right" align="center" {...tooltip} />
		</Tooltip>
	);
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

export {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
};
