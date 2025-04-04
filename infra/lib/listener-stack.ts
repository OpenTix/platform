import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';
import { ticketsMintedTopicArn, vpcId } from './Constants';

export class ListenerStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
			vpcId: vpcId
		});

		const ticketsMintedTopic = sns.Topic.fromTopicArn(
			this,
			'TicketsMintedTopic',
			ticketsMintedTopicArn
		);

		// Create an ECS Cluster in the VPC
		const cluster = new ecs.Cluster(this, 'ListenerCluster', { vpc });

		cluster.addCapacity('DefaultAutoScalingGroup', {
			instanceType: new ec2.InstanceType('t4g.nano'),
			desiredCapacity: 1
		});

		// Build the Docker image asset.
		// Adjust the directory if your Dockerfile is located elsewhere.
		const dockerImageAsset = new ecr_assets.DockerImageAsset(
			this,
			'ListenerImage',
			{
				directory: path.join(__dirname, '../../apps/listener')
			}
		);

		const logGroup = new logs.LogGroup(this, 'ListenerLogGroup', {
			retention: logs.RetentionDays.ONE_WEEK
		});

		// Define an ECS task definition using the EC2 launch type
		const taskDefinition = new ecs.Ec2TaskDefinition(
			this,
			'ListenerTaskDef'
		);

		taskDefinition.addContainer('ListenerContainer', {
			image: ecs.ContainerImage.fromDockerImageAsset(dockerImageAsset),
			memoryLimitMiB: 256,
			environment: {
				TICKET_CREATION_TOPIC_ARN: ticketsMintedTopic.topicArn
			},
			logging: new ecs.AwsLogDriver({
				logGroup,
				streamPrefix: 'listener'
			})
		});

		ticketsMintedTopic.grantPublish(taskDefinition.taskRole);

		// Create an ECS service running a single instance of the container
		new ecs.Ec2Service(this, 'ListenerService', {
			cluster,
			taskDefinition,
			desiredCount: 1
		});
	}
}
