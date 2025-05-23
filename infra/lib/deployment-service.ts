import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import {
	Certificate,
	CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface DeploymentServiceProps {
	buildPath: string;
	domainName: string;
	hostedZoneName: string;
}

export class DeploymentService extends Construct {
	constructor(scope: Construct, id: string, props: DeploymentServiceProps) {
		super(scope, id);

		const { buildPath, domainName, hostedZoneName } = props;

		const hostingBucket = new Bucket(this, 'FrontendBucket', {
			autoDeleteObjects: true,
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			removalPolicy: RemovalPolicy.DESTROY
		});

		const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
			domainName: hostedZoneName
		});

		const certificate = new Certificate(this, 'SiteCertificate', {
			domainName: domainName,
			validation: CertificateValidation.fromDns(hostedZone)
		});

		const distribution = new Distribution(this, 'CloudfrontDistribution', {
			defaultBehavior: {
				origin: S3BucketOrigin.withOriginAccessControl(hostingBucket),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
			},
			defaultRootObject: 'index.html',
			errorResponses: [
				{
					httpStatus: 404,
					responseHttpStatus: 200,
					responsePagePath: '/index.html'
				},
				{
					httpStatus: 403,
					responseHttpStatus: 200,
					responsePagePath: '/index.html'
				}
			],
			domainNames: [domainName],
			certificate: certificate
		});

		new ARecord(this, 'AliasRecord', {
			zone: hostedZone,
			recordName: domainName,
			target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
		});

		new BucketDeployment(this, 'BucketDeployment', {
			sources: [Source.asset(buildPath)],
			destinationBucket: hostingBucket,
			distribution,
			distributionPaths: ['/*']
		});

		new CfnOutput(this, 'CloudFrontURL', {
			value: distribution.domainName,
			description: 'The distribution URL',
			exportName: id + 'CloudfrontURL'
		});

		new CfnOutput(this, 'BucketName', {
			value: hostingBucket.bucketName,
			description: 'The name of the S3 bucket',
			exportName: id + 'BucketName'
		});
		new CfnOutput(this, 'WebsiteURL', {
			value: `https://${domainName}`,
			description: 'The custom domain URL',
			exportName: id + 'WebsiteURL'
		});
	}
}
