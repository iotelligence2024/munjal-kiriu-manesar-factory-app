import type { CSSProperties } from "react";

const WIDE_CHECKSHEET_COLUMN_THRESHOLD = 15;

const getWideColumnWidth = (key: string): number => {
	const normalizedKey = key.toLowerCase();

	if (normalizedKey === "id") {
		return 84;
	}

	if (/^sl[-_ ]?\d+$/i.test(normalizedKey)) {
		return 92;
	}

	if (normalizedKey.includes("judgment")) {
		return 128;
	}

	if (normalizedKey.includes("document")) {
		return 196;
	}

	if (
		normalizedKey.includes("observation") ||
		normalizedKey.includes("remark") ||
		normalizedKey.includes("action") ||
		normalizedKey.includes("comment") ||
		normalizedKey.includes("counter") ||
		normalizedKey.includes("root") ||
		normalizedKey.includes("cause")
	) {
		return 200;
	}

	if (
		normalizedKey.includes("item") ||
		normalizedKey.includes("area") ||
		normalizedKey.includes("method") ||
		normalizedKey.includes("criteria") ||
		normalizedKey.includes("parameter") ||
		normalizedKey.includes("description") ||
		normalizedKey.includes("spec")
	) {
		return 216;
	}

	return 152;
};

export const createChecksheetTableLayout = (
	visibleFieldKeys: string[],
	equalWidthPercent = 90
) => {
	const isWideTable =
		visibleFieldKeys.length > WIDE_CHECKSHEET_COLUMN_THRESHOLD;
	const nonIdColumns =
		visibleFieldKeys.filter((key) => key !== "id").length || 1;

	const tableWidth = isWideTable
		? visibleFieldKeys.reduce(
				(totalWidth, key) => totalWidth + getWideColumnWidth(key),
				0
		  )
		: undefined;

	const tableStyle: CSSProperties | undefined = tableWidth
		? {
				width: `${tableWidth}px`,
				minWidth: `${tableWidth}px`,
		  }
		: undefined;

	const getColumnStyle = (key: string): CSSProperties => {
		if (isWideTable) {
			const width = getWideColumnWidth(key);

			return {
				width: `${width}px`,
				minWidth: `${width}px`,
			};
		}

		if (key === "id") {
			return { width: "5%" };
		}

		return { width: `${equalWidthPercent / nonIdColumns}%` };
	};

	return {
		isWideTable,
		tableStyle,
		getColumnStyle,
	};
};
