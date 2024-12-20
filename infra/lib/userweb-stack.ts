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

		const domainName = 'client.' + hostedZoneName;

		new DeploymentService(this, 'UserwebDeployment', {
			buildPath,
			domainName,
			hostedZoneName,
		});
	}
}
