"""S3 + CloudFront + Lambda による音楽サイトインフラ"""

import os
from pathlib import Path

from dotenv import load_dotenv
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Fn,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_lambda as _lambda,
    aws_iam as iam,
)
from constructs import Construct

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


class MusicSiteStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # S3 バケット（SPA + 音楽ファイル + アートワーク）
        bucket = s3.Bucket(
            self,
            "MusicSiteBucket",
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        # Lambda: パスワード認証
        auth_function = _lambda.Function(
            self,
            "AuthFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="auth.handler",
            code=_lambda.Code.from_asset("../functions"),
            timeout=Duration.seconds(10),
            memory_size=128,
            environment={
                "SITE_PASSWORD": os.environ["site-password"],
                "HMAC_SECRET": os.environ["hmac-secret"],
            },
        )

        # Lambda Function URL（認証APIエンドポイント）
        auth_url = auth_function.add_function_url(
            auth_type=_lambda.FunctionUrlAuthType.NONE,
            cors=_lambda.FunctionUrlCorsOptions(
                allowed_origins=["*"],
                allowed_methods=[_lambda.HttpMethod.POST],
                allowed_headers=["Content-Type"],
            ),
        )

        # CloudFront Function: /music/* 専用の認証チェック
        cf_function = cloudfront.Function(
            self,
            "AuthCheckFunction",
            code=cloudfront.FunctionCode.from_file(
                file_path="../functions/cf-auth-check.js"
            ),
            runtime=cloudfront.FunctionRuntime.JS_2_0,
        )

        # CloudFront ディストリビューション
        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            additional_behaviors={
                "/api/login": cloudfront.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        # Lambda Function URL (https://xxx.on.aws/) からドメイン部分を抽出
                        domain_name=Fn.select(2, Fn.split("/", auth_url.url)),
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                ),
                "/music/*": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    function_associations=[
                        cloudfront.FunctionAssociation(
                            function=cf_function,
                            event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                        )
                    ],
                ),
            },
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_200,
        )

        # 出力
        CfnOutput(self, "BucketName", value=bucket.bucket_name)
        CfnOutput(self, "DistributionId", value=distribution.distribution_id)
        CfnOutput(
            self,
            "SiteUrl",
            value=f"https://{distribution.distribution_domain_name}",
        )
        CfnOutput(self, "AuthFunctionUrl", value=auth_url.url)
