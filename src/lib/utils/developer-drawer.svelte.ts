export interface DevData {
	rlsRules?: string;
	schemaInfo?: string;
	relevantTables?: string[];
}

export interface TabData {
	id: string;
	label: string;
}

export const DEVELOPER_TABS: TabData[] = [
	{ id: 'page-code', label: 'Page Code' },
	{ id: 'rls-rules', label: 'RLS Rules' },
	{ id: 'schema', label: 'Supabase Schema' }
];

/**
 * Loads page source code for the current route
 */
export async function loadPageCode(routePath: string): Promise<string> {
	try {
		const response = await fetch(`/api/dev/page-code?route=${encodeURIComponent(routePath)}`);

		if (response.ok) {
			return await response.text();
		} else {
			return `// Could not load page code for route: ${routePath}\n// This feature requires a development API endpoint`;
		}
	} catch (error) {
		return `// Error loading page code: ${error}\n// This is a mock implementation for development`;
	}
}

/**
 * Loads RLS rules for relevant tables
 */
export async function loadRLSRules(devData?: DevData): Promise<string> {
	try {
		if (devData?.rlsRules) {
			return devData.rlsRules;
		}

		const response = await fetch(`/api/dev/rls-rules?tables=${devData?.relevantTables?.join(',')}`);

		if (response.ok) {
			return await response.text();
		} else {
			return generateMockRLSRules(devData?.relevantTables);
		}
	} catch (error) {
		return `-- Error loading RLS rules: ${error}`;
	}
}

/**
 * Loads database schema information
 */
export async function loadSchemaInfo(devData?: DevData): Promise<string> {
	try {
		if (devData?.schemaInfo) {
			return devData.schemaInfo;
		}

		const response = await fetch(`/api/dev/schema?tables=${devData?.relevantTables?.join(',')}`);

		if (response.ok) {
			return await response.text();
		} else {
			return generateMockSchema(devData?.relevantTables);
		}
	} catch (error) {
		return `-- Error loading schema: ${error}`;
	}
}

/**
 * Generates mock RLS rules when API is not available
 */
function generateMockRLSRules(tables?: string[]): string {
	return `-- Row Level Security Policies
-- Note: Could not fetch RLS policies

-- This page uses tables: ${tables?.join(', ') || 'unknown'}

-- Example policies for common tables:

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);`;
}

/**
 * Generates mock schema when API is not available
 */
function generateMockSchema(tables?: string[]): string {
	return `-- Database Schema Information
-- Note: Could not fetch schema information

-- This page uses tables: ${tables?.join(', ') || 'unknown'}

-- Basic schema structure:

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT
);`;
}

/**
 * Downloads content as a file
 */
export function downloadContent(content: string, filename: string): void {
	const blob = new Blob([content], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Generates filename based on active tab and route
 */
export function generateFilename(activeTab: string, currentRoute: string): string {
	switch (activeTab) {
		case 'page-code':
			return `page-code-${currentRoute.replace(/\//g, '-')}.svelte`;
		case 'rls-rules':
			return 'rls-rules.sql';
		case 'schema':
			return 'schema.sql';
		default:
			return 'developer-content.txt';
	}
}

/**
 * Gets content based on active tab
 */
export function getTabContent(
	activeTab: string,
	pageCode: string,
	rlsRules: string,
	schemaInfo: string
): string {
	switch (activeTab) {
		case 'page-code':
			return pageCode;
		case 'rls-rules':
			return rlsRules;
		case 'schema':
			return schemaInfo;
		default:
			return '';
	}
}

/**
 * Formats route path for API calls
 */
export function formatRoutePath(currentRoute: string): string {
	return currentRoute === '/' ? '/+page.svelte' : `${currentRoute}/+page.svelte`;
}

/**
 * Creates a data loader for developer drawer tabs
 */
export function createTabDataLoader() {
	let loading = $state(false);
	let pageCode = $state('');
	let rlsRules = $state('');
	let schemaInfo = $state('');

	async function loadTabData(
		activeTab: string,
		currentRoute: string,
		devData?: DevData
	): Promise<void> {
		loading = true;

		try {
			switch (activeTab) {
				case 'page-code':
					const newPageCode = await loadPageCode(formatRoutePath(currentRoute));
					if (newPageCode !== pageCode) {
						pageCode = newPageCode;
					}
					break;
				case 'rls-rules':
					const newRlsRules = await loadRLSRules(devData);
					if (newRlsRules !== rlsRules) {
						rlsRules = newRlsRules;
					}
					break;
				case 'schema':
					const newSchemaInfo = await loadSchemaInfo(devData);
					if (newSchemaInfo !== schemaInfo) {
						schemaInfo = newSchemaInfo;
					}
					break;
			}
		} finally {
			loading = false;
		}
	}

	function downloadCurrentTab(activeTab: string, currentRoute: string): void {
		const content = getTabContent(activeTab, pageCode, rlsRules, schemaInfo);
		const filename = generateFilename(activeTab, currentRoute);
		downloadContent(content, filename);
	}

	return {
		get loading() {
			return loading;
		},
		get pageCode() {
			return pageCode;
		},
		get rlsRules() {
			return rlsRules;
		},
		get schemaInfo() {
			return schemaInfo;
		},
		loadTabData,
		downloadCurrentTab
	};
}
