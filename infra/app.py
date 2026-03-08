#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.music_site_stack import MusicSiteStack

app = cdk.App()
MusicSiteStack(app, "MusicSiteStack", env=cdk.Environment(region="ap-northeast-1"))
app.synth()
