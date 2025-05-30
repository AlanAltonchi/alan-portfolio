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
		this.state.loading = true;
		this.state.error = null;

		try {
			const startDate = this.state.dateRange.start.toISOString().split('T')[0];
			const endDate = this.state.dateRange.end.toISOString().split('T')[0];

			const [overviewRes, trafficRes, deviceRes, pageRes, activityRes] = await Promise.all([
				supabase
					.from('analytics_overview')
					.select('*')
					.gte('metric_date', startDate)
					.lte('metric_date', endDate)
					.order('metric_date', { ascending: false }),

				supabase
					.from('analytics_traffic_sources')
					.select('*')
					.eq('metric_date', endDate)
					.order('visits', { ascending: false }),

				supabase
					.from('analytics_device_stats')
					.select('*')
					.eq('metric_date', endDate)
					.order('count', { ascending: false }),

				supabase
					.from('analytics_page_performance')
					.select('*')
					.eq('metric_date', endDate)
					.order('views', { ascending: false }),

				supabase
					.from('analytics_user_activity')
					.select('*')
					.eq('metric_date', endDate)
					.order('hour_of_day', { ascending: true })
			]);

			if (overviewRes.error) throw overviewRes.error;
			if (trafficRes.error) throw trafficRes.error;
			if (deviceRes.error) throw deviceRes.error;
			if (pageRes.error) throw pageRes.error;
			if (activityRes.error) throw activityRes.error;

			this.state.overview = overviewRes.data || [];
			this.state.trafficSources = trafficRes.data || [];
			this.state.deviceStats = deviceRes.data || [];
			this.state.pagePerformance = pageRes.data || [];
			this.state.userActivity = activityRes.data || [];
		} catch (error) {
			console.error('Error loading analytics:', error);
			this.state.error = error instanceof Error ? error.message : 'Failed to load analytics';
		} finally {
			this.state.loading = false;
		}
	}

	async generateMockData() {
		try {
			const { error } = await supabase.rpc('generate_mock_analytics_data');
			if (error) throw error;
			await this.loadAnalytics();
		} catch (error) {
			console.error('Error generating mock data:', error);
			this.state.error = error instanceof Error ? error.message : 'Failed to generate mock data';
		}
	}

	setDateRange(start: Date, end: Date) {
		this.state.dateRange = { start, end };
		this.loadAnalytics();
	}

	reset() {
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
