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
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
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
		const jwksURL =
			'https://app.dynamic.xyz/api/v0/sdk/e332e4a7-4ed1-41ed-8ae9-7d7c462bf453/.well-known/jwks';
		const photoBucket = 'dev-openticket-images';
		const photoUploadTopicArn =
			'arn:aws:sns:us-east-1:390403894969:S3ImageUploaded';

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

		// Roles
		const LambdaLogRole = new Role(this, 'LambdaLogRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com')
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

		const LambdaDBAccessRole = new Role(this, 'LambdaDBAccessRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com')
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
		LambdaDBAccessRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaVPCAccessExecutionRole'
			)
		);

		const PhotoBucketRole = new Role(this, 'PhotoBucketRole', {
			assumedBy: new ServicePrincipal('lambda.amazonaws.com')
		});
		PhotoBucketRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					's3:PutObject',
					's3:GetObject',
					's3:DeleteObject',
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents'
				],
				resources: [`arn:aws:s3:::${photoBucket}/*`]
			})
		);
		dbSecret.grantRead(PhotoBucketRole);
		PhotoBucketRole.addManagedPolicy(
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
				DB_SECRET_ARN: dbSecretArn
			}
		};

		// Lambdas
		const auth = new TokenAuthorizer(this, 'Auth', {
			handler: new GoFunction(this, 'AuthLambda', {
				entry: `${basePath}/auth.go`,
				role: LambdaLogRole,
				environment: {
					JWKS_URL: jwksURL
				}
			})
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

		const UserEventsLambda = new GoFunction(this, 'UserEventsLambda', {
			entry: `${basePath}/user_events.go`,
			...LambdaDBAccessProps
		});

		const VendorVenuesLambda = new GoFunction(this, 'VendorVenuesLambda', {
			entry: `${basePath}/vendor_venues.go`,
			...LambdaDBAccessProps
		});

		const VendorEventsLambda = new GoFunction(this, 'VendorEventsLambda', {
			entry: `${basePath}/vendor_events.go`,
			...LambdaDBAccessProps
		});

		const VendorPhotosLambda = new GoFunction(this, 'VendorPhotosLambda', {
			entry: `${basePath}/vendor_photos.go`,
			role: PhotoBucketRole,
			vpc: vpc,
			securityGroups: [dbSecurityGroup],
			environment: {
				DB_ADDRESS: dbAddress,
				DB_PORT: dbPort,
				DB_NAME: dbInternalName,
				DB_SECRET_ARN: dbSecretArn,
				PHOTO_BUCKET: photoBucket
			}
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

		const vendorVenuesResource = vendorResource.addResource('venues');
		vendorVenuesResource.addMethod(
			'GET',
			new LambdaIntegration(VendorVenuesLambda),
			{
				authorizer: auth
			}
		);
		vendorVenuesResource.addMethod(
			'POST',
			new LambdaIntegration(VendorVenuesLambda),
			{
				authorizer: auth
			}
		);
		vendorVenuesResource.addMethod(
			'PATCH',
			new LambdaIntegration(VendorVenuesLambda),
			{
				authorizer: auth
			}
		);
		addDynamicOptions(vendorVenuesResource);

		const vendorVenuesPhotosResource =
			vendorVenuesResource.addResource('photos');
		vendorVenuesPhotosResource.addMethod(
			'GET',
			new LambdaIntegration(VendorPhotosLambda),
			{
				authorizer: auth
			}
		);
		vendorVenuesPhotosResource.addMethod(
			'POST',
			new LambdaIntegration(VendorPhotosLambda),
			{
				authorizer: auth
			}
		);
		vendorVenuesPhotosResource.addMethod(
			'DELETE',
			new LambdaIntegration(VendorPhotosLambda),
			{
				authorizer: auth
			}
		);
		addDynamicOptions(vendorVenuesPhotosResource);

		const vendorEventsResource = vendorResource.addResource('events');
		vendorEventsResource.addMethod(
			'GET',
			new LambdaIntegration(VendorEventsLambda),
			{
				authorizer: auth
			}
		);
		vendorEventsResource.addMethod(
			'POST',
			new LambdaIntegration(VendorEventsLambda),
			{
				authorizer: auth
			}
		);
		vendorEventsResource.addMethod(
			'PATCH',
			new LambdaIntegration(VendorEventsLambda),
			{
				authorizer: auth
			}
		);
		addDynamicOptions(vendorEventsResource);

		const vendorEventsPhotosResource =
			vendorEventsResource.addResource('photos');
		vendorEventsPhotosResource.addMethod(
			'POST',
			new LambdaIntegration(VendorPhotosLambda),
			{
				authorizer: auth
			}
		);
		vendorEventsPhotosResource.addMethod(
			'DELETE',
			new LambdaIntegration(VendorPhotosLambda),
			{
				authorizer: auth
			}
		);
		addDynamicOptions(vendorEventsPhotosResource);

		const userResource = api.root.addResource('user');
		const userEventsResource = userResource.addResource('events');
		userEventsResource.addMethod(
			'GET',
			new LambdaIntegration(UserEventsLambda)
		);
		addDynamicOptions(userEventsResource);

		new cdk.CfnOutput(this, 'ApiUrl', {
			value: api.url
		});

		// React to photo upload event
		const photoUploadTopic = sns.Topic.fromTopicArn(
			this,
			'PhotoUploadTopic',
			photoUploadTopicArn
		);
		//create sqs queue for topic
		const photoUploadQueue = new cdk.aws_sqs.Queue(
			this,
			'PhotoUploadQueue',
			{
				visibilityTimeout: cdk.Duration.seconds(300)
			}
		);

		//subscribe queue to topic
		photoUploadTopic.addSubscription(
			new snsSubscriptions.SqsSubscription(photoUploadQueue)
		);

		//create lambda to process photo upload event
		const PhotoUploadEventLambda = new GoFunction(
			this,
			'PhotoUploadEventLambda',
			{
				entry: `${basePath}/PhotoUploadEvent.go`,
				role: PhotoBucketRole,
				vpc: vpc,
				securityGroups: [dbSecurityGroup],
				environment: {
					DB_ADDRESS: dbAddress,
					DB_PORT: dbPort,
					DB_NAME: dbInternalName,
					DB_SECRET_ARN: dbSecretArn,
					PHOTO_BUCKET: photoBucket
				}
			}
		);

		//grant lambda permissions to read from queue
		photoUploadQueue.grantConsumeMessages(PhotoUploadEventLambda);

		//create event source mapping
		PhotoUploadEventLambda.addEventSource(
			new cdk.aws_lambda_event_sources.SqsEventSource(photoUploadQueue)
		);
	}
}
