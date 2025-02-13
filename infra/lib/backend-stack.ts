import { GoFunction, GoFunctionProps } from '@aws-cdk/aws-lambda-go-alpha';
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

		const vpcId = 'vpc-06542e3e0e22d1530';
		const vpcDefaultSecurityGroupId = 'sg-07535f897144baa31';
		const dbAddress = 'dev-db-1.c09akg0io005.us-east-1.rds.amazonaws.com';
		const dbPort = '5432';
		const dbInternalName = 'openticket';
		const dbSecretArn =
			'arn:aws:secretsmanager:us-east-1:390403894969:secret:rds!db-7b97592e-38be-4add-9eea-f5057439df30-L9XP8Y';
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

		const LambdaDBAccessProps = {
			role: LambdaDBAccessRole,
			vpc: vpc,
			securityGroups: [dbSecurityGroup],
			environment: {
				DB_ADDRESS: dbAddress,
				DB_PORT: dbPort,
				DB_NAME: dbInternalName,
				DB_SECRET_ARN: dbSecretArn,
				MAGIC_SECRET_ARN: magicSecretArn
			}
		};

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
			...LambdaDBAccessProps
		});

		const VendorIDLambda = new GoFunction(this, 'VendorIDLambda', {
			entry: `${basePath}/vendorid.go`,
			...LambdaDBAccessProps
		});

		const OptionsLambda = new GoFunction(this, 'OptionsLambda', {
			entry: `${basePath}/options.go`,
			role: LambdaLogRole
		});

        const EventsLambda = new GoFunction(this, 'EventsLambda', {
			entry: `${basePath}/events.go`,
			...LambdaDBAccessProps
		});

        const VenuesLambda = new GoFunction(this, 'VenuesLambda', {
			entry: `${basePath}/venues.go`,
			...LambdaDBAccessProps
		});

		function addDynamicOptions(resource: cdk.aws_apigateway.Resource) {
			resource.addMethod(
				'OPTIONS',
				new LambdaIntegration(OptionsLambda),
				{
					methodResponses: [
						{
							statusCode: '200',
							responseParameters: {
								'method.response.header.Access-Control-Allow-Origin':
									true,
								'method.response.header.Access-Control-Allow-Methods':
									true,
								'method.response.header.Access-Control-Allow-Headers':
									true,
								'method.response.header.Access-Control-Allow-Credentials':
									true
							}
						}
					]
				}
			);
		}

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
		// Root Paths
		const exampleResource = api.root.addResource('example');
		exampleResource.addMethod('GET', new LambdaIntegration(ExampleLambda), {
			authorizer: auth
		});
		addDynamicOptions(exampleResource);

		const testDbResource = api.root.addResource('testdbconnection');
		testDbResource.addMethod('GET', new LambdaIntegration(DBTestLambda), {
			authorizer: auth
		});
		addDynamicOptions(testDbResource);

		const vendorResource = api.root.addResource('vendor');
		const vendorIdResource = vendorResource.addResource('id');
		vendorIdResource.addMethod(
			'ANY',
			new LambdaIntegration(VendorIDLambda),
			{
				authorizer: auth
			}
		);
		addDynamicOptions(vendorIdResource);

        const eventsResource = api.root.addResource('events');
        eventsResource.addMethod('GET', new LambdaIntegration(EventsLambda), {
            authorizer: auth
        });
        addDynamicOptions(eventsResource);

        const venuesResource = api.root.addResource('events');
        venuesResource.addMethod('GET', new LambdaIntegration(VenuesLambda), {
            authorizer: auth
        });
        addDynamicOptions(venuesResource);

		new cdk.CfnOutput(this, 'ApiUrl', {
			value: api.url
		});
	}
}
