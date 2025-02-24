import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
	setupFiles: ['<rootDir>/jest.env.ts', 'dotenv/config'],
	projects: await getJestProjectsAsync()
});
