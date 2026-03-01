// ── PDF Reference Types ──

export type PdfKey = 'rulebook' | 'assets' | 'playkit' | 'workbook';

export interface PdfRef {
	pdf: PdfKey;
	page: number;
}

export interface PdfMeta {
	key: PdfKey;
	label: string;
	description: string;
	expectedFilenames: string[];
}

export const PDF_CATALOG: PdfMeta[] = [
	{
		key: 'rulebook',
		label: 'Ironsworn Rulebook',
		description: 'Core rules, moves, oracles, and worldbuilding guidance',
		expectedFilenames: ['Ironsworn-Rulebook.pdf', 'Ironsworn Rulebook.pdf']
	},
	{
		key: 'assets',
		label: 'Ironsworn Assets',
		description: 'Printable asset cards (companions, paths, combat talents, rituals)',
		expectedFilenames: ['Ironsworn-Assets-Master-Set.pdf', 'Ironsworn Assets.pdf']
	},
	{
		key: 'playkit',
		label: 'Ironsworn Playkit',
		description: 'Reference sheets, worksheets, and play aids',
		expectedFilenames: ['Ironsworn-Playkit.pdf', 'Ironsworn Playkit.pdf']
	},
	{
		key: 'workbook',
		label: 'World Workbook',
		description: 'Guided worldbuilding exercises and worksheets',
		expectedFilenames: ['Ironsworn-World-Workbook.pdf', 'Ironsworn World Workbook.pdf']
	}
];
