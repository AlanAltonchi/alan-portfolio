<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input, Modal, Drawer, Card, Tabs, DeveloperDrawer } from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		Code,
		Code2,
		MessageCircle,
		Mail,
		Kanban,
		User,
		BarChart3,
		Shield,
		Brain,
		Database
	} from 'lucide-svelte';

	let { data } = $props();

	let showModal = $state(false);
	let showDrawer = $state(false);
	let activeTab = $state('overview');
	let inputValue = $state('');
	let inputError = $state('');
	let showDeveloperDrawer = $state(false);

	const tabs = [
		{ id: 'overview', label: 'Portfolio Overview' },
		{ id: 'features', label: 'Live Features' },
		{ id: 'tech-stack', label: 'Tech Stack' },
		{ id: 'dev-features', label: 'Developer Tools' },
		{ id: 'components', label: 'Component Demo' }
	];

	function validateInput() {
		if (inputValue.length < 3) {
			inputError = 'Input must be at least 3 characters';
		} else {
			inputError = '';
		}
	}
</script>

<div class="space-y-8">
	<div class="text-center">
		<h1 class="mb-4 text-4xl font-bold">
			{authStore.isAuthenticated
				? `Welcome back, ${authStore.user?.user_metadata?.name || 'User'}!`
				: 'Full-Stack Developer Portfolio'}
		</h1>
		<p class="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
			{authStore.isAuthenticated
				? 'Explore your personalized dashboard and features below.'
				: 'A production-ready web application showcasing advanced full-stack development skills. Features real-time chat, task management, analytics, security implementations, and AI integration - all built with modern technologies and best practices.'}
		</p>

		{#if authStore.isAuthenticated}
			<div class="mt-6">
				<Button onclick={() => goto('/dashboard')} size="lg">Go to Dashboard</Button>
			</div>
		{:else}
			<div class="mt-6 flex justify-center gap-4">
				<Button onclick={() => goto('/auth/signup')} size="lg">Try Demo (No Registration)</Button>
				<Button
					variant="outline"
					onclick={() => {
						window.open('https://github.com/AlanAltonchi/alan-portfolio', '_blank');
					}}
					size="lg"
				>
					View Source Code
				</Button>
			</div>
			<div class="mt-4 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					🚀 <strong>For Recruiters:</strong> Click "Try Demo" to instantly generate a test account and
					explore all features without registration!
				</p>
			</div>
		{/if}
	</div>

	<Tabs {tabs} {activeTab} onTabChange={(tabId) => (activeTab = tabId)}>
		{#snippet children({ activeTab }: { activeTab: string })}
			{#if activeTab === 'overview'}
				<div class="space-y-8">
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🎯 What This Portfolio Demonstrates</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<h3 class="mb-3 text-lg font-medium text-blue-600 dark:text-blue-400">
									Frontend Excellence
								</h3>
								<ul class="space-y-2 text-gray-600 dark:text-gray-400">
									<li>• Modern Svelte 5 with TypeScript</li>
									<li>• Responsive design with Tailwind CSS</li>
									<li>• Real-time UI updates & optimistic UI</li>
									<li>• Drag-and-drop functionality</li>
									<li>• Advanced state management & animations</li>
									<li>• Accessibility best practices</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 text-lg font-medium text-green-600 dark:text-green-400">
									Backend & Database
								</h3>
								<ul class="space-y-2 text-gray-600 dark:text-gray-400">
									<li>• Supabase integration (PostgreSQL)</li>
									<li>• Advanced Row Level Security (RLS)</li>
									<li>• Real-time subscriptions & live data</li>
									<li>• File storage with signed URLs</li>
									<li>• Edge Functions & API integration</li>
									<li>• Database migrations & schema design</li>
								</ul>
							</div>
						</div>
					</Card>

					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🚀 Key Highlights for Recruiters</h2>
						<div class="grid gap-4 md:grid-cols-3">
							<div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<h3 class="mb-2 font-medium text-blue-900 dark:text-blue-100">
									Live Code Inspection
								</h3>
								<p class="text-sm text-blue-700 dark:text-blue-300">
									Use the Developer Drawer (<Code2 class="inline-block h-4 w-4" /> icon) to view source
									code, database schema, and security policies in real-time for the current page you
									are on
								</p>
							</div>
							<div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
								<h3 class="mb-2 font-medium text-green-900 dark:text-green-100">
									Production Ready
								</h3>
								<p class="text-sm text-green-700 dark:text-green-300">
									Implements industry best practices: TypeScript, ESLint, Prettier, proper error
									handling, security measures, and CI/CD pipelines
								</p>
							</div>
							<div class="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
								<h3 class="mb-2 font-medium text-purple-900 dark:text-purple-100">
									Real-World Features
								</h3>
								<p class="text-sm text-purple-700 dark:text-purple-300">
									Chat systems, task management, analytics dashboards, and AI integration - not just
									demos, but fully functional applications
								</p>
							</div>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'features'}
				<div class="space-y-6">
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🧪 Live Functional Showcases</h2>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							Each feature demonstrates different aspects of full-stack development, from real-time
							communication to advanced security implementations.
						</p>

						<div class="grid gap-6 md:grid-cols-2">
							<div class="space-y-4">
								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<MessageCircle class="mr-2 h-5 w-5 text-blue-500" />
										<h3 class="font-medium">💬 Real-time Chat</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Instant messaging with Supabase Realtime</li>
										<li>• Live typing indicators & read receipts</li>
										<li>• Image upload to Supabase Storage</li>
										<li>• Multi-user simulation with pop-ups</li>
										<li>• Auto-cleanup when chats are deleted</li>
									</ul>
								</div>

								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<Mail class="mr-2 h-5 w-5 text-green-500" />
										<h3 class="font-medium">📥 User Inbox System</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Email-style messaging system</li>
										<li>• Markdown support for rich content</li>
										<li>• Search, filter, and pagination</li>
										<li>• User-specific data with RLS</li>
										<li>• Simulated multi-user interactions</li>
									</ul>
								</div>

								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<Kanban class="mr-2 h-5 w-5 text-purple-500" />
										<h3 class="font-medium">🧾 Task Manager / Kanban</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Drag-and-drop task management</li>
										<li>• Optimistic UI updates</li>
										<li>• User-specific task assignment</li>
										<li>• Backend RLS per user</li>
										<li>• Real-time collaboration features</li>
									</ul>
								</div>
							</div>

							<div class="space-y-4">
								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<User class="mr-2 h-5 w-5 text-orange-500" />
										<h3 class="font-medium">🧑‍🎨 Profile Management</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Complete CRUD operations</li>
										<li>• Profile picture upload & management</li>
										<li>• Secure file access via signed URLs</li>
										<li>• Mock user profiles for testing</li>
										<li>• RLS-protected user data</li>
									</ul>
								</div>

								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<BarChart3 class="mr-2 h-5 w-5 text-indigo-500" />
										<h3 class="font-medium">📊 Analytics Dashboard</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Real-time data visualization</li>
										<li>• Usage statistics and metrics</li>
										<li>• Backend aggregation with filters</li>
										<li>• Live chart updates</li>
										<li>• Performance monitoring demos</li>
									</ul>
								</div>

								<div class="rounded-lg border p-4">
									<div class="mb-2 flex items-center">
										<Shield class="mr-2 h-5 w-5 text-red-500" />
										<h3 class="font-medium">🔐 Security Playground</h3>
									</div>
									<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
										<li>• Advanced RLS demonstrations</li>
										<li>• Role-based access control</li>
										<li>• 2FA implementation (TOTP)</li>
										<li>• Session management</li>
										<li>• Password reset flows</li>
									</ul>
								</div>
							</div>
						</div>
					</Card>

					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🧠 AI Integration Showcase</h2>
						<div
							class="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-900/20 dark:to-blue-900/20"
						>
							<div class="mb-2 flex items-center">
								<Brain class="mr-2 h-5 w-5 text-purple-600" />
								<h3 class="font-medium">AI Assistant Integration</h3>
							</div>
							<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
								<li>• OpenAI API integration with streaming responses</li>
								<li>• Embedded within chat system or standalone</li>
								<li>• Supabase Edge Functions for AI processing</li>
								<li>• Real-time AI conversation handling</li>
								<li>• Demonstrates modern API integration skills</li>
							</ul>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'tech-stack'}
				<div class="space-y-6">
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🛠️ Complete Technology Stack</h2>
						<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-orange-500"></span>
									Frontend Layer
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>Svelte 5</strong> - Latest with runes & signals</li>
									<li><strong>SvelteKit</strong> - Full-stack framework</li>
									<li><strong>TypeScript</strong> - Complete type safety</li>
									<li><strong>Tailwind CSS</strong> - Utility-first styling</li>
									<li><strong>Vite</strong> - Lightning-fast build tool</li>
									<li><strong>Lucide Svelte</strong> - Modern icon system</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
									Backend & Database
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>Supabase</strong> - Backend as a Service</li>
									<li><strong>PostgreSQL</strong> - Advanced relational DB</li>
									<li><strong>Realtime</strong> - Live data subscriptions</li>
									<li><strong>Storage</strong> - File management system</li>
									<li><strong>Edge Functions</strong> - Serverless compute</li>
									<li><strong>RLS</strong> - Row & column-level security</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-blue-500"></span>
									Authentication & Security
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>Supabase Auth</strong> - Complete auth system</li>
									<li><strong>OAuth</strong> - Social login providers</li>
									<li><strong>2FA (TOTP)</strong> - Two-factor authentication</li>
									<li><strong>Session Management</strong> - Secure sessions</li>
									<li><strong>Signed URLs</strong> - Secure file access</li>
									<li><strong>CSRF Protection</strong> - Security measures</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-purple-500"></span>
									Development Tools
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>ESLint</strong> - Code quality & linting</li>
									<li><strong>Prettier</strong> - Code formatting</li>
									<li><strong>Playwright</strong> - E2E testing suite</li>
									<li><strong>Vitest</strong> - Unit & integration tests</li>
									<li><strong>GitHub Actions</strong> - CI/CD pipelines</li>
									<li><strong>Supabase CLI</strong> - Database migrations</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-indigo-500"></span>
									UX & Performance
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>Optimistic UI</strong> - Instant feedback</li>
									<li><strong>Animations</strong> - Smooth transitions</li>
									<li><strong>Accessibility</strong> - WCAG compliance</li>
									<li><strong>Responsive Design</strong> - Mobile-first</li>
									<li><strong>Dark Mode</strong> - Theme switching</li>
									<li><strong>Code Splitting</strong> - Optimized loading</li>
								</ul>
							</div>
							<div>
								<h3 class="mb-3 flex items-center text-lg font-medium">
									<span class="mr-2 h-3 w-3 rounded-full bg-red-500"></span>
									DevOps & Deployment
								</h3>
								<ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
									<li><strong>Vercel/Netlify</strong> - Edge deployment</li>
									<li><strong>GitHub CI/CD</strong> - Automated workflows</li>
									<li><strong>Database Migrations</strong> - Version control</li>
									<li><strong>Environment Management</strong> - Config handling</li>
									<li><strong>Performance Monitoring</strong> - Analytics</li>
									<li><strong>Error Tracking</strong> - Issue management</li>
								</ul>
							</div>
						</div>
					</Card>

					<Card>
						<h2 class="mb-4 text-2xl font-semibold">📊 Architecture Highlights</h2>
						<div class="space-y-4">
							<div class="border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
								<h3 class="font-medium text-blue-900 dark:text-blue-100">
									Component-Driven Development
								</h3>
								<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
									Modular, reusable components with TypeScript interfaces, comprehensive prop
									validation, and advanced state management patterns
								</p>
							</div>
							<div class="border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
								<h3 class="font-medium text-green-900 dark:text-green-100">
									Security-First Architecture
								</h3>
								<p class="mt-1 text-sm text-green-700 dark:text-green-300">
									Multi-layered security with RLS policies, input validation, CSRF protection,
									secure file handling, and comprehensive authentication flows
								</p>
							</div>
							<div class="border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20">
								<h3 class="font-medium text-purple-900 dark:text-purple-100">
									Real-time & Performance Optimized
								</h3>
								<p class="mt-1 text-sm text-purple-700 dark:text-purple-300">
									SSR, optimistic UI, real-time subscriptions, code splitting, lazy loading, and
									optimized bundle sizes for exceptional user experience
								</p>
							</div>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'dev-features'}
				<div class="space-y-6">
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🧑‍💻 Developer Drawer - Live Code Inspection</h2>
						<div class="space-y-4">
							<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
								<p class="mb-4 text-gray-700 dark:text-gray-300">
									<strong>For Recruiters:</strong> The Developer Drawer is a unique transparency
									feature I built to showcase code quality and architecture. Click the <Code2
										class="inline-block h-4 w-4"
									/> icon in the navigation to inspect the actual source code, database schema, and security
									policies of any page in real-time.
								</p>
								<div class="grid gap-4 md:grid-cols-3">
									<div class="text-center">
										<div
											class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900"
										>
											<Code class="h-6 w-6 text-blue-600 dark:text-blue-400" />
										</div>
										<h3 class="font-medium">Page Source Code</h3>
										<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
											View the actual Svelte component code for the current page with syntax
											highlighting
										</p>
									</div>
									<div class="text-center">
										<div
											class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900"
										>
											<Shield class="h-6 w-6 text-green-600 dark:text-green-400" />
										</div>
										<h3 class="font-medium">RLS Security Policies</h3>
										<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
											Inspect Row Level Security policies protecting the data on this page
										</p>
									</div>
									<div class="text-center">
										<div
											class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900"
										>
											<Database class="h-6 w-6 text-purple-600 dark:text-purple-400" />
										</div>
										<h3 class="font-medium">Database Schema</h3>
										<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
											Examine PostgreSQL table structures, relationships, and indexes
										</p>
									</div>
								</div>
							</div>
						</div>
					</Card>

					<Card>
						<h2 class="mb-4 text-2xl font-semibold">🔍 How the Developer Mode Works</h2>
						<div class="space-y-4">
							<div class="flex items-start space-x-3">
								<span
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white"
									>1</span
								>
								<div>
									<h3 class="font-medium">Dynamic Code Fetching</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Uses SvelteKit's routing system to dynamically load and display the source code
										of the current page component
									</p>
								</div>
							</div>
							<div class="flex items-start space-x-3">
								<span
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white"
									>2</span
								>
								<div>
									<h3 class="font-medium">Real-time Database Introspection</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Connects to Supabase to fetch live schema information, RLS policies, and table
										relationships for the current page's data
									</p>
								</div>
							</div>
							<div class="flex items-start space-x-3">
								<span
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white"
									>3</span
								>
								<div>
									<h3 class="font-medium">Downloadable Documentation</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										All code, schemas, and documentation can be downloaded for offline review and
										technical assessment
									</p>
								</div>
							</div>
							<div class="flex items-start space-x-3">
								<span
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white"
									>4</span
								>
								<div>
									<h3 class="font-medium">Context-Aware Information</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										Shows only relevant tables, policies, and code for the current page, making it
										easy to understand the architecture
									</p>
								</div>
							</div>
						</div>
					</Card>

					<Card variant="outlined">
						<div class="py-6 text-center">
							<h3 class="mb-2 text-lg font-medium">Experience Developer Mode Now!</h3>
							<p class="mb-4 text-gray-600 dark:text-gray-400">
								Click the <Code2 class="inline-block h-4 w-4" /> Developer Mode button in the navigation
								to explore the code behind this page
							</p>
							<Button onclick={() => (showDeveloperDrawer = true)} size="lg">
								<Code2 class="mr-2 h-4 w-4" />
								Open Developer Drawer Demo
							</Button>
						</div>
					</Card>
				</div>
			{:else if activeTab === 'components'}
				<div class="space-y-8">
					<!-- Buttons Section -->
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">Interactive Components</h2>
						<div class="flex flex-wrap gap-4">
							<Button variant="primary">Primary</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="destructive">Destructive</Button>
						</div>
						<div class="mt-4 flex flex-wrap gap-4">
							<Button size="sm">Small</Button>
							<Button size="md">Medium</Button>
							<Button size="lg">Large</Button>
							<Button loading>Loading</Button>
						</div>
					</Card>

					<!-- Modal & Drawer Section -->
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">Modal & Drawer Components</h2>
						<div class="flex gap-4">
							<Button onclick={() => (showModal = true)}>Open Modal</Button>
							<Button onclick={() => (showDrawer = true)}>Open Drawer</Button>
						</div>
					</Card>

					<!-- Form Components -->
					<Card>
						<h2 class="mb-4 text-2xl font-semibold">Form Components</h2>
						<div class="max-w-md space-y-4">
							<Input
								label="Name"
								placeholder="Enter your name"
								bind:value={inputValue}
								oninput={validateInput}
								error={inputError}
							/>
							<Input
								label="Email"
								type="email"
								placeholder="Enter your email"
								helperText="We'll never share your email"
							/>
							<Input label="Message" variant="filled" placeholder="Enter your message" />
						</div>
					</Card>
				</div>
			{/if}
		{/snippet}
	</Tabs>
</div>

<!-- Modal -->
<Modal open={showModal} title="Example Modal" onclose={() => (showModal = false)}>
	<div class="space-y-4">
		<p>This is an example modal with a title and close button.</p>
		<p>You can click the backdrop or press Escape to close it.</p>
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (showModal = false)}>Cancel</Button>
			<Button onclick={() => (showModal = false)}>Confirm</Button>
		</div>
	</div>
</Modal>

<!-- Drawer -->
<Drawer open={showDrawer} title="Example Drawer" side="right" onclose={() => (showDrawer = false)}>
	<div class="space-y-4">
		<p>This is an example drawer that slides in from the right.</p>
		<p>It can be used for navigation, settings, or additional content.</p>
		<Button variant="outline" onclick={() => (showDrawer = false)}>Close Drawer</Button>
	</div>
</Drawer>
<DeveloperDrawer open={showDeveloperDrawer} onclose={() => (showDeveloperDrawer = false)} />
