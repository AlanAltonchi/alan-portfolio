<script lang="ts">
	import * as XLSX from 'xlsx';
	
	interface Employee {
		id: string;
		name: string;
		email: string;
		department: string;
		position: string;
		startDate: string;
		salary: number;
		status: 'active' | 'inactive';
		phone?: string;
		address?: string;
	}
	
	let employees = $state<Employee[]>([
		{ id: '1', name: 'John Doe', email: 'john@company.com', department: 'Engineering', position: 'Senior Developer', startDate: '2022-03-15', salary: 95000, status: 'active', phone: '+1 (555) 123-4567', address: '123 Main St, New York, NY 10001' },
		{ id: '2', name: 'Jane Smith', email: 'jane@company.com', department: 'Marketing', position: 'Marketing Manager', startDate: '2021-06-01', salary: 85000, status: 'active', phone: '+1 (555) 234-5678', address: '456 Oak Ave, Los Angeles, CA 90001' },
		{ id: '3', name: 'Mike Johnson', email: 'mike@company.com', department: 'Sales', position: 'Sales Representative', startDate: '2023-01-10', salary: 65000, status: 'active', phone: '+1 (555) 345-6789', address: '789 Pine Blvd, Chicago, IL 60601' },
		{ id: '4', name: 'Sarah Williams', email: 'sarah@company.com', department: 'HR', position: 'HR Specialist', startDate: '2022-09-20', salary: 70000, status: 'active', phone: '+1 (555) 456-7890', address: '321 Elm St, Houston, TX 77001' },
		{ id: '5', name: 'Tom Brown', email: 'tom@company.com', department: 'Engineering', position: 'Junior Developer', startDate: '2023-07-15', salary: 60000, status: 'inactive', phone: '+1 (555) 567-8901', address: '654 Maple Dr, Phoenix, AZ 85001' }
	]);
	
	let showForm = $state(false);
	let editingEmployee = $state<Employee | null>(null);
	let exportingData = $state(false);
	let searchQuery = $state('');
	let selectedDepartment = $state('all');
	
	let formData = $state({
		name: '',
		email: '',
		department: '',
		position: '',
		startDate: '',
		salary: 50000,
		status: 'active' as 'active' | 'inactive',
		phone: '',
		address: ''
	});
	
	const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
	
	let filteredEmployees = $derived.by(() => {
		let filtered = employees;
		
		if (searchQuery) {
			filtered = filtered.filter(emp => 
				emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				emp.position.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		
		if (selectedDepartment !== 'all') {
			filtered = filtered.filter(emp => emp.department === selectedDepartment);
		}
		
		return filtered;
	});
	
	let stats = $derived.by(() => {
		const active = employees.filter(e => e.status === 'active').length;
		const avgSalary = employees.length > 0 
			? employees.reduce((sum, e) => sum + e.salary, 0) / employees.length
			: 0;
		const deptCount = new Set(employees.map(e => e.department)).size;
		
		return { active, avgSalary, deptCount };
	});
	
	function resetForm() {
		formData = {
			name: '',
			email: '',
			department: '',
			position: '',
			startDate: '',
			salary: 50000,
			status: 'active',
			phone: '',
			address: ''
		};
		editingEmployee = null;
		showForm = false;
	}
	
	function saveEmployee() {
		if (!formData.name || !formData.email || !formData.department || !formData.position || !formData.startDate) {
			alert('Please fill in all required fields');
			return;
		}
		
		if (editingEmployee) {
			employees = employees.map(emp => 
				emp.id === editingEmployee.id 
					? { ...emp, ...formData }
					: emp
			);
		} else {
			const newEmployee: Employee = {
				id: Date.now().toString(),
				...formData
			};
			employees = [...employees, newEmployee];
		}
		
		resetForm();
	}
	
	function editEmployee(employee: Employee) {
		editingEmployee = employee;
		formData = {
			name: employee.name,
			email: employee.email,
			department: employee.department,
			position: employee.position,
			startDate: employee.startDate,
			salary: employee.salary,
			status: employee.status,
			phone: employee.phone || '',
			address: employee.address || ''
		};
		showForm = true;
	}
	
	function deleteEmployee(id: string) {
		if (confirm('Are you sure you want to delete this employee?')) {
			employees = employees.filter(emp => emp.id !== id);
		}
	}
	
	async function exportToExcel() {
		exportingData = true;
		
		// Simulate processing delay for visual feedback
		await new Promise(resolve => setTimeout(resolve, 800));
		
		// Prepare data for Excel
		const excelData = employees.map(emp => ({
			'Employee ID': emp.id,
			'Full Name': emp.name,
			'Email Address': emp.email,
			'Department': emp.department,
			'Position': emp.position,
			'Start Date': new Date(emp.startDate).toLocaleDateString(),
			'Annual Salary': emp.salary,
			'Status': emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
			'Phone Number': emp.phone || 'N/A',
			'Address': emp.address || 'N/A'
		}));
		
		// Create workbook and worksheet
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet(excelData);
		
		// Set column widths
		const colWidths = [
			{ wch: 12 }, // ID
			{ wch: 20 }, // Name
			{ wch: 25 }, // Email
			{ wch: 15 }, // Department
			{ wch: 20 }, // Position
			{ wch: 12 }, // Start Date
			{ wch: 15 }, // Salary
			{ wch: 10 }, // Status
			{ wch: 15 }, // Phone
			{ wch: 30 }  // Address
		];
		ws['!cols'] = colWidths;
		
		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(wb, ws, 'Employee Data');
		
		// Generate Excel file
		const fileName = `employee_data_${new Date().toISOString().split('T')[0]}.xlsx`;
		XLSX.writeFile(wb, fileName);
		
		exportingData = false;
	}
	
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
		<!-- Header -->
		<div class="bg-white shadow-lg rounded-2xl p-6 lg:p-8 mb-8 border border-gray-100">
			<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div>
					<h1 class="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Employee Directory</h1>
					<p class="mt-2 text-gray-600 text-lg">Manage your workforce data efficiently</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-3">
					<button
						onclick={() => showForm = true}
						class="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg font-medium"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
						</svg>
						Add Employee
					</button>
					<button
						onclick={exportToExcel}
						disabled={exportingData || employees.length === 0}
						class="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg font-medium disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none disabled:cursor-not-allowed"
					>
						{#if exportingData}
							<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
							</svg>
							Exporting...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
							</svg>
							Export to Excel
						{/if}
					</button>
				</div>
			</div>
		</div>
		
		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
				<div class="flex items-center">
					<div class="p-3 bg-blue-100 rounded-lg">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Total Employees</p>
						<p class="text-2xl font-bold text-gray-900">{employees.length}</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
				<div class="flex items-center">
					<div class="p-3 bg-green-100 rounded-lg">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Active Staff</p>
						<p class="text-2xl font-bold text-green-600">{stats.active}</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
				<div class="flex items-center">
					<div class="p-3 bg-purple-100 rounded-lg">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Departments</p>
						<p class="text-2xl font-bold text-purple-600">{stats.deptCount}</p>
					</div>
				</div>
			</div>
			
			<div class="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
				<div class="flex items-center">
					<div class="p-3 bg-amber-100 rounded-lg">
						<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Avg. Salary</p>
						<p class="text-2xl font-bold text-amber-600">{formatCurrency(stats.avgSalary)}</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Search and Filters -->
		<div class="bg-white shadow-md rounded-xl p-4 mb-6 border border-gray-100">
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search by name, email, or position..."
							class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
				<select
					bind:value={selectedDepartment}
					class="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
				>
					<option value="all">All Departments</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>
			</div>
		</div>
		
		<!-- Employee Table -->
		<div class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
			<div class="overflow-x-auto">
				<table class="min-w-full">
					<thead>
						<tr class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Salary</th>
							<th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
							<th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each filteredEmployees as employee, i}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
											{employee.name.split(' ').map(n => n[0]).join('')}
										</div>
										<div class="ml-4">
											<div class="text-sm font-semibold text-gray-900">{employee.name}</div>
											<div class="text-sm text-gray-500">ID: {employee.id}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">{employee.email}</div>
									<div class="text-sm text-gray-500">{employee.phone || 'No phone'}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
										{employee.department}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(employee.startDate)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(employee.salary)}</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-3 py-1 text-xs font-semibold rounded-full {employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
										{employee.status}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<div class="flex items-center justify-center gap-2">
										<button
											onclick={() => editEmployee(employee)}
											class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											title="Edit employee"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
											</svg>
										</button>
										<button
											onclick={() => deleteEmployee(employee.id)}
											class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="Delete employee"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="8" class="px-6 py-12 text-center">
									<div class="flex flex-col items-center">
										<svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
										</svg>
										<p class="text-gray-500 text-lg">No employees found</p>
										<p class="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
	
	<!-- Add/Edit Form Modal -->
	{#if showForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity z-50">
			<div class="fixed inset-0 z-50 overflow-y-auto">
				<div class="flex min-h-full items-center justify-center p-4">
					<div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all">
						<div class="px-6 py-5 border-b border-gray-200">
							<h3 class="text-xl font-semibold text-gray-900">
								{editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}
							</h3>
						</div>
						
						<form onsubmit={(e) => { e.preventDefault(); saveEmployee(); }} class="px-6 py-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div class="md:col-span-2">
									<label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
									<input
										type="text"
										bind:value={formData.name}
										required
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="John Doe"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
									<input
										type="email"
										bind:value={formData.email}
										required
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="john@company.com"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
									<input
										type="tel"
										bind:value={formData.phone}
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="+1 (555) 123-4567"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Department *</label>
									<select
										bind:value={formData.department}
										required
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
									>
										<option value="">Select department</option>
										{#each departments as dept}
											<option value={dept}>{dept}</option>
										{/each}
									</select>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Position *</label>
									<input
										type="text"
										bind:value={formData.position}
										required
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="Software Engineer"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
									<input
										type="date"
										bind:value={formData.startDate}
										required
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Annual Salary *</label>
									<input
										type="number"
										bind:value={formData.salary}
										required
										min="0"
										step="1000"
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="75000"
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
									<select
										bind:value={formData.status}
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
									>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
									</select>
								</div>
								
								<div class="md:col-span-2">
									<label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
									<input
										type="text"
										bind:value={formData.address}
										class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="123 Main St, City, State ZIP"
									/>
								</div>
							</div>
							
							<div class="flex justify-end gap-3 mt-8">
								<button
									type="button"
									onclick={resetForm}
									class="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									type="submit"
									class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg"
								>
									{editingEmployee ? 'Update Employee' : 'Add Employee'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
</style>