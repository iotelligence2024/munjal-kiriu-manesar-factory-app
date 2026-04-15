import type { CSSProperties } from "react";

type VisibleChecksheetField = {
	key: string;
	input?: boolean;
};

type StickyLayer = "head" | "body";

const STICKY_HEADER_BACKGROUND =
	"linear-gradient(135deg,rgba(247,248,255,0.98),rgba(240,247,239,0.98))";
const STICKY_BODY_BACKGROUND =
	"linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,246,248,0.96))";
const STICKY_DIVIDER_SHADOW = "6px 0 12px rgba(31,36,48,0.08)";
const STICKY_BORDER_SHADOW = "inset -1px 0 0 rgba(95,103,114,0.12)";

const isJudgmentField = (key: string) =>
	key === "judgment" || /^sl[-_ ]?\d+$/i.test(key);

const isScrollableField = ({ key, input }: VisibleChecksheetField) =>
	Boolean(input) || isJudgmentField(key) || key === "document_enable";

const getCssLength = (style: CSSProperties): string => {
	const width = style.width ?? style.minWidth;

	if (typeof width === "number") {
		return `${width}px`;
	}

	return typeof width === "string" && width.trim() ? width : "0px";
};

const sumCssLengths = (lengths: string[]): string => {
	if (!lengths.length) {
		return "0px";
	}

	if (lengths.length === 1) {
		return lengths[0];
	}

	return `calc(${lengths.join(" + ")})`;
};

export const createChecksheetStickyColumns = (
	visibleFields: VisibleChecksheetField[],
	getColumnStyle: (key: string) => CSSProperties
) => {
	const firstScrollableIndex = visibleFields.findIndex(isScrollableField);
	const frozenFieldKeys =
		firstScrollableIndex > 0
			? visibleFields.slice(0, firstScrollableIndex).map(({ key }) => key)
			: [];

	const stickyOffsets = new Map<string, string>();
	const widthTerms: string[] = [];

	frozenFieldKeys.forEach((key) => {
		stickyOffsets.set(key, sumCssLengths(widthTerms));
		widthTerms.push(getCssLength(getColumnStyle(key)));
	});

	const lastFrozenKey =
		frozenFieldKeys.length > 0
			? frozenFieldKeys[frozenFieldKeys.length - 1]
			: undefined;

	const getStickyCellStyle = (
		key: string,
		layer: StickyLayer
	): CSSProperties | undefined => {
		const left = stickyOffsets.get(key);

		if (left === undefined) {
			return undefined;
		}

		return {
			position: "sticky",
			left,
			zIndex: layer === "head" ? 30 : 20,
			background:
				layer === "head" ? STICKY_HEADER_BACKGROUND : STICKY_BODY_BACKGROUND,
			boxShadow:
				key === lastFrozenKey ? STICKY_DIVIDER_SHADOW : STICKY_BORDER_SHADOW,
		};
	};

	return {
		frozenFieldKeys,
		hasFrozenColumns: frozenFieldKeys.length > 0,
		isFrozenField: (key: string) => stickyOffsets.has(key),
		getStickyCellStyle,
	};
};
