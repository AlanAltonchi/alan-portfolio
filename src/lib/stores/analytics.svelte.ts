import { supabase } from '$lib/db.svelte';
import type { Database } from '$lib/types/database';

type AnalyticsOverview = Database['public']['Tables']['analytics_overview']['Row'];
type TrafficSource = Database['public']['Tables']['analytics_traffic_sources']['Row'];
type DeviceStats = Database['public']['Tables']['analytics_device_stats']['Row'];
type PagePerformance = Database['public']['Tables']['analytics_page_performance']['Row'];
type UserActivity = Database['public']['Tables']['analytics_user_activity']['Row'];

interface AnalyticsState {
	overview: AnalyticsOverview[];
	trafficSources: TrafficSource[];
	deviceStats: DeviceStats[];
	pagePerformance: PagePerformance[];
	userActivity: UserActivity[];
	loading: boolean;
	error: string | null;
	dateRange: { start: Date; end: Date };
}

class AnalyticsStore {
	private state = $state<AnalyticsState>({
		overview: [],
		trafficSources: [],
		deviceStats: [],
		pagePerformance: [],
		userActivity: [],
		loading: false,
		error: null,
		dateRange: {
			start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			end: new Date()
		}
	});

	private abortController: AbortController | null = null;
	private cache = new Map<string, { data: AnalyticsState; timestamp: number }>();
	private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	constructor() {
		// Effect will be set up in component
	}

	get overview() {
		return this.state.overview;
	}

	get trafficSources() {
		return this.state.trafficSources;
	}

	get deviceStats() {
		return this.state.deviceStats;
	}

	get pagePerformance() {
		return this.state.pagePerformance;
	}

	get userActivity() {
		return this.state.userActivity;
	}

	get loading() {
		return this.state.loading;
	}

	get error() {
		return this.state.error;
	}

	get dateRange() {
		return this.state.dateRange;
	}

	get totalPageViews() {
		return this.state.overview.reduce((sum, day) => sum + (day.page_views || 0), 0);
	}

	get totalUniqueVisitors() {
		return this.state.overview.reduce((sum, day) => sum + (day.unique_visitors || 0), 0);
	}

	get avgSessionDuration() {
		const total = this.state.overview.reduce(
			(sum, day) => sum + (day.avg_session_duration || 0),
			0
		);
		return this.state.overview.length > 0 ? Math.round(total / this.state.overview.length) : 0;
	}

	get avgBounceRate() {
		const total = this.state.overview.reduce((sum, day) => sum + (day.bounce_rate || 0), 0);
		return this.state.overview.length > 0 ? (total / this.state.overview.length).toFixed(1) : '0';
	}

	get chartData() {
		return [...this.state.overview]
			.sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime())
			.map((day) => ({
				date: new Date(day.metric_date).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric'
				}),
				pageViews: day.page_views || 0,
				uniqueVisitors: day.unique_visitors || 0,
				bounceRate: day.bounce_rate || 0
			}));
	}

	async loadAnalytics() {
		// Cancel any previous loading operation
		this.cancelLoading();

		// Check cache first
		const cacheKey = `${this.state.dateRange.start.toISOString()}-${this.state.dateRange.end.toISOString()}`;
		const cached = this.cache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
			// Use cached data
			Object.assign(this.state, cached.data);
			return;
		}

		this.state.loading = true;
		this.state.error = null;
		this.abortController = new AbortController();

		// Clear existing data to prevent accumulation
		this.state.overview = [];
		this.state.trafficSources = [];
		this.state.deviceStats = [];
		this.state.pagePerformance = [];
		this.state.userActivity = [];

		try {
			const startDate = this.state.dateRange.start.toISOString().split('T')[0];
			const endDate = this.state.dateRange.end.toISOString().split('T')[0];

			// Load all data in parallel for optimal performance
			const [overviewRes, trafficRes, deviceRes, pageRes, activityRes] = await Promise.all([
				// Overview data (date range)
				supabase
					.from('analytics_overview')
					.select('*')
					.gte('metric_date', startDate)
					.lte('metric_date', endDate)
					.order('metric_date', { ascending: false })
					.abortSignal(this.abortController.signal),

				// Traffic sources (latest date only)
				supabase
					.from('analytics_traffic_sources')
					.select('*')
					.eq('metric_date', endDate)
					.order('visits', { ascending: false })
					.abortSignal(this.abortController.signal),

				// Device stats (latest date only)
				supabase
					.from('analytics_device_stats')
					.select('*')
					.eq('metric_date', endDate)
					.order('count', { ascending: false })
					.abortSignal(this.abortController.signal),

				// Page performance (latest date only)
				supabase
					.from('analytics_page_performance')
					.select('*')
					.eq('metric_date', endDate)
					.order('views', { ascending: false })
					.abortSignal(this.abortController.signal),

				// User activity (latest date only)
				supabase
					.from('analytics_user_activity')
					.select('*')
					.eq('metric_date', endDate)
					.order('hour_of_day', { ascending: true })
					.abortSignal(this.abortController.signal)
			]);

			// Check if operation was cancelled
			if (this.abortController?.signal.aborted) return;

			// Update state with all results at once for better performance
			if (overviewRes.data) this.state.overview = overviewRes.data;
			if (trafficRes.data) this.state.trafficSources = trafficRes.data;
			if (deviceRes.data) this.state.deviceStats = deviceRes.data;
			if (pageRes.data) this.state.pagePerformance = pageRes.data;
			if (activityRes.data) this.state.userActivity = activityRes.data;

			// Cache the results
			this.cache.set(cacheKey, {
				data: {
					overview: this.state.overview,
					trafficSources: this.state.trafficSources,
					deviceStats: this.state.deviceStats,
					pagePerformance: this.state.pagePerformance,
					userActivity: this.state.userActivity,
					loading: false,
					error: null,
					dateRange: this.state.dateRange
				},
				timestamp: Date.now()
			});

			// Clean up old cache entries
			if (this.cache.size > 10) {
				const oldestKey = Array.from(this.cache.keys())[0];
				this.cache.delete(oldestKey);
			}
		} catch (error) {
			if (!this.abortController?.signal.aborted) {
				console.error('Error loading analytics:', error);
				this.state.error = error instanceof Error ? error.message : 'Failed to load analytics';
			}
		} finally {
			if (!this.abortController?.signal.aborted) {
				this.state.loading = false;
			}
		}
	}

	async generateMockData() {
		// Run the RPC call in a non-blocking way
		const generateData = async () => {
			try {
				const { error } = await supabase.rpc('generate_mock_analytics_data');
				if (error) throw error;

				// Only reload if we're still on the page
				if (!this.abortController?.signal.aborted) {
					await this.loadAnalytics();
				}
			} catch (error) {
				if (!this.abortController?.signal.aborted) {
					console.error('Error generating mock data:', error);
					this.state.error =
						error instanceof Error ? error.message : 'Failed to generate mock data';
				}
			}
		};

		// Use setTimeout to make it non-blocking
		setTimeout(() => {
			generateData().catch(console.error);
		}, 0);
	}

	cancelLoading() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
		this.state.loading = false;
	}

	setDateRange(start: Date, end: Date) {
		this.state.dateRange = { start, end };
		this.loadAnalytics();
	}

	reset() {
		// Cancel any ongoing operations
		this.cancelLoading();

		// Clear cache
		this.cache.clear();

		this.state = {
			overview: [],
			trafficSources: [],
			deviceStats: [],
			pagePerformance: [],
			userActivity: [],
			loading: false,
			error: null,
			dateRange: {
				start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				end: new Date()
			}
		};
	}
}

export const analyticsStore = new AnalyticsStore();
