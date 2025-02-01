import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import {
	LambdaIntegration,
	RestApi,
	TokenAuthorizer
} from 'aws-cdk-lib/aws-apigateway';
import {
	Certificate,
	CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
	Effect,
	ManagedPolicy,
	PolicyStatement,
	Role,
	ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway as ApiGatewayTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
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

		const vpcId = 'vpc-0075f358f807d9b26';
		const vpcDefaultSecurityGroupId = 'sg-074849cb87c224944';
		const dbAddress = 'dev-db-1.c09akg0io005.us-east-1.rds.amazonaws.com';
		const dbPort = '5432';
		const dbInternalName = 'openticket';
		const dbSecretArn =
			'arn:aws:secretsmanager:us-east-1:390403894969:secret:rds!db-bba3fcd8-f30e-437e-a060-e76805adc70e-qY2qQN';
		const magicSecretArn =
			'arn:aws:secretsmanager:us-east-1:390403894969:secret:MagicAuth/SecretKey-idvwer';

		// DB
		const vpc = Vpc.fromLookup(this, 'VPC', {
			vpcId: vpcId
		});

		const dbSecurityGroup = SecurityGroup.fromSecurityGroupId(
			this,
			'DBSecurityGroup',
			vpcDefaultSecurityGroupId
		);

		// Secrets
		const dbSecret = Secret.fromSecretCompleteArn(
			this,
			'DBSecret',
			dbSecretArn
		);
		const MagicPrivateSecret = Secret.fromSecretCompleteArn(
			this,
			'MagicPrivateSecret',
			magicSecretArn
		);

		// Roles
		const LambdaLogRole = new Role(this, 'LambdaLogRole', {
			assumedBy: new ServicePrincipal('lambda.us-east-1.amazonaws.com')
		});
		LambdaLogRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents'
				],
				resources: ['*']
			})
		);
		MagicPrivateSecret.grantRead(LambdaLogRole);

		const LambdaDBAccessRole = new Role(this, 'LambdaDBAccessRole', {
			assumedBy: new ServicePrincipal('lambda.us-east-1.amazonaws.com')
		});
		LambdaDBAccessRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents'
				],
				resources: ['*']
			})
		);

		dbSecret.grantRead(LambdaDBAccessRole);
		MagicPrivateSecret.grantRead(LambdaDBAccessRole);
		LambdaDBAccessRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaVPCAccessExecutionRole'
			)
		);

		const auth = new TokenAuthorizer(this, 'Auth', {
			handler: new GoFunction(this, 'AuthLambda', {
				entry: `${basePath}/auth.go`,
				role: LambdaLogRole,
				environment: {
					MAGIC_SECRET_ARN: magicSecretArn
				}
			})
		});

		// Lambdas
		const ExampleLambda = new GoFunction(this, 'ExampleLambda', {
			entry: `${basePath}/example.go`,
			role: LambdaLogRole,
			environment: {
				MAGIC_SECRET_ARN: magicSecretArn
			}
		});

		const DBTestLambda = new GoFunction(this, 'DBTestLambda', {
			entry: `${basePath}/dbtest.go`,
			role: LambdaDBAccessRole,
			vpc: vpc,
			securityGroups: [dbSecurityGroup],
			allowPublicSubnet: true,
			environment: {
				DB_ADDRESS: dbAddress,
				DB_PORT: dbPort,
				DB_NAME: dbInternalName,
				DB_SECRET_ARN: dbSecretArn
			}
		});

		// API Gateway
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

		const api = new RestApi(this, id + 'Api', {
			domainName: {
				domainName: domainName,
				certificate: certificate
			}
		});

		new ARecord(this, 'AliasRecord', {
			zone: hostedZone,
			recordName: domainName,
			target: RecordTarget.fromAlias(new ApiGatewayTarget(api))
		});

		// Add Paths to API Gateway
		api.root
			.addResource('example')
			.addMethod('GET', new LambdaIntegration(ExampleLambda), {
				authorizer: auth
			});
		api.root
			.addResource('dbtest')
			.addMethod('GET', new LambdaIntegration(DBTestLambda), {
				authorizer: auth
			});

		new cdk.CfnOutput(this, 'ApiUrl', {
			value: api.url
		});
	}
}
