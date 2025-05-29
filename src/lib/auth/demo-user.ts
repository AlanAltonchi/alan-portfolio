import type { DemoUserData } from './types.js';

const DEMO_NAMES = [
	'Alex Johnson',
	'Sarah Chen',
	'Michael Rodriguez',
	'Emma Thompson',
	'David Kim',
	'Jessica Martinez',
	"Ryan O'Connor",
	'Priya Patel',
	'Marcus Williams',
	'Zoe Anderson',
	'Lucas Brown',
	'Maya Singh',
	'Ethan Davis',
	'Sophia Lee',
	'Noah Wilson'
];

const DEMO_COMPANIES = [
	'TechCorp',
	'InnovateLabs',
	'DataDyne',
	'CloudFirst',
	'NextGen Solutions',
	'DigitalEdge',
	'FutureWorks',
	'SmartSystems',
	'AgileFlow',
	'CodeCraft'
];

const DEMO_ROLES = [
	'Software Engineer',
	'Product Manager',
	'UX Designer',
	'Data Scientist',
	'DevOps Engineer',
	'Frontend Developer',
	'Backend Developer',
	'Full Stack Developer',
	'Technical Lead',
	'Engineering Manager'
];

function getRandomItem<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function generateDemoEmail(name: string): string {
	const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
	const timestamp = Date.now();
	return `demo_${cleanName}_${timestamp}@portfoliodemo.com`;
}

export function generateDemoUser(): DemoUserData {
	const name = getRandomItem(DEMO_NAMES);
	const company = getRandomItem(DEMO_COMPANIES);
	const role = getRandomItem(DEMO_ROLES);

	return {
		email: generateDemoEmail(name),
		password: 'Demo123456',
		name,
		company,
		role
	};
}
