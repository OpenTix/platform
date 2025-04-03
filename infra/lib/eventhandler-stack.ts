import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
	Effect,
	ManagedPolicy,
	PolicyStatement,
	Role,
	ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import {
	vpcId,
	vpcDefaultSecurityGroupId,
	dbAddress,
	dbPort,
	dbInternalName,
	dbSecretArn,
	photoBucket,
	photoUploadTopicArn,
	ticketsMintedTopicArn
} from './Constants';

export class EventHandlerStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		basePath: string,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

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

		// Ticket Creation

		const TicketCreationEventLambdaRole = new Role(
			this,
			'TicketCreationEventLambdaRole',
			{
				assumedBy: new ServicePrincipal('lambda.amazonaws.com')
			}
		);
		TicketCreationEventLambdaRole.addToPolicy(
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
		TicketCreationEventLambdaRole.addManagedPolicy(
			ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaVPCAccessExecutionRole'
			)
		);

		const ticketCreationTopic = sns.Topic.fromTopicArn(
			this,
			'TicketCreationTopic',
			ticketsMintedTopicArn
		);
		const ticketCreationQueue = new cdk.aws_sqs.Queue(
			this,
			'TicketCreationQueue',
			{
				visibilityTimeout: cdk.Duration.seconds(300)
			}
		);
		//subscribe queue to topic
		ticketCreationTopic.addSubscription(
			new snsSubscriptions.SqsSubscription(ticketCreationQueue)
		);

		const TicketCreationEventLambda = new GoFunction(
			this,
			'TicketCreationEventLambda',
			{
				entry: `${basePath}/TicketCreationEvent.go`,
				role: TicketCreationEventLambdaRole,
				vpc: vpc,
				securityGroups: [dbSecurityGroup],
				environment: {
					DB_ADDRESS: dbAddress,
					DB_PORT: dbPort,
					DB_NAME: dbInternalName,
					DB_SECRET_ARN: dbSecretArn
				}
			}
		);

		//grant lambda permissions to read from queue
		ticketCreationQueue.grantConsumeMessages(TicketCreationEventLambda);

		//create event source mapping
		TicketCreationEventLambda.addEventSource(
			new cdk.aws_lambda_event_sources.SqsEventSource(ticketCreationQueue)
		);
	}
}
