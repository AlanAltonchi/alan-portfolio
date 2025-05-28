import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

interface PolicyRow {
	schemaname: string;
	tablename: string;
	policyname: string;
	permissive: string;
	roles: string | string[];
	cmd: string;
	qual: string | null;
	with_check: string | null;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Get table filter from query params
		const tablesParam = url.searchParams.get('tables');
		const tables = tablesParam ? tablesParam.split(',') : [];

		// Create a Supabase client with service role key
		const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Query to get RLS policies from pg_policies
		const baseQuery = `SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
ORDER BY schemaname, tablename, policyname`;

		const { data: rawData, error } = await supabase
			.rpc('exec_sql', { query: baseQuery });

		if (error) {
			console.error('Error fetching RLS policies:', error);
			
			// Return error message with fallback
			const errorResponse = `-- Error fetching RLS policies from database
-- ${error.message || error}

-- This endpoint requires access to pg_policies system table
-- Make sure the service role has proper permissions

-- Expected tables: conversations, emails, events, messages, profiles, tasks, users`;

			return new Response(errorResponse, {
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		// The exec_sql function returns JSON data, extract the array
		let policyData: PolicyRow[] = [];
		
		try {
			if (rawData && Array.isArray(rawData)) {
				policyData = rawData as PolicyRow[];
			} else if (rawData && typeof rawData === 'object') {
				// Check if it's an error response from the function
				if ('error' in rawData && rawData.error) {
					const errorResponse = `-- Error from exec_sql function
-- ${rawData.message || 'Unknown error'}
-- SQL State: ${rawData.detail || 'N/A'}

-- This usually means the pg_policies view is not accessible
-- or the query syntax is incorrect`;

					return new Response(errorResponse, {
						headers: { 'Content-Type': 'text/plain' }
					});
				}
				
				// If it's a single object, wrap it in an array
				policyData = [rawData] as PolicyRow[];
			} else {
				console.log('Unexpected rawData format:', typeof rawData, rawData);
			}
		} catch (parseError) {
			console.error('Error parsing policy data:', parseError);
			
			const errorResponse = `-- Error parsing policy data
-- ${parseError}
-- Raw data type: ${typeof rawData}
-- Raw data: ${JSON.stringify(rawData)}`;

			return new Response(errorResponse, {
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		// Filter policies by table if specified
		const filteredPolicies = tables.length > 0 
			? policyData.filter(p => tables.includes(p.tablename))
			: policyData;

		// Format the policies as SQL
		const formattedPolicies = formatPolicies(filteredPolicies || [], tables);

		return new Response(formattedPolicies, {
			headers: { 'Content-Type': 'text/plain' }
		});

	} catch (error) {
		console.error('Error in RLS rules endpoint:', error);
		
		const errorResponse = `-- Error fetching RLS policies
-- ${error}

-- This endpoint fetches real RLS policies from the Supabase database
-- Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured`;

		return new Response(errorResponse, {
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};

function formatPolicies(policies: PolicyRow[], tables: string[]): string {
	let formattedPolicies = `-- Row Level Security Policies
-- Real policies from Supabase database
-- Generated on: ${new Date().toISOString()}
${tables.length > 0 ? `-- Filtered for tables: ${tables.join(', ')}` : '-- All tables'}

`;

	if (policies && policies.length > 0) {
		let currentTable = '';
		
		for (const policy of policies) {
			// Add table header when we encounter a new table
			if (policy.tablename !== currentTable) {
				currentTable = policy.tablename;
				formattedPolicies += `-- ========================================
-- Policies for table: ${policy.tablename}
-- ========================================

`;
			}

			// Format the policy
			formattedPolicies += `-- Policy: ${policy.policyname}
CREATE POLICY "${policy.policyname}" ON ${policy.schemaname}.${policy.tablename}
  FOR ${policy.cmd || 'ALL'}
  TO ${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles?.replace(/[{}]/g, '') || 'public'}`;

			if (policy.qual) {
				// Clean up the qual expression for better readability
				const cleanQual = policy.qual.replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
				formattedPolicies += `
  USING (${cleanQual})`;
			}

			if (policy.with_check) {
				formattedPolicies += `
  WITH CHECK (${policy.with_check})`;
			}

			formattedPolicies += `;

`;
		}
	} else {
		formattedPolicies += `-- No RLS policies found${tables.length > 0 ? ` for tables: ${tables.join(', ')}` : ''}
-- This could mean:
-- 1. RLS is not enabled on these tables
-- 2. No policies have been created yet
-- 3. The service role doesn't have access to view policies

-- To enable RLS and create policies:
-- ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "policy_name" ON your_table FOR SELECT USING (auth.uid() = user_id);

`;
	}

	return formattedPolicies;
}