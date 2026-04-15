type CheckPointMapping = Record<
	string,
	{
		enable: boolean;
		input?: boolean;
		name?: string;
	}
>;

type CheckPointRecord = {
	enable?: boolean;
	[key: string]: unknown;
};

type ChecksheetLike = {
	check_points_mapping?: CheckPointMapping;
	check_points: CheckPointRecord[];
};

const isJudgmentField = (key: string) =>
	key === "judgment" || /^sl[-_ ]?\d+$/i.test(key);

const isTextareaField = (
	key: string,
	config: { enable: boolean; input?: boolean }
) =>
	config.enable &&
	config.input === true &&
	key !== "document_enable" &&
	!isJudgmentField(key);

const toTextValue = (value: unknown) => {
	if (typeof value === "string" || typeof value === "number") {
		return String(value).trim();
	}

	return "";
};

const getJudgmentKeys = (
	mapping: CheckPointMapping,
	checkPoint: CheckPointRecord
) => {
	if (Object.keys(mapping).length > 0) {
		return Object.entries(mapping)
			.filter(([key, config]) => config.enable && isJudgmentField(key))
			.map(([key]) => key);
	}

	return Object.keys(checkPoint).filter(isJudgmentField);
};

export const validateChecksheetSubmission = (
	checksheet: ChecksheetLike
) => {
	const errors: string[] = [];
	const mapping = checksheet.check_points_mapping ?? {};

	const mandatoryTextFields = Object.entries(mapping)
		.filter(([key, config]) => isTextareaField(key, config))
		.map(([key, config]) => ({
			key,
			label: config.name || key,
		}));

	checksheet.check_points.forEach((checkPoint, index) => {
		if (!checkPoint.enable) return;

		const judgmentKeys = getJudgmentKeys(mapping, checkPoint);
		if (judgmentKeys.length === 0) return;

		const judgmentValues = judgmentKeys.map((key) => toTextValue(checkPoint[key]));
		const hasSelectedJudgment = judgmentValues.some((value) => value !== "");

		if (!hasSelectedJudgment) {
			errors.push(
				`Row ${index + 1}: At least one OK/NOT OK/NA must be selected.`
			);
			return;
		}

		if (!judgmentValues.includes("NOT_OK")) {
			return;
		}

		mandatoryTextFields.forEach(({ key, label }) => {
			if (toTextValue(checkPoint[key]) !== "") {
				return;
			}

			errors.push(
				`Row ${index + 1}: "${label}" is mandatory when Observation is NOT OK.`
			);
		});
	});

	return errors;
};

export const isChecksheetSubmissionComplete = (
	checksheet: ChecksheetLike
) => validateChecksheetSubmission(checksheet).length === 0;
