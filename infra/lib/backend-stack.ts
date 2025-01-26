import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import {
	Certificate,
	CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		basePath: string,
		hostedZoneName: string,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		// Defining this way will bundle automatically during deployment.
		// This requires docker.

		const domainName =
			process.env.DEPLOYENV === 'feature'
				? `api.pr${process.env.PRNUMBER}.${hostedZoneName}`
				: `api.${hostedZoneName}`;

		const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
			domainName: hostedZoneName
		});

		const certificate = new Certificate(this, 'APICertificate', {
			domainName: domainName,
			validation: CertificateValidation.fromDns(hostedZone)
		});

		const pingLambda = new GoFunction(this, 'PingLambda', {
			entry: `${basePath}/ping.go`
		});

		const api = new RestApi(this, 'ApiGateway', {
			domainName: {
				domainName: domainName,
				certificate: certificate
			}
		});

		// /ping
		api.root
			.addResource('ping')
			.addMethod('GET', new LambdaIntegration(pingLambda));

		new cdk.CfnOutput(this, 'ApiUrl', {
			value: api.url
		});
	}
}
