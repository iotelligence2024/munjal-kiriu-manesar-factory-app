import * as React from "react";
import {
	CheckCircle2,
	ClipboardList,
	History,
	MessageSquareMore,
	MinusCircle,
	Pencil,
	Send,
	Trash2,
} from "lucide-preact";

import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "../ui/button";

export type ActionButtonKind =
	| "approve"
	| "checksheet"
	| "delete"
	| "edit"
	| "history"
	| "query"
	| "submit"
	| "subtract";

const iconMap = {
	approve: CheckCircle2,
	checksheet: ClipboardList,
	delete: Trash2,
	edit: Pencil,
	history: History,
	query: MessageSquareMore,
	submit: Send,
	subtract: MinusCircle,
} satisfies Record<ActionButtonKind, React.ComponentType<any>>;

const kindClassNameMap: Record<ActionButtonKind, string> = {
	approve:
		"border-[rgba(22,163,74,0.26)] bg-[linear-gradient(135deg,#16a34a,#15803d)] text-white hover:bg-[linear-gradient(135deg,#15803d,#166534)]",
	checksheet:
		"border-[rgba(30,64,175,0.18)] bg-[linear-gradient(135deg,rgba(30,64,175,0.96),rgba(14,116,144,0.92))] text-white hover:bg-[linear-gradient(135deg,rgba(30,58,138,0.98),rgba(21,94,117,0.94))]",
	delete:
		"border-[rgba(220,38,38,0.26)] bg-[linear-gradient(135deg,#dc2626,#b91c1c)] text-white hover:bg-[linear-gradient(135deg,#b91c1c,#991b1b)]",
	edit:
		"border-[rgba(30,64,175,0.18)] bg-[linear-gradient(135deg,rgba(30,64,175,0.96),rgba(2,132,199,0.92))] text-white hover:bg-[linear-gradient(135deg,rgba(30,58,138,0.98),rgba(3,105,161,0.94))]",
	history:
		"border-[rgba(30,64,175,0.18)] bg-[linear-gradient(135deg,rgba(30,64,175,0.92),rgba(8,145,178,0.9))] text-white hover:bg-[linear-gradient(135deg,rgba(30,58,138,0.96),rgba(14,116,144,0.92))]",
	query:
		"border-[rgba(220,38,38,0.26)] bg-[linear-gradient(135deg,#dc2626,#b91c1c)] text-white hover:bg-[linear-gradient(135deg,#b91c1c,#991b1b)]",
	submit:
		"border-[rgba(22,163,74,0.26)] bg-[linear-gradient(135deg,#16a34a,#0f766e)] text-white hover:bg-[linear-gradient(135deg,#15803d,#115e59)]",
	subtract:
		"border-[rgba(220,38,38,0.26)] bg-[linear-gradient(135deg,#dc2626,#b91c1c)] text-white hover:bg-[linear-gradient(135deg,#b91c1c,#991b1b)]",
};

type ActionButtonProps = ButtonProps & {
	kind: ActionButtonKind;
};

export function ActionButton({
	kind,
	className,
	children,
	type = "button",
	variant = "outline",
	...props
}: ActionButtonProps) {
	const Icon = iconMap[kind];

	return (
		<Button
			type={type}
			variant={variant}
			className={cn(
				"!h-8 !gap-1.5 !rounded-md !px-3 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-[0_10px_20px_rgba(15,23,42,0.08)] disabled:shadow-none [&_svg]:h-3.5 [&_svg]:w-3.5",
				kindClassNameMap[kind],
				className
			)}
			{...props}
		>
			<Icon />
			{children}
		</Button>
	);
}
