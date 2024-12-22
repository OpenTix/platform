import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentService } from './deployment-service';

export class UserwebStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		buildPath: string,
		hostedZoneName: string,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		//const domainName = 'client.' + hostedZoneName;
		const domainName =
			process.env.DEPLOYENV === 'feature'
				? `client.pr${process.env.PRNUMBER}.${hostedZoneName}`
				: `client.${hostedZoneName}`;

		new DeploymentService(this, id + 'UserwebDeployment', {
			buildPath,
			domainName,
			hostedZoneName,
		});
	}
}
