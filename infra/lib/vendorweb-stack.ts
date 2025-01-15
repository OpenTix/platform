import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

export class VendorwebStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		buildPath: string,
		hostedZoneName: string,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		const domainName =
			process.env.DEPLOYENV === 'feature'
				? `vendor.pr${process.env.PRNUMBER}.${hostedZoneName}`
				: `vendor.${hostedZoneName}`;

		new DeploymentService(this, id + 'VendorwebDeployment', {
			buildPath,
			domainName,
			hostedZoneName
		});
	}
}
