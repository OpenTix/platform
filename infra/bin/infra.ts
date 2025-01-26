import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { UserwebStack } from '../lib/userweb-stack';
import { VendorwebStack } from '../lib/vendorweb-stack';

const app = new cdk.App();

if (!process.env.DEPLOYENV) {
	throw new Error('DEPLOYENV environment variable is required');
}
if (!process.env.HOSTEDZONENAME) {
	throw new Error('HOSTEDZONENAME environment variable is required');
}

if (process.env.DEPLOYENV === 'feature') {
	if (!process.env.PRNUMBER) {
		throw new Error('PRNUMBER environment variable is required');
	}
}

const PREFIX =
	process.env.DEPLOYENV === 'feature'
		? `pr${process.env.PRNUMBER}`
		: process.env.DEPLOYENV;

new UserwebStack(
	app,
	PREFIX + '-UserwebStack',
	'../dist/apps/userweb',
	process.env.HOSTEDZONENAME,
	{
		/* If you don't specify 'env', this stack will be environment-agnostic.
		 * Account/Region-dependent features and context lookups will not work,
		 * but a single synthesized template can be deployed anywhere. */
		/* Uncomment the next line to specialize this stack for the AWS Account
		 * and Region that are implied by the current CLI configuration. */
		env: {
			account: process.env.CDK_DEFAULT_ACCOUNT,
			region: process.env.CDK_DEFAULT_REGION
		}
		/* Uncomment the next line if you know exactly what Account and Region you
		 * want to deploy the stack to. */
		// env: { account: '123456789012', region: 'us-east-1' },
		/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
	}
);

new VendorwebStack(
	app,
	PREFIX + '-VendorwebStack',
	'../dist/apps/vendorweb',
	process.env.HOSTEDZONENAME,
	{
		env: {
			account: process.env.CDK_DEFAULT_ACCOUNT,
			region: process.env.CDK_DEFAULT_REGION
		}
	}
);

new BackendStack(
	app,
	PREFIX + '-BackendStack',
	'../apps/backend',
	process.env.HOSTEDZONENAME,
	{
		env: {
			account: process.env.CDK_DEFAULT_ACCOUNT,
			region: process.env.CDK_DEFAULT_REGION
		}
	}
);
